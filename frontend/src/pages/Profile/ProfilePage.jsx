import React, { useState } from "react";
import { User, Lock, Mail, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passMsg, setPassMsg] = useState("");
  const [passErr, setPassErr] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg("");
    setProfileErr("");
    try {
      const updated = await api.updateProfile({ full_name: fullName });
      setUser(updated);
      setProfileMsg("Profile name updated successfully!");
    } catch (err) {
      setProfileErr(err.message || "Failed to update profile.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg("");
    setPassErr("");

    if (passwords.newPassword.length < 6) {
      setPassErr("New password must be at least 6 characters.");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPassErr("New passwords do not match.");
      return;
    }

    setSavingPass(true);
    try {
      await api.changePassword({
        current_password: passwords.currentPassword,
        new_password: passwords.newPassword,
      });
      setPassMsg("Password changed successfully!");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPassErr(err.message || "Failed to change password. Verify your current password.");
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="module-page">
      <div className="welcome-section">
        <div>
          <h2>Account Profile & Settings</h2>
          <p>Manage your personal identification, security credentials, and preferences.</p>
        </div>
      </div>

      <div className="profile-layout-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        {/* PERSONAL DETAILS CARD */}
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Profile Information</h3>
              <p>Your primary account identity</p>
            </div>
          </div>

          {profileMsg && (
            <div className="auth-alert success" style={{ marginBottom: "16px" }}>
              <CheckCircle2 size={16} />
              <span>{profileMsg}</span>
            </div>
          )}
          {profileErr && (
            <div className="auth-alert error" style={{ marginBottom: "16px" }}>
              <AlertCircle size={16} />
              <span>{profileErr}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address (Locked)</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  style={{ opacity: 0.7, cursor: "not-allowed" }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Default Currency</label>
              <input
                type="text"
                disabled
                value="Indian Rupee (₹ INR)"
                style={{ opacity: 0.7, cursor: "not-allowed" }}
              />
            </div>

            <button type="submit" className="primary-button" style={{ alignSelf: "flex-start", marginTop: "8px" }}>
              Save Profile Changes
            </button>
          </form>
        </section>

        {/* SECURITY & PASSWORD CARD */}
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Change Password</h3>
              <p>Keep your account secure with strong credentials</p>
            </div>
          </div>

          {passMsg && (
            <div className="auth-alert success" style={{ marginBottom: "16px" }}>
              <CheckCircle2 size={16} />
              <span>{passMsg}</span>
            </div>
          )}
          {passErr && (
            <div className="auth-alert error" style={{ marginBottom: "16px" }}>
              <AlertCircle size={16} />
              <span>{passErr}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="form-group">
              <label>Current Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>New Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={savingPass}
              style={{ alignSelf: "flex-start", marginTop: "8px" }}
            >
              {savingPass ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

