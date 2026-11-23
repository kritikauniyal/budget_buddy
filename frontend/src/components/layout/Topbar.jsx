import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  RefreshCw,
  Search,
  Bell,
  LogIn,
  LogOut,
  User,
  Users,
  PieChart,
  ChevronDown,
  ShieldCheck
} from "lucide-react";

export default function Topbar({
  activePage,
  backend,
  onRefresh,
  isRefreshing,
  onOpenSidebar,
  user,
  onOpenAuth,
  onLogout,
  onNavigate
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const getPageSubtitle = (page) => {
    switch (page) {
      case "Dashboard":
        return "Welcome back! Here's your complete money overview.";
      case "Groups":
        return "Split shared expenses with friends, trips, or roommates.";
      case "Income":
        return "Track your salary, freelance earnings, and cash inflows.";
      case "Expenses":
        return "Log your daily spending and keep receipts organized.";
      case "Transactions":
        return "Your complete history of money in and money out.";
      case "Categories":
        return "Organize your money with custom tags, colors, and icons.";
      case "Budgets":
        return "Set spending limits and get alerts before you overspend.";
      case "Reports":
        return "Download spending statements and financial summaries.";
      case "Group Inbox":
        return "Review and approve shared expenses from your groups.";
      case "Notifications":
        return "Helpful budget alerts and shared expense updates.";
      case "Profile":
        return "Manage your personal account and security settings.";
      default:
        return "Smart, simple money management for everyday life.";
    }
  };

  const handleNav = (pageName) => {
    setDropdownOpen(false);
    if (onNavigate) {
      onNavigate(pageName);
    }
  };

  const handleSignOut = () => {
    setDropdownOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  const isOnline = backend?.status === "success";

  return (
    <header className="topbar">
      {/* Topbar Left: Page title and subtitle */}
      <div className="topbar-left">
        <button
          className="mobile-menu"
          onClick={onOpenSidebar}
          aria-label="Open Navigation Menu"
        >
          <Menu size={22} />
        </button>

        <div className="topbar-title-group">
          <div className="topbar-tagline-row">
            <span className="topbar-brand-tag">Budget Buddy</span>
            <span className="topbar-slash">/</span>
            <span className="topbar-current-tag">{activePage}</span>
          </div>
          <h1>{activePage}</h1>
          <p>{getPageSubtitle(activePage)}</p>
        </div>
      </div>

      {/* Topbar Right: Actions and User Dropdown */}
      <div className="topbar-actions">
        {/* Refresh Button */}
        <button
          className="icon-button topbar-action-btn"
          title="Refresh Data"
          onClick={onRefresh}
          aria-label="Refresh Data"
        >
          <RefreshCw size={17} className={isRefreshing ? "spin-icon" : ""} />
        </button>

        {/* Quick Search */}
        <button
          className="icon-button topbar-action-btn"
          title="Search Transactions"
          aria-label="Search Transactions"
          onClick={() => handleNav("Transactions")}
        >
          <Search size={18} />
        </button>

        {/* Notifications */}
        <button
          className="icon-button topbar-action-btn notification"
          title="Notifications"
          aria-label="Notifications"
          onClick={() => handleNav("Notifications")}
        >
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        {/* User Account / Avatar Dropdown */}
        {user ? (
          <div className="user-dropdown-wrapper" ref={dropdownRef}>
            <button
              type="button"
              className={`user-profile-trigger ${dropdownOpen ? "active" : ""}`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              title="User Account Menu"
            >
              <div className="avatar top-avatar">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
              </div>

              <div className="user-trigger-info">
                <span className="user-trigger-name">{user.full_name || "User"}</span>
                <span className="user-trigger-sub">Personal</span>
              </div>

              <ChevronDown
                size={14}
                className={`user-trigger-chevron ${dropdownOpen ? "rotate" : ""}`}
              />
            </button>

            {/* Dropdown Menu Modal/Card */}
            {dropdownOpen && (
              <div className="topbar-user-dropdown" role="menu">
                {/* User Header Details */}
                <div className="dropdown-user-header">
                  <div className="avatar dropdown-avatar-lg">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="dropdown-user-meta">
                    <strong>{user.full_name || "User"}</strong>
                    <span className="dropdown-user-email">{user.email}</span>
                    <span className="dropdown-badge-verified">
                      <ShieldCheck size={12} />
                      Active Member
                    </span>
                  </div>
                </div>

                <div className="dropdown-divider" />

                {/* Navigation Items */}
                <div className="dropdown-items-group">
                  <button
                    type="button"
                    className="dropdown-menu-item"
                    onClick={() => handleNav("Profile")}
                    role="menuitem"
                  >
                    <div className="item-icon-box">
                      <User size={16} />
                    </div>
                    <div className="item-text-box">
                      <strong>My Profile</strong>
                      <span>Account settings & security</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="dropdown-menu-item"
                    onClick={() => handleNav("Groups")}
                    role="menuitem"
                  >
                    <div className="item-icon-box">
                      <Users size={16} />
                    </div>
                    <div className="item-text-box">
                      <strong>Group Expenses</strong>
                      <span>Shared trips, roommates & bills</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="dropdown-menu-item"
                    onClick={() => handleNav("Budgets")}
                    role="menuitem"
                  >
                    <div className="item-icon-box">
                      <PieChart size={16} />
                    </div>
                    <div className="item-text-box">
                      <strong>Budgets & Limits</strong>
                      <span>Track category spending limits</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="dropdown-menu-item"
                    onClick={() => handleNav("Notifications")}
                    role="menuitem"
                  >
                    <div className="item-icon-box">
                      <Bell size={16} />
                    </div>
                    <div className="item-text-box">
                      <strong>Notifications</strong>
                      <span>System alerts & activity</span>
                    </div>
                  </button>
                </div>

                <div className="dropdown-divider" />

                {/* Sign Out Action */}
                <div className="dropdown-footer">
                  <button
                    type="button"
                    className="dropdown-logout-btn"
                    onClick={handleSignOut}
                    role="menuitem"
                  >
                    <LogOut size={16} />
                    <span>Sign Out of Budget Buddy</span>
                  </button>

                  <div className="dropdown-sync-status">
                    <span className={`status-dot ${isOnline ? "pulsing" : ""}`} />
                    <span>{isOnline ? "FastAPI & MySQL Connected" : "Connecting..."}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            className="primary-button topbar-login-btn"
            onClick={onOpenAuth}
          >
            <LogIn size={16} />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>
    </header>
  );
}
