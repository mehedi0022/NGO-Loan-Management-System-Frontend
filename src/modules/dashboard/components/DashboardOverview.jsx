import {
  BankOutlined,
  DollarCircleOutlined,
  FundOutlined,
  MoneyCollectOutlined,
  PercentageOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Col, Row, theme } from "antd";
import { useNavigate } from "react-router-dom";

import { StatCard } from "../../../components/stat-card/StatCard.jsx";
import { formatCurrency } from "../../loans/loanFormatters.js";

export function DashboardOverview({ overview, loading = false }) {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const cards = [
    { title: "Total Members", value: overview?.totalMembers ?? 0, note: "Registered members", icon: <TeamOutlined />, accent: token.colorPrimary, onClick: () => navigate("/members") },
    { title: "Active Loans", value: overview?.activeLoans ?? 0, note: "Currently collecting", icon: <BankOutlined />, accent: token.colorSuccess, onClick: () => navigate("/loans") },
    { title: "Total Principal", value: formatCurrency(overview?.totalPrincipal ?? 0), note: "Disbursed loan principal", icon: <DollarCircleOutlined />, accent: token.colorPrimary, onClick: () => navigate("/loans") },
    { title: "Total Charge", value: formatCurrency(overview?.totalCharge ?? 0), note: "Charge on disbursed loans", icon: <PercentageOutlined />, accent: token.colorError, onClick: () => navigate("/loans") },
    { title: "Total Payable", value: formatCurrency(overview?.totalPayable ?? 0), note: "Principal plus charge", icon: <FundOutlined />, accent: token.colorInfo, onClick: () => navigate("/loans") },
    { title: "Loan Collected", value: formatCurrency(overview?.totalLoanCollected ?? 0), note: "Recovered loan amount", icon: <MoneyCollectOutlined />, accent: token.colorSuccess, onClick: () => navigate("/collections") },
    { title: "Outstanding Loan", value: formatCurrency(overview?.outstandingLoanAmount ?? 0), note: "Remaining active installments", icon: <SafetyCertificateOutlined />, accent: token.colorWarning, onClick: () => navigate("/loans") },
    { title: "Total Savings", value: formatCurrency(overview?.totalSavings ?? 0), note: "General and special savings", icon: <WalletOutlined />, accent: token.colorInfo, onClick: () => navigate("/savings") },
  ];

  return (
    <Row gutter={[16, 16]}>
      {cards.map((card) => (
        <Col key={card.title} xs={24} sm={12} lg={8} xxl={6}>
          <StatCard {...card} loading={loading} />
        </Col>
      ))}
    </Row>
  );
}
