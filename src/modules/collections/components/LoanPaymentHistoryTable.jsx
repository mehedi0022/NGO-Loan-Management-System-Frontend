import { RollbackOutlined } from "@ant-design/icons";
import { Button, Empty, Table, Tooltip, Typography, message } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";

import { ReverseTransactionModal } from "../../../components/reverse-modal/ReverseTransactionModal.jsx";
import {
  formatCurrency,
  formatDate,
  formatEnum,
} from "../../loans/loanFormatters.js";
import { useReverseLoanPaymentMutation } from "../collectionsApi.js";

export function LoanPaymentHistoryTable({
  payments = [],
  loading = false,
  showLoan = false,
  pagination,
  onPaginationChange,
}) {
  const currentUser = useSelector((state) => state.auth.user);
  const isAdmin =
    currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN";

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [reverseModalOpen, setReverseModalOpen] = useState(false);

  const [reverseLoanPayment, { isLoading: reversing }] =
    useReverseLoanPaymentMutation();

  const handleOpenReverse = (record) => {
    setSelectedPayment(record);
    setReverseModalOpen(true);
  };

  const handleConfirmReverse = async (reason) => {
    if (!selectedPayment) return;
    try {
      await reverseLoanPayment({
        paymentId: selectedPayment.id,
        reason,
      }).unwrap();
      message.success(
        `Loan payment ${selectedPayment.paymentId || `#${selectedPayment.id}`} reversed successfully.`,
      );
      setReverseModalOpen(false);
      setSelectedPayment(null);
    } catch (err) {
      message.error(
        err?.data?.message || "Failed to reverse loan payment. Please try again.",
      );
    }
  };

  const columns = [
    {
      title: "Payment ID",
      dataIndex: "paymentId",
      key: "paymentId",
      width: 150,
      render: (value, payment) => (
        <Typography.Text strong>{value || `#${payment.id}`}</Typography.Text>
      ),
    },
    ...(showLoan
      ? [
          {
            title: "Loan ID",
            dataIndex: ["loan", "loanId"],
            key: "loan",
            width: 140,
            render: (value, payment) => value || `Loan #${payment.loanId}`,
          },
        ]
      : []),
    {
      title: "Installment",
      dataIndex: ["installment", "installmentNo"],
      key: "installment",
      width: 120,
      align: "center",
      render: (value) => (value ? `#${value}` : "—"),
    },

    {
      title: "Payment Date",
      dataIndex: "paymentDate",
      key: "paymentDate",
      width: 150,
      render: (value) => (value ? formatDate(value) : "—"),
    },

    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 150,
      align: "right",
      render: (value) => (
        <Typography.Text strong>{formatCurrency(value || 0)}</Typography.Text>
      ),
    },

    {
      title: "Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      width: 150,
      render: (value) => (value ? formatEnum(value) : "—"),
    },

    {
      title: "Reference",
      dataIndex: "reference",
      key: "reference",
      width: 180,
      ellipsis: true,
      render: (value) => value || "—",
    },

    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      width: 200,
      ellipsis: true,
      render: (value) => value || "—",
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
              <Tooltip title="Reverse this loan payment">
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
        dataSource={payments}
        columns={columns}
        pagination={
          pagination
            ? {
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showTotal: (total) => `${total} payment${total === 1 ? "" : "s"}`,
              }
            : {
                pageSize: 10,
                hideOnSinglePage: true,
                showSizeChanger: false,
              }
        }
        onChange={(nextPagination) => onPaginationChange?.(nextPagination)}
        scroll={{ x: 1200 }}
        locale={{
          emptyText: <Empty description="No loan payments collected yet" />,
        }}
      />

      <ReverseTransactionModal
        open={reverseModalOpen}
        onClose={() => {
          setReverseModalOpen(false);
          setSelectedPayment(null);
        }}
        onConfirm={handleConfirmReverse}
        confirmLoading={reversing}
        title="Reverse Loan Payment"
        transactionCode={
          selectedPayment?.paymentId || (selectedPayment ? `#${selectedPayment.id}` : "")
        }
        amount={selectedPayment ? formatCurrency(selectedPayment.amount) : ""}
        detailsText={
          selectedPayment
            ? `Installment #${selectedPayment.installment?.installmentNo || "—"} will be restored.`
            : ""
        }
      />
    </>
  );
}
