"use client";

import * as React from 'react';
import type { User, UserRole } from '@/lib/types';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { app } from '@/lib/firebase-config';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const auth = getAuth(app);
const db = getFirestore(app);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Keep loading true until we have the user's role from Firestore
        setLoading(true);
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
            console.warn("User document not found in Firestore for UID:", firebaseUser.uid, ". Logging out.");
            await firebaseSignOut(auth);
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          await firebaseSignOut(auth);
          setUser(null);
        } finally {
           setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password?: string) => {
    if (!password) {
      throw new Error("Password is required.");
    }
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle setting the user state and redirects.
  }, []);

  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will set user to null.
      // Redirect to login page after signing out.
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
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
