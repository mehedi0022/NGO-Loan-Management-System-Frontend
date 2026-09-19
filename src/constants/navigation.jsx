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

export const navigationItems = [
  { key: "/", label: "Dashboard", icon: <HomeOutlined /> },
  { key: "/members", label: "Members", icon: <TeamOutlined /> },
  {
    key: "loans-group",
    label: "Loans",
    icon: <BankOutlined />,
    children: [
      { key: "/loans", label: "All Loans" },
      { key: "/loans/approval", label: "Loan Approval" },
      { key: "/loans/overdue", label: "Due / Overdue" },
    ],
  },
  { key: "/collections", label: "Collections", icon: <DollarOutlined /> },
  { key: "/savings", label: "Savings", icon: <BookOutlined /> },
  {
    key: "/income-expense",
    label: "Income & Expense",
    icon: <BarChartOutlined />,
  },
  { key: "/reports", label: "Reports", icon: <FileTextOutlined /> },
  { key: "/users", label: "Users & Roles", icon: <UserSwitchOutlined /> },
  { key: "/settings", label: "Settings", icon: <SettingOutlined /> },
];
