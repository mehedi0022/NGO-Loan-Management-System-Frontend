import { Card, Col, Empty, Row, Statistic, Typography } from "antd";

import { StatusTag } from "../../../components/status-tag/StatusTag.jsx";
import { formatCurrency, formatDate, formatEnum } from "../../loans/loanFormatters.js";

export function SavingsSummaryCard({ account }) {
  if (!account) {
    return (
      <Card className="member-profile-card">
        <Empty description="No savings account yet" />
      </Card>
    );
  }

  const general = Number(account.generalSavingsBalance || 0);
  const special = Number(account.specialSavingsBalance || 0);

  return (
    <Card
      title="Savings Account"
      className="member-profile-card"
      extra={<StatusTag status={account.status} label={formatEnum(account.status)} />}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Statistic title="General Savings" value={formatCurrency(general)} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic title="Special Savings" value={formatCurrency(special)} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic title="Total Savings" value={formatCurrency(general + special)} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Typography.Text type="secondary">Account ID</Typography.Text>
          <Typography.Title level={5}>{account.accountId || `#${account.id}`}</Typography.Title>
          <Typography.Text type="secondary">Opened {formatDate(account.openedAt)}</Typography.Text>
        </Col>
      </Row>
    </Card>
  );
}
