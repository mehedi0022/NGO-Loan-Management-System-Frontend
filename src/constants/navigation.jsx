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
  {
    key: "/",
    label: "Dashboard",
    icon: <HomeOutlined />,
    permission: permissions.dashboardRead,
  },
  {
    key: "/somities",
    label: "Somities",
    icon: <ApartmentOutlined />,
    permission: permissions.somitiesReadAny,
  },
  {
    key: "members-group",
    label: "Members",
    icon: <TeamOutlined />,
    children: [
      {
        key: "/members",
        label: "All Members",
        permission: permissions.membersReadAny,
      },
      {
        key: "/members/new",
        label: "Add Member",
        permission: permissions.membersCreate,
      },
      {
        key: "/members/migration",
        label: "Legacy Migration",
        permission: permissions.migrationExecute,
      },
    ],
  },
  {
    key: "loans-group",
    label: "Loans",
    icon: <BankOutlined />,
    children: [
      {
        key: "/loans",
        label: "All Loans",
        permission: permissions.loansReadAny,
      },
      {
        key: "/loans/new",
        label: "Apply Loan",
        permission: permissions.loansCreate,
      },
      {
        key: "/loans/approval",
        label: "Loan Approval",
        permission: permissions.loansApprove,
      },
      {
        key: "/loans/disbursement",
        label: "Loan Disbursement",
        permission: permissions.loansDisburse,
      },
    ],
  },
  {
    key: "/collections",
    label: "Collections",
    icon: <DollarOutlined />,
    permission: permissions.collectionsReadAny,
  },
  {
    key: "/savings",
    label: "Savings",
    icon: <BookOutlined />,
    permission: permissions.savingsReadAny,
  },
  {
    key: "/dps",
    label: "DPS Accounts",
    icon: <SafetyCertificateOutlined />,
    permission: permissions.dpsReadAny,
  },
  {
    key: "/accounts",
    label: "Accounts & Cash",
    icon: <WalletOutlined />,
    permission: permissions.accountsTransfer,
  },
  {
    key: "/income-expense",
    label: "Income & Expense",
    icon: <BarChartOutlined />,
    permission: permissions.incomeExpenseReadAny,
  },
  {
    key: "/reports",
    label: "Reports",
    icon: <FileTextOutlined />,
    permission: permissions.reportsReadAny,
  },
  {
    key: "/users",
    label: "Users & Roles",
    icon: <UserSwitchOutlined />,
    permission: permissions.usersReadAny,
  },
  {
    key: "/settings",
    label: "Settings",
    icon: <SettingOutlined />,
    permission: permissions.settingsRead,
  },
];
