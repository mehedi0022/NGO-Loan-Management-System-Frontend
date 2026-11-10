import {
  CalculatorOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  LockOutlined,
  PercentageOutlined,
  QuestionCircleOutlined,
  SaveOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

import { formatAmount, formatDate } from "../../loans/loanFormatters.js";
import { useGetActiveSomitiesQuery } from "../../somities/somitiesApi.js";
import {
  useGetInterestPostingHistoryQuery,
  useGetSavingsInterestSettingsQuery,
  useLazyPreviewSavingsInterestQuery,
  usePostSavingsInterestMutation,
  useUpdateSavingsInterestSettingsMutation,
} from "../savingsApi.js";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const INTERVAL_LABELS = {
  MONTHLY: "Monthly (Every Month)",
  QUARTERLY: "Quarterly (Every 3 Months)",
  HALF_YEARLY: "Half-Yearly (Every 6 Months)",
  YEARLY: "Yearly (Every 12 Months)",
};

export function SavingsInterestModal({ open, onClose }) {
  const [activeTab, setActiveTab] = useState("calculate");

  // Query Settings
  const { data: settingsData, isLoading: settingsLoading } =
    useGetSavingsInterestSettingsQuery(undefined, { skip: !open });

  const defaultSettings = settingsData?.data ?? {
    generalSavingsInterestRate: 6,
    specialSavingsInterestRate: 7,
    savingsCompoundingInterval: "QUARTERLY",
  };

  // Somities for filter
  const { data: somitiesData } = useGetActiveSomitiesQuery(undefined, {
    skip: !open,
  });
  const somitiesList = somitiesData?.data ?? [];

  // Organization policy values (read-only from Settings)
  const generalRate =
    Number(settingsData?.data?.generalSavingsInterestRate) || 6;
  const specialRate =
    Number(settingsData?.data?.specialSavingsInterestRate) || 7;
  const intervalType =
    settingsData?.data?.savingsCompoundingInterval || "QUARTERLY";

  // Form states for calculation
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(3, "month").startOf("month"),
    dayjs().subtract(1, "month").endOf("month"),
  ]);
  const [selectedSomitiId, setSelectedSomitiId] = useState(undefined);
  const [postNotes, setPostNotes] = useState("");
  const [searchText, setSearchText] = useState("");

  const lastPosting = settingsData?.data?.lastPosting;
  const nextEligibleStartDate = settingsData?.data?.nextEligibleStartDate;
  const earliestOrganizationDate = settingsData?.data?.earliestOrganizationDate;
  const lastPostedEndDayjs = lastPosting?.periodEndDate
    ? dayjs(lastPosting.periodEndDate)
    : null;

  // Helper to compute recommended period end date based on policy compounding frequency
  const computeEndDate = (startDayjs, interval) => {
    const now = dayjs();
    let targetEnd = startDayjs;
    if (interval === "MONTHLY") {
      targetEnd = startDayjs.add(1, "month").subtract(1, "day");
    } else if (interval === "QUARTERLY") {
      targetEnd = startDayjs.add(3, "month").subtract(1, "day");
    } else if (interval === "HALF_YEARLY") {
      targetEnd = startDayjs.add(6, "month").subtract(1, "day");
    } else if (interval === "YEARLY") {
      targetEnd = startDayjs.add(1, "year").subtract(1, "day");
    } else {
      targetEnd = startDayjs.add(3, "month").subtract(1, "day");
    }
    if (targetEnd.isAfter(now)) {
      targetEnd = now;
    }
    return targetEnd;
  };

  // Auto-set starting date continuous from last posting (or earliest org date)
  useEffect(() => {
    if (settingsData?.data) {
      const interval =
        settingsData.data.savingsCompoundingInterval || "QUARTERLY";

      if (settingsData.data.nextEligibleStartDate) {
        const nextStart = dayjs(settingsData.data.nextEligibleStartDate);
        const nextEnd = computeEndDate(nextStart, interval);
        setDateRange([nextStart, nextEnd]);
      } else if (settingsData.data.earliestOrganizationDate) {
        const initialStart = dayjs(settingsData.data.earliestOrganizationDate);
        const initialEnd = computeEndDate(initialStart, interval);
        setDateRange([initialStart, initialEnd]);
      }
    }
  }, [settingsData]);

  // Disabled dates to strictly prevent selecting past posted periods (overlap), dates before org start, and future dates
  const disabledDate = (current) => {
    if (!current) return false;
    // 1. Cannot select future dates
    if (current.isAfter(dayjs().endOf("day"))) return true;
    // 2. Cannot overlap with previously posted periods
    if (lastPostedEndDayjs) {
      if (
        current.isBefore(lastPostedEndDayjs, "day") ||
        current.isSame(lastPostedEndDayjs, "day")
      ) {
        return true;
      }
    } else if (earliestOrganizationDate) {
      // 3. For initial cycle, cannot select dates before the organization's earliest account opening
      if (current.isBefore(dayjs(earliestOrganizationDate), "day")) {
        return true;
      }
    }
    return false;
  };

  // Preview API Hook
  const [
    triggerPreview,
    { data: previewData, isFetching: previewLoading, error: previewError },
  ] = useLazyPreviewSavingsInterestQuery();

  // Post Mutation Hook
  const [postInterest, { isLoading: postLoading }] =
    usePostSavingsInterestMutation();

  // Settings Mutation Hook
  const [updateSettings, { isLoading: settingsUpdating }] =
    useUpdateSavingsInterestSettingsMutation();

  // History Query Hook
  const [historyPage, setHistoryPage] = useState(1);
  const { data: historyData, isFetching: historyLoading } =
    useGetInterestPostingHistoryQuery(
      { page: historyPage, limit: 10 },
      { skip: !open || activeTab !== "history" },
    );

  const calculationResult = previewData?.data;

  // Handle preview click
  const handleCalculatePreview = () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.error(
        "Please select a valid start and end date for interest calculation",
      );
      return;
    }
    triggerPreview({
      startDate: dateRange[0].format("YYYY-MM-DD"),
      endDate: dateRange[1].format("YYYY-MM-DD"),
      generalSavingsRate: generalRate,
      specialSavingsRate: specialRate,
      somitiId: selectedSomitiId,
      compoundingInterval: intervalType,
    });
  };

  // Handle post confirmation
  const handleConfirmPost = async () => {
    if (!calculationResult || calculationResult.grandTotalInterest <= 0) {
      message.warning("No interest to post.");
      return;
    }

    try {
      const res = await postInterest({
        startDate: dateRange[0].format("YYYY-MM-DD"),
        endDate: dateRange[1].format("YYYY-MM-DD"),
        generalSavingsRate: generalRate,
        specialSavingsRate: specialRate,
        somitiId: selectedSomitiId,
        compoundingInterval: intervalType,
        notes: postNotes,
      }).unwrap();

      message.success(
        `Successfully credited ৳${formatAmount(res.data?.calculation?.grandTotalInterest)} compound interest to ${res.data?.accountsCreditedCount} accounts!`,
      );
      // Switch to history tab to view posting receipt
      setActiveTab("history");
    } catch (err) {
      message.error(
        err?.data?.message || "Failed to post interest to accounts",
      );
    }
  };

  // Filtered accounts in preview table
  const filteredPreviewAccounts = useMemo(() => {
    if (!calculationResult?.accounts) return [];
    if (!searchText) return calculationResult.accounts;
    const q = searchText.toLowerCase();
    return calculationResult.accounts.filter(
      (a) =>
        a.memberCode?.toLowerCase().includes(q) ||
        a.fullName?.toLowerCase().includes(q) ||
        a.mobileNumber?.includes(q) ||
        a.somitiName?.toLowerCase().includes(q),
    );
  }, [calculationResult, searchText]);

  // Handle update default settings form
  const [settingsForm] = Form.useForm();
  useEffect(() => {
    if (defaultSettings) {
      settingsForm.setFieldsValue({
        generalSavingsInterestRate:
          Number(defaultSettings.generalSavingsInterestRate) || 6,
        specialSavingsInterestRate:
          Number(defaultSettings.specialSavingsInterestRate) || 7,
        savingsCompoundingInterval:
          defaultSettings.savingsCompoundingInterval || "QUARTERLY",
      });
    }
  }, [defaultSettings, settingsForm]);

  const handleSaveSettings = async (values) => {
    try {
      await updateSettings(values).unwrap();
      message.success("Savings interest settings updated successfully!");
    } catch {
      message.error("Failed to update settings");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1180}
      style={{ top: 20 }}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PercentageOutlined style={{ fontSize: 20, color: "#059669" }} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Title level={4} style={{ margin: 0 }}>
                Savings Interest & Compound Distribution
              </Title>
              <Tooltip
                title={
                  <div style={{ fontSize: 12 }}>
                    <strong>Daily Product Method:</strong> Daily interest is calculated on each
                    member&apos;s end-of-day closing balance across all deposits and withdrawals.
                    Once credited at the end of a period, the earned interest becomes part of the
                    principal for subsequent periods, ensuring accurate Compound Interest.
                  </div>
                }
                placement="bottomLeft"
                styles={{ root: { maxWidth: 380 } }}
              >
                <InfoCircleOutlined
                  style={{ color: "#64748b", fontSize: 15, cursor: "pointer" }}
                />
              </Tooltip>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Daily Product Method • Automated Compound Crediting
            </Text>
          </div>
        </div>
      }
      footer={null}
      destroyOnClose
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "calculate",
            label: (
              <span>
                <CalculatorOutlined /> Calculate & Post Interest
              </span>
            ),
            children: (
              <div>
                {/* Previous Posting Status Banner */}
                {lastPosting ? (
                  <Alert
                    type="success"
                    showIcon
                    icon={<HistoryOutlined />}
                    style={{ marginBottom: 16 }}
                    message={
                      <div style={{ fontSize: 13 }}>
                        <strong>Previous Interest Posting:</strong> Accrued up
                        to{" "}
                        <strong style={{ color: "#0f172a" }}>
                          {formatDate(lastPosting.periodEndDate)}
                        </strong>{" "}
                        <Tag
                          color="cyan"
                          style={{ fontFamily: "monospace", marginLeft: 4 }}
                        >
                          {lastPosting.postingCode}
                        </Tag>
                        <span style={{ marginLeft: 8 }}>
                          ➜ Next cycle starts from:{" "}
                          <strong style={{ color: "#059669" }}>
                            {formatDate(nextEligibleStartDate)}
                          </strong>
                        </span>
                      </div>
                    }
                  />
                ) : (
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message={
                      <span style={{ fontSize: 13 }}>
                        <strong>Initial Compounding Cycle:</strong> No prior
                        interest postings found. This calculation will establish
                        the first compound interest cycle for active member
                        savings accounts.
                      </span>
                    }
                  />
                )}

                {/* Calculation Control Card */}
                <Card
                  size="small"
                  title={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>1. Interest Policy & Calculation Period</span>
                      <Button
                        type="link"
                        size="small"
                        icon={<SettingOutlined />}
                        onClick={() => setActiveTab("settings")}
                        style={{ fontSize: 12, fontWeight: 500 }}
                      >
                        Change Policy in Settings
                      </Button>
                    </div>
                  }
                  style={{ background: "#f8fafc", marginBottom: 16 }}
                >
                  <Row gutter={[16, 14]} align="middle">
                    {/* Read-only Policy Indicators */}
                    <Col xs={24} sm={8} md={5}>
                      <Text
                        type="secondary"
                        style={{ fontSize: 11, display: "block" }}
                      >
                        Compounding Policy:
                      </Text>
                      <Tag
                        color="blue"
                        style={{
                          fontSize: 12,
                          padding: "3px 8px",
                          fontWeight: 600,
                          marginTop: 4,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <LockOutlined />
                        {INTERVAL_LABELS[intervalType] || intervalType}
                      </Tag>
                    </Col>

                    <Col xs={12} sm={8} md={4}>
                      <Text
                        type="secondary"
                        style={{ fontSize: 11, display: "block" }}
                      >
                        General Rate (p.a.):
                      </Text>
                      <Tag
                        color="cyan"
                        style={{
                          fontSize: 12,
                          padding: "3px 8px",
                          fontWeight: 700,
                          marginTop: 4,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <LockOutlined />
                        {generalRate}%
                      </Tag>
                    </Col>

                    <Col xs={12} sm={8} md={4}>
                      <Text
                        type="secondary"
                        style={{ fontSize: 11, display: "block" }}
                      >
                        Special Rate (p.a.):
                      </Text>
                      <Tag
                        color="gold"
                        style={{
                          fontSize: 12,
                          padding: "3px 8px",
                          fontWeight: 700,
                          marginTop: 4,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <LockOutlined />
                        {specialRate}%
                      </Tag>
                    </Col>

                    <Col xs={24} sm={12} md={5}>
                      <Text
                        strong
                        style={{
                          fontSize: 12,
                          display: "block",
                          marginBottom: 4,
                        }}
                      >
                        Filter by Somiti:
                      </Text>
                      <Select
                        placeholder="All Somities"
                        allowClear
                        value={selectedSomitiId}
                        onChange={setSelectedSomitiId}
                        style={{ width: "100%" }}
                        options={somitiesList.map((s) => ({
                          value: s.id,
                          label: `${s.name} (${s.somitiId || s.code || ""})`,
                        }))}
                      />
                    </Col>

                    <Col xs={24} sm={12} md={6} style={{ textAlign: "right" }}>
                      <Button
                        type="primary"
                        icon={<CalculatorOutlined />}
                        size="large"
                        loading={previewLoading}
                        onClick={handleCalculatePreview}
                        style={{
                          background: "#059669",
                          borderColor: "#059669",
                          fontWeight: 600,
                          width: "100%",
                        }}
                      >
                        Calculate Interest Preview
                      </Button>
                    </Col>

                    {/* Calculation Period (Date Range) */}
                    <Col xs={24}>
                      <Divider style={{ margin: "6px 0 12px 0" }} />
                      <Row gutter={[16, 8]} align="middle">
                        <Col xs={24} md={10}>
                          <Text
                            strong
                            style={{ display: "block", marginBottom: 4 }}
                          >
                            Date Range (Period):
                          </Text>
                          <RangePicker
                            value={dateRange}
                            onChange={(val) => setDateRange(val)}
                            format="DD MMM YYYY"
                            style={{ width: "100%" }}
                            allowClear={false}
                            disabledDate={disabledDate}
                            disabled={[Boolean(lastPosting), false]}
                          />
                        </Col>
                        <Col xs={24} md={14}>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#64748b",
                              marginTop: 18,
                            }}
                          >
                            {lastPosting ? (
                              <span>
                                🔒 <strong>Start Date</strong> is locked to{" "}
                                <strong style={{ color: "#0f172a" }}>
                                  {formatDate(nextEligibleStartDate)}
                                </strong>{" "}
                                (Next eligible date after previous posting). End
                                date is set according to{" "}
                                <strong>
                                  {INTERVAL_LABELS[intervalType] ||
                                    intervalType}
                                </strong>{" "}
                                policy.
                              </span>
                            ) : (
                              <span>
                                📅 <strong>Initial Cycle:</strong> Start Date
                                defaults to earliest account opening (
                                <strong style={{ color: "#0f172a" }}>
                                  {formatDate(earliestOrganizationDate)}
                                </strong>
                                ), or choose your migration cutover start date.
                                Recommended cycle:{" "}
                                <strong>
                                  {INTERVAL_LABELS[intervalType] ||
                                    intervalType}
                                </strong>
                                .
                              </span>
                            )}
                          </div>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </Card>

                {/* Calculation Preview Section */}
                {previewLoading && (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <Spin size="large" />
                    <div
                      style={{
                        marginTop: 12,
                        color: "#059669",
                        fontWeight: 500,
                      }}
                    >
                      Computing daily product balance timeline for all
                      accounts...
                    </div>
                  </div>
                )}

                {calculationResult && !previewLoading && (
                  <div>
                    {/* Validation Error Banner */}
                    {calculationResult?.validationError && (
                      <Alert
                        type="error"
                        showIcon
                        style={{ marginBottom: 16 }}
                        message={
                          <strong>
                            Period Blocked (Duplicate / Overlapping Posting)
                          </strong>
                        }
                        description={calculationResult.validationError}
                      />
                    )}

                    {/* Cycle Gap Warning Banner */}
                    {calculationResult?.warning && (
                      <Alert
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                        message={<strong>Posting Notice</strong>}
                        description={calculationResult.warning}
                      />
                    )}

                    {/* Summary Metric Cards */}
                    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                      <Col xs={12} sm={6}>
                        <Card
                          size="small"
                          style={{
                            background: "#f0fdf4",
                            borderColor: "#bbf7d0",
                          }}
                        >
                          <Statistic
                            title="Eligible Members"
                            value={calculationResult.totalEligibleMembers}
                            suffix="Accounts"
                            valueStyle={{
                              color: "#166534",
                              fontWeight: 700,
                              fontSize: 20,
                            }}
                          />
                        </Card>
                      </Col>

                      <Col xs={12} sm={6}>
                        <Card size="small" style={{ background: "#f8fafc" }}>
                          <Statistic
                            title={`Gen. Interest (${calculationResult.generalSavingsRate}%)`}
                            value={calculationResult.totalGeneralInterest}
                            precision={2}
                            prefix="৳"
                            valueStyle={{
                              color: "#0369a1",
                              fontWeight: 700,
                              fontSize: 20,
                            }}
                          />
                        </Card>
                      </Col>

                      <Col xs={12} sm={6}>
                        <Card size="small" style={{ background: "#f8fafc" }}>
                          <Statistic
                            title={`Spc. Interest (${calculationResult.specialSavingsRate}%)`}
                            value={calculationResult.totalSpecialInterest}
                            precision={2}
                            prefix="৳"
                            valueStyle={{
                              color: "#d97706",
                              fontWeight: 700,
                              fontSize: 20,
                            }}
                          />
                        </Card>
                      </Col>

                      <Col xs={12} sm={6}>
                        <Card
                          size="small"
                          style={{
                            background: "#ecfdf5",
                            borderColor: "#a7f3d0",
                          }}
                        >
                          <Statistic
                            title="Total Interest Payable"
                            value={calculationResult.grandTotalInterest}
                            precision={2}
                            prefix="৳"
                            valueStyle={{
                              color: "#059669",
                              fontWeight: 800,
                              fontSize: 22,
                            }}
                          />
                        </Card>
                      </Col>
                    </Row>

                    {/* Action Bar & Search */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 10,
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      <Input.Search
                        placeholder="Search member ID, name, or phone..."
                        allowClear
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 280 }}
                      />

                      <Space wrap>
                        <Input
                          placeholder="Optional posting notes (e.g. Q3 2026 Interest)"
                          value={postNotes}
                          onChange={(e) => setPostNotes(e.target.value)}
                          style={{ width: 240 }}
                        />

                        <Popconfirm
                          title="Confirm Interest Posting"
                          description={
                            <div style={{ maxWidth: 320 }}>
                              Are you sure you want to credit{" "}
                              <strong>
                                ৳
                                {formatAmount(
                                  calculationResult.grandTotalInterest,
                                )}
                              </strong>{" "}
                              compound interest across{" "}
                              <strong>
                                {calculationResult.totalEligibleMembers}
                              </strong>{" "}
                              member accounts?
                              <br />
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                This will safely update balances, record
                                INTEREST passbook transactions, and post to
                                ledger.
                              </Text>
                            </div>
                          }
                          icon={
                            <QuestionCircleOutlined
                              style={{ color: "#059669" }}
                            />
                          }
                          onConfirm={handleConfirmPost}
                          okText="Yes, Post Interest"
                          cancelText="Cancel"
                          okButtonProps={{
                            style: {
                              background: "#059669",
                              borderColor: "#059669",
                            },
                            loading: postLoading,
                          }}
                        >
                          <Button
                            type="primary"
                            size="middle"
                            icon={<CheckCircleOutlined />}
                            loading={postLoading}
                            disabled={
                              calculationResult.grandTotalInterest <= 0 ||
                              Boolean(calculationResult.validationError)
                            }
                            style={{
                              background: "#059669",
                              borderColor: "#059669",
                              fontWeight: 600,
                            }}
                          >
                            Confirm & Post to Accounts
                          </Button>
                        </Popconfirm>
                      </Space>
                    </div>

                    {/* Accounts Table */}
                    <Table
                      dataSource={filteredPreviewAccounts}
                      rowKey="savingsAccountId"
                      size="small"
                      bordered
                      pagination={{ pageSize: 8, showSizeChanger: true }}
                      columns={[
                        {
                          title: "SL",
                          width: 50,
                          align: "center",
                          render: (_val, _rec, idx) => idx + 1,
                        },
                        {
                          title: "Member",
                          dataIndex: "fullName",
                          render: (name, rec) => (
                            <div>
                              <Text strong style={{ fontSize: 12 }}>
                                {name}
                              </Text>
                              <div style={{ fontSize: 10, color: "#64748b" }}>
                                {rec.memberCode} • {rec.somitiName}
                              </div>
                            </div>
                          ),
                        },
                        {
                          title: "Account Opened",
                          dataIndex: "accountOpenDate",
                          align: "center",
                          width: 140,
                          render: (openDate, rec) => (
                            <div>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: "#334155",
                                }}
                              >
                                {openDate ? formatDate(openDate) : "—"}
                              </div>
                              {rec.activeDays < rec.totalPeriodDays ? (
                                <Tag
                                  color="orange"
                                  style={{
                                    fontSize: 10,
                                    lineHeight: "16px",
                                    padding: "0 4px",
                                    marginTop: 2,
                                  }}
                                >
                                  Active: {rec.activeDays}/{rec.totalPeriodDays}
                                  d
                                </Tag>
                              ) : (
                                <Tag
                                  color="green"
                                  style={{
                                    fontSize: 10,
                                    lineHeight: "16px",
                                    padding: "0 4px",
                                    marginTop: 2,
                                  }}
                                >
                                  Full {rec.activeDays}d
                                </Tag>
                              )}
                            </div>
                          ),
                        },
                        {
                          title: "Avg Gen Balance",
                          dataIndex: "avgGeneralBalance",
                          align: "right",
                          render: (val) => `৳${formatAmount(val)}`,
                        },
                        {
                          title: `Gen Interest (${calculationResult.generalSavingsRate}%)`,
                          dataIndex: "generalInterest",
                          align: "right",
                          render: (val) => (
                            <span
                              style={{
                                color: val > 0 ? "#0369a1" : "#94a3b8",
                                fontWeight: 600,
                              }}
                            >
                              ৳{formatAmount(val)}
                            </span>
                          ),
                        },
                        {
                          title: "Avg Spc Balance",
                          dataIndex: "avgSpecialBalance",
                          align: "right",
                          render: (val) => `৳${formatAmount(val)}`,
                        },
                        {
                          title: `Spc Interest (${calculationResult.specialSavingsRate}%)`,
                          dataIndex: "specialInterest",
                          align: "right",
                          render: (val) => (
                            <span
                              style={{
                                color: val > 0 ? "#d97706" : "#94a3b8",
                                fontWeight: 600,
                              }}
                            >
                              ৳{formatAmount(val)}
                            </span>
                          ),
                        },
                        {
                          title: "Total Interest",
                          dataIndex: "totalInterest",
                          align: "right",
                          render: (val) => (
                            <Tag
                              color="green"
                              style={{ fontWeight: 700, fontSize: 12 }}
                            >
                              +৳{formatAmount(val)}
                            </Tag>
                          ),
                        },
                      ]}
                    />
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "history",
            label: (
              <span>
                <HistoryOutlined /> Posting History
              </span>
            ),
            children: (
              <div>
                <Table
                  dataSource={historyData?.data?.records ?? []}
                  rowKey="id"
                  size="small"
                  bordered
                  loading={historyLoading}
                  pagination={{
                    current: historyPage,
                    pageSize: 10,
                    total: historyData?.data?.meta?.total ?? 0,
                    onChange: (p) => setHistoryPage(p),
                  }}
                  columns={[
                    {
                      title: "Code",
                      dataIndex: "postingCode",
                      render: (code) => <Tag color="blue">{code}</Tag>,
                    },
                    {
                      title: "Period",
                      render: (_val, rec) => (
                        <div>
                          <strong>{formatDate(rec.periodStartDate)}</strong> –{" "}
                          <strong>{formatDate(rec.periodEndDate)}</strong>
                          <div style={{ fontSize: 11, color: "#64748b" }}>
                            {rec.compoundingInterval}
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: "Rates",
                      render: (_val, rec) => (
                        <span style={{ fontSize: 11 }}>
                          Gen: <strong>{rec.generalSavingsRate}%</strong> | Spc:{" "}
                          <strong>{rec.specialSavingsRate}%</strong>
                        </span>
                      ),
                    },
                    {
                      title: "Accounts",
                      dataIndex: "totalAccountsCredited",
                      align: "center",
                      render: (val) => `${val} accounts`,
                    },
                    {
                      title: "Total Credited",
                      render: (_val, rec) => {
                        const total =
                          (Number(rec.totalGeneralInterest) || 0) +
                          (Number(rec.totalSpecialInterest) || 0);
                        return (
                          <Tag color="green" style={{ fontWeight: 700 }}>
                            ৳{formatAmount(total)}
                          </Tag>
                        );
                      },
                    },
                    {
                      title: "Posted By",
                      dataIndex: "postedBy",
                      render: (u, rec) => (
                        <div>
                          <div>{u?.fullName || "Admin"}</div>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>
                            {formatDate(rec.createdAt)}
                          </div>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            ),
          },
          {
            key: "settings",
            label: (
              <span>
                <SettingOutlined /> Default Settings
              </span>
            ),
            children: (
              <div style={{ maxWidth: 500, margin: "20px auto" }}>
                <Card title="Organization Savings Interest Policy" size="small">
                  <Form
                    form={settingsForm}
                    layout="vertical"
                    onFinish={handleSaveSettings}
                  >
                    <Form.Item
                      label="General Savings Annual Interest Rate (%)"
                      name="generalSavingsInterestRate"
                      rules={[{ required: true, message: "Please input rate" }]}
                      extra="Annual interest rate for General Savings (e.g., 6.0%)"
                    >
                      <InputNumber
                        min={0}
                        max={100}
                        step={0.1}
                        style={{ width: "100%" }}
                        addonAfter="%"
                      />
                    </Form.Item>

                    <Form.Item
                      label="Special Savings Annual Interest Rate (%)"
                      name="specialSavingsInterestRate"
                      rules={[{ required: true, message: "Please input rate" }]}
                      extra="Annual interest rate for Special Savings (e.g., 7.0%)"
                    >
                      <InputNumber
                        min={0}
                        max={100}
                        step={0.1}
                        style={{ width: "100%" }}
                        addonAfter="%"
                      />
                    </Form.Item>

                    <Form.Item
                      label="Default Compounding Frequency"
                      name="savingsCompoundingInterval"
                      rules={[{ required: true }]}
                      extra="How frequently accrued interest is compounded into the principal balance"
                    >
                      <Select
                        options={[
                          { value: "MONTHLY", label: "Monthly (Every Month)" },
                          {
                            value: "QUARTERLY",
                            label: "Quarterly (Every 3 Months)",
                          },
                          {
                            value: "HALF_YEARLY",
                            label: "Half-Yearly (Every 6 Months)",
                          },
                          {
                            value: "YEARLY",
                            label: "Yearly (Every 12 Months)",
                          },
                        ]}
                      />
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      loading={settingsUpdating}
                      block
                      style={{
                        background: "#059669",
                        borderColor: "#059669",
                        marginTop: 10,
                      }}
                    >
                      Save Organization Settings
                    </Button>
                  </Form>
                </Card>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
}
