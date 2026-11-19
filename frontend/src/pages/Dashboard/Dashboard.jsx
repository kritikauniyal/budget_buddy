import React, { useState } from "react";
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  PiggyBank,
  TrendingDown,
  Calendar,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  Plus,
  Users,
  PieChart as PieChartIcon,
  ChevronRight,
  Sparkles,
  BarChart2
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import QuickActionSheet from "../../components/common/QuickActionSheet";

export default function Dashboard({
  summary = {},
  stats = [],
  spendingData = [],
  categoryData = [],
  transactions = [],
  period = "this_month",
  onPeriodChange,
  startDate = "",
  endDate = "",
  onDateChange,
  onAddExpense,
  onNavigate
}) {
  const [showQuickSheet, setShowQuickSheet] = useState(false);
  const [showCharts, setShowCharts] = useState(true);

  const formatAmount = (val) =>
    val != null
      ? `₹${Number(val).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`
      : "₹0.00";

  const totalInc = summary.total_income ?? 0;
  const totalExp = summary.total_expenses ?? 0;
  const availBal = summary.available_balance ?? 0;
  const budget = summary.monthly_budget ?? 0;
  const remBudget = summary.remaining_budget ?? 0;
  const savings = summary.total_savings ?? 0;
  const highestCat = summary.highest_spending_category || "None";
  const highestAmt = summary.highest_spending_amount || 0;
  const budgetUtilization = summary.budget_utilization ?? 0;

  // Filter Period options for 1-tap mobile pills
  const periodOptions = [
    { id: "today", label: "Today" },
    { id: "this_week", label: "This Week" },
    { id: "this_month", label: "This Month" },
    { id: "last_month", label: "Last Month" },
    { id: "custom", label: "Custom" }
  ];

  return (
    <div className="mobile-dashboard-container">
      {/* 1. HERO FINANCIAL WALLET CARD (Apple Wallet / Revolut style) */}
      <section className="finance-hero-card">
        <div className="hero-card-glow" />
        <div className="hero-card-top">
          <div className="hero-balance-label">
            <Wallet size={16} className="hero-wallet-icon" />
            <span>Total Available Balance</span>
          </div>
          <span className={`hero-status-pill ${availBal >= 0 ? "healthy" : "deficit"}`}>
            {availBal >= 0 ? "Healthy" : "Deficit"}
          </span>
        </div>

        <div className="hero-balance-display">
          <h1 className="hero-balance-number" style={{ color: availBal >= 0 ? "#ffffff" : "#fca5a5" }}>
            {formatAmount(availBal)}
          </h1>
          <p className="hero-net-hint">Real-time net funds across all channels</p>
        </div>

        {/* Inflow vs Outflow Mini Pills */}
        <div className="hero-cashflow-row">
          <div className="cashflow-pill income">
            <div className="cashflow-icon-circle green">
              <ArrowDownRight size={15} />
            </div>
            <div className="cashflow-data">
              <span className="cashflow-label">Income Inflow</span>
              <strong className="cashflow-val">+{formatAmount(totalInc)}</strong>
            </div>
          </div>

          <div className="cashflow-pill expense">
            <div className="cashflow-icon-circle orange">
              <ArrowUpRight size={15} />
            </div>
            <div className="cashflow-data">
              <span className="cashflow-label">Expenses Spent</span>
              <strong className="cashflow-val">-{formatAmount(totalExp)}</strong>
            </div>
          </div>
        </div>

        {/* 1-Tap Quick Actions on Hero Card */}
        <div className="hero-actions-row">
          <button
            type="button"
            className="hero-action-btn primary-action"
            onClick={() => setShowQuickSheet(true)}
            aria-label="Add Expense"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Add Expense</span>
          </button>

          <button
            type="button"
            className="hero-action-btn secondary-action"
            onClick={() => onNavigate("Income")}
            aria-label="Add Income"
          >
            <ArrowDownRight size={17} />
            <span>+ Income</span>
          </button>

          <button
            type="button"
            className="hero-action-btn secondary-action"
            onClick={() => onNavigate("Groups")}
            aria-label="Split Bill"
          >
            <Users size={17} />
            <span>Split Bill</span>
          </button>
        </div>
      </section>

      {/* 2. TIME PERIOD SELECTOR (Pill Switcher) */}
      <div className="period-pills-bar">
        <div className="period-pills-scroll">
          {periodOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`period-pill-btn ${period === opt.id ? "active" : ""}`}
              onClick={() => onPeriodChange(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {period === "custom" && (
          <div className="custom-dates-box">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onDateChange(e.target.value, endDate)}
              className="filter-date-input"
            />
            <span className="date-separator">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onDateChange(startDate, e.target.value)}
              className="filter-date-input"
            />
          </div>
        )}
      </div>

      {/* 3. BUDGET HEALTH & ALERTS */}
      {summary.budget_alert === "exceeded_100" && (
        <div className="budget-alert-banner danger">
          <AlertOctagon size={20} />
          <div>
            <strong>100% Budget Ceiling Exceeded</strong>
            <p>
              You have spent {formatAmount(totalExp)}, exceeding your monthly limit of {formatAmount(budget)}.
            </p>
          </div>
        </div>
      )}

      {summary.budget_alert === "warning_80" && (
        <div className="budget-alert-banner warning">
          <AlertTriangle size={20} />
          <div>
            <strong>80% Budget Warning Reached</strong>
            <p>
              You have utilized {budgetUtilization}% of your allocated budget. Remaining: {formatAmount(remBudget)}.
            </p>
          </div>
        </div>
      )}

      {/* Monthly Budget Progress Glance */}
      <section className="budget-glance-card">
        <div className="budget-glance-header">
          <div className="budget-glance-title">
            <div className="budget-icon-circle">
              <CircleDollarSign size={18} />
            </div>
            <div>
              <h4>Monthly Budget Tracker</h4>
              <p>
                {budget > 0
                  ? `${budgetUtilization}% used of ${formatAmount(budget)} limit`
                  : "No budget set for this month"}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="budget-config-link"
            onClick={() => onNavigate("Budgets")}
          >
            {budget > 0 ? "Manage" : "Set Budget"} <ChevronRight size={15} />
          </button>
        </div>

        {budget > 0 ? (
          <div className="budget-progress-container">
            <div className="budget-progress-track">
              <div
                className={`budget-progress-fill ${
                  budgetUtilization > 100
                    ? "danger"
                    : budgetUtilization >= 80
                    ? "warning"
                    : "healthy"
                }`}
                style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
              />
            </div>
            <div className="budget-progress-stats">
              <span>Spent: <strong>{formatAmount(totalExp)}</strong></span>
              <span style={{ color: remBudget > 0 ? "#16a34a" : "#dc2626" }}>
                {remBudget > 0 ? `Left: ${formatAmount(remBudget)}` : "Over budget"}
              </span>
            </div>
          </div>
        ) : (
          <div className="budget-empty-glance">
            <span>💡 Track your monthly spending limit to save more money.</span>
            <button
              type="button"
              className="set-budget-btn"
              onClick={() => onNavigate("Budgets")}
            >
              + Set Limit
            </button>
          </div>
        )}
      </section>

      {/* 4. CATEGORY SPENDING PILLS (Fast Visual Breakdown for Common Humans) */}
      {categoryData.length > 0 && (
        <section className="category-chips-section">
          <div className="section-header-compact">
            <h4>Spending by Category</h4>
            <span className="section-sub-count">Top: {highestCat}</span>
          </div>

          <div className="category-chips-scroll">
            {categoryData.map((cat) => (
              <div className="category-chip-item" key={cat.name}>
                <span
                  className="category-chip-color"
                  style={{ background: cat.color || "#7557E8" }}
                />
                <span className="category-chip-name">{cat.name}</span>
                <strong className="category-chip-amount">{formatAmount(cat.value)}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. RECENT ACTIVITY FEED (Consumer-Friendly Transaction Cards) */}
      <section className="recent-activity-section">
        <div className="section-header-compact">
          <div>
            <h4>Recent Transactions</h4>
            <p className="section-subtext">Live spending and income activity</p>
          </div>

          <button
            type="button"
            className="view-all-link"
            onClick={() => onNavigate("Transactions")}
          >
            <span>View All</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Mobile-Friendly Transaction Feed */}
        <div className="mobile-tx-feed">
          {transactions.length === 0 ? (
            <div className="empty-tx-mobile">
              <div className="empty-tx-icon">🧾</div>
              <h5>No transactions in this period</h5>
              <p>Tap "Add Expense" above to record your first transaction.</p>
              <button
                type="button"
                className="empty-add-btn"
                onClick={() => setShowQuickSheet(true)}
              >
                + Add Expense
              </button>
            </div>
          ) : (
            transactions.slice(0, 10).map((item) => (
              <div
                className="mobile-tx-card"
                key={`${item.type}-${item.id}`}
                onClick={() => onNavigate("Transactions")}
              >
                <div
                  className="mobile-tx-avatar"
                  style={{
                    backgroundColor:
                      item.type === "income" ? "#ecfdf5" : "#fef2f2"
                  }}
                >
                  <span className="mobile-tx-icon">
                    {item.icon || (item.type === "income" ? "💰" : "💳")}
                  </span>
                </div>

                <div className="mobile-tx-info">
                  <strong className="mobile-tx-title">{item.name}</strong>
                  <div className="mobile-tx-meta">
                    <span className="mobile-tx-cat">{item.category}</span>
                    <span className="mobile-tx-dot">•</span>
                    <span className="mobile-tx-date">{item.date}</span>
                    {item.payment_method && (
                      <>
                        <span className="mobile-tx-dot">•</span>
                        <span className="mobile-tx-payment">{item.payment_method}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="mobile-tx-right">
                  <span
                    className={`mobile-tx-amount ${
                      item.type === "income" ? "income" : "expense"
                    }`}
                  >
                    {item.type === "income" ? "+" : "-"}
                    {formatAmount(item.amount)}
                  </span>
                  <span className="mobile-tx-status">Completed</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Detailed Table (Visible on Tablets & Desktops) */}
        <div className="desktop-table-container">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>TRANSACTION</th>
                  <th>CATEGORY</th>
                  <th>DATE</th>
                  <th>PAYMENT</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                </tr>
              </thead>

              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{ textAlign: "center", padding: "36px", color: "#9ca3af" }}
                    >
                      No transactions recorded for this period.
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 8).map((item) => (
                    <tr key={`tbl-${item.type}-${item.id}`}>
                      <td>
                        <div className="transaction-name">
                          <span className="transaction-emoji">{item.icon}</span>
                          <strong>{item.name}</strong>
                        </div>
                      </td>
                      <td>{item.category}</td>
                      <td>{item.date}</td>
                      <td>
                        <span className="payment-badge">
                          {item.payment_method || "Direct"}
                        </span>
                      </td>
                      <td
                        className="amount"
                        style={{
                          color: item.type === "income" ? "#16844b" : "#d32f2f",
                          fontWeight: "700"
                        }}
                      >
                        {item.type === "income" ? "+" : "-"}
                        {formatAmount(item.amount)}
                      </td>
                      <td>
                        <span className="paid-badge">Completed</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 6. CHARTS & ANALYTICS SECTION (Collapsible / Clean) */}
      <section className="charts-accordion-section">
        <button
          type="button"
          className="charts-toggle-btn"
          onClick={() => setShowCharts(!showCharts)}
        >
          <div className="toggle-label-wrap">
            <BarChart2 size={18} />
            <span>Monthly Trends & Category Chart</span>
          </div>
          <span className="toggle-indicator">{showCharts ? "Hide" : "Show"}</span>
        </button>

        {showCharts && (
          <div className="charts-grid-wrapper">
            {/* Income vs Expenses Chart */}
            <div className="panel spending-panel">
              <div className="panel-heading">
                <div>
                  <h3>Cash Flow Trend</h3>
                  <p>Inflows vs Outflows over time</p>
                </div>
              </div>

              <div className="chart-legend">
                <span>
                  <i className="income-dot" /> Income
                </span>
                <span>
                  <i className="expense-dot" /> Expenses
                </span>
              </div>

              <div className="chart-area">
                {spendingData.length === 0 ||
                spendingData.every((d) => d.income === 0 && d.expense === 0) ? (
                  <div className="chart-empty-state">
                    No financial trend history found for this period.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={spendingData}>
                      <defs>
                        <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7557E8" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#7557E8" stopOpacity={0} />
                        </linearGradient>

                        <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22B8A0" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#22B8A0" stopOpacity={0} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5" />

                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9299a8", fontSize: 12 }}
                      />

                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9299a8", fontSize: 12 }}
                        tickFormatter={(val) =>
                          `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                        }
                      />

                      <Tooltip formatter={(val) => formatAmount(val)} />

                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke="#7557E8"
                        strokeWidth={3}
                        fill="url(#incomeFill)"
                      />

                      <Area
                        type="monotone"
                        dataKey="expense"
                        stroke="#22B8A0"
                        strokeWidth={3}
                        fill="url(#expenseFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Category Pie Chart */}
            <div className="panel category-panel">
              <div className="panel-heading">
                <div>
                  <h3>Category Distribution</h3>
                  <p>
                    Top: <strong>{highestCat}</strong> ({formatAmount(highestAmt)})
                  </p>
                </div>
              </div>

              <div className="donut-chart">
                {categoryData.length === 0 || categoryData.every((c) => c.value === 0) ? (
                  <div className="chart-empty-state">
                    No expense category records in this date range.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {categoryData.map((item) => (
                          <Cell key={item.name} fill={item.color || "#7557E8"} />
                        ))}
                      </Pie>

                      <Tooltip formatter={(val) => formatAmount(val)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Quick Action Bottom Sheet for Hero Card "+ Add Expense" */}
      <QuickActionSheet
        isOpen={showQuickSheet}
        onClose={() => setShowQuickSheet(false)}
        onNavigate={onNavigate}
        onExpenseAdded={async () => {
          if (onAddExpense) {
            // Re-fetch dashboard data
            window.location.reload();
          }
        }}
      />
    </div>
  );
}
