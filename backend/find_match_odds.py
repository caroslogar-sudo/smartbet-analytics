
import os
import httpx
import asyncio
import json
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
HOST = "sportscore1.p.rapidapi.com"

async def find_sp_in_list():
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": HOST
    }
    
    today = "2026-04-26" # La fecha del Sao Paulo
    url = f"https://{HOST}/events/date/{today}"
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers, params={"sport_id": 1})
        events = resp.json().get("data", [])
        
        found = False
        for e in events:
            if "Sao Paulo" in e.get("name", ""):
                print(f"Encontrado: {e.get('name')}")
                print(f"Main Odds: {json.dumps(e.get('main_odds'), indent=2)}")
                found = True
                break
        
        if not found:
            print("No se encontro el partido en el listado.")

if __name__ == "__main__":
    asyncio.run(find_sp_in_list())
