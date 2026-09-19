import { Table } from "antd";

export function DataTable({
  columns,
  data = [],
  loading = false,
  pagination,
  onPaginationChange,
  onSortChange,
  rowActions,
  emptyState,
  ...tableProps
}) {
  const actionColumn = rowActions
    ? {
        title: "Actions",
        key: "actions",
        render: (_, record) => rowActions(record),
      }
    : null;

  return (
    <Table
      {...tableProps}
      columns={actionColumn ? [...columns, actionColumn] : columns}
      dataSource={data}
      loading={loading}
      locale={{ emptyText: emptyState }}
      pagination={pagination}
      onChange={(nextPagination, _filters, sorter) => {
        onPaginationChange?.(nextPagination);
        onSortChange?.(sorter);
      }}
    />
  );
}
