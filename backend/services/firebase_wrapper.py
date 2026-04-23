import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from typing import List, Dict, Any, Optional

class FirebaseWrapper:
    """
    Agnostic Firebase/Firestore Wrapper for SmartBet Analytics.
    Following the 'Dependency Agnosticism' principle.
    """
    _db = None

    @classmethod
    def initialize(cls):
        if not firebase_admin._apps:
            # Look for creds in env JSON, then env path, then local file
            cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
            cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json")
            
            if cred_json:
                try:
                    cred_dict = json.loads(cred_json)
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred)
                except Exception as e:
                    print(f"Error parsing FIREBASE_CREDENTIALS_JSON: {e}")
            elif os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                # Fallback to default or environment-based auth (useful for cloud deploys)
                try:
                    firebase_admin.initialize_app()
                except Exception as e:
                    print(f"Warning: Firebase could not be initialized: {e}")
                    return

        try:
            cls._db = firestore.client()
        except Exception as e:
            print(f"Warning: Could not initialize Firestore client: {e}")
            cls._db = None

    @classmethod
    def get_db(cls):
        if cls._db is None:
            cls.initialize()
        return cls._db

    @classmethod
    def set_top_10(cls, opportunities: List[Dict[str, Any]], is_fallback: bool = False):
        """
        Sobreescribe el documento realtime/top10 de forma atómica.
        Incluye el flag is_fallback para que el frontend distinga datos reales de emergencia.
        """
        db = cls.get_db()
        if not db: return

        # Estrategia: Un único documento con la lista, garantizando consistencia total del Top10
        top_10_ref = db.collection("realtime").document("top10")
        top_10_ref.set({
            "opportunities": opportunities,
            "updated_at": firestore.SERVER_TIMESTAMP,
            "is_fallback": is_fallback,
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
