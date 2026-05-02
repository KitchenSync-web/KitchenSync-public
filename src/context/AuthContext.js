import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { ensureUserDocument } from '../services/userService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      try {
        if (!authenticatedUser) {
          setUser(null);
          return;
        }

        await authenticatedUser.reload();

        if (!authenticatedUser.emailVerified) {
          setUser(null);
          return;
        }

        await ensureUserDocument(authenticatedUser);
        setUser(authenticatedUser);
      } catch (error) {
        console.error('Error handling auth state:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}