import asyncio
import logging
from engine import engine
from services.firebase_wrapper import FirebaseWrapper

logging.basicConfig(level=logging.INFO)

async def test():
    FirebaseWrapper.initialize()
    print("Iniciando ciclo...")
    try:
        res = await engine.get_current_top10()
        print(f"Ciclo completado: {len(res.opportunities)} oportunidades")
        for o in res.opportunities[:5]:
            print(f" - {o.home} vs {o.away} ({o.sport}) Date: {o.commence_time}")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(test())
