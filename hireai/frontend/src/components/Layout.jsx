import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/dashboard", icon: "⊞", label: "Dashboard" },
  { to: "/create",    icon: "＋", label: "New Interview" },
  { to: "/pricing",   icon: "◈",  label: "Credits & Plans" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--purple)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16 }}>H</div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>HireAI</span>
        </div>
        <nav style={{ flex: 1, padding: "12px 10px" }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: "var(--r)", marginBottom: 2,
              textDecoration: "none", fontSize: 13, fontWeight: 500,
              background: isActive ? "var(--purple-l)" : "transparent",
              color: isActive ? "var(--purple)" : "var(--text2)",
            })}>
              <span style={{ fontSize: 15 }}>{icon}</span>{label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: "14px", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div className="av">{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>{user?.plan?.toUpperCase()} · {user?.credits} credits</div>
            </div>
          </div>
          <button className="btn btn-outline btn-full btn-sm" onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main style={{ flex: 1, overflow: "auto", background: "var(--bg)" }}>
        <Outlet />
      </main>
    </div>
  );
}
