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
import { LoanDisbursementPage } from "../../modules/loans/LoanDisbursementPage.jsx";
import { LoanDetailsPage } from "../../modules/loans/LoanDetailsPage.jsx";
import { EditLoanPage } from "../../modules/loans/EditLoanPage.jsx";
import { LoansPage } from "../../modules/loans/LoansPage.jsx";
import { CollectionPage } from "../../modules/collections/pages/CollectionPage.jsx";
import { SavingsPage } from "../../modules/savings/pages/SavingsPage.jsx";
import { DpsPage } from "../../modules/dps/pages/DpsPage.jsx";
import { PlaceholderPage } from "../../modules/shared/PlaceholderPage.jsx";

import { ProtectedRoute } from "../../modules/auth/components/ProtectedRoute.jsx";
import { PublicOnlyRoute } from "../../modules/auth/components/PublicOnlyRoute.jsx";
import { PermissionRoute } from "../../modules/auth/components/PermissionRoute.jsx";
import { permissions } from "../../modules/auth/permissions.js";
import { UsersPage } from "../../modules/users/pages/UsersPage.jsx";
import { ReportsPage } from "../../modules/reports/pages/ReportsPage.jsx";
import { AccountsPage } from "../../modules/accounts/pages/AccountsPage.jsx";
import { IncomeExpensePage } from "../../modules/income-expense/pages/IncomeExpensePage.jsx";
import { SettingsPage } from "../../modules/settings/pages/SettingsPage.jsx";
import { MemberMigrationPage } from "../../modules/migration/pages/MemberMigrationPage.jsx";

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
          <Route
            path="/members/new"
            element={
              <PermissionRoute permission={permissions.membersCreate}>
                <CreateMemberPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/members/migration"
            element={
              <PermissionRoute permission={permissions.migrationExecute}>
                <MemberMigrationPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/members/:id"
            element={
              <PermissionRoute permission={permissions.membersReadAny}>
                <MemberProfilePage />
              </PermissionRoute>
            }
          />
          <Route
            path="/members/:id/edit"
            element={
              <PermissionRoute permission={permissions.membersUpdateAny}>
                <EditMemberPage />
              </PermissionRoute>
            }
          />
          <Route
            path="members"
            element={
              <PermissionRoute permission={permissions.membersReadAny}>
                <MembersPage />
              </PermissionRoute>
            }
          />
          <Route
            path="loans/new"
            element={
              <PermissionRoute permission={permissions.loansCreate}>
                <CreateLoanPage />
              </PermissionRoute>
            }
          />
          <Route
            path="loans/approval"
            element={
              <PermissionRoute permission={permissions.loansApprove}>
                <LoanApprovalPage />
              </PermissionRoute>
            }
          />
          <Route
            path="loans/disbursement"
            element={
              <PermissionRoute permission={permissions.loansDisburse}>
                <LoanDisbursementPage />
              </PermissionRoute>
            }
          />
          <Route
            path="loans/overdue"
            element={
              <PermissionRoute permission={permissions.loansDisburse}>
                <LoanDisbursementPage />
              </PermissionRoute>
            }
          />
          <Route
            path="loans/:id/edit"
            element={
              <PermissionRoute permission={permissions.loansUpdateAny}>
                <EditLoanPage />
              </PermissionRoute>
            }
          />
          <Route
            path="loans/:id"
            element={
              <PermissionRoute permission={permissions.loansReadAny}>
                <LoanDetailsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="loans"
            element={
              <PermissionRoute permission={permissions.loansReadAny}>
                <LoansPage />
              </PermissionRoute>
            }
          />
          <Route
            path="collections"
            element={
              <PermissionRoute permission={permissions.collectionsReadAny}>
                <CollectionPage />
              </PermissionRoute>
            }
          />
          <Route
            path="savings"
            element={
              <PermissionRoute permission={permissions.savingsReadAny}>
                <SavingsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="dps"
            element={
              <PermissionRoute permission={permissions.dpsReadAny}>
                <DpsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="accounts"
            element={
              <PermissionRoute permission={permissions.accountsTransfer}>
                <AccountsPage />
              </PermissionRoute>
            }
          />
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
