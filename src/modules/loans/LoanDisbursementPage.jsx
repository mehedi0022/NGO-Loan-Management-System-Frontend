import {
  BankOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  SendOutlined,
  SwapOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageContainer } from "../../components/page-container/PageContainer.jsx";
import { useGetAccountsQuery } from "../accounts/accountsApi.js";
import { formatCurrency, formatDate } from "./loanFormatters.js";
import { useDisburseLoanMutation, useGetLoansQuery } from "./loansApi.js";

const SOMITI_DAY_MAP = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const getNextSomitiDay = (fromDate, targetDayIndex) => {
  if (!fromDate || targetDayIndex === undefined) return null;
  let next = fromDate.add(1, "day");
  while (next.day() !== targetDayIndex) {
    next = next.add(1, "day");
  }
  return next;
};

export function LoanDisbursementPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [search, setSearch] = useState("");
  const [frequencyFilter, setFrequencyFilter] = useState(undefined);

  // Active Loan for Disbursement Modal
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(undefined);
  const [confirmStep, setConfirmStep] = useState(false);

  // Fetch accounts list for cash balance checks & account selector
  const { data: accountsResponse, isFetching: accountsLoading } =
    useGetAccountsQuery();
  const accounts = useMemo(() => {
    if (Array.isArray(accountsResponse?.data)) return accountsResponse.data;
    if (Array.isArray(accountsResponse?.data?.accounts))
      return accountsResponse.data.accounts;
    return [];
  }, [accountsResponse]);

  const defaultAccount = useMemo(() => {
    return (
      accounts.find((a) => a.isDefault && a.isActive) ||
      accounts.find((a) => a.accountType === "CASH" && a.isActive) ||
      accounts[0]
    );
  }, [accounts]);

  const mainCashBalance = Number(defaultAccount?.currentBalance) || 0;

  // Fetch approved loans awaiting disbursement
  const {
    data: loansResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetLoansQuery({
    page,
    limit,
    status: "APPROVED",
    search: search ? search.trim() : undefined,
    frequency: frequencyFilter || undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [disburseLoan, { isLoading: disbursing }] = useDisburseLoanMutation();

  const loans = loansResponse?.data ?? [];
  const meta = loansResponse?.meta ?? { total: 0, page: 1, limit: 15 };

  // Calculate totals for KPI cards
  const summary = useMemo(() => {
    const totalCount = meta.total ?? loans.length;
    const totalPrincipal = loans.reduce(
      (sum, item) => sum + (Number(item.principalAmount) || 0),
      0,
    );
    const totalPayable = loans.reduce(
      (sum, item) => sum + (Number(item.totalPayable) || 0),
      0,
    );
    return { totalCount, totalPrincipal, totalPayable };
  }, [loans, meta.total]);

  // Somiti Meeting Day lock helper for selected loan
  const somitiMeetingDay = selectedLoan?.member?.somiti?.meetingDay;
  const somitiDayIndex =
    somitiMeetingDay && SOMITI_DAY_MAP[somitiMeetingDay] !== undefined
      ? SOMITI_DAY_MAP[somitiMeetingDay]
      : undefined;

  // Active Payout Account for Modal
  const activePayoutAccount = useMemo(() => {
    if (selectedAccountId) {
      const found = accounts.find((a) => a.id === selectedAccountId);
      if (found) return found;
    }
    return defaultAccount;
  }, [accounts, selectedAccountId, defaultAccount]);

  const activePayoutBalance = Number(activePayoutAccount?.currentBalance) || 0;
  const principalNeeded = Number(selectedLoan?.principalAmount) || 0;
  const hasSufficientBalance = activePayoutBalance >= principalNeeded;
  const balanceShortage = Math.max(0, principalNeeded - activePayoutBalance);

  // Set default dates & account when opening modal
  useEffect(() => {
    if (selectedLoan) {
      const today = dayjs();
      const nextSomiti = getNextSomitiDay(today, somitiDayIndex);
      const accId = defaultAccount?.id;
      setSelectedAccountId(accId);
      form.setFieldsValue({
        accountId: accId,
        disbursementDate: today,
        firstDueDate: nextSomiti || today.add(7, "day"),
      });
      setConfirmStep(false);
    }
  }, [selectedLoan, somitiDayIndex, defaultAccount, form]);

  const handleOpenDisburse = (loan) => {
    setSelectedLoan(loan);
    setConfirmStep(false);
  };

  const handleCloseModal = () => {
    form.resetFields();
    setSelectedLoan(null);
    setSelectedAccountId(undefined);
    setConfirmStep(false);
  };

  const handleFormSubmit = async (values) => {
    if (!hasSufficientBalance) {
      message.error(
        `Insufficient funds in ${activePayoutAccount?.accountName}. Please transfer funds from Bank or inject capital first.`,
      );
      return;
    }

    if (!confirmStep) {
      setConfirmStep(true);
      return;
    }

    try {
      await disburseLoan({
        id: selectedLoan.id,
        payload: {
          disbursementDate: values.disbursementDate.format("YYYY-MM-DD"),
          firstDueDate: values.firstDueDate.format("YYYY-MM-DD"),
          accountId: values.accountId || activePayoutAccount?.id,
        },
      }).unwrap();

      message.success(
        `Loan #${selectedLoan.loanId} disbursed successfully! Schedule generated and cash deducted.`,
      );
      handleCloseModal();
      refetch();
    } catch (err) {
      message.error(err?.data?.message || "Failed to disburse loan");
    }
  };

  const columns = [
    {
      title: "Loan ID",
      dataIndex: "loanId",
      key: "loanId",
      width: 120,
      render: (loanId, row) => (
        <Button
          type="link"
          style={{ padding: 0, fontWeight: 700 }}
          onClick={() => navigate(`/loans/${row.id}`)}
        >
          #{loanId}
        </Button>
      ),
    },
    {
      title: "Member",
      key: "member",
      render: (_, row) => {
        const member = row.member;
        const initials = member?.fullName
          ? member.fullName
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
          : "M";

        return (
          <Space>
            <Avatar
              style={{
                backgroundColor: "#166534",
                verticalAlign: "middle",
                fontWeight: 600,
              }}
            >
              {initials}
            </Avatar>
            <div>
              <div style={{ fontWeight: 600, color: "#1f2937" }}>
                {member?.fullName ?? "—"}
              </div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                ID: {member?.memberId ?? "—"}{" "}
                {member?.mobileNumber ? `• ${member.mobileNumber}` : ""}
              </div>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Somiti & Meeting Day",
      key: "somiti",
      render: (_, row) => {
        const somiti = row.member?.somiti;
        return (
          <div>
            <div style={{ fontWeight: 500 }}>{somiti?.name ?? "—"}</div>
            {somiti?.meetingDay ? (
              <Tag color="blue" style={{ marginTop: 2, fontSize: 11 }}>
                {somiti.meetingDay}
              </Tag>
            ) : (
              <Tag style={{ marginTop: 2, fontSize: 11 }}>No Meeting Day</Tag>
            )}
          </div>
        );
      },
    },
    {
      title: "Disbursement Amount",
      dataIndex: "principalAmount",
      key: "principalAmount",
      align: "right",
      render: (val) => {
        const amt = Number(val) || 0;
        const isCovered = mainCashBalance >= amt;
        return (
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#16a34a" }}>
              {formatCurrency(amt)}
            </div>
            {!isCovered && (
              <Tag color="orange" style={{ fontSize: 10, marginTop: 2 }}>
                Cash Shortage
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: "Total Payable",
      key: "totalPayable",
      align: "right",
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{formatCurrency(row.totalPayable)}</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>
            Profit: {row.interestRate ?? 0}%
          </div>
        </div>
      ),
    },
    {
      title: "Repayment Terms",
      key: "terms",
      render: (_, row) => (
        <div>
          <div>
            <strong>{row.installmentCount}</strong> installments
          </div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>
            {row.frequency} • {formatCurrency(row.installmentAmount)}/inst.
          </div>
        </div>
      ),
    },
    {
      title: "Approved On",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (val, row) => formatDate(val || row.createdAt),
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      width: 170,
      render: (_, row) => (
        <Space orientation="horizontal" size="small">
          <Button
            type="primary"
            style={{
              backgroundColor: "#16a34a",
              borderColor: "#16a34a",
              fontWeight: 600,
            }}
            icon={<DollarCircleOutlined />}
            onClick={() => handleOpenDisburse(row)}
          >
            Disburse
          </Button>
          <Tooltip title="View loan details">
            <Button
              icon={<EyeOutlined />}
              onClick={() => navigate(`/loans/${row.id}`)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      {/* Header */}
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
            Loan Disbursement
          </Typography.Title>
          <Typography.Text type="secondary">
            Loans approved by management waiting to be disbursed to members.
          </Typography.Text>
        </div>

        <Space wrap>
          <Button
            icon={<SwapOutlined />}
            onClick={() => navigate("/accounts")}
          >
            Fund Transfer (Bank ➔ Cash)
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isFetching}
          >
            Refresh
          </Button>
          <Button onClick={() => navigate("/loans/approval")}>
            Loan Approval Queue
          </Button>
        </Space>
      </div>

      {/* KPI Stats Row with Real-Time Cash Availability Card */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} lg={8}>
          <Card
            size="small"
            bordered={false}
            className="shadow-sm"
            style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
          >
            <Statistic
              title={<span style={{ color: "#166534" }}>Ready for Disbursement</span>}
              value={summary.totalCount}
              styles={{ content: { color: "#16a34a", fontWeight: 700, fontSize: 18 } }}
              prefix={<ClockCircleOutlined style={{ color: "#16a34a" }} />}
            />
            <div style={{ fontSize: 11, color: "#15803d", marginTop: 4 }}>
              Approved loans waiting for cash handover
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={8}>
          <Card
            size="small"
            bordered={false}
            className="shadow-sm"
            style={{ background: "#ecfdf5", border: "1px solid #a7f3d0" }}
          >
            <Statistic
              title={<span style={{ color: "#065f46" }}>Total Capital to Disburse</span>}
              value={summary.totalPrincipal}
              precision={2}
              formatter={(v) => formatCurrency(v)}
              styles={{ content: { color: "#059669", fontWeight: 700, fontSize: 18 } }}
              prefix={<DollarCircleOutlined style={{ color: "#059669" }} />}
            />
            <div style={{ fontSize: 11, color: "#047857", marginTop: 4 }}>
              Total required for all waiting loans
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8} lg={8}>
          <Card
            size="small"
            bordered={false}
            className="shadow-sm"
            style={{
              background: mainCashBalance >= summary.totalPrincipal ? "#eff6ff" : "#fffbeb",
              border: `1px solid ${mainCashBalance >= summary.totalPrincipal ? "#bfdbfe" : "#fde68a"}`,
            }}
          >
            <Statistic
              title={
                <span style={{ color: mainCashBalance >= summary.totalPrincipal ? "#1e40af" : "#92400e" }}>
                  Available in {defaultAccount?.accountName || "Main Cash"}
                </span>
              }
              value={mainCashBalance}
              precision={2}
              formatter={(v) => formatCurrency(v)}
              styles={{
                content: {
                  color: mainCashBalance >= summary.totalPrincipal ? "#2563eb" : "#d97706",
                  fontWeight: 700,
                  fontSize: 22,
                },
              }}
              prefix={<WalletOutlined style={{ color: mainCashBalance >= summary.totalPrincipal ? "#2563eb" : "#d97706" }} />}
            />
            <div
              style={{
                fontSize: 11,
                color: mainCashBalance >= summary.totalPrincipal ? "#1d4ed8" : "#b45309",
                marginTop: 4,
              }}
            >
              {mainCashBalance >= summary.totalPrincipal
                ? "Sufficient physical cash in hand"
                : "Transfer funds from Bank to Cash to avoid blockage"}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filters Toolbar */}
      <Card size="small" bordered={false} className="shadow-sm" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={14} md={8}>
            <Input
              placeholder="Search by loan ID, member name, or phone..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              allowClear
            />
          </Col>

          <Col xs={24} sm={10} md={4}>
            <Select
              value={frequencyFilter}
              onChange={(val) => {
                setFrequencyFilter(val);
                setPage(1);
              }}
              options={[
                { value: undefined, label: "All Frequencies" },
                { value: "WEEKLY", label: "Weekly" },
                { value: "MONTHLY", label: "Monthly" },
              ]}
              style={{ width: "100%" }}
            />
          </Col>
        </Row>
      </Card>

      {/* Error Alert */}
      {isError && (
        <Alert
          type="error"
          message="Failed to load approved loans"
          description={error?.data?.message || "An unexpected error occurred."}
          action={<Button onClick={() => refetch()}>Retry</Button>}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Approved Loans Table */}
      <Card size="small" bordered={false} className="shadow-sm">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={loans}
          loading={isLoading || isFetching}
          scroll={{ x: 1050 }}
          pagination={{
            current: meta.page ?? 1,
            pageSize: meta.limit ?? 15,
            total: meta.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: ["15", "30", "50", "100"],
            onChange: (p, l) => {
              setPage(p);
              setLimit(l);
            },
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} approved loans`,
          }}
          locale={{
            emptyText: (
              <div style={{ padding: "32px 0", textAlign: "center" }}>
                <CheckCircleOutlined style={{ fontSize: 36, color: "#16a34a", marginBottom: 8 }} />
                <div style={{ fontSize: 16, fontWeight: 600, color: "#374151" }}>
                  No Approved Loans Pending Disbursement
                </div>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                  All approved loans have been disbursed, or there are no approved loans yet.
                </div>
              </div>
            ),
          }}
        />
      </Card>

      {/* Disbursement Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <DollarCircleOutlined style={{ color: "#16a34a", fontSize: 20 }} />
            <span>Disburse Loan #{selectedLoan?.loanId}</span>
          </div>
        }
        open={Boolean(selectedLoan)}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnHidden
        width={580}
      >
        {selectedLoan && (
          <div>
            {/* Somiti Meeting Day lock banner */}
            {somitiMeetingDay && (
              <div
                style={{
                  background: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  padding: "10px 14px",
                  borderRadius: 6,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontWeight: 600, color: "#0369a1", fontSize: 13 }}>
                  📌 Somiti Meeting Day: {somitiMeetingDay}{" "}
                  {selectedLoan.member?.somiti?.name
                    ? `(${selectedLoan.member.somiti.name})`
                    : ""}
                </div>
                <div style={{ color: "#0284c7", fontSize: 11, marginTop: 2 }}>
                  First installment due date is strictly locked to only fall on{" "}
                  <strong>{somitiMeetingDay}s</strong>.
                </div>
              </div>
            )}

            {/* Loan Highlights */}
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "12px 16px",
                marginBottom: 16,
              }}
            >
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={12}>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>Member</div>
                  <div style={{ fontWeight: 600, color: "#111827" }}>
                    {selectedLoan.member?.fullName}
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>
                    ID: {selectedLoan.member?.memberId}
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>Disbursement Amount</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: "#16a34a" }}>
                    {formatCurrency(selectedLoan.principalAmount)}
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>Installment Plan</div>
                  <div style={{ fontWeight: 600 }}>
                    {selectedLoan.installmentCount} installments ({selectedLoan.frequency})
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>
                    {formatCurrency(selectedLoan.installmentAmount)} per installment
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>Total Recoverable</div>
                  <div style={{ fontWeight: 600 }}>
                    {formatCurrency(selectedLoan.totalPayable)}
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>
                    Includes {selectedLoan.interestRate}% service charge
                  </div>
                </Col>
              </Row>
            </div>

            {/* Strict Insufficient Balance Blocking Alert */}
            {!hasSufficientBalance && (
              <Alert
                type="error"
                showIcon
                icon={<ExclamationCircleOutlined />}
                style={{ marginBottom: 16 }}
                message={
                  <span style={{ fontWeight: 700 }}>
                    Insufficient Balance — Disbursement Blocked
                  </span>
                }
                description={
                  <div>
                    <div style={{ marginTop: 2 }}>
                      Account <strong>{activePayoutAccount?.accountName}</strong> has only{" "}
                      <strong style={{ color: "#dc2626" }}>{formatCurrency(activePayoutBalance)}</strong>, but this loan requires{" "}
                      <strong>{formatCurrency(principalNeeded)}</strong> in physical cash.
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontWeight: 700,
                        color: "#b91c1c",
                        fontSize: 13,
                      }}
                    >
                      Cash Shortage: {formatCurrency(balanceShortage)}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "#4b5563", lineHeight: 1.5 }}>
                      You cannot disburse physical cash exceeding your cash on hand. Please transfer funds from your Bank Account to <strong>{activePayoutAccount?.accountName}</strong> via <strong>Accounts &amp; Cash</strong> before disbursing this loan.
                    </div>
                    <Button
                      size="small"
                      type="primary"
                      danger
                      icon={<SwapOutlined />}
                      style={{ marginTop: 10, fontWeight: 600 }}
                      onClick={() => navigate("/accounts")}
                    >
                      Transfer Funds Now (Bank ➔ Cash)
                    </Button>
                  </div>
                }
              />
            )}

            {/* Form */}
            <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
              <Form.Item
                name="accountId"
                label={
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                    <span>Disbursement Account (Payout Source)</span>
                    <span style={{ fontSize: 12, color: hasSufficientBalance ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                      Available: {formatCurrency(activePayoutBalance)}
                    </span>
                  </div>
                }
                rules={[{ required: true, message: "Please select payout account" }]}
              >
                <Select
                  onChange={(val) => {
                    setSelectedAccountId(val);
                    setConfirmStep(false);
                  }}
                  options={accounts
                    .filter((a) => a.isActive)
                    .map((a) => ({
                      value: a.id,
                      label: `${a.accountName} (${a.accountType}) — Balance: ${formatCurrency(a.currentBalance)}`,
                    }))}
                />
              </Form.Item>

              <Form.Item
                name="disbursementDate"
                label="Disbursement Date"
                rules={[{ required: true, message: "Disbursement date is required" }]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD MMM YYYY"
                  onChange={(val) => {
                    if (val && somitiDayIndex !== undefined) {
                      const nextSomiti = getNextSomitiDay(val, somitiDayIndex);
                      if (nextSomiti) {
                        form.setFieldsValue({ firstDueDate: nextSomiti });
                      }
                    }
                  }}
                />
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prev, cur) =>
                  prev.disbursementDate !== cur.disbursementDate
                }
              >
                {({ getFieldValue }) => {
                  const disbursementDate = getFieldValue("disbursementDate");

                  return (
                    <Form.Item
                      name="firstDueDate"
                      label={
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                          }}
                        >
                          <span>First Installment Due Date</span>
                          {somitiMeetingDay && (
                            <span
                              style={{
                                color: "#0369a1",
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                            >
                              Only {somitiMeetingDay}s allowed
                            </span>
                          )}
                        </div>
                      }
                      dependencies={["disbursementDate"]}
                      rules={[
                        {
                          required: true,
                          message: "First installment due date is required",
                        },
                        () => ({
                          validator(_, value) {
                            if (!value) return Promise.resolve();
                            if (
                              disbursementDate &&
                              !value.isAfter(disbursementDate, "day")
                            ) {
                              return Promise.reject(
                                new Error(
                                  "First installment due date must be after disbursement date",
                                ),
                              );
                            }
                            if (
                              somitiDayIndex !== undefined &&
                              value.day() !== somitiDayIndex
                            ) {
                              return Promise.reject(
                                new Error(
                                  `First installment due date must fall on Somiti meeting day (${somitiMeetingDay})`,
                                ),
                              );
                            }
                            return Promise.resolve();
                          },
                        }),
                      ]}
                    >
                      <DatePicker
                        style={{ width: "100%" }}
                        format="DD MMM YYYY"
                        disabledDate={(current) => {
                          if (!disbursementDate) return true;
                          if (!current.isAfter(disbursementDate, "day")) return true;
                          if (somitiDayIndex !== undefined) {
                            return current.day() !== somitiDayIndex;
                          }
                          return false;
                        }}
                      />
                    </Form.Item>
                  );
                }}
              </Form.Item>

              {/* Confirmation Step Preview */}
              {confirmStep && hasSufficientBalance ? (
                <div
                  style={{
                    background: "#fef3c7",
                    border: "1px solid #fde68a",
                    padding: "12px 16px",
                    borderRadius: 6,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#92400e", marginBottom: 4 }}>
                    ⚠️ Confirm Handover & Cash Deduction
                  </div>
                  <div style={{ fontSize: 12, color: "#78350f", lineHeight: 1.5 }}>
                    Are you sure you want to disburse <strong>{formatCurrency(selectedLoan.principalAmount)}</strong> to{" "}
                    <strong>{selectedLoan.member?.fullName}</strong>?
                    <br />
                    • Source Account: <strong>{activePayoutAccount?.accountName}</strong> (Remaining after payout:{" "}
                    <strong>{formatCurrency(activePayoutBalance - principalNeeded)}</strong>).
                    <br />
                    • Installment schedule of <strong>{selectedLoan.installmentCount}</strong> payments will be generated starting from{" "}
                    <strong>{form.getFieldValue("firstDueDate")?.format("DD MMM YYYY")}</strong>.
                  </div>
                </div>
              ) : null}

              <Divider style={{ margin: "16px 0" }} />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                <Button onClick={handleCloseModal}>Cancel</Button>
                {confirmStep ? (
                  <>
                    <Button onClick={() => setConfirmStep(false)}>Back</Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={disbursing}
                      disabled={!hasSufficientBalance}
                      style={{
                        backgroundColor: hasSufficientBalance ? "#16a34a" : undefined,
                        borderColor: hasSufficientBalance ? "#16a34a" : undefined,
                        fontWeight: 600,
                      }}
                    >
                      Confirm & Disburse Now
                    </Button>
                  </>
                ) : (
                  <Button
                    type="primary"
                    htmlType="submit"
                    disabled={!hasSufficientBalance}
                    style={{
                      backgroundColor: hasSufficientBalance ? "#16a34a" : undefined,
                      borderColor: hasSufficientBalance ? "#16a34a" : undefined,
                      fontWeight: 600,
                    }}
                  >
                    Proceed to Disburse
                  </Button>
                )}
              </div>
            </Form>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}