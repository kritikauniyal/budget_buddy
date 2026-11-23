import React, { useEffect, useState } from "react";
import { Users, CheckCircle2 } from "lucide-react";
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

  // Invitation Flow State
  const [pendingInvite, setPendingInvite] = useState(null);
  const [joiningInvite, setJoiningInvite] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState("");

  // Check URL invitation token
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("invite");
    if (token) {
      api.inspectInvitation(token)
        .then((data) => {
          setPendingInvite(data);
        })
        .catch((err) => {
          console.warn("Could not inspect invitation:", err);
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
      >
        {renderActiveModule()}
      </Layout>

      {/* Dedicated Join Group Invitation Prompt */}
      {pendingInvite && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: "480px", textAlign: "center", padding: "28px 24px" }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(117, 87, 232, 0.12)",
              color: "#7557E8",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 16px"
            }}>
              <Users size={28} />
            </div>

            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "6px" }}>
              Join "{pendingInvite.group_name}"?
            </h2>

            <p style={{ color: "#64748b", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "18px" }}>
              <strong>{pendingInvite.invited_by_name}</strong> invited you to join their <strong>{pendingInvite.group_type}</strong> group on Budget Buddy to share expenses and split balances.
            </p>

            {inviteError && (
              <div className="auth-alert error" style={{ marginBottom: "16px", textAlign: "left" }}>
                <span>{inviteError}</span>
              </div>
            )}

            {inviteSuccessMsg ? (
              <div style={{ background: "#f0fdf4", color: "#16a34a", padding: "12px", borderRadius: "10px", fontWeight: 600, marginBottom: "16px" }}>
                {inviteSuccessMsg}
              </div>
            ) : (
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "10px" }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setPendingInvite(null);
                    window.history.replaceState({}, document.title, window.location.pathname);
                  }}
                >
                  Decline
                </button>
                <button
                  type="button"
                  className="primary-button"
                  disabled={joiningInvite}
                  onClick={async () => {
                    setJoiningInvite(true);
                    setInviteError("");
                    try {
                      const res = await api.acceptInvitation(pendingInvite.token);
                      setInviteSuccessMsg(`🎉 You've successfully joined ${res.group_name}!`);
                      window.history.replaceState({}, document.title, window.location.pathname);
                      setTimeout(() => {
                        setPendingInvite(null);
                        setSelectedGroupId(res.group_id);
                        setActivePage("Groups");
                      }, 1000);
                    } catch (err) {
                      setInviteError(err.message || "Could not accept invitation.");
                    } finally {
                      setJoiningInvite(false);
                    }
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{joiningInvite ? "Joining..." : "Accept & Join Group"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
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
