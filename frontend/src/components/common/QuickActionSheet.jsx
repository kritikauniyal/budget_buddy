import React, { useState } from "react";
import {
  X,
  Receipt,
  TrendingUp,
  Users,
  ArrowRight,
  Check,
  ChevronLeft
} from "lucide-react";
import api from "../../services/api";

export default function QuickActionSheet({
  isOpen,
  onClose,
  onNavigate,
  onExpenseAdded
}) {
  const [mode, setMode] = useState("menu"); // "menu" | "expense" | "income"
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Quick Expense Form state
  const [expenseForm, setExpenseForm] = useState({
    name: "",
    amount: "",
    category: "Food",
    payment_method: "UPI",
    date: new Date().toISOString().split("T")[0],
    description: ""
  });

  // Quick Income Form state
  const [incomeForm, setIncomeForm] = useState({
    category_name: "Salary",
    amount: "",
    description: "",
    transaction_date: new Date().toISOString().split("T")[0]
  });

  if (!isOpen) return null;

  const handleClose = () => {
    setMode("menu");
    setErrorMessage("");
    onClose();
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.name || !expenseForm.amount) {
      setErrorMessage("Please enter both title and amount");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    try {
      await api.addExpense({
        name: expenseForm.name,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        payment_method: expenseForm.payment_method,
        transaction_date: expenseForm.date,
        description: expenseForm.description || expenseForm.name
      });
      if (onExpenseAdded) {
        await onExpenseAdded();
      }
      handleClose();
    } catch (err) {
      setErrorMessage(err.message || "Failed to record expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    if (!incomeForm.amount) {
      setErrorMessage("Please enter amount");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    try {
      await api.addIncome({
        category_name: incomeForm.category_name,
        amount: parseFloat(incomeForm.amount),
        description: incomeForm.description || incomeForm.category_name,
        transaction_date: incomeForm.transaction_date
      });
      if (onExpenseAdded) {
        await onExpenseAdded();
      }
      handleClose();
    } catch (err) {
      setErrorMessage(err.message || "Failed to record income");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mobile-sheet-overlay" onClick={handleClose}>
      <div
        className="mobile-sheet-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mobile-sheet-handle" />

        <div className="mobile-sheet-header">
          {mode !== "menu" ? (
            <button
              type="button"
              className="sheet-back-btn"
              onClick={() => {
                setMode("menu");
                setErrorMessage("");
              }}
              aria-label="Back to menu"
            >
              <ChevronLeft size={20} />
              <span>Back</span>
            </button>
          ) : (
            <div className="sheet-title-group">
              <h3>Quick Actions</h3>
              <p>What would you like to record?</p>
            </div>
          )}

          <button
            type="button"
            className="sheet-close-btn"
            onClick={handleClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {errorMessage && (
          <div className="sheet-error-banner">{errorMessage}</div>
        )}

        {mode === "menu" && (
          <div className="sheet-action-list">
            {/* 1. Add Expense */}
            <button
              type="button"
              className="sheet-action-item expense-theme"
              onClick={() => setMode("expense")}
            >
              <div className="sheet-action-icon expense-icon">
                <Receipt size={22} />
              </div>
              <div className="sheet-action-info">
                <strong>Add Expense</strong>
                <span>Record daily spending, food, travel, shopping</span>
              </div>
              <ArrowRight size={18} className="sheet-action-arrow" />
            </button>

            {/* 2. Add Income */}
            <button
              type="button"
              className="sheet-action-item income-theme"
              onClick={() => setMode("income")}
            >
              <div className="sheet-action-icon income-icon">
                <TrendingUp size={22} />
              </div>
              <div className="sheet-action-info">
                <strong>Add Income</strong>
                <span>Record salary, bonus, freelance or cash received</span>
              </div>
              <ArrowRight size={18} className="sheet-action-arrow" />
            </button>

            {/* 3. Split with Group */}
            <button
              type="button"
              className="sheet-action-item group-theme"
              onClick={() => {
                handleClose();
                onNavigate("Groups");
              }}
            >
              <div className="sheet-action-icon group-icon">
                <Users size={22} />
              </div>
              <div className="sheet-action-info">
                <strong>Split with Group</strong>
                <span>Share bills with friends, roommates, or trip mates</span>
              </div>
              <ArrowRight size={18} className="sheet-action-arrow" />
            </button>
          </div>
        )}

        {mode === "expense" && (
          <form onSubmit={handleExpenseSubmit} className="sheet-form">
            <div className="sheet-form-header">
              <h4>New Expense</h4>
              <span className="sheet-tagline">Enter money spent</span>
            </div>

            <div className="form-group-mobile">
              <label>Amount (₹) *</label>
              <div className="mobile-amount-input-wrap">
                <span className="currency-prefix">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  autoFocus
                  placeholder="0.00"
                  className="mobile-amount-input"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, amount: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group-mobile">
              <label>Expense Name / Note *</label>
              <input
                type="text"
                placeholder="e.g. Lunch at Cafe, Grocery shopping"
                className="mobile-text-input"
                value={expenseForm.name}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, name: e.target.value })
                }
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group-mobile">
                <label>Category</label>
                <select
                  className="mobile-select-input"
                  value={expenseForm.category}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, category: e.target.value })
                  }
                >
                  <option value="Food">🍔 Food</option>
                  <option value="Shopping">🛍️ Shopping</option>
                  <option value="Travel">🚗 Travel</option>
                  <option value="Groceries">🛒 Groceries</option>
                  <option value="Bills">⚡ Bills</option>
                  <option value="Rent">🏠 Rent</option>
                  <option value="Electricity">💡 Electricity</option>
                  <option value="Medical">💊 Medical</option>
                  <option value="Entertainment">🎬 Entertainment</option>
                  <option value="Education">📚 Education</option>
                  <option value="Other">📦 Other</option>
                </select>
              </div>

              <div className="form-group-mobile">
                <label>Payment Method</label>
                <select
                  className="mobile-select-input"
                  value={expenseForm.payment_method}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      payment_method: e.target.value
                    })
                  }
                >
                  <option value="UPI">📱 UPI</option>
                  <option value="Cash">💵 Cash</option>
                  <option value="Debit Card">💳 Debit Card</option>
                  <option value="Credit Card">💳 Credit Card</option>
                  <option value="Net Banking">🏦 Net Banking</option>
                </select>
              </div>
            </div>

            <div className="form-group-mobile">
              <label>Date</label>
              <input
                type="date"
                className="mobile-select-input"
                value={expenseForm.date}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, date: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              className="sheet-primary-btn"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Expense"}
            </button>
          </form>
        )}

        {mode === "income" && (
          <form onSubmit={handleIncomeSubmit} className="sheet-form">
            <div className="sheet-form-header">
              <h4>New Income</h4>
              <span className="sheet-tagline">Enter money received</span>
            </div>

            <div className="form-group-mobile">
              <label>Amount (₹) *</label>
              <div className="mobile-amount-input-wrap">
                <span className="currency-prefix">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  autoFocus
                  placeholder="0.00"
                  className="mobile-amount-input"
                  value={incomeForm.amount}
                  onChange={(e) =>
                    setIncomeForm({ ...incomeForm, amount: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group-mobile">
              <label>Source / Description</label>
              <input
                type="text"
                placeholder="e.g. Monthly Salary, Freelance project"
                className="mobile-text-input"
                value={incomeForm.description}
                onChange={(e) =>
                  setIncomeForm({ ...incomeForm, description: e.target.value })
                }
              />
            </div>

            <div className="form-row-2">
              <div className="form-group-mobile">
                <label>Category</label>
                <select
                  className="mobile-select-input"
                  value={incomeForm.category_name}
                  onChange={(e) =>
                    setIncomeForm({
                      ...incomeForm,
                      category_name: e.target.value
                    })
                  }
                >
                  <option value="Salary">💼 Salary</option>
                  <option value="Freelance">💻 Freelance</option>
                  <option value="Investments">📈 Investments</option>
                  <option value="Gifts">🎁 Gifts</option>
                  <option value="Refund">🔄 Refund</option>
                  <option value="Other">💰 Other</option>
                </select>
              </div>

              <div className="form-group-mobile">
                <label>Date</label>
                <input
                  type="date"
                  className="mobile-select-input"
                  value={incomeForm.transaction_date}
                  onChange={(e) =>
                    setIncomeForm({
                      ...incomeForm,
                      transaction_date: e.target.value
                    })
                  }
                />
              </div>
            </div>

            <button
              type="submit"
              className="sheet-primary-btn income-submit"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Income"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
