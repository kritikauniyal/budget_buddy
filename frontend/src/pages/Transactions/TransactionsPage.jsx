import React, { useState, useEffect } from "react";
import { History, Search, ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../services/api";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 15;

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await api.getTransactions({
        type_filter: typeFilter,
        search,
        page,
        limit,
      });
      setTransactions(data?.items || []);
      setTotal(data?.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [typeFilter, search, page]);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="module-page">
      <div className="welcome-section">
        <div>
          <h2>Transaction History</h2>
          <p>Unified chronological audit trail of all financial inflows and outflows ({total} Total Records).</p>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "18px", flexWrap: "wrap", justifyContent: "space-between" }}>
        <div className="table-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search all descriptions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="filter-tabs" style={{ display: "flex", gap: "8px" }}>
          {[
            { label: "All Transactions", value: "all" },
            { label: "Incomes Only", value: "income" },
            { label: "Expenses Only", value: "expense" },
          ].map((tab) => (
            <button
              key={tab.value}
              className={`tab-pill ${typeFilter === tab.value ? "active" : ""}`}
              onClick={() => {
                setTypeFilter(tab.value);
                setPage(1);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <section className="panel">
        {/* Mobile Feed */}
        <div className="mobile-tx-feed" style={{ marginTop: "6px" }}>
          {transactions.length === 0 ? (
            <div className="empty-tx-mobile">
              <div className="empty-tx-icon">🧾</div>
              <h5>{loading ? "Loading transactions..." : "No matching transactions found"}</h5>
              <p>Try clearing filters or search keywords.</p>
            </div>
          ) : (
            transactions.map((item) => (
              <div className="mobile-tx-card" key={`mob-${item.type}-${item.id}`}>
                <div
                  className="mobile-tx-avatar"
                  style={{
                    backgroundColor: item.type === "income" ? "#ecfdf5" : "#fef2f2"
                  }}
                >
                  <span className="mobile-tx-icon">
                    {item.category_icon || (item.type === "income" ? "💰" : "💳")}
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
                    className={`mobile-tx-amount ${item.type === "income" ? "income" : "expense"}`}
                  >
                    {item.type === "income" ? "+" : "-"}₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="mobile-tx-status">Completed</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="desktop-table-container">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>TRANSACTION</th>
                  <th>TYPE</th>
                  <th>CATEGORY</th>
                  <th>PAYMENT METHOD</th>
                  <th>DATE</th>
                  <th>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "36px", color: "#8a90a2" }}>
                      {loading ? "Loading transactions..." : "No matching transactions found in the database."}
                    </td>
                  </tr>
                ) : (
                  transactions.map((item) => (
                    <tr key={`${item.type}-${item.id}`}>
                      <td>
                        <div className="transaction-name">
                          <span className="transaction-emoji">{item.category_icon || (item.type === "income" ? "💰" : "💳")}</span>
                          <strong>{item.name}</strong>
                        </div>
                      </td>
                      <td>
                        {item.type === "income" ? (
                          <span className="status-pill pill-normal">
                            <ArrowDownRight size={13} style={{ display: "inline", verticalAlign: "middle" }} /> Income
                          </span>
                        ) : (
                          <span className="status-pill pill-danger">
                            <ArrowUpRight size={13} style={{ display: "inline", verticalAlign: "middle" }} /> Expense
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="payment-badge">{item.category}</span>
                      </td>
                      <td>{item.payment_method}</td>
                      <td>{item.date}</td>
                      <td
                        className="amount"
                        style={{
                          color: item.type === "income" ? "#16844b" : "#d32f2f",
                          fontWeight: "700",
                        }}
                      >
                        {item.type === "income" ? "+" : "-"}₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 4px 0", borderTop: "1px solid #edf0f5", marginTop: "14px" }}>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Showing Page {page} of {totalPages}
            </span>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="secondary-button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                style={{ padding: "6px 12px", opacity: page <= 1 ? 0.5 : 1 }}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                className="secondary-button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                style={{ padding: "6px 12px", opacity: page >= totalPages ? 0.5 : 1 }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
