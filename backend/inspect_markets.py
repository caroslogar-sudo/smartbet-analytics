
import os
import httpx
import asyncio
import json
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
HOST = "sportscore1.p.rapidapi.com"

async def inspect_markets():
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": HOST
    }
    
    # ID del Sao Paulo vs Mirassol que sabemos que tiene mercados
    eid = "3827705"
    url = f"https://{HOST}/events/{eid}/markets"
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers)
        markets = resp.json().get("data", [])
        
        print(f"Mercados para ID {eid}:")
        for m in markets:
            name = m.get("name")
            print(f"- {name}")
            # Ver un ejemplo de 'Total' para ver cómo vienen los goles
            if "Total" in name or "Corners" in name or "Cards" in name:
                odds = [f"{o.get('name')}: {o.get('value')}" for o in m.get('odds', [])]
                print(f"  Ejemplo: {odds[:4]}")

if __name__ == "__main__":
    asyncio.run(inspect_markets())
