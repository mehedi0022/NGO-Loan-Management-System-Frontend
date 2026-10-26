import {
  CalendarOutlined,
} from "@ant-design/icons";
import { Button, Col, Modal, Row, Space, Table, Tag, Typography } from "antd";
import { formatCurrency, formatDate } from "../../loans/loanFormatters.js";
import { useGetDpsAccountByIdQuery } from "../dpsApi.js";

export function DpsScheduleModal({ open, onClose, dpsAccount }) {
  const accountId = dpsAccount?.id;

  const {
    data: detailsData,
    isLoading,
    isFetching,
  } = useGetDpsAccountByIdQuery(accountId, {
    skip: !open || !accountId,
  });

  const account = detailsData?.data || dpsAccount;
  const isWeekly = account?.frequency === "WEEKLY";
  const installments = account?.installments || [];

  const totalInstallments = isWeekly
    ? Math.round(((account?.durationMonths || 12) / 12) * 52)
    : account?.durationMonths || 12;

  const paidCount = installments.filter((i) => i.status === "PAID").length;
  const partialCount = installments.filter((i) => i.status === "PARTIAL").length;
  const pendingCount = installments.filter(
    (i) => i.status !== "PAID" && i.status !== "PARTIAL",
  ).length;

  const totalPaidAmount = Number(account?.totalPaidAmount || 0);
  const targetInstallmentAmount = Number(account?.installmentAmount || 0);

  const columns = [
    {
      title: "#",
      dataIndex: "installmentNo",
      key: "installmentNo",
      width: 55,
      align: "center",
      render: (val, record, idx) => (
        <span style={{ fontWeight: 600 }}>
          {val || record.installmentNumber || idx + 1}
        </span>
      ),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (val) => formatDate(val),
    },
    {
      title: "Target Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (val) => (
        <span style={{ fontWeight: 500 }}>
          {formatCurrency(Number(val) || targetInstallmentAmount)}
        </span>
      ),
    },
    {
      title: "Paid Amount",
      dataIndex: "paidAmount",
      key: "paidAmount",
      align: "right",
      render: (val) => {
        const num = Number(val || 0);
        return (
          <span
            style={{
              fontWeight: 600,
              color: num > 0 ? "#059669" : "#64748b",
            }}
          >
            {formatCurrency(num)}
          </span>
        );
      },
    },
    {
      title: "Remaining Due",
      key: "remainingDue",
      align: "right",
      render: (_, record) => {
        const amt = Number(record.amount || targetInstallmentAmount);
        const paid = Number(record.paidAmount || 0);
        const rem = Math.max(0, amt - paid);
        if (record.status === "PAID" || rem === 0) {
          return <span style={{ color: "#059669", fontSize: 12 }}>—</span>;
        }
        return (
          <span
            style={{
              fontWeight: 600,
              color: paid > 0 ? "#d97706" : "#dc2626",
            }}
          >
            {formatCurrency(rem)}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (st) => {
        if (st === "PAID") return <Tag color="green">PAID</Tag>;
        if (st === "PARTIAL") return <Tag color="orange">PARTIAL</Tag>;
        if (st === "OVERDUE") return <Tag color="red">OVERDUE</Tag>;
        return <Tag color="default">PENDING</Tag>;
      },
    },
    {
      title: "Paid Date",
      dataIndex: "paidAt",
      key: "paidAt",
      render: (val) => (val ? formatDate(val) : "—"),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <Space>
          <CalendarOutlined style={{ color: "#0284c7", fontSize: 18 }} />
          <span>
            DPS Installment Schedule —{" "}
            {account?.dpsNumber || `DPS #${account?.id}`}
          </span>
        </Space>
      }
      width={780}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Close
        </Button>,
      ]}
      destroyOnClose
    >
      {/* Account Info Header */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: "12px 16px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Member:{" "}
            </Typography.Text>
            <Typography.Text strong style={{ fontSize: 14 }}>
              {account?.member?.fullName || "—"}
            </Typography.Text>
            {account?.member?.memberId && (
              <span style={{ color: "#64748b", marginLeft: 4, fontSize: 12 }}>
                ({account.member.memberId})
              </span>
            )}
            {account?.member?.somiti?.name && (
              <span style={{ color: "#475569", marginLeft: 8, fontSize: 12 }}>
                · 🏷️ {account.member.somiti.name}
              </span>
            )}
          </div>
          <Space>
            <Tag color={isWeekly ? "blue" : "purple"}>
              {isWeekly ? "Weekly DPS" : "Monthly DPS"}
            </Tag>
            <Tag
              color={
                account?.status === "ACTIVE"
                  ? "green"
                  : account?.status === "MATURED"
                    ? "gold"
                    : "default"
              }
            >
              {account?.status || "ACTIVE"}
            </Tag>
          </Space>
        </div>

        <Row gutter={[16, 8]} style={{ fontSize: 12 }}>
          <Col xs={12} sm={6}>
            <div style={{ color: "#64748b" }}>Target / Installment:</div>
            <div style={{ fontWeight: 700, color: "#047857", fontSize: 13 }}>
              {formatCurrency(targetInstallmentAmount)}
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{ color: "#64748b" }}>Total Deposited:</div>
            <div style={{ fontWeight: 700, color: "#047857", fontSize: 13 }}>
              {formatCurrency(totalPaidAmount)}
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{ color: "#64748b" }}>Maturity Target:</div>
            <div style={{ fontWeight: 700, color: "#0284c7", fontSize: 13 }}>
              {formatCurrency(account?.maturityAmount)}
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{ color: "#64748b" }}>Progress:</div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>
              {paidCount} of {totalInstallments} {isWeekly ? "wks" : "mos"} paid
            </div>
          </Col>
        </Row>

        {/* Quick badges */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 10,
            flexWrap: "wrap",
          }}
        >
          <Tag color="cyan">Total Installments: {totalInstallments}</Tag>
          <Tag color="green">Paid: {paidCount}</Tag>
          {partialCount > 0 && <Tag color="orange">Partial: {partialCount}</Tag>}
          <Tag color="default">Pending: {pendingCount}</Tag>
        </div>
      </div>

      <Table
        dataSource={installments}
        columns={columns}
        rowKey="id"
        size="small"
        loading={isLoading || isFetching}
        pagination={{
          pageSize: isWeekly ? 26 : 12,
          showSizeChanger: true,
          pageSizeOptions: ["12", "26", "52", "104"],
        }}
        locale={{
          emptyText: (
            <div
              style={{
                padding: "24px 0",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              {isLoading || isFetching
                ? "Loading installment schedule..."
                : "No installments found for this DPS account."}
            </div>
          ),
        }}
      />
    </Modal>
  );
}
