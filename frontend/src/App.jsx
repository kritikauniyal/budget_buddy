import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import IncomePage from "./pages/Income/IncomePage";
import ExpensesPage from "./pages/Expenses/ExpensesPage";
import TransactionsPage from "./pages/Transactions/TransactionsPage";
import CategoriesPage from "./pages/Categories/CategoriesPage";
import BudgetsPage from "./pages/Budgets/BudgetsPage";
import GroupInboxPage from "./pages/GroupInbox/GroupInboxPage";
import GroupsPage from "./pages/Groups/GroupsPage";
import ReportsPage from "./pages/Reports/ReportsPage";
import NotificationsPage from "./pages/Notifications/NotificationsPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import AuthPage from "./pages/Auth/AuthPage";
import OnboardingModal from "./components/onboarding/OnboardingModal";
import api from "./services/api";
import "./App.css";

function MainApp() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const [activePage, setActivePage] = useState("Dashboard");
  const [backend, setBackend] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // First-time onboarding popup
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Dashboard Filters & State
  const [period, setPeriod] = useState("this_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const [dashboardSummary, setDashboardSummary] = useState({});
  const [stats, setStats] = useState([]);
  const [spendingData, setSpendingData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Check URL invitation tokens for logged-in users
  useEffect(() => {
    if (isAuthenticated) {
      const token = new URLSearchParams(window.location.search).get("invite");
      if (token) {
        api.acceptInvitation(token)
          .then((res) => {
            alert(`🎉 Success! You've joined ${res.group_name}!`);
            window.history.replaceState({}, document.title, window.location.pathname);
            setActivePage("Groups");
          })
          .catch((err) => {
            console.warn("Auto-accept invite error:", err);
          });
      }

      // Check onboarding state
      const seen = localStorage.getItem("budget_buddy_onboarding_done");
      if (!seen) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const health = await api.checkHealth();
      setBackend(health);

      if (isAuthenticated) {
        const dash = await api.getDashboard(period, startDate, endDate);
        if (dash) {
          setDashboardSummary(dash.summary || {});
          setStats(dash.stats || []);
          setSpendingData(dash.spendingData || []);
          setCategoryData(dash.categoryData || []);
          setTransactions(dash.transactions || []);
        }
      }
    } catch (err) {
      console.warn("API request failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, user, period, startDate, endDate]);

  const handleAddExpense = async (formData) => {
    await api.addExpense({
      name: formData.name,
      amount: parseFloat(formData.amount),
      category: formData.category,
      payment_method: formData.payment_method,
      transaction_date: formData.date,
      description: formData.description,
    });
    await loadData();
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      logout();
      setActivePage("Dashboard");
    }
  };

  const handleSelectOnboardingPersonal = () => {
    localStorage.setItem("budget_buddy_onboarding_done", "true");
    setShowOnboarding(false);
    setActivePage("Dashboard");
  };

  const handleSelectOnboardingGroup = () => {
    localStorage.setItem("budget_buddy_onboarding_done", "true");
    setShowOnboarding(false);
    setActivePage("Groups");
  };

  // If session is verifying on startup, show clean loader
  if (authLoading) {
    return (
      <div className="auth-page-container">
        <div style={{ textAlign: "center", color: "#ffffff" }}>
          <div className="auth-brand-icon spin-icon" style={{ margin: "0 auto 16px" }}>
            💰
          </div>
          <h3>Loading Budget Buddy...</h3>
        </div>
      </div>
    );
  }

  // If not logged in, show the AuthPage
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const renderActiveModule = () => {
    switch (activePage) {
      case "Dashboard":
        return (
          <Dashboard
            summary={dashboardSummary}
            stats={stats}
            spendingData={spendingData}
            categoryData={categoryData}
            transactions={transactions}
            period={period}
            onPeriodChange={setPeriod}
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => {
              setStartDate(s);
              setEndDate(e);
            }}
            onAddExpense={handleAddExpense}
            onNavigate={setActivePage}
          />
        );
      case "Groups":
        return (
          <GroupsPage
            currentUser={user}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
          />
        );
      case "Income":
        return <IncomePage />;
      case "Expenses":
        return <ExpensesPage />;
      case "Transactions":
        return <TransactionsPage />;
      case "Categories":
        return <CategoriesPage />;
      case "Budgets":
        return <BudgetsPage />;
      case "Reports":
        return <ReportsPage />;
      case "Group Inbox":
        return <GroupInboxPage />;
      case "Notifications":
        return <NotificationsPage />;
      case "Profile":
        return <ProfilePage />;
      default:
        return (
          <Dashboard
            summary={dashboardSummary}
            stats={stats}
            spendingData={spendingData}
            categoryData={categoryData}
            transactions={transactions}
            period={period}
            onPeriodChange={setPeriod}
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => {
              setStartDate(s);
              setEndDate(e);
            }}
            onAddExpense={handleAddExpense}
            onNavigate={setActivePage}
          />
        );
    }
  };

  return (
    <>
      <Layout
        activePage={activePage}
        setActivePage={setActivePage}
        backend={backend}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => {}}
        selectedGroupId={selectedGroupId}
        onSelectGroup={setSelectedGroupId}
      >
        {renderActiveModule()}
      </Layout>

      {/* Onboarding Modal for New Sessions */}
      {showOnboarding && (
        <OnboardingModal
          onSelectPersonal={handleSelectOnboardingPersonal}
          onSelectGroup={handleSelectOnboardingGroup}
          onClose={() => {
            localStorage.setItem("budget_buddy_onboarding_done", "true");
            setShowOnboarding(false);
          }}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
