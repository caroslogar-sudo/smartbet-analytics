import requests
import json

BASE_URL = "http://localhost:8000"

def test_refresh():
    print("Iniciando prueba de refresco real...")
    # El endpoint /api/refresh-manual requiere Auth, pero vamos a probar sin ella primero
    # o mejor, vamos a consultar el /api/status para ver si el engine está arriba.
    try:
        resp = requests.get(f"{BASE_URL}/api/status")
        print(f"Status: {resp.status_code}")
        print(f"Body: {json.dumps(resp.json(), indent=2)}")
    except Exception as e:
        print(f"Error conectando al backend: {e}")

if __name__ == "__main__":
    test_refresh()
