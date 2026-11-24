import React from "react";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  User,
  Plus
} from "lucide-react";

export default function BottomNav({ activePage, onNavigate, onQuickAdd }) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
      <div className="mobile-bottom-nav-inner">
        {/* Tab 1: Home */}
        <button
          type="button"
          className={`bottom-nav-item ${activePage === "Dashboard" ? "active" : ""}`}
          onClick={() => onNavigate("Dashboard")}
          aria-label="Home"
          aria-current={activePage === "Dashboard" ? "page" : undefined}
        >
          <div className="bottom-nav-icon-wrapper">
            <LayoutDashboard size={21} strokeWidth={activePage === "Dashboard" ? 2.5 : 1.9} />
          </div>
          <span className="bottom-nav-label">Home</span>
          {activePage === "Dashboard" && <span className="bottom-nav-indicator" />}
        </button>

        {/* Tab 2: Groups */}
        <button
          type="button"
          className={`bottom-nav-item ${activePage === "Groups" ? "active" : ""}`}
          onClick={() => onNavigate("Groups")}
          aria-label="Groups"
          aria-current={activePage === "Groups" ? "page" : undefined}
        >
          <div className="bottom-nav-icon-wrapper">
            <Users size={21} strokeWidth={activePage === "Groups" ? 2.5 : 1.9} />
          </div>
          <span className="bottom-nav-label">Groups</span>
          {activePage === "Groups" && <span className="bottom-nav-indicator" />}
        </button>

        {/* Tab 3: Prominent Center Add Button */}
        <button
          type="button"
          className="bottom-nav-center-action"
          onClick={onQuickAdd}
          aria-label="Add Expense"
          title="Add Expense"
        >
          <div className="center-action-btn">
            <Plus size={24} strokeWidth={2.8} />
          </div>
          <span className="bottom-nav-label center-label">Add</span>
        </button>

        {/* Tab 4: Reports */}
        <button
          type="button"
          className={`bottom-nav-item ${activePage === "Reports" ? "active" : ""}`}
          onClick={() => onNavigate("Reports")}
          aria-label="Reports"
          aria-current={activePage === "Reports" ? "page" : undefined}
        >
          <div className="bottom-nav-icon-wrapper">
            <BarChart3 size={21} strokeWidth={activePage === "Reports" ? 2.5 : 1.9} />
          </div>
          <span className="bottom-nav-label">Reports</span>
          {activePage === "Reports" && <span className="bottom-nav-indicator" />}
        </button>

        {/* Tab 5: Profile */}
        <button
          type="button"
          className={`bottom-nav-item ${activePage === "Profile" ? "active" : ""}`}
          onClick={() => onNavigate("Profile")}
          aria-label="Profile"
          aria-current={activePage === "Profile" ? "page" : undefined}
        >
          <div className="bottom-nav-icon-wrapper">
            <User size={21} strokeWidth={activePage === "Profile" ? 2.5 : 1.9} />
          </div>
          <span className="bottom-nav-label">Profile</span>
          {activePage === "Profile" && <span className="bottom-nav-indicator" />}
        </button>
      </div>
    </nav>
  );
}
