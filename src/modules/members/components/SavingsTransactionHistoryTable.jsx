import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import { Button, Empty, Table, Tag, Tooltip, Typography, message } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useSelector } from "react-redux";

import { ReverseTransactionModal } from "../../../components/reverse-modal/ReverseTransactionModal.jsx";
import { formatCurrency, formatEnum } from "../../loans/loanFormatters.js";
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
      title: "Date & Time",
      dataIndex: "transactionDate",
      width: 140,
      render: (date, record) => {
        const timeSource = record.createdAt || date;
        return (
          <div>
            <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
              {dayjs(date || timeSource).format("DD MMM YYYY")}
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-xs">
              {dayjs(timeSource).format("hh:mm A")}
            </div>
          </div>
        );
      },
    },
    {
      title: "Savings Type",
      dataIndex: "savingsType",
      width: 110,
      render: (value) => (
        <Tag color={value === "GENERAL" ? "blue" : "purple"}>
          {value === "GENERAL" ? "General" : "Special"}
        </Tag>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      width: 110,
      render: (type) =>
        type === "DEPOSIT" ? (
          <Tag color="success" icon={<ArrowDownOutlined />}>
            Deposit
          </Tag>
        ) : (
          <Tag color="error" icon={<ArrowUpOutlined />}>
            Withdrawal
          </Tag>
        ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      align: "right",
      width: 120,
      render: (amt, record) => (
        <span
          className={`font-bold ${
            record.type === "DEPOSIT"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {record.type === "DEPOSIT" ? "+" : "-"}
          {formatCurrency(amt)}
        </span>
      ),
    },
    {
      title: "Balance Before",
      dataIndex: "balanceBefore",
      align: "right",
      width: 115,
      render: (bal) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {formatCurrency(bal)}
        </span>
      ),
    },
    {
      title: "Balance After",
      dataIndex: "balanceAfter",
      align: "right",
      width: 115,
      render: (bal) => (
        <span className="font-bold text-slate-900 dark:text-slate-100">
          {formatCurrency(bal)}
        </span>
      ),
    },
    {
      title: "Method",
      dataIndex: "paymentMethod",
      width: 90,
      render: (m) => <Tag>{formatEnum(m)}</Tag>,
    },
    {
      title: "Processed By",
      dataIndex: "processedBy",
      width: 130,
      ellipsis: true,
      render: (value) => (
        <span className="text-xs text-slate-700 dark:text-slate-300">
          {value?.fullName || value?.userName || "—"}
        </span>
      ),
    },
    {
      title: "Reference",
      dataIndex: "reference",
      width: 110,
      ellipsis: true,
      render: (value, record) => (
        <span className="text-xs text-slate-500 dark:text-slate-400" title={record.notes}>
          {value || record.notes || "—"}
        </span>
      ),
    },
    ...(isAdmin
      ? [
          {
            title: "Action",
            key: "action",
            align: "center",
            width: 95,
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
        scroll={{ x: "max-content" }}
        pagination={{
          current: pagination?.current ?? 1,
          pageSize: pagination?.pageSize ?? 20,
          total: pagination?.total ?? transactions.length,
          showSizeChanger: true,
          showTotal: (total) => `${total} transaction${total === 1 ? "" : "s"}`,
        }}
        onChange={(nextPagination) => onPaginationChange?.(nextPagination)}
        locale={{ emptyText: <Empty description="No savings transactions recorded yet" /> }}
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
