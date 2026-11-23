const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL !== undefined
    ? import.meta.env.VITE_API_BASE_URL
    : import.meta.env.PROD
    ? ""
    : "http://127.0.0.1:8000";

// Standard request helper with JSON parsing and error handling
async function request(endpoint, options = {}) {
  const token = localStorage.getItem("budget_buddy_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = `${API_BASE_URL}${endpoint}`;
  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err) {
    throw new Error(
      import.meta.env.PROD
        ? "Unable to connect to the backend server. Please verify your connection or try refreshing."
        : "Backend server is not running on port 8000. Please start your backend using 'python run.py' in the backend folder."
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  baseUrl: API_BASE_URL,

  // System Health
  checkHealth: async () => {
    try {
      return await request("/api/health");
    } catch (error) {
      return {
        status: "error",
        api: "disconnected",
        database: "unknown",
        app_name: "Budget Buddy",
        environment: "offline"
      };
    }
  },

  // Authentication API
  login: async (credentials) => {
    return await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  register: async (userData) => {
    return await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  getMe: async () => {
    return await request("/api/auth/me");
  },

  updateProfile: async (data) => {
    return await request("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  changePassword: async (data) => {
    return await request("/api/auth/change-password", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  forgotPassword: async (email) => {
    return await request("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (email, resetToken, newPassword) => {
    return await request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        email,
        reset_token: resetToken,
        new_password: newPassword,
      }),
    });
  },

  // Dashboard API
  getDashboard: async (period = "this_month", startDate = "", endDate = "") => {
    const parts = [`period=${encodeURIComponent(period)}`];
    if (startDate) parts.push(`start_date=${encodeURIComponent(startDate)}`);
    if (endDate) parts.push(`end_date=${encodeURIComponent(endDate)}`);
    return await request(`/api/dashboard?${parts.join("&")}`);
  },

  getDashboardSummary: async (period = "this_month", startDate = "", endDate = "") => {
    const parts = [`period=${encodeURIComponent(period)}`];
    if (startDate) parts.push(`start_date=${encodeURIComponent(startDate)}`);
    if (endDate) parts.push(`end_date=${encodeURIComponent(endDate)}`);
    return await request(`/api/dashboard/summary?${parts.join("&")}`);
  },

  getRecentTransactions: async (limit = 10) => {
    return await request(`/api/dashboard/recent-transactions?limit=${limit}`);
  },

  getMonthlyAnalytics: async () => {
    return await request("/api/dashboard/monthly-analytics");
  },

  getCategoryAnalytics: async (period = "this_month") => {
    return await request(`/api/dashboard/category-analytics?period=${encodeURIComponent(period)}`);
  },

  // Unified Transactions Ledger API
  getTransactions: async (params = {}) => {
    const q = [];
    if (params.type_filter) q.push(`type_filter=${encodeURIComponent(params.type_filter)}`);
    if (params.search) q.push(`search=${encodeURIComponent(params.search)}`);
    if (params.page) q.push(`page=${params.page}`);
    if (params.limit) q.push(`limit=${params.limit}`);
    const qs = q.length > 0 ? `?${q.join("&")}` : "";
    return await request(`/api/transactions${qs}`);
  },

  // Incomes API
  getIncomes: async (search = "") => {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    return await request(`/api/incomes${q}`);
  },

  addIncome: async (incomeData) => {
    return await request("/api/incomes", {
      method: "POST",
      body: JSON.stringify(incomeData),
    });
  },

  updateIncome: async (id, incomeData) => {
    return await request(`/api/incomes/${id}`, {
      method: "PUT",
      body: JSON.stringify(incomeData),
    });
  },

  deleteIncome: async (id) => {
    return await request(`/api/incomes/${id}`, {
      method: "DELETE",
    });
  },

  // Expenses API
  getExpenses: async (params = {}) => {
    const queryParts = [];
    if (params.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
    if (params.payment_method) queryParts.push(`payment_method=${encodeURIComponent(params.payment_method)}`);
    if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    const qs = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    return await request(`/api/expenses${qs}`);
  },

  addExpense: async (expenseData) => {
    return await request("/api/expenses", {
      method: "POST",
      body: JSON.stringify(expenseData),
    });
  },

  updateExpense: async (id, expenseData) => {
    return await request(`/api/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(expenseData),
    });
  },

  deleteExpense: async (id) => {
    return await request(`/api/expenses/${id}`, {
      method: "DELETE",
    });
  },

  // Categories API
  getCategories: async () => {
    return await request("/api/categories");
  },

  addCategory: async (categoryData) => {
    return await request("/api/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  },

  deleteCategory: async (id, type = "expense") => {
    return await request(`/api/categories/${id}?type=${type}`, {
      method: "DELETE",
    });
  },

  // Budgets API
  getBudgets: async (month, year) => {
    const parts = [];
    if (month) parts.push(`month=${month}`);
    if (year) parts.push(`year=${year}`);
    const qs = parts.length > 0 ? `?${parts.join("&")}` : "";
    return await request(`/api/budgets${qs}`);
  },

  saveBudget: async (budgetData) => {
    return await request("/api/budgets", {
      method: "POST",
      body: JSON.stringify(budgetData),
    });
  },

  // Group Inbox API
  getGroupInbox: async (statusFilter = "", groupId = null) => {
    const parts = [];
    if (statusFilter) parts.push(`status_filter=${encodeURIComponent(statusFilter)}`);
    if (groupId) parts.push(`group_id=${encodeURIComponent(groupId)}`);
    const qs = parts.length > 0 ? `?${parts.join("&")}` : "";
    return await request(`/api/group-inbox${qs}`);
  },

  submitGroupExpense: async (data) => {
    return await request("/api/group-inbox", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  approveGroupExpense: async (id) => {
    return await request(`/api/group-inbox/${id}/approve`, {
      method: "POST",
    });
  },

  rejectGroupExpense: async (id, reason) => {
    return await request(`/api/group-inbox/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  // Reports API
  getReportData: async (period = "this_month", startDate = "", endDate = "") => {
    const parts = [`period=${encodeURIComponent(period)}`];
    if (startDate) parts.push(`start_date=${encodeURIComponent(startDate)}`);
    if (endDate) parts.push(`end_date=${encodeURIComponent(endDate)}`);
    return await request(`/api/reports/data?${parts.join("&")}`);
  },

  getReportCsvUrl: (period = "this_month", startDate = "", endDate = "") => {
    const parts = [`period=${encodeURIComponent(period)}`];
    if (startDate) parts.push(`start_date=${encodeURIComponent(startDate)}`);
    if (endDate) parts.push(`end_date=${encodeURIComponent(endDate)}`);
    return `${API_BASE_URL}/api/reports/export/csv?${parts.join("&")}`;
  },

  getReportPdfUrl: (period = "this_month", startDate = "", endDate = "") => {
    const parts = [`period=${encodeURIComponent(period)}`];
    if (startDate) parts.push(`start_date=${encodeURIComponent(startDate)}`);
    if (endDate) parts.push(`end_date=${encodeURIComponent(endDate)}`);
    return `${API_BASE_URL}/api/reports/export/pdf?${parts.join("&")}`;
  },

  // Notifications API
  getNotifications: async () => {
    return await request("/api/notifications");
  },

  markNotificationRead: async (id) => {
    return await request(`/api/notifications/${id}/read`, {
      method: "PUT",
    });
  },

  markAllNotificationsRead: async () => {
    return await request("/api/notifications/read-all", {
      method: "PUT",
    });
  },

  // =====================================================================
  // GROUP EXPENSE SHARING & INVITATIONS API
  // =====================================================================

  getGroups: async () => {
    return await request("/api/groups");
  },

  getGroup: async (id) => {
    return await request(`/api/groups/${id}`);
  },

  createGroup: async (data) => {
    return await request("/api/groups", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateGroup: async (id, data) => {
    return await request(`/api/groups/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteGroup: async (id) => {
    return await request(`/api/groups/${id}`, {
      method: "DELETE",
    });
  },

  getGroupMembers: async (groupId) => {
    return await request(`/api/groups/${groupId}/members`);
  },

  removeGroupMember: async (groupId, userId) => {
    return await request(`/api/groups/${groupId}/members/${userId}`, {
      method: "DELETE",
    });
  },

  getGroupDashboard: async (groupId) => {
    return await request(`/api/groups/${groupId}/dashboard`);
  },

  getGroupExpenses: async (groupId) => {
    return await request(`/api/groups/${groupId}/expenses`);
  },

  addGroupExpense: async (groupId, data) => {
    return await request(`/api/groups/${groupId}/expenses`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  deleteGroupExpense: async (groupId, expenseId) => {
    return await request(`/api/groups/${groupId}/expenses/${expenseId}`, {
      method: "DELETE",
    });
  },

  getGroupBalances: async (groupId) => {
    return await request(`/api/groups/${groupId}/balances`);
  },

  recordGroupSettlement: async (groupId, data) => {
    return await request(`/api/groups/${groupId}/settle`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getGroupSettlements: async (groupId) => {
    return await request(`/api/groups/${groupId}/settlements`);
  },

  inviteGroupMembers: async (groupId, data) => {
    return await request(`/api/invitations/group/${groupId}/invite`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getGroupInvitations: async (groupId) => {
    return await request(`/api/invitations/group/${groupId}`);
  },

  getGroupShareLink: async (groupId) => {
    return await request(`/api/invitations/group/${groupId}/link`, {
      method: "POST",
    });
  },

  getMyPendingInvitations: async () => {
    return await request("/api/invitations/pending");
  },

  inspectInvitation: async (token) => {
    return await request(`/api/invitations/${token}`);
  },

  acceptInvitation: async (token) => {
    return await request(`/api/invitations/${token}/accept`, {
      method: "POST",
    });
  },

  rejectInvitation: async (token) => {
    return await request(`/api/invitations/${token}/reject`, {
      method: "POST",
    });
  },

  cancelInvitation: async (invitationId) => {
    return await request(`/api/invitations/${invitationId}`, {
      method: "DELETE",
    });
  },

  // Recurring Expenses
  getRecurringExpenses: async () => {
    return await request("/api/recurring");
  },

  createRecurringExpense: async (data) => {
    return await request("/api/recurring", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  deleteRecurringExpense: async (id) => {
    return await request(`/api/recurring/${id}`, {
      method: "DELETE",
    });
  },

  logRecurringExpenseNow: async (id) => {
    return await request(`/api/recurring/${id}/log-now`, {
      method: "POST",
    });
  },
};


export default api;
