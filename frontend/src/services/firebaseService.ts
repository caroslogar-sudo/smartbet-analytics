import {
  getFirestore,
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { Unsubscribe } from "firebase/firestore";
import { app } from "../firebase";

/**
 * Agnostic Firebase Service Wrapper.
 * Separation of Concerns: la lógica de acceso a Firestore está aislada aquí.
 * Consume el singleton de firebase.ts (no duplica initializeApp).
 */

const hasFirebaseConfig = !!import.meta.env.VITE_FIREBASE_PROJECT_ID;

let db: ReturnType<typeof getFirestore> | null = null;

if (hasFirebaseConfig) {
  try {
    db = getFirestore(app);
  } catch (error) {
    console.warn("⚠️ Firestore no pudo inicializarse:", error);
  }
} else {
  console.warn("⚠️ Firebase configuration missing. firebaseService operará en modo mock.");
}

export interface FirestoreSubscriptionResult {
  unsubscribe: Unsubscribe;
  isRealConnection: boolean;
}

export const firebaseService = {
  /* ─── TOP10 (Oportunidades live del engine) ─── */

  /**
   * Subscribe al documento realtime/top10 en Firestore.
   */
  subscribeToTop10(
    onData: (data: any[]) => void,
    onError?: (error: Error) => void
  ): FirestoreSubscriptionResult {
    if (!db) {
      return { unsubscribe: () => {}, isRealConnection: false };
    }

    const top10Ref = doc(db, "realtime", "top10");

    const unsubscribe = onSnapshot(
      top10Ref,
      (snapshot) => {
        if (snapshot.exists()) {
          onData(snapshot.data().opportunities || []);
        } else {
          console.warn("Documento top10 no existe en Firestore.");
          onData([]);
        }
      },
      (error) => {
        console.error("Firestore Subscription Error:", error);
        onError?.(error);
      }
    );

    return { unsubscribe, isRealConnection: true };
  },

  /**
   * Subscribe al documento realtime/live_scores (Directos y Resultados).
   */
  subscribeToLiveScores(
    onData: (data: { live: any[], finished: any[] }) => void,
    onError?: (error: Error) => void
  ): FirestoreSubscriptionResult {
    if (!db) {
      return { unsubscribe: () => {}, isRealConnection: false };
    }

    const liveScoresRef = doc(db, "realtime", "live_scores");

    const unsubscribe = onSnapshot(
      liveScoresRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          onData({
            live: data.live || [],
            finished: data.finished || []
          });
        } else {
          onData({ live: [], finished: [] });
        }
      },
      (error) => {
        console.error("Firestore LiveScores Error:", error);
        onError?.(error);
      }
    );

    return { unsubscribe, isRealConnection: true };
  },

  /**
   * Subscribe a la colección de oportunidades ordenadas por CC descendente.
   */
  subscribeToAllOpportunities(
    onData: (data: any[]) => void,
    onError?: (error: Error) => void
  ): FirestoreSubscriptionResult {
    if (!db) {
      return { unsubscribe: () => {}, isRealConnection: false };
    }

    const opportunitiesQuery = query(
      collection(db, "opportunities"),
      orderBy("cc", "desc"),
      limit(48)
    );

    const unsubscribe = onSnapshot(
      opportunitiesQuery,
      (snapshot) => {
        const opportunities = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));
        onData(opportunities);
      },
      (error) => {
        console.error("Firestore Opportunities Error:", error);
        onError?.(error);
      }
    );

    return { unsubscribe, isRealConnection: true };
  },

  /* ─── APUESTAS DEL USUARIO ─── */

  /**
   * Suscribe en tiempo real a las apuestas del usuario.
   * Colección: users/{uid}/bets, ordenadas por timestamp desc.
   */
  subscribeToBets(
    uid: string,
    onData: (bets: any[]) => void,
    onError?: (error: Error) => void
  ): FirestoreSubscriptionResult {
    if (!db || !uid) {
      return { unsubscribe: () => {}, isRealConnection: false };
    }

    const betsQuery = query(
      collection(db, "users", uid, "bets"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      betsQuery,
      (snapshot) => {
        const bets = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));
        onData(bets);
      },
      (error) => {
        console.error("Firestore Bets Subscription Error:", error);
        onError?.(error);
      }
    );

    return { unsubscribe, isRealConnection: true };
  },

  /**
   * Añade una nueva apuesta a la colección del usuario.
   * Retorna el ID del documento creado por Firestore.
   */
  async addBet(uid: string, bet: Record<string, any>): Promise<string | null> {
    if (!db || !uid) return null;
    try {
      const docRef = await addDoc(collection(db, "users", uid, "bets"), {
        ...bet,
        timestamp: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error añadiendo apuesta a Firestore:", error);
      return null;
    }
  },

  /**
   * Actualización parcial de una apuesta (merge seguro).
   */
  async updateBet(
    uid: string,
    betId: string,
    fields: Record<string, any>
  ): Promise<void> {
    if (!db || !uid || !betId) return;
    try {
      const betRef = doc(db, "users", uid, "bets", betId);
      await updateDoc(betRef, { ...fields, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error("Error actualizando apuesta en Firestore:", error);
    }
  },

  /** Elimina una apuesta del usuario. */
  async deleteBet(uid: string, betId: string): Promise<void> {
    if (!db || !uid || !betId) return;
    try {
      const betRef = doc(db, "users", uid, "bets", betId);
      await deleteDoc(betRef);
    } catch (error) {
      console.error("Error eliminando apuesta de Firestore:", error);
    }
  },

  /* ─── CONFIGURACIÓN DE USUARIO ─── */

  /** Suscribe a los settings del usuario (Bankroll, filtros guardados, etc.) */
  subscribeToSettings(
    uid: string,
    onData: (settings: any) => void
  ): FirestoreSubscriptionResult {
    if (!db || !uid) return { unsubscribe: () => {}, isRealConnection: false };

    const settingsRef = doc(db, "users", uid, "settings", "profile");
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data());
      } else {
        onData(null);
      }
    });

    return { unsubscribe, isRealConnection: true };
  },

  /** Actualiza la configuración del usuario */
  async updateSettings(uid: string, settings: Record<string, any>): Promise<void> {
    if (!db || !uid) return;
    try {
      const settingsRef = doc(db, "users", uid, "settings", "profile");
      await updateDoc(settingsRef, { ...settings, updatedAt: serverTimestamp() }).catch(async (err) => {
        // Si no existe el doc, lo creamos
        if (err.code === 'not-found') {
          const { setDoc } = await import("firebase/firestore");
          await setDoc(settingsRef, { ...settings, updatedAt: serverTimestamp() });
        }
      });
    } catch (error) {
      console.error("Error actualizando settings en Firestore:", error);
    }
  },

  /** Verifica si hay conexión real a Firestore */
  isConnected(): boolean {
    return !!db;
  },
};
