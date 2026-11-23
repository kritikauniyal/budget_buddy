import React, { useState, useEffect } from "react";
import {
  Wallet,
  LayoutDashboard,
  TrendingUp,
  Receipt,
  History,
  Tags,
  PieChart as BudgetIcon,
  BarChart3,
  Users,
  Bell,
  User,
  LogOut,
  LogIn,
  X,
  ChevronDown,
  ChevronRight,
  Repeat
} from "lucide-react";
import api from "../../services/api";

export default function Sidebar({
  activePage,
  setActivePage,
  sidebarOpen,
  setSidebarOpen,
  user,
  onLogout,
  onOpenAuth,
  selectedGroupId = null,
  onSelectGroup
}) {
  const [groups, setGroups] = useState([]);
  const [groupsDropdownOpen, setGroupsDropdownOpen] = useState(false);

  // Fetch user groups for the Groups dropdown
  useEffect(() => {
    if (user) {
      api.getGroups()
        .then((data) => setGroups(data || []))
        .catch((err) => console.warn("Sidebar could not load groups:", err));
    }
  }, [user, activePage]);

  const menuItems = [
    { id: "Dashboard", title: "Dashboard", icon: LayoutDashboard },
    {
      id: "Groups",
      title: "Groups",
      icon: Users,
      hasDropdown: true
    },
    { id: "Income", title: "Income", icon: TrendingUp },
    { id: "Expenses", title: "Expenses", icon: Receipt },
    { id: "Transactions", title: "Transactions", icon: History },
    { id: "Categories", title: "Categories", icon: Tags },
    { id: "Budgets", title: "Budgets", icon: BudgetIcon },
    { id: "Recurring", title: "Recurring Bills", icon: Repeat },
    { id: "Reports", title: "Reports", icon: BarChart3 },
    { id: "Group Inbox", title: "Group Inbox", icon: Users },
    { id: "Notifications", title: "Notifications", icon: Bell },
    { id: "Profile", title: "Profile", icon: User },
  ];

  const handleGroupsMenuClick = () => {
    setActivePage("Groups");
    if (onSelectGroup) {
      onSelectGroup(null);
    }
    setGroupsDropdownOpen(!groupsDropdownOpen);
  };

  const handleSelectGroupItem = (grpId) => {
    setActivePage("Groups");
    if (onSelectGroup) {
      onSelectGroup(grpId);
    }
    setSidebarOpen(false);
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <img
            src="/api/logo.png"
            alt="Budget Buddy"
            className="sidebar-brand-logo"
            onError={(e) => {
              e.target.style.display = 'none';
              const fallback = document.getElementById('sidebar-fallback-icon');
              if (fallback) fallback.style.display = 'grid';
            }}
          />
          <div id="sidebar-fallback-icon" className="brand-icon" style={{ display: 'none' }}>
            <Wallet size={24} />
          </div>

          <div>
            <h2>Budget Buddy</h2>
            <span>Smart Finance Manager</span>
          </div>

          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close Navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="nav-label">MAIN NAVIGATION</div>

        <nav className="navigation">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            if (item.hasDropdown) {
              return (
                <div key={item.id} className="sidebar-dropdown-wrapper">
                  <button
                    type="button"
                    className={`nav-item ${isActive ? "active" : ""}`}
                    onClick={handleGroupsMenuClick}
                  >
                    <Icon size={19} />
                    <span style={{ flex: 1, textAlign: "left" }}>{item.title}</span>

                    {groupsDropdownOpen ? (
                      <ChevronDown size={16} style={{ color: "#a8abc3" }} />
                    ) : (
                      <ChevronRight size={16} style={{ color: "#a8abc3" }} />
                    )}
                  </button>

                  {/* SUBMENU: Groups Dropdown List */}
                  {groupsDropdownOpen && (
                    <div className="sidebar-submenu">
                      {/* All Item */}
                      <button
                        type="button"
                        className={`sidebar-subitem ${isActive && selectedGroupId === null ? "active" : ""}`}
                        onClick={() => handleSelectGroupItem(null)}
                      >
                        <div className="sidebar-subitem-label">
                          <span className="sidebar-subitem-dot" />
                          <span>All</span>
                        </div>
                        <span style={{ fontSize: "10px", color: "#8588a5" }}>
                          {groups.length}
                        </span>
                      </button>

                      {/* Each Dynamic Group Name */}
                      {groups.map((grp) => (
                        <button
                          key={grp.id}
                          type="button"
                          className={`sidebar-subitem ${isActive && selectedGroupId === grp.id ? "active" : ""}`}
                          onClick={() => handleSelectGroupItem(grp.id)}
                          title={grp.name}
                        >
                          <div className="sidebar-subitem-label">
                            <span className="sidebar-subitem-dot" />
                            <span>{grp.name}</span>
                          </div>
                          <span style={{ fontSize: "10px", color: "#8588a5" }}>
                            {grp.group_type}
                          </span>
                        </button>
                      ))}

                      {groups.length === 0 && (
                        <div style={{ padding: "6px 10px", fontSize: "11px", color: "#8588a5" }}>
                          No groups created yet
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  setActivePage(item.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={19} />
                <span>{item.title}</span>

                {item.badge > 0 && (
                  <span className="nav-count">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          {user ? (
            <>
              <button
                className="nav-item logout-btn"
                onClick={onLogout}
              >
                <LogOut size={19} />
                <span>Logout</span>
              </button>

              <div className="profile">
                <div className="avatar">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="profile-info">
                  <strong>{user.full_name || "User"}</strong>
                  <span>{user.email}</span>
                </div>
              </div>
            </>
          ) : (
            <button
              className="primary-button sidebar-signin-btn"
              onClick={() => {
                setSidebarOpen(false);
                onOpenAuth();
              }}
            >
              <LogIn size={18} />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
