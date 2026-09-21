import {
  EyeOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Dropdown,
  Input,
  Select,
  Table,
  Typography,
} from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageContainer } from "../../components/page-container/PageContainer.jsx";
import { StatusTag } from "../../components/status-tag/StatusTag.jsx";
import { useDebounce } from "../../hooks/useDebounce.js";
import {
  formatCharge,
  formatCurrency,
  formatDate,
  formatEnum,
} from "./loanFormatters.js";
import { useGetLoansQuery } from "./loansApi.js";

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

const frequencyOptions = [
  { value: "all", label: "All frequencies" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
];

export function LoansPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [status, setStatus] = useState("all");
  const [frequency, setFrequency] = useState("all");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [sorting, setSorting] = useState({
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetLoansQuery({
    page: pagination.current,
    limit: pagination.pageSize,
    search: debouncedSearch.trim() || undefined,
    status: status === "all" ? undefined : status,
    frequency: frequency === "all" ? undefined : frequency,
    sortBy: sorting.sortBy,
    sortOrder: sorting.sortOrder,
  });

  const loans = response?.data ?? [];
  const meta = response?.meta;
  const resetToFirstPage = () =>
    setPagination((previous) => ({ ...previous, current: 1 }));

  const handleTableChange = (tablePagination, _filters, sorter) => {
    setPagination({
      current: tablePagination.current,
      pageSize: tablePagination.pageSize,
    });
    setSorting(
      sorter?.field && sorter?.order
        ? {
            sortBy: sorter.field,
            sortOrder: sorter.order === "ascend" ? "asc" : "desc",
          }
        : { sortBy: "createdAt", sortOrder: "desc" },
    );
  };

  const sortable = (field) => ({
    sorter: true,
    sortOrder:
      sorting.sortBy === field
        ? sorting.sortOrder === "asc"
          ? "ascend"
          : "descend"
        : null,
  });

  const columns = [
    {
      title: "Loan ID",
      dataIndex: "loanId",
      key: "loanId",
      ...sortable("loanId"),
      render: (value) => value || "Pending ID",
    },
    {
      title: "Member",
      dataIndex: "member",
      key: "member",
      render: (member) => (
        <div className="loan-member-cell">
          <span>
            <b>{member?.fullName || "—"}</b>
            <small>{member?.memberId || "Pending ID"}</small>
          </span>
        </div>
      ),
    },
    {
      title: "Principal",
      dataIndex: "principalAmount",
      key: "principalAmount",
      align: "right",
      ...sortable("principalAmount"),
      render: formatCurrency,
    },
    { title: "Charge", key: "charge", render: (_, loan) => formatCharge(loan) },
    {
      title: "Total Payable",
      dataIndex: "totalPayable",
      key: "totalPayable",
      align: "right",
      ...sortable("totalPayable"),
      render: formatCurrency,
    },
    {
      title: "Installments",
      key: "installments",
      render: (_, loan) =>
        loan.regularInstallmentCount === 0 ? (
          <span>Single: {formatCurrency(loan.lastInstallmentAmount)}</span>
        ) : (
          <span>
            {formatCurrency(loan.installmentAmount)} ×{" "}
            {loan.regularInstallmentCount}
            <small>Last: {formatCurrency(loan.lastInstallmentAmount)}</small>
          </span>
        ),
    },
    {
      title: "Frequency",
      dataIndex: "frequency",
      key: "frequency",
      render: formatEnum,
    },
    {
      title: "Application Date",
      dataIndex: "applicationDate",
      key: "applicationDate",
      ...sortable("applicationDate"),
      render: formatDate,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) => <StatusTag status={value} label={formatEnum(value)} />,
    },
    {
      title: "Actions",
      key: "actions",
      width: 52,
      render: (_, loan) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                label: "View loan",
                icon: <EyeOutlined />,
                onClick: () => navigate(`/loans/${loan.id}`),
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            aria-label="Loan actions"
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <PageContainer>
      <div className="loans-page-heading">
        <div>
          <Typography.Title level={2}>All Loans</Typography.Title>
          <Typography.Text type="secondary">
            {meta?.total ?? 0} loans on record
          </Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/loans/new")}
        >
          Create Loan
        </Button>
      </div>
      <div className="loans-toolbar">
        <Input
          allowClear
          value={search}
          prefix={<SearchOutlined />}
          placeholder="Search by loan ID"
          onChange={(event) => {
            setSearch(event.target.value);
            resetToFirstPage();
          }}
        />
        <Select
          value={status}
          options={statusOptions}
          onChange={(value) => {
            setStatus(value);
            resetToFirstPage();
          }}
        />
        <Select
          value={frequency}
          options={frequencyOptions}
          onChange={(value) => {
            setFrequency(value);
            resetToFirstPage();
          }}
        />
      </div>
      {isError && (
        <Alert
          type="error"
          showIcon
          message="Failed to load loans"
          description={
            error?.data?.message || "Something went wrong while loading loans."
          }
          action={
            <Button size="small" onClick={refetch}>
              Retry
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}
      <div className="loans-table-card">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={loans}
          loading={isLoading || isFetching}
          scroll={{ x: 1200 }}
          pagination={{
            current: meta?.page ?? pagination.current,
            pageSize: meta?.limit ?? pagination.pageSize,
            total: meta?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} loans`,
          }}
          onChange={handleTableChange}
        />
      </div>
    </PageContainer>
  );
}
