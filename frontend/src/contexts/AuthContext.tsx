import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { app } from '../firebase';

const auth = getAuth(app);

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  register: (email: string, pass: string) => Promise<any>;
  login: (email: string, pass: string, rememberMe: boolean) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

const AUTH_TIMEOUT_MS = 5000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Timeout de seguridad: si Firebase no responde en AUTH_TIMEOUT_MS, mostrar la UI igualmente
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn(`Firebase Auth no respondió en ${AUTH_TIMEOUT_MS}ms. Mostrando pantalla de login.`);
        setLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeoutId);
      setCurrentUser(user);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const register = (email: string, pass: string) => {
    return createUserWithEmailAndPassword(auth, email, pass);
  };

  const login = async (email: string, pass: string, rememberMe: boolean = true) => {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    loading,
    register,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
