"use client";

import * as React from 'react';
import type { User, UserRole } from '@/lib/types';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { app } from '@/lib/firebase-config';

type FirestoreStatus = 'checking' | 'connected' | 'error';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  firestoreStatus: FirestoreStatus;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const auth = getAuth(app);
const db = getFirestore(app);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firestoreStatus, setFirestoreStatus] = useState<FirestoreStatus>('checking');
  const router = useRouter();

  const checkFirestoreConnection = useCallback(async () => {
    setFirestoreStatus('checking');
    try {
      await getDoc(doc(db, "_health_check", "status"));
      setFirestoreStatus('connected');
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        setFirestoreStatus('connected');
      } else {
        console.error("Firestore connection check failed:", error);
        setFirestoreStatus('error');
      }
    }
  }, []);

  useEffect(() => {
    checkFirestoreConnection();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const role = (userData.role?.toLowerCase() === 'admin' ? 'admin' : 'viewer') as UserRole;
            const appUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: role,
            };
            setUser(appUser);
          } else {
            console.warn("User document not found in Firestore. Logging out.");
            await firebaseSignOut(auth);
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          await firebaseSignOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [checkFirestoreConnection]);

  const login = useCallback(async (email: string, password?: string) => {
    if (!password) {
      throw new Error("Password is required.");
    }
    // onAuthStateChanged will handle setting the user state upon successful login
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      // The onAuthStateChanged listener will set user to null
      // The redirector components will handle pushing to /login
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, firestoreStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
