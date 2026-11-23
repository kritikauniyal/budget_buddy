import React, { useState, useEffect } from "react";
import {
  X,
  Receipt,
  Check,
  AlertCircle,
  Percent,
  Hash,
  DollarSign,
  Users,
  Calendar,
  CreditCard,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Trash2,
  Sparkles
} from "lucide-react";
import api from "../../services/api";

const EXPENSE_CATEGORIES = [
  { name: "Food", icon: "🍔", color: "#7557E8" },
  { name: "Grocery", icon: "🛒", color: "#10b981" },
  { name: "Rent", icon: "🏠", color: "#3b82f6" },
  { name: "Electricity", icon: "⚡", color: "#f59e0b" },
  { name: "Water", icon: "💧", color: "#06b6d4" },
  { name: "Internet", icon: "🌐", color: "#8b5cf6" },
  { name: "Transportation", icon: "🚗", color: "#ec4899" },
  { name: "Shopping", icon: "🛍️", color: "#E58DAA" },
  { name: "Entertainment", icon: "🎟️", color: "#A855F7" },
  { name: "Travel", icon: "✈️", color: "#F4AE50" },
  { name: "Medical", icon: "🏥", color: "#ef4444" },
  { name: "Education", icon: "📚", color: "#6366f1" },
  { name: "Other", icon: "📋", color: "#64748B" },
];

export default function AddGroupExpenseModal({
  groupId,
  members = [],
  currentUser,
  onClose,
  onExpenseAdded
}) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryName, setCategoryName] = useState("Food");
  const [paidBy, setPaidBy] = useState(
    currentUser ? currentUser.id : (members[0]?.user_id || 1)
  );
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState("");

  // Split Type: 'equal' (DEFAULT) | 'percentage' | 'exact' | 'shares'
  const [splitType, setSplitType] = useState("equal");
  const [selectedParticipants, setSelectedParticipants] = useState(() =>
    members.map((m) => m.user_id)
  );

  // Exact amounts input state (userId -> amount string)
  const [customSplits, setCustomSplits] = useState({});

  // Percentage inputs state (userId -> percentage string)
  const [percentSplits, setPercentSplits] = useState({});

  // Shares inputs state (userId -> share count string)
  const [shareCounts, setShareCounts] = useState({});

  // Optional Payment Receipt / Proof Upload
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [isPdf, setIsPdf] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize splits when members change
  useEffect(() => {
    if (members.length > 0) {
      setSelectedParticipants(members.map((m) => m.user_id));

      const initC = {};
      const initP = {};
      const initS = {};
      // Calculate clean equal percentage distribution
      const basePct = (100 / members.length).toFixed(1);
      members.forEach((m) => {
        initC[m.user_id] = "";
        initP[m.user_id] = basePct;
        initS[m.user_id] = "1";
      });
      setCustomSplits(initC);
      setPercentSplits(initP);
      setShareCounts(initS);

      if (currentUser && members.some((m) => m.user_id === currentUser.id)) {
        setPaidBy(currentUser.id);
      } else if (members[0]) {
        setPaidBy(members[0].user_id);
      }
    }
  }, [members, currentUser]);

  const numAmount = parseFloat(amount) || 0;

  // Toggle participant for equal split
  const toggleParticipant = (userId) => {
    setSelectedParticipants((prev) => {
      if (prev.includes(userId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Calculations for Equal split
  const activeCount = selectedParticipants.length;
  const equalSharePerPerson =
    activeCount > 0 ? (numAmount / activeCount).toFixed(2) : "0.00";

  // Calculations for Exact split
  const exactSum = selectedParticipants.reduce((sum, uid) => {
    return sum + (parseFloat(customSplits[uid]) || 0);
  }, 0);
  const exactDiff = Math.round((numAmount - exactSum) * 100) / 100;

  // Calculations for Percentage split
  const totalPercent = selectedParticipants.reduce((sum, uid) => {
    return sum + (parseFloat(percentSplits[uid]) || 0);
  }, 0);
  const roundedTotalPct = Math.round(totalPercent * 10) / 10;
  const isPercentValid = Math.abs(roundedTotalPct - 100.0) <= 0.1;

  // Calculations for Shares
  const totalShares = selectedParticipants.reduce((sum, uid) => {
    return sum + (parseFloat(shareCounts[uid]) || 0);
  }, 0);

  // File selection handler
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
    if (!title.trim()) {
      setError("Please enter an expense title.");
      return;
    }
    if (numAmount <= 0) {
      setError("Please enter a valid amount greater than ₹0.");
      return;
    }

    let payloadSplits = null;
    let participantIds = null;

    if (splitType === "equal") {
      participantIds = selectedParticipants;
      if (participantIds.length === 0) {
        setError("Please select at least one member to split with.");
        return;
      }
    } else if (splitType === "percentage") {
      if (!isPercentValid) {
        setError(
          `Total percentage must equal exactly 100%. Currently it is ${roundedTotalPct.toFixed(1)}%.`
        );
        return;
      }
      payloadSplits = selectedParticipants.map((uid) => {
        const pct = parseFloat(percentSplits[uid]) || 0;
        const owed = Math.round(((numAmount * pct) / 100) * 100) / 100;
        return {
          user_id: uid,
          owed_amount: owed,
          percentage: pct,
        };
      });
      // Adjust small 1-cent rounding difference to payer or first member
      const calcTotal = payloadSplits.reduce((acc, curr) => acc + curr.owed_amount, 0);
      const diff = Math.round((numAmount - calcTotal) * 100) / 100;
      if (payloadSplits.length > 0 && diff !== 0) {
        payloadSplits[0].owed_amount =
          Math.round((payloadSplits[0].owed_amount + diff) * 100) / 100;
      }
    } else if (splitType === "exact") {
      if (Math.abs(exactDiff) > 0.05) {
        setError(
          `Sum of member shares (₹${exactSum.toFixed(2)}) must equal total expense (₹${numAmount.toFixed(2)}). Difference: ₹${exactDiff.toFixed(2)}.`
        );
        return;
      }
      payloadSplits = selectedParticipants.map((uid) => ({
        user_id: uid,
        owed_amount: parseFloat(customSplits[uid]) || 0,
      }));
    } else if (splitType === "shares") {
      if (totalShares <= 0) {
        setError("Total shares must be greater than 0.");
        return;
      }
      payloadSplits = selectedParticipants.map((uid) => {
        const sh = parseFloat(shareCounts[uid]) || 0;
        const owed = Math.round(((numAmount * sh) / totalShares) * 100) / 100;
        return {
          user_id: uid,
          owed_amount: owed,
        };
      });
      const calcTotal = payloadSplits.reduce((acc, curr) => acc + curr.owed_amount, 0);
      const diff = Math.round((numAmount - calcTotal) * 100) / 100;
      if (payloadSplits.length > 0 && diff !== 0) {
        payloadSplits[0].owed_amount =
          Math.round((payloadSplits[0].owed_amount + diff) * 100) / 100;
      }
    }

    setLoading(true);
    setError("");

    try {
      // 1. Upload receipt if attached
      let uploadedReceiptUrl = null;
      if (receiptFile) {
        const uploadRes = await api.uploadReceipt(receiptFile);
        if (uploadRes && uploadRes.receipt_url) {
          uploadedReceiptUrl = uploadRes.receipt_url;
        }
      }

      // 2. Submit group expense
      await api.addGroupExpense(groupId, {
        title: title.trim(),
        amount: numAmount,
        category_name: categoryName,
        paid_by: paidBy,
        split_type: splitType === "equal" ? "equal" : "custom",
        expense_date: expenseDate,
        payment_method: paymentMethod,
        description: description.trim() || null,
        receipt_url: uploadedReceiptUrl,
        participant_ids: participantIds,
        splits: payloadSplits,
      });

      if (onExpenseAdded) {
        onExpenseAdded();
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to record group expense.");
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = (name = "") => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase() || "MB";
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card group-expense-modal-card">
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              className="modal-icon-badge"
              style={{ background: "#eff6ff", color: "#3b82f6" }}
            >
              <Receipt size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
                Add Group Expense
              </h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                Split fairly among members with automatic balances
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
          {/* 1. Title & Amount */}
          <div className="form-group-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Expense Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Dinner, Grocery, Electricity"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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

          {/* 2. Category Selection */}
          <div className="form-group">
            <label>Category</label>
            <div className="category-scroll-chips">
              {EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  className={`category-chip ${
                    categoryName === cat.name ? "active" : ""
                  }`}
                  onClick={() => setCategoryName(cat.name)}
                >
                  <span className="cat-chip-icon">{cat.icon}</span>
                  <span className="cat-chip-name">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Paid By & Date */}
          <div className="form-group-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Paid By</label>
              <select
                className="form-input form-select"
                value={paidBy}
                onChange={(e) => setPaidBy(parseInt(e.target.value, 10))}
              >
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.user_name} {currentUser?.id === m.user_id ? "(You)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>Expense Date</label>
              <div className="input-with-icon">
                <Calendar size={16} className="input-icon-left" />
                <input
                  type="date"
                  className="form-input icon-padding-left"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 4. Split Type Selector */}
          <div className="form-group">
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Split Type</span>
              <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 500 }}>
                {splitType === "equal" && "Default • Equal for all"}
                {splitType === "percentage" && "Custom % per member"}
                {splitType === "exact" && "Enter exact ₹ amounts"}
                {splitType === "shares" && "Split by ratio/shares"}
              </span>
            </label>
            <div className="split-type-pill-selector">
              <button
                type="button"
                className={`split-pill ${splitType === "equal" ? "active" : ""}`}
                onClick={() => setSplitType("equal")}
              >
                <DollarSign size={15} />
                <span>Equal Split</span>
              </button>
              <button
                type="button"
                className={`split-pill ${splitType === "percentage" ? "active" : ""}`}
                onClick={() => setSplitType("percentage")}
              >
                <Percent size={15} />
                <span>Percentage</span>
              </button>
              <button
                type="button"
                className={`split-pill ${splitType === "exact" ? "active" : ""}`}
                onClick={() => setSplitType("exact")}
              >
                <Hash size={15} />
                <span>Exact ₹</span>
              </button>
              <button
                type="button"
                className={`split-pill ${splitType === "shares" ? "active" : ""}`}
                onClick={() => setSplitType("shares")}
              >
                <Users size={15} />
                <span>Shares</span>
              </button>
            </div>
          </div>

          {/* 5. Progressive Disclosure: Split Details Engine */}
          <div className="split-config-container">
            {/* EQUAL SPLIT (DEFAULT) */}
            {splitType === "equal" && (
              <div>
                <div className="equal-split-summary-badge">
                  <div className="equal-badge-icon">
                    <Sparkles size={18} />
                  </div>
                  <div className="equal-badge-text">
                    <strong>₹{equalSharePerPerson} per person</strong>
                    <span>
                      Divided equally between {activeCount} member{activeCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: "12px" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>
                    Split between members:
                  </span>
                  <div className="member-checkbox-grid" style={{ marginTop: "8px" }}>
                    {members.map((m) => {
                      const isChecked = selectedParticipants.includes(m.user_id);
                      return (
                        <div
                          key={m.user_id}
                          className={`member-select-card ${isChecked ? "selected" : ""}`}
                          onClick={() => toggleParticipant(m.user_id)}
                        >
                          <div className="member-avatar-circle">
                            {getUserInitials(m.user_name)}
                          </div>
                          <div className="member-select-name">
                            {m.user_name}
                            {currentUser?.id === m.user_id ? " (You)" : ""}
                          </div>
                          <div className={`custom-checkbox ${isChecked ? "checked" : ""}`}>
                            {isChecked && <Check size={14} color="#ffffff" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* PERCENTAGE SPLIT */}
            {splitType === "percentage" && (
              <div>
                <div
                  className="split-status-bar"
                  style={{
                    background: isPercentValid ? "#f0fdf4" : "#fef2f2",
                    borderColor: isPercentValid ? "#bbf7d0" : "#fecaca",
                    color: isPercentValid ? "#166534" : "#991b1b",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {isPercentValid ? <Check size={16} /> : <AlertCircle size={16} />}
                    <strong>Total: {roundedTotalPct.toFixed(1)}% / 100%</strong>
                  </div>
                  <span style={{ fontSize: "0.82rem" }}>
                    {isPercentValid
                      ? "Split is 100% balanced ✨"
                      : roundedTotalPct < 100
                      ? `${(100 - roundedTotalPct).toFixed(1)}% remaining`
                      : `${(roundedTotalPct - 100).toFixed(1)}% over 100%`}
                  </span>
                </div>

                <div className="member-split-inputs-list">
                  {members.map((m) => {
                    const pctVal = parseFloat(percentSplits[m.user_id]) || 0;
                    const calculatedOwed = numAmount > 0
                      ? ((numAmount * pctVal) / 100).toFixed(2)
                      : "0.00";

                    return (
                      <div key={m.user_id} className="member-split-input-row">
                        <div className="member-row-info">
                          <div className="member-avatar-circle">
                            {getUserInitials(m.user_name)}
                          </div>
                          <span className="member-row-name">
                            {m.user_name} {currentUser?.id === m.user_id ? "(You)" : ""}
                          </span>
                        </div>

                        <div className="split-input-with-preview">
                          <div className="input-with-suffix">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              className="split-num-input"
                              placeholder="0"
                              value={percentSplits[m.user_id] ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPercentSplits((prev) => ({
                                  ...prev,
                                  [m.user_id]: val,
                                }));
                              }}
                            />
                            <span className="input-suffix">%</span>
                          </div>
                          <div className="calculated-preview-chip">
                            ₹{calculatedOwed}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* EXACT AMOUNT SPLIT */}
            {splitType === "exact" && (
              <div>
                <div
                  className="split-status-bar"
                  style={{
                    background: Math.abs(exactDiff) <= 0.05 ? "#f0fdf4" : "#fef2f2",
                    borderColor: Math.abs(exactDiff) <= 0.05 ? "#bbf7d0" : "#fecaca",
                    color: Math.abs(exactDiff) <= 0.05 ? "#166534" : "#991b1b",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {Math.abs(exactDiff) <= 0.05 ? (
                      <Check size={16} />
                    ) : (
                      <AlertCircle size={16} />
                    )}
                    <strong>
                      Assigned: ₹{exactSum.toFixed(2)} / ₹{numAmount.toFixed(2)}
                    </strong>
                  </div>
                  <span style={{ fontSize: "0.82rem" }}>
                    {Math.abs(exactDiff) <= 0.05
                      ? "Amounts match total ✨"
                      : exactDiff > 0
                      ? `₹${exactDiff.toFixed(2)} remaining`
                      : `₹${Math.abs(exactDiff).toFixed(2)} over total`}
                  </span>
                </div>

                <div className="member-split-inputs-list">
                  {members.map((m) => (
                    <div key={m.user_id} className="member-split-input-row">
                      <div className="member-row-info">
                        <div className="member-avatar-circle">
                          {getUserInitials(m.user_name)}
                        </div>
                        <span className="member-row-name">
                          {m.user_name} {currentUser?.id === m.user_id ? "(You)" : ""}
                        </span>
                      </div>

                      <div className="input-with-prefix" style={{ width: "130px" }}>
                        <span className="input-prefix">₹</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          className="split-num-input prefix-padding"
                          placeholder="0.00"
                          value={customSplits[m.user_id] ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomSplits((prev) => ({
                              ...prev,
                              [m.user_id]: val,
                            }));
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SHARES SPLIT */}
            {splitType === "shares" && (
              <div>
                <div className="split-status-bar" style={{ background: "#f8fafc", color: "#475569" }}>
                  <span>Total Shares: <strong>{totalShares}</strong></span>
                  <span>Calculates proportionate share per person</span>
                </div>

                <div className="member-split-inputs-list">
                  {members.map((m) => {
                    const sh = parseFloat(shareCounts[m.user_id]) || 0;
                    const calculatedOwed =
                      numAmount > 0 && totalShares > 0
                        ? ((numAmount * sh) / totalShares).toFixed(2)
                        : "0.00";

                    return (
                      <div key={m.user_id} className="member-split-input-row">
                        <div className="member-row-info">
                          <div className="member-avatar-circle">
                            {getUserInitials(m.user_name)}
                          </div>
                          <span className="member-row-name">
                            {m.user_name} {currentUser?.id === m.user_id ? "(You)" : ""}
                          </span>
                        </div>

                        <div className="split-input-with-preview">
                          <div className="input-with-suffix">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              className="split-num-input"
                              placeholder="1"
                              value={shareCounts[m.user_id] ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setShareCounts((prev) => ({
                                  ...prev,
                                  [m.user_id]: val,
                                }));
                              }}
                            />
                            <span className="input-suffix">share{sh !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="calculated-preview-chip">
                            ₹{calculatedOwed}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 6. Payment Method & Optional Description */}
          <div className="form-group-row" style={{ marginTop: "14px" }}>
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

            <div className="form-group" style={{ flex: 1.5 }}>
              <label>Note / Description (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Optional memo or item details"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* 7. Optional Payment Proof / Receipt Attachment */}
          <div className="form-group" style={{ marginTop: "6px" }}>
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Attach Payment Proof (Optional)</span>
              <span style={{ fontSize: "0.78rem", color: "#64748b" }}>JPG, PNG, WEBP, PDF (Max 10MB)</span>
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
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <strong>Upload Screenshot or Bill Image</strong>
                    <p>Tap to browse files or snap a receipt photo</p>
                  </div>
                </div>
              </label>
            ) : (
              <div className="receipt-preview-card">
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                  {receiptPreview ? (
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
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
                  <span>Saving Expense...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>Save Group Expense (₹{numAmount > 0 ? numAmount.toLocaleString() : "0.00"})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
