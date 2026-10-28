import {
  CalendarOutlined,
  HistoryOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  Empty,
  Modal,
  Row,
  Segmented,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";

import { ReverseTransactionModal } from "../../../components/reverse-modal/ReverseTransactionModal.jsx";
import { formatCurrency, formatDate, formatEnum } from "../../loans/loanFormatters.js";
import {
  useGetDpsAccountByIdQuery,
  useReverseDpsTransactionMutation,
} from "../dpsApi.js";

export function DpsScheduleModal({ open, onClose, dpsAccount }) {
  const accountId = dpsAccount?.id;
  const [activeTab, setActiveTab] = useState("schedule");

  const currentUser = useSelector((state) => state.auth.user);
  const isAdmin =
    currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN";

  const [selectedTx, setSelectedTx] = useState(null);
  const [reverseModalOpen, setReverseModalOpen] = useState(false);

  const [reverseDpsTx, { isLoading: reversing }] =
    useReverseDpsTransactionMutation();

  const {
    data: detailsData,
    isLoading,
    isFetching,
    refetch,
  } = useGetDpsAccountByIdQuery(accountId, {
    skip: !open || !accountId,
  });

  const account = detailsData?.data || dpsAccount;
  const isWeekly = account?.frequency === "WEEKLY";
  const installments = account?.installments || [];
  const transactions = account?.transactions || [];

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

  const handleOpenReverse = (record) => {
    setSelectedTx(record);
    setReverseModalOpen(true);
  };

  const handleConfirmReverse = async (reason) => {
    if (!selectedTx) return;
    try {
      await reverseDpsTx({
        transactionId: selectedTx.id,
        reason,
      }).unwrap();
      message.success(
        `DPS transaction ${selectedTx.transactionId || `#${selectedTx.id}`} reversed successfully.`,
      );
      setReverseModalOpen(false);
      setSelectedTx(null);
      refetch();
    } catch (err) {
      message.error(
        err?.data?.message || "Failed to reverse DPS transaction. Please try again.",
      );
    }
  };

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
        <span style={{ fontWeight: 600 }}>
          {formatCurrency(Number(val || 0))}
        </span>
      ),
    },
    {
      title: "Paid Amount",
      dataIndex: "paidAmount",
      key: "paidAmount",
      align: "right",
      render: (val, record) => {
        const numVal = Number(val || 0);
        const target = Number(record.amount || 0);
        const isFull = numVal >= target && target > 0;
        return (
          <span
            style={{
              fontWeight: 600,
              color: isFull ? "#16a34a" : numVal > 0 ? "#ea580c" : "#94a3b8",
            }}
          >
            {formatCurrency(numVal)}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (val) => {
        if (val === "PAID") return <Tag color="green">PAID</Tag>;
        if (val === "PARTIAL") return <Tag color="orange">PARTIAL</Tag>;
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

  const transactionColumns = [
    {
      title: "Transaction ID",
      dataIndex: "transactionId",
      key: "transactionId",
      width: 140,
      render: (val, record) => (
        <Typography.Text strong>{val || `#${record.id}`}</Typography.Text>
      ),
    },
    {
      title: "Date",
      dataIndex: "transactionDate",
      key: "transactionDate",
      width: 120,
      render: (val) => formatDate(val),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 110,
      render: (val) => (
        <Tag color={val === "DEPOSIT" ? "green" : "volcano"}>
          {formatEnum(val)}
        </Tag>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      width: 120,
      render: (val) => (
        <Typography.Text strong className="text-emerald-600 dark:text-emerald-400">
          {formatCurrency(val)}
        </Typography.Text>
      ),
    },
    {
      title: "Balance After",
      dataIndex: "balanceAfter",
      key: "balanceAfter",
      align: "right",
      width: 130,
      render: (val) => formatCurrency(val),
    },
    {
      title: "Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      width: 110,
      render: (val) => formatEnum(val),
    },
    {
      title: "Reference",
      dataIndex: "reference",
      key: "reference",
      width: 140,
      ellipsis: true,
      render: (val) => val || "—",
    },
    ...(isAdmin
      ? [
          {
            title: "Action",
            key: "action",
            align: "center",
            width: 100,
            fixed: "right",
            render: (_, record) => (
              <Tooltip title="Reverse this DPS deposit">
                <Button
                  danger
                  size="small"
                  icon={<RollbackOutlined />}
                  onClick={() => handleOpenReverse(record)}
                >
                  Reverse
                </Button>
              </Tooltip>
            ),
          },
        ]
      : []),
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <Space>
          <CalendarOutlined />
          <span>
            DPS Schedule & Transactions: {account?.dpsNumber || `#${account?.id}`}
          </span>
        </Space>
      }
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Close
        </Button>,
      ]}
      width={780}
      destroyOnClose
    >
      {/* Account Info Summary Bar */}
      <div
        style={{
          background: "var(--surface-muted, #f8fafc)",
          border: "1px solid var(--border, #e2e8f0)",
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
            marginBottom: 8,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 14 }}>
            {account?.member?.fullName} ({account?.member?.memberId})
          </span>
          <Space>
            <Tag color={isWeekly ? "blue" : "purple"}>
              {isWeekly ? "WEEKLY" : "MONTHLY"}
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

      {/* Tabs */}
      <div className="mb-3">
        <Segmented
          size="small"
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: "schedule", label: "Installment Schedule", icon: <CalendarOutlined /> },
            {
              value: "transactions",
              label: `Transactions History (${transactions.length})`,
              icon: <HistoryOutlined />,
            },
          ]}
        />
      </div>

      {activeTab === "schedule" ? (
        <Table
          dataSource={installments}
          columns={columns}
          rowKey="id"
          size="small"
          loading={isLoading || isFetching}
          scroll={{ x: 650 }}
          pagination={{
            pageSize: isWeekly ? 26 : 12,
            showSizeChanger: true,
            pageSizeOptions: ["12", "26", "52", "104"],
          }}
          locale={{
            emptyText: (
              <Empty
                description={
                  isLoading || isFetching
                    ? "Loading installment schedule..."
                    : "No installments found for this DPS account."
                }
              />
            ),
          }}
        />
      ) : (
        <Table
          dataSource={transactions}
          columns={transactionColumns}
          rowKey="id"
          size="small"
          loading={isLoading || isFetching}
          scroll={{ x: 750 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
          }}
          locale={{
            emptyText: <Empty description="No transactions recorded for this DPS account yet." />,
          }}
        />
      )}

      <ReverseTransactionModal
        open={reverseModalOpen}
        onClose={() => {
          setReverseModalOpen(false);
          setSelectedTx(null);
        }}
        onConfirm={handleConfirmReverse}
        confirmLoading={reversing}
        title="Reverse DPS Deposit"
        transactionCode={selectedTx?.transactionId || (selectedTx ? `#${selectedTx.id}` : "")}
        amount={selectedTx ? formatCurrency(selectedTx.amount) : ""}
        detailsText={
          selectedTx
            ? `Reversing this deposit will adjust the total paid balance and restore installment status.`
            : ""
        }
      />
    </Modal>
  );
}
