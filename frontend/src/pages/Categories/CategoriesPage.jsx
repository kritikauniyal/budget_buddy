import React, { useState, useEffect } from "react";
import { Plus, Tags, Trash2, X } from "lucide-react";
import api from "../../services/api";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    icon: "🏷️",
    color: "#7557E8",
    type: "expense",
  });

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    setSubmitting(true);
    try {
      await api.addCategory(formData);
      setShowModal(false);
      setFormData({
        name: "",
        icon: "🏷️",
        color: "#7557E8",
        type: "expense",
      });
      await loadCategories();
    } catch (err) {
      alert("Error adding category: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await api.deleteCategory(id, type);
      await loadCategories();
    } catch (err) {
      alert(err.message || "Failed to delete category.");
    }
  };

  const expenseCats = categories.filter((c) => c.type === "expense");
  const incomeCats = categories.filter((c) => c.type === "income");

  return (
    <div className="module-page">
      <div className="welcome-section">
        <div>
          <h2>Category Management</h2>
          <p>Organize your financial activities with custom tags, colors, and icons.</p>
        </div>

        <button className="primary-button" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Create Category
        </button>
      </div>

      <h3 style={{ fontSize: "16px", marginBottom: "14px", color: "#191b35" }}>
        Expense Categories ({expenseCats.length})
      </h3>
      <div className="categories-grid" style={{ marginBottom: "32px" }}>
        {expenseCats.map((cat) => (
          <div className="category-tag-card" key={cat.id}>
            <div className="cat-tag-header">
              <span className="cat-bubble" style={{ background: `${cat.color}20`, color: cat.color }}>
                {cat.icon}
              </span>
              <button
                className="delete-cat-btn"
                onClick={() => handleDelete(cat.id, "expense")}
                title="Delete Category"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <strong>{cat.name}</strong>
            <span style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
              Total: ₹{(cat.total_spent || 0).toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: "16px", marginBottom: "14px", color: "#191b35" }}>
        Income Categories ({incomeCats.length})
      </h3>
      <div className="categories-grid">
        {incomeCats.map((cat) => (
          <div className="category-tag-card" key={cat.id}>
            <div className="cat-tag-header">
              <span className="cat-bubble" style={{ background: `${cat.color}20`, color: cat.color }}>
                {cat.icon}
              </span>
              <button
                className="delete-cat-btn"
                onClick={() => handleDelete(cat.id, "income")}
                title="Delete Category"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <strong>{cat.name}</strong>
            <span style={{ fontSize: "12px", color: "#16844b", marginTop: "4px" }}>
              Revenue Tag
            </span>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="expense-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <h2>Create New Category</h2>
                <p>Add a personalized classification tag.</p>
              </div>
              <button onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAdd}>
              <label>Category Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>

              <label>Category Name</label>
              <input
                required
                placeholder="e.g. Subscriptions, Pet Care"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <label>Icon Emoji</label>
              <input
                required
                maxLength={4}
                placeholder="e.g. 🐶, 🍿, 🚗"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              />

              <label>Accent Color</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                style={{ height: "42px", padding: "4px" }}
              />

              <button type="submit" className="primary-button modal-submit" disabled={submitting}>
                {submitting ? "Creating..." : "Save Category"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

