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
  { id: "balances", label: "Balances & Settlements" },
  { id: "members", label: "Members & Invites" },
  { id: "settings", label: "Settings" },
];

export default function GroupDetailView({ groupId, currentUser, onBack }) {
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
      {/* Group Header Banner */}
      <div className="group-detail-header" style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "20px 24px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
        marginBottom: "20px"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button
              onClick={onBack}
              className="secondary-button"
              style={{ padding: "8px 12px", minWidth: "auto", borderRadius: "10px" }}
              title="Back to all groups"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 700 }}>{group.name}</h2>
                <span style={{
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  background: "rgba(117, 87, 232, 0.12)",
                  color: "#7557E8"
                }}>
                  {group.group_type}
                </span>
                {isAdmin && (
                  <span style={{
                    padding: "3px 10px",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    background: "rgba(34, 184, 160, 0.15)",
                    color: "#0f766e"
                  }}>
                    Admin
                  </span>
                )}
              </div>
              {group.description && (
                <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "#64748b" }}>
                  {group.description}
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={loadAllGroupData}
              className="secondary-button"
              style={{ padding: "9px 12px", minWidth: "auto", borderRadius: "10px" }}
              title="Refresh group data"
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
            </button>

            <button
              onClick={() => setShowInviteModal(true)}
              className="secondary-button"
              style={{ padding: "9px 14px", borderRadius: "10px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <UserPlus size={16} />
              <span>Invite Friends</span>
            </button>

            <button
              onClick={() => {
                setSettlePreload({ payerId: null, receiverId: null, amount: "" });
                setShowSettleModal(true);
              }}
              className="secondary-button"
              style={{ padding: "9px 14px", borderRadius: "10px", display: "inline-flex", alignItems: "center", gap: "6px", color: "#0f766e", borderColor: "#99f6e4" }}
            >
              <CheckCircle2 size={16} />
              <span>Settle Up</span>
            </button>

            <button
              onClick={() => setShowAddExpense(true)}
              className="primary-button"
              style={{ padding: "9px 18px", borderRadius: "10px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={18} />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: "flex",
          gap: "8px",
          borderTop: "1px solid #f1f5f9",
          marginTop: "18px",
          paddingTop: "12px",
          overflowX: "auto"
        }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                background: activeTab === t.id ? "#7557E8" : "transparent",
                color: activeTab === t.id ? "#ffffff" : "#64748b",
                fontWeight: activeTab === t.id ? 600 : 500,
                fontSize: "0.88rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap"
              }}
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

      {/* TAB 2: EXPENSES LIST */}
      {activeTab === "expenses" && (
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Group Expenses ({expenses.length})</h3>
              <p style={{ margin: "2px 0 0", fontSize: "0.84rem", color: "#64748b" }}>
                Track who paid, split breakdowns, and member shares
              </p>
            </div>
            <button
              onClick={() => setShowAddExpense(true)}
              className="primary-button"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} />
              <span>Add Expense</span>
            </button>
          </div>

          {expenses.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {expenses.map((e) => (
                <div
                  key={e.id}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(117, 87, 232, 0.12)", display: "grid", placeItems: "center", fontSize: "1.3rem" }}>
                        {e.category_icon || "💳"}
                      </div>
                      <div>
                        <strong style={{ fontSize: "1rem" }}>{e.title}</strong>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                          Paid by <strong>{e.payer_name}</strong> • {e.expense_date} • {e.category_name} • {e.payment_method}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1e293b" }}>
                        ₹{e.amount.toLocaleString()}
                      </span>
                      {(e.paid_by === currentUser?.id || isAdmin) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(e.id)}
                          style={{ border: "none", background: "transparent", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                          title="Delete Expense"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Split Breakdown */}
                  {e.splits && e.splits.length > 0 && (
                    <div style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      background: "#ffffff",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #f1f5f9",
                      fontSize: "0.78rem"
                    }}>
                      <span style={{ fontWeight: 600, color: "#64748b" }}>Splits:</span>
                      {e.splits.map((s) => (
                        <span key={s.id} style={{ color: "#334155" }}>
                          <strong>{s.user_name}</strong> owes ₹{s.owed_amount.toLocaleString()}
                        </span>
                      ))}
                    </div>
                  )}

                  {e.description && (
                    <div style={{ fontSize: "0.8rem", color: "#64748b", fontStyle: "italic" }}>
                      "{e.description}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
              <Receipt size={40} style={{ margin: "0 auto 10px", color: "#cbd5e1" }} />
              <p style={{ margin: 0, fontSize: "0.95rem" }}>No expenses recorded yet.</p>
              <span style={{ fontSize: "0.82rem" }}>Add lunch, road trip fuel, groceries or hotel bookings!</span>
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

          {/* Member Net Balances Table */}
          <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "1.1rem", fontWeight: 700 }}>Individual Member Balances</h3>
            <div style={{ overflowX: "auto" }}>
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
    </div>
  );
}
