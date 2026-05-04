"""
check_firebase_auth.py — Diagnóstico rápido de autenticación Firebase.
Verifica que el serviceAccountKey.json actual puede autenticarse en Firestore.
Ejecutar antes de load_real_data.py si hay sospechas de clave incorrecta.
"""
import json
import os
import sys

KEY_FILE = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")

def check_key_file():
    if not os.path.exists(KEY_FILE):
        print(f"[ERROR] Archivo no encontrado: {KEY_FILE}")
        return False

    with open(KEY_FILE, "r") as f:
        data = json.load(f)

    key_id = data.get("private_key_id", "desconocido")
    email = data.get("client_email", "desconocido")
    project = data.get("project_id", "desconocido")

    print(f"[INFO] Proyecto     : {project}")
    print(f"[INFO] Cuenta       : {email}")
    print(f"[INFO] private_key_id: {key_id}")
    print()
    print("Compara el 'private_key_id' con el ID visible en:")
    print("  https://console.firebase.google.com/project/{}/settings/serviceaccounts/adminsdk".format(project))
    print()
    return key_id, email, project

def test_firestore_write(key_id):
    """Intenta una escritura mínima a Firestore para validar la autenticación."""
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        if firebase_admin._apps:
            firebase_admin.delete_app(firebase_admin.get_app())

        cred = credentials.Certificate(KEY_FILE)
        firebase_admin.initialize_app(cred)
        db = firestore.client()

        # Escritura de prueba en colección de test (no afecta datos reales)
        test_ref = db.collection("_auth_test").document("ping")
        test_ref.set({"key_id": key_id, "status": "ok"})
        test_ref.delete()  # Limpieza inmediata

        print("[OK]  Autenticacion Firebase EXITOSA — la clave es valida.")
        return True
    except Exception as e:
        print(f"[ERROR] Autenticacion FALLIDA: {e}")
        print()
        print("Solucion: Ve a tu carpeta de Descargas y copia el JSON mas reciente")
        print("que empiece por 'smartbet-analytics-web-firebase-adminsdk-...'")
        print("sobre el archivo 'serviceAccountKey.json' en la carpeta backend/")
        return False

if __name__ == "__main__":
    result = check_key_file()
    if result:
        key_id, _, _ = result
        ok = test_firestore_write(key_id)
        sys.exit(0 if ok else 1)
    else:
        sys.exit(1)
