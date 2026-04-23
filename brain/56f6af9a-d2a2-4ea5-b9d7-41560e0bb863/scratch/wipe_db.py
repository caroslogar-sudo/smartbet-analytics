import os
import firebase_admin
from firebase_admin import credentials, firestore

# Use the same credentials as the backend
cred_path = "c:\\Users\\oslog\\Desktop\\Proyectos Antigraviti\\SmartBetanalytics\\backend\\serviceAccountKey.json"

if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

def delete_collection(coll_ref, batch_size):
    docs = coll_ref.limit(batch_size).stream()
    deleted = 0

    for doc in docs:
        print(f'Deleting doc {doc.id} => {doc.to_dict().get("home", "N/A")} vs {doc.to_dict().get("away", "N/A")}')
        doc.reference.delete()
        deleted = deleted + 1

    if deleted >= batch_size:
        return delete_collection(coll_ref, batch_size)

print("--- LIMPIEZA DE SMARTBET ANALYTICS ---")

# Clean high-level document
print("Limpiando realtime/top10...")
db.collection("realtime").document("top10").delete()

# Clean collection
print("Limpiando coleccion 'opportunities'...")
delete_collection(db.collection("opportunities"), 10)

print("\n✅ Base de datos a CERO. El backend ahora inyectará datos REALES y FRESCOS.")
