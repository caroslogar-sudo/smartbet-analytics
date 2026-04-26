
import os
import httpx
import asyncio
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
HOST = "sportscore1.p.rapidapi.com"

async def test_odds_path():
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": HOST
    }
    
    # Sao Paulo vs Mirassol
    eid = "3827705"
    paths = [
        f"/events/{eid}/odds",
        f"/odds/event/{eid}",
        f"/event/{eid}/odds"
    ]
    
    async with httpx.AsyncClient() as client:
        for path in paths:
            url = f"https://{HOST}{path}"
            print(f"Probando {url}...")
            resp = await client.get(url, headers=headers)
            print(f"  Resultado: {resp.status_code}")
            if resp.status_code == 200:
                print(f"  ¡EXITO! Datos: {resp.text[:200]}...")

if __name__ == "__main__":
    asyncio.run(test_odds_path())
