import React from "react";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Bell,
  User,
  Plus
} from "lucide-react";

export default function BottomNav({ activePage, onNavigate, onQuickAdd }) {
  const navTabs = [
    { id: "Dashboard", label: "Home", icon: LayoutDashboard },
    { id: "Groups", label: "Groups", icon: Users },
    { id: "Reports", label: "Reports", icon: BarChart3 },
    { id: "Notifications", label: "Activity", icon: Bell },
    { id: "Profile", label: "Profile", icon: User },
  ];

  return (
    <>
      {/* Prominent Floating Add Expense Button (FAB) */}
      <button
        type="button"
        className="mobile-floating-add-fab"
        onClick={onQuickAdd}
        aria-label="Add Expense"
        title="Add Expense"
      >
        <div className="fab-inner">
          <Plus size={26} strokeWidth={2.8} />
          <span className="fab-text">Add</span>
        </div>
      </button>

      {/* 5-Tab Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
        <div className="mobile-bottom-nav-inner">
          {navTabs.map((item) => {
            const IconComponent = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`bottom-nav-item ${isActive ? "active" : ""}`}
                onClick={() => onNavigate(item.id)}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="bottom-nav-icon-wrapper">
                  <IconComponent size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                </div>
                <span className="bottom-nav-label">{item.label}</span>
                {isActive && <span className="bottom-nav-indicator" />}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
