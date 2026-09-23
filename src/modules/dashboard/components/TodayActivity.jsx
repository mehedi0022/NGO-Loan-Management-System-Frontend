import { CalendarOutlined, DollarOutlined, FundOutlined, WalletOutlined } from "@ant-design/icons";
import { Col, Row, Typography, theme } from "antd";
import { useNavigate } from "react-router-dom";

import { StatCard } from "../../../components/stat-card/StatCard.jsx";
import { formatCurrency } from "../../loans/loanFormatters.js";

export function TodayActivity({ today, loading = false }) {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const cards = [
    { title: "Due Today", value: formatCurrency(today?.amountDue ?? 0), note: `${today?.installmentsDue ?? 0} installment${today?.installmentsDue === 1 ? "" : "s"}`, icon: <CalendarOutlined />, accent: token.colorWarning, onClick: () => navigate("/collections") },
    { title: "Collected Today", value: formatCurrency(today?.totalCollected ?? 0), note: "Loan and savings combined", icon: <DollarOutlined />, accent: token.colorSuccess, onClick: () => navigate("/collections") },
    { title: "Loan Collection", value: formatCurrency(today?.loanCollected ?? 0), note: "Installment collections today", icon: <FundOutlined />, accent: token.colorPrimary, onClick: () => navigate("/collections") },
    { title: "Savings Collection", value: formatCurrency(today?.savingsCollected ?? 0), note: `${formatCurrency(today?.savingsWithdrawn ?? 0)} withdrawn today`, icon: <WalletOutlined />, accent: token.colorInfo, onClick: () => navigate("/savings") },
  ];

  return (
    <section className="dashboard-section" aria-labelledby="today-activity-title">
      <Typography.Title level={4} id="today-activity-title" className="dashboard-section-heading">
        Today&apos;s Activity
      </Typography.Title>
      <Row gutter={[16, 16]}>
        {cards.map((card) => (
          <Col key={card.title} xs={24} sm={12} xl={6}>
            <StatCard {...card} loading={loading} />
          </Col>
        ))}
      </Row>
    </section>
  );
}
