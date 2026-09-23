import { Card, Empty, Skeleton, Typography } from "antd";
import { useNavigate } from "react-router-dom";

import { StatusTag } from "../../../components/status-tag/StatusTag.jsx";
import { formatEnum } from "../../loans/loanFormatters.js";

const statuses = ["PENDING", "APPROVED", "ACTIVE", "COMPLETED", "REJECTED", "CANCELLED"];

export function LoanPortfolioSummary({ portfolio, loading = false }) {
  const navigate = useNavigate();
  const total = statuses.reduce(
    (sum, status) => sum + Number(portfolio?.[status.toLowerCase()] || 0),
    0,
  );

  return (
    <Card title="Loan Portfolio" className="dashboard-panel-card">
      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : total === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No loans yet" />
      ) : (
        <div className="dashboard-metric-list">
          {statuses.map((status) => {
            const count = portfolio?.[status.toLowerCase()] ?? 0;
            return (
              <button key={status} type="button" className="dashboard-metric-row" aria-label={`View ${formatEnum(status)} loans`} onClick={() => navigate("/loans")}>
                <StatusTag status={status} label={formatEnum(status)} />
                <Typography.Text strong>{count}</Typography.Text>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
