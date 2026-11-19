import React from "react";
import {
  TrendingUp,
  Receipt,
  History,
  Tags,
  PieChart,
  BarChart3,
  Users,
  Bell,
  User,
  ArrowRight
} from "lucide-react";

const moduleInfo = {
  Income: {
    icon: TrendingUp,
    phase: "Phase 4 – Income Management",
    description: "Record salary, freelance, business, and investment incomes with categories, dates, and search filters.",
  },
  Expenses: {
    icon: Receipt,
    phase: "Phase 4 – Expense Management",
    description: "Track all daily expenses with payment methods (Cash, UPI, Debit/Credit Card, Net Banking), search, and receipt upload.",
  },
  Transactions: {
    icon: History,
    phase: "Phase 4 – Transaction History",
    description: "Unified ledger view of all debits and credits with pagination, sorting, and advanced filters.",
  },
  Categories: {
    icon: Tags,
    phase: "Phase 4 – Category Management",
    description: "Customize expense and income categories, choose custom colors and icons, and reassign transactions.",
  },
  Budgets: {
    icon: PieChart,
    phase: "Phase 5 – Monthly Budget Management",
    description: "Set monthly and category-wise spending limits with 80% warning alerts and 100% exceeded indicators.",
  },
  Reports: {
    icon: BarChart3,
    phase: "Phase 7 – Reports and Analytics",
    description: "Deep dive financial analytics with custom date range filters, PDF summary downloads, and Excel exports.",
  },
  "Group Inbox": {
    icon: Users,
    phase: "Phase 6 – Group Inbox",
    description: "Submit shared team and family expenses for approval or rejection with reason logs and duplicate prevention.",
  },
  Notifications: {
    icon: Bell,
    phase: "Phase 8 – Notifications",
    description: "Live notifications for 80% budget utilization, budget exceeded warnings, and expense approval decisions.",
  },
  Profile: {
    icon: User,
    phase: "Phase 8 – User Profile & Security",
    description: "Manage your account, change password, and configure financial preferences.",
  },
};

export default function ModulePlaceholder({ pageTitle, onBackToDashboard }) {
  const info = moduleInfo[pageTitle] || {
    icon: Receipt,
    phase: "Upcoming Module",
    description: "This module will be connected in accordance with the project roadmap.",
  };

  const Icon = info.icon;

  return (
    <section className="placeholder-page">
      <div className="placeholder-icon">
        <Icon size={32} />
      </div>

      <h2>{pageTitle}</h2>
      <div className="badge-phase">{info.phase}</div>

      <p>{info.description}</p>

      <button className="primary-button" onClick={onBackToDashboard}>
        Return to Dashboard
        <ArrowRight size={16} />
      </button>
    </section>
  );
}

