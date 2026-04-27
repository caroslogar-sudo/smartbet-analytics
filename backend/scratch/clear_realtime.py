import asyncio
import os
import sys

# Asegura que el path incluye el directorio del backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

async def clear_firestore():
    from services.firebase_wrapper import FirebaseWrapper
    print("Inicializando Firebase...")
    FirebaseWrapper.initialize()
    
    db = FirebaseWrapper.get_db()
    if not db:
        print("No se pudo conectar a Firestore.")
        return

    print("Limpiando realtime/top10...")
    db.collection("realtime").document("top10").delete()
    
    print("Limpiando realtime/live_scores...")
    db.collection("realtime").document("live_scores").delete()
    
    print("Firestore limpiado de datos realtime antiguos.")

if __name__ == "__main__":
    asyncio.run(clear_firestore())
