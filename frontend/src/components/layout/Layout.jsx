import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";
import QuickActionSheet from "../common/QuickActionSheet";
import { CheckCircle2 } from "lucide-react";

export default function Layout({
  activePage,
  setActivePage,
  backend,
  onRefresh,
  isRefreshing,
  user,
  onLogout,
  onOpenAuth,
  selectedGroupId,
  onSelectGroup,
  children
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickSheetOpen, setQuickSheetOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        onLogout={onLogout}
        onOpenAuth={onOpenAuth}
        selectedGroupId={selectedGroupId}
        onSelectGroup={onSelectGroup}
      />

      <main className="main-content">
        <Topbar
          activePage={activePage}
          backend={backend}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          onOpenSidebar={() => setSidebarOpen(true)}
          user={user}
          onOpenAuth={onOpenAuth}
          onLogout={onLogout}
          onNavigate={setActivePage}
        />

        <div className="page-content">
          {children}

          <div className="bottom-note">
            <span>
              <CheckCircle2 size={15} />
              Budget Buddy
            </span>
            <span>Smart, Simple Money Management for Everyday Life</span>
          </div>
        </div>

        {/* Mobile Native Bottom Navigation Bar */}
        <BottomNav
          activePage={activePage}
          onNavigate={(page) => {
            setActivePage(page);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onQuickAdd={() => setQuickSheetOpen(true)}
        />

        {/* Mobile Quick Action Bottom Sheet */}
        <QuickActionSheet
          isOpen={quickSheetOpen}
          onClose={() => setQuickSheetOpen(false)}
          onNavigate={setActivePage}
          onExpenseAdded={onRefresh}
        />
      </main>
    </div>
  );
}
