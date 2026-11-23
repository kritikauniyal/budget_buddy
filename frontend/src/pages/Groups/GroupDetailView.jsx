import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Users,
  Plus,
  RefreshCw,
  Wallet,
  Receipt,
  UserPlus,
  CheckCircle2,
  Trash2,
  Settings,
  Calendar,
  AlertCircle,
  Share2,
  Copy,
  Check,
  TrendingDown,
  TrendingUp,
  Tag
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import api from "../../services/api";
import AddGroupExpenseModal from "./AddGroupExpenseModal";
import InviteMembersModal from "./InviteMembersModal";
import RecordSettlementModal from "./RecordSettlementModal";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "expenses", label: "Expenses" },
  { id: "balances", label: "Balances" },
  { id: "members", label: "Members" },
  { id: "activity", label: "Activity" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
];

export default function GroupDetailView({ groupId, currentUser, onBack, externalAddTrigger }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [group, setGroup] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [balancesData, setBalancesData] = useState(null);
  const [settlements, setSettlements] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Modals
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settlePreload, setSettlePreload] = useState({ payerId: null, receiverId: null, amount: "" });
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState(null);

  const getUserInitials = (name = "") => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase() || "MB";
  };

  useEffect(() => {
    if (externalAddTrigger) {
      setShowAddExpense(true);
    }
  }, [externalAddTrigger]);

  const loadAllGroupData = async () => {
    setRefreshing(true);
    setError("");
    try {
      const [grp, dash, expList, memList, balData, setlList] = await Promise.all([
        api.getGroup(groupId),
        api.getGroupDashboard(groupId),
        api.getGroupExpenses(groupId),
        api.getGroupMembers(groupId),
        api.getGroupBalances(groupId),
        api.getGroupSettlements(groupId),
      ]);

      setGroup(grp);
      setDashboard(dash);
      setExpenses(expList || []);
      setMembers(memList || []);
      setBalancesData(balData);
      setSettlements(setlList || []);
    } catch (err) {
      setError(err.message || "Failed to load group details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      loadAllGroupData();
    }
  }, [groupId]);

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await api.deleteGroupExpense(groupId, expenseId);
      await loadAllGroupData();
    } catch (err) {
      alert(err.message || "Failed to delete expense.");
    }
  };

  const handleOpenSettleDebt = (debt) => {
    setSettlePreload({
      payerId: debt.from_user_id,
      receiverId: debt.to_user_id,
      amount: debt.amount,
    });
    setShowSettleModal(true);
  };

  const handleRemoveMember = async (userId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this group?`)) return;
    try {
      await api.removeGroupMember(groupId, userId);
      await loadAllGroupData();
    } catch (err) {
      alert(err.message || "Failed to remove member.");
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete '${group.name}'? All group expenses and history will be deleted.`)) return;
    try {
      await api.deleteGroup(groupId);
      onBack();
    } catch (err) {
      alert(err.message || "Failed to delete group.");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div className="auth-brand-icon spin-icon" style={{ margin: "0 auto 16px" }}>
          👥
        </div>
        <h3>Loading Group Details...</h3>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div style={{ padding: "30px", textAlign: "center" }}>
        <div className="auth-alert error" style={{ maxWidth: "500px", margin: "0 auto 20px" }}>
          <span>{error}</span>
        </div>
        <button className="secondary-button" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Groups</span>
        </button>
      </div>
    );
  }

  const myNetBalance = dashboard ? dashboard.my_net_balance : 0;
  const isAdmin = group && group.my_role === "admin";

  return (
    <div className="group-detail-page">
      {/* Top Banner & Header */}
      <div className="group-header-card">
        <div className="group-header-top">
          <div className="group-header-left">
            <button
              onClick={onBack}
              className="group-back-btn"
              title="Back to all groups"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: "#1e293b" }}>{group.name}</h2>
                <span style={{
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  background: "rgba(117, 87, 232, 0.12)",
                  color: "#7557E8",
                  textTransform: "uppercase"
                }}>
                  {group.group_type}
                </span>
                {isAdmin && (
                  <span style={{
                    padding: "3px 10px",
                    borderRadius: "20px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    background: "rgba(34, 184, 160, 0.15)",
                    color: "#0f766e"
                  }}>
                    Admin
                  </span>
                )}
              </div>
              {group.description && (
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                  {group.description}
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="group-header-actions">
            <button
              onClick={loadAllGroupData}
              className="secondary-button"
              style={{ padding: "8px 12px", minWidth: "auto", borderRadius: "12px" }}
              title="Refresh group data"
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
            </button>

            <button
              onClick={() => setShowInviteModal(true)}
              className="secondary-button"
              style={{ padding: "8px 14px", borderRadius: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <UserPlus size={16} />
              <span>Invite</span>
            </button>

            <button
              onClick={() => {
                setSettlePreload({ payerId: null, receiverId: null, amount: "" });
                setShowSettleModal(true);
              }}
              className="secondary-button"
              style={{ padding: "8px 14px", borderRadius: "12px", display: "inline-flex", alignItems: "center", gap: "6px", color: "#0f766e", borderColor: "#99f6e4" }}
            >
              <CheckCircle2 size={16} />
              <span>Settle Up</span>
            </button>

            <button
              onClick={() => setShowAddExpense(true)}
              className="primary-button"
              style={{ padding: "8px 16px", borderRadius: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={18} />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="group-tabs-scroll">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`group-tab-btn ${activeTab === t.id ? "active" : ""}`}
            >
              {t.label}
              {t.id === "expenses" && ` (${expenses.length})`}
              {t.id === "members" && ` (${members.length})`}
            </button>
          ))}
        </div>
      </div>


      {/* TAB 1: OVERVIEW / DASHBOARD */}
      {activeTab === "overview" && dashboard && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* 4 Dynamic Metric Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            {/* Total Expenses */}
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Total Group Expenses</span>
                <div className="stat-icon-wrapper purple">
                  <Receipt size={20} />
                </div>
              </div>
              <div className="stat-amount">₹{dashboard.total_expenses.toLocaleString()}</div>
              <div className="stat-note">All-time group spending</div>
            </div>

            {/* This Month's Expenses */}
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">This Month's Spending</span>
                <div className="stat-icon-wrapper teal">
                  <Calendar size={20} />
                </div>
              </div>
              <div className="stat-amount">₹{dashboard.this_month_expenses.toLocaleString()}</div>
              <div className="stat-note">Current calendar month</div>
            </div>

            {/* My Net Balance */}
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">My Net Balance</span>
                <div className={`stat-icon-wrapper ${myNetBalance > 0 ? "green" : myNetBalance < 0 ? "red" : "purple"}`}>
                  <Wallet size={20} />
                </div>
              </div>
              <div
                className="stat-amount"
                style={{
                  color: myNetBalance > 0 ? "#10b981" : myNetBalance < 0 ? "#ef4444" : "#64748b",
                  fontSize: "1.45rem"
                }}
              >
                {myNetBalance > 0 ? `+₹${myNetBalance.toLocaleString()}` : myNetBalance < 0 ? `-₹${Math.abs(myNetBalance).toLocaleString()}` : "₹0.00"}
              </div>
              <div className="stat-note" style={{ fontWeight: 600 }}>
                {myNetBalance > 0 ? "You are owed money" : myNetBalance < 0 ? "You owe money" : "You are settled up"}
              </div>
            </div>

            {/* Members Count */}
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Active Members</span>
                <div className="stat-icon-wrapper orange">
                  <Users size={20} />
                </div>
              </div>
              <div className="stat-amount">{dashboard.member_count}</div>
              <div className="stat-note">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  style={{ background: "none", border: "none", color: "#7557E8", cursor: "pointer", padding: 0, fontWeight: 600 }}
                >
                  + Add more friends
                </button>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" }}>
            {/* Category Breakdown Donut */}
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 14px" }}>Expense by Category</h3>
              <div style={{ height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboard.category_breakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                    >
                      {dashboard.category_breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || "#7557E8"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", marginTop: "10px" }}>
                {dashboard.category_breakdown.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: c.color || "#7557E8" }} />
                    <span>{c.name}: <strong>₹{c.value.toLocaleString()}</strong></span>
                  </div>
                ))}
              </div>
            </div>

            {/* Member Spending Distribution */}
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 14px" }}>Member Spending & Balances</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {dashboard.member_summaries.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <strong>{m.name}</strong>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        Paid: ₹{m.paid.toLocaleString()} • Share: ₹{m.share.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        color: m.net > 0 ? "#10b981" : m.net < 0 ? "#ef4444" : "#64748b"
                      }}>
                        {m.net > 0 ? `+₹${m.net.toLocaleString()}` : m.net < 0 ? `-₹${Math.abs(m.net).toLocaleString()}` : "Settled"}
                      </span>
                      <div style={{ fontSize: "0.74rem", color: "#64748b" }}>
                        {m.net > 0 ? "gets back" : m.net < 0 ? "owes" : "all good"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Group Expenses */}
          <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>Recent Group Expenses</h3>
              <button
                type="button"
                onClick={() => setActiveTab("expenses")}
                style={{ background: "none", border: "none", color: "#7557E8", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
              >
                View all ({expenses.length}) →
              </button>
            </div>

            {dashboard.recent_expenses.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {dashboard.recent_expenses.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "1.4rem" }}>{r.icon}</span>
                      <div>
                        <strong style={{ fontSize: "0.92rem" }}>{r.title}</strong>
                        <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                          Paid by {r.payer_name} • {r.date} • {r.payment_method}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#1e293b" }}>
                      ₹{r.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                No expenses added to this group yet. Click "+ Add Expense" above!
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EXPENSES LIST (GROUP INBOX) */}
      {activeTab === "expenses" && (
        <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Group Expenses Inbox ({expenses.length})</h3>
              <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                All shared bills, grocery, rent, and outings in real time
              </p>
            </div>
            <button
              onClick={() => setShowAddExpense(true)}
              className="primary-button"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "12px" }}
            >
              <Plus size={16} />
              <span>Add Expense</span>
            </button>
          </div>

          {expenses.length > 0 ? (
            <div className="group-inbox-feed">
              {expenses.map((e) => {
                const isPayer = e.paid_by === currentUser?.id;
                const mySplit = e.splits?.find((s) => s.user_id === currentUser?.id);

                return (
                  <div key={e.id} className="group-inbox-item">
                    <div
                      className="group-inbox-cat-icon"
                      style={{ background: "rgba(117, 87, 232, 0.12)", color: "#7557E8" }}
                    >
                      {e.category_icon || "💳"}
                    </div>

                    <div className="group-inbox-content">
                      <div className="group-inbox-top-row">
                        <span className="group-inbox-title">{e.title}</span>
                        <span className="group-inbox-total">
                          ₹{e.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="group-inbox-sub-row">
                        <span>
                          Paid by <strong style={{ color: isPayer ? "#7557E8" : "inherit" }}>{isPayer ? "You" : e.payer_name}</strong> • {e.expense_date}
                        </span>

                        <span
                          className="group-inbox-share-pill"
                          style={{
                            background: isPayer ? "#f0fdf4" : mySplit ? "#fef2f2" : "#f8fafc",
                            color: isPayer ? "#16a34a" : mySplit ? "#dc2626" : "#64748b"
                          }}
                        >
                          {isPayer
                            ? `You lent ₹${(e.amount - (mySplit?.owed_amount || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                            : mySplit
                            ? `You owe ₹${mySplit.owed_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                            : "Not involved"}
                        </span>
                      </div>

                      {/* Split Tags */}
                      {e.splits && e.splits.length > 0 && (
                        <div style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                          marginTop: "8px",
                          paddingTop: "6px",
                          borderTop: "1px dashed #f1f5f9",
                          fontSize: "0.75rem",
                          color: "#64748b"
                        }}>
                          <span style={{ fontWeight: 600 }}>Splits:</span>
                          {e.splits.map((s) => (
                            <span key={s.id} style={{ background: "#f8fafc", padding: "1px 6px", borderRadius: "6px" }}>
                              {s.user_name}: ₹{s.owed_amount.toLocaleString("en-IN")}
                            </span>
                          ))}
                        </div>
                      )}

                      {e.description && (
                        <div style={{ fontSize: "0.76rem", color: "#64748b", fontStyle: "italic", marginTop: "4px" }}>
                          "{e.description}"
                        </div>
                      )}

                      {e.receipt_url && (
                        <div style={{ marginTop: "8px" }}>
                          <button
                            type="button"
                            className="receipt-pill-btn"
                            onClick={() => setViewingReceiptUrl(e.receipt_url)}
                          >
                            <FileText size={13} />
                            <span>View Payment Proof</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {(isPayer || isAdmin) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(e.id)}
                        style={{ border: "none", background: "transparent", color: "#ef4444", cursor: "pointer", padding: "6px", opacity: 0.7 }}
                        title="Delete Expense"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
              <Receipt size={40} style={{ margin: "0 auto 10px", color: "#cbd5e1" }} />
              <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "#475569" }}>No expenses in this group yet</p>
              <span style={{ fontSize: "0.82rem" }}>Add lunch, room rent, groceries or travel tickets!</span>
            </div>
          )}
        </div>
      )}


      {/* TAB 3: BALANCES & SETTLEMENTS ("WHO OWES WHOM") */}
      {activeTab === "balances" && balancesData && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Who Owes Whom (Suggested Settlements) */}
          <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Who Owes Whom (Smart Settlements)</h3>
                <p style={{ margin: "2px 0 0", fontSize: "0.84rem", color: "#64748b" }}>
                  Optimized debt calculations to settle the group in the fewest transactions
                </p>
              </div>
              <button
                onClick={() => {
                  setSettlePreload({ payerId: null, receiverId: null, amount: "" });
                  setShowSettleModal(true);
                }}
                className="primary-button"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <CheckCircle2 size={16} />
                <span>Record Settle Up</span>
              </button>
            </div>

            {balancesData.suggested_settlements.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
                {balancesData.suggested_settlements.map((debt, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      background: "#f8fafc",
                      border: "1.5px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.95rem" }}>
                        <strong>{debt.from_user_name}</strong> owes <strong>{debt.to_user_name}</strong>
                      </div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#7557E8", marginTop: "4px" }}>
                        ₹{debt.amount.toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenSettleDebt(debt)}
                      className="primary-button"
                      style={{ padding: "6px 14px", fontSize: "0.82rem", background: "#0d9488" }}
                    >
                      Settle Now
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "30px", background: "#f0fdf4", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                <CheckCircle2 size={36} style={{ color: "#16a34a", margin: "0 auto 8px" }} />
                <h4 style={{ margin: "0 0 4px", color: "#166534" }}>All Settled Up!</h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#15803d" }}>
                  Nobody owes anyone in this group right now.
                </p>
              </div>
            )}
          </div>

          {/* Member Net Balances */}
          <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "1.1rem", fontWeight: 700 }}>Individual Member Balances</h3>

            {/* Mobile View: Clean Balances Feed */}
            <div className="mobile-tx-feed">
              {balancesData.member_balances.map((mb) => (
                <div key={mb.user_id} className="member-liability-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className="member-avatar-circle">
                        {getUserInitials(mb.user_name)}
                      </div>
                      <div>
                        <strong style={{ fontSize: "0.98rem" }}>{mb.user_name} {currentUser?.id === mb.user_id ? "(You)" : ""}</strong>
                        <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                          {mb.email || "Active Member"}
                        </div>
                      </div>
                    </div>

                    <span style={{
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      background: mb.net_balance > 0.01 ? "#f0fdf4" : mb.net_balance < -0.01 ? "#fef2f2" : "#f8fafc",
                      color: mb.net_balance > 0.01 ? "#16a34a" : mb.net_balance < -0.01 ? "#dc2626" : "#64748b",
                      border: `1px solid ${mb.net_balance > 0.01 ? "#bbf7d0" : mb.net_balance < -0.01 ? "#fecaca" : "#e2e8f0"}`
                    }}>
                      {mb.net_balance > 0.01
                        ? `Should receive: +₹${mb.net_balance.toLocaleString()}`
                        : mb.net_balance < -0.01
                        ? `Owes: -₹${Math.abs(mb.net_balance).toLocaleString()}`
                        : "All Settled ✨"}
                    </span>
                  </div>

                  <div className="liability-breakdown-row">
                    <div className="liability-item">
                      <span className="liability-label">Paid</span>
                      <strong className="liability-value">₹{mb.total_paid.toLocaleString()}</strong>
                    </div>
                    <div className="liability-item">
                      <span className="liability-label">Own Share</span>
                      <strong className="liability-value">₹{mb.total_share.toLocaleString()}</strong>
                    </div>
                    {mb.settlements_sent > 0 && (
                      <div className="liability-item">
                        <span className="liability-label">Settled Sent</span>
                        <strong className="liability-value" style={{ color: "#0d9488" }}>₹{mb.settlements_sent.toLocaleString()}</strong>
                      </div>
                    )}
                    {mb.settlements_received > 0 && (
                      <div className="liability-item">
                        <span className="liability-label">Settled Recv</span>
                        <strong className="liability-value" style={{ color: "#7557E8" }}>₹{mb.settlements_received.toLocaleString()}</strong>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Table */}
            <div className="desktop-table-container">
              <div className="table-wrapper">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#64748b" }}>
                      <th style={{ padding: "10px" }}>Member</th>
                      <th style={{ padding: "10px" }}>Total Paid</th>
                      <th style={{ padding: "10px" }}>Total Share</th>
                      <th style={{ padding: "10px" }}>Settled Sent</th>
                      <th style={{ padding: "10px" }}>Settled Received</th>
                      <th style={{ padding: "10px" }}>Net Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balancesData.member_balances.map((mb) => (
                      <tr key={mb.user_id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 10px", fontWeight: 600 }}>
                          {mb.user_name} {currentUser?.id === mb.user_id ? "(You)" : ""}
                        </td>
                        <td style={{ padding: "12px 10px" }}>₹{mb.total_paid.toLocaleString()}</td>
                        <td style={{ padding: "12px 10px" }}>₹{mb.total_share.toLocaleString()}</td>
                        <td style={{ padding: "12px 10px", color: "#0d9488" }}>₹{mb.settlements_sent.toLocaleString()}</td>
                        <td style={{ padding: "12px 10px", color: "#64748b" }}>₹{mb.settlements_received.toLocaleString()}</td>
                        <td style={{
                          padding: "12px 10px",
                          fontWeight: 700,
                          color: mb.net_balance > 0 ? "#10b981" : mb.net_balance < 0 ? "#ef4444" : "#64748b"
                        }}>
                          {mb.net_balance > 0 ? `+₹${mb.net_balance.toLocaleString()} (gets back)` : mb.net_balance < 0 ? `-₹${Math.abs(mb.net_balance).toLocaleString()} (owes)` : "Settled"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>


          {/* Settlement History */}
          <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "1.1rem", fontWeight: 700 }}>Settlement Payment History ({settlements.length})</h3>
            {settlements.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {settlements.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <strong>{s.payer_name}</strong> paid <strong>{s.receiver_name}</strong>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        {s.settled_at} • via {s.payment_method} {s.notes ? `• "${s.notes}"` : ""}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: "#0d9488", fontSize: "1.05rem" }}>
                      ₹{s.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "0.85rem" }}>
                No settlements recorded yet. Once debts are paid, use "Record Settle Up" to record them.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: MEMBERS & INVITES */}
      {activeTab === "members" && (
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Group Members ({members.length})</h3>
              <p style={{ margin: "2px 0 0", fontSize: "0.84rem", color: "#64748b" }}>
                People sharing expenses and settling balances in this group
              </p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="primary-button"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <UserPlus size={16} />
              <span>Invite Friends</span>
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
            {members.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    background: "#7557E8",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: "1rem"
                  }}>
                    {m.full_name ? m.full_name[0].toUpperCase() : "U"}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <strong>{m.full_name}</strong>
                      {m.role === "admin" && (
                        <span style={{ fontSize: "0.72rem", background: "rgba(117, 87, 232, 0.12)", color: "#7557E8", padding: "1px 6px", borderRadius: "10px", fontWeight: 600 }}>
                          Admin
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      {m.email} {m.phone ? `• ${m.phone}` : ""}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px" }}>
                      Joined {m.joined_at}
                    </div>
                  </div>
                </div>

                {isAdmin && m.user_id !== currentUser?.id && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(m.user_id, m.full_name)}
                    style={{ border: "none", background: "transparent", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                    title="Remove Member"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: ACTIVITY (Settlement & Expense Activity Feed) */}
      {activeTab === "activity" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Settlements Activity */}
          <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "1.05rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <Wallet size={18} color="#7557E8" />
              Settlement Records ({settlements.length})
            </h3>
            {settlements.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "0.88rem", margin: 0, padding: "12px 0" }}>
                No settlements recorded yet. When members settle up, payment records will appear here.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {settlements.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      background: "#f8fafc",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                        <span style={{ color: "#4f46e5" }}>{s.payer_name}</span> paid <span style={{ color: "#10b981" }}>{s.receiver_name}</span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px" }}>
                        Method: {s.payment_method} • {s.settled_at} {s.notes ? `• "${s.notes}"` : ""}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", fontWeight: 700, color: "#10b981", fontSize: "0.95rem" }}>
                      ₹{s.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expense Logs */}
          <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "1.05rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <Receipt size={18} color="#0d9488" />
              Expense Activity Log ({expenses.length})
            </h3>
            {expenses.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "0.88rem", margin: 0, padding: "12px 0" }}>
                No expenses logged yet in this group.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      background: "#f8fafc",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                        {exp.title}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px" }}>
                        Paid by {exp.payer_name} • {exp.expense_date} • {exp.category_name} ({exp.payment_method})
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: "#ef4444", fontSize: "0.95rem" }}>
                        ₹{exp.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#7557E8", textTransform: "capitalize" }}>
                        {exp.split_type} split
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: REPORTS (Group Visual Analytics) */}
      {activeTab === "reports" && dashboard && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Key KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
            <div style={{ background: "#ffffff", padding: "16px 18px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Total Group Spending</div>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#191b35", margin: "6px 0 0" }}>
                ₹{dashboard.total_expenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h2>
            </div>
            <div style={{ background: "#ffffff", padding: "16px 18px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>This Month</div>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#7557E8", margin: "6px 0 0" }}>
                ₹{dashboard.this_month_expenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h2>
            </div>
            <div style={{ background: "#ffffff", padding: "16px 18px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Average Per Member</div>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0d9488", margin: "6px 0 0" }}>
                ₹{members.length > 0 ? (dashboard.total_expenses / members.length).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
              </h2>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            {/* Category Chart */}
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)" }}>
              <h4 style={{ margin: "0 0 14px", fontSize: "1rem", fontWeight: 700 }}>Group Category Breakdown</h4>
              <div style={{ height: "240px", width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboard.category_breakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {dashboard.category_breakdown.map((entry, index) => (
                        <Cell key={`rep-cell-${index}`} fill={entry.color || "#7557E8"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => `₹${Number(val).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginTop: "10px" }}>
                {dashboard.category_breakdown.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: c.color || "#7557E8" }} />
                    <span>{c.name}: <strong>₹{c.value.toLocaleString()}</strong></span>
                  </div>
                ))}
              </div>
            </div>

            {/* Member Net Balance Breakdown */}
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)" }}>
              <h4 style={{ margin: "0 0 14px", fontSize: "1rem", fontWeight: 700 }}>Member Contribution Summary</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {dashboard.member_summaries.map((m, idx) => (
                  <div key={idx} style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>{m.name}</strong>
                      <span style={{ fontWeight: 700, color: m.net > 0 ? "#10b981" : m.net < 0 ? "#ef4444" : "#64748b" }}>
                        {m.net > 0 ? `+₹${m.net.toLocaleString()}` : m.net < 0 ? `-₹${Math.abs(m.net).toLocaleString()}` : "Settled"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#64748b", marginTop: "4px" }}>
                      <span>Total Paid: ₹{m.paid.toLocaleString()}</span>
                      <span>Total Share: ₹{m.share.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SETTINGS */}
      {activeTab === "settings" && (
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)", maxWidth: "600px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", fontWeight: 700 }}>Group Settings</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="form-group">
              <label>Group Name</label>
              <input type="text" value={group.name} readOnly style={{ background: "#f8fafc" }} />
            </div>

            <div className="form-group">
              <label>Group Type</label>
              <input type="text" value={group.group_type} readOnly style={{ background: "#f8fafc" }} />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea rows={2} value={group.description || "No description set"} readOnly style={{ background: "#f8fafc" }} />
            </div>

            {isAdmin ? (
              <div style={{ marginTop: "20px", borderTop: "1px solid #fee2e2", paddingTop: "18px" }}>
                <h4 style={{ color: "#b91c1c", margin: "0 0 6px" }}>Danger Zone</h4>
                <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0 0 12px" }}>
                  Deleting this group will erase all group expenses, member splits, and settlements permanently.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteGroup}
                  style={{
                    padding: "9px 16px",
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "0.85rem"
                  }}
                >
                  Delete Group Permanently
                </button>
              </div>
            ) : (
              <div style={{ marginTop: "20px", borderTop: "1px solid #e2e8f0", paddingTop: "18px" }}>
                <button
                  type="button"
                  onClick={() => handleRemoveMember(currentUser?.id, "yourself")}
                  style={{
                    padding: "9px 16px",
                    background: "#f1f5f9",
                    color: "#ef4444",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "0.85rem"
                  }}
                >
                  Leave Group
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      {showAddExpense && (
        <AddGroupExpenseModal
          groupId={groupId}
          members={members}
          currentUser={currentUser}
          onClose={() => setShowAddExpense(false)}
          onExpenseAdded={loadAllGroupData}
        />
      )}

      {showInviteModal && (
        <InviteMembersModal
          group={group}
          onClose={() => setShowInviteModal(false)}
          onMembersInvited={loadAllGroupData}
        />
      )}

      {showSettleModal && (
        <RecordSettlementModal
          groupId={groupId}
          members={members}
          currentUser={currentUser}
          initialPayerId={settlePreload.payerId}
          initialReceiverId={settlePreload.receiverId}
          initialAmount={settlePreload.amount}
          onClose={() => setShowSettleModal(false)}
          onSettled={loadAllGroupData}
        />
      )}

      {/* Payment Receipt Preview Modal */}
      {viewingReceiptUrl && (
        <div className="modal-backdrop" onClick={() => setViewingReceiptUrl(null)}>
          <div className="modal-card receipt-view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText size={20} color="#7557E8" />
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Payment Receipt Proof</h3>
              </div>
              <button
                type="button"
                className="modal-close-button"
                onClick={() => setViewingReceiptUrl(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: "center", padding: "16px" }}>
              {viewingReceiptUrl.toLowerCase().endsWith(".pdf") ? (
                <div style={{ padding: "30px 10px" }}>
                  <FileText size={48} color="#ef4444" style={{ margin: "0 auto 12px" }} />
                  <p style={{ fontWeight: 600, marginBottom: "16px" }}>PDF Receipt Document Attached</p>
                  <a
                    href={viewingReceiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="primary-button"
                    style={{ textDecoration: "none", display: "inline-block" }}
                  >
                    Open PDF Document
                  </a>
                </div>
              ) : (
                <img
                  src={viewingReceiptUrl}
                  alt="Payment Receipt"
                  style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: "10px", objectFit: "contain" }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
