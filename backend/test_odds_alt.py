
import os
import httpx
import asyncio
import json
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
HOST = "sportscore1.p.rapidapi.com"

async def test_odds_endpoint():
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": HOST
    }
    
    # Sao Paulo vs Mirassol
    eid = "3827705"
    # Probando el endpoint de ODDS especifico si existe
    url = f"https://{HOST}/odds/events/{eid}"
    
    async with httpx.AsyncClient() as client:
        print(f"Probando endpoint de ODDS para {eid}...")
        resp = await client.get(url, headers=headers)
        if resp.status_code == 200:
            data = resp.json().get("data", [])
            print(f"Encontrados {len(data)} bloques de cuotas.")
            print(json.dumps(data[:1], indent=2))
        else:
            print(f"Error {resp.status_code}: {resp.text}")

if __name__ == "__main__":
    asyncio.run(test_odds_endpoint())
