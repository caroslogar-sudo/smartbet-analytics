
import os
import httpx
import json
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
HOST = "sportscore1.p.rapidapi.com"

async def test_sportscore():
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": HOST
    }
    
    # 1. Buscar eventos de fútbol (ID 1) para hoy
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    url = f"https://{HOST}/events/date/{today}"
    
    async with httpx.AsyncClient() as client:
        print(f"Buscando eventos para {today}...")
        resp = await client.get(url, headers=headers, params={"sport_id": 1})
        if resp.status_code != 200:
            print(f"Error {resp.status_code}: {resp.text}")
            return
            
        data = resp.json()
        events = data.get("data", [])
        print(f"Encontrados {len(events)} eventos.")
        
        if events:
            # Ver el primer evento
            event = events[0]
            event_id = event["id"]
            print(f"Evento: {event['home_team']['name']} vs {event['away_team']['name']} (ID: {event_id})")
            
            # 2. Buscar cuotas para este evento
            odds_url = f"https://{HOST}/odds/events/{event_id}"
            odds_resp = await client.get(odds_url, headers=headers)
            if odds_resp.status_code == 200:
                odds_data = odds_resp.json()
                print("Cuotas encontradas:")
                print(json.dumps(odds_data.get("data", [])[:2], indent=2))
            else:
                print(f"No se pudieron obtener cuotas: {odds_resp.status_code}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_sportscore())
