import { Empty, Table } from "antd";

import { formatCurrency, formatDate, formatEnum } from "../../loans/loanFormatters.js";

export function PaymentHistoryTable({ payments = [], loading = false }) {
  return (
    <Table
      rowKey="id"
      loading={loading}
      dataSource={payments}
      pagination={{ pageSize: 10, hideOnSinglePage: true }}
      scroll={{ x: 760 }}
      locale={{ emptyText: <Empty description="No payments collected yet" /> }}
      columns={[
        { title: "Payment ID", dataIndex: "paymentId" },
        { title: "Installment", dataIndex: ["installment", "installmentNo"], render: (value) => value ? `#${value}` : "—" },
        { title: "Payment Date", dataIndex: "paymentDate", render: formatDate },
        { title: "Amount", dataIndex: "amount", align: "right", render: formatCurrency },
        { title: "Method", dataIndex: "paymentMethod", render: formatEnum },
        { title: "Reference", dataIndex: "reference", render: (value) => value || "—" },
      ]}
    />
  );
}
