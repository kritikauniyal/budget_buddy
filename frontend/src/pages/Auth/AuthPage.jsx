import React, { useState, useEffect } from "react";
import {
  Wallet,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  Users,
  CheckCircle2,
  ArrowRight,
  KeyRound,
  ArrowLeft
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register' | 'forgot'
  const [showPassword, setShowPassword] = useState(false);

  // Invitation info if invited via link
  const [inviteToken, setInviteToken] = useState("");
  const [inviteDetails, setInviteDetails] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Forgot Password specific state
  const [forgotStep, setForgotStep] = useState(1); // 1 = request code, 2 = enter code & reset
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetHint, setResetHint] = useState("");

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("invite");
    if (token) {
      setInviteToken(token);
      setAuthMode("register"); // Default to register for new invites
      api.inspectInvitation(token)
        .then((data) => {
          setInviteDetails(data);
          if (data.invitee_email) {
            setFormData((prev) => ({ ...prev, email: data.invitee_email }));
          }
          if (data.invitee_name) {
            setFormData((prev) => ({ ...prev, fullName: data.invitee_name }));
          }
          if (data.invitee_phone) {
            setFormData((prev) => ({ ...prev, phone: data.invitee_phone }));
          }
        })
        .catch((err) => {
          console.warn("Could not inspect invitation:", err);
        });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (authMode === "register") {
      if (!formData.fullName.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);
    try {
      if (authMode === "register") {
        await register(
          formData.fullName,
          formData.email,
          formData.password,
          formData.phone || null,
          inviteToken || null
        );
      } else if (authMode === "login") {
        await login(formData.email, formData.password);
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetCode = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await api.forgotPassword(formData.email.trim());
      setSuccessMsg(res.message || "Reset instructions prepared.");
      if (res.reset_code) {
        setResetCode(res.reset_code);
        setResetHint(res.reset_code);
      }
      setForgotStep(2);
    } catch (err) {
      setError(err.message || "Failed to find account or generate reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetCode.trim()) {
      setError("Please enter the verification code.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await api.resetPassword(formData.email.trim(), resetCode.trim(), newPassword);
      setSuccessMsg(res.message || "Password successfully reset! Please sign in.");
      setAuthMode("login");
      setForgotStep(1);
      setResetCode("");
      setNewPassword("");
      setConfirmNewPassword("");
      setFormData((prev) => ({ ...prev, password: "" }));
    } catch (err) {
      setError(err.message || "Failed to reset password. Please check the reset code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <img
            src="/api/logo.png"
            alt="Budget Buddy Logo"
            className="auth-main-logo"
            onError={(e) => {
              e.target.style.display = "none";
              const fallback = document.getElementById("auth-fallback-icon");
              if (fallback) fallback.style.display = "grid";
            }}
          />
          <div id="auth-fallback-icon" className="auth-brand-icon" style={{ display: "none" }}>
            <Wallet size={28} />
          </div>
          <h1>Budget Buddy</h1>
          <p className="auth-subtitle">
            {inviteDetails
              ? `You're invited to join '${inviteDetails.group_name}'!`
              : authMode === "register"
              ? "Plan Smart • Spend Better • Live Better"
              : authMode === "forgot"
              ? "Account Recovery & Password Reset"
              : "Sign in to access your financial dashboard"}
          </p>
        </div>

        {inviteDetails && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(117, 87, 232, 0.15), rgba(34, 184, 160, 0.15))",
              border: "1px solid rgba(117, 87, 232, 0.3)",
              borderRadius: "12px",
              padding: "12px 14px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "0.88rem",
              color: "#4f46e5",
            }}
          >
            <Users size={22} style={{ flexShrink: 0 }} />
            <div>
              <strong>{inviteDetails.invited_by_name}</strong> invited you to join the group <strong>{inviteDetails.group_name}</strong> ({inviteDetails.group_type}).
              <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px" }}>
                {authMode === "register" ? "Create an account" : "Sign in"} below to automatically accept and view shared expenses.
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="auth-alert error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert" style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", fontSize: "0.88rem" }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORGOT PASSWORD FORM */}
        {authMode === "forgot" ? (
          <div>
            {forgotStep === 1 ? (
              <form onSubmit={handleRequestResetCode} className="auth-form">
                <p style={{ fontSize: "0.88rem", color: "#64748b", marginBottom: "14px" }}>
                  Enter your registered email address and we'll send you a verification code to reset your password.
                </p>
                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={18} className="input-icon" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <button type="submit" className="primary-button auth-submit-btn" disabled={loading}>
                  {loading ? "Generating code..." : "Send Verification Code"}
                  <ArrowRight size={17} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="auth-form">
                {resetHint && (
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "10px 12px", borderRadius: "8px", color: "#1e40af", fontSize: "0.85rem", marginBottom: "12px" }}>
                    Your verification code is: <strong>{resetHint}</strong>
                  </div>
                )}

                <div className="form-group">
                  <label>Verification Code</label>
                  <div className="input-with-icon">
                    <KeyRound size={18} className="input-icon" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 018B6A"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>New Password (min 6 characters)</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Confirm new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="primary-button auth-submit-btn" disabled={loading}>
                  {loading ? "Resetting..." : "Save New Password"}
                  <CheckCircle2 size={17} />
                </button>
              </form>
            )}

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <button
                type="button"
                className="auth-switch-btn"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                onClick={() => {
                  setAuthMode("login");
                  setError("");
                  setSuccessMsg("");
                }}
              >
                <ArrowLeft size={15} /> Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          /* LOGIN & REGISTRATION FORMS */
          <form onSubmit={handleSubmit} className="auth-form">
            {authMode === "register" && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <div className="input-with-icon">
                    <User size={18} className="input-icon" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Phone Number (Optional)</label>
                  <div className="input-with-icon">
                    <Phone size={18} className="input-icon" />
                    <input
                      type="tel"
                      placeholder="e.g. +91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ margin: 0 }}>Password</label>
                {authMode === "login" && (
                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#7557E8",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      padding: 0
                    }}
                    onClick={() => {
                      setAuthMode("forgot");
                      setForgotStep(1);
                      setError("");
                      setSuccessMsg("");
                    }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="input-with-icon" style={{ marginTop: "6px" }}>
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {authMode === "register" && (
              <div className="form-group">
                <label>Confirm Password</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="primary-button auth-submit-btn"
              disabled={loading}
            >
              {loading
                ? "Authenticating..."
                : authMode === "register"
                ? (inviteDetails ? `Join ${inviteDetails.group_name}` : "Create Account")
                : "Sign In to Dashboard"}
              <ArrowRight size={17} />
            </button>
          </form>
        )}

        {authMode !== "forgot" && (
          <>
            <div className="auth-divider">
              <span>OR</span>
            </div>

            <div className="auth-footer">
              {authMode === "register" ? (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="auth-switch-btn"
                    onClick={() => {
                      setAuthMode("login");
                      setError("");
                      setSuccessMsg("");
                    }}
                  >
                    Sign In
                  </button>
                </p>
              ) : (
                <p>
                  New to Budget Buddy?{" "}
                  <button
                    type="button"
                    className="auth-switch-btn"
                    onClick={() => {
                      setAuthMode("register");
                      setError("");
                      setSuccessMsg("");
                    }}
                  >
                    Create Account
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
