import asyncio
import sys
import os
sys.path.append(os.getcwd())
from services.firebase_wrapper import FirebaseWrapper
import logging

logging.basicConfig(level=logging.INFO)

async def wipe_top10():
    print("Iniciando limpieza de Firestore (top10)...")
    try:
        # En nuestro wrapper, set_top_10 sobreescribe el documento 'current'
        # o 'fallback'. Simplemente enviaremos una lista vacía para 'resetear'.
        FirebaseWrapper.set_top_10([], is_fallback=False)
        FirebaseWrapper.set_top_10([], is_fallback=True)
        print("¡Limpieza completada con éxito!")
    except Exception as e:
        print(f"Error durante la limpieza: {e}")

if __name__ == "__main__":
    asyncio.run(wipe_top10())
