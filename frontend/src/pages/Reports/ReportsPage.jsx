import React, { useState, useEffect } from "react";
import { Download, FileText, Calendar, TrendingUp, TrendingDown, PiggyBank, BarChart3 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import api from "../../services/api";

const CHART_COLORS = ["#7557E8", "#22B8A0", "#F4AE50", "#5794EA", "#E58DAA", "#A855F7", "#64748B", "#ef4444"];

export default function ReportsPage() {
  const [period, setPeriod] = useState("this_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await api.getReportData(period, startDate, endDate);
      setReportData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [period, startDate, endDate]);

  const summary = reportData?.summary || {};
  const categories = reportData?.category_breakdown || [];

  return (
    <div className="module-page">
      <div className="welcome-section" style={{ flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2>Financial Reports</h2>
          <p>Download spending statements, category breakdowns, and monthly financial summaries.</p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div className="filter-select-wrapper">
            <Calendar size={15} />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="dashboard-period-select"
            >
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {period === "custom" && (
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="filter-select"
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="filter-select"
              />
            </div>
          )}

          <a
            href={api.getReportPdfUrl(period, startDate, endDate)}
            target="_blank"
            rel="noreferrer"
            className="primary-button"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <FileText size={16} />
            Download PDF
          </a>

          <a
            href={api.getReportCsvUrl(period, startDate, endDate)}
            download
            className="secondary-button"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Download size={16} />
            Export Excel
          </a>
        </div>
      </div>

      {/* SUMMARY KPI CARDS */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-top">
            <span>Total Income</span>
            <div className="stat-icon green">
              <TrendingUp size={20} />
            </div>
          </div>
          <h2>₹{(summary.total_income || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
          <div className="stat-footer">
            <span className="positive-change">{summary.transaction_count || 0} Total Transactions</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Total Spent</span>
            <div className="stat-icon orange">
              <TrendingDown size={20} />
            </div>
          </div>
          <h2>₹{(summary.total_expenses || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
          <div className="stat-footer">
            <span className="negative-change">Money out</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Total Saved</span>
            <div className="stat-icon purple">
              <PiggyBank size={20} />
            </div>
          </div>
          <h2 style={{ color: (summary.net_savings || 0) >= 0 ? "#191b35" : "#dc2626" }}>
            ₹{(summary.net_savings || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </h2>
          <div className="stat-footer">
            <span className="positive-change">{summary.savings_rate || 0}% Savings Rate</span>
          </div>
        </div>
      </div>

      {/* CATEGORICAL BREAKDOWN (Responsive: Mobile Cards + Desktop Table) */}
      <section className="panel" style={{ marginBottom: "24px" }}>
        <div className="panel-heading">
          <div>
            <h3>Where Your Money Went</h3>
            <p>Spending distribution across categories for {period.replace("_", " ")}</p>
          </div>
        </div>

        {categories.length > 0 && (
          <div style={{ height: "220px", width: "100%", margin: "10px 0 20px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories.map((c, i) => ({ name: c.category, value: c.amount, color: CHART_COLORS[i % CHART_COLORS.length] }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {categories.map((_, index) => (
                    <Cell key={`rep-cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `₹${Number(val).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Mobile View: Clean Category Share Cards */}
        <div className="mobile-tx-feed">
          {categories.length === 0 ? (
            <div className="empty-tx-mobile">
              <div className="empty-tx-icon">📊</div>
              <h5>{loading ? "Calculating report metrics..." : "No categorical expenditures"}</h5>
              <p>No categorical expenditures found for this period.</p>
            </div>
          ) : (
            categories.map((cat) => (
              <div className="mobile-tx-card" key={`mob-rep-${cat.category}`}>
                <div className="mobile-tx-avatar" style={{ backgroundColor: "#fef2f2" }}>
                  <span className="mobile-tx-icon">🏷️</span>
                </div>

                <div className="mobile-tx-info" style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <strong className="mobile-tx-title">{cat.category}</strong>
                    <span className="mobile-tx-amount expense">
                      -₹{cat.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                    <div className="budget-progress-track small" style={{ flex: 1, margin: 0, height: "6px" }}>
                      <div
                        className="budget-progress-fill warning"
                        style={{ width: `${Math.min(100, cat.percentage)}%`, height: "100%" }}
                      />
                    </div>
                    <span style={{ fontSize: "11px", color: "#646b7b", fontWeight: "600", minWidth: "32px", textAlign: "right" }}>
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Detailed Table */}
        <div className="desktop-table-container">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>CATEGORY</th>
                  <th>EXPENDITURE (INR)</th>
                  <th>SHARE OF TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: "center", padding: "28px", color: "#9ca3af" }}>
                      {loading ? "Calculating report metrics..." : "No categorical expenditures in this period."}
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.category}>
                      <td>
                        <strong>{cat.category}</strong>
                      </td>
                      <td className="amount" style={{ color: "#d32f2f", fontWeight: "700" }}>
                        -₹{cat.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div className="budget-progress-track small" style={{ width: "120px", margin: 0 }}>
                            <div
                              className="budget-progress-fill warning"
                              style={{ width: `${Math.min(100, cat.percentage)}%` }}
                            />
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: "600", color: "#4b5563" }}>
                            {cat.percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

