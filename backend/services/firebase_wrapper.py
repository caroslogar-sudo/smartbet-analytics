import os
import json
import base64
import firebase_admin
from firebase_admin import credentials, firestore
from typing import List, Dict, Any

class FirebaseWrapper:
    """
    Agnostic Firebase/Firestore Wrapper for SmartBet Analytics.
    """
    _db = None

    @classmethod
    def initialize(cls):
        if not firebase_admin._apps:
            # Buscar credenciales en Base64 primero (más seguro para Render)
            cred_b64 = os.getenv("FIREBASE_CREDENTIALS_BASE64")
            cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
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
            elif cred_json:
                try:
                    cred_dict = json.loads(cred_json)
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred)
                    print("✅ Firebase inicializado desde JSON")
                except Exception as e:
                    print(f"❌ Error parsing FIREBASE_CREDENTIALS_JSON: {e}")
            elif os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                print("✅ Firebase inicializado desde archivo")
            else:
                try:
                    firebase_admin.initialize_app()
                    print("✅ Firebase inicializado con credenciales por defecto")
                except Exception as e:
                    print(f"⚠️ Warning: Firebase could not be initialized: {e}")
                    return

        try:
            cls._db = firestore.client()
            print("✅ Firestore client inicializado")
        except Exception as e:
            print(f"⚠️ Warning: Could not initialize Firestore client: {e}")
            cls._db = None

    @classmethod
    def get_db(cls):
        if cls._db is None:
            cls.initialize()
        return cls._db

    @classmethod
    def set_top_10(cls, opportunities: List[Dict[str, Any]], is_fallback: bool = False):
        db = cls.get_db()
        if not db: return

        top_10_ref = db.collection("realtime").document("top10")
        top_10_ref.set({
            "opportunities": opportunities,
            "updated_at": firestore.SERVER_TIMESTAMP,
            "is_fallback": is_fallback,
        })

    @classmethod
    def set_live_data(cls, live_matches: List[Dict], finished_matches: List[Dict]):
        db = cls.get_db()
        if not db: return

        live_ref = db.collection("realtime").document("live_scores")
        live_ref.set({
            "live": live_matches,
            "finished": finished_matches,
            "updated_at": firestore.SERVER_TIMESTAMP
        })

    @classmethod
    def update_opportunity(cls, opp_id: str, data: Dict[str, Any]):
        db = cls.get_db()
        if not db: return

        db.collection("opportunities").document(opp_id).set(data, merge=True)

    @classmethod
    def batch_update_opportunities(cls, opportunities: List[Dict[str, Any]]):
        db = cls.get_db()
        if not db: return

        batch = db.batch()
        for opp in opportunities:
            doc_ref = db.collection("opportunities").document(opp["id"])
            batch.set(doc_ref, opp, merge=True)
        batch.commit()

    @classmethod
    def delete_old_opportunities(cls, hours_threshold: int = 48):
        db = cls.get_db()
        if not db: return

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
        batch.commit()
        return count