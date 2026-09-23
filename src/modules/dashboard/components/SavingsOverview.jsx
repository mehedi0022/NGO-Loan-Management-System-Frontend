import { Button, Card, Col, Row, Skeleton, Statistic, Typography } from "antd";
import { useNavigate } from "react-router-dom";

import { formatCurrency } from "../../loans/loanFormatters.js";

export function SavingsOverview({ savings, today, loading = false }) {
  const navigate = useNavigate();

  return (
    <Card title="Savings Overview" className="dashboard-panel-card" extra={<Button type="link" onClick={() => navigate("/savings")}>View Savings</Button>}>
      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <>
          <Row gutter={[16, 20]}>
            <Col xs={24} sm={8}><Statistic title="General Savings" value={formatCurrency(savings?.generalBalance ?? 0)} /></Col>
            <Col xs={24} sm={8}><Statistic title="Special Savings" value={formatCurrency(savings?.specialBalance ?? 0)} /></Col>
            <Col xs={24} sm={8}><Statistic title="Total Savings" value={formatCurrency(savings?.totalBalance ?? 0)} /></Col>
          </Row>
          <div className="dashboard-savings-today">
            <div><Typography.Text type="secondary">Deposited today</Typography.Text><Typography.Text strong>{formatCurrency(today?.savingsCollected ?? 0)}</Typography.Text></div>
            <div><Typography.Text type="secondary">Withdrawn today</Typography.Text><Typography.Text strong>{formatCurrency(today?.savingsWithdrawn ?? 0)}</Typography.Text></div>
          </div>
        </>
      )}
    </Card>
  );
}
