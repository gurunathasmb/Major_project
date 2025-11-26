// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useCallback } from "react";
import jwtDecode from "jwt-decode";

export const AuthContext = createContext();

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// -----------------------------
// Helper: Decode JWT safely
// -----------------------------
function safeDecode(token) {
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
}

// -----------------------------
// MAIN PROVIDER
// -----------------------------
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("ceph_token") || null);
  const [currentUser, setCurrentUser] = useState(() =>
    token ? safeDecode(token) : null
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // -----------------------------------------------
  // LOGIN (Works with FastAPI OAuth2PasswordRequestForm)
  // -----------------------------------------------
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const body = new URLSearchParams();
      body.append("username", email);
      body.append("password", password);

      const res = await fetch(`${API_URL}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Login failed" }));
        throw new Error(err.detail || "Login failed");
      }

      const data = await res.json(); // { access_token }
      localStorage.setItem("ceph_token", data.access_token);
      setToken(data.access_token);

      const decoded = safeDecode(data.access_token);
      setCurrentUser(decoded);

      setLoading(false);
      return true;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return false;
    }
  }, []);

  // -----------------------------------------------
  // REGISTER (works with your /auth/register)
  // -----------------------------------------------
  const registerUser = async (username, password, role) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Register failed" }));
        throw new Error(err.detail || "Registration failed");
      }

      // Auto-login after registration
      const ok = await login(username, password);
      return ok;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return false;
    }
  };

  // -----------------------------------------------
  // LOGOUT
  // -----------------------------------------------
  const logout = () => {
    localStorage.removeItem("ceph_token");
    setToken(null);
    setCurrentUser(null);
  };

  // -----------------------------------------------
  // GET AUTH HEADERS
  // -----------------------------------------------
  const getAuthHeaders = () =>
    token ? { Authorization: `Bearer ${token}` } : {};

  // -----------------------------------------------
  // Auto-update user when token changes
  // -----------------------------------------------
  useEffect(() => {
    if (!token) {
      setCurrentUser(null);
      return;
    }
    setCurrentUser(safeDecode(token));
  }, [token]);

  // -----------------------------------------------
  // AUTO-LOGOUT on token expiration
  // -----------------------------------------------
  useEffect(() => {
    if (!currentUser || !currentUser.exp) return;

    const now = Math.floor(Date.now() / 1000);
    const ttl = currentUser.exp - now;

    if (ttl <= 0) {
      logout();
      return;
    }

    const timer = setTimeout(() => logout(), ttl * 1000);
    return () => clearTimeout(timer);
  }, [currentUser]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        loading,
        error,
        login,
        logout,
        registerUser,
        getAuthHeaders,
        isAdmin: () => currentUser?.role === "admin",
        isDoctor: () => currentUser?.role === "doctor",
        isAuthenticated: () => !!currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
