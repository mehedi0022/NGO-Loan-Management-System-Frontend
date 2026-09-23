import { Empty, Table, Typography } from "antd";

import { formatCurrency, formatDate, formatEnum } from "../../loans/loanFormatters.js";

export function CollectionHistoryTable({
  collections = [],
  loading = false,
  pagination,
  onPaginationChange,
}) {
  return (
    <Table
      rowKey="id"
      loading={loading}
      dataSource={collections}
      scroll={{ x: 1350 }}
      pagination={{
        current: pagination?.current ?? 1,
        pageSize: pagination?.pageSize ?? 20,
        total: pagination?.total ?? collections.length,
        showSizeChanger: true,
        showTotal: (total) => `${total} collection${total === 1 ? "" : "s"}`,
      }}
      onChange={(nextPagination) => onPaginationChange?.(nextPagination)}
      locale={{ emptyText: <Empty description="No collection history yet" /> }}
      columns={[
        {
          title: "Collection ID",
          dataIndex: "collectionId",
          width: 160,
          render: (value, collection) => (
            <Typography.Text strong>{value || `#${collection.id}`}</Typography.Text>
          ),
        },
        { title: "Date", dataIndex: "collectionDate", width: 140, render: formatDate },
        { title: "Loan", dataIndex: "loanCollectionAmount", align: "right", width: 140, render: formatCurrency },
        { title: "General Savings", dataIndex: "generalSavingsAmount", align: "right", width: 160, render: formatCurrency },
        { title: "Special Savings", dataIndex: "specialSavingsAmount", align: "right", width: 160, render: formatCurrency },
        {
          title: "Total",
          dataIndex: "totalAmount",
          align: "right",
          width: 140,
          render: (value) => <Typography.Text strong>{formatCurrency(value)}</Typography.Text>,
        },
        { title: "Method", dataIndex: "paymentMethod", width: 150, render: formatEnum },
        {
          title: "Collected By",
          dataIndex: "collectedBy",
          width: 180,
          render: (collector) => collector?.fullName || collector?.userName || "—",
        },
        { title: "Reference", dataIndex: "reference", width: 180, ellipsis: true, render: (value) => value || "—" },
      ]}
    />
  );
}
