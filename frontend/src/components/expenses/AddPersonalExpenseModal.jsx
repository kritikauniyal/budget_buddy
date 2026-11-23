import React, { useState } from "react";
import {
  X,
  Receipt,
  Check,
  AlertCircle,
  Calendar,
  CreditCard,
  UploadCloud,
  FileText,
  Trash2
} from "lucide-react";
import api from "../../services/api";

const CATEGORIES = [
  { name: "Food", icon: "🍔" },
  { name: "Grocery", icon: "🛒" },
  { name: "Rent", icon: "🏠" },
  { name: "Electricity", icon: "⚡" },
  { name: "Water", icon: "💧" },
  { name: "Internet", icon: "🌐" },
  { name: "Transportation", icon: "🚗" },
  { name: "Shopping", icon: "🛍️" },
  { name: "Entertainment", icon: "🎟️" },
  { name: "Travel", icon: "✈️" },
  { name: "Medical", icon: "🏥" },
  { name: "Education", icon: "📚" },
  { name: "Other", icon: "📋" },
];

export default function AddPersonalExpenseModal({
  isOpen,
  onClose,
  onExpenseAdded
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  // Optional Payment Receipt / Proof
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [isPdf, setIsPdf] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("Receipt file size cannot exceed 10 MB.");
      return;
    }

    setReceiptFile(file);
    if (file.type === "application/pdf") {
      setIsPdf(true);
      setReceiptPreview(null);
    } else {
      setIsPdf(false);
      setReceiptPreview(URL.createObjectURL(file));
    }
    setError("");
  };

  const handleRemoveReceipt = () => {
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
    }
    setReceiptFile(null);
    setReceiptPreview(null);
    setIsPdf(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter an expense title.");
      return;
    }
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid amount greater than ₹0.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let uploadedReceiptUrl = null;
      if (receiptFile) {
        const uploadRes = await api.uploadReceipt(receiptFile);
        if (uploadRes && uploadRes.receipt_url) {
          uploadedReceiptUrl = uploadRes.receipt_url;
        }
      }

      await api.addExpense({
        name: name.trim(),
        amount: numAmount,
        category,
        payment_method: paymentMethod,
        transaction_date: date,
        description: description.trim() || name.trim(),
        receipt_url: uploadedReceiptUrl,
      });

      if (onExpenseAdded) {
        await onExpenseAdded();
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save expense.");
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
      <div className="modal-card" style={{ maxWidth: "520px" }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              className="modal-icon-badge"
              style={{ background: "#fef2f2", color: "#ef4444" }}
            >
              <Receipt size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
                Add Personal Expense
              </h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                Record your daily spending and keep budgets on track
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
          {/* Title & Amount */}
          <div className="form-group-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Expense Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Grocery, Lunch, Coffee, Fuel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group" style={{ flex: 1.3 }}>
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
                />
              </div>
            </div>
          </div>

          {/* Category Chips */}
          <div className="form-group">
            <label>Category</label>
            <div className="category-scroll-chips">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  className={`category-chip ${category === cat.name ? "active" : ""}`}
                  onClick={() => setCategory(cat.name)}
                >
                  <span className="cat-chip-icon">{cat.icon}</span>
                  <span className="cat-chip-name">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method & Date */}
          <div className="form-group-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Payment Method</label>
              <select
                className="form-input form-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Cash">Cash</option>
                <option value="Card">Debit / Credit Card</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>Date</label>
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
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description / Note (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Paid at Starbucks, bill #482"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Optional Receipt Attachment */}
          <div className="form-group" style={{ marginTop: "4px" }}>
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Attach Receipt / Proof (Optional)</span>
              <span style={{ fontSize: "0.78rem", color: "#64748b" }}>JPG, PNG, PDF (Max 10MB)</span>
            </label>

            {!receiptFile ? (
              <label className="receipt-upload-dropzone">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <div className="dropzone-content">
                  <div className="dropzone-icon">
                    <UploadCloud size={22} />
                  </div>
                  <div>
                    <strong>Upload Bill or Screenshot</strong>
                    <p>Tap to select file or camera snapshot</p>
                  </div>
                </div>
              </label>
            ) : (
              <div className="receipt-preview-card">
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                  {receiptPreview ? (
                    <img
                      src={receiptPreview}
                      alt="Receipt"
                      className="receipt-thumbnail"
                    />
                  ) : (
                    <div className="receipt-thumbnail pdf-thumb">
                      <FileText size={24} color="#ef4444" />
                    </div>
                  )}
                  <div className="receipt-file-info">
                    <span className="receipt-filename">{receiptFile.name}</span>
                    <span className="receipt-filesize">
                      {(receiptFile.size / 1024).toFixed(1)} KB • {isPdf ? "PDF Document" : "Image Proof"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <label className="receipt-replace-btn" title="Replace file">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                    <span>Replace</span>
                  </label>
                  <button
                    type="button"
                    className="receipt-remove-btn"
                    onClick={handleRemoveReceipt}
                    title="Remove attachment"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
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
                  <span>Save Expense</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
