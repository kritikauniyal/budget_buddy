import React from "react";
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
  ArrowRight
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
  onNavigate
}) {
  const formatAmount = (val) =>
    val != null ? `₹${Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "₹0.00";

  const totalInc = summary.total_income ?? 0;
  const totalExp = summary.total_expenses ?? 0;
  const availBal = summary.available_balance ?? 0;
  const budget = summary.monthly_budget ?? 0;
  const remBudget = summary.remaining_budget ?? 0;
  const savings = summary.total_savings ?? 0;
  const highestCat = summary.highest_spending_category || "None";
  const highestAmt = summary.highest_spending_amount || 0;

  return (
    <>
      {/* WELCOME & PERIOD FILTER CONTROLS */}
      <div className="welcome-section" style={{ flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2>Financial Dashboard</h2>
          <p>Real-time analytics, dynamic balances, and category spending from your database.</p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {/* DATE RANGE FILTER */}
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

      {/* HIGHEST SPENDING CATEGORY & BUDGET ALERTS */}
      {summary.budget_alert === "exceeded_100" && (
        <div className="budget-alert-banner danger">
          <AlertOctagon size={20} />
          <div>
            <strong>100% Budget Ceiling Exceeded</strong>
            <p>You have spent {formatAmount(totalExp)}, exceeding your monthly target of {formatAmount(budget)}.</p>
          </div>
        </div>
      )}

      {summary.budget_alert === "warning_80" && (
        <div className="budget-alert-banner warning">
          <AlertTriangle size={20} />
          <div>
            <strong>80% Budget Warning Reached</strong>
            <p>You have utilized {summary.budget_utilization}% of your allocated budget. Remaining: {formatAmount(remBudget)}.</p>
          </div>
        </div>
      )}

      {/* 6 MAIN METRIC SUMMARY CARDS */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {/* Available Balance */}
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
              {availBal >= 0 ? "Healthy" : "Deficit"}
            </span>
            <span>Net funds</span>
          </div>
        </div>

        {/* Total Income */}
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

        {/* Total Expenses */}
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

        {/* Monthly Budget */}
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
                <span className="positive-change">{summary.budget_utilization || 0}% Used</span>
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

        {/* Remaining Budget */}
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

        {/* Total Savings */}
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

      {/* CHARTS GRID */}
      <div className="charts-grid">
        {/* Income vs Expenses AreaChart */}
        <section className="panel spending-panel">
          <div className="panel-heading">
            <div>
              <h3>Income vs Expenses (6-Month Trend)</h3>
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

        {/* Category-wise Expense Donut Chart */}
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
                    innerRadius={65}
                    outerRadius={90}
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

      {/* RECENT TRANSACTIONS */}
      <section className="panel transactions-panel">
        <div className="panel-heading">
          <div>
            <h3>Recent Transactions</h3>
            <p>Live transaction feed from your database</p>
          </div>

          <button
            className="text-button"
            onClick={() => onNavigate("Transactions")}
          >
            View All Transactions <ArrowRight size={14} style={{ display: "inline", verticalAlign: "middle" }} />
          </button>
        </div>

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
                  <td colSpan="6" style={{ textAlign: "center", padding: "36px", color: "#9ca3af" }}>
                    No transactions found in this period. Click "+ Add Expense" or visit Income page to start recording!
                  </td>
                </tr>
              ) : (
                transactions.map((item) => (
                  <tr key={`${item.type}-${item.id}`}>
                    <td>
                      <div className="transaction-name">
                        <span className="transaction-emoji">{item.icon}</span>
                        <strong>{item.name}</strong>
                      </div>
                    </td>

                    <td>{item.category}</td>
                    <td>{item.date}</td>
                    <td>
                      <span className="payment-badge">{item.payment_method || "Direct"}</span>
                    </td>

                    <td
                      className="amount"
                      style={{
                        color: item.type === "income" ? "#16844b" : "#d32f2f",
                        fontWeight: "700"
                      }}
                    >
                      {item.type === "income" ? "+" : "-"}{formatAmount(item.amount)}
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
      </section>

    </>
  );
}
