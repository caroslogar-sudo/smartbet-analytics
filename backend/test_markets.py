
import os
import httpx
import asyncio
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
HOST = "sportscore1.p.rapidapi.com"

async def test_markets():
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": HOST
    }
    
    # Probamos con un ID de evento real (sacado del test anterior o uno genérico si falla)
    event_id = "3673217" # Del test anterior
    url = f"https://{HOST}/events/{event_id}/markets"
    
    async with httpx.AsyncClient() as client:
        print(f"Buscando mercados para evento {event_id}...")
        resp = await client.get(url, headers=headers)
        if resp.status_code != 200:
            print(f"Error {resp.status_code}: {resp.text}")
            # Intentar buscar eventos de nuevo para obtener un ID fresco
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            list_url = f"https://{HOST}/events/date/{today}"
            list_resp = await client.get(list_url, headers=headers, params={"sport_id": 1})
            events = list_resp.json().get("data", [])
            if events:
                event_id = events[0]["id"]
                print(f"Reintentando con evento fresco ID: {event_id}")
                url = f"https://{HOST}/events/{event_id}/markets"
                resp = await client.get(url, headers=headers)
            
        if resp.status_code == 200:
            data = resp.json().get("data", [])
            print(f"Encontrados {len(data)} mercados.")
            for market in data[:3]:
                print(f"Mercado: {market.get('name')}")
                # Ver cuotas
                print(f"  Opciones: {[o.get('name') + ': ' + str(o.get('value')) for o in market.get('odds', [])]}")
        else:
            print(f"Fallo total en mercados: {resp.status_code}")

if __name__ == "__main__":
    asyncio.run(test_markets())
