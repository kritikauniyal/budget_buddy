import React, { useState, useEffect } from "react";
import { Wallet, Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle, Users, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
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

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("invite");
    if (token) {
      setInviteToken(token);
      setIsRegister(true); // Default to register for new invites
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

    if (isRegister) {
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
      if (isRegister) {
        await register(
          formData.fullName,
          formData.email,
          formData.password,
          formData.phone || null,
          inviteToken || null
        );
      } else {
        await login(formData.email, formData.password);
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please verify your credentials.");
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
              e.target.style.display = 'none';
              const fallback = document.getElementById('auth-fallback-icon');
              if (fallback) fallback.style.display = 'grid';
            }}
          />
          <div id="auth-fallback-icon" className="auth-brand-icon" style={{ display: 'none' }}>
            <Wallet size={28} />
          </div>
          <h1>Budget Buddy</h1>
          <p className="auth-subtitle">
            {inviteDetails
              ? `You're invited to join '${inviteDetails.group_name}'!`
              : isRegister
              ? "Plan Smart • Spend Better • Live Better"
              : "Sign in to access your real-time financial dashboard"}
          </p>
        </div>

        {inviteDetails && (
          <div style={{
            background: "linear-gradient(135deg, rgba(117, 87, 232, 0.15), rgba(34, 184, 160, 0.15))",
            border: "1px solid rgba(117, 87, 232, 0.3)",
            borderRadius: "12px",
            padding: "12px 14px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.88rem",
            color: "#4f46e5"
          }}>
            <Users size={22} style={{ flexShrink: 0 }} />
            <div>
              <strong>{inviteDetails.invited_by_name}</strong> invited you to join the group <strong>{inviteDetails.group_name}</strong> ({inviteDetails.group_type}).
              <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px" }}>
                {isRegister ? "Create an account" : "Sign in"} below to automatically accept and view shared expenses.
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

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
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
            <label>Password</label>
            <div className="input-with-icon">
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

          {isRegister && (
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
              : isRegister
              ? (inviteDetails ? `Join ${inviteDetails.group_name}` : "Create Account")
              : "Sign In to Dashboard"}
            <ArrowRight size={17} />
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <div className="auth-footer">
          {isRegister ? (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => {
                  setIsRegister(false);
                  setError("");
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
                  setIsRegister(true);
                  setError("");
                }}
              >
                Create Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
