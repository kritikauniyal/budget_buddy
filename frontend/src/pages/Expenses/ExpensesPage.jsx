import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit2, Receipt, X } from "lucide-react";
import api from "../../services/api";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    category: "Food",
    payment_method: "Cash",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await api.getExpenses({
        search,
        category: selectedCategory,
        payment_method: selectedPayment,
      });
      setExpenses(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [search, selectedCategory, selectedPayment]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      amount: "",
      category: "Food",
      payment_method: "Cash",
      date: new Date().toISOString().split("T")[0],
      description: "",
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.description,
      amount: item.amount,
      category: item.category_name,
      payment_method: item.payment_method || "Cash",
      date: new Date().toISOString().split("T")[0],
      description: item.description || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return;

    setSubmitting(true);
    try {
      if (editingItem) {
        await api.updateExpense(editingItem.id, {
          description: formData.name,
          amount: parseFloat(formData.amount),
          category_name: formData.category,
          payment_method: formData.payment_method,
          transaction_date: formData.date,
        });
      } else {
        await api.addExpense({
          name: formData.name,
          amount: parseFloat(formData.amount),
          category: formData.category,
          payment_method: formData.payment_method,
          transaction_date: formData.date,
          description: formData.description,
        });
      }
      setShowModal(false);
      setEditingItem(null);
      await loadExpenses();
    } catch (err) {
      alert("Error saving expense: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await api.deleteExpense(id);
      await loadExpenses();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="module-page">
      <div className="welcome-section">
        <div>
          <h2>Expense Management</h2>
          <p>Record, categorize, and monitor daily expenditures across all payment channels.</p>
        </div>

        <button className="primary-button" onClick={openAddModal}>
          <Plus size={18} />
          Add Expense
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-top">
            <span>Filtered Expenses Total</span>
            <div className="stat-icon orange">
              <Receipt size={21} />
            </div>
          </div>
          <h2>₹{totalExpense.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
          <div className="stat-footer">
            <span className="negative-change">{expenses.length} Records</span>
            <span>Matched in filter</span>
          </div>
        </div>
      </div>

      <section className="panel">
        <div className="panel-heading" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div className="table-search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              <option value="Food">Food</option>
              <option value="Shopping">Shopping</option>
              <option value="Travel">Travel</option>
              <option value="Bills">Bills</option>
              <option value="Rent">Rent</option>
              <option value="Electricity">Electricity</option>
              <option value="Medical">Medical</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Groceries">Groceries</option>
              <option value="Other">Other</option>
            </select>

            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="filter-select"
            >
              <option value="">All Payments</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Net Banking">Net Banking</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>TRANSACTION</th>
                <th>CATEGORY</th>
                <th>DATE</th>
                <th>PAYMENT METHOD</th>
                <th>AMOUNT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "32px", color: "#8a90a2" }}>
                    {loading ? "Loading expenses..." : "No expenses match the filter criteria."}
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td>
                      <div className="transaction-name">
                        <span className="transaction-emoji">{exp.category_icon}</span>
                        <strong>{exp.description}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="payment-badge">
                        {exp.category_name}
                      </span>
                    </td>
                    <td>{exp.transaction_date}</td>
                    <td>
                      <span className="payment-badge" style={{ background: "#ede7f6", color: "#673ab7" }}>
                        {exp.payment_method}
                      </span>
                    </td>
                    <td className="amount" style={{ color: "#d32f2f", fontWeight: "700" }}>
                      -₹{exp.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="secondary-button"
                          style={{ padding: "6px 8px" }}
                          onClick={() => openEditModal(exp)}
                          title="Edit Expense"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="delete-row-btn"
                          onClick={() => handleDelete(exp.id)}
                          title="Delete Expense"
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
                <h2>{editingItem ? "Edit Expense Record" : "Add New Expense"}</h2>
                <p>Record your daily spending.</p>
              </div>
              <button onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>Expense Title</label>
              <input
                required
                placeholder="e.g. Grocery Shopping, Fuel"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Food">Food</option>
                <option value="Shopping">Shopping</option>
                <option value="Travel">Travel</option>
                <option value="Bills">Bills</option>
                <option value="Rent">Rent</option>
                <option value="Electricity">Electricity</option>
                <option value="Medical">Medical</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Education">Education</option>
                <option value="Groceries">Groceries</option>
                <option value="Other">Other</option>
              </select>

              <label>Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Other">Other</option>
              </select>

              <label>Date</label>
              <input
                required
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />

              <button type="submit" className="primary-button modal-submit" disabled={submitting}>
                {submitting ? "Saving..." : editingItem ? "Update Expense" : "Save Expense"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
