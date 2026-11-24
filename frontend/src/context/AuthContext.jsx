import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("budget_buddy_token"));
  const [loading, setLoading] = useState(true);

  // Validate session on startup
  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await api.getMe();
        setUser(currentUser);
      } catch (err) {
        console.warn("Session expired or invalid, clearing token:", err);
        localStorage.removeItem("budget_buddy_token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, [token]);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem("budget_buddy_token", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  const register = async (fullName, email, password, phone = null, invitationToken = null) => {
    const data = await api.register({
      full_name: fullName,
      email,
      password,
      ...(phone ? { phone } : {}),
      ...(invitationToken ? { invitation_token: invitationToken } : {}),
    });
    localStorage.setItem("budget_buddy_token", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("budget_buddy_token");
    setToken(null);
    setUser(null);
  };

  const setAuthSession = (newToken, newUser) => {
    localStorage.setItem("budget_buddy_token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        setUser,
        setAuthSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

