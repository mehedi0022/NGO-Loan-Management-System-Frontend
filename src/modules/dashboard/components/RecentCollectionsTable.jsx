import { Alert, Avatar, Button, Card, Empty, Space, Table, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import { resolveUploadUrl } from "../../../utils/uploadUrl.js";
import { formatCurrency, formatDate, formatEnum } from "../../loans/loanFormatters.js";

export function RecentCollectionsTable({
  collections = [],
  loading = false,
  error,
  onRetry,
}) {
  const navigate = useNavigate();

  return (
    <Card
      title="Recent Collections"
      className="dashboard-panel-card dashboard-table-card"
      extra={<Button type="link" onClick={() => navigate("/collections")}>View All</Button>}
    >
      {error ? (
        <Alert
          type="error"
          showIcon
          message="Unable to load recent collections"
          description={error?.data?.message || "Please try again."}
          action={<Button size="small" onClick={onRetry}>Retry</Button>}
        />
      ) : (
        <Table
          rowKey="id"
          loading={loading}
          dataSource={collections}
          pagination={false}
          size="middle"
          scroll={{ x: 1050 }}
          locale={{ emptyText: <Empty description="No collections recorded yet" /> }}
          columns={[
            {
              title: "Member",
              dataIndex: "member",
              width: 230,
              fixed: "left",
              render: (member) => member ? (
                <button type="button" className="dashboard-member-link" aria-label={`View ${member.fullName}`} onClick={() => navigate(`/members/${member.id}`)}>
                  <Avatar size={32} src={resolveUploadUrl(member.photoUrl)} icon={<UserOutlined />} />
                  <span>
                    <Typography.Text strong>{member.fullName}</Typography.Text>
                    <Typography.Text type="secondary">{member.memberId || `#${member.id}`}</Typography.Text>
                  </span>
                </button>
              ) : "—",
            },
            {
              title: "Collection ID",
              dataIndex: "collectionId",
              width: 150,
              render: (value, item) => <Typography.Text strong>{value || `#${item.id}`}</Typography.Text>,
            },
            { title: "Loan", dataIndex: "loanCollectionAmount", width: 135, align: "right", render: formatCurrency },
            {
              title: "Savings",
              key: "savings",
              width: 190,
              align: "right",
              render: (_, item) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text>General {formatCurrency(item.generalSavingsAmount)}</Typography.Text>
                  <Typography.Text type="secondary">Special {formatCurrency(item.specialSavingsAmount)}</Typography.Text>
                </Space>
              ),
            },
            { title: "Total", dataIndex: "totalAmount", width: 140, align: "right", render: (value) => <Typography.Text strong>{formatCurrency(value)}</Typography.Text> },
            { title: "Method", dataIndex: "paymentMethod", width: 150, render: formatEnum },
            { title: "Collection Date", dataIndex: "collectionDate", width: 150, render: formatDate },
          ]}
        />
      )}
    </Card>
  );
}
