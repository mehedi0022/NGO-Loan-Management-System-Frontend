import { Button, Empty, Table } from "antd";

import { StatusTag } from "../../../components/status-tag/StatusTag.jsx";
import { InstallmentScheduleTable } from "../../collections/components/InstallmentScheduleTable.jsx";
import {
  formatCharge,
  formatCurrency,
  formatDate,
  formatEnum,
} from "../../loans/loanFormatters.js";

const loanTotals = (loan) => {
  const paid = (loan.installments ?? []).reduce(
    (total, installment) => total + Number(installment.paidAmount || 0),
    0,
  );
  return {
    paid,
    outstanding: Math.max(0, Number(loan.totalPayable || 0) - paid),
  };
};

export function MemberLoansTable({
  loans = [],
  loading = false,
  pagination,
  onPaginationChange,
  onViewLoan,
  onCreateLoan,
}) {
  const columns = [
    {
      title: "Loan ID",
      dataIndex: "loanId",
      width: 130,
      render: (value, loan) => (
        <Button type="link" className="p-0!" onClick={() => onViewLoan(loan)}>
          {value || `Loan #${loan.id}`}
        </Button>
      ),
    },
    { title: "Principal", dataIndex: "principalAmount", align: "right", render: formatCurrency },
    { title: "Charge", render: (_, loan) => formatCharge(loan) },
    { title: "Total Payable", dataIndex: "totalPayable", align: "right", render: formatCurrency },
    {
      title: "Paid",
      align: "right",
      render: (_, loan) => formatCurrency(loanTotals(loan).paid),
    },
    {
      title: "Outstanding",
      align: "right",
      render: (_, loan) =>
        ["ACTIVE", "COMPLETED"].includes(loan.status)
          ? formatCurrency(loanTotals(loan).outstanding)
          : "—",
    },
    { title: "Frequency", dataIndex: "frequency", render: formatEnum },
    { title: "Disbursed", dataIndex: "disbursementDate", render: formatDate },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => <StatusTag status={status} label={formatEnum(status)} />,
    },
    {
      title: "Action",
      fixed: "right",
      width: 100,
      render: (_, loan) => <Button size="small" onClick={() => onViewLoan(loan)}>View Loan</Button>,
    },
  ];

  return (
    <Table
      rowKey="id"
      loading={loading}
      dataSource={loans}
      columns={columns}
      scroll={{ x: 1250 }}
      pagination={{
        current: pagination?.current ?? 1,
        pageSize: pagination?.pageSize ?? 10,
        total: pagination?.total ?? loans.length,
        showSizeChanger: true,
        showTotal: (total) => `${total} loan${total === 1 ? "" : "s"}`,
      }}
      onChange={(nextPagination) => onPaginationChange?.(nextPagination)}
      expandable={{
        rowExpandable: (loan) =>
          ["ACTIVE", "COMPLETED"].includes(loan.status) &&
          Boolean(loan.installments?.length),
        expandedRowRender: (loan) => (
          <InstallmentScheduleTable installments={loan.installments} />
        ),
      }}
      locale={{
        emptyText: (
          <Empty description="No loans found for this member">
            <Button type="primary" onClick={onCreateLoan}>Create New Loan</Button>
          </Empty>
        ),
      }}
    />
  );
}
