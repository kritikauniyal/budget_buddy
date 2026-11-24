import React, { useState, useEffect } from "react";
import { PieChart, AlertTriangle, AlertOctagon, CheckCircle2, Edit3, X } from "lucide-react";
import api from "../../services/api";
import { showError, showSuccess } from "../../utils/swal";

export default function BudgetsPage() {
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newBudget, setNewBudget] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const data = await api.getBudgets();
      setBudgetData(data);
      if (data) setNewBudget(data.total_budget);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!newBudget) return;

    setSubmitting(true);
    try {
      await api.saveBudget({
        total_budget: parseFloat(newBudget),
      });
      setShowModal(false);
      showSuccess("Budget updated successfully!");
      await loadBudgets();
    } catch (err) {
      showError("Failed to update budget", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !budgetData) {
    return <div className="page-loading">Loading monthly budget data...</div>;
  }

  const utilization = budgetData?.utilization_percentage || 0;
  const isExceeded = utilization >= 100;
  const isWarning = utilization >= 80 && !isExceeded;

  return (
    <div className="module-page">
      <div className="welcome-section">
        <div>
          <h2>Monthly Budget</h2>
          <p>Set spending limits to keep your money on track and save more each month.</p>
        </div>

        <button className="primary-button" onClick={() => setShowModal(true)}>
          <Edit3 size={17} />
          Set Monthly Limit
        </button>
      </div>

      {/* THRESHOLD ALERTS */}
      {isExceeded && (
        <div className="budget-alert-banner danger">
          <AlertOctagon size={22} />
          <div>
            <strong>Monthly Budget Exceeded</strong>
            <p>You have spent ₹{budgetData?.total_spent?.toLocaleString("en-IN")}, which is above your monthly goal of ₹{budgetData?.total_budget?.toLocaleString("en-IN")}.</p>
          </div>
        </div>
      )}

      {isWarning && (
        <div className="budget-alert-banner warning">
          <AlertTriangle size={22} />
          <div>
            <strong>80% of Monthly Budget Used</strong>
            <p>You have used {utilization}% of your budget for this month. You have ₹{budgetData?.remaining_budget?.toLocaleString("en-IN")} left to spend.</p>
          </div>
        </div>
      )}

      {/* OVERALL BUDGET CARD */}
      <div className="budget-overview-card">
        <div className="budget-overview-header">
          <div>
            <span>Total Monthly Budget</span>
            <h3>₹{budgetData?.total_budget?.toLocaleString("en-IN")}</h3>
          </div>

          <div className="budget-overview-stats">
            <div>
              <span>Spent</span>
              <strong>₹{budgetData?.total_spent?.toLocaleString("en-IN")}</strong>
            </div>
            <div>
              <span>Remaining</span>
              <strong style={{ color: isExceeded ? "#dc2626" : "#16844b" }}>
                ₹{budgetData?.remaining_budget?.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>
        </div>

        <div className="budget-progress-track">
          <div
            className={`budget-progress-fill ${isExceeded ? "danger" : isWarning ? "warning" : "normal"}`}
            style={{ width: `${Math.min(100, utilization)}%` }}
          />
        </div>

        <div className="budget-progress-meta">
          <span>0%</span>
          <span>{utilization}% Utilized</span>
          <span>100%</span>
        </div>
      </div>

      {/* CATEGORY BREAKDOWNS */}
      <h3 style={{ fontSize: "16px", margin: "24px 0 16px", color: "#191b35" }}>
        Category-Wise Spending Limits
      </h3>

      <div className="category-budgets-grid">
        {budgetData?.categories?.map((cat) => {
          const catUtil = cat.utilization_percentage;
          const catExceeded = catUtil >= 100;
          const catWarning = catUtil >= 80 && !catExceeded;

          return (
            <div className="category-budget-card" key={cat.category_id}>
              <div className="cat-card-top">
                <div className="cat-icon-title">
                  <span className="cat-bubble">{cat.category_icon}</span>
                  <div>
                    <strong>{cat.category_name}</strong>
                    <span>Limit: ₹{cat.budgeted_amount.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <span
                  className={`status-pill ${catExceeded ? "pill-danger" : catWarning ? "pill-warning" : "pill-normal"}`}
                >
                  {catExceeded ? "Exceeded" : catWarning ? "80% Alert" : "On Track"}
                </span>
              </div>

              <div className="budget-progress-track small">
                <div
                  className={`budget-progress-fill ${catExceeded ? "danger" : catWarning ? "warning" : "normal"}`}
                  style={{ width: `${Math.min(100, catUtil)}%` }}
                />
              </div>

              <div className="cat-card-footer">
                <span>Spent: ₹{cat.spent_amount.toLocaleString("en-IN")}</span>
                <span>Remaining: ₹{cat.remaining_amount.toLocaleString("en-IN")}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* EDIT BUDGET MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="expense-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <h2>Set Monthly Budget</h2>
                <p>Define your monthly target ceiling for spending.</p>
              </div>
              <button onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBudget}>
              <label>Total Monthly Budget (₹)</label>
              <input
                required
                type="number"
                min="100"
                step="500"
                placeholder="e.g. 30000"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
              />

              <button type="submit" className="primary-button modal-submit" disabled={submitting}>
                {submitting ? "Saving..." : "Apply Budget"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

