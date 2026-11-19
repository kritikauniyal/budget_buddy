import React, { useState } from "react";
import { X, CheckCircle2, ArrowRight, DollarSign, AlertCircle } from "lucide-react";
import api from "../../services/api";

export default function RecordSettlementModal({
  groupId,
  members = [],
  currentUser,
  initialPayerId = null,
  initialReceiverId = null,
  initialAmount = "",
  onClose,
  onSettled
}) {
  const [payerId, setPayerId] = useState(() => initialPayerId || currentUser?.id || (members[0]?.user_id || 1));
  const [receiverId, setReceiverId] = useState(() => initialReceiverId || (members.find((m) => m.user_id !== (initialPayerId || currentUser?.id))?.user_id || 2));
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : "");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const numAmount = parseFloat(amount) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (payerId === receiverId) {
      setError("Payer and receiver cannot be the same person.");
      return;
    }
    if (numAmount <= 0) {
      setError("Please enter a settlement amount greater than 0.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.recordGroupSettlement(groupId, {
        payer_id: payerId,
        receiver_id: receiverId,
        amount: numAmount,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
      });

      if (onSettled) {
        onSettled();
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to record settlement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: "500px" }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="modal-icon-badge" style={{ background: "rgba(34, 184, 160, 0.12)", color: "#0d9488" }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h3>Record Settlement (Settle Up)</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                Record a direct payment between two members
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

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: "18px 20px" }}>
            {/* Visual Settlement Flow */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#f8fafc",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              marginBottom: "16px"
            }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "0.78rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                  Payer (Paid Money)
                </label>
                <select
                  value={payerId}
                  onChange={(e) => setPayerId(parseInt(e.target.value))}
                  style={{ width: "100%", fontSize: "0.88rem" }}
                >
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.full_name} {currentUser && currentUser.id === m.user_id ? "(You)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ padding: "0 10px", color: "#7557E8", display: "grid", placeItems: "center" }}>
                <ArrowRight size={22} />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "0.78rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                  Receiver (Received Money)
                </label>
                <select
                  value={receiverId}
                  onChange={(e) => setReceiverId(parseInt(e.target.value))}
                  style={{ width: "100%", fontSize: "0.88rem" }}
                >
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.full_name} {currentUser && currentUser.id === m.user_id ? "(You)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount */}
            <div className="form-group">
              <label>Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {/* Payment Method */}
            <div className="form-group">
              <label>Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="Cash">Cash in Hand</option>
                <option value="Bank Transfer">Bank Transfer (IMPS / NEFT)</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label>Notes / Transaction Reference (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Paid via GPay txn #98234"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ padding: "14px 20px" }}>
            <button type="button" className="secondary-button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
