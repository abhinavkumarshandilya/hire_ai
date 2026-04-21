import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", company: "" });
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handle = async (e) => {
    e.preventDefault();
    try { await register(form); navigate("/dashboard"); } catch {}
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">H</div>
          <span style={{ fontWeight: 700, fontSize: 20 }}>HireAI</span>
        </div>
        <div className="card">
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Create your account</h2>
          <p className="muted sm" style={{ marginBottom: 20 }}>Start hiring smarter with AI</p>
          <form onSubmit={handle}>
            <div className="row2">
              <div className="input-group">
                <label className="lbl">Full name</label>
                <input className="inp" required placeholder="Priya Sharma" value={form.name} onChange={set("name")} />
              </div>
              <div className="input-group">
                <label className="lbl">Company</label>
                <input className="inp" placeholder="Acme Corp" value={form.company} onChange={set("company")} />
              </div>
            </div>
            <div className="input-group">
              <label className="lbl">Work email</label>
              <input className="inp" type="email" required placeholder="hr@company.com" value={form.email} onChange={set("email")} />
            </div>
            <div className="input-group">
              <label className="lbl">Password (min 6 chars)</label>
              <input className="inp" type="password" required minLength={6} placeholder="••••••••" value={form.password} onChange={set("password")} />
            </div>
            <button className="btn btn-primary btn-full btn-lg" disabled={loading} type="submit">
              {loading ? <span className="spin" /> : "Create account — Free"}
            </button>
          </form>
          <p className="tc mt4 sm muted">Already have an account? <Link to="/login" style={{ color: "var(--purple)", textDecoration: "none", fontWeight: 500 }}>Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
