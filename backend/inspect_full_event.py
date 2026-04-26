
import os
import httpx
import asyncio
import json
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
HOST = "sportscore1.p.rapidapi.com"

async def inspect_full_event():
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": HOST
    }
    
    eid = "3827705"
    url = f"https://{HOST}/events/{eid}?include=odds,bookmakers"
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers)
        data = resp.json()
        
        # Guardar a un archivo para inspeccionar bien
        with open("full_event_data.json", "w") as f:
            json.dump(data, f, indent=2)
            
        print("Datos guardados en full_event_data.json")
        # Buscar 'odds' en el JSON
        event_data = data.get("data", {})
        odds = event_data.get("odds", "No encontrado")
        print(f"Campo 'odds': {type(odds)}")
        if isinstance(odds, list) and len(odds) > 0:
            print(f"¡Encontradas {len(odds)} cuotas!")
            print(json.dumps(odds[:2], indent=2))
        else:
            print("El campo 'odds' está vacío o no existe en la respuesta.")

if __name__ == "__main__":
    asyncio.run(inspect_full_event())
