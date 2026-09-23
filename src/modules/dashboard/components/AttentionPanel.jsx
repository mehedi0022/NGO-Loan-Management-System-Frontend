import { ClockCircleOutlined, ExclamationCircleOutlined, FileDoneOutlined } from "@ant-design/icons";
import { Card, Skeleton, Typography, theme } from "antd";
import { useNavigate } from "react-router-dom";

import { formatCurrency } from "../../loans/loanFormatters.js";

export function AttentionPanel({ attention, loading = false }) {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const items = [
    {
      key: "overdue",
      title: "Overdue installments",
      value: attention?.overdueInstallments ?? 0,
      note: formatCurrency(attention?.overdueAmount ?? 0),
      icon: <ExclamationCircleOutlined />,
      color: token.colorError,
      onClick: () => navigate("/loans/overdue"),
    },
    {
      key: "pending",
      title: "Pending loan applications",
      value: attention?.pendingLoans ?? 0,
      note: "Awaiting review",
      icon: <ClockCircleOutlined />,
      color: token.colorWarning,
      onClick: () => navigate("/loans/approval"),
    },
    {
      key: "approved",
      title: "Approved loans",
      value: attention?.approvedLoans ?? 0,
      note: "Awaiting disbursement",
      icon: <FileDoneOutlined />,
      color: token.colorInfo,
      onClick: () => navigate("/loans"),
    },
  ];

  return (
    <Card title="Needs Attention" className="dashboard-panel-card">
      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <div className="dashboard-attention-list">
          {items.map((item) => (
            <button key={item.key} type="button" className="dashboard-attention-row" aria-label={`View ${item.title}`} onClick={item.onClick}>
              <span className="dashboard-attention-icon" style={{ color: item.color, background: token.colorFillSecondary }}>
                {item.icon}
              </span>
              <span className="dashboard-attention-copy">
                <Typography.Text strong>{item.title}</Typography.Text>
                <Typography.Text type="secondary">{item.note}</Typography.Text>
              </span>
              <Typography.Title level={4}>{item.value}</Typography.Title>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
