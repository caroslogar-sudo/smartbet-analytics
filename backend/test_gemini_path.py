
import os
import httpx
import asyncio
import json
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
HOST = "sportscore1.p.rapidapi.com"

async def test_odds_all():
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": HOST
    }
    
    # Sao Paulo vs Mirassol
    eid = "3827705"
    # Probando la ruta maestra de Gemini
    url = f"https://{HOST}/events/{eid}/odds/all"
    
    async with httpx.AsyncClient() as client:
        print(f"Probando endpoint Maestro de Gemini: {url}...")
        resp = await client.get(url, headers=headers)
        if resp.status_code == 200:
            data = resp.json().get("data", [])
            print(f"¡ÉXITO! Encontrados {len(data)} bloques de cuotas.")
            # Mostramos un mercado para ver la estructura (value, marketName, etc)
            for mkt in data[:2]:
                print(json.dumps(mkt, indent=2))
        else:
            print(f"Error {resp.status_code}: {resp.text}")

if __name__ == "__main__":
    asyncio.run(test_odds_all())
