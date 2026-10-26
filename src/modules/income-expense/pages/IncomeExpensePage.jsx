import {
  AppstoreOutlined,
  ClearOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FilterOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  PrinterOutlined,
  SearchOutlined,
  TransactionOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";

import { PageContainer } from "../../../components/page-container/PageContainer.jsx";
import { formatCurrency, formatDate } from "../../loans/loanFormatters.js";
import { useGetActiveSomitiesQuery } from "../../somities/somitiesApi.js";
import { CategoryManagementModal } from "../components/CategoryManagementModal.jsx";
import { IncomeExpenseModal } from "../components/IncomeExpenseModal.jsx";
import { PrintableVoucherModal } from "../components/PrintableVoucherModal.jsx";
import {
  useDeleteIncomeExpenseMutation,
  useGetCategoriesQuery,
  useGetIncomeExpensesQuery,
} from "../incomeExpenseApi.js";

const typeOptions = [
  { value: "ALL", label: "All Types" },
  { value: "INCOME", label: "Income Only" },
  { value: "EXPENSE", label: "Expense Only" },
];

const paymentMethodOptions = [
  { value: "ALL", label: "All Methods" },
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "MOBILE_PAYMENT", label: "Mobile Payment" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

export function IncomeExpensePage() {
  const currentUser = useSelector((state) => state.auth.user);

  // Modal States
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [voucherModalType, setVoucherModalType] = useState("INCOME");
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState(null);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    dateRange: [dayjs().startOf("month"), dayjs()],
    type: "ALL",
    categoryId: "ALL",
    somitiId: "ALL",
    paymentMethod: "ALL",
    search: "",
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 15 });

  // Queries
  const { data: categoriesData } = useGetCategoriesQuery();
  const { data: somitiesData } = useGetActiveSomitiesQuery();

  const queryParams = useMemo(() => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
    };
    if (filters.dateRange?.[0]) {
      params.startDate = filters.dateRange[0].format("YYYY-MM-DD");
    }
    if (filters.dateRange?.[1]) {
      params.endDate = filters.dateRange[1].format("YYYY-MM-DD");
    }
    if (filters.type !== "ALL") params.type = filters.type;
    if (filters.categoryId !== "ALL") params.categoryId = filters.categoryId;
    if (filters.somitiId !== "ALL") params.somitiId = filters.somitiId;
    if (filters.paymentMethod !== "ALL")
      params.paymentMethod = filters.paymentMethod;
    if (filters.search.trim()) params.search = filters.search.trim();

    return params;
  }, [filters, pagination]);

  const { data: response, isLoading, isFetching } =
    useGetIncomeExpensesQuery(queryParams);

  const [deleteVoucher, { isLoading: isDeleting }] =
    useDeleteIncomeExpenseMutation();

  const summary = response?.summary ?? {};
  const records = response?.data ?? [];
  const meta = response?.meta ?? {};

  // Category select options
  const categoryOptions = useMemo(
    () => [
      { value: "ALL", label: "All Categories" },
      ...(categoriesData?.data ?? []).map((c) => ({
        value: c.id,
        label: `${c.name} (${c.type})`,
      })),
    ],
    [categoriesData],
  );

  const somitiOptions = useMemo(
    () => [
      { value: "ALL", label: "All Somities" },
      ...(somitiesData?.data ?? []).map((s) => ({
        value: s.id,
        label: `${s.name} (${s.code || s.somitiId})`,
      })),
    ],
    [somitiesData],
  );

  const handleResetFilters = () => {
    setFilters({
      dateRange: [dayjs().startOf("month"), dayjs()],
      type: "ALL",
      categoryId: "ALL",
      somitiId: "ALL",
      paymentMethod: "ALL",
      search: "",
    });
    setPagination({ page: 1, limit: 15 });
  };

  const handleOpenAdd = (type) => {
    setEditingVoucher(null);
    setVoucherModalType(type);
    setVoucherModalOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditingVoucher(record);
    setVoucherModalType(record.type);
    setVoucherModalOpen(true);
  };

  const handleOpenPrint = (record) => {
    setSelectedVoucherForPrint(record);
    setPrintModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteVoucher(id).unwrap();
      message.success("Voucher deleted successfully");
    } catch (err) {
      message.error(err?.data?.message || "Failed to delete voucher");
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!records || records.length === 0) return;

    const headers = [
      "Voucher No",
      "Date",
      "Type",
      "Category",
      "Amount",
      "Payment Method",
      "Reference",
      "Description",
      "Somiti",
      "Created By",
    ];

    const rows = records.map((r) => [
      `"${r.voucherNo || ""}"`,
      `"${formatDate(r.date)}"`,
      `"${r.type || ""}"`,
      `"${r.category?.name || ""}"`,
      r.amount ?? 0,
      `"${r.paymentMethod || ""}"`,
      `"${r.reference || ""}"`,
      `"${r.description || ""}"`,
      `"${r.somiti?.name || ""}"`,
      `"${r.createdBy?.fullName || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Income_Expense_${dayjs().format("YYYY-MM-DD_HHmm")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      title: "Voucher #",
      dataIndex: "voucherNo",
      key: "voucherNo",
      width: 170,
      render: (val, record) => (
        <Button
          type="link"
          style={{ padding: 0, fontWeight: 700 }}
          onClick={() => handleOpenPrint(record)}
        >
          {val}
        </Button>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 110,
      render: (val) => formatDate(val),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 95,
      render: (type) => (
        <Tag color={type === "INCOME" ? "green" : "volcano"}>
          {type === "INCOME" ? "+ Income" : "- Expense"}
        </Tag>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (cat) => <span style={{ fontWeight: 600 }}>{cat?.name || "—"}</span>,
    },
    {
      title: "Amount (Tk)",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (val, record) => (
        <span
          style={{
            fontWeight: 700,
            color: record.type === "INCOME" ? "#16a34a" : "#dc2626",
          }}
        >
          {record.type === "INCOME" ? "+" : "-"}
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      title: "Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      width: 120,
      render: (method) => <Tag color="blue">{method}</Tag>,
    },
    {
      title: "Reference / Memo",
      dataIndex: "reference",
      key: "reference",
      render: (val) => val || "—",
    },
    {
      title: "Somiti",
      dataIndex: "somiti",
      key: "somiti",
      render: (somiti) => somiti?.name || "General HQ",
    },
    {
      title: "Created By",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (user) => user?.fullName || "—",
    },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            type="text"
            icon={<PrinterOutlined />}
            title="Print Voucher"
            onClick={() => handleOpenPrint(record)}
          />
          <Button
            size="small"
            type="text"
            icon={<EditOutlined />}
            title="Edit Voucher"
            onClick={() => handleOpenEdit(record)}
          />
          <Popconfirm
            title="Delete Voucher"
            description="Are you sure you want to delete this voucher?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes, Delete"
            cancelText="Cancel"
          >
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              title="Delete Voucher"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const netBalance = summary.netBalance ?? 0;

  return (
    <PageContainer>
      {/* Page Title & Top Action Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <Typography.Title level={2} style={{ margin: 0 }}>
            Income & Expense
          </Typography.Title>
          <Typography.Text type="secondary">
            Manage operational income and expenses, print vouchers, and balance the cash book.
          </Typography.Text>
        </div>

        <Space wrap>
          <Button
            icon={<AppstoreOutlined />}
            onClick={() => setCategoriesModalOpen(true)}
          >
            Categories
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportCSV}
            disabled={records.length === 0}
          >
            Export CSV
          </Button>
          <Button
            style={{ backgroundColor: "#16a34a", color: "#fff", borderColor: "#16a34a" }}
            icon={<PlusCircleOutlined />}
            onClick={() => handleOpenAdd("INCOME")}
          >
            + Add Income
          </Button>
          <Button
            danger
            type="primary"
            icon={<MinusCircleOutlined />}
            onClick={() => handleOpenAdd("EXPENSE")}
          >
            + Add Expense
          </Button>
        </Space>
      </div>

      {/* KPI Cards Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6} lg={6}>
          <Card
            size="small"
            bordered={false}
            className="shadow-sm"
            style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
          >
            <Statistic
              title={<span style={{ color: "#166534" }}>Total Income</span>}
              value={summary.totalIncome ?? 0}
              precision={2}
              formatter={(v) => formatCurrency(v)}
              styles={{ content: { color: "#16a34a", fontWeight: 700, fontSize: 20 } }}
              prefix={<PlusCircleOutlined style={{ color: "#16a34a" }} />}
            />
            <div style={{ fontSize: 11, color: "#15803d", marginTop: 4 }}>
              {summary.incomeCount ?? 0} income vouchers
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={6}>
          <Card
            size="small"
            bordered={false}
            className="shadow-sm"
            style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
          >
            <Statistic
              title={<span style={{ color: "#991b1b" }}>Total Expenses</span>}
              value={summary.totalExpense ?? 0}
              precision={2}
              formatter={(v) => formatCurrency(v)}
              styles={{ content: { color: "#dc2626", fontWeight: 700, fontSize: 20 } }}
              prefix={<MinusCircleOutlined style={{ color: "#dc2626" }} />}
            />
            <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 4 }}>
              {summary.expenseCount ?? 0} expense vouchers
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={6} lg={6}>
          <Card
            size="small"
            bordered={false}
            className="shadow-sm"
            style={{
              background: netBalance >= 0 ? "#eff6ff" : "#fff1f2",
              border: `1px solid ${netBalance >= 0 ? "#bfdbfe" : "#fecdd3"}`,
            }}
          >
            <Statistic
              title={
                <span style={{ color: netBalance >= 0 ? "#1e40af" : "#9f1239" }}>
                  Net Cash Surplus / (Deficit)
                </span>
              }
              value={netBalance}
              precision={2}
              formatter={(v) => formatCurrency(v)}
              styles={{
                content: {
                  color: netBalance >= 0 ? "#2563eb" : "#e11d48",
                  fontWeight: 800,
                  fontSize: 20,
                },
              }}
              prefix={<TransactionOutlined style={{ color: netBalance >= 0 ? "#2563eb" : "#e11d48" }} />}
            />
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
              Income minus expenses
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={6}>
          <Card size="small" bordered={false} className="shadow-sm">
            <Statistic
              title="Total Transactions"
              value={summary.totalCount ?? 0}
              styles={{ content: { fontSize: 20, fontWeight: 700 } }}
            />
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
              Recorded in active filter
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filters Toolbar */}
      <Card size="small" bordered={false} className="shadow-sm" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <DatePicker.RangePicker
              value={filters.dateRange}
              onChange={(dates) => {
                setFilters((prev) => ({ ...prev, dateRange: dates }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              style={{ width: "100%" }}
            />
          </Col>

          <Col xs={12} sm={6} md={3}>
            <Select
              value={filters.type}
              onChange={(val) => {
                setFilters((prev) => ({ ...prev, type: val }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={typeOptions}
              style={{ width: "100%" }}
            />
          </Col>

          <Col xs={12} sm={6} md={4}>
            <Select
              value={filters.categoryId}
              onChange={(val) => {
                setFilters((prev) => ({ ...prev, categoryId: val }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={categoryOptions}
              style={{ width: "100%" }}
              placeholder="Filter by Category"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </Col>

          <Col xs={12} sm={6} md={4}>
            <Select
              value={filters.somitiId}
              onChange={(val) => {
                setFilters((prev) => ({ ...prev, somitiId: val }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={somitiOptions}
              style={{ width: "100%" }}
              placeholder="Filter by Somiti"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </Col>

          <Col xs={12} sm={6} md={3}>
            <Select
              value={filters.paymentMethod}
              onChange={(val) => {
                setFilters((prev) => ({ ...prev, paymentMethod: val }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={paymentMethodOptions}
              style={{ width: "100%" }}
            />
          </Col>

          <Col xs={24} sm={12} md={3}>
            <Input
              placeholder="Search voucher/memo..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, search: e.target.value }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              allowClear
            />
          </Col>

          <Col xs={12} sm={6} md={1}>
            <Button icon={<ClearOutlined />} onClick={handleResetFilters} title="Reset Filters" />
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card size="small" bordered={false} className="shadow-sm">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={records}
          loading={isLoading || isFetching || isDeleting}
          pagination={{
            current: meta.page ?? 1,
            pageSize: meta.limit ?? 15,
            total: meta.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: ["15", "30", "50", "100"],
            onChange: (page, limit) => setPagination({ page, limit }),
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} vouchers`,
          }}
          size="middle"
        />
      </Card>

      {/* Entry Modal */}
      <IncomeExpenseModal
        open={voucherModalOpen}
        onClose={() => setVoucherModalOpen(false)}
        initialType={voucherModalType}
        voucher={editingVoucher}
      />

      {/* Print Voucher Modal */}
      <PrintableVoucherModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        voucher={selectedVoucherForPrint}
      />

      {/* Category Management Modal */}
      <CategoryManagementModal
        open={categoriesModalOpen}
        onClose={() => setCategoriesModalOpen(false)}
      />
    </PageContainer>
  );
}
