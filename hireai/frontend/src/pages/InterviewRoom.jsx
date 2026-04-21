import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";

/* ── Speech Recognition helper ──────────────────────────── */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function InterviewRoom() {
  const { token } = useParams();

  const [phase,       setPhase]       = useState("loading"); // loading|register|ready|interview|done
  const [interview,   setInterview]   = useState(null);
  const [sessionId,   setSessionId]   = useState(null);
  const [candidate,   setCandidate]   = useState({ name: "", email: "" });
  const [currentQ,    setCurrentQ]    = useState(0);
  const [transcript,  setTranscript]  = useState("");
  const [answers,     setAnswers]     = useState([]);
  const [evaluating,  setEvaluating]  = useState(false);
  const [micOn,       setMicOn]       = useState(false);
  const [timer,       setTimer]       = useState(0);
  const [qTimer,      setQTimer]      = useState(0);
  const [tabWarnings, setTabWarnings] = useState(0);
  const [finalScore,  setFinalScore]  = useState(null);

  const recogRef     = useRef(null);
  const streamRef    = useRef(null);
  const videoRef     = useRef(null);
  const timerRef     = useRef(null);
  const qTimerRef    = useRef(null);
  const startTimeRef = useRef(null);

  // Load interview
  useEffect(() => {
    API.get(`/interview/join/${token}`)
      .then(r => { setInterview(r.data); setPhase("register"); })
      .catch(() => { toast.error("Invalid or expired interview link."); setPhase("error"); });
  }, [token]);

  // Tab switch anti-cheat
  useEffect(() => {
    if (phase !== "interview") return;
    const handler = () => {
      if (document.hidden) {
        setTabWarnings(w => {
          const next = w + 1;
          toast.error(`⚠ Tab switch detected! Warning ${next}/3`);
          if (sessionId) API.post("/interview/session/anticheat", { sessionId, event: "tabSwitch" }).catch(() => {});
          return next;
        });
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [phase, sessionId]);

  // Overall timer
  useEffect(() => {
    if (phase !== "interview") return;
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // Per-question timer
  useEffect(() => {
    if (phase !== "interview") return;
    clearInterval(qTimerRef.current);
    setQTimer(0);
    qTimerRef.current = setInterval(() => setQTimer(t => t + 1), 1000);
    return () => clearInterval(qTimerRef.current);
  }, [currentQ, phase]);

  // Camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { toast.error("Camera/mic access denied. Please allow and refresh."); }
  }, []);

  // Speech recognition
  const startListening = useCallback(() => {
    if (!SpeechRecognition) return toast.error("Speech recognition not supported. Type your answer.");
    const recog = new SpeechRecognition();
    recog.continuous    = true;
    recog.interimResults = true;
    recog.lang          = "en-US";
    recog.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join(" ");
      setTranscript(text);
    };
    recog.onerror = () => setMicOn(false);
    recog.start();
    recogRef.current = recog;
    setMicOn(true);
  }, []);

  const stopListening = useCallback(() => {
    recogRef.current?.stop();
    setMicOn(false);
  }, []);

  const startInterview = async () => {
    if (!candidate.name || !candidate.email) return toast.error("Please enter your name and email.");
    try {
      const { data } = await API.post("/interview/session/start", {
        interviewId: interview._id, candidateName: candidate.name, candidateEmail: candidate.email,
      });
      setSessionId(data.sessionId);
      await startCamera();
      setPhase("interview");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to start."); }
  };

  const submitAnswer = async () => {
    if (!transcript.trim()) return toast.error("Please speak or type your answer first.");
    setEvaluating(true);
    stopListening();
    const q = interview.questions[currentQ];
    try {
      const { data } = await API.post("/interview/session/answer", {
        sessionId, questionIndex: currentQ,
        questionText: q.text, questionType: q.type,
        answerText: transcript, timeTaken: qTimer,
      });
      setAnswers(prev => [...prev, { q: q.text, a: transcript, score: data.score, feedback: data.feedback }]);
      setTranscript("");

      if (currentQ + 1 >= interview.questions.length) {
        await finishInterview();
      } else {
        setCurrentQ(c => c + 1);
        setEvaluating(false);
      }
    } catch { toast.error("Failed to submit answer."); setEvaluating(false); }
  };

  const finishInterview = async () => {
    clearInterval(timerRef.current);
    clearInterval(qTimerRef.current);
    const duration = Math.round((Date.now() - (startTimeRef.current || Date.now())) / 60000);
    try {
      const { data } = await API.post("/interview/session/complete", { sessionId, duration });
      setFinalScore(data.overall);
      streamRef.current?.getTracks().forEach(t => t.stop());
      setPhase("done");
    } catch { toast.error("Failed to complete session."); }
  };

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const progress = interview ? ((currentQ) / interview.questions.length) * 100 : 0;

  /* ── PHASES ── */
  if (phase === "loading") return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}><span className="spin" style={{ width: 40, height: 40 }} /></div>;

  if (phase === "error") return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 48 }}>❌</div>
      <h2>Interview Not Found</h2>
      <p className="muted">This link is invalid or the interview has been closed.</p>
    </div>
  );

  if (phase === "done") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
      <div className="card tc" style={{ maxWidth: 460, width: "100%" }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
        <h2 className="h2 mb2">Interview Complete!</h2>
        <p className="muted mb4">Thank you, {candidate.name}. Your responses have been submitted for review.</p>
        {finalScore !== null && (
          <div style={{ background: "var(--purple-l)", borderRadius: "var(--r-lg)", padding: "20px", marginBottom: 16 }}>
            <div className="sm muted mb1">Your AI Score</div>
            <div style={{ fontSize: 42, fontWeight: 700, color: "var(--purple)" }}>{finalScore}<span style={{ fontSize: 18, fontWeight: 400 }}>/10</span></div>
          </div>
        )}
        <p className="muted sm">The HR team will review your interview and contact you with next steps. You may close this tab.</p>
      </div>
    </div>
  );

  if (phase === "register") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
      <div style={{ maxWidth: 460, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, justifyContent: "center" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--purple)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>H</div>
          <span style={{ fontWeight: 700, fontSize: 18 }}>HireAI</span>
        </div>
        <div className="card">
          <h2 className="h3 mb2">You're invited to interview for</h2>
          <div style={{ background: "var(--purple-l)", borderRadius: "var(--r)", padding: "10px 14px", marginBottom: 20, fontWeight: 600, color: "var(--purple)" }}>{interview?.jobTitle}</div>
          <p className="muted sm mb4">{interview?.questions?.length} questions · AI-powered evaluation · Keep camera + mic on</p>
          <div className="input-group">
            <label className="lbl">Your Full Name</label>
            <input className="inp" placeholder="Rahul Verma" value={candidate.name} onChange={e => setCandidate({ ...candidate, name: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="lbl">Your Email</label>
            <input className="inp" type="email" placeholder="rahul@email.com" value={candidate.email} onChange={e => setCandidate({ ...candidate, email: e.target.value })} />
          </div>
          <div style={{ background: "var(--amber-l)", border: "1px solid #fcd34d", borderRadius: "var(--r)", padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "var(--amber)" }}>
            ⚠ Tab switching is monitored. Please complete the interview without switching tabs.
          </div>
          <button className="btn btn-primary btn-full btn-lg" onClick={startInterview}>
            Start Interview → Allow Camera & Mic
          </button>
        </div>
      </div>
    </div>
  );

  const q = interview.questions[currentQ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Top bar */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--purple)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>H</div>
          <span style={{ fontWeight: 600 }}>HireAI Interview</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {tabWarnings > 0 && <span className="badge br">⚠ {tabWarnings} Tab Warning{tabWarnings > 1 ? "s" : ""}</span>}
          <span className="mono sm muted">⏱ {fmtTime(timer)}</span>
          <span className="badge bp">{candidate.name}</span>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <div className="room-grid">
          {/* LEFT: Video + transcript */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="card" style={{ padding: 16 }}>
              <div className="video-box" style={{ marginBottom: 12 }}>
                <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--r)", position: "absolute", inset: 0 }} />
                <div className="video-label">{candidate.name}</div>
                <div style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", background: "var(--red)" }} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div className="sm muted mb2">Live transcript (speak clearly into mic)</div>
                <div className="transcript-box" style={{ minHeight: 80 }}>
                  {transcript || <span style={{ color: "var(--text3)" }}>Your speech will appear here as you speak...</span>}
                </div>
              </div>

              {/* Type answer fallback */}
              <textarea className="txta" placeholder="Or type your answer here..." style={{ minHeight: 60, marginBottom: 12 }}
                value={transcript} onChange={e => setTranscript(e.target.value)} />

              {/* Controls */}
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
                <div className="ctrl-btn" title={micOn ? "Stop mic" : "Start mic"} onClick={micOn ? stopListening : startListening}>
                  {micOn ? "🔴" : "🎤"}
                </div>
                <div className="ctrl-btn" title="Camera">📷</div>
              </div>

              <button className="btn btn-primary btn-full" disabled={evaluating || !transcript.trim()} onClick={submitAnswer}>
                {evaluating ? <><span className="spin" /> AI evaluating...</> : currentQ + 1 >= interview.questions.length ? "Submit Final Answer" : "Submit Answer & Next Question →"}
              </button>
            </div>
          </div>

          {/* RIGHT: Question panel */}
          <div className="card" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--purple-l)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "var(--purple)" }}>AI</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>HireAI Interviewer</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--green)" }}>
                  <div className="dot-live" />Active
                </div>
              </div>
              <div className="mono sm muted" style={{ marginLeft: "auto" }}>Q{currentQ + 1}/{interview.questions.length} · {fmtTime(qTimer)}</div>
            </div>

            <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>

            {/* Questions list */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0 }}>
              {interview.questions.map((question, i) => (
                <div key={i} className={`qitem ${i === currentQ ? "active" : i < currentQ ? "done" : ""}`}>
                  <div className="qnum">Q{i + 1} · {question.type} · {question.difficulty}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.5 }}>{question.text}</div>
                  {answers[i] && (
                    <div style={{ marginTop: 6, fontSize: 11, color: "var(--purple)", fontWeight: 500 }}>
                      Score: {answers[i].score}/10 — {answers[i].feedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
