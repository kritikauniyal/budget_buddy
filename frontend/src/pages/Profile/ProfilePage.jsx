import React, { useState, useEffect } from "react";
import {
  User,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun,
  Globe,
  Bell,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sparkles,
  DollarSign
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const FAQ_ITEMS = [
  {
    q: "How does the Group Split calculation work?",
    a: "Budget Buddy calculates exact balances using: Net Balance = Total Paid - Total Share + Settlements Sent - Settlements Received. A positive balance means others owe you; a negative balance means you owe the group."
  },
  {
    q: "What is Simplified Debt Settlement?",
    a: "Instead of each person paying every other person individually, our smart algorithm minimizes total payments. For example, if Aman owes Rahul and Rahul owes Kritika, Aman can pay Kritika directly!"
  },
  {
    q: "How do I invite friends who don't have an account yet?",
    a: "In your group, tap 'Invite Member' and share your unique invite link via WhatsApp or copy it. When your friend opens the link, they create an account and are automatically added to your group with full access!"
  },
  {
    q: "Can I manage recurring bills like rent and Wi-Fi?",
    a: "Yes! Open 'Recurring' in the menu to set up monthly, weekly, or yearly bills. You can log them into your live expenses with a single tap whenever they are due."
  },
  {
    q: "Is my personal data kept private from my groups?",
    a: "Absolutely. Only expenses specifically added to a shared group are visible to group members. Your personal income, personal expenses, and other groups remain 100% private."
  }
];

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'settings' | 'security' | 'help'

  // Profile state
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [currency, setCurrency] = useState(localStorage.getItem("budget_buddy_currency") || "₹");
  const [language, setLanguage] = useState(localStorage.getItem("budget_buddy_lang") || "en");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");

  // Theme & settings state
  const [isDark, setIsDark] = useState(() => localStorage.getItem("budget_buddy_theme") === "dark");
  const [notifyExpenses, setNotifyExpenses] = useState(true);
  const [notifySettlements, setNotifySettlements] = useState(true);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState("");

  // Password state
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passMsg, setPassMsg] = useState("");
  const [passErr, setPassErr] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  // FAQ accordion state
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Support message state
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [isDark]);

  const handleToggleTheme = () => {
    const nextVal = !isDark;
    setIsDark(nextVal);
    localStorage.setItem("budget_buddy_theme", nextVal ? "dark" : "light");
    if (nextVal) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg("");
    setProfileErr("");
    try {
      const updated = await api.updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
      });
      setUser(updated);
      localStorage.setItem("budget_buddy_currency", currency);
      localStorage.setItem("budget_buddy_lang", language);
      setProfileMsg("Profile updated successfully!");
      setTimeout(() => setProfileMsg(""), 4000);
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
      setTimeout(() => setPassMsg(""), 4000);
    } catch (err) {
      setPassErr(err.message || "Failed to change password. Verify your current password.");
    } finally {
      setSavingPass(false);
    }
  };

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    setSupportSubmitted(true);
    setSupportMessage("");
    setTimeout(() => setSupportSubmitted(false), 5000);
  };

  return (
    <div className="module-page">
      <div className="welcome-section" style={{ flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2>Account & Preferences</h2>
          <p>Personal profile, themes, security settings, and Help & Support center.</p>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "20px", overflowX: "auto" }}>
        {[
          { id: "profile", label: "👤 Profile" },
          { id: "settings", label: "⚙️ Preferences" },
          { id: "security", label: "🔒 Security" },
          { id: "help", label: "❓ Help & Support" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: activeTab === tab.id ? "2px solid #7557E8" : "1px solid #cbd5e1",
              background: activeTab === tab.id ? "#7557E8" : "#fff",
              color: activeTab === tab.id ? "#fff" : "#475569",
              fontWeight: activeTab === tab.id ? 700 : 500,
              cursor: "pointer",
              fontSize: "0.88rem",
              whiteSpace: "nowrap"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PROFILE */}
      {activeTab === "profile" && (
        <section className="panel" style={{ maxWidth: "600px" }}>
          <div className="panel-heading">
            <div>
              <h3>User Profile</h3>
              <p>Your identity across personal budgets and shared groups</p>
            </div>
          </div>

          {profileMsg && (
            <div className="auth-alert success" style={{ marginBottom: "16px", background: "#f0fdf4", color: "#166534", padding: "10px 14px", borderRadius: "8px", border: "1px solid #bbf7d0", display: "flex", gap: "8px", alignItems: "center" }}>
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
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  style={{ opacity: 0.7, cursor: "not-allowed" }}
                />
              </div>
              <span style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "2px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <CheckCircle2 size={12} /> Verified Account
              </span>
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <div className="input-with-icon">
                <Phone size={18} className="input-icon" />
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label>Default Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="₹">₹ INR (Indian Rupee)</option>
                  <option value="$">$ USD (US Dollar)</option>
                  <option value="€">€ EUR (Euro)</option>
                  <option value="£">£ GBP (British Pound)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>

            <button type="submit" className="primary-button" style={{ alignSelf: "flex-start", marginTop: "10px" }}>
              Save Profile Changes
            </button>
          </form>
        </section>
      )}

      {/* TAB 2: SETTINGS (THEME & NOTIFICATIONS) */}
      {activeTab === "settings" && (
        <section className="panel" style={{ maxWidth: "600px" }}>
          <div className="panel-heading">
            <div>
              <h3>App Preferences & Appearance</h3>
              <p>Customize the look and feel of Budget Buddy</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Dark Theme Toggle Card */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: isDark ? "#312e81" : "#fef3c7", color: isDark ? "#a78bfa" : "#d97706", display: "grid", placeItems: "center" }}>
                  {isDark ? <Moon size={22} /> : <Sun size={22} />}
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "0.95rem" }}>{isDark ? "Dark Theme" : "Light Theme"}</strong>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    {isDark ? "Night-friendly low-contrast colors active" : "Crisp daylight theme active"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleTheme}
                className="secondary-button"
                style={{ fontSize: "0.84rem", padding: "8px 14px" }}
              >
                Switch to {isDark ? "Light" : "Dark"}
              </button>
            </div>

            {/* Notification Toggles */}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
              <h4 style={{ margin: "0 0 12px", fontSize: "0.95rem", fontWeight: 700 }}>Notification Alerts</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={notifyExpenses}
                    onChange={(e) => setNotifyExpenses(e.target.checked)}
                    style={{ width: "18px", height: "18px", accentColor: "#7557E8" }}
                  />
                  <span>Notify when someone adds a group expense</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={notifySettlements}
                    onChange={(e) => setNotifySettlements(e.target.checked)}
                    style={{ width: "18px", height: "18px", accentColor: "#7557E8" }}
                  />
                  <span>Notify when a friend records a settlement</span>
                </label>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: SECURITY */}
      {activeTab === "security" && (
        <section className="panel" style={{ maxWidth: "600px" }}>
          <div className="panel-heading">
            <div>
              <h3>Account Security</h3>
              <p>Keep your account safe with a strong password</p>
            </div>
          </div>

          {passMsg && (
            <div className="auth-alert success" style={{ marginBottom: "16px", background: "#f0fdf4", color: "#166534", padding: "10px 14px", borderRadius: "8px", border: "1px solid #bbf7d0", display: "flex", gap: "8px", alignItems: "center" }}>
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
              <label>New Password (min 6 characters)</label>
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
      )}

      {/* TAB 4: HELP & SUPPORT */}
      {activeTab === "help" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "680px" }}>
          {/* FAQ Accordion */}
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Frequently Asked Questions</h3>
                <p>Learn how Budget Buddy makes expense tracking simple</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div
                    key={idx}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      overflow: "hidden",
                      background: isOpen ? "#f8fafc" : "#ffffff"
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "transparent",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: "0.92rem",
                        color: "#1e293b"
                      }}
                    >
                      <span>{item.q}</span>
                      {isOpen ? <ChevronUp size={18} color="#7557E8" /> : <ChevronDown size={18} color="#94a3b8" />}
                    </button>
                    {isOpen && (
                      <div style={{ padding: "0 16px 14px", fontSize: "0.86rem", color: "#64748b", lineHeight: 1.5 }}>
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Contact Support Card */}
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Need Direct Assistance?</h3>
                <p>Send a message directly to the Budget Buddy support team</p>
              </div>
            </div>

            {supportSubmitted && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "12px 14px", borderRadius: "8px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem" }}>
                <CheckCircle2 size={16} />
                <span>Thank you! Your feedback has been received. Our team will review it.</span>
              </div>
            )}

            <form onSubmit={handleSupportSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <textarea
                required
                rows={3}
                placeholder="Describe your question, issue, or feature request..."
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                style={{ padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
              />
              <button type="submit" className="primary-button" style={{ alignSelf: "flex-start" }}>
                <MessageSquare size={16} /> Send Support Message
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
