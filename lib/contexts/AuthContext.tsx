"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let settled = false;

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      settled = true;
      setUser(authUser);
      setLoading(false);

      if (authUser) {
        try {
          const idToken = await authUser.getIdToken();
          await fetch('/api/auth/session/login', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
        } catch (error) {
          console.error('Error creating server session:', error);
        }
      } else {
        try {
          await fetch('/api/auth/session/logout', { method: 'POST' });
        } catch (error) {
          console.error('Error clearing server session:', error);
        }
      }
    });

    const timeout = setTimeout(() => {
      if (!settled) {
        setLoading(false);
      }
    }, 10000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      await fetch('/api/auth/session/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {!loading ? (
        children
      ) : (
        <div className="flex items-center justify-center min-h-screen bg-[var(--color-background)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </AuthContext.Provider>
  );
}
