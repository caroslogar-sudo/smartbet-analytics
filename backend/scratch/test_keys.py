import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def test_odds_api():
    keys = os.getenv("THE_ODDS_API_KEY", "").split(",")
    for key in keys:
        key = key.strip()
        if not key: continue
        print(f"Probando clave: {key[:5]}...")
        url = f"https://api.the-odds-api.com/v4/sports/soccer_epl/odds/?apiKey={key}&regions=eu&markets=h2h"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url)
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                print(f"¡Éxito! {len(resp.json())} eventos encontrados.")
                # print(resp.json())
            else:
                print(f"Error: {resp.text}")

if __name__ == "__main__":
    asyncio.run(test_odds_api())
