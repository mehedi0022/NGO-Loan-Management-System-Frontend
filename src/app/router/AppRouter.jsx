import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "../../layouts/dashboard/DashboardLayout.jsx";
import { LoginPage } from "../../modules/auth/pages/LoginPage.jsx";
import { DashboardPage } from "../../modules/dashboard/DashboardPage.jsx";
import { CreateMemberPage } from "../../modules/members/pages/CreateMemberPage.jsx";
import { MemberProfilePage } from "../../modules/members/pages/MemberProfilePage.jsx";
import { MembersPage } from "../../modules/members/pages/MembersPage.jsx";
import { CreateLoanPage } from "../../modules/loans/CreateLoanPage.jsx";
import { LoanApprovalPage } from "../../modules/loans/LoanApprovalPage.jsx";
import { LoansPage } from "../../modules/loans/LoansPage.jsx";
import { CollectionPage } from "../../modules/collections/CollectionPage.jsx";
import { DueOverduePage } from "../../modules/loans/DueOverduePage.jsx";
import { PlaceholderPage } from "../../modules/shared/PlaceholderPage.jsx";

import { ProtectedRoute } from "../../modules/auth/components/ProtectedRoute.jsx";
import { PublicOnlyRoute } from "../../modules/auth/components/PublicOnlyRoute.jsx";

const pages = [
  {
    path: "savings",
    title: "Savings",
    description: "Savings accounts and balances will appear here.",
  },
  {
    path: "income-expense",
    title: "Income & Expense",
    description: "Financial income and expense records will appear here.",
  },
  {
    path: "reports",
    title: "Reports",
    description: "Operational and financial reports will appear here.",
  },
  {
    path: "users",
    title: "Users & Roles",
    description: "User access and role management will appear here.",
  },
  {
    path: "settings",
    title: "Settings",
    description: "Application settings will appear here.",
  },
];

export function AppRouter() {
  return (
    <Routes>
      {/* Public-only routes */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />

          <Route path="members/new" element={<CreateMemberPage />} />

          <Route
            path="members/:memberId/edit"
            element={<CreateMemberPage isEdit />}
          />

          <Route path="members/:memberId" element={<MemberProfilePage />} />

          <Route path="members" element={<MembersPage />} />

          <Route path="loans/new" element={<CreateLoanPage />} />

          <Route path="loans/approval" element={<LoanApprovalPage />} />

          <Route path="loans" element={<LoansPage />} />

          <Route path="loans/overdue" element={<DueOverduePage />} />

          <Route path="collections" element={<CollectionPage />} />

          {pages.map((page) => (
            <Route
              key={page.path}
              path={page.path}
              element={<PlaceholderPage {...page} />}
            />
          ))}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
