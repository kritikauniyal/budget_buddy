import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
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
              Budget Buddy v1.0
            </span>
            <span>Professional Personal Expense & Budget Management System</span>
          </div>
        </div>
      </main>
    </div>
  );
}
