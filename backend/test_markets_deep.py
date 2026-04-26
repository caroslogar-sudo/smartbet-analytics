
import os
import httpx
import asyncio
import json
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
HOST = "sportscore1.p.rapidapi.com"

async def test_markets_deep():
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": HOST
    }
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    list_url = f"https://{HOST}/events/date/{today}"
    
    async with httpx.AsyncClient() as client:
        print(f"Buscando eventos para {today}...")
        resp = await client.get(list_url, headers=headers, params={"sport_id": 1})
        events = resp.json().get("data", [])
        
        if not events:
            print("No hay eventos hoy.")
            return

        print(f"Probando mercados para los primeros 3 eventos de {len(events)} totales...")
        for event in events[:3]:
            eid = event["id"]
            name = f"{event['home_team']['name']} vs {event['away_team']['name']}"
            print(f"\n--- {name} (ID: {eid}) ---")
            
            m_url = f"https://{HOST}/events/{eid}/markets"
            m_resp = await client.get(m_url, headers=headers)
            m_data = m_resp.json().get("data", [])
            
            print(f"  Mercados encontrados: {len(m_data)}")
            for market in m_data[:2]:
                m_name = market.get("name")
                odds = [f"{o.get('name')}: {o.get('value')}" for o in market.get("odds", [])]
                print(f"  - {m_name}: {', '.join(odds)}")

if __name__ == "__main__":
    asyncio.run(test_markets_deep())
