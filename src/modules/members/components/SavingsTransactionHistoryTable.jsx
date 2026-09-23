import { Empty, Table, Typography } from "antd";

import { StatusTag } from "../../../components/status-tag/StatusTag.jsx";
import { formatCurrency, formatDate, formatEnum } from "../../loans/loanFormatters.js";

export function SavingsTransactionHistoryTable({
  transactions = [],
  loading = false,
  pagination,
  onPaginationChange,
}) {
  return (
    <Table
      rowKey="id"
      loading={loading}
      dataSource={transactions}
      scroll={{ x: 1200 }}
      pagination={{
        current: pagination?.current ?? 1,
        pageSize: pagination?.pageSize ?? 20,
        total: pagination?.total ?? transactions.length,
        showSizeChanger: true,
        showTotal: (total) => `${total} transaction${total === 1 ? "" : "s"}`,
      }}
      onChange={(nextPagination) => onPaginationChange?.(nextPagination)}
      locale={{ emptyText: <Empty description="No savings transactions yet" /> }}
      columns={[
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
      ]}
    />
  );
}
