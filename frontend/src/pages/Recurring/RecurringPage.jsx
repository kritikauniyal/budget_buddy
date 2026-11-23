import React, { useState, useEffect } from "react";
import {
  Repeat,
  Plus,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowRight,
  X
} from "lucide-react";
import api from "../../services/api";

export default function RecurringPage() {
  const [recurringList, setRecurringList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category_name: "Bills",
    frequency: "monthly",
    next_due_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const loadRecurring = async () => {
    setLoading(true);
    try {
      const data = await api.getRecurringExpenses();
      setRecurringList(data || []);
    } catch (err) {
      console.warn("Could not load recurring expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecurring();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.amount) return;

    setSubmitting(true);
    setErrorMsg("");
    try {
      await api.createRecurringExpense({
        title: formData.title.trim(),
        amount: parseFloat(formData.amount),
        category_name: formData.category_name,
        frequency: formData.frequency,
        next_due_date: formData.next_due_date,
        notes: formData.notes.trim() || null,
      });
      setShowModal(false);
      setFormData({
        title: "",
        amount: "",
        category_name: "Bills",
        frequency: "monthly",
        next_due_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setFeedbackMsg("Recurring expense created successfully!");
      setTimeout(() => setFeedbackMsg(""), 4000);
      await loadRecurring();
    } catch (err) {
      setErrorMsg(err.message || "Failed to create recurring expense.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this recurring expense?")) return;
    try {
      await api.deleteRecurringExpense(id);
      await loadRecurring();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleLogNow = async (id, title) => {
    try {
      const res = await api.logRecurringExpenseNow(id);
      setFeedbackMsg(res.message || `Logged ${title} into your live expenses!`);
      setTimeout(() => setFeedbackMsg(""), 4000);
      await loadRecurring();
    } catch (err) {
      alert("Failed to log expense: " + err.message);
    }
  };

  const totalMonthlyRecurring = recurringList
    .filter((r) => r.is_active)
    .reduce((sum, r) => {
      if (r.frequency === "monthly") return sum + r.amount;
      if (r.frequency === "weekly") return sum + r.amount * 4.33;
      if (r.frequency === "daily") return sum + r.amount * 30;
      if (r.frequency === "yearly") return sum + r.amount / 12;
      return sum + r.amount;
    }, 0);

  return (
    <div className="module-page">
      <div className="welcome-section" style={{ flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2>Recurring Expenses</h2>
          <p>Automate regular bills, subscriptions, and periodic payments so you never miss a due date.</p>
        </div>

        <button className="primary-button" onClick={() => setShowModal(true)}>
          <Plus size={17} />
          Add Recurring Bill
        </button>
      </div>

      {feedbackMsg && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "12px 16px", borderRadius: "10px", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem" }}>
          <CheckCircle2 size={18} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* KPI STATS */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-top">
            <span>Estimated Monthly Commitment</span>
            <div className="stat-icon purple">
              <Repeat size={20} />
            </div>
          </div>
          <h2>₹{totalMonthlyRecurring.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          <div className="stat-footer">
            <span className="positive-change">{recurringList.length} Active Subscriptions / Bills</span>
          </div>
        </div>
      </div>

      {/* LIST OF RECURRING ITEMS */}
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Your Scheduled Subscriptions & Bills</h3>
            <p>Upcoming recurring expenses automatically tracked for your budget</p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "36px", textAlign: "center", color: "#64748b" }}>
            Loading recurring expenses...
          </div>
        ) : recurringList.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "36px", marginBottom: "8px" }}>📅</div>
            <h4>No recurring bills scheduled</h4>
            <p style={{ color: "#64748b", maxWidth: "400px", margin: "4px auto 16px", fontSize: "0.88rem" }}>
              Keep track of recurring rent, broadband, streaming subscriptions, and utility bills easily.
            </p>
            <button className="primary-button" onClick={() => setShowModal(true)} style={{ margin: "0 auto" }}>
              <Plus size={16} /> Add Your First Bill
            </button>
          </div>
        ) : (
          <div className="mobile-tx-feed">
            {recurringList.map((item) => (
              <div className="mobile-tx-card" key={item.id} style={{ alignItems: "center" }}>
                <div className="mobile-tx-avatar" style={{ backgroundColor: "#eff6ff" }}>
                  <Repeat size={20} color="#4f46e5" />
                </div>

                <div className="mobile-tx-info" style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong className="mobile-tx-title">{item.title}</strong>
                    <span className="mobile-tx-amount expense">
                      ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px", flexWrap: "wrap", gap: "6px" }}>
                    <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      <span style={{ textTransform: "capitalize", fontWeight: 600, color: "#7557E8" }}>{item.frequency}</span> • Category: {item.category_name} • Due: {item.next_due_date}
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => handleLogNow(item.id, item.title)}
                        style={{
                          background: "rgba(34, 184, 160, 0.12)",
                          color: "#0d9488",
                          border: "1px solid rgba(34, 184, 160, 0.3)",
                          borderRadius: "6px",
                          padding: "4px 8px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <CheckCircle2 size={13} /> Log Expense Now
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          padding: "4px"
                        }}
                        title="Delete recurring bill"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-card" style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="modal-icon-badge" style={{ background: "rgba(117, 87, 232, 0.12)", color: "#7557E8" }}>
                  <Repeat size={22} />
                </div>
                <div>
                  <h3>Add Recurring Bill</h3>
                  <p style={{ margin: 0, fontSize: "0.84rem", color: "#64748b" }}>
                    Schedule automated tracking for periodic expenses
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" type="button" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div className="auth-alert error" style={{ margin: "14px 20px 0" }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ padding: "18px 20px" }}>
                <div className="form-group">
                  <label>Bill / Subscription Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Netflix, Room Rent, Wi-Fi"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Frequency</label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={formData.category_name}
                      onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                    >
                      <option value="Bills">Bills</option>
                      <option value="Rent">Rent</option>
                      <option value="Internet">Internet</option>
                      <option value="Electricity">Electricity</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Grocery">Grocery</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Next Due Date</label>
                    <input
                      type="date"
                      required
                      value={formData.next_due_date}
                      onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Auto-debits from HDFC account"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ padding: "14px 20px" }}>
                <button type="button" className="secondary-button" onClick={() => setShowModal(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Saving..." : "Create Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

