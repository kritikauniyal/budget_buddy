import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  UserPlus,
  Smartphone,
  Copy,
  Check,
  MessageSquare,
  Mail,
  Trash2,
  Search,
  UserCheck,
  Send,
  Users,
  Clock,
  ExternalLink
} from "lucide-react";
import api from "../../services/api";

export default function InviteMembersModal({ group, currentUser, onClose, onMembersInvited }) {
  const [activeTab, setActiveTab] = useState("registered"); // 'registered' | 'link' | 'manual' | 'pending'
  
  // Real registered eligible friends from DB
  const [eligibleFriends, setEligibleFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [invitingFriendId, setInvitingFriendId] = useState(null);

  // Manual contact inputs
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualContacts, setManualContacts] = useState([]);

  // Database invitations & link
  const [existingInvites, setExistingInvites] = useState([]);
  const [universalInvite, setUniversalInvite] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copiedToken, setCopiedToken] = useState(null);

  // Fetch real registered eligible friends from database
  const loadEligibleFriends = useCallback(async (query = "") => {
    if (!group?.id) return;
    setLoadingFriends(true);
    try {
      const data = await api.getEligibleFriendsToInvite(group.id, query);
      setEligibleFriends(data || []);
    } catch (err) {
      console.warn("Could not load eligible friends:", err);
      setEligibleFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  }, [group?.id]);

  // Fetch group pending invitations from DB
  const loadExistingInvites = useCallback(async () => {
    if (!group?.id) return;
    try {
      const data = await api.getGroupInvitations(group.id);
      setExistingInvites(data || []);
    } catch (err) {
      console.warn("Could not load invitations:", err);
    }
  }, [group?.id]);

  // Load initial data
  useEffect(() => {
    if (group?.id) {
      loadEligibleFriends("");
      loadExistingInvites();
      api.getGroupShareLink(group.id)
        .then((data) => setUniversalInvite(data))
        .catch((err) => console.warn("Could not load share link:", err));
    }
  }, [group?.id, loadEligibleFriends, loadExistingInvites]);

  // Debounced search for eligible friends
  useEffect(() => {
    const timer = setTimeout(() => {
      loadEligibleFriends(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, loadEligibleFriends]);

  const formatShareUrl = (token) => {
    if (!token) return "";
    return `${window.location.origin}/invite/${token}`;
  };

  const getWhatsAppShareUrl = (token, phoneVal = "") => {
    const cleanPhone = phoneVal ? phoneVal.replace(/[^0-9]/g, "") : "";
    const link = formatShareUrl(token);
    const inviter = currentUser?.full_name || group?.invited_by_name || "A friend";
    const msg = `Hey! ${inviter} invited you to join the ${group.name} group on Budget Buddy to share expenses and split balances.\n\nJoin our group:\n${link}`;
    return cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  const handleCopyLink = (token) => {
    const url = formatShareUrl(token);
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setNotice("Invitation link copied to clipboard!");
    setTimeout(() => {
      setCopiedToken(null);
      setNotice("");
    }, 2500);
  };

  // Direct 1-Click invite for a real registered user
  const handleInviteRegisteredFriend = async (friend) => {
    setInvitingFriendId(friend.id);
    setError("");
    setNotice("");
    try {
      await api.inviteGroupMembers(group.id, {
        contacts: [
          {
            name: friend.full_name,
            email: friend.email,
            phone: friend.phone || null,
          },
        ],
      });

      // Remove invited friend from eligible list
      setEligibleFriends((prev) => prev.filter((f) => f.id !== friend.id));
      setNotice(`Invitation sent to ${friend.full_name}! They received an in-app notification.`);
      await loadExistingInvites();
      if (onMembersInvited) onMembersInvited();
    } catch (err) {
      setError(err.message || `Failed to invite ${friend.full_name}.`);
    } finally {
      setInvitingFriendId(null);
    }
  };

  // Manual contact addition
  const handleAddManualContact = (e) => {
    e.preventDefault();
    if (!manualEmail && !manualPhone) {
      setError("Please provide an email or phone number.");
      return;
    }
    setError("");
    setManualContacts((prev) => [
      ...prev,
      {
        name: manualName.trim() || manualEmail.split("@")[0] || manualPhone,
        email: manualEmail.trim() || null,
        phone: manualPhone.trim() || null,
      },
    ]);
    setManualName("");
    setManualEmail("");
    setManualPhone("");
  };

  // Send batch invites for manual contacts
  const handleSendManualBatch = async () => {
    if (manualContacts.length === 0) return;
    setLoading(true);
    setError("");
    try {
      await api.inviteGroupMembers(group.id, { contacts: manualContacts });
      setManualContacts([]);
      setNotice("Invitations recorded successfully in the database!");
      await loadExistingInvites();
      if (onMembersInvited) onMembersInvited();
    } catch (err) {
      setError(err.message || "Failed to create invitations.");
    } finally {
      setLoading(false);
    }
  };

  // Revoke an invitation
  const handleRevokeInvite = async (invitationId) => {
    try {
      await api.cancelInvitation(invitationId);
      setExistingInvites((prev) => prev.filter((i) => i.id !== invitationId));
      setNotice("Invitation cancelled successfully.");
      // Refresh eligible friends in case revoked user is registered
      loadEligibleFriends(searchQuery);
    } catch (err) {
      setError(err.message || "Could not cancel invitation.");
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: "580px", borderRadius: "18px" }}>
        {/* Header */}
        <div className="modal-header" style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "rgba(99, 102, 241, 0.12)",
                color: "#6366f1",
                display: "grid",
                placeItems: "center",
                flexShrink: 0
              }}
            >
              <UserPlus size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.12rem", fontWeight: 700, color: "#0f172a" }}>
                Invite to "{group.name}"
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                Invite real registered users or share a secure WhatsApp link
              </p>
            </div>
          </div>
          <button className="modal-close-btn" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="auth-alert error" style={{ margin: "12px 20px 0", fontSize: "0.84rem" }}>
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div
            style={{
              margin: "12px 20px 0",
              fontSize: "0.84rem",
              color: "#0f766e",
              background: "#f0fdf4",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid #bbf7d0",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Check size={16} color="#16a34a" />
            <span>{notice}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.3fr 1fr 1fr",
            padding: "12px 20px 0",
            gap: "6px"
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("registered")}
            style={{
              padding: "8px 10px",
              borderRadius: "10px",
              border: "none",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === "registered" ? "#6366f1" : "#f1f5f9",
              color: activeTab === "registered" ? "#ffffff" : "#64748b",
              transition: "all 0.2s ease"
            }}
          >
            Registered Users
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("link")}
            style={{
              padding: "8px 10px",
              borderRadius: "10px",
              border: "none",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === "link" ? "#25D366" : "#f1f5f9",
              color: activeTab === "link" ? "#ffffff" : "#64748b",
              transition: "all 0.2s ease"
            }}
          >
            WhatsApp Link
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            style={{
              padding: "8px 10px",
              borderRadius: "10px",
              border: "none",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === "pending" ? "#0f172a" : "#f1f5f9",
              color: activeTab === "pending" ? "#ffffff" : "#64748b",
              transition: "all 0.2s ease"
            }}
          >
            Pending ({existingInvites.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto", padding: "16px 20px" }}>
          
          {/* TAB 1: REAL REGISTERED USERS FROM DB */}
          {activeTab === "registered" && (
            <div>
              {/* Search input */}
              <div style={{ position: "relative", marginBottom: "14px" }}>
                <Search
                  size={16}
                  color="#94a3b8"
                  style={{ position: "absolute", left: "12px", top: "12px" }}
                />
                <input
                  type="text"
                  placeholder="Search registered friends by name, email or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 38px",
                    borderRadius: "10px",
                    border: "1.5px solid #e2e8f0",
                    fontSize: "0.88rem",
                    outline: "none"
                  }}
                />
              </div>

              {/* Friends List or Empty State */}
              {loadingFriends ? (
                <div style={{ padding: "30px 0", textAlign: "center", color: "#64748b", fontSize: "0.88rem" }}>
                  Searching registered friends in database...
                </div>
              ) : eligibleFriends.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {eligibleFriends.map((friend) => (
                    <div
                      key={friend.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        gap: "12px"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #6366f1, #818cf8)",
                            color: "#fff",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            flexShrink: 0
                          }}
                        >
                          {friend.initials || "U"}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <strong
                            style={{
                              display: "block",
                              fontSize: "0.88rem",
                              color: "#0f172a",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {friend.full_name}
                          </strong>
                          <span
                            style={{
                              fontSize: "0.76rem",
                              color: "#64748b",
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {friend.email} {friend.phone ? `• ${friend.phone}` : ""}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleInviteRegisteredFriend(friend)}
                        disabled={invitingFriendId === friend.id}
                        className="primary-button"
                        style={{
                          padding: "6px 14px",
                          fontSize: "0.8rem",
                          minWidth: "auto",
                          borderRadius: "8px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          flexShrink: 0
                        }}
                      >
                        <UserPlus size={14} />
                        <span>{invitingFriendId === friend.id ? "Inviting..." : "Invite"}</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                /* STRICT EMPTY STATE REQUIRED BY USER */
                <div
                  style={{
                    padding: "32px 16px",
                    textAlign: "center",
                    background: "#f8fafc",
                    borderRadius: "14px",
                    border: "1.5px dashed #cbd5e1",
                    margin: "10px 0"
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "#ede9fe",
                      color: "#6366f1",
                      display: "grid",
                      placeItems: "center",
                      margin: "0 auto 12px"
                    }}
                  >
                    <Users size={24} />
                  </div>
                  <h4 style={{ margin: "0 0 6px", fontSize: "0.95rem", color: "#1e293b", fontWeight: 700 }}>
                    No friends found. Share an invitation link to invite someone.
                  </h4>
                  <p style={{ margin: "0 0 16px", fontSize: "0.82rem", color: "#64748b", maxWidth: "340px", marginInline: "auto" }}>
                    Anyone you invite through WhatsApp can join in one tap or participate directly as a guest.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("link")}
                    className="primary-button"
                    style={{
                      padding: "8px 18px",
                      fontSize: "0.84rem",
                      background: "#25D366",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 2px 8px rgba(37, 211, 102, 0.25)"
                    }}
                  >
                    <MessageSquare size={15} />
                    <span>Open WhatsApp Share</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WHATSAPP & UNIVERSAL SHARE LINK */}
          {activeTab === "link" && (
            <div>
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(37, 211, 102, 0.08), rgba(99, 102, 241, 0.08))",
                  border: "1.5px solid rgba(37, 211, 102, 0.35)",
                  borderRadius: "14px",
                  padding: "16px",
                  marginBottom: "16px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      background: "#25D366",
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0
                    }}
                  >
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.95rem", color: "#0f172a", display: "block" }}>
                      Instant WhatsApp Invitation
                    </strong>
                    <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      Receiver taps the link to view group details & join directly
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "12px", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    readOnly
                    value={formatShareUrl(universalInvite?.token || "")}
                    style={{
                      flex: "1 1 200px",
                      fontSize: "0.82rem",
                      padding: "9px 12px",
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
                    style={{
                      padding: "9px 14px",
                      minWidth: "auto",
                      fontSize: "0.82rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    {copiedToken === universalInvite?.token ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                    <span>{copiedToken === universalInvite?.token ? "Copied!" : "Copy"}</span>
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
                      padding: "9px 16px",
                      borderRadius: "8px",
                      fontSize: "0.84rem",
                      fontWeight: 700,
                      textDecoration: "none",
                      boxShadow: "0 2px 8px rgba(37, 211, 102, 0.25)"
                    }}
                  >
                    <MessageSquare size={16} />
                    <span>Send on WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Message Preview */}
              <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px", textTransform: "uppercase" }}>
                  WhatsApp Message Preview
                </span>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#334155", fontStyle: "italic", lineHeight: 1.5 }}>
                  "Hey! {currentUser?.full_name || "A friend"} invited you to join the {group.name} group on Budget Buddy to share expenses and split balances.
                  <br />
                  <br />
                  Join our group:
                  <br />
                  {formatShareUrl(universalInvite?.token || "...")}"
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: PENDING INVITATIONS FROM DATABASE */}
          {activeTab === "pending" && (
            <div>
              {existingInvites.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {existingInvites.map((inv) => {
                    const waUrl = getWhatsAppShareUrl(inv.token, inv.invitee_phone);
                    return (
                      <div
                        key={inv.id}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "12px",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "10px"
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <strong style={{ fontSize: "0.88rem", color: "#0f172a" }}>
                              {inv.invitee_name || inv.invitee_email || inv.invitee_phone || "Friend via Share Link"}
                            </strong>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: "10px",
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                background: inv.status === "accepted" ? "#dcfce7" : "#fef3c7",
                                color: inv.status === "accepted" ? "#15803d" : "#b45309"
                              }}
                            >
                              {inv.status}
                            </span>
                          </div>
                          <span style={{ fontSize: "0.76rem", color: "#64748b", display: "block", marginTop: "2px" }}>
                            Created: {inv.created_at} • By {inv.invited_by_name}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: "6px 10px",
                              borderRadius: "6px",
                              background: "#25D366",
                              color: "#fff",
                              fontSize: "0.76rem",
                              fontWeight: 600,
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <MessageSquare size={13} />
                            <span>Share</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRevokeInvite(inv.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#ef4444",
                              cursor: "pointer",
                              padding: "6px"
                            }}
                            title="Cancel Invitation"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: "30px 0", textAlign: "center", color: "#64748b", fontSize: "0.88rem" }}>
                  <Clock size={28} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                  <div>No pending invitations for this group.</div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9" }}>
          <button type="button" className="secondary-button" onClick={onClose} style={{ width: "100%" }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
