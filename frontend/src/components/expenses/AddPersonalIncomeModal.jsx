import React, { useState } from "react";
import {
  X,
  TrendingUp,
  Check,
  AlertCircle,
  Calendar,
  Wallet
} from "lucide-react";
import api from "../../services/api";

const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Bonus",
  "Investments",
  "Rental",
  "Gift / Allowance",
  "Refund",
  "Other Income"
];

export default function AddPersonalIncomeModal({
  isOpen,
  onClose,
  onIncomeAdded
}) {
  const [amount, setAmount] = useState("");
  const [categoryName, setCategoryName] = useState("Salary");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid income amount greater than ₹0.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.addIncome({
        category_name: categoryName,
        amount: numAmount,
        description: description.trim() || categoryName,
        transaction_date: date,
      });

      if (onIncomeAdded) {
        await onIncomeAdded();
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to record income.");
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
      <div className="modal-card" style={{ maxWidth: "480px" }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              className="modal-icon-badge"
              style={{ background: "#f0fdf4", color: "#16a34a" }}
            >
              <TrendingUp size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
                Add Income
              </h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                Record salary, freelance earnings, or cash deposits
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="auth-alert error" style={{ margin: "16px 20px 0" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Amount */}
          <div className="form-group">
            <label>Amount (₹) *</label>
            <div className="input-with-prefix">
              <span className="input-prefix">₹</span>
              <input
                type="number"
                step="any"
                min="0.01"
                className="form-input prefix-padding"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Income Source / Category */}
          <div className="form-group">
            <label>Income Source / Category</label>
            <select
              className="form-input form-select"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            >
              {INCOME_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="form-group">
            <label>Date Received</label>
            <div className="input-with-icon">
              <Calendar size={16} className="input-icon-left" />
              <input
                type="date"
                className="form-input icon-padding-left"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description / Memo (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. October monthly salary, client milestone"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Modal Actions */}
          <div className="modal-actions" style={{ marginTop: "20px" }}>
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                flex: 1,
                background: "#16a34a",
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-small" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>Save Income</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

