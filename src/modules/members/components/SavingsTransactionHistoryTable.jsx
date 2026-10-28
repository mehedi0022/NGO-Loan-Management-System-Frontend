import { RollbackOutlined } from "@ant-design/icons";
import { Button, Empty, Table, Tooltip, Typography, message } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";

import { ReverseTransactionModal } from "../../../components/reverse-modal/ReverseTransactionModal.jsx";
import { StatusTag } from "../../../components/status-tag/StatusTag.jsx";
import { formatCurrency, formatDate, formatEnum } from "../../loans/loanFormatters.js";
import { useReverseSavingsTransactionMutation } from "../../savings/savingsApi.js";

export function SavingsTransactionHistoryTable({
  transactions = [],
  loading = false,
  pagination,
  onPaginationChange,
}) {
  const currentUser = useSelector((state) => state.auth.user);
  const isAdmin =
    currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN";

  const [selectedTx, setSelectedTx] = useState(null);
  const [reverseModalOpen, setReverseModalOpen] = useState(false);

  const [reverseSavingsTx, { isLoading: reversing }] =
    useReverseSavingsTransactionMutation();

  const handleOpenReverse = (record) => {
    setSelectedTx(record);
    setReverseModalOpen(true);
  };

  const handleConfirmReverse = async (reason) => {
    if (!selectedTx) return;
    try {
      await reverseSavingsTx({
        transactionId: selectedTx.id,
        reason,
      }).unwrap();
      message.success(
        `Savings transaction ${selectedTx.transactionId || `#${selectedTx.id}`} reversed successfully.`,
      );
      setReverseModalOpen(false);
      setSelectedTx(null);
    } catch (err) {
      message.error(
        err?.data?.message || "Failed to reverse transaction. Please try again.",
      );
    }
  };

  const columns = [
    {
      title: "Transaction ID",
      dataIndex: "transactionId",
      width: 160,
      render: (value, transaction) => (
        <Typography.Text strong>{value || `#${transaction.id}`}</Typography.Text>
      ),
    },
    { title: "Date", dataIndex: "transactionDate", width: 140, render: formatDate },
    {
      title: "Savings Type",
      dataIndex: "savingsType",
      width: 140,
      render: (value) => <StatusTag status={value} label={formatEnum(value)} />,
    },
    { title: "Transaction Type", dataIndex: "type", width: 150, render: formatEnum },
    { title: "Amount", dataIndex: "amount", align: "right", width: 130, render: formatCurrency },
    { title: "Balance Before", dataIndex: "balanceBefore", align: "right", width: 150, render: formatCurrency },
    { title: "Balance After", dataIndex: "balanceAfter", align: "right", width: 150, render: formatCurrency },
    { title: "Method", dataIndex: "paymentMethod", width: 150, render: formatEnum },
    {
      title: "Processed By",
      dataIndex: "processedBy",
      width: 170,
      render: (value) => value?.fullName || value?.userName || "—",
    },
    { title: "Reference", dataIndex: "reference", width: 180, ellipsis: true, render: (value) => value || "—" },
    ...(isAdmin
      ? [
          {
            title: "Action",
            key: "action",
            align: "center",
            width: 100,
            fixed: "right",
            render: (_, record) => (
              <Tooltip title="Reverse this savings transaction">
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
    <>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={transactions}
        scroll={{ x: 1300 }}
        pagination={{
          current: pagination?.current ?? 1,
          pageSize: pagination?.pageSize ?? 20,
          total: pagination?.total ?? transactions.length,
          showSizeChanger: true,
          showTotal: (total) => `${total} transaction${total === 1 ? "" : "s"}`,
        }}
        onChange={(nextPagination) => onPaginationChange?.(nextPagination)}
        locale={{ emptyText: <Empty description="No savings transactions yet" /> }}
        columns={columns}
      />

      <ReverseTransactionModal
        open={reverseModalOpen}
        onClose={() => {
          setReverseModalOpen(false);
          setSelectedTx(null);
        }}
        onConfirm={handleConfirmReverse}
        confirmLoading={reversing}
        title="Reverse Savings Transaction"
        transactionCode={selectedTx?.transactionId || (selectedTx ? `#${selectedTx.id}` : "")}
        amount={selectedTx ? formatCurrency(selectedTx.amount) : ""}
        detailsText={
          selectedTx
            ? `${selectedTx.type} (${selectedTx.savingsType}) - Balance will be restored.`
            : ""
        }
      />
    </>
  );
}
