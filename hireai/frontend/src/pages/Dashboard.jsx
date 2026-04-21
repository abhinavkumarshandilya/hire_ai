import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const STATUS_BADGE = { active: ["bp", "Active"], paused: ["ba", "Paused"], closed: ["bx", "Closed"] };
const REC_BADGE    = { "Strongly Recommend": "bg", Recommend: "bg", Maybe: "ba", Reject: "br" };

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats,       setStats]       = useState(null);
  const [interviews,  setInterviews]  = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      API.get("/result/stats"),
      API.get("/interview"),
    ]).then(([s, iv]) => {
      setStats(s.data);
      setInterviews(iv.data);
    }).catch(() => toast.error("Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const copyLink = (token) => {
    navigator.clipboard.writeText(`${window.location.origin}/interview/${token}`);
    toast.success("Interview link copied!");
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}><span className="spin" style={{ width: 32, height: 32 }} /></div>;

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div className="fxb mb6">
        <div>
          <h1 className="h2">Good day, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="muted sm mt1">Manage your AI-powered interviews</p>
        </div>
        <Link to="/create" className="btn btn-primary">+ Create Interview</Link>
      </div>

      {/* Stats */}
      <div className="g4 mb6">
        {[
          { label: "Total Interviews", value: stats?.totalInterviews ?? 0 },
          { label: "Total Candidates", value: stats?.totalCandidates ?? 0 },
          { label: "Shortlisted",      value: stats?.shortlisted ?? 0 },
          { label: "Avg AI Score",     value: `${stats?.avgScore ?? 0}/10` },
        ].map(({ label, value }) => (
          <div key={label} className="card" style={{ padding: "16px 18px" }}>
            <div className="sm muted mb2">{label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--purple)" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Interviews list */}
      <div className="fxb mb3">
        <h3 className="h3">Your Interviews</h3>
      </div>

      {interviews.length === 0 ? (
        <div className="card tc" style={{ padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No interviews yet</div>
          <p className="muted sm mb4">Create your first AI interview in minutes</p>
          <Link to="/create" className="btn btn-primary">Create Interview</Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="twrap">
            <table>
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Level</th>
                  <th>Candidates</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((iv) => {
                  const [cls, lbl] = STATUS_BADGE[iv.status] || ["bx", iv.status];
                  return (
                    <tr key={iv._id}>
                      <td><span style={{ fontWeight: 500 }}>{iv.jobTitle}</span></td>
                      <td style={{ textTransform: "capitalize" }}>{iv.experienceLevel}</td>
                      <td>{iv.totalAttempts}</td>
                      <td><span className={`badge ${cls}`}>{lbl}</span></td>
                      <td className="muted">{new Date(iv.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="fxc gap2">
                          <button className="btn btn-sm btn-outline" onClick={() => navigate(`/interviews/${iv._id}`)}>View</button>
                          <button className="btn btn-sm btn-ghost" onClick={() => copyLink(iv.inviteToken)} title="Copy invite link">🔗</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
