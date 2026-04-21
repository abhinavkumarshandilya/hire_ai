import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";

const REC = { "Strongly Recommend": "bg", Recommend: "bg", Maybe: "ba", Reject: "br" };
const SEN = { Confident: "bg", Calm: "bg", Nervous: "ba", Unsure: "ba" };

export default function InterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    API.get(`/interview/${id}`)
      .then(r => setData(r.data))
      .catch(() => toast.error("Failed to load."))
      .finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const copyLink = () => {
    const token = data?.interview?.inviteToken;
    if (token) { navigator.clipboard.writeText(`${window.location.origin}/interview/${token}`); toast.success("Link copied!"); }
  };

  const toggleStatus = async () => {
    const next = data.interview.status === "active" ? "closed" : "active";
    try {
      await API.put(`/interview/${id}/status`, { status: next });
      toast.success(`Interview ${next}`);
      load();
    } catch { toast.error("Failed to update status."); }
  };

  const shortlist = async (sessionId, val) => {
    try {
      await API.put(`/interview/session/${sessionId}/shortlist`, { shortlisted: val });
      toast.success(val ? "Shortlisted!" : "Removed from shortlist.");
      load();
    } catch { toast.error("Failed."); }
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}><span className="spin" style={{ width: 32, height: 32 }} /></div>;
  if (!data)   return <div style={{ padding: 28 }}>Interview not found.</div>;

  const { interview, sessions } = data;

  return (
    <div style={{ padding: 28 }}>
      <button className="btn btn-ghost btn-sm mb4" onClick={() => navigate("/dashboard")}>← Back</button>

      <div className="fxb mb6">
        <div>
          <h2 className="h2">{interview.jobTitle}</h2>
          <p className="muted sm mt1" style={{ textTransform: "capitalize" }}>{interview.experienceLevel} level · {interview.questions?.length || 0} questions · {sessions.length} candidates</p>
        </div>
        <div className="fxc gap3">
          <button className="btn btn-outline btn-sm" onClick={copyLink}>🔗 Copy Invite Link</button>
          <button className={`btn btn-sm ${interview.status === "active" ? "btn-danger" : "btn-outline"}`} onClick={toggleStatus}>
            {interview.status === "active" ? "Close Interview" : "Reopen Interview"}
          </button>
        </div>
      </div>

      <div className="g2 mb6">
        <div className="card">
          <div className="sm muted mb2">Required Skills</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {interview.skills?.length ? interview.skills.map(s => <span key={s} className="badge bp">{s}</span>) : <span className="muted sm">None listed</span>}
          </div>
        </div>
        <div className="card">
          <div className="sm muted mb2">Invite Link</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, wordBreak: "break-all", color: "var(--purple)" }}>
            {window.location.origin}/interview/{interview.inviteToken}
          </div>
        </div>
      </div>

      <h3 className="h3 mb3">Candidates ({sessions.length})</h3>

      {sessions.length === 0 ? (
        <div className="card tc" style={{ padding: 40 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📬</div>
          <p className="muted">No candidates yet. Share the invite link to get started.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="twrap">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Overall Score</th>
                  <th>Sentiment</th>
                  <th>Recommendation</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{s.candidate.name}</div>
                      <div className="sm muted">{s.candidate.email}</div>
                    </td>
                    <td>
                      {s.status === "completed"
                        ? <span style={{ fontWeight: 600, color: "var(--purple)" }}>{s.scores.overall}/10</span>
                        : <span className="muted">—</span>}
                    </td>
                    <td>
                      {s.sentiment ? <span className={`badge ${SEN[s.sentiment] || "bx"}`}>{s.sentiment}</span> : "—"}
                    </td>
                    <td>
                      {s.recommendation ? <span className={`badge ${REC[s.recommendation] || "bx"}`}>{s.recommendation}</span> : "—"}
                    </td>
                    <td>
                      <span className={`badge ${s.status === "completed" ? "bg" : s.status === "in-progress" ? "bp" : "bx"}`} style={{ textTransform: "capitalize" }}>{s.status}</span>
                    </td>
                    <td className="muted">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="fxc gap2">
                        {s.status === "completed" && (
                          <>
                            <button className="btn btn-sm btn-outline" onClick={() => navigate(`/results/${s._id}`)}>Report</button>
                            <button className={`btn btn-sm ${s.shortlisted ? "btn-danger" : "btn-primary"}`} onClick={() => shortlist(s._id, !s.shortlisted)}>
                              {s.shortlisted ? "Unshortlist" : "Shortlist"}
                            </button>
                          </>
                        )}
                        {s.status === "in-progress" && <span className="badge bp">Live</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
