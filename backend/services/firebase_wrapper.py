import os
import json
import base64
import firebase_admin
from firebase_admin import credentials, firestore
from typing import List, Dict, Any

class FirebaseWrapper:
    """
    Agnostic Firebase/Firestore Wrapper for SmartBet Analytics.
    Soporta credenciales en Base64, JSON string, archivo, o default.
    """
    _db = None

    @classmethod
    def initialize(cls):
        if not firebase_admin._apps:
            # 1. Intentar Base64 (más seguro para Render)
            cred_b64 = os.getenv("FIREBASE_CREDENTIALS_BASE64")
            
            # 2. Intentar JSON string
            cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
            
            # 3. Intentar archivo
            cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json")
            
            if cred_b64:
                try:
                    decoded = base64.b64decode(cred_b64).decode('utf-8')
                    cred_dict = json.loads(decoded)
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred)
                    print("✅ Firebase inicializado desde Base64")
                except Exception as e:
                    print(f"❌ Error parsing FIREBASE_CREDENTIALS_BASE64: {e}")
                    return
                    
            elif cred_json:
                try:
                    cred_dict = json.loads(cred_json)
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred)
                    print("✅ Firebase inicializado desde JSON")
                except Exception as e:
                    print(f"❌ Error parsing FIREBASE_CREDENTIALS_JSON: {e}")
                    return
                    
            elif os.path.exists(cred_path):
                try:
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred)
                    print("✅ Firebase inicializado desde archivo")
                except Exception as e:
                    print(f"❌ Error con archivo {cred_path}: {e}")
                    return
            else:
                try:
                    firebase_admin.initialize_app()
                    print("✅ Firebase inicializado con credenciales por defecto")
                except Exception as e:
                    print(f"⚠️ Firebase no pudo inicializarse: {e}")
                    return

        try:
            cls._db = firestore.client()
            print("✅ Firestore client inicializado")
        except Exception as e:
            print(f"⚠️ No se pudo inicializar Firestore: {e}")
            cls._db = None

    @classmethod
    def get_db(cls):
        if cls._db is None:
            cls.initialize()
        return cls._db

    @classmethod
    def is_connected(cls):
        return cls._db is not None

    @classmethod
    def set_top_10(cls, opportunities: List[Dict[str, Any]], is_fallback: bool = False):
        db = cls.get_db()
        if not db:
            print("⚠️ No hay conexión a Firestore")
            return

        try:
            top_10_ref = db.collection("realtime").document("top10")
            top_10_ref.set({
                "opportunities": opportunities,
                "updated_at": firestore.SERVER_TIMESTAMP,
                "is_fallback": is_fallback,
            })
            print(f"✅ Top 10 actualizado ({len(opportunities)} oportunidades)")
        except Exception as e:
            print(f"❌ Error al actualizar top 10: {e}")

    @classmethod
    def set_live_data(cls, live_matches: List[Dict], finished_matches: List[Dict]):
        db = cls.get_db()
        if not db:
            return

        try:
            live_ref = db.collection("realtime").document("live_scores")
            live_ref.set({
                "live": live_matches,
                "finished": finished_matches,
                "updated_at": firestore.SERVER_TIMESTAMP
            })
        except Exception as e:
            print(f"❌ Error al actualizar live data: {e}")

    @classmethod
    def update_opportunity(cls, opp_id: str, data: Dict[str, Any]):
        db = cls.get_db()
        if not db:
            return

        try:
            db.collection("opportunities").document(opp_id).set(data, merge=True)
        except Exception as e:
            print(f"❌ Error al actualizar oportunidad {opp_id}: {e}")

    @classmethod
    def batch_update_opportunities(cls, opportunities: List[Dict[str, Any]]):
        db = cls.get_db()
        if not db:
            return

        try:
            batch = db.batch()
            for opp in opportunities:
                doc_ref = db.collection("opportunities").document(opp["id"])
                batch.set(doc_ref, opp, merge=True)
            batch.commit()
            print(f"✅ Batch actualizado ({len(opportunities)} oportunidades)")
        except Exception as e:
            print(f"❌ Error en batch update: {e}")

    @classmethod
    def delete_old_opportunities(cls, hours_threshold: int = 48):
        db = cls.get_db()
        if not db:
            return 0

        try:
            from datetime import datetime, timedelta, timezone
            threshold_dt = datetime.now(timezone.utc) - timedelta(hours=hours_threshold)
            
            docs = db.collection("opportunities").where("commence_time", "<", threshold_dt.isoformat()).stream()
            
            count = 0
            batch = db.batch()
            for doc in docs:
                batch.delete(doc.reference)
                count += 1
                if count >= 400:
                    batch.commit()
                    batch = db.batch()
                    count = 0
            
            if count > 0:
                batch.commit()
                
            return count
        except Exception as e:
            print(f"❌ Error al eliminar oportunidades antiguas: {e}")
            return 0


# Instancia global
firebaseService = FirebaseWrapper()