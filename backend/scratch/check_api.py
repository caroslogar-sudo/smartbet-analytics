import httpx
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("THE_ODDS_API_KEY")

async def check():
    print(f"Usando API Key: {api_key[:5]}...{api_key[-5:] if api_key else ''}")
    url = "https://api.the-odds-api.com/v4/sports/soccer_spain_la_liga/odds/"
    params = {
        "apiKey": api_key,
        "regions": "eu",
        "markets": "h2h",
    }
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, params=params)
            print(f"Status Code: {resp.status_code}")
            print(f"Headers: {resp.headers.get('x-requests-remaining')} remaining")
            if resp.status_code != 200:
                print(f"Error: {resp.text}")
            else:
                data = resp.json()
                print(f"Eventos recibidos: {len(data)}")
        except Exception as e:
            print(f"Excepción: {e}")

if __name__ == "__main__":
    asyncio.run(check())
