import {
  BankOutlined,
  CalendarOutlined,
  ClearOutlined,
  DollarOutlined,
  DownloadOutlined,
  FilterOutlined,
  FolderOpenOutlined,
  LineChartOutlined,
  PieChartOutlined,
  PrinterOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";

import { PageContainer } from "../../../components/page-container/PageContainer.jsx";
import { StatusTag } from "../../../components/status-tag/StatusTag.jsx";
import { formatCurrency, formatDate } from "../../loans/loanFormatters.js";
import { useGetActiveSomitiesQuery } from "../../somities/somitiesApi.js";
import { useGetUsersQuery } from "../../users/usersApi.js";
import { PrintableReportModal } from "../components/PrintableReportModal.jsx";
import {
  useGetDailyCollectionsReportQuery,
  useGetLoanPortfolioReportQuery,
  useGetOverdueReportQuery,
  useGetSavingsSummaryReportQuery,
  useGetDpsSummaryReportQuery,
} from "../reportsApi.js";

const paymentMethodOptions = [
  { value: "ALL", label: "All Payment Methods" },
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "MOBILE_PAYMENT", label: "Mobile Payment" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

const loanStatusOptions = [
  { value: "ALL", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "ACTIVE", label: "Active" },
  { value: "REJECTED", label: "Rejected" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DEFAULTED", label: "Defaulted" },
];

const savingsStatusOptions = [
  { value: "ALL", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "FROZEN", label: "Frozen" },
  { value: "CLOSED", label: "Closed" },
];

const dpsStatusOptions = [
  { value: "ALL", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "MATURED", label: "Matured" },
  { value: "CLOSED", label: "Closed" },
];

const overdueDaysOptions = [
  { value: 0, label: "All Overdue (1+ days)" },
  { value: 7, label: "7+ Days Overdue" },
  { value: 15, label: "15+ Days Overdue" },
  { value: 30, label: "30+ Days Overdue (1 Month+)" },
  { value: 60, label: "60+ Days Overdue (2 Months+)" },
  { value: 90, label: "90+ Days Overdue (3 Months+)" },
];

export function ReportsPage() {
  const currentUser = useSelector((state) => state.auth.user);
  const isFieldOfficer = currentUser?.role === "FIELD_OFFICER";

  const [activeTab, setActiveTab] = useState("daily-collections");
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Common Selectors Data
  const { data: somitiesData, isLoading: somitiesLoading } =
    useGetActiveSomitiesQuery();
  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery({
    limit: 100,
    status: "ACTIVE",
  });

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

  const officerOptions = useMemo(
    () => [
      { value: "ALL", label: "All Field Officers" },
      ...(usersData?.data ?? [])
        .filter(
          (u) =>
            u.role === "FIELD_OFFICER" ||
            u.role === "ADMIN" ||
            u.role === "SUPER_ADMIN" ||
            u.role === "MANAGER",
        )
        .map((u) => ({
          value: u.id,
          label: `${u.fullName} (${u.role.replace("_", " ")})`,
        })),
    ],
    [usersData],
  );

  // 1. Daily Collections State
  const [dailyFilters, setDailyFilters] = useState({
    dateRange: [dayjs().startOf("month"), dayjs()],
    somitiId: "ALL",
    fieldOfficerId: "ALL",
    paymentMethod: "ALL",
  });
  const [dailyPagination, setDailyPagination] = useState({ page: 1, limit: 10 });

  const dailyQueryParams = useMemo(() => {
    const params = {
      page: dailyPagination.page,
      limit: dailyPagination.limit,
    };
    if (dailyFilters.dateRange?.[0]) {
      params.startDate = dailyFilters.dateRange[0].format("YYYY-MM-DD");
    }
    if (dailyFilters.dateRange?.[1]) {
      params.endDate = dailyFilters.dateRange[1].format("YYYY-MM-DD");
    }
    if (dailyFilters.somitiId !== "ALL") params.somitiId = dailyFilters.somitiId;
    if (dailyFilters.fieldOfficerId !== "ALL")
      params.fieldOfficerId = dailyFilters.fieldOfficerId;
    if (dailyFilters.paymentMethod !== "ALL")
      params.paymentMethod = dailyFilters.paymentMethod;
    return params;
  }, [dailyFilters, dailyPagination]);

  const {
    data: dailyResponse,
    isLoading: dailyLoading,
    isFetching: dailyFetching,
  } = useGetDailyCollectionsReportQuery(dailyQueryParams);

  // 2. Loan Portfolio State
  const [portfolioFilters, setPortfolioFilters] = useState({
    dateRange: null,
    somitiId: "ALL",
    fieldOfficerId: "ALL",
    status: "ALL",
  });
  const [portfolioPagination, setPortfolioPagination] = useState({
    page: 1,
    limit: 10,
  });

  const portfolioQueryParams = useMemo(() => {
    const params = {
      page: portfolioPagination.page,
      limit: portfolioPagination.limit,
    };
    if (portfolioFilters.dateRange?.[0]) {
      params.startDate = portfolioFilters.dateRange[0].format("YYYY-MM-DD");
    }
    if (portfolioFilters.dateRange?.[1]) {
      params.endDate = portfolioFilters.dateRange[1].format("YYYY-MM-DD");
    }
    if (portfolioFilters.somitiId !== "ALL")
      params.somitiId = portfolioFilters.somitiId;
    if (portfolioFilters.fieldOfficerId !== "ALL")
      params.fieldOfficerId = portfolioFilters.fieldOfficerId;
    if (portfolioFilters.status !== "ALL") params.status = portfolioFilters.status;
    return params;
  }, [portfolioFilters, portfolioPagination]);

  const {
    data: portfolioResponse,
    isLoading: portfolioLoading,
    isFetching: portfolioFetching,
  } = useGetLoanPortfolioReportQuery(portfolioQueryParams);

  // 3. Overdue Report State
  const [overdueFilters, setOverdueFilters] = useState({
    asOfDate: dayjs(),
    somitiId: "ALL",
    fieldOfficerId: "ALL",
    minDaysOverdue: 0,
  });
  const [overduePagination, setOverduePagination] = useState({
    page: 1,
    limit: 10,
  });

  const overdueQueryParams = useMemo(() => {
    const params = {
      page: overduePagination.page,
      limit: overduePagination.limit,
      asOfDate: overdueFilters.asOfDate?.format("YYYY-MM-DD"),
    };
    if (overdueFilters.somitiId !== "ALL")
      params.somitiId = overdueFilters.somitiId;
    if (overdueFilters.fieldOfficerId !== "ALL")
      params.fieldOfficerId = overdueFilters.fieldOfficerId;
    if (overdueFilters.minDaysOverdue > 0)
      params.minDaysOverdue = overdueFilters.minDaysOverdue;
    return params;
  }, [overdueFilters, overduePagination]);

  const {
    data: overdueResponse,
    isLoading: overdueLoading,
    isFetching: overdueFetching,
  } = useGetOverdueReportQuery(overdueQueryParams);

  // 4. Savings Summary State
  const [savingsFilters, setSavingsFilters] = useState({
    somitiId: "ALL",
    fieldOfficerId: "ALL",
    status: "ALL",
  });
  const [savingsPagination, setSavingsPagination] = useState({
    page: 1,
    limit: 10,
  });

  const savingsQueryParams = useMemo(() => {
    const params = {
      page: savingsPagination.page,
      limit: savingsPagination.limit,
    };
    if (savingsFilters.somitiId !== "ALL")
      params.somitiId = savingsFilters.somitiId;
    if (savingsFilters.fieldOfficerId !== "ALL")
      params.fieldOfficerId = savingsFilters.fieldOfficerId;
    if (savingsFilters.status !== "ALL") params.status = savingsFilters.status;
    return params;
  }, [savingsFilters, savingsPagination]);

  const {
    data: savingsResponse,
    isLoading: savingsLoading,
    isFetching: savingsFetching,
  } = useGetSavingsSummaryReportQuery(savingsQueryParams);

  // 5. DPS Summary State
  const [dpsFilters, setDpsFilters] = useState({
    somitiId: "ALL",
    fieldOfficerId: "ALL",
    status: "ALL",
  });
  const [dpsPagination, setDpsPagination] = useState({
    page: 1,
    limit: 10,
  });

  const dpsQueryParams = useMemo(() => {
    const params = {
      page: dpsPagination.page,
      limit: dpsPagination.limit,
    };
    if (dpsFilters.somitiId !== "ALL") params.somitiId = dpsFilters.somitiId;
    if (dpsFilters.fieldOfficerId !== "ALL")
      params.fieldOfficerId = dpsFilters.fieldOfficerId;
    if (dpsFilters.status !== "ALL") params.status = dpsFilters.status;
    return params;
  }, [dpsFilters, dpsPagination]);

  const {
    data: dpsResponse,
    isLoading: dpsLoading,
    isFetching: dpsFetching,
  } = useGetDpsSummaryReportQuery(dpsQueryParams);

  // Active Report Dataset for Printing and Exporting
  const activeReportConfig = useMemo(() => {
    switch (activeTab) {
      case "daily-collections": {
        const somitiName =
          somitiOptions.find((s) => s.value === dailyFilters.somitiId)?.label ||
          "All Somities";
        const dateStr = dailyFilters.dateRange
          ? `${dailyFilters.dateRange[0].format("DD MMM YYYY")} to ${dailyFilters.dateRange[1].format("DD MMM YYYY")}`
          : "All Time";
        return {
          type: "daily-collections",
          title: "Daily Collections Report",
          subtitle: `Date: ${dateStr} | Somiti: ${somitiName} | Method: ${dailyFilters.paymentMethod}`,
          data: dailyResponse?.data ?? [],
          summary: dailyResponse?.summary ?? {},
        };
      }
      case "loan-portfolio": {
        const somitiName =
          somitiOptions.find((s) => s.value === portfolioFilters.somitiId)?.label ||
          "All Somities";
        return {
          type: "loan-portfolio",
          title: "Loan Portfolio Report",
          subtitle: `Status: ${portfolioFilters.status} | Somiti: ${somitiName}`,
          data: portfolioResponse?.data ?? [],
          summary: portfolioResponse?.summary ?? {},
        };
      }
      case "overdue": {
        const somitiName =
          somitiOptions.find((s) => s.value === overdueFilters.somitiId)?.label ||
          "All Somities";
        return {
          type: "overdue",
          title: "Overdue Installments Report",
          subtitle: `As of: ${overdueFilters.asOfDate?.format("DD MMM YYYY")} | Somiti: ${somitiName} | Min Overdue: ${overdueFilters.minDaysOverdue} days`,
          data: overdueResponse?.data ?? [],
          summary: overdueResponse?.summary ?? {},
        };
      }
      case "savings-summary": {
        const somitiName =
          somitiOptions.find((s) => s.value === savingsFilters.somitiId)?.label ||
          "All Somities";
        return {
          type: "savings-summary",
          title: "Savings Summary Report",
          subtitle: `Status: ${savingsFilters.status} | Somiti: ${somitiName}`,
          data: savingsResponse?.data ?? [],
          summary: savingsResponse?.summary ?? {},
        };
      }
      case "dps-summary": {
        const somitiName =
          somitiOptions.find((s) => s.value === dpsFilters.somitiId)?.label ||
          "All Somities";
        return {
          type: "dps-summary",
          title: "DPS Summary Report",
          subtitle: `Status: ${dpsFilters.status} | Somiti: ${somitiName}`,
          data: dpsResponse?.data ?? [],
          summary: dpsResponse?.summary ?? {},
        };
      }
      default:
        return { type: "", title: "", subtitle: "", data: [], summary: {} };
    }
  }, [
    activeTab,
    dailyFilters,
    portfolioFilters,
    overdueFilters,
    savingsFilters,
    dpsFilters,
    somitiOptions,
    dailyResponse,
    portfolioResponse,
    overdueResponse,
    savingsResponse,
    dpsResponse,
  ]);

  // Client-side CSV Exporter
  const handleExportCSV = () => {
    const { title, data, type } = activeReportConfig;
    if (!data || data.length === 0) return;

    let headers = [];
    let rows = [];

    if (type === "daily-collections") {
      headers = [
        "Receipt No",
        "Collection Date",
        "Member ID",
        "Member Name",
        "Somiti",
        "Payment Method",
        "Loan Collection",
        "General Savings",
        "Special Savings",
        "DPS Installment",
        "Total Amount",
        "Collected By",
      ];
      rows = data.map((r) => [
        `"${r.receiptNumber || ""}"`,
        `"${formatDate(r.collectionDate)}"`,
        `"${r.member?.memberId || ""}"`,
        `"${r.member?.fullName || ""}"`,
        `"${r.somiti?.name || ""}"`,
        `"${r.paymentMethod || ""}"`,
        r.loanCollectionAmount ?? 0,
        r.generalSavingsAmount ?? 0,
        r.specialSavingsAmount ?? 0,
        r.dpsAmount ?? 0,
        r.totalAmount ?? 0,
        `"${r.collectedBy?.fullName || ""}"`,
      ]);
    } else if (type === "dps-summary") {
      headers = [
        "DPS Number",
        "Member ID",
        "Member Name",
        "Somiti",
        "Monthly Deposit",
        "Duration (Months)",
        "Interest Rate (%)",
        "Paid Installments",
        "Total Paid Amount",
        "Maturity Amount",
        "Maturity Date",
        "Status",
      ];
      rows = data.map((r) => [
        `"${r.dpsNumber || ""}"`,
        `"${r.member?.memberId || ""}"`,
        `"${r.member?.fullName || ""}"`,
        `"${r.somiti?.name || ""}"`,
        r.installmentAmount ?? 0,
        r.durationMonths ?? 0,
        r.interestRate ?? 0,
        r.paidInstallments ?? 0,
        r.totalPaidAmount ?? 0,
        r.maturityAmount ?? 0,
        `"${formatDate(r.maturityDate)}"`,
        `"${r.status || ""}"`,
      ]);
    } else if (type === "loan-portfolio") {
      headers = [
        "Loan ID",
        "Member ID",
        "Member Name",
        "Somiti",
        "Disbursement Date",
        "Principal Amount",
        "Total Payable",
        "Paid Amount",
        "Outstanding Amount",
        "Status",
      ];
      rows = data.map((r) => [
        `"${r.loanId || ""}"`,
        `"${r.member?.memberId || ""}"`,
        `"${r.member?.fullName || ""}"`,
        `"${r.somiti?.name || ""}"`,
        `"${formatDate(r.disbursementDate || r.createdAt)}"`,
        r.principalAmount ?? 0,
        r.totalPayable ?? 0,
        r.paidAmount ?? 0,
        r.outstandingAmount ?? 0,
        `"${r.status || ""}"`,
      ]);
    } else if (type === "overdue") {
      headers = [
        "Installment No",
        "Loan ID",
        "Member ID",
        "Member Name",
        "Mobile Number",
        "Somiti",
        "Officer",
        "Due Date",
        "Days Overdue",
        "Installment Amount",
        "Paid Amount",
        "Overdue Remaining",
      ];
      rows = data.map((r) => [
        r.installmentNo,
        `"${r.loan?.loanId || ""}"`,
        `"${r.member?.memberId || ""}"`,
        `"${r.member?.fullName || ""}"`,
        `"${r.member?.mobileNumber || ""}"`,
        `"${r.somiti?.name || ""}"`,
        `"${r.somiti?.fieldOfficer?.fullName || ""}"`,
        `"${formatDate(r.dueDate)}"`,
        r.daysOverdue,
        r.amount ?? 0,
        r.paidAmount ?? 0,
        r.remainingDue ?? 0,
      ]);
    } else if (type === "savings-summary") {
      headers = [
        "Account ID",
        "Member ID",
        "Member Name",
        "Mobile Number",
        "Somiti",
        "General Savings Balance",
        "Special Savings Balance",
        "Total Savings Balance",
        "Status",
      ];
      rows = data.map((r) => [
        `"${r.accountId || ""}"`,
        `"${r.member?.memberId || ""}"`,
        `"${r.member?.fullName || ""}"`,
        `"${r.member?.mobileNumber || ""}"`,
        `"${r.somiti?.name || ""}"`,
        r.generalSavingsBalance ?? 0,
        r.specialSavingsBalance ?? 0,
        r.totalBalance ?? 0,
        `"${r.status || ""}"`,
      ]);
    }

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${type}_${dayjs().format("YYYY-MM-DD_HHmm")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            Reports & Analytics
          </Typography.Title>
          <Typography.Text type="secondary">
            Operational collections, loan portfolios, overdue recovery, and savings summary.
          </Typography.Text>
        </div>

        <Space wrap>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportCSV}
            disabled={activeReportConfig.data.length === 0}
          >
            Export CSV
          </Button>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => setPrintModalOpen(true)}
          >
            Print Report / PDF
          </Button>
        </Space>
      </div>

      {/* Main Tabs Container */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        size="large"
        items={[
          {
            key: "daily-collections",
            label: (
              <span>
                <DollarOutlined /> Daily Collections
              </span>
            ),
            children: (
              <DailyCollectionsTab
                filters={dailyFilters}
                setFilters={setDailyFilters}
                pagination={dailyPagination}
                setPagination={setDailyPagination}
                response={dailyResponse}
                isLoading={dailyLoading}
                isFetching={dailyFetching}
                somitiOptions={somitiOptions}
                officerOptions={officerOptions}
                isFieldOfficer={isFieldOfficer}
              />
            ),
          },
          {
            key: "loan-portfolio",
            label: (
              <span>
                <PieChartOutlined /> Loan Portfolio
              </span>
            ),
            children: (
              <LoanPortfolioTab
                filters={portfolioFilters}
                setFilters={setPortfolioFilters}
                pagination={portfolioPagination}
                setPagination={setPortfolioPagination}
                response={portfolioResponse}
                isLoading={portfolioLoading}
                isFetching={portfolioFetching}
                somitiOptions={somitiOptions}
                officerOptions={officerOptions}
                isFieldOfficer={isFieldOfficer}
              />
            ),
          },
          {
            key: "overdue",
            label: (
              <span>
                <WarningOutlined /> Overdue Installments
              </span>
            ),
            children: (
              <OverdueTab
                filters={overdueFilters}
                setFilters={setOverdueFilters}
                pagination={overduePagination}
                setPagination={setOverduePagination}
                response={overdueResponse}
                isLoading={overdueLoading}
                isFetching={overdueFetching}
                somitiOptions={somitiOptions}
                officerOptions={officerOptions}
                isFieldOfficer={isFieldOfficer}
              />
            ),
          },
          {
            key: "savings-summary",
            label: (
              <span>
                <BankOutlined /> Savings Summary
              </span>
            ),
            children: (
              <SavingsSummaryTab
                filters={savingsFilters}
                setFilters={setSavingsFilters}
                pagination={savingsPagination}
                setPagination={setSavingsPagination}
                response={savingsResponse}
                isLoading={savingsLoading}
                isFetching={savingsFetching}
                somitiOptions={somitiOptions}
                officerOptions={officerOptions}
                isFieldOfficer={isFieldOfficer}
              />
            ),
          },
          {
            key: "dps-summary",
            label: (
              <span>
                <SafetyCertificateOutlined /> DPS Summary
              </span>
            ),
            children: (
              <DpsSummaryTab
                filters={dpsFilters}
                setFilters={setDpsFilters}
                pagination={dpsPagination}
                setPagination={setDpsPagination}
                response={dpsResponse}
                isLoading={dpsLoading}
                isFetching={dpsFetching}
                somitiOptions={somitiOptions}
                officerOptions={officerOptions}
                isFieldOfficer={isFieldOfficer}
              />
            ),
          },
        ]}
      />

      {/* Printable Report Modal */}
      <PrintableReportModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        reportType={activeReportConfig.type}
        title={activeReportConfig.title}
        subtitle={activeReportConfig.subtitle}
        data={activeReportConfig.data}
        summary={activeReportConfig.summary}
        currentUser={currentUser}
      />
    </PageContainer>
  );
}

// ----------------------------------------------------------------------------------
// 1. Daily Collections Tab Component
// ----------------------------------------------------------------------------------
function DailyCollectionsTab({
  filters,
  setFilters,
  pagination,
  setPagination,
  response,
  isLoading,
  isFetching,
  somitiOptions,
  officerOptions,
  isFieldOfficer,
}) {
  const summary = response?.summary ?? {};
  const records = response?.data ?? [];
  const meta = response?.meta ?? {};

  const handleReset = () => {
    setFilters({
      dateRange: [dayjs().startOf("month"), dayjs()],
      somitiId: "ALL",
      fieldOfficerId: "ALL",
      paymentMethod: "ALL",
    });
    setPagination({ page: 1, limit: 10 });
  };

  const columns = [
    {
      title: "Receipt #",
      dataIndex: "receiptNumber",
      key: "receiptNumber",
      width: 130,
      render: (val) => <span style={{ fontWeight: 600 }}>{val}</span>,
    },
    {
      title: "Date",
      dataIndex: "collectionDate",
      key: "collectionDate",
      width: 110,
      render: (val) => formatDate(val),
    },
    {
      title: "Member",
      dataIndex: "member",
      key: "member",
      render: (member) => (
        <div>
          <div style={{ fontWeight: 600 }}>{member?.fullName || "—"}</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>
            {member?.memberId || `ID: ${member?.id}`}
          </div>
        </div>
      ),
    },
    {
      title: "Somiti",
      dataIndex: "somiti",
      key: "somiti",
      render: (somiti) => somiti?.name || "—",
    },
    {
      title: "Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (method) => <Tag color="blue">{method}</Tag>,
    },
    {
      title: "Loan (Tk)",
      dataIndex: "loanCollectionAmount",
      key: "loanCollectionAmount",
      align: "right",
      render: (val) => formatCurrency(val),
    },
    {
      title: "Gen Sav (Tk)",
      dataIndex: "generalSavingsAmount",
      key: "generalSavingsAmount",
      align: "right",
      render: (val) => formatCurrency(val),
    },
    {
      title: "Spc Sav (Tk)",
      dataIndex: "specialSavingsAmount",
      key: "specialSavingsAmount",
      align: "right",
      render: (val) => formatCurrency(val),
    },
    {
      title: "DPS (Tk)",
      dataIndex: "dpsAmount",
      key: "dpsAmount",
      align: "right",
      render: (val) => formatCurrency(val),
    },
    {
      title: "Total (Tk)",
      dataIndex: "totalAmount",
      key: "totalAmount",
      align: "right",
      render: (val) => (
        <span style={{ fontWeight: 700, color: "#047857" }}>
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      title: "Collected By",
      dataIndex: "collectedBy",
      key: "collectedBy",
      render: (user) => user?.fullName || "—",
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small" bordered={false} className="shadow-sm">
            <Statistic
              title="Collections Count"
              value={summary.totalTransactions ?? 0}
              prefix={<DollarOutlined style={{ color: "#3b82f6" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small" bordered={false} className="shadow-sm">
            <Statistic
              title="Loan Return Recv"
              value={summary.totalLoanAmount ?? 0}
              precision={2}
              formatter={(v) => formatCurrency(v)}
              styles={{ content: { color: "#2563eb", fontSize: 18 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small" bordered={false} className="shadow-sm">
            <Statistic
              title="General Savings"
              value={summary.totalGeneralSavingsAmount ?? 0}
              precision={2}
              formatter={(v) => formatCurrency(v)}
              styles={{ content: { color: "#0891b2", fontSize: 18 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small" bordered={false} className="shadow-sm">
            <Statistic
              title="Special Savings"
              value={summary.totalSpecialSavingsAmount ?? 0}
              precision={2}
              formatter={(v) => formatCurrency(v)}
              styles={{ content: { color: "#7c3aed", fontSize: 18 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small" bordered={false} className="shadow-sm">
            <Statistic
              title="DPS Collected"
              value={summary.totalDpsAmount ?? 0}
              precision={2}
              formatter={(v) => formatCurrency(v)}
              styles={{ content: { color: "#059669", fontSize: 18 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} lg={4}>
          <Card
            size="small"
            bordered={false}
            className="shadow-sm"
            style={{ background: "#ecfdf5", border: "1px solid #a7f3d0" }}
          >
            <Statistic
              title={<span style={{ color: "#065f46" }}>Grand Total Collected</span>}
              value={summary.totalCollectedAmount ?? 0}
              precision={2}
              formatter={(v) => formatCurrency(v)}
              styles={{ content: { color: "#047857", fontWeight: 700, fontSize: 18 } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters Toolbar */}
      <Card size="small" bordered={false} className="shadow-sm">
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
          <Col xs={12} sm={6} md={5}>
            <Select
              value={filters.somitiId}
              onChange={(val) => {
                setFilters((prev) => ({ ...prev, somitiId: val }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={somitiOptions}
              style={{ width: "100%" }}
              placeholder="Filter by Somiti"
            />
          </Col>
          {!isFieldOfficer && (
            <Col xs={12} sm={6} md={5}>
              <Select
                value={filters.fieldOfficerId}
                onChange={(val) => {
                  setFilters((prev) => ({ ...prev, fieldOfficerId: val }));
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                options={officerOptions}
                style={{ width: "100%" }}
                placeholder="Filter by Officer"
              />
            </Col>
          )}
          <Col xs={12} sm={6} md={4}>
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
          <Col xs={12} sm={6} md={4}>
            <Button icon={<ClearOutlined />} onClick={handleReset} block>
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card size="small" bordered={false} className="shadow-sm">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={records}
          loading={isLoading || isFetching}
          pagination={{
            current: meta.page ?? 1,
            pageSize: meta.limit ?? 10,
            total: meta.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            onChange: (page, limit) => setPagination({ page, limit }),
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} collections`,
          }}
          size="middle"
        />
      </Card>
    </Space>
  );
}

// ----------------------------------------------------------------------------------
// 2. Loan Portfolio Tab Component
// ----------------------------------------------------------------------------------
function LoanPortfolioTab({
  filters,
  setFilters,
  pagination,
  setPagination,
  response,
  isLoading,
  isFetching,
  somitiOptions,
  officerOptions,
  isFieldOfficer,
}) {
  const summary = response?.summary ?? {};
  const records = response?.data ?? [];
  const meta = response?.meta ?? {};

  const handleReset = () => {
    setFilters({
      dateRange: null,
      somitiId: "ALL",
      fieldOfficerId: "ALL",
      status: "ALL",
    });
    setPagination({ page: 1, limit: 10 });
  };

  const columns = [
    {
      title: "Loan ID",
      dataIndex: "loanId",
      key: "loanId",
      width: 130,
      render: (val) => <span style={{ fontWeight: 600 }}>{val}</span>,
    },
    {
      title: "Member",
      dataIndex: "member",
      key: "member",
      render: (member) => (
        <div>
          <div style={{ fontWeight: 600 }}>{member?.fullName || "—"}</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>
            {member?.memberId || `ID: ${member?.id}`}
          </div>
        </div>
      ),
    },
    {
      title: "Somiti",
      dataIndex: "somiti",
      key: "somiti",
      render: (somiti) => somiti?.name || "—",
    },
    {
      title: "Disbursed",
      dataIndex: "disbursementDate",
      key: "disbursementDate",
      width: 110,
      render: (val, record) => formatDate(val || record.createdAt),
    },
    {
      title: "Principal (Tk)",
      dataIndex: "principalAmount",
      key: "principalAmount",
      align: "right",
      render: (val) => formatCurrency(val),
    },
    {
      title: "Total Payable (Tk)",
      dataIndex: "totalPayable",
      key: "totalPayable",
      align: "right",
      render: (val) => formatCurrency(val),
    },
    {
      title: "Recovered (Tk)",
      dataIndex: "paidAmount",
      key: "paidAmount",
      align: "right",
      render: (val) => (
        <span style={{ color: "#047857" }}>{formatCurrency(val)}</span>
      ),
    },
    {
      title: "Outstanding (Tk)",
      dataIndex: "outstandingAmount",
      key: "outstandingAmount",
      align: "right",
      render: (val) => (
        <span style={{ fontWeight: 700, color: "#dc2626" }}>
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <StatusTag status={status} />,
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small" bordered={false} className="shadow-sm">
            <Statistic
              title="Total Loans"
              value={summary.totalLoans ?? 0}
              prefix={<LineChartOutlined style={{ color: "#3b82f6" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={5}>
          <Card size="small" bordered={false} className="shadow-sm">
            <Statistic
              title="Disbursed Principal"
              value={summary.totalPrincipalDisbursed ?? 0}
              precision={2}
              formatter={(v) => formatCurrency(v)}
              styles={{ content: { color: "#2563eb", fontSize: 18 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={5}>
          <Card size="small" bordered={false} className="shadow-sm">
            <Statistic
              title="Total Payable"
              value={summary.totalPayable ?? 0}
              precision={2}
              formatter={(v) => formatCurrency(v)}
              styles={{ content: { color: "#0f172a", fontSize: 18 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={5}>
          <Card size="small" bordered={false} className="shadow-sm">
            <Statistic
              title="Total Recovered"
              value={summary.totalRecovered ?? 0}
              precision={2}
              formatter={(v) => formatCurrency(v)}
              styles={{ content: { color: "#047857", fontSize: 18 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} lg={5}>
          <Card
            size="small"
            bordered={false}
            className="shadow-sm"
            style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
          >
            <Statistic
              title={<span style={{ color: "#991b1b" }}>Outstanding Portfolio</span>}
              value={summary.totalOutstanding ?? 0}
              precision={2}
              formatter={(v) => formatCurrency(v)}
              styles={{ content: { color: "#dc2626", fontWeight: 700, fontSize: 18 } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters Toolbar */}
      <Card size="small" bordered={false} className="shadow-sm">
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <DatePicker.RangePicker
              value={filters.dateRange}
              onChange={(dates) => {
                setFilters((prev) => ({ ...prev, dateRange: dates }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              placeholder={["Disbursement Start", "Disbursement End"]}
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={12} sm={6} md={5}>
            <Select
              value={filters.somitiId}
              onChange={(val) => {
                setFilters((prev) => ({ ...prev, somitiId: val }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={somitiOptions}
              style={{ width: "100%" }}
              placeholder="Filter by Somiti"
            />
          </Col>
          {!isFieldOfficer && (
            <Col xs={12} sm={6} md={5}>
              <Select
                value={filters.fieldOfficerId}
                onChange={(val) => {
                  setFilters((prev) => ({ ...prev, fieldOfficerId: val }));
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                options={officerOptions}
                style={{ width: "100%" }}
                placeholder="Filter by Officer"
              />
            </Col>
          )}
          <Col xs={12} sm={6} md={4}>
            <Select
              value={filters.status}
              onChange={(val) => {
                setFilters((prev) => ({ ...prev, status: val }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={loanStatusOptions}
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Button icon={<ClearOutlined />} onClick={handleReset} block>
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card size="small" bordered={false} className="shadow-sm">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={records}
          loading={isLoading || isFetching}
          pagination={{
            current: meta.page ?? 1,
            pageSize: meta.limit ?? 10,
            total: meta.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            onChange: (page, limit) => setPagination({ page, limit }),
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} loans`,
          }}
          size="middle"
        />
      </Card>
    </Space>
  );
}

// ----------------------------------------------------------------------------------
// 3. Overdue Installments Tab Component
// ----------------------------------------------------------------------------------
function OverdueTab({
  filters,
  setFilters,
  pagination,
  setPagination,
  response,
  isLoading,
  isFetching,
  somitiOptions,
  officerOptions,
  isFieldOfficer,
}) {
  const summary = response?.summary ?? {};
  const records = response?.data ?? [];
  const meta = response?.meta ?? {};

  const handleReset = () => {
    setFilters({
      asOfDate: dayjs(),
      somitiId: "ALL",
      fieldOfficerId: "ALL",
      minDaysOverdue: 0,
    });
    setPagination({ page: 1, limit: 10 });
  };

  const columns = [
    {
      title: "Inst #",
      dataIndex: "installmentNo",
      key: "installmentNo",
      width: 70,
      render: (val) => <strong>#{val}</strong>,
    },
    {
      title: "Loan ID",
      dataIndex: "loan",
      key: "loan",
      width: 120,
      render: (loan) => loan?.loanId || "—",
    },
    {
      title: "Borrower",
      dataIndex: "member",
      key: "member",
      render: (member) => (
        <div>
          <div style={{ fontWeight: 600 }}>{member?.fullName || "—"}</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>
            {member?.mobileNumber || member?.memberId}
          </div>
        </div>
      ),
    },
    {
      title: "Somiti",
      dataIndex: "somiti",
      key: "somiti",
      render: (somiti) => somiti?.name || "—",
    },
    {
      title: "Officer",
      dataIndex: "somiti",
      key: "officer",
      render: (somiti) => somiti?.fieldOfficer?.fullName || "—",
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 110,
      render: (val) => formatDate(val),
    },
    {
      title: "Overdue Days",
      dataIndex: "daysOverdue",
      key: "daysOverdue",
      align: "center",
      render: (val) => {
        let color = "orange";
        if (val > 30) color = "red";
        else if (val > 14) color = "volcano";
        return <Tag color={color}>{val} days</Tag>;
      },
    },
    {
      title: "Inst Amount (Tk)",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (val) => formatCurrency(val),
    },
    {
      title: "Paid (Tk)",
      dataIndex: "paidAmount",
      key: "paidAmount",
      align: "right",
      render: (val) => formatCurrency(val),
    },
    {
      title: "Overdue Due (Tk)",
      dataIndex: "remainingDue",
      key: "remainingDue",
      align: "right",
      render: (val) => (
        <span style={{ fontWeight: 700, color: "#dc2626" }}>
          {formatCurrency(val)}
        </span>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} lg={6}>
          <Card size="small" bordered={false} className="shadow-sm">
            <Statistic
              title="Overdue Installments"
              value={summary.totalOverdueInstallments ?? 0}
              prefix={<WarningOutlined style={{ color: "#d97706" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={6}>
          <Card size="small" bordered={false} className="shadow-sm">
            <Statistic
              title="Overdue Borrowers"
              value={summary.totalOverdueMembers ?? 0}
              prefix={<UserOutlined style={{ color: "#ef4444" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} lg={12}>
          <Card
            size="small"
            bordered={false}
            className="shadow-sm"
            style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
          >
            <Statistic
              title={<span style={{ color: "#991b1b" }}>Total Overdue Amount</span>}
              value={summary.totalOverdueAmount ?? 0}
              precision={2}
              formatter={(v) => formatCurrency(v)}
              styles={{ content: { color: "#dc2626", fontWeight: 700, fontSize: 20 } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters Toolbar */}
      <Card size="small" bordered={false} className="shadow-sm">
        <Row gutter={[12, 12]} align="middle">
          <Col xs={12} sm={6} md={5}>
            <DatePicker
              value={filters.asOfDate}
              onChange={(date) => {
                setFilters((prev) => ({ ...prev, asOfDate: date }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              style={{ width: "100%" }}
              placeholder="As of Date"
            />
          </Col>
          <Col xs={12} sm={6} md={5}>
            <Select
              value={filters.somitiId}
              onChange={(val) => {
                setFilters((prev) => ({ ...prev, somitiId: val }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={somitiOptions}
              style={{ width: "100%" }}
              placeholder="Filter by Somiti"
            />
          </Col>
          {!isFieldOfficer && (
            <Col xs={12} sm={6} md={5}>
              <Select
                value={filters.fieldOfficerId}
                onChange={(val) => {
                  setFilters((prev) => ({ ...prev, fieldOfficerId: val }));
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                options={officerOptions}
                style={{ width: "100%" }}
                placeholder="Filter by Officer"
              />
            </Col>
          )}
          <Col xs={12} sm={6} md={5}>
            <Select
              value={filters.minDaysOverdue}
              onChange={(val) => {
                setFilters((prev) => ({ ...prev, minDaysOverdue: val }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={overdueDaysOptions}
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Button icon={<ClearOutlined />} onClick={handleReset} block>
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card size="small" bordered={false} className="shadow-sm">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={records}
          loading={isLoading || isFetching}
          pagination={{
            current: meta.page ?? 1,
            pageSize: meta.limit ?? 10,
            total: meta.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            onChange: (page, limit) => setPagination({ page, limit }),
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} overdue installments`,
          }}
          size="middle"
        />
      </Card>
    </Space>
  );
}

// ----------------------------------------------------------------------------------
// 4. Savings Summary Tab Component
// ----------------------------------------------------------------------------------
function SavingsSummaryTab({
  filters,
  setFilters,
  pagination,
  setPagination,
  response,
  isLoading,
  isFetching,
  somitiOptions,
  officerOptions,
  isFieldOfficer,
}) {
  const summary = response?.summary ?? {};
  const records = response?.data ?? [];
  const meta = response?.meta ?? {};

  const handleReset = () => {
    setFilters({
      somitiId: "ALL",
      fieldOfficerId: "ALL",
      status: "ALL",
    });
    setPagination({ page: 1, limit: 10 });
  };

  const columns = [
    {
      title: "Account ID",
      dataIndex: "accountId",
      key: "accountId",
      width: 130,
      render: (val) => <span style={{ fontWeight: 600 }}>{val}</span>,
    },
    {
      title: "Member",
      dataIndex: "member",
      key: "member",
      render: (member) => (
        <div>
          <div style={{ fontWeight: 600 }}>{member?.fullName || "—"}</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>
            {member?.memberId || `ID: ${member?.id}`}
          </div>
        </div>
      ),
    },
    {
      title: "Mobile",
      dataIndex: "member",
      key: "mobileNumber",
      render: (member) => member?.mobileNumber || "—",
    },
    {
      title: "Somiti",
      dataIndex: "somiti",
      key: "somiti",
      render: (somiti) => somiti?.name || "—",
    },
    {
      title: "General Savings (Tk)",
      dataIndex: "generalSavingsBalance",
      key: "generalSavingsBalance",
      align: "right",
      render: (val) => formatCurrency(val),
    },
    {
      title: "Special Savings (Tk)",
      dataIndex: "specialSavingsBalance",
      key: "specialSavingsBalance",
      align: "right",
      render: (val) => formatCurrency(val),
    },
    {
      title: "Total Balance (Tk)",
      dataIndex: "totalBalance",
      key: "totalBalance",
      align: "right",
      render: (val) => (
        <span style={{ fontWeight: 700, color: "#047857" }}>
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <StatusTag status={status} />,
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6} lg={4}>
          <Card size="small" bordered={false} className="shadow-sm">
            <Statistic
              title="Savings Accounts"
              value={summary.totalAccounts ?? 0}
              prefix={<BankOutlined style={{ color: "#3b82f6" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={6}>
          <Card size="small" bordered={false} className="shadow-sm">
            <Statistic
              title="General Savings Balance"
              value={summary.totalGeneralSavingsBalance ?? 0}
              precision={2}
              formatter={(v) => formatCurrency(v)}
              styles={{ content: { color: "#0891b2", fontSize: 18 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={6}>
          <Card size="small" bordered={false} className="shadow-sm">
            <Statistic
              title="Special Savings Balance"
              value={summary.totalSpecialSavingsBalance ?? 0}
              precision={2}
              formatter={(v) => formatCurrency(v)}
              styles={{ content: { color: "#7c3aed", fontSize: 18 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6} lg={8}>
          <Card
            size="small"
            bordered={false}
            className="shadow-sm"
            style={{ background: "#ecfdf5", border: "1px solid #a7f3d0" }}
          >
            <Statistic
              title={<span style={{ color: "#065f46" }}>Total Savings Liability</span>}
              value={summary.totalSavingsBalance ?? 0}
              precision={2}
              formatter={(v) => formatCurrency(v)}
              styles={{ content: { color: "#047857", fontWeight: 700, fontSize: 18 } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters Toolbar */}
      <Card size="small" bordered={false} className="shadow-sm">
        <Row gutter={[12, 12]} align="middle">
          <Col xs={12} sm={6} md={6}>
            <Select
              value={filters.somitiId}
              onChange={(val) => {
                setFilters((prev) => ({ ...prev, somitiId: val }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={somitiOptions}
              style={{ width: "100%" }}
              placeholder="Filter by Somiti"
            />
          </Col>
          {!isFieldOfficer && (
            <Col xs={12} sm={6} md={6}>
              <Select
                value={filters.fieldOfficerId}
                onChange={(val) => {
                  setFilters((prev) => ({ ...prev, fieldOfficerId: val }));
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                options={officerOptions}
                style={{ width: "100%" }}
                placeholder="Filter by Officer"
              />
            </Col>
          )}
          <Col xs={12} sm={6} md={6}>
            <Select
              value={filters.status}
              onChange={(val) => {
                setFilters((prev) => ({ ...prev, status: val }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={savingsStatusOptions}
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={12} sm={6} md={6}>
            <Button icon={<ClearOutlined />} onClick={handleReset} block>
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card size="small" bordered={false} className="shadow-sm">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={records}
          loading={isLoading || isFetching}
          pagination={{
            current: meta.page ?? 1,
            pageSize: meta.limit ?? 10,
            total: meta.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            onChange: (page, limit) => setPagination({ page, limit }),
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} savings accounts`,
          }}
          size="middle"
        />
      </Card>
    </Space>
  );
}

// ----------------------------------------------------------------------------------
// 5. DPS Summary Tab Component
// ----------------------------------------------------------------------------------
function DpsSummaryTab({
  filters,
  setFilters,
  pagination,
  setPagination,
  response,
  isLoading,
  isFetching,
  somitiOptions,
  officerOptions,
  isFieldOfficer,
}) {
  const summary = response?.summary ?? {};
  const records = response?.data ?? [];
  const meta = response?.meta ?? {};

  const handleReset = () => {
    setFilters({
      somitiId: "ALL",
      fieldOfficerId: "ALL",
      status: "ALL",
    });
    setPagination({ page: 1, limit: 10 });
  };

  const columns = [
    {
      title: "DPS Number",
      dataIndex: "dpsNumber",
      key: "dpsNumber",
      width: 140,
      render: (val) => <span style={{ fontWeight: 600 }}>{val}</span>,
    },
    {
      title: "Member",
      dataIndex: "member",
      key: "member",
      render: (member) => (
        <div>
          <div style={{ fontWeight: 600 }}>{member?.fullName || "—"}</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>
            {member?.memberId || `ID: ${member?.id}`}
          </div>
        </div>
      ),
    },
    {
      title: "Somiti",
      dataIndex: "somiti",
      key: "somiti",
      render: (somiti) => somiti?.name || "—",
    },
    {
      title: "Monthly (Tk)",
      dataIndex: "installmentAmount",
      key: "installmentAmount",
      align: "right",
      render: (val) => formatCurrency(val),
    },
    {
      title: "Duration",
      dataIndex: "durationMonths",
      key: "durationMonths",
      align: "center",
      render: (months) => `${months} Mos`,
    },
    {
      title: "Installments",
      key: "progress",
      render: (_, record) => {
        const paid = record.paidInstallments ?? 0;
        const total = record.durationMonths ?? 1;
        const percent = Math.min(100, Math.round((paid / total) * 100));
        return (
          <div style={{ minWidth: 110 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                marginBottom: 2,
              }}
            >
              <span>
                {paid} / {total}
              </span>
              <span style={{ color: "#6b7280" }}>{percent}%</span>
            </div>
            <Progress
              percent={percent}
              showInfo={false}
              size="small"
              strokeColor="#059669"
            />
          </div>
        );
      },
    },
    {
      title: "Total Paid (Tk)",
      dataIndex: "totalPaidAmount",
      key: "totalPaidAmount",
      align: "right",
      render: (val) => (
        <span style={{ fontWeight: 600, color: "#047857" }}>
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      title: "Maturity (Tk)",
      dataIndex: "maturityAmount",
      key: "maturityAmount",
      align: "right",
      render: (val) => (
        <span style={{ fontWeight: 700, color: "#1d4ed8" }}>
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      title: "Maturity Date",
      dataIndex: "maturityDate",
      key: "maturityDate",
      render: (val) => formatDate(val),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <StatusTag status={status} />,
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6} lg={4}>
          <Card size="small" bordered={false} className="shadow-sm">
            <Statistic
              title="Total Accounts"
              value={summary.totalAccounts ?? 0}
              prefix={<SafetyCertificateOutlined style={{ color: "#059669" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={4}>
          <Card size="small" bordered={false} className="shadow-sm">
            <Statistic
              title="Active Accounts"
              value={summary.activeAccounts ?? 0}
              styles={{ content: { color: "#047857" } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={5}>
          <Card size="small" bordered={false} className="shadow-sm">
            <Statistic
              title="Monthly Demand"
              value={summary.totalMonthlyDemand ?? 0}
              precision={2}
              formatter={(v) => formatCurrency(v)}
              styles={{ content: { color: "#0891b2", fontSize: 18 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={5}>
          <Card size="small" bordered={false} className="shadow-sm">
            <Statistic
              title="Total Deposited"
              value={summary.totalPaidAmount ?? 0}
              precision={2}
              formatter={(v) => formatCurrency(v)}
              styles={{ content: { color: "#047857", fontSize: 18 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            size="small"
            bordered={false}
            className="shadow-sm"
            style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
          >
            <Statistic
              title={<span style={{ color: "#1e40af" }}>Total Maturity Liability</span>}
              value={summary.totalMaturityLiability ?? 0}
              precision={2}
              formatter={(v) => formatCurrency(v)}
              styles={{ content: { color: "#1d4ed8", fontWeight: 700, fontSize: 18 } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters Toolbar */}
      <Card size="small" bordered={false} className="shadow-sm">
        <Row gutter={[12, 12]} align="middle">
          <Col xs={12} sm={6} md={6}>
            <Select
              value={filters.somitiId}
              onChange={(val) => {
                setFilters((prev) => ({ ...prev, somitiId: val }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={somitiOptions}
              style={{ width: "100%" }}
              placeholder="Filter by Somiti"
            />
          </Col>
          {!isFieldOfficer && (
            <Col xs={12} sm={6} md={6}>
              <Select
                value={filters.fieldOfficerId}
                onChange={(val) => {
                  setFilters((prev) => ({ ...prev, fieldOfficerId: val }));
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                options={officerOptions}
                style={{ width: "100%" }}
                placeholder="Filter by Officer"
              />
            </Col>
          )}
          <Col xs={12} sm={6} md={6}>
            <Select
              value={filters.status}
              onChange={(val) => {
                setFilters((prev) => ({ ...prev, status: val }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={dpsStatusOptions}
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={12} sm={6} md={6}>
            <Button icon={<ClearOutlined />} onClick={handleReset} block>
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card size="small" bordered={false} className="shadow-sm">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={records}
          loading={isLoading || isFetching}
          pagination={{
            current: meta.page ?? 1,
            pageSize: meta.limit ?? 10,
            total: meta.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            onChange: (page, limit) => setPagination({ page, limit }),
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} DPS accounts`,
          }}
          size="middle"
        />
      </Card>
    </Space>
  );
}
