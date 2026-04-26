
import os
import httpx
import asyncio
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
HOST = "sportscore1.p.rapidapi.com"

async def check_sports_ids():
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": HOST
    }
    
    url = f"https://{HOST}/sports"
    
    async with httpx.AsyncClient() as client:
        print("Consultando IDs de deportes en SportScore...")
        resp = await client.get(url, headers=headers)
        if resp.status_code == 200:
            sports = resp.json().get("data", [])
            for s in sports:
                print(f"ID: {s.get('id')} -> {s.get('name')}")
        else:
            print(f"Error {resp.status_code}: {resp.text}")

if __name__ == "__main__":
    asyncio.run(check_sports_ids())
