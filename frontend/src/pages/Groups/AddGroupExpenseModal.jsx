import React, { useState, useEffect } from "react";
import { X, Receipt, Check, AlertCircle, Percent, Hash, DollarSign, Users, UserCheck } from "lucide-react";
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

export default function AddGroupExpenseModal({ groupId, members = [], currentUser, onClose, onExpenseAdded }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryName, setCategoryName] = useState("Food");
  const [paidBy, setPaidBy] = useState(currentUser ? currentUser.id : (members[0]?.user_id || 1));
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  // Split Types: 'equal' | 'exact' | 'percentage' | 'shares' | 'custom'
  const [splitType, setSplitType] = useState("equal");
  const [selectedParticipants, setSelectedParticipants] = useState(() => members.map((m) => m.user_id));

  // Exact / Custom amounts
  const [customSplits, setCustomSplits] = useState(() => {
    const init = {};
    members.forEach((m) => {
      init[m.user_id] = "";
    });
    return init;
  });

  // Percentage inputs
  const [percentSplits, setPercentSplits] = useState(() => {
    const init = {};
    const equalPct = members.length > 0 ? (100 / members.length).toFixed(1) : 0;
    members.forEach((m) => {
      init[m.user_id] = equalPct;
    });
    return init;
  });

  // Shares inputs (e.g. 1, 2, 1)
  const [shareCounts, setShareCounts] = useState(() => {
    const init = {};
    members.forEach((m) => {
      init[m.user_id] = "1";
    });
    return init;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (members.length > 0) {
      setSelectedParticipants(members.map((m) => m.user_id));
      const initC = {};
      const initP = {};
      const initS = {};
      const eqP = (100 / members.length).toFixed(1);
      members.forEach((m) => {
        initC[m.user_id] = "";
        initP[m.user_id] = eqP;
        initS[m.user_id] = "1";
      });
      setCustomSplits(initC);
      setPercentSplits(initP);
      setShareCounts(initS);
    }
  }, [members]);

  const numAmount = parseFloat(amount) || 0;

  // Toggle participant for equal split
  const toggleParticipant = (userId) => {
    setSelectedParticipants((prev) => {
      if (prev.includes(userId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Calculations for custom/exact
  const customSum = Object.values(customSplits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const customDiff = numAmount - customSum;

  // Calculations for percentage
  const totalPercent = Object.values(percentSplits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

  // Calculations for shares
  const totalShares = Object.values(shareCounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter an expense title.");
      return;
    }
    if (numAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    let payloadSplits = null;
    let participantIds = null;

    if (splitType === "equal") {
      participantIds = selectedParticipants;
      if (participantIds.length === 0) {
        setError("Please select at least one participant.");
        return;
      }
    } else if (splitType === "exact" || splitType === "custom") {
      if (Math.abs(customDiff) > 0.05) {
        setError(`Sum of splits (₹${customSum.toFixed(2)}) must match total amount (₹${numAmount.toFixed(2)}). Difference: ₹${customDiff.toFixed(2)}`);
        return;
      }
      payloadSplits = members.map((m) => ({
        user_id: m.user_id,
        owed_amount: parseFloat(customSplits[m.user_id]) || 0,
      }));
    } else if (splitType === "percentage") {
      if (Math.abs(totalPercent - 100) > 0.1) {
        setError(`Sum of percentages must equal 100%. Currently: ${totalPercent.toFixed(1)}%`);
        return;
      }
      payloadSplits = members.map((m) => {
        const pct = parseFloat(percentSplits[m.user_id]) || 0;
        const owed = Math.round(((numAmount * pct) / 100) * 100) / 100;
        return {
          user_id: m.user_id,
          owed_amount: owed,
          percentage: pct,
        };
      });
      // Adjust remainder cents
      const calcTotal = payloadSplits.reduce((acc, curr) => acc + curr.owed_amount, 0);
      const diff = Math.round((numAmount - calcTotal) * 100) / 100;
      if (payloadSplits.length > 0 && diff !== 0) {
        payloadSplits[0].owed_amount = Math.round((payloadSplits[0].owed_amount + diff) * 100) / 100;
      }
    } else if (splitType === "shares") {
      if (totalShares <= 0) {
        setError("Total shares must be greater than 0.");
        return;
      }
      payloadSplits = members.map((m) => {
        const sh = parseFloat(shareCounts[m.user_id]) || 0;
        const owed = Math.round(((numAmount * sh) / totalShares) * 100) / 100;
        return {
          user_id: m.user_id,
          owed_amount: owed,
        };
      });
      // Adjust remainder cents
      const calcTotal = payloadSplits.reduce((acc, curr) => acc + curr.owed_amount, 0);
      const diff = Math.round((numAmount - calcTotal) * 100) / 100;
      if (payloadSplits.length > 0 && diff !== 0) {
        payloadSplits[0].owed_amount = Math.round((payloadSplits[0].owed_amount + diff) * 100) / 100;
      }
    }

    setLoading(true);
    setError("");

    try {
      await api.addGroupExpense(groupId, {
        title: title.trim(),
        amount: numAmount,
        category_name: categoryName,
        paid_by: paidBy,
        split_type: splitType === "equal" ? "equal" : "custom",
        expense_date: expenseDate,
        payment_method: paymentMethod,
        description: description.trim() || null,
        participant_ids: participantIds,
        splits: payloadSplits,
      });

      if (onExpenseAdded) {
        onExpenseAdded();
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add expense.");
    } finally {
      setLoading(false);
    }
  };

  const perPersonShare = selectedParticipants.length > 0 ? (numAmount / selectedParticipants.length).toFixed(2) : 0;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: "640px" }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="modal-icon-badge" style={{ background: "rgba(34, 184, 160, 0.12)", color: "#0d9488" }}>
              <Receipt size={22} />
            </div>
            <div>
              <h3>Add Group Expense</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                Split this bill automatically across members
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
          <div className="modal-body" style={{ maxHeight: "68vh", overflowY: "auto", padding: "18px 20px" }}>
            {/* Title & Amount */}
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label>Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grocery, Room Rent, Dinner"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Total Amount (₹) *</label>
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
            </div>

            {/* Category & Date */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label>Category</label>
                <select value={categoryName} onChange={(e) => setCategoryName(e.target.value)}>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                />
              </div>
            </div>

            {/* Paid By & Payment Method */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label>Paid By</label>
                <select value={paidBy} onChange={(e) => setPaidBy(parseInt(e.target.value))}>
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.full_name} {currentUser && currentUser.id === m.user_id ? "(You)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Cash">Cash</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* 5 SPLIT OPTIONS SELECTOR */}
            <div style={{ marginTop: "16px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
              <label style={{ fontWeight: 600, display: "block", marginBottom: "8px" }}>
                Expense Split Options
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(105px, 1fr))", gap: "6px", marginBottom: "14px" }}>
                {[
                  { id: "equal", label: "⚖️ Equal" },
                  { id: "exact", label: "💵 Exact ₹" },
                  { id: "percentage", label: "📊 Percent %" },
                  { id: "shares", label: "🔢 Shares" },
                  { id: "custom", label: "✨ Custom" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSplitType(tab.id)}
                    style={{
                      padding: "8px 6px",
                      borderRadius: "8px",
                      border: splitType === tab.id ? "2px solid #7557E8" : "1px solid #e2e8f0",
                      background: splitType === tab.id ? "rgba(117, 87, 232, 0.08)" : "#fff",
                      color: splitType === tab.id ? "#7557E8" : "#334155",
                      fontWeight: splitType === tab.id ? 700 : 500,
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      textAlign: "center"
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 1. EQUAL SPLIT */}
              {splitType === "equal" && (
                <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", fontSize: "0.85rem" }}>
                    <span>Included Members ({selectedParticipants.length}):</span>
                    <span style={{ fontWeight: 700, color: "#7557E8" }}>
                      ₹{perPersonShare} / person
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {members.map((m) => {
                      const isSelected = selectedParticipants.includes(m.user_id);
                      return (
                        <button
                          key={m.user_id}
                          type="button"
                          onClick={() => toggleParticipant(m.user_id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 10px",
                            borderRadius: "20px",
                            border: isSelected ? "1.5px solid #22B8A0" : "1px solid #cbd5e1",
                            background: isSelected ? "rgba(34, 184, 160, 0.12)" : "#fff",
                            color: isSelected ? "#0f766e" : "#64748b",
                            fontSize: "0.82rem",
                            cursor: "pointer",
                            fontWeight: isSelected ? 600 : 400
                          }}
                        >
                          <div style={{
                            width: "14px",
                            height: "14px",
                            borderRadius: "3px",
                            background: isSelected ? "#22B8A0" : "#cbd5e1",
                            display: "grid",
                            placeItems: "center",
                            color: "#fff"
                          }}>
                            {isSelected && <Check size={12} />}
                          </div>
                          <span>{m.full_name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. EXACT AMOUNT & 5. CUSTOM SPLIT */}
              {(splitType === "exact" || splitType === "custom") && (
                <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", fontSize: "0.84rem" }}>
                    <span>Enter exact amount each person pays:</span>
                    <span style={{
                      fontWeight: 700,
                      color: Math.abs(customDiff) < 0.05 ? "#10b981" : "#ef4444"
                    }}>
                      Total: ₹{customSum.toFixed(2)} / ₹{numAmount.toFixed(2)}
                      {Math.abs(customDiff) >= 0.05 && ` (Diff: ₹${customDiff.toFixed(2)})`}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {members.map((m) => (
                      <div
                        key={m.user_id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "10px",
                          fontSize: "0.85rem"
                        }}
                      >
                        <span>{m.full_name}</span>
                        <div style={{ position: "relative", width: "130px" }}>
                          <span style={{ position: "absolute", left: "8px", top: "7px", color: "#64748b", fontSize: "0.85rem" }}>₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={customSplits[m.user_id] || ""}
                            onChange={(e) => setCustomSplits({ ...customSplits, [m.user_id]: e.target.value })}
                            style={{ padding: "6px 8px 6px 22px", fontSize: "0.85rem", width: "100%" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. PERCENTAGE SPLIT */}
              {splitType === "percentage" && (
                <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", fontSize: "0.84rem" }}>
                    <span>Assign percentage to each member:</span>
                    <span style={{
                      fontWeight: 700,
                      color: Math.abs(totalPercent - 100) < 0.1 ? "#10b981" : "#ef4444"
                    }}>
                      Total: {totalPercent.toFixed(1)}% / 100%
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {members.map((m) => {
                      const pct = parseFloat(percentSplits[m.user_id]) || 0;
                      const calculatedOwed = ((numAmount * pct) / 100).toFixed(2);
                      return (
                        <div
                          key={m.user_id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "10px",
                            fontSize: "0.85rem"
                          }}
                        >
                          <div>
                            <strong>{m.full_name}</strong>
                            <span style={{ color: "#7557E8", marginLeft: "8px", fontSize: "0.8rem" }}>
                              (₹{calculatedOwed})
                            </span>
                          </div>
                          <div style={{ position: "relative", width: "110px" }}>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              placeholder="0"
                              value={percentSplits[m.user_id] || ""}
                              onChange={(e) => setPercentSplits({ ...percentSplits, [m.user_id]: e.target.value })}
                              style={{ padding: "6px 24px 6px 8px", fontSize: "0.85rem", width: "100%" }}
                            />
                            <span style={{ position: "absolute", right: "8px", top: "7px", color: "#64748b", fontSize: "0.85rem" }}>%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. SHARES SPLIT */}
              {splitType === "shares" && (
                <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", fontSize: "0.84rem" }}>
                    <span>Assign proportion of shares (e.g. 1, 2, etc.):</span>
                    <span style={{ fontWeight: 700, color: "#7557E8" }}>
                      Total: {totalShares} shares
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {members.map((m) => {
                      const sh = parseFloat(shareCounts[m.user_id]) || 0;
                      const calculatedOwed = totalShares > 0 ? ((numAmount * sh) / totalShares).toFixed(2) : "0.00";
                      return (
                        <div
                          key={m.user_id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "10px",
                            fontSize: "0.85rem"
                          }}
                        >
                          <div>
                            <strong>{m.full_name}</strong>
                            <span style={{ color: "#7557E8", marginLeft: "8px", fontSize: "0.8rem" }}>
                              (₹{calculatedOwed})
                            </span>
                          </div>
                          <div style={{ width: "90px" }}>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              placeholder="1"
                              value={shareCounts[m.user_id] || ""}
                              onChange={(e) => setShareCounts({ ...shareCounts, [m.user_id]: e.target.value })}
                              style={{ padding: "6px 8px", fontSize: "0.85rem", width: "100%", textAlign: "center" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="form-group" style={{ marginTop: "14px" }}>
              <label>Notes / Description (Optional)</label>
              <textarea
                rows={2}
                placeholder="Add receipt notes or memo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ padding: "14px 20px" }}>
            <button type="button" className="secondary-button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "Saving Expense..." : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
