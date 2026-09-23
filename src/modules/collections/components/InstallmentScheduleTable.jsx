import { Button, Empty, Table } from "antd";
import dayjs from "dayjs";

import { StatusTag } from "../../../components/status-tag/StatusTag.jsx";
import {
  formatCurrency,
  formatDate,
  formatEnum,
} from "../../loans/loanFormatters.js";

const getRemainingAmount = (installment) =>
  Math.max(
    0,
    Number(installment?.amount || 0) - Number(installment?.paidAmount || 0),
  );

const getDisplayStatus = (installment) => {
  if (!installment) return "PENDING";

  if (installment.status !== "PENDING") {
    return installment.status;
  }

  return dayjs(installment.dueDate)
    .startOf("day")
    .isBefore(dayjs().startOf("day"))
    ? "OVERDUE"
    : "UPCOMING";
};

const canCollectInstallment = (installment, loanStatus) => {
  if (loanStatus !== "ACTIVE") return false;

  if (!["PENDING", "PARTIAL"].includes(installment.status)) {
    return false;
  }

  return getRemainingAmount(installment) > 0;
};

export function InstallmentScheduleTable({
  installments = [],
  loanStatus,
  onCollect,
  loading = false,
}) {
  const columns = [
    {
      title: "Installment",
      dataIndex: "installmentNo",
      key: "installmentNo",
      width: 110,
      render: (number) => (number ? `#${number}` : "—"),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 140,
      render: (value) => (value ? formatDate(value) : "—"),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      width: 130,
      render: (value) => formatCurrency(value || 0),
    },
    {
      title: "Paid",
      dataIndex: "paidAmount",
      key: "paidAmount",
      align: "right",
      width: 130,
      render: (value) => formatCurrency(value || 0),
    },
    {
      title: "Remaining",
      key: "remaining",
      align: "right",
      width: 140,
      render: (_, installment) =>
        formatCurrency(getRemainingAmount(installment)),
    },
    {
      title: "Status",
      key: "status",
      width: 130,
      render: (_, installment) => {
        const status = getDisplayStatus(installment);

        return <StatusTag status={status} label={formatEnum(status)} />;
      },
    },
  ];

  if (loanStatus === "ACTIVE") {
    columns.push({
      title: "Action",
      key: "action",
      fixed: "right",
      width: 110,
      align: "center",
      render: (_, installment) => {
        if (!canCollectInstallment(installment, loanStatus)) {
          return null;
        }

        return (
          <Button
            type="primary"
            size="small"
            onClick={() => onCollect?.(installment)}
          >
            Collect
          </Button>
        );
      },
    });
  }

  return (
    <Table
      rowKey="id"
      loading={loading}
      dataSource={installments}
      columns={columns}
      pagination={false}
      scroll={{ x: 900 }}
      locale={{
        emptyText: <Empty description="No installment schedule available" />,
      }}
    />
  );
}
