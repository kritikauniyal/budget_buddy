import React, { useState, useEffect } from "react";
import { Plus, Check, X, Users, AlertCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import api from "../../services/api";
import { confirmAction, confirmDelete, showError, showSuccess } from "../../utils/swal";

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
      showSuccess("Expense submitted for group review!");
    } catch (err) {
      showError("Submission error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    const isConfirmed = await confirmAction({
      title: "Approve Expense?",
      text: "This expense will be added to your live spending records.",
      confirmButtonText: "Yes, approve",
      confirmButtonColor: "#16a34a",
      icon: "question"
    });
    if (!isConfirmed) return;

    try {
      await api.approveGroupExpense(id);
      showSuccess("Expense approved!");
      await loadInbox();
    } catch (err) {
      showError("Error approving expense", err.message);
    }
  };

  const handleRejectConfirm = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;

    try {
      await api.rejectGroupExpense(rejectingId, rejectReason);
      setRejectingId(null);
      setRejectReason("");
      showSuccess("Expense rejected");
      await loadInbox();
    } catch (err) {
      showError("Error rejecting expense", err.message);
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
          <p>Review shared expenses submitted by group members before adding them to your personal spending.</p>
        </div>

        <button className="primary-button" onClick={() => setShowSubmitModal(true)}>
          <Plus size={18} />
          Submit Group Expense
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-top">
            <span>Pending Approvals</span>
            <div className="stat-icon purple">
              <Clock size={21} />
            </div>
          </div>
          <h2>{pendingCount} Items</h2>
          <div className="stat-footer">
            <span className="positive-change">Awaiting your review</span>
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
        {/* Mobile View: Clean Card Feed */}
        <div className="mobile-tx-feed">
          {items.length === 0 ? (
            <div className="empty-tx-mobile">
              <div className="empty-tx-icon">📥</div>
              <h5>{loading ? "Loading inbox..." : "No inbox records found"}</h5>
              <p>Submitted shared expenses from group members will appear here for review.</p>
              <button
                type="button"
                className="empty-add-btn"
                onClick={() => setShowSubmitModal(true)}
              >
                + Submit Expense
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div className="mobile-tx-card" key={`mob-inbox-${item.id}`}>
                <div className="mobile-tx-avatar" style={{ backgroundColor: "#f3e8ff" }}>
                  <span className="mobile-tx-icon">{item.category_icon || "👥"}</span>
                </div>

                <div className="mobile-tx-info">
                  <strong className="mobile-tx-title">{item.title}</strong>
                  <div className="mobile-tx-meta">
                    <span className="mobile-tx-cat">{item.group_name || "Group"}</span>
                    <span className="mobile-tx-dot">•</span>
                    <span className="mobile-tx-cat">By {item.submitted_by}</span>
                    <span className="mobile-tx-dot">•</span>
                    <span className="mobile-tx-date">{item.created_at}</span>
                  </div>
                </div>

                <div className="mobile-tx-right">
                  <span className="mobile-tx-amount" style={{ color: "#1e293b", fontWeight: 700 }}>
                    ₹{item.amount.toLocaleString("en-IN")}
                  </span>
                  {item.status === "pending" ? (
                    <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                      <button
                        type="button"
                        className="icon-button"
                        style={{ width: "30px", height: "30px", color: "#10b981", background: "rgba(16, 185, 129, 0.1)" }}
                        onClick={() => handleApprove(item.id)}
                        title="Approve"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        style={{ width: "30px", height: "30px", color: "#ef4444", background: "rgba(239, 68, 68, 0.1)" }}
                        onClick={() => setRejectingId(item.id)}
                        title="Reject"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`status-pill ${item.status === "approved" ? "pill-normal" : "pill-danger"}`}
                      style={{ marginTop: "4px", fontSize: "10px", padding: "2px 6px" }}
                    >
                      {item.status === "approved" ? "Approved" : "Rejected"}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Detailed Table */}
        <div className="desktop-table-container">
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
