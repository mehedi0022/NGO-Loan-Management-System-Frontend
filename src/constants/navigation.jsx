import {
  ApartmentOutlined,
  BarChartOutlined,
  BankOutlined,
  BookOutlined,
  DollarOutlined,
  FileTextOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
  UserSwitchOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { permissions } from "../modules/auth/permissions.js";

export const navigationItems = [
  { key: "/", label: "Dashboard", icon: <HomeOutlined />, permission: permissions.dashboardRead },
  { key: "/somities", label: "Somities", icon: <ApartmentOutlined />, permission: permissions.somitiesReadAny },
  { key: "/members", label: "Members", icon: <TeamOutlined />, permission: permissions.membersReadAny },
  {
    key: "loans-group",
    label: "Loans",
    icon: <BankOutlined />,
    children: [
      { key: "/loans", label: "All Loans", permission: permissions.loansReadAny },
      { key: "/loans/approval", label: "Loan Approval", permission: permissions.loansApprove },
      { key: "/loans/disbursement", label: "Loan Disbursement", permission: permissions.loansDisburse },
    ],
  },
  { key: "/collections", label: "Collections", icon: <DollarOutlined />, permission: permissions.collectionsReadAny },
  { key: "/savings", label: "Savings", icon: <BookOutlined />, permission: permissions.savingsReadAny },
  { key: "/dps", label: "DPS Accounts", icon: <SafetyCertificateOutlined />, permission: permissions.dpsReadAny },
  {
    key: "/accounts",
    label: "Accounts & Cash",
    icon: <WalletOutlined />,
    permission: permissions.accountsReadAny,
  },
  {
    key: "/income-expense",
    label: "Income & Expense",
    icon: <BarChartOutlined />,
    permission: permissions.incomeExpenseReadAny,
  },
  { key: "/reports", label: "Reports", icon: <FileTextOutlined />, permission: permissions.reportsReadAny },
  { key: "/users", label: "Users & Roles", icon: <UserSwitchOutlined />, permission: permissions.usersReadAny },
  { key: "/settings", label: "Settings", icon: <SettingOutlined />, permission: permissions.settingsRead },
];
