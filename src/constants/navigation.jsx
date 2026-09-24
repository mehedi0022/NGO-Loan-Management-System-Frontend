import {
  BarChartOutlined,
  BankOutlined,
  BookOutlined,
  DollarOutlined,
  FileTextOutlined,
  HomeOutlined,
  SettingOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { permissions } from "../modules/auth/permissions.js";

export const navigationItems = [
  { key: "/", label: "Dashboard", icon: <HomeOutlined />, permission: permissions.dashboardRead },
  { key: "/members", label: "Members", icon: <TeamOutlined />, permission: permissions.membersReadAny },
  {
    key: "loans-group",
    label: "Loans",
    icon: <BankOutlined />,
    children: [
      { key: "/loans", label: "All Loans", permission: permissions.loansReadAny },
      { key: "/loans/approval", label: "Loan Approval", permission: permissions.loansApprove },
      { key: "/loans/overdue", label: "Due / Overdue", permission: permissions.loansReadAny },
    ],
  },
  { key: "/collections", label: "Collections", icon: <DollarOutlined />, permission: permissions.collectionsReadAny },
  { key: "/savings", label: "Savings", icon: <BookOutlined />, permission: permissions.savingsReadAny },
  {
    key: "/income-expense",
    label: "Income & Expense",
    icon: <BarChartOutlined />,
  },
  { key: "/reports", label: "Reports", icon: <FileTextOutlined />, permission: permissions.reportsReadAny },
  { key: "/users", label: "Users & Roles", icon: <UserSwitchOutlined />, permission: permissions.usersReadAny },
  { key: "/settings", label: "Settings", icon: <SettingOutlined /> },
];
