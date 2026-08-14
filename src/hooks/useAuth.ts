import { useState, useEffect, useCallback } from 'react';
import { hashPassword, generateSalt, encryptState, decryptState } from '../lib/crypto';

export interface User {
  id: string;
  email: string;
  salt: string;
}

let activePassword = ''; // Store password in memory for state encryption/decryption during session

export function getActivePassword() {
  return activePassword;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          setUser(data.user);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || 'Login failed');
    }
    const data = await res.json();
    setUser(data.user);
    activePassword = password;
  };

  const register = async (email: string, password: string) => {
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, passwordHash, salt })
    });
    
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || 'Registration failed');
    }
    
    // Auto-login after register
    await login(email, password);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    activePassword = '';
  };

  return { user, loading, login, register, logout };
}
