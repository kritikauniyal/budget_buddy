import React, { useState, useEffect } from "react";
import { X, Mail, Check, AlertCircle, Users, ArrowRight } from "lucide-react";
import api from "../../services/api";

export default function InvitationsModal({ onClose, onInvitationAccepted }) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const data = await api.getMyPendingInvitations();
      setInvitations(data || []);
    } catch (err) {
      setError(err.message || "Failed to load invitations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  const handleAccept = async (token) => {
    setActionLoading(token);
    setError("");
    try {
      const res = await api.acceptInvitation(token);
      setInvitations((prev) => prev.filter((i) => i.token !== token));
      if (onInvitationAccepted) {
        onInvitationAccepted(res.group_id);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Could not accept invitation.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (token) => {
    setActionLoading(token);
    try {
      await api.rejectInvitation(token);
      setInvitations((prev) => prev.filter((i) => i.token !== token));
    } catch (err) {
      setError(err.message || "Could not decline invitation.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: "560px" }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="modal-icon-badge" style={{ background: "rgba(117, 87, 232, 0.12)", color: "#7557E8" }}>
              <Mail size={22} />
            </div>
            <div>
              <h3>Pending Group Invitations</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                Invitations received from friends to share expenses
              </p>
            </div>
          </div>
          <button className="modal-close-btn" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="auth-alert error" style={{ margin: "14px 20px 0" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="modal-body" style={{ maxHeight: "65vh", overflowY: "auto", padding: "18px 20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
              Checking for pending invitations...
            </div>
          ) : invitations.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      background: "rgba(117, 87, 232, 0.15)",
                      color: "#7557E8",
                      display: "grid",
                      placeItems: "center"
                    }}>
                      <Users size={22} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "0.95rem" }}>{inv.group_name}</h4>
                      <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                        Invited by <strong>{inv.invited_by_name}</strong> • {inv.group_type}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => handleAccept(inv.token)}
                      disabled={actionLoading === inv.token}
                      style={{ padding: "6px 14px", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "5px" }}
                    >
                      <Check size={14} />
                      <span>{actionLoading === inv.token ? "Joining..." : "Accept"}</span>
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => handleReject(inv.token)}
                      disabled={actionLoading === inv.token}
                      style={{ padding: "6px 12px", fontSize: "0.82rem" }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "35px 20px", color: "#94a3b8" }}>
              <Users size={36} style={{ margin: "0 auto 10px", color: "#cbd5e1" }} />
              <p style={{ margin: 0, fontSize: "0.9rem" }}>No pending invitations right now.</p>
              <span style={{ fontSize: "0.8rem" }}>When friends invite you via email or phone, invitations will appear here!</span>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ padding: "14px 20px" }}>
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
