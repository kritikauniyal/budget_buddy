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
  ChevronRight,
  BarChart2,
  Receipt,
  PieChart as PieIcon
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
import AddPersonalExpenseModal from "../../components/expenses/AddPersonalExpenseModal";
import AddPersonalIncomeModal from "../../components/expenses/AddPersonalIncomeModal";

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
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);

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

  const periodOptions = [
    { id: "today", label: "Today" },
    { id: "this_week", label: "This Week" },
    { id: "this_month", label: "This Month" },
    { id: "last_month", label: "Last Month" },
    { id: "custom", label: "Custom Range" }
  ];

  return (
    <div className="dashboard-container">
      {/* ============================================================== */}
      {/* 1. MOBILE-ONLY VIEW (Smartphones < 768px)                      */}
      {/* ============================================================== */}
      <div className="mobile-only-section">
        {/* Mobile Hero Financial Wallet Card */}
        <section className="finance-hero-card">
          <div className="hero-card-glow" />
          <div className="hero-card-top">
            <div className="hero-balance-label">
              <Wallet size={16} className="hero-wallet-icon" />
              <span>Total Balance</span>
            </div>
            <span className={`hero-status-pill ${availBal >= 0 ? "healthy" : "deficit"}`}>
              {availBal >= 0 ? "Healthy" : "Low Funds"}
            </span>
          </div>

          <div className="hero-balance-display">
            <h1 className="hero-balance-number" style={{ color: availBal >= 0 ? "#ffffff" : "#fca5a5" }}>
              {formatAmount(availBal)}
            </h1>
            <p className="hero-net-hint">Current net balance across all accounts</p>
          </div>

          {/* Inflow vs Outflow Mini Pills */}
          <div className="hero-cashflow-row">
            <div className="cashflow-pill income">
              <div className="cashflow-icon-circle green">
                <ArrowDownRight size={15} />
              </div>
              <div className="cashflow-data">
                <span className="cashflow-label">Money In</span>
                <strong className="cashflow-val">+{formatAmount(totalInc)}</strong>
              </div>
            </div>

            <div className="cashflow-pill expense">
              <div className="cashflow-icon-circle orange">
                <ArrowUpRight size={15} />
              </div>
              <div className="cashflow-data">
                <span className="cashflow-label">Money Out</span>
                <strong className="cashflow-val">-{formatAmount(totalExp)}</strong>
              </div>
            </div>
          </div>

          {/* 1-Tap Quick Action Buttons */}
          <div className="hero-actions-row">
            <button
              type="button"
              className="hero-action-btn primary-action"
              onClick={() => setShowExpenseModal(true)}
              aria-label="Add Expense"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>+ Expense</span>
            </button>

            <button
              type="button"
              className="hero-action-btn secondary-action"
              onClick={() => setShowIncomeModal(true)}
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

        {/* Mobile Period Pills Bar */}
        <div className="period-pills-bar">
          <div className="period-pills-scroll">
            {periodOptions.map((opt) => (
              <button
                key={`mob-${opt.id}`}
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

        {/* Mobile Budget Glance Card */}
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
                    : "No monthly budget set"}
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
              <span>💡 Set a monthly limit to save more money each month.</span>
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

        {/* Mobile Category Chips */}
        {categoryData.length > 0 && (
          <section className="category-chips-section" style={{ marginTop: "14px" }}>
            <div className="section-header-compact">
              <h4>Top Categories</h4>
              <span className="section-sub-count">Top: {highestCat}</span>
            </div>

            <div className="category-chips-scroll">
              {categoryData.map((cat) => (
                <div className="category-chip-item" key={`mob-cat-${cat.name}`}>
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
      </div>

      {/* ============================================================== */}
      {/* 2. DESKTOP WELCOME & FILTER CONTROLS (Tablets & Desktop > 768px)*/}
      {/* ============================================================== */}
      <div className="welcome-section desktop-only-section">
        <div>
          <h2>Financial Dashboard</h2>
          <p>Welcome back! Here is your complete financial overview, spending trends, and recent activity.</p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Quick Add Expense on Desktop */}
          <button
            type="button"
            className="primary-button"
            onClick={() => onNavigate("Expenses")}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={17} />
            <span>Add Expense</span>
          </button>

          {/* Date Filter Dropdown */}
          <div className="filter-select-wrapper">
            <Calendar size={15} />
            <select
              value={period}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="dashboard-period-select"
            >
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {period === "custom" && (
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onDateChange(e.target.value, endDate)}
                className="filter-select"
              />
              <span style={{ fontSize: "12px", color: "#646b7b" }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onDateChange(startDate, e.target.value)}
                className="filter-select"
              />
            </div>
          )}
        </div>
      </div>

      {/* BUDGET ALERTS (Universal Banner) */}
      {summary.budget_alert === "exceeded_100" && (
        <div className="budget-alert-banner danger">
          <AlertOctagon size={20} />
          <div>
            <strong>Monthly Budget Limit Exceeded</strong>
            <p>You have spent {formatAmount(totalExp)}, exceeding your monthly goal of {formatAmount(budget)}.</p>
          </div>
        </div>
      )}

      {summary.budget_alert === "warning_80" && (
        <div className="budget-alert-banner warning">
          <AlertTriangle size={20} />
          <div>
            <strong>80% of Monthly Budget Used</strong>
            <p>You have utilized {budgetUtilization}% of your monthly allowance. Remaining: {formatAmount(remBudget)}.</p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. DESKTOP 6 KPI STAT CARDS (Visible on Desktop / Tablets)     */}
      {/* ============================================================== */}
      <div className="desktop-stats-grid stats-grid" style={{ marginBottom: "24px" }}>
        {/* Card 1: Available Balance */}
        <div className="stat-card">
          <div className="stat-top">
            <span>Available Balance</span>
            <div className="stat-icon purple">
              <Wallet size={20} />
            </div>
          </div>
          <h2 style={{ color: availBal >= 0 ? "#191b35" : "#dc2626" }}>
            {formatAmount(availBal)}
          </h2>
          <div className="stat-footer">
            <span className={availBal >= 0 ? "positive-change" : "negative-change"}>
              {availBal >= 0 ? "Healthy" : "Low Funds"}
            </span>
            <span>Net funds</span>
          </div>
        </div>

        {/* Card 2: Total Income */}
        <div className="stat-card">
          <div className="stat-top">
            <span>Total Income</span>
            <div className="stat-icon green">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <h2>{formatAmount(totalInc)}</h2>
          <div className="stat-footer">
            <span className="positive-change">Revenue</span>
            <span>Inflows</span>
          </div>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="stat-card">
          <div className="stat-top">
            <span>Total Expenses</span>
            <div className="stat-icon orange">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <h2>{formatAmount(totalExp)}</h2>
          <div className="stat-footer">
            <span className="negative-change">Expenditures</span>
            <span>Outflows</span>
          </div>
        </div>

        {/* Card 4: Monthly Budget */}
        <div className="stat-card">
          <div className="stat-top">
            <span>Monthly Budget</span>
            <div className="stat-icon blue">
              <CircleDollarSign size={20} />
            </div>
          </div>
          <h2>{formatAmount(budget)}</h2>
          <div className="stat-footer">
            {budget > 0 ? (
              <>
                <span className="positive-change">{budgetUtilization}% Used</span>
                <span>Allocated</span>
              </>
            ) : (
              <>
                <span style={{ color: "#94a3b8" }}>No budget set</span>
                <span>Tap Budgets to set</span>
              </>
            )}
          </div>
        </div>

        {/* Card 5: Remaining Budget */}
        <div className="stat-card">
          <div className="stat-top">
            <span>Remaining Budget</span>
            <div className="stat-icon purple">
              <TrendingDown size={20} />
            </div>
          </div>
          <h2 style={{ color: budget > 0 ? (remBudget > 0 ? "#16844b" : "#dc2626") : "#191b35" }}>
            {formatAmount(remBudget)}
          </h2>
          <div className="stat-footer">
            <span>{budget > 0 ? "Allowance left" : "No limit active"}</span>
          </div>
        </div>

        {/* Card 6: Total Savings */}
        <div className="stat-card">
          <div className="stat-top">
            <span>Total Savings</span>
            <div className="stat-icon green">
              <PiggyBank size={20} />
            </div>
          </div>
          <h2>{formatAmount(savings)}</h2>
          <div className="stat-footer">
            <span className="positive-change">Top: {highestCat}</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. RECENT TRANSACTIONS (Responsive: Mobile Cards + Desktop Table) */}
      {/* ============================================================== */}
      <section className="panel transactions-panel" style={{ marginBottom: "24px" }}>
        <div className="panel-heading">
          <div>
            <h3>Recent Transactions</h3>
            <p>Live transaction feed from your database</p>
          </div>

          <button
            type="button"
            className="text-button"
            onClick={() => onNavigate("Transactions")}
            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
          >
            <span>View All Transactions</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Mobile View: Clean Card Feed */}
        <div className="mobile-tx-feed">
          {transactions.length === 0 ? (
            <div className="empty-tx-mobile">
              <div className="empty-tx-icon">🧾</div>
              <h5>No transactions recorded</h5>
              <p>Tap below to record your first transaction.</p>
              <button
                type="button"
                className="empty-add-btn"
                onClick={() => setShowExpenseModal(true)}
              >
                + Add Expense
              </button>
            </div>
          ) : (
            transactions.slice(0, 8).map((item) => (
              <div
                className="mobile-tx-card"
                key={`mob-dash-${item.type}-${item.id}`}
                onClick={() => onNavigate("Transactions")}
              >
                <div
                  className="mobile-tx-avatar"
                  style={{
                    backgroundColor: item.type === "income" ? "#ecfdf5" : "#fef2f2"
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

        {/* Desktop View: Full Table */}
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
                      No transactions recorded in this period.
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

      {/* ============================================================== */}
      {/* 5. CHARTS GRID (Side-by-side on Desktop, clean on mobile)      */}
      {/* ============================================================== */}
      <div className="charts-grid" style={{ marginBottom: "24px" }}>
        {/* Income vs Expenses AreaChart */}
        <section className="panel spending-panel">
          <div className="panel-heading">
            <div>
              <h3>Income vs Expenses (Cash Flow Trend)</h3>
              <p>Historical comparison based on real database records</p>
            </div>
          </div>

          <div className="chart-legend">
            <span><i className="income-dot" /> Income</span>
            <span><i className="expense-dot" /> Expenses</span>
          </div>

          <div className="chart-area">
            {spendingData.length === 0 || spendingData.every((d) => d.income === 0 && d.expense === 0) ? (
              <div className="chart-empty-state">
                No financial history found for this period. Add income or expenses to visualize trends.
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
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
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
        </section>

        {/* Category Donut Chart */}
        <section className="panel category-panel">
          <div className="panel-heading">
            <div>
              <h3>Category-Wise Expenses</h3>
              <p>Top category: <strong>{highestCat}</strong> ({formatAmount(highestAmt)})</p>
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
                    innerRadius={60}
                    outerRadius={85}
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

          <div className="category-list">
            {categoryData.length === 0 ? (
              <div style={{ textAlign: "center", fontSize: "12px", color: "#9ca3af", padding: "12px" }}>
                Zero expense categories recorded
              </div>
            ) : (
              categoryData.slice(0, 5).map((item) => (
                <div className="category-item" key={item.name}>
                  <span>
                    <i style={{ background: item.color || "#7557E8" }} />
                    {item.name}
                  </span>
                  <strong>{formatAmount(item.value)}</strong>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Modals for Personal Expense and Income */}
      <AddPersonalExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onExpenseAdded={async () => {
          if (onAddExpense) {
            window.location.reload();
          }
        }}
      />

      <AddPersonalIncomeModal
        isOpen={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        onIncomeAdded={async () => {
          window.location.reload();
        }}
      />
    </div>
  );
}
