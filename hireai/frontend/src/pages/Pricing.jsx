import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const PLANS = [
  {
    id: "starter", label: "Starter",
    price: "₹999", period: "one-time",
    credits: "20 interviews",
    features: ["20 AI interview credits", "PDF reports", "Basic scoring", "Email support"],
    missing: ["Sentiment analysis", "Face detection"],
  },
  {
    id: "pro", label: "Professional", featured: true,
    price: "₹2,999", period: "per month",
    credits: "Unlimited interviews",
    features: ["Unlimited interviews", "PDF reports", "Sentiment analysis", "Anti-cheat system", "Priority support", "Analytics dashboard"],
    missing: [],
  },
  {
    id: null, label: "Enterprise",
    price: "Custom", period: "talk to us",
    credits: "Unlimited + white-label",
    features: ["Everything in Pro", "SSO / SAML login", "Custom AI prompts", "Dedicated account manager", "SLA guarantee", "On-prem deployment"],
    missing: [],
  },
];

export default function Pricing() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);

  const pay = async (planId) => {
    if (!planId) return toast("Contact us at hello@hireai.in");
    setLoading(planId);
    try {
      const { data } = await API.post("/payment/create-order", { planId });

      const options = {
        key:         data.keyId,
        amount:      data.amount,
        currency:    data.currency,
        name:        "HireAI",
        description: `${data.planLabel} Plan`,
        order_id:    data.orderId,
        prefill:     { name: user?.name, email: user?.email },
        theme:       { color: "#6b5de6" },
        handler: async (response) => {
          try {
            await API.post("/payment/verify", {
              orderId:   response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              planId,
            });
            toast.success("Payment successful! Credits added.");
            await refreshUser();
            navigate("/dashboard");
          } catch { toast.error("Payment verification failed. Contact support."); }
        },
        modal: { ondismiss: () => setLoading(null) },
      };

      if (!window.Razorpay) return toast.error("Razorpay not loaded. Check your internet.");
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => toast.error("Payment failed. Try again."));
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment initiation failed.");
    } finally { setLoading(null); }
  };

  return (
    <div style={{ padding: 28 }}>
      <div className="tc mb6">
        <h2 className="h2 mb2">Simple, Transparent Pricing</h2>
        <p className="muted">Start free with 5 credits. Upgrade anytime.</p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--purple-l)", borderRadius: 99, padding: "6px 16px", marginTop: 12, fontSize: 13, color: "var(--purple)" }}>
          <span>Your current plan:</span>
          <strong style={{ textTransform: "capitalize" }}>{user?.plan}</strong>
          <span>·</span>
          <strong>{user?.credits >= 9999 ? "Unlimited" : user?.credits} credits remaining</strong>
        </div>
      </div>

      <div className="g3 mb6">
        {PLANS.map((plan) => (
          <div key={plan.label} className="card" style={{ border: plan.featured ? "2px solid var(--purple)" : undefined, position: "relative" }}>
            {plan.featured && (
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--purple)", color: "#fff", borderRadius: 99, padding: "3px 14px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                Most Popular
              </div>
            )}
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{plan.label}</div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 12 }}>{plan.credits}</div>
            <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 2 }}>{plan.price}</div>
            <div className="sm muted" style={{ marginBottom: 20 }}>{plan.period}</div>

            {plan.features.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "5px 0", borderBottom: "1px solid var(--border)", color: "var(--text2)" }}>
                <span style={{ color: "var(--green)", fontWeight: 600, fontSize: 12 }}>✓</span> {f}
              </div>
            ))}
            {plan.missing.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "5px 0", borderBottom: "1px solid var(--border)", color: "var(--text3)" }}>
                <span style={{ fontSize: 12 }}>✗</span> {f}
              </div>
            ))}

            <button
              className={`btn ${plan.featured ? "btn-primary" : "btn-outline"} btn-full`}
              style={{ marginTop: 20 }}
              disabled={loading === plan.id}
              onClick={() => pay(plan.id)}
            >
              {loading === plan.id ? <span className="spin" /> : plan.id ? `Get ${plan.label}` : "Contact Sales"}
            </button>
          </div>
        ))}
      </div>

      {/* How payment works */}
      <div className="card">
        <h3 className="h3 mb4">How Payment Works (Razorpay)</h3>
        <div className="g4">
          {[
            { n: "1", title: "Click Plan",    desc: "Frontend calls /api/payment/create-order" },
            { n: "2", title: "Order Created", desc: "Backend creates Razorpay order, gets order_id" },
            { n: "3", title: "Pay Securely",  desc: "Razorpay popup opens — UPI, Card, Net Banking" },
            { n: "4", title: "Credits Added", desc: "Webhook fires → MongoDB credits updated instantly" },
          ].map(({ n, title, desc }) => (
            <div key={n} style={{ background: "var(--surface2)", borderRadius: "var(--r)", padding: 14, textAlign: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--purple)", color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 13 }}>{n}</div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{title}</div>
              <div className="sm muted">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
