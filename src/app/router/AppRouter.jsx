import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "../../layouts/dashboard/DashboardLayout.jsx";
import { LoginPage } from "../../modules/auth/pages/LoginPage.jsx";
import { DashboardPage } from "../../modules/dashboard/DashboardPage.jsx";
import { SomitiesPage } from "../../modules/somities/pages/SomitiesPage.jsx";
import { CreateMemberPage } from "../../modules/members/pages/CreateMemberPage.jsx";
import { MemberProfilePage } from "../../modules/members/pages/MemberProfilePage.jsx";
import { EditMemberPage } from "../../modules/members/pages/EditMemberPage.jsx";
import { MembersPage } from "../../modules/members/pages/MembersPage.jsx";
import { CreateLoanPage } from "../../modules/loans/CreateLoanPage.jsx";
import { LoanApprovalPage } from "../../modules/loans/LoanApprovalPage.jsx";
import { LoanDetailsPage } from "../../modules/loans/LoanDetailsPage.jsx";
import { EditLoanPage } from "../../modules/loans/EditLoanPage.jsx";
import { LoansPage } from "../../modules/loans/LoansPage.jsx";
import { CollectionPage } from "../../modules/collections/pages/CollectionPage.jsx";
import { SavingsPage } from "../../modules/savings/pages/SavingsPage.jsx";
import { DpsPage } from "../../modules/dps/pages/DpsPage.jsx";
import { DueOverduePage } from "../../modules/loans/DueOverduePage.jsx";
import { PlaceholderPage } from "../../modules/shared/PlaceholderPage.jsx";

import { ProtectedRoute } from "../../modules/auth/components/ProtectedRoute.jsx";
import { PublicOnlyRoute } from "../../modules/auth/components/PublicOnlyRoute.jsx";
import { PermissionRoute } from "../../modules/auth/components/PermissionRoute.jsx";
import { permissions } from "../../modules/auth/permissions.js";
import { UsersPage } from "../../modules/users/pages/UsersPage.jsx";
import { ReportsPage } from "../../modules/reports/pages/ReportsPage.jsx";
import { IncomeExpensePage } from "../../modules/income-expense/pages/IncomeExpensePage.jsx";
import { SettingsPage } from "../../modules/settings/pages/SettingsPage.jsx";

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
          <Route
            path="somities"
            element={
              <PermissionRoute permission={permissions.somitiesReadAny}>
                <SomitiesPage />
              </PermissionRoute>
            }
          />
          <Route path="/members/new" element={<CreateMemberPage />} />
          <Route path="/members/:id" element={<MemberProfilePage />} />
          <Route path="/members/:id/edit" element={<EditMemberPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="loans/new" element={<CreateLoanPage />} />
          <Route path="loans/approval" element={<LoanApprovalPage />} />
          <Route path="loans/overdue" element={<DueOverduePage />} />
          <Route path="loans/:id/edit" element={<EditLoanPage />} />
          <Route path="loans/:id" element={<LoanDetailsPage />} />
          <Route path="loans" element={<LoansPage />} />
          <Route path="collections" element={<CollectionPage />} />
          <Route path="savings" element={<SavingsPage />} />
          <Route path="dps" element={<DpsPage />} />
          <Route
            path="users"
            element={
              <PermissionRoute permission={permissions.usersReadAny}>
                <UsersPage />
              </PermissionRoute>
            }
          />
          <Route
            path="reports"
            element={
              <PermissionRoute permission={permissions.reportsReadAny}>
                <ReportsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="income-expense"
            element={
              <PermissionRoute permission={permissions.incomeExpenseReadAny}>
                <IncomeExpensePage />
              </PermissionRoute>
            }
          />

          <Route
            path="settings"
            element={
              <PermissionRoute permission={permissions.settingsRead}>
                <SettingsPage />
              </PermissionRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
