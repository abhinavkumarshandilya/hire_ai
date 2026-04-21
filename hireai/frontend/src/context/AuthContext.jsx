import React, { createContext, useContext, useState } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(() => JSON.parse(localStorage.getItem("hireai_user") || "null"));
  const [loading, setLoading] = useState(false);

  const save = (token, user) => {
    localStorage.setItem("hireai_token", token);
    localStorage.setItem("hireai_user",  JSON.stringify(user));
    setUser(user);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await API.post("/auth/login", { email, password });
      save(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      return data;
    } catch (err) { toast.error(err.response?.data?.message || "Login failed."); throw err; }
    finally { setLoading(false); }
  };

  const register = async (form) => {
    setLoading(true);
    try {
      const { data } = await API.post("/auth/register", form);
      save(data.token, data.user);
      toast.success("Account created! 5 free credits added.");
      return data;
    } catch (err) { toast.error(err.response?.data?.message || "Registration failed."); throw err; }
    finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem("hireai_token");
    localStorage.removeItem("hireai_user");
    setUser(null);
    window.location.href = "/login";
  };

  const refreshUser = async () => {
    try {
      const { data } = await API.get("/auth/me");
      localStorage.setItem("hireai_user", JSON.stringify(data));
      setUser(data);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
