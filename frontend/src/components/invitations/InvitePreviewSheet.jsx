import React, { useState } from "react";
import { Users, CheckCircle2, AlertCircle, ArrowRight, Lock, Mail, User, Phone, X, Eye, EyeOff } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function InvitePreviewSheet({
  invite,
  onJoinSuccess,
  onOpenGroup,
  onClose,
}) {
  const { user, isAuthenticated, login, register } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [declined, setDeclined] = useState(false);

  // Inline Auth State for Unauthenticated Users
  const [showAuthInline, setShowAuthInline] = useState(false);
  const [authMode, setAuthMode] = useState("register"); // 'register' | 'login'
  const [authName, setAuthName] = useState(invite?.invitee_name || "");
  const [authEmail, setAuthEmail] = useState(invite?.invitee_email || "");
  const [authPhone, setAuthPhone] = useState(invite?.invitee_phone || "");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  if (!invite) return null;

  const isAlreadyMember = Boolean(invite.is_already_member);
  const isExpired = Boolean(invite.is_expired);
  const isCancelled = invite.status === "cancelled";

  // Handle Accept & Join
  const handleAccept = async () => {
    if (!isAuthenticated) {
      // Store token so session is never lost
      localStorage.setItem("budget_buddy_pending_invite", invite.token);
      setShowAuthInline(true);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await api.acceptInvitation(invite.token);
      localStorage.removeItem("budget_buddy_pending_invite");
      window.history.replaceState({}, document.title, window.location.pathname.replace(/\/invite\/[a-zA-Z0-9_-]+/, "/"));
      if (onJoinSuccess) {
        onJoinSuccess(res);
      }
    } catch (err) {
      setError(err.message || "Failed to join group. Please try again.");
      setLoading(false);
    }
  };

  // Handle Decline
  const handleDecline = async () => {
    const confirmDecline = window.confirm(
      `Are you sure you want to decline the invitation to join "${invite.group_name}"?`
    );
    if (!confirmDecline) return;

    setLoading(true);
    setError("");
    try {
      await api.declineInvitation(invite.token);
      localStorage.removeItem("budget_buddy_pending_invite");
      window.history.replaceState({}, document.title, window.location.pathname.replace(/\/invite\/[a-zA-Z0-9_-]+/, "/"));
      setDeclined(true);
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      // Even if API errors (e.g. network), dismiss for user gracefully
      setDeclined(true);
      setTimeout(() => {
        if (onClose) onClose();
      }, 1200);
    } finally {
      setLoading(false);
    }
  };

  // Handle Inline Auth Submit
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");

    if (!authEmail.trim() || !authPassword) {
      setAuthError("Please fill in email and password.");
      return;
    }

    if (authMode === "register" && !authName.trim()) {
      setAuthError("Please enter your full name.");
      return;
    }

    if (authPassword.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    setAuthLoading(true);
    try {
      if (authMode === "register") {
        await register(
          authName.trim(),
          authEmail.trim().toLowerCase(),
          authPassword,
          authPhone.trim() || null,
          invite.token
        );
      } else {
        await login(authEmail.trim().toLowerCase(), authPassword);
        // Explicitly accept invite after login
        await api.acceptInvitation(invite.token);
      }

      localStorage.removeItem("budget_buddy_pending_invite");
      window.history.replaceState({}, document.title, window.location.pathname.replace(/\/invite\/[a-zA-Z0-9_-]+/, "/"));

      if (onJoinSuccess) {
        onJoinSuccess({
          group_id: invite.group_id,
          group_name: invite.group_name,
        });
      }
    } catch (err) {
      setAuthError(err.message || "Authentication failed. Please check your credentials.");
      setAuthLoading(false);
    }
  };

  return (
    <div
      className="invite-sheet-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading && !authLoading) {
          if (onClose) onClose();
        }
      }}
    >
      <div className="invite-sheet-card">
        {/* Safe Dismiss close button in header */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            padding: "4px"
          }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* DECLINED STATE */}
        {declined ? (
          <div style={{ padding: "20px 0" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#f1f5f9",
                color: "#64748b",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px",
              }}
            >
              <X size={28} />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1e293b", margin: "0 0 8px" }}>
              Invitation Declined
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#64748b", margin: 0 }}>
              You have declined the invitation to join "{invite.group_name}".
            </p>
          </div>
        ) : isExpired || isCancelled ? (
          /* EXPIRED OR CANCELLED STATE */
          <div style={{ padding: "16px 0" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#fef2f2",
                color: "#ef4444",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px",
              }}
            >
              <AlertCircle size={28} />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1e293b", margin: "0 0 8px" }}>
              {isCancelled ? "Invitation Cancelled" : "Invitation Expired"}
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#64748b", margin: "0 0 20px" }}>
              {isCancelled
                ? `This invitation to join "${invite.group_name}" has been cancelled by the group admin.`
                : `This invitation link to join "${invite.group_name}" has expired. Please ask the group admin for a new link.`}
            </p>
            <button
              type="button"
              className="invite-btn-decline"
              style={{ width: "100%", padding: "12px 20px" }}
              onClick={onClose}
            >
              Dismiss
            </button>
          </div>
        ) : isAlreadyMember ? (
          /* ALREADY A MEMBER STATE */
          <div style={{ padding: "16px 0" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#ede9fe",
                color: "#6366f1",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px",
              }}
            >
              <Users size={28} />
            </div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
              Already in "{invite.group_name}"
            </h2>
            <p style={{ fontSize: "0.92rem", color: "#475569", margin: "0 0 24px", lineHeight: 1.5 }}>
              You are already an active member of this group. Tap below to access your shared expenses and balances.
            </p>
            <button
              type="button"
              className="invite-btn-accept"
              style={{ width: "100%", padding: "14px 20px" }}
              onClick={() => {
                if (onOpenGroup) onOpenGroup(invite.group_id);
              }}
            >
              <ArrowRight size={18} />
              <span>Open Group Dashboard</span>
            </button>
          </div>
        ) : showAuthInline ? (
          /* INLINE AUTH FORM FOR UNAUTHENTICATED USERS */
          <div style={{ textAlign: "left", padding: "4px 0" }}>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "#ede9fe",
                  color: "#6366f1",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 10px",
                }}
              >
                <Users size={24} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>
                Join "{invite.group_name}"
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
                {authMode === "register" ? "Create an account to join instantly" : "Sign in to join instantly"}
              </p>
            </div>

            {/* Toggle Login / Register */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                background: "#f1f5f9",
                borderRadius: "10px",
                padding: "3px",
                marginBottom: "16px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setAuthError("");
                }}
                style={{
                  padding: "8px",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.84rem",
                  cursor: "pointer",
                  background: authMode === "register" ? "#ffffff" : "transparent",
                  color: authMode === "register" ? "#6366f1" : "#64748b",
                  boxShadow: authMode === "register" ? "0 2px 5px rgba(0,0,0,0.06)" : "none",
                }}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                }}
                style={{
                  padding: "8px",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.84rem",
                  cursor: "pointer",
                  background: authMode === "login" ? "#ffffff" : "transparent",
                  color: authMode === "login" ? "#6366f1" : "#64748b",
                  boxShadow: authMode === "login" ? "0 2px 5px rgba(0,0,0,0.06)" : "none",
                }}
              >
                Sign In
              </button>
            </div>

            {authError && (
              <div className="auth-alert error" style={{ marginBottom: "12px", fontSize: "0.82rem" }}>
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {authMode === "register" && (
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Your Name
                  </label>
                  <div style={{ position: "relative" }}>
                    <User size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "12px" }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "12px" }} />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "12px" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    style={{ width: "100%", padding: "10px 36px 10px 36px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: "10px", top: "10px", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="invite-btn-decline"
                  onClick={() => setShowAuthInline(false)}
                  style={{ flex: 1, padding: "12px" }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="invite-btn-accept"
                  disabled={authLoading}
                  style={{ flex: 2, padding: "12px" }}
                >
                  {authLoading ? "Please wait..." : authMode === "register" ? "Join Group" : "Sign In & Join"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* STANDARD DIRECT PREVIEW SHEET (MATCHES ATTACHED SCREENSHOT EXACTLY) */
          <div>
            {/* Top Avatar Icon matching reference screenshot */}
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#ede9fe",
                color: "#6366f1",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 20px",
              }}
            >
              <Users size={28} />
            </div>

            {/* Title */}
            <h2
              style={{
                fontSize: "1.45rem",
                fontWeight: 800,
                color: "#0f172a",
                margin: "0 0 14px",
                letterSpacing: "-0.3px",
              }}
            >
              Join "{invite.group_name}"?
            </h2>

            {/* Description matching screenshot */}
            <p
              style={{
                fontSize: "0.96rem",
                color: "#475569",
                lineHeight: 1.55,
                margin: "0 0 28px",
              }}
            >
              <strong style={{ color: "#0f172a" }}>{invite.invited_by_name || "A friend"}</strong> invited you to join their{" "}
              <strong style={{ color: "#0f172a" }}>{invite.group_type || "Friends"}</strong> group on Budget Buddy to share expenses and split balances.
            </p>

            {error && (
              <div className="auth-alert error" style={{ marginBottom: "16px", textAlign: "left" }}>
                <span>{error}</span>
              </div>
            )}

            {/* Bottom Actions Row matching reference screenshot */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                type="button"
                className="invite-btn-decline"
                disabled={loading}
                onClick={handleDecline}
                style={{
                  flex: "1 1 0%",
                  background: "#ffffff",
                  border: "1.5px solid #e2e8f0",
                  color: "#0f172a",
                  borderRadius: "14px",
                  padding: "14px 18px",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                Decline
              </button>

              <button
                type="button"
                className="invite-btn-accept"
                disabled={loading}
                onClick={handleAccept}
                style={{
                  flex: "1.8 1 0%",
                  background: "#6366f1",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: "14px",
                  padding: "14px 20px",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
                }}
              >
                <CheckCircle2 size={18} />
                <span>{loading ? "Joining..." : "Accept & Join Group"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
