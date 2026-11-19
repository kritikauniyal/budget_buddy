import React, { useState } from "react";
import { X, Users, Plus, Trash2, Smartphone, Mail, Phone, Sparkles } from "lucide-react";
import api from "../../services/api";

const GROUP_TYPES = [
  { id: "Friends", name: "Friends", icon: "👥" },
  { id: "Trip", name: "Trip / Vacation", icon: "✈️" },
  { id: "Roommates", name: "Roommates / Flat", icon: "🏠" },
  { id: "Family", name: "Family", icon: "👨‍👩‍👧‍👦" },
  { id: "Office", name: "Office / Work", icon: "💼" },
  { id: "Other", name: "Other", icon: "🎉" },
];

export default function CreateGroupModal({ onClose, onGroupCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [groupType, setGroupType] = useState("Friends");
  const [currency, setCurrency] = useState("₹");

  // Contacts / friends to invite
  const [contacts, setContacts] = useState([]);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPhone, setManualPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contactNotice, setContactNotice] = useState("");

  // Contact Picker API (where supported on Android/Chrome)
  const handleImportDeviceContacts = async () => {
    setContactNotice("");
    if ("contacts" in navigator && "ContactsManager" in window) {
      try {
        const props = ["name", "email", "tel"];
        const selected = await navigator.contacts.select(props, { multiple: true });
        if (selected && selected.length > 0) {
          const imported = selected.map((c) => ({
            name: c.name && c.name[0] ? c.name[0] : "",
            email: c.email && c.email[0] ? c.email[0] : "",
            phone: c.tel && c.tel[0] ? c.tel[0] : "",
          })).filter(c => c.email || c.phone);

          setContacts((prev) => [...prev, ...imported]);
          setContactNotice(`Imported ${imported.length} contacts!`);
        }
      } catch (err) {
        setContactNotice("Contact picker was cancelled or not permitted.");
      }
    } else {
      setContactNotice("Direct device contact picker is only available on supported mobile browsers. Please enter email or phone below.");
    }
  };

  const handleAddManualContact = (e) => {
    e.preventDefault();
    if (!manualEmail && !manualPhone) {
      setError("Please provide an email address or phone number to invite.");
      return;
    }
    setError("");
    setContacts((prev) => [
      ...prev,
      {
        name: manualName.trim() || manualEmail.split("@")[0] || manualPhone,
        email: manualEmail.trim(),
        phone: manualPhone.trim(),
      },
    ]);
    setManualName("");
    setManualEmail("");
    setManualPhone("");
  };

  const handleRemoveContact = (index) => {
    setContacts((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a group name.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const created = await api.createGroup({
        name: name.trim(),
        description: description.trim() || null,
        group_type: groupType,
        currency,
        contacts_to_invite: contacts,
      });

      if (onGroupCreated) {
        onGroupCreated(created);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create group.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: "600px" }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="modal-icon-badge" style={{ background: "rgba(117, 87, 232, 0.12)", color: "#7557E8" }}>
              <Users size={22} />
            </div>
            <div>
              <h3>Create New Group</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                Split expenses, track balances, and settle bills with friends
              </p>
            </div>
          </div>
          <button className="modal-close-btn" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="auth-alert error" style={{ margin: "14px 20px 0" }}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: "65vh", overflowY: "auto", padding: "18px 20px" }}>
            {/* Group Name */}
            <div className="form-group">
              <label>Group Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Goa Trip 2026, Flat 402 Roomies"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Group Type */}
            <div className="form-group">
              <label>Group Type</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "4px" }}>
                {GROUP_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setGroupType(t.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: groupType === t.id ? "2px solid #7557E8" : "1px solid #e2e8f0",
                      background: groupType === t.id ? "rgba(117, 87, 232, 0.08)" : "#ffffff",
                      fontWeight: groupType === t.id ? "600" : "400",
                      color: groupType === t.id ? "#7557E8" : "#334155",
                      cursor: "pointer",
                      fontSize: "0.85rem"
                    }}
                  >
                    <span>{t.icon}</span>
                    <span>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                rows={2}
                placeholder="What is this group for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Add Friends / Contacts Section */}
            <div style={{ marginTop: "18px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ fontWeight: 600, margin: 0 }}>Add Friends & Members</label>
                <button
                  type="button"
                  onClick={handleImportDeviceContacts}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(34, 184, 160, 0.12)",
                    color: "#0f766e",
                    border: "none",
                    borderRadius: "6px",
                    padding: "5px 10px",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    fontWeight: 500
                  }}
                >
                  <Smartphone size={14} />
                  <span>Import Contacts</span>
                </button>
              </div>

              {contactNotice && (
                <div style={{ fontSize: "0.8rem", color: "#0f766e", background: "#f0fdf4", padding: "6px 10px", borderRadius: "6px", marginBottom: "10px" }}>
                  {contactNotice}
                </div>
              )}

              {/* Manual Input Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1fr auto", gap: "6px", alignItems: "center", marginBottom: "10px" }}>
                <input
                  type="text"
                  placeholder="Friend's Name"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  style={{ fontSize: "0.84rem", padding: "7px 10px" }}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  style={{ fontSize: "0.84rem", padding: "7px 10px" }}
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  style={{ fontSize: "0.84rem", padding: "7px 10px" }}
                />
                <button
                  type="button"
                  onClick={handleAddManualContact}
                  className="primary-button"
                  style={{ padding: "8px 12px", minWidth: "auto", fontSize: "0.82rem" }}
                  title="Add friend to invitation list"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Added Contacts Chips */}
              {contacts.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "140px", overflowY: "auto" }}>
                  {contacts.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 12px",
                        background: "#f8fafc",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "0.84rem"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#7557E8", color: "#fff", display: "grid", placeItems: "center", fontSize: "0.75rem", fontWeight: "bold" }}>
                          {c.name ? c.name[0].toUpperCase() : "U"}
                        </div>
                        <div>
                          <strong>{c.name}</strong>
                          <span style={{ color: "#64748b", marginLeft: "6px", fontSize: "0.78rem" }}>
                            {c.email || c.phone}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveContact(i)}
                        style={{ border: "none", background: "transparent", color: "#ef4444", cursor: "pointer", padding: "2px" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "10px", fontSize: "0.82rem", color: "#94a3b8" }}>
                  No friends added yet. You can also invite friends anytime after creating the group!
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer" style={{ padding: "14px 20px" }}>
            <button type="button" className="secondary-button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "Creating Group..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
