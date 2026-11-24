import React, { useEffect, useState } from "react";
import { Users, CheckCircle2, Sparkles, ArrowRight, Check, X } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import IncomePage from "./pages/Income/IncomePage";
import ExpensesPage from "./pages/Expenses/ExpensesPage";
import TransactionsPage from "./pages/Transactions/TransactionsPage";
import CategoriesPage from "./pages/Categories/CategoriesPage";
import BudgetsPage from "./pages/Budgets/BudgetsPage";
import RecurringPage from "./pages/Recurring/RecurringPage";
import GroupInboxPage from "./pages/GroupInbox/GroupInboxPage";
import GroupsPage from "./pages/Groups/GroupsPage";
import ReportsPage from "./pages/Reports/ReportsPage";
import NotificationsPage from "./pages/Notifications/NotificationsPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import AuthPage from "./pages/Auth/AuthPage";
import OnboardingModal from "./components/onboarding/OnboardingModal";
import InvitePreviewSheet from "./components/invitations/InvitePreviewSheet";
import api from "./services/api";
import { confirmAction } from "./utils/swal";
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
  const [groupInitialTab, setGroupInitialTab] = useState("expenses");
  const [groupExpenseTrigger, setGroupExpenseTrigger] = useState(0);

  const [dashboardSummary, setDashboardSummary] = useState({});
  const [stats, setStats] = useState([]);
  const [spendingData, setSpendingData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Invitation Flow State
  const [pendingInvite, setPendingInvite] = useState(null);

  // Check URL invitation token or stored pending invitation
  useEffect(() => {
    const match = window.location.pathname.match(/\/invite\/([a-zA-Z0-9_-]+)/);
    const searchParam = new URLSearchParams(window.location.search).get("invite");
    const token = (match && match[1]) || searchParam || localStorage.getItem("budget_buddy_pending_invite");

    if (token) {
      api.inspectInvitation(token)
        .then((data) => {
          setPendingInvite(data);
        })
        .catch((err) => {
          console.warn("Could not inspect invitation:", err);
          localStorage.removeItem("budget_buddy_pending_invite");
        });
    }

    if (isAuthenticated) {
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

  const handleLogout = async () => {
    const isConfirmed = await confirmAction({
      title: "Log Out?",
      text: "Are you sure you want to log out of Budget Buddy?",
      confirmButtonText: "Yes, log out",
      confirmButtonColor: "#6366f1",
      icon: "question"
    });
    if (isConfirmed) {
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

  const handleInviteJoinSuccess = (res) => {
    setPendingInvite(null);
    setSelectedGroupId(res.group_id);
    setGroupInitialTab("expenses");
    setActivePage("Groups");
    window.history.replaceState({}, document.title, "/");
    loadData();
  };

  const handleInviteOpenGroup = (groupId) => {
    setPendingInvite(null);
    setSelectedGroupId(groupId);
    setGroupInitialTab("expenses");
    setActivePage("Groups");
    window.history.replaceState({}, document.title, "/");
  };

  const handleInviteClose = () => {
    setPendingInvite(null);
    localStorage.removeItem("budget_buddy_pending_invite");
    window.history.replaceState({}, document.title, window.location.pathname.replace(/\/invite\/[a-zA-Z0-9_-]+/, "/"));
  };

  // If not logged in and no pending invite to preview, show AuthPage
  if (!isAuthenticated && !pendingInvite) {
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
            initialTab={groupInitialTab}
            externalAddTrigger={groupExpenseTrigger}
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
      case "Recurring":
        return <RecurringPage />;
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
        onTriggerGroupExpense={() => setGroupExpenseTrigger((prev) => prev + 1)}
      >
        {renderActiveModule()}
      </Layout>

      {/* Dedicated Join Group Invitation Sheet matching reference screenshot */}
      {pendingInvite && (
        <InvitePreviewSheet
          invite={pendingInvite}
          onJoinSuccess={handleInviteJoinSuccess}
          onOpenGroup={handleInviteOpenGroup}
          onClose={handleInviteClose}
        />
      )}


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
