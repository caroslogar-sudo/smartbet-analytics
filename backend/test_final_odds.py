
import os
import httpx
import asyncio
import json
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
HOST = "sportscore1.p.rapidapi.com"

async def test_odds_variations():
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": HOST
    }
    
    # Sao Paulo vs Mirassol (ID fresco que sabemos que existe)
    eid = "3827705"
    
    urls = [
        f"https://{HOST}/events/{eid}/odds",
        f"https://{HOST}/events/{eid}/bookmakers",
        f"https://{HOST}/events/{eid}?include=odds,bookmakers",
        f"https://{HOST}/events/{eid}/odds?market_id=1"
    ]
    
    async with httpx.AsyncClient() as client:
        for url in urls:
            print(f"\nProbando: {url}")
            try:
                resp = await client.get(url, headers=headers, timeout=10.0)
                print(f"Status: {resp.status_code}")
                if resp.status_code == 200:
                    data = resp.json()
                    # Verificar si hay algo en 'data' o similar que parezca una cuota
                    content_str = json.dumps(data)
                    if "value" in content_str or "price" in content_str:
                        print("¡EXITO! Se han detectado valores numéricos en la respuesta.")
                        print(json.dumps(data, indent=2)[:500] + "...")
                        return # Paramos si encontramos oro
                    else:
                        print("Respuesta recibida pero sin valores numéricos de cuotas.")
                else:
                    print(f"Error: {resp.text[:100]}")
            except Exception as e:
                print(f"Error en peticion: {e}")

if __name__ == "__main__":
    asyncio.run(test_odds_variations())
