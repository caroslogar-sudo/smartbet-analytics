
import os
import httpx
import asyncio
import json
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
HOST = "sportscore1.p.rapidapi.com"

async def check_list_odds():
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": HOST
    }
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    url = f"https://{HOST}/events/date/{today}"
    
    async with httpx.AsyncClient() as client:
        print(f"Verificando si el listado de {today} ya trae 'main_odds'...")
        resp = await client.get(url, headers=headers, params={"sport_id": 1})
        events = resp.json().get("data", [])
        
        if events:
            first_event = events[0]
            print(f"Evento: {first_event.get('name')}")
            if "main_odds" in first_event:
                print("¡SI! El listado ya incluye 'main_odds'.")
                print(json.dumps(first_event["main_odds"], indent=2))
            else:
                print("No, el listado NO incluye 'main_odds'.")
        else:
            print("No se encontraron eventos.")

if __name__ == "__main__":
    asyncio.run(check_list_odds())
