import React, { useState, useEffect } from "react";
import { Download, FileText, Calendar, TrendingUp, TrendingDown, PiggyBank, BarChart3 } from "lucide-react";
import api from "../../services/api";

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
          <h2>Financial Reports & Statements</h2>
          <p>Exportable statements, categorical audits, and savings rate analytics.</p>
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
            Export Excel / CSV
          </a>
        </div>
      </div>

      {/* SUMMARY KPI CARDS */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-top">
            <span>Period Total Inflow</span>
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
            <span>Period Total Outflow</span>
            <div className="stat-icon orange">
              <TrendingDown size={20} />
            </div>
          </div>
          <h2>₹{(summary.total_expenses || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
          <div className="stat-footer">
            <span className="negative-change">Expenditures</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Net Financial Savings</span>
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

      {/* CATEGORICAL BREAKDOWN TABLE */}
      <section className="panel" style={{ marginBottom: "24px" }}>
        <div className="panel-heading">
          <div>
            <h3>Categorical Outflow Breakdown</h3>
            <p>Spending distribution across all active categories in {period.replace("_", " ")}</p>
          </div>
        </div>

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
      </section>
    </div>
  );
}

