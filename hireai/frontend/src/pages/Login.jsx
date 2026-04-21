import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    try { await login(form.email, form.password); navigate("/dashboard"); } catch {}
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">H</div>
          <span style={{ fontWeight: 700, fontSize: 20 }}>HireAI</span>
        </div>
        <div className="card">
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Welcome back</h2>
          <p className="muted sm mb4" style={{ marginBottom: 20 }}>Sign in to your HR account</p>
          <form onSubmit={handle}>
            <div className="input-group">
              <label className="lbl">Email address</label>
              <input className="inp" type="email" required placeholder="hr@company.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="lbl">Password</label>
              <input className="inp" type="password" required placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <button className="btn btn-primary btn-full btn-lg mt2" disabled={loading} type="submit">
              {loading ? <span className="spin" /> : "Sign in"}
            </button>
          </form>
          <p className="tc mt4 sm muted">Don't have an account? <Link to="/register" style={{ color: "var(--purple)", textDecoration: "none", fontWeight: 500 }}>Sign up free</Link></p>
        </div>
        <p className="tc mt4 sm muted">5 free interview credits on signup</p>
      </div>
    </div>
  );
}
