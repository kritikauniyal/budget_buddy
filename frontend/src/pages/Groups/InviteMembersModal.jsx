import React, { useState, useEffect } from "react";
import { X, UserPlus, Smartphone, Share2, Copy, Check, MessageSquare, Mail, Trash2, Send } from "lucide-react";
import api from "../../services/api";

export default function InviteMembersModal({ group, onClose, onMembersInvited }) {
  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [existingInvites, setExistingInvites] = useState([]);
  const [universalInvite, setUniversalInvite] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedToken, setCopiedToken] = useState(null);
  const [notice, setNotice] = useState("");

  const loadExistingInvites = async () => {
    try {
      const data = await api.getGroupInvitations(group.id);
      setExistingInvites(data || []);
    } catch (err) {
      console.warn("Could not load invitations:", err);
    }
  };

  useEffect(() => {
    if (group && group.id) {
      loadExistingInvites();
      api.getGroupShareLink(group.id)
        .then((data) => setUniversalInvite(data))
        .catch((err) => console.warn("Could not load share link:", err));
    }
  }, [group]);

  const formatShareUrl = (token) => {
    if (!token) return "";
    return `${window.location.origin}/?invite=${token}`;
  };

  const getWhatsAppShareUrl = (token, phoneVal = "") => {
    const cleanPhone = phoneVal ? phoneVal.replace(/[^0-9]/g, "") : "";
    const link = formatShareUrl(token);
    const msg = `👋 Hi! Join our group '${group.name}' on Budget Buddy to share expenses and split bills!\n\n👉 Click this link to join:\n${link}`;
    return cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  // Contact Picker API
  const handleImportContacts = async () => {
    setNotice("");
    if ("contacts" in navigator && "ContactsManager" in window) {
      try {
        const props = ["name", "email", "tel"];
        const selected = await navigator.contacts.select(props, { multiple: true });
        if (selected && selected.length > 0) {
          const imported = selected.map((c) => ({
            name: c.name && c.name[0] ? c.name[0] : "",
            email: c.email && c.email[0] ? c.email[0] : "",
            phone: c.tel && c.tel[0] ? c.tel[0] : "",
          })).filter((c) => c.email || c.phone);

          setContacts((prev) => [...prev, ...imported]);
          setNotice(`Imported ${imported.length} contacts! Click 'Send Invitations' below.`);
        }
      } catch (err) {
        setNotice("Contact picker was cancelled.");
      }
    } else {
      setNotice("Direct device contact picker is only available on supported mobile browsers. Use the manual fields below.");
    }
  };

  const handleAddManualContact = (e) => {
    e.preventDefault();
    if (!email && !phone) {
      setError("Please provide an email or phone number.");
      return;
    }
    setError("");
    setContacts((prev) => [
      ...prev,
      {
        name: name.trim() || email.split("@")[0] || phone,
        email: email.trim(),
        phone: phone.trim(),
      },
    ]);
    setName("");
    setEmail("");
    setPhone("");
  };

  const handleSendBatchInvites = async () => {
    if (contacts.length === 0) {
      setError("Please add at least one friend to invite.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.inviteGroupMembers(group.id, { contacts });
      setContacts([]);
      setNotice("Invitations recorded successfully! Share the links below.");
      await loadExistingInvites();
      if (onMembersInvited) {
        onMembersInvited();
      }
    } catch (err) {
      setError(err.message || "Failed to send invitations.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (token) => {
    const url = formatShareUrl(token);
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleNativeShare = (invite) => {
    const url = formatShareUrl(invite.token);
    const text = `Join my group '${group.name}' on Budget Buddy to share expenses and track balances! Click here:\n${url}`;
    if (navigator.share) {
      navigator.share({
        title: `Join ${group.name} on Budget Buddy`,
        text,
        url,
      }).catch(() => {});
    } else {
      handleCopyLink(invite.token);
    }
  };

  const handleRevokeInvite = async (invitationId) => {
    try {
      await api.cancelInvitation(invitationId);
      setExistingInvites((prev) => prev.filter((i) => i.id !== invitationId));
    } catch (err) {
      setError(err.message || "Could not revoke invitation.");
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: "620px" }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="modal-icon-badge" style={{ background: "rgba(117, 87, 232, 0.12)", color: "#7557E8" }}>
              <UserPlus size={22} />
            </div>
            <div>
              <h3>Invite Friends to {group.name}</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                Add members via contacts or shareable invitation links
              </p>
            </div>
          </div>
          <button className="modal-close-btn" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="auth-alert error" style={{ margin: "14px 20px 0" }}>
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div style={{ margin: "14px 20px 0", fontSize: "0.82rem", color: "#0f766e", background: "#f0fdf4", padding: "8px 12px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
            {notice}
          </div>
        )}

        <div className="modal-body" style={{ maxHeight: "68vh", overflowY: "auto", padding: "18px 20px" }}>
          {/* Universal WhatsApp & Direct Share Link Card */}
          <div style={{
            background: "linear-gradient(135deg, rgba(37, 211, 102, 0.08), rgba(117, 87, 232, 0.08))",
            border: "1px solid rgba(37, 211, 102, 0.35)",
            borderRadius: "12px",
            padding: "14px 16px",
            marginBottom: "18px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#25D366", color: "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <MessageSquare size={16} />
                </div>
                <div>
                  <strong style={{ fontSize: "0.92rem", color: "#0f172a", display: "block" }}>Quick Group Invite Link</strong>
                  <span style={{ fontSize: "0.76rem", color: "#64748b" }}>Anyone with this link can tap to join {group.name}</span>
                </div>
              </div>

            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "10px", flexWrap: "wrap" }}>
              <input
                type="text"
                readOnly
                value={formatShareUrl(universalInvite?.token || "")}
                style={{
                  flex: "1 1 200px",
                  fontSize: "0.82rem",
                  padding: "8px 12px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  color: "#334155"
                }}
              />
              <button
                type="button"
                onClick={() => handleCopyLink(universalInvite?.token)}
                className="secondary-button"
                style={{ padding: "8px 12px", minWidth: "auto", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                {copiedToken === universalInvite?.token ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                <span>{copiedToken === universalInvite?.token ? "Copied!" : "Copy Link"}</span>
              </button>

              <a
                href={getWhatsAppShareUrl(universalInvite?.token || "")}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#25D366",
                  color: "#ffffff",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 2px 6px rgba(37, 211, 102, 0.25)"
                }}
              >
                <MessageSquare size={16} />
                <span>Send via WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Top Actions: Import Contacts */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Add by Phone or Email</span>
            <button
              type="button"
              onClick={handleImportContacts}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(34, 184, 160, 0.12)",
                color: "#0f766e",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "0.82rem",
                cursor: "pointer",
                fontWeight: 500
              }}
            >
              <Smartphone size={15} />
              <span>Import Device Contacts</span>
            </button>
          </div>

          {/* Manual Contact Entry */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1fr auto", gap: "6px", marginBottom: "12px" }}>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ fontSize: "0.84rem", padding: "7px 10px" }}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ fontSize: "0.84rem", padding: "7px 10px" }}
            />
            <input
              type="tel"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ fontSize: "0.84rem", padding: "7px 10px" }}
            />
            <button
              type="button"
              onClick={handleAddManualContact}
              className="primary-button"
              style={{ padding: "8px 14px", minWidth: "auto", fontSize: "0.82rem" }}
            >
              Add
            </button>
          </div>

          {/* Staged contacts to invite */}
          {contacts.length > 0 && (
            <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>
                  Selected Contacts ({contacts.length}):
                </span>
                <button
                  type="button"
                  onClick={handleSendBatchInvites}
                  className="primary-button"
                  disabled={loading}
                  style={{ padding: "5px 12px", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Send size={13} />
                  <span>{loading ? "Generating..." : "Generate Invitations"}</span>
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {contacts.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      background: "#fff",
                      borderRadius: "6px",
                      fontSize: "0.83rem",
                      border: "1px solid #e2e8f0"
                    }}
                  >
                    <span><strong>{c.name}</strong> <span style={{ color: "#64748b" }}>({c.email || c.phone})</span></span>
                    <button
                      type="button"
                      onClick={() => setContacts((prev) => prev.filter((_, idx) => idx !== i))}
                      style={{ border: "none", background: "transparent", color: "#ef4444", cursor: "pointer" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing Pending Invitations & Share Links */}
          <div style={{ marginTop: "18px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
            <span style={{ fontWeight: 600, fontSize: "0.9rem", display: "block", marginBottom: "10px" }}>
              Pending Invitations & Share Links ({existingInvites.length})
            </span>

            {existingInvites.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {existingInvites.map((inv) => {
                  const inviteUrl = formatShareUrl(inv.token);
                  const waUrl = getWhatsAppShareUrl(inv.token, inv.invitee_phone);
                  const mailSubject = `Join ${group.name} on Budget Buddy`;
                  const mailBody = `Hey! Join my group '${group.name}' on Budget Buddy to share expenses and split bills:\n\n${inviteUrl}`;
                  const mailUrl = `mailto:${inv.invitee_email || ""}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
                  const smsUrl = `sms:${inv.invitee_phone || ""}?body=${encodeURIComponent(mailBody)}`;

                  return (
                    <div
                      key={inv.id}
                      style={{
                        padding: "12px",
                        borderRadius: "10px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong>{inv.invitee_name || inv.invitee_email || inv.invitee_phone || "Invited Friend"}</strong>
                          <span style={{
                            marginLeft: "8px",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "0.74rem",
                            background: inv.is_registered ? "rgba(34, 184, 160, 0.15)" : "rgba(244, 174, 80, 0.15)",
                            color: inv.is_registered ? "#0f766e" : "#b45309",
                            fontWeight: 600
                          }}>
                            {inv.is_registered ? "Registered User" : "Pending Join"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRevokeInvite(inv.id)}
                          style={{ border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer" }}
                          title="Revoke invitation"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Direct Share Channels */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
                        {/* WhatsApp */}
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            background: "#25D366",
                            color: "#fff",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            textDecoration: "none"
                          }}
                        >
                          <MessageSquare size={13} />
                          <span>WhatsApp</span>
                        </a>

                        {/* Email */}
                        <a
                          href={mailUrl}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            background: "#EA4335",
                            color: "#fff",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            textDecoration: "none"
                          }}
                        >
                          <Mail size={13} />
                          <span>Email</span>
                        </a>

                        {/* SMS */}
                        <a
                          href={smsUrl}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            background: "#0284c7",
                            color: "#fff",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            textDecoration: "none"
                          }}
                        >
                          <span>SMS</span>
                        </a>

                        {/* Copy Link */}
                        <button
                          type="button"
                          onClick={() => handleCopyLink(inv.token)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            background: copiedToken === inv.token ? "#10b981" : "#e2e8f0",
                            color: copiedToken === inv.token ? "#fff" : "#334155",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            border: "none",
                            cursor: "pointer"
                          }}
                        >
                          {copiedToken === inv.token ? <Check size={13} /> : <Copy size={13} />}
                          <span>{copiedToken === inv.token ? "Copied!" : "Copy Link"}</span>
                        </button>

                        {/* Native Share */}
                        {navigator.share && (
                          <button
                            type="button"
                            onClick={() => handleNativeShare(inv)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              background: "#7557E8",
                              color: "#fff",
                              padding: "5px 10px",
                              borderRadius: "6px",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              border: "none",
                              cursor: "pointer"
                            }}
                          >
                            <Share2 size={13} />
                            <span>Share</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "16px", color: "#94a3b8", fontSize: "0.85rem" }}>
                No active invitations. Add friends above to generate personalized shareable invite links!
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ padding: "14px 20px" }}>
          <button type="button" className="primary-button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
