import axios from 'axios';
import type { AuthUser } from '../types';

const TOKEN_KEY = 'snaplink_auth_token';
const USER_KEY = 'snaplink_auth_user';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: AuthUser): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } catch (err) {
    console.error('Failed to save session:', err);
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete axios.defaults.headers.common['Authorization'];
  } catch (err) {
    console.error('Failed to clear session:', err);
  }
}

export function initializeAuth(): AuthUser | null {
  const token = getStoredToken();
  const user = getStoredUser();
  if (token && user) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return user;
  }
  return null;
}
