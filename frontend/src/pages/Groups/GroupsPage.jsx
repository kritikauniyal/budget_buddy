import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Mail,
  RefreshCw,
  Wallet,
  ArrowRight,
  Receipt,
  UserPlus,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import api from "../../services/api";
import GroupDetailView from "./GroupDetailView";
import CreateGroupModal from "./CreateGroupModal";
import InvitationsModal from "./InvitationsModal";

export default function GroupsPage({ currentUser, selectedGroupId: propGroupId = null, onSelectGroup }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(propGroupId);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);

  useEffect(() => {
    setSelectedGroupId(propGroupId);
  }, [propGroupId]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInvitesModal, setShowInvitesModal] = useState(false);

  const loadGroupsData = async () => {
    setRefreshing(true);
    setError("");
    try {
      const [grps, invites] = await Promise.all([
        api.getGroups(),
        api.getMyPendingInvitations().catch(() => []),
      ]);
      setGroups(grps || []);
      setPendingInvitesCount((invites || []).length);
    } catch (err) {
      setError(err.message || "Failed to load groups.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGroupsData();
  }, []);

  const handleSelectGroup = (id) => {
    setSelectedGroupId(id);
    if (onSelectGroup) {
      onSelectGroup(id);
    }
  };

  const handleGroupCreated = (newGroup) => {
    setGroups((prev) => [newGroup, ...prev]);
    handleSelectGroup(newGroup.id);
  };

  const handleInvitationAccepted = (newGroupId) => {
    loadGroupsData();
    if (newGroupId) {
      handleSelectGroup(newGroupId);
    }
  };

  // If a group is selected, render the detailed view
  if (selectedGroupId) {
    return (
      <GroupDetailView
        groupId={selectedGroupId}
        currentUser={currentUser}
        onBack={() => {
          handleSelectGroup(null);
          loadGroupsData();
        }}
      />
    );
  }

  return (
    <div className="groups-page">
      {/* Top Banner & Header */}
      <div className="welcome-section">
        <div>
          <h2>Group Expense Sharing</h2>
          <p>Split trip expenses, roommate rent, dinner bills, and settle balances effortlessly</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Refresh Button */}
          <button
            onClick={loadGroupsData}
            className="secondary-button"
            style={{ padding: "9px 12px", minWidth: "auto", borderRadius: "10px" }}
            title="Refresh groups"
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
          </button>

          {/* Pending Invitations Button */}
          <button
            onClick={() => setShowInvitesModal(true)}
            className="secondary-button"
            style={{
              padding: "9px 16px",
              borderRadius: "10px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              position: "relative"
            }}
          >
            <Mail size={16} />
            <span>Invitations</span>
            {pendingInvitesCount > 0 && (
              <span style={{
                background: "#ef4444",
                color: "#ffffff",
                borderRadius: "10px",
                padding: "2px 7px",
                fontSize: "0.72rem",
                fontWeight: 700
              }}>
                {pendingInvitesCount}
              </span>
            )}
          </button>

          {/* Create Group Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="primary-button"
            style={{
              padding: "9px 18px",
              borderRadius: "10px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Plus size={18} />
            <span>Create Group</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="auth-alert error" style={{ marginBottom: "20px" }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div className="auth-brand-icon spin-icon" style={{ margin: "0 auto 16px" }}>
            👥
          </div>
          <h3>Loading your groups...</h3>
        </div>
      ) : groups.length > 0 ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "20px"
        }}>
          {groups.map((g) => {
            const isOwed = g.my_balance > 0.01;
            const owes = g.my_balance < -0.01;

            return (
              <div
                key={g.id}
                onClick={() => handleSelectGroup(g.id)}
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "20px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
                  border: "1px solid #f1f5f9",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.04)";
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        background: "rgba(117, 87, 232, 0.12)",
                        color: "#7557E8",
                        display: "grid",
                        placeItems: "center"
                      }}>
                        <Users size={22} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
                          {g.name}
                        </h3>
                        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                          {g.group_type} • {g.member_count} {g.member_count === 1 ? "member" : "members"}
                        </span>
                      </div>
                    </div>

                    <span style={{
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "0.74rem",
                      fontWeight: 600,
                      background: g.my_role === "admin" ? "rgba(34, 184, 160, 0.15)" : "#f1f5f9",
                      color: g.my_role === "admin" ? "#0f766e" : "#64748b"
                    }}>
                      {g.my_role === "admin" ? "Admin" : "Member"}
                    </span>
                  </div>

                  {g.description && (
                    <p style={{
                      fontSize: "0.82rem",
                      color: "#64748b",
                      margin: "0 0 14px",
                      lineHeight: 1.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}>
                      {g.description}
                    </p>
                  )}
                </div>

                <div style={{
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: "14px",
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>
                      My Net Balance
                    </span>
                    <span style={{
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: isOwed ? "#10b981" : owes ? "#ef4444" : "#64748b"
                    }}>
                      {isOwed ? `+₹${g.my_balance.toLocaleString()}` : owes ? `-₹${Math.abs(g.my_balance).toLocaleString()}` : "Settled"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#7557E8", fontSize: "0.85rem", fontWeight: 600 }}>
                    <span>Open Group</span>
                    <ArrowRight size={15} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "50px 20px",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)"
        }}>
          <div style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "rgba(117, 87, 232, 0.12)",
            color: "#7557E8",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 16px"
          }}>
            <Users size={32} />
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: "1.25rem", fontWeight: 700 }}>
            No groups created yet
          </h3>
          <p style={{ margin: "0 auto 20px", maxWidth: "440px", color: "#64748b", fontSize: "0.88rem" }}>
            Create a group for an upcoming trip, shared apartment rent, or friends' night out. Add friends, split bills, and track who owes whom!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="primary-button"
            style={{ padding: "10px 22px", borderRadius: "10px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={18} />
            <span>Create Your First Group</span>
          </button>
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}

      {/* PENDING INVITATIONS MODAL */}
      {showInvitesModal && (
        <InvitationsModal
          onClose={() => setShowInvitesModal(false)}
          onInvitationAccepted={handleInvitationAccepted}
        />
      )}
    </div>
  );
}
