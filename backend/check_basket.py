
import os
import httpx
import asyncio
import json
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
HOST = "sportscore1.p.rapidapi.com"

async def check_basket_odds():
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": HOST
    }
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    url = f"https://{HOST}/events/date/{today}"
    
    async with httpx.AsyncClient() as client:
        print(f"Buscando Baloncesto para {today}...")
        resp = await client.get(url, headers=headers, params={"sport_id": 2})
        events = resp.json().get("data", [])
        
        if events:
            for e in events[:3]:
                print(f"Evento: {e.get('name')}")
                print(f"Main Odds: {json.dumps(e.get('main_odds'), indent=2)}")
        else:
            print("No se encontraron eventos de Baloncesto.")

if __name__ == "__main__":
    asyncio.run(check_basket_odds())
