import httpx
import asyncio
import os
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv()

async def debug_sportscore():
    key = os.getenv("RAPIDAPI_KEY")
    if not key:
        print("No RAPIDAPI_KEY found")
        return
        
    host = "sportscore1.p.rapidapi.com"
    headers = {
        "x-rapidapi-key": key,
        "x-rapidapi-host": host
    }
    
    async with httpx.AsyncClient() as client:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        print(f"Buscando eventos para hoy: {today}")
        
        # Fútbol (1)
        url = f"https://{host}/events/date/{today}"
        resp = await client.get(url, headers=headers, params={"sport_id": 1}, timeout=15.0)
        
        if resp.status_code == 200:
            data = resp.json().get("data", [])
            print(f"Fútbol: {len(data)} eventos totales.")
            leagues = {}
            for event in data:
                l = event.get("league", {})
                lname = l.get("name", "Unknown")
                country = l.get("category", {}).get("name", "Unknown")
                key_l = f"{lname} ({country})"
                leagues[key_l] = leagues.get(key_l, 0) + 1
            
            print("Ligas encontradas en Fútbol:")
            for l, count in sorted(leagues.items(), key=lambda x: x[1], reverse=True):
                print(f" - {l}: {count}")
        else:
            print(f"Error Fútbol: {resp.status_code}")

if __name__ == "__main__":
    asyncio.run(debug_sportscore())
