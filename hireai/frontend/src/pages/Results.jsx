import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

const REC_COLOR = { "Strongly Recommend": "bg", Recommend: "bg", Maybe: "ba", Reject: "br" };

export default function Results() {
  const { sessionId } = useParams();
  const navigate      = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/result/session/${sessionId}`)
      .then(r => setSession(r.data))
      .catch(() => toast.error("Failed to load report."))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const downloadPDF = async () => {
    try {
      const res = await API.get(`/result/pdf/${sessionId}`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a   = document.createElement("a");
      a.href    = url;
      a.download = `HireAI_${session.candidate.name.replace(/ /g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Failed to download PDF."); }
  };

  const toggleShortlist = async () => {
    try {
      await API.put(`/interview/session/${sessionId}/shortlist`, { shortlisted: !session.shortlisted });
      setSession({ ...session, shortlisted: !session.shortlisted });
      toast.success(session.shortlisted ? "Removed from shortlist." : "Shortlisted!");
    } catch { toast.error("Failed."); }
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}><span className="spin" style={{ width: 32, height: 32 }} /></div>;
  if (!session) return <div style={{ padding: 28 }}>Session not found.</div>;

  const radarData = [
    { subject: "Technical",     value: session.scores.technical     },
    { subject: "Communication", value: session.scores.communication },
    { subject: "Confidence",    value: session.scores.confidence    },
    { subject: "Overall",       value: session.scores.overall       },
  ];

  return (
    <div style={{ padding: 28 }}>
      <button className="btn btn-ghost btn-sm mb4" onClick={() => navigate(-1)}>← Back</button>

      <div className="fxb mb6">
        <div>
          <h2 className="h2">Interview Report</h2>
          <p className="muted sm mt1">{session.candidate.name} · {session.interview?.jobTitle}</p>
        </div>
        <div className="fxc gap3">
          <button className="btn btn-outline" onClick={downloadPDF}>⬇ Download PDF</button>
          <button className={`btn ${session.shortlisted ? "btn-danger" : "btn-primary"}`} onClick={toggleShortlist}>
            {session.shortlisted ? "Remove Shortlist" : "✓ Shortlist"}
          </button>
        </div>
      </div>

      <div className="g2 mb4">
        {/* Score summary */}
        <div className="card">
          <h3 className="h3 mb4">Score Summary</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, fontWeight: 700, color: "var(--purple)", lineHeight: 1 }}>{session.scores.overall}</div>
              <div className="sm muted">/10 Overall</div>
            </div>
            <div style={{ flex: 1 }}>
              {[
                { label: "Technical",     val: session.scores.technical },
                { label: "Communication", val: session.scores.communication },
                { label: "Confidence",    val: session.scores.confidence },
              ].map(({ label, val }) => (
                <div key={label} className="sbar-wrap">
                  <div className="sbar-label">{label}</div>
                  <div className="sbar-track"><div className="sbar-fill" style={{ width: `${val * 10}%` }} /></div>
                  <div className="sbar-val">{val}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="g2" style={{ gap: 10 }}>
            <div style={{ background: "var(--surface2)", borderRadius: "var(--r)", padding: "10px 14px" }}>
              <div className="sm muted mb1">Sentiment</div>
              <div style={{ fontWeight: 600 }}>{session.sentiment}</div>
            </div>
            <div style={{ background: "var(--surface2)", borderRadius: "var(--r)", padding: "10px 14px" }}>
              <div className="sm muted mb1">Recommendation</div>
              <span className={`badge ${REC_COLOR[session.recommendation] || "bx"}`}>{session.recommendation}</span>
            </div>
          </div>
        </div>

        {/* Radar chart */}
        <div className="card">
          <h3 className="h3 mb4">Skill Radar</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" style={{ fontSize: 12 }} />
              <Radar dataKey="value" stroke="#6b5de6" fill="#6b5de6" fillOpacity={0.25} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Summary */}
      <div className="card mb4">
        <h3 className="h3 mb3">AI Summary</h3>
        <p style={{ lineHeight: 1.8, color: "var(--text2)" }}>{session.aiSummary || "No summary available."}</p>
      </div>

      {/* Anti-cheat */}
      {(session.antiCheat.tabSwitches > 0 || session.antiCheat.faceNotDetected > 0) && (
        <div className="card mb4" style={{ borderColor: "#fca5a5" }}>
          <h3 className="h3 mb3" style={{ color: "var(--red)" }}>⚠ Anti-Cheat Report</h3>
          <div className="g3">
            <div style={{ background: "var(--red-l)", borderRadius: "var(--r)", padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--red)" }}>{session.antiCheat.tabSwitches}</div>
              <div className="sm muted">Tab Switches</div>
            </div>
            <div style={{ background: "var(--red-l)", borderRadius: "var(--r)", padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--red)" }}>{session.antiCheat.faceNotDetected}</div>
              <div className="sm muted">Face Not Detected</div>
            </div>
            <div style={{ background: "var(--red-l)", borderRadius: "var(--r)", padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--red)" }}>{session.antiCheat.multiplePersons}</div>
              <div className="sm muted">Multiple Persons</div>
            </div>
          </div>
        </div>
      )}

      {/* Q&A breakdown */}
      <div className="card">
        <h3 className="h3 mb4">Question-by-Question Breakdown</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {session.answers.map((a, i) => (
            <div key={i} style={{ padding: 14, border: "1px solid var(--border)", borderRadius: "var(--r)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13, flex: 1, marginRight: 12 }}>Q{i + 1}: {a.questionText}</div>
                <span style={{ fontWeight: 700, color: "var(--purple)", fontSize: 15, flexShrink: 0 }}>{a.aiScore}/10</span>
              </div>
              <div style={{ background: "var(--surface2)", borderRadius: "var(--r)", padding: "8px 12px", marginBottom: 8, fontSize: 13, lineHeight: 1.6 }}>
                {a.answerText || <span className="muted">No answer provided</span>}
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>
                <span style={{ fontWeight: 500 }}>AI Feedback: </span>{a.aiFeedback}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
