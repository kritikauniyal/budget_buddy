import React from "react";
import { Wallet, Users, ArrowRight, CheckCircle2, Sparkles, X } from "lucide-react";

export default function OnboardingModal({ onSelectPersonal, onSelectGroup, onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: "650px", textAlign: "center", padding: "30px 24px" }}>
        <div style={{
          width: "56px",
          height: "56px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, #7557E8, #22B8A0)",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          margin: "0 auto 14px",
          boxShadow: "0 8px 20px rgba(117, 87, 232, 0.25)"
        }}>
          <Sparkles size={28} />
        </div>

        <h2 style={{ margin: "0 0 6px", fontSize: "1.45rem", fontWeight: 700 }}>
          Welcome to Budget Buddy!
        </h2>
        <p style={{ margin: "0 auto 24px", maxWidth: "480px", color: "#64748b", fontSize: "0.9rem" }}>
          How would you like to get started today? Choose your primary focus below (you can use both anytime).
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", textAlign: "left", marginBottom: "20px" }}>
          {/* Card 1: Personal Expense Tracking */}
          <div
            onClick={onSelectPersonal}
            style={{
              padding: "20px",
              borderRadius: "16px",
              border: "2px solid #e2e8f0",
              background: "#f8fafc",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#22B8A0";
              e.currentTarget.style.background = "rgba(34, 184, 160, 0.04)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(34, 184, 160, 0.15)",
                color: "#0f766e",
                display: "grid",
                placeItems: "center",
                marginBottom: "12px"
              }}>
                <Wallet size={22} />
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: "1.05rem", fontWeight: 700 }}>
                Personal Expense Tracking
              </h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b", lineHeight: 1.4 }}>
                Track personal income, daily expenses, monthly budget limits, and financial analytics.
              </p>
            </div>

            <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "6px", color: "#0f766e", fontWeight: 600, fontSize: "0.85rem" }}>
              <span>Start Personal Tracking</span>
              <ArrowRight size={15} />
            </div>
          </div>

          {/* Card 2: Create or Join a Group */}
          <div
            onClick={onSelectGroup}
            style={{
              padding: "20px",
              borderRadius: "16px",
              border: "2px solid #e2e8f0",
              background: "#f8fafc",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#7557E8";
              e.currentTarget.style.background = "rgba(117, 87, 232, 0.04)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(117, 87, 232, 0.15)",
                color: "#7557E8",
                display: "grid",
                placeItems: "center",
                marginBottom: "12px"
              }}>
                <Users size={22} />
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: "1.05rem", fontWeight: 700 }}>
                Create or Join a Group
              </h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b", lineHeight: 1.4 }}>
                Split bills with roommates, friends, or family. Add contacts, track who owes whom, and settle up.
              </p>
            </div>

            <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "6px", color: "#7557E8", fontWeight: 600, fontSize: "0.85rem" }}>
              <span>Start Group Expense</span>
              <ArrowRight size={15} />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "#94a3b8",
            fontSize: "0.82rem",
            cursor: "pointer"
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
