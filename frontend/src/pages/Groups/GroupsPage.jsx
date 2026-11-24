import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Mail,
  RefreshCw,
  Wallet,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import api from "../../services/api";
import GroupDetailView from "./GroupDetailView";
import CreateGroupModal from "./CreateGroupModal";
import InvitationsModal from "./InvitationsModal";

export default function GroupsPage({
  currentUser,
  selectedGroupId: propGroupId = null,
  onSelectGroup,
  externalAddTrigger = null,
  initialTab = "expenses"
}) {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(propGroupId);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const [filter, setFilter] = useState("all"); // 'all' | 'owe' | 'receive' | 'settled'

  useEffect(() => {
    setSelectedGroupId(propGroupId);
  }, [propGroupId]);

  useEffect(() => {
    if (externalAddTrigger && !selectedGroupId) {
      setShowCreateModal(true);
    }
  }, [externalAddTrigger, selectedGroupId]);

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

  const getGroupIcon = (type = "") => {
    const t = type.toLowerCase();
    if (t.includes("room") || t.includes("hostel") || t.includes("flat")) return { emoji: "🏠", bg: "#eff6ff", color: "#3b82f6" };
    if (t.includes("trip") || t.includes("travel")) return { emoji: "✈️", bg: "#fef3c7", color: "#d97706" };
    if (t.includes("couple")) return { emoji: "💑", bg: "#fce7f3", color: "#ec4899" };
    if (t.includes("family")) return { emoji: "👨‍👩‍👧", bg: "#f3e8ff", color: "#a855f7" };
    if (t.includes("office") || t.includes("work")) return { emoji: "💼", bg: "#e0f2fe", color: "#0284c7" };
    return { emoji: "👥", bg: "#f5f3ff", color: "#7557E8" };
  };

  // If a group is selected, render the detailed view
  if (selectedGroupId) {
    return (
      <GroupDetailView
        groupId={selectedGroupId}
        currentUser={currentUser}
        externalAddTrigger={externalAddTrigger}
        initialTab={initialTab || "expenses"}
        onBack={() => {
          handleSelectGroup(null);
          loadGroupsData();
        }}
      />
    );
  }

  const filteredGroups = groups.filter((g) => {
    if (filter === "owe") return g.my_balance < -0.01;
    if (filter === "receive") return g.my_balance > 0.01;
    if (filter === "settled") return Math.abs(g.my_balance) <= 0.01;
    return true;
  });

  return (
    <div className="groups-container">
      {/* Header Banner */}
      <div className="welcome-section" style={{ flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h2>Shared Groups</h2>
          <p>Split apartment rent, travel trips, dining bills, and settle with flatmates easily.</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Refresh */}
          <button
            onClick={loadGroupsData}
            className="secondary-button"
            style={{ padding: "9px 12px", borderRadius: "12px" }}
            title="Refresh groups"
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
          </button>

          {/* Pending Invitations */}
          <button
            onClick={() => setShowInvitesModal(true)}
            className="secondary-button"
            style={{
              padding: "9px 16px",
              borderRadius: "12px",
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

          {/* Create Group */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="primary-button"
            style={{
              padding: "9px 18px",
              borderRadius: "12px",
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
        <div className="auth-alert error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Chips Bar */}
      {groups.length > 0 && (
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
          {[
            { id: "all", label: `All Groups (${groups.length})` },
            { id: "receive", label: "You Will Receive" },
            { id: "owe", label: "You Owe" },
            { id: "settled", label: "All Settled" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                border: filter === tab.id ? "2px solid #7557E8" : "1px solid #e2e8f0",
                background: filter === tab.id ? "rgba(117, 87, 232, 0.1)" : "#ffffff",
                color: filter === tab.id ? "#7557E8" : "#64748b",
                fontWeight: filter === tab.id ? 700 : 500,
                fontSize: "0.82rem",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Groups List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>👥</div>
          <h3>Loading your groups...</h3>
        </div>
      ) : filteredGroups.length > 0 ? (
        <div className="groups-card-grid">
          {filteredGroups.map((g) => {
            const isOwed = g.my_balance > 0.01;
            const owes = g.my_balance < -0.01;
            const iconInfo = getGroupIcon(g.group_type);

            return (
              <div
                key={g.id}
                className="group-card-pro"
                onClick={() => handleSelectGroup(g.id)}
              >
                <div>
                  <div className="group-card-header">
                    <div
                      className="group-avatar-box"
                      style={{ background: iconInfo.bg, color: iconInfo.color }}
                    >
                      {iconInfo.emoji}
                    </div>

                    <div className="group-info-meta">
                      <h3 className="group-title-text">{g.name}</h3>
                      <div className="group-type-label">
                        <span>{g.group_type}</span>
                        <span>•</span>
                        <span>{g.member_count} {g.member_count === 1 ? "member" : "members"}</span>
                      </div>
                    </div>

                    <span
                      className="group-role-badge"
                      style={{
                        background: g.my_role === "admin" ? "rgba(34, 184, 160, 0.12)" : "#f1f5f9",
                        color: g.my_role === "admin" ? "#0f766e" : "#64748b"
                      }}
                    >
                      {g.my_role === "admin" ? "Admin" : "Member"}
                    </span>
                  </div>

                  {g.description && (
                    <p style={{
                      fontSize: "0.82rem",
                      color: "#64748b",
                      margin: "10px 0 0",
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

                <div className="group-card-footer">
                  <div>
                    <span className="group-spend-meta">
                      Total: ₹{g.total_expenses ? g.total_expenses.toLocaleString("en-IN") : "0"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className={`group-balance-chip ${isOwed ? "owed" : owes ? "owes" : "settled"}`}>
                      {isOwed ? (
                        <>
                          <TrendingUp size={13} />
                          <span>+₹{g.my_balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        </>
                      ) : owes ? (
                        <>
                          <TrendingDown size={13} />
                          <span>-₹{Math.abs(g.my_balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        </>
                      ) : (
                        <span>Settled ✨</span>
                      )}
                    </span>
                    <ChevronRight size={17} color="#94a3b8" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          background: "#ffffff",
          borderRadius: "20px",
          padding: "50px 20px",
          textAlign: "center",
          border: "1px solid #f1f5f9",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)"
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "20px",
            background: "rgba(117, 87, 232, 0.12)",
            color: "#7557E8",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 16px"
          }}>
            <Users size={32} />
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: "1.25rem", fontWeight: 700 }}>
            {filter === "all" ? "No shared groups yet" : "No groups matching filter"}
          </h3>
          <p style={{ margin: "0 auto 20px", maxWidth: "420px", color: "#64748b", fontSize: "0.88rem", lineHeight: 1.5 }}>
            Create a group for your room flatmates, hostel, trip, or dinner outing. Invite friends, log expenses, and settle up cleanly without spreadsheets!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="primary-button"
            style={{ padding: "10px 22px", borderRadius: "12px", display: "inline-flex", alignItems: "center", gap: "6px", margin: "0 auto" }}
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
