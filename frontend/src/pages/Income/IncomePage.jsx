import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit2, TrendingUp, X } from "lucide-react";
import api from "../../services/api";

export default function IncomePage() {
  const [incomes, setIncomes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    category_name: "Salary",
    amount: "",
    description: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  const loadIncomes = async () => {
    setLoading(true);
    try {
      const data = await api.getIncomes(search);
      setIncomes(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncomes();
  }, [search]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      category_name: "Salary",
      amount: "",
      description: "",
      transaction_date: new Date().toISOString().split("T")[0],
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      category_name: item.category_name,
      amount: item.amount,
      description: item.description || "",
      transaction_date: new Date().toISOString().split("T")[0],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount) return;

    setSubmitting(true);
    try {
      if (editingItem) {
        await api.updateIncome(editingItem.id, {
          category_name: formData.category_name,
          amount: parseFloat(formData.amount),
          description: formData.description,
          transaction_date: formData.transaction_date,
        });
      } else {
        await api.addIncome({
          category_name: formData.category_name,
          amount: parseFloat(formData.amount),
          description: formData.description,
          transaction_date: formData.transaction_date,
        });
      }
      setShowModal(false);
      setEditingItem(null);
      await loadIncomes();
    } catch (err) {
      alert("Error saving income: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this income record?")) return;
    try {
      await api.deleteIncome(id);
      await loadIncomes();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="module-page">
      <div className="welcome-section">
        <div>
          <h2>Income Management</h2>
          <p>Track all salary, freelance, business, and investment revenue streams.</p>
        </div>

        <button className="primary-button" onClick={openAddModal}>
          <Plus size={18} />
          Add Income
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-top">
            <span>Total Recorded Income</span>
            <div className="stat-icon green">
              <TrendingUp size={21} />
            </div>
          </div>
          <h2>₹{totalIncome.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
          <div className="stat-footer">
            <span className="positive-change">{incomes.length} Entries</span>
            <span>Active ledger</span>
          </div>
        </div>
      </div>

      <section className="panel">
        <div className="panel-heading" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div className="table-search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search income descriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>INCOME STREAM</th>
                <th>CATEGORY</th>
                <th>DATE</th>
                <th>AMOUNT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {incomes.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "32px", color: "#8a90a2" }}>
                    {loading ? "Loading income records..." : "No income records found."}
                  </td>
                </tr>
              ) : (
                incomes.map((inc) => (
                  <tr key={inc.id}>
                    <td>
                      <div className="transaction-name">
                        <span className="transaction-emoji">{inc.category_icon}</span>
                        <strong>{inc.description || inc.category_name}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="payment-badge" style={{ background: "#e8f8ef", color: "#16844b" }}>
                        {inc.category_name}
                      </span>
                    </td>
                    <td>{inc.transaction_date}</td>
                    <td className="amount" style={{ color: "#16844b", fontWeight: "700" }}>
                      +₹{inc.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="secondary-button"
                          style={{ padding: "6px 8px" }}
                          onClick={() => openEditModal(inc)}
                          title="Edit Income"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="delete-row-btn"
                          onClick={() => handleDelete(inc.id)}
                          title="Delete Income"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="expense-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <h2>{editingItem ? "Edit Income Record" : "Add Income Record"}</h2>
                <p>Record earnings into your financial ledger.</p>
              </div>
              <button onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>Income Title / Source</label>
              <input
                required
                placeholder="e.g. Monthly Salary, Freelance Project"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <label>Amount (₹)</label>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />

              <label>Category</label>
              <select
                value={formData.category_name}
                onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
              >
                <option value="Salary">Salary</option>
                <option value="Freelancing">Freelancing</option>
                <option value="Business">Business</option>
                <option value="Investments">Investments</option>
                <option value="Other">Other</option>
              </select>

              <label>Date</label>
              <input
                required
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
              />

              <button type="submit" className="primary-button modal-submit" disabled={submitting}>
                {submitting ? "Saving..." : editingItem ? "Update Income" : "Save Income"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
