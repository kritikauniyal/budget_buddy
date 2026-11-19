import React from "react";
import { LayoutDashboard, Receipt, Plus, Users, PieChart } from "lucide-react";

export default function BottomNav({ activePage, onNavigate, onQuickAdd }) {
  const navItems = [
    { id: "Dashboard", label: "Home", icon: LayoutDashboard },
    { id: "Expenses", label: "Expenses", icon: Receipt },
    { id: "quick_add", label: "Add", isFab: true },
    { id: "Groups", label: "Groups", icon: Users },
    { id: "Budgets", label: "Budgets", icon: PieChart },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation Bar">
      <div className="mobile-bottom-nav-inner">
        {navItems.map((item) => {
          if (item.isFab) {
            return (
              <button
                key="fab-add"
                type="button"
                className="bottom-nav-fab"
                onClick={onQuickAdd}
                aria-label="Quick Add Expense or Income"
                title="Quick Add"
              >
                <div className="bottom-nav-fab-circle">
                  <Plus size={26} strokeWidth={2.6} />
                </div>
              </button>
            );
          }

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
                <IconComponent size={20} strokeWidth={isActive ? 2.4 : 1.9} />
              </div>
              <span className="bottom-nav-label">{item.label}</span>
              {isActive && <span className="bottom-nav-indicator" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

