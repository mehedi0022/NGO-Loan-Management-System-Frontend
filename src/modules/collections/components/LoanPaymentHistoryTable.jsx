import { Empty, Table, Typography } from "antd";

import {
  formatCurrency,
  formatDate,
  formatEnum,
} from "../../loans/loanFormatters.js";

export function LoanPaymentHistoryTable({
  payments = [],
  loading = false,
  showLoan = false,
  pagination,
  onPaginationChange,
}) {
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
      ? [{
          title: "Loan ID",
          dataIndex: ["loan", "loanId"],
          key: "loan",
          width: 140,
          render: (value, payment) => value || `Loan #${payment.loanId}`,
        }]
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
      width: 220,
      ellipsis: true,
      render: (value) => value || "—",
    },
  ];

  return (
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
      scroll={{ x: 1100 }}
      locale={{
        emptyText: <Empty description="No loan payments collected yet" />,
      }}
    />
  );
}
