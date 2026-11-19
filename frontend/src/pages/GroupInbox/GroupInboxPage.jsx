import React, { useState, useEffect } from "react";
import { Plus, Check, X, Users, AlertCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import api from "../../services/api";

export default function GroupInboxPage() {
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    group_id: "",
    category_name: "Food",
    payment_method: "UPI",
    description: "",
  });

  // Load groups for submission modal only
  useEffect(() => {
    api.getGroups()
      .then((data) => {
        setGroups(data || []);
        if (data && data.length > 0 && !formData.group_id) {
          setFormData((prev) => ({ ...prev, group_id: data[0].id }));
        }
      })
      .catch((err) => console.warn("Could not load groups:", err));
  }, []);

  const loadInbox = async () => {
    setLoading(true);
    try {
      const data = await api.getGroupInbox(statusFilter);
      setItems(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInbox();
  }, [statusFilter]);

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;

    setSubmitting(true);
    try {
      await api.submitGroupExpense({
        title: formData.title,
        amount: parseFloat(formData.amount),
        group_id: formData.group_id ? parseInt(formData.group_id) : (groups[0]?.id || null),
        category_name: formData.category_name,
        payment_method: formData.payment_method,
        description: formData.description,
      });
      setShowSubmitModal(false);
      setFormData({
        title: "",
        amount: "",
        group_id: groups[0]?.id || "",
        category_name: "Food",
        payment_method: "UPI",
        description: "",
      });
      await loadInbox();
    } catch (err) {
      alert("Submission error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this expense? It will be added to your live expenses.")) return;
    try {
      await api.approveGroupExpense(id);
      await loadInbox();
    } catch (err) {
      alert("Error approving expense: " + err.message);
    }
  };

  const handleRejectConfirm = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;

    try {
      await api.rejectGroupExpense(rejectingId, rejectReason);
      setRejectingId(null);
      setRejectReason("");
      await loadInbox();
    } catch (err) {
      alert("Error rejecting expense: " + err.message);
    }
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;

  const getGroupIcon = (type) => {
    switch (type) {
      case "Trip": return "✈️";
      case "Roommates": return "🏠";
      case "Family": return "👨‍👩‍👧‍👦";
      case "Office": return "💼";
      default: return "👥";
    }
  };

  return (
    <div className="module-page">
      <div className="welcome-section" style={{ flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2>Group Inbox</h2>
          <p>Review and approve shared team or group expenses before they hit your live records.</p>
        </div>

        <button className="primary-button" onClick={() => setShowSubmitModal(true)}>
          <Plus size={18} />
          Submit Shared Expense
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-top">
            <span>Pending Review</span>
            <div className="stat-icon purple">
              <Clock size={21} />
            </div>
          </div>
          <h2>{pendingCount} Items</h2>
          <div className="stat-footer">
            <span className="positive-change">Requires action</span>
            <span>All Groups</span>
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="filter-tabs" style={{ marginBottom: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          { label: "All Submissions", value: "" },
          { label: "Pending", value: "pending" },
          { label: "Approved", value: "approved" },
          { label: "Rejected", value: "rejected" },
        ].map((tab) => (
          <button
            key={tab.value}
            className={`tab-pill ${statusFilter === tab.value ? "active" : ""}`}
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="panel">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>EXPENSE / SUBMITTER</th>
                <th>GROUP</th>
                <th>CATEGORY</th>
                <th>PAYMENT</th>
                <th>AMOUNT</th>
                <th>DATE SUBMITTED</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "32px", color: "#8a90a2" }}>
                    {loading ? "Loading submissions..." : "No inbox records found."}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div>
                        <strong>{item.title}</strong>
                        <div style={{ fontSize: "11px", color: "#8a90a2", marginTop: "2px" }}>
                          By {item.submitted_by} {item.description && `• ${item.description}`}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="group-badge">
                        <span>{getGroupIcon(item.group_type)}</span>
                        <span>{item.group_name || "General Group"}</span>
                      </span>
                    </td>
                    <td>
                      <span className="payment-badge">
                        {item.category_icon} {item.category_name}
                      </span>
                    </td>
                    <td>{item.payment_method}</td>
                    <td className="amount" style={{ color: "#191b35", fontWeight: "700" }}>
                      ₹{item.amount.toLocaleString("en-IN")}
                    </td>
                    <td style={{ fontSize: "12px", color: "#646b7b" }}>{item.created_at}</td>
                    <td>
                      {item.status === "pending" && (
                        <span className="status-pill pill-warning">Pending Review</span>
                      )}
                      {item.status === "approved" && (
                        <span className="status-pill pill-normal">Approved</span>
                      )}
                      {item.status === "rejected" && (
                        <span
                          className="status-pill pill-danger"
                          title={item.rejection_reason || "Rejected"}
                        >
                          Rejected
                        </span>
                      )}
                    </td>
                    <td>
                      {item.status === "pending" ? (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            className="action-btn"
                            style={{ color: "#10b981", background: "rgba(16, 185, 129, 0.1)" }}
                            onClick={() => handleApprove(item.id)}
                            title="Approve Expense"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            className="action-btn"
                            style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.1)" }}
                            onClick={() => setRejectingId(item.id)}
                            title="Reject Expense"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: "11px", color: "#9ca3af" }}>Archived</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SUBMIT EXPENSE MODAL */}
      {showSubmitModal && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowSubmitModal(false); }}>
          <div className="modal-card" style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="modal-icon-badge" style={{ background: "rgba(117, 87, 232, 0.12)", color: "#7557E8" }}>
                  <Users size={22} />
                </div>
                <div>
                  <h3>Submit Shared Expense</h3>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                    Send an expense into the Group Inbox for review.
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" type="button" onClick={() => setShowSubmitModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* GROUP SELECTOR IN MODAL */}
                <div className="form-group">
                  <label>Select Group *</label>
                  <select
                    required
                    value={formData.group_id}
                    onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {getGroupIcon(g.group_type)} {g.name}
                      </option>
                    ))}
                    {groups.length === 0 && (
                      <option value="">General Group</option>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>Expense Title *</label>
                  <input
                    required
                    placeholder="e.g. Team Dinner, Taxi to Client"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Amount (₹) *</label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category_name}
                    onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                  >
                    <option value="Food">Food</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Travel">Travel</option>
                    <option value="Bills">Bills</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Notes / Justification</label>
                  <textarea
                    rows={2}
                    placeholder="Provide explanation or receipt reference..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="secondary-button" onClick={() => setShowSubmitModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit for Approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT REASON MODAL */}
      {rejectingId && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setRejectingId(null); }}>
          <div className="modal-card" style={{ maxWidth: "460px" }}>
            <div className="modal-header">
              <div>
                <h3>Reject Expense</h3>
                <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                  Provide a reason for rejecting this submission.
                </p>
              </div>
              <button className="modal-close-btn" type="button" onClick={() => setRejectingId(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRejectConfirm}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Rejection Reason *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Duplicate submission, receipt missing, unapproved activity..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="secondary-button" onClick={() => setRejectingId(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  style={{ background: "#dc2626" }}
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
