import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "../../layouts/dashboard/DashboardLayout.jsx";
import { LoginPage } from "../../modules/auth/LoginPage.jsx";
import { DashboardPage } from "../../modules/dashboard/DashboardPage.jsx";
import { CreateMemberPage } from "../../modules/members/CreateMemberPage.jsx";
import { MemberProfilePage } from "../../modules/members/MemberProfilePage.jsx";
import { MembersPage } from "../../modules/members/MembersPage.jsx";
import { PlaceholderPage } from "../../modules/shared/PlaceholderPage.jsx";

const pages = [
  {
    path: "loans",
    title: "Loans",
    description: "Loan applications and active facilities will appear here.",
  },
  {
    path: "loans/overdue",
    title: "Due / Overdue",
    description: "Upcoming and overdue repayments will appear here.",
  },
  {
    path: "collections",
    title: "Collections",
    description: "Collection activity and repayment tracking will appear here.",
  },
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
      <Route path="/login" element={<LoginPage />} />
      <Route element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="members/new" element={<CreateMemberPage />} />
        <Route
          path="members/:memberId/edit"
          element={<CreateMemberPage isEdit />}
        />
        <Route path="members/:memberId" element={<MemberProfilePage />} />
        <Route path="members" element={<MembersPage />} />
        {pages.map((page) => (
          <Route
            key={page.path}
            path={page.path}
            element={<PlaceholderPage {...page} />}
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
