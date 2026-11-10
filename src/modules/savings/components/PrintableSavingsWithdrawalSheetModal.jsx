import {
  CalendarOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  DatePicker,
  Empty,
  Modal,
  Radio,
  Select,
  Space,
  Spin,
  Tag,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";

import { useGetActiveBusinessDayQuery } from "../../dayClosing/dayClosingApi.js";
import { formatDate } from "../../loans/loanFormatters.js";
import { useGetAllMembersQuery } from "../../members/membersApi.js";
import { useGetSettingsQuery } from "../../settings/settingsApi.js";
import { useGetSomitiMembersQuery } from "../../somities/somitiesApi.js";
import { useGetSavingsWithdrawalsQuery } from "../savingsApi.js";

const { RangePicker } = DatePicker;

const formatAmount = (val, decimals = 2) => {
  const n = Number(val);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export function PrintableSavingsWithdrawalSheetModal({
  open,
  onClose,
  somities = [],
  defaultSomitiId,
}) {
  const printAreaRef = useRef(null);

  const { data: activeDayData } = useGetActiveBusinessDayQuery(undefined, {
    skip: !open,
  });
  const activeBusinessDate = activeDayData?.data?.businessDate;

  const { data: settingsData } = useGetSettingsQuery(undefined, {
    skip: !open,
  });
  const orgName =
    settingsData?.data?.orgName || "Purbasha Financial Development Organization";

  const [sheetMode, setSheetMode] = useState("posted"); // "posted" | "field"
  const [periodMode, setPeriodMode] = useState("daily"); // "daily" | "monthly" | "range"
  const [modalSomitiId, setModalSomitiId] = useState(
    defaultSomitiId ? String(defaultSomitiId) : "ALL",
  );
  const [savingsTypeFilter, setSavingsTypeFilter] = useState("ALL"); // "ALL" | "GENERAL" | "SPECIAL"

  const [dailyDate, setDailyDate] = useState(dayjs());
  const [selectedMonth, setSelectedMonth] = useState(dayjs().startOf("month"));
  const [customRange, setCustomRange] = useState([
    dayjs().startOf("month"),
    dayjs(),
  ]);

  useEffect(() => {
    if (defaultSomitiId) {
      setModalSomitiId(String(defaultSomitiId));
    }
  }, [defaultSomitiId]);

  useEffect(() => {
    if (activeBusinessDate && open) {
      const bDay = dayjs(activeBusinessDate);
      setDailyDate(bDay);
      setSelectedMonth(bDay.startOf("month"));
      setCustomRange([bDay.startOf("month"), bDay]);
    }
  }, [activeBusinessDate, open]);

  const activeSomiti = useMemo(() => {
    if (!modalSomitiId || modalSomitiId === "ALL") return null;
    return (somities || []).find((s) => String(s.id) === String(modalSomitiId)) || null;
  }, [modalSomitiId, somities]);

  const currentSomitiId = activeSomiti?.id ? Number(activeSomiti.id) : undefined;

  const queryParams = useMemo(() => {
    const params = {
      limit: 500,
      ...(currentSomitiId && { somitiId: currentSomitiId }),
      ...(savingsTypeFilter !== "ALL" && { savingsType: savingsTypeFilter }),
    };

    if (periodMode === "daily" && dailyDate) {
      params.date = dailyDate.format("YYYY-MM-DD");
    } else if (periodMode === "monthly" && selectedMonth) {
      params.startDate = selectedMonth.startOf("month").format("YYYY-MM-DD");
      params.endDate = selectedMonth.endOf("month").format("YYYY-MM-DD");
    } else if (periodMode === "range" && customRange?.[0] && customRange?.[1]) {
      params.startDate = customRange[0].format("YYYY-MM-DD");
      params.endDate = customRange[1].format("YYYY-MM-DD");
    }

    return params;
  }, [
    currentSomitiId,
    savingsTypeFilter,
    periodMode,
    dailyDate,
    selectedMonth,
    customRange,
  ]);

  // 1. Fetch Posted Withdrawals
  const {
    data: withdrawalsData,
    isFetching: withdrawalsLoading,
    isError: withdrawalsError,
    error: withdrawalsErrorObj,
  } = useGetSavingsWithdrawalsQuery(queryParams, {
    skip: !open || sheetMode !== "posted",
  });

  const postedRecords = withdrawalsData?.data?.records || [];
  const postedSummary = withdrawalsData?.data?.summary || {
    totalCount: 0,
    totalAmount: 0,
    generalAmount: 0,
    specialAmount: 0,
  };

  // 2. Fetch Somiti / All Active Members for Blank Field Sheet
  const {
    data: somitiMembersData,
    isFetching: somitiMembersLoading,
    isError: somitiMembersError,
    error: somitiMembersErrorObj,
  } = useGetSomitiMembersQuery(Number(currentSomitiId), {
    skip: !open || sheetMode !== "field" || !currentSomitiId,
  });

  const {
    data: allMembersData,
    isFetching: allMembersLoading,
    isError: allMembersError,
    error: allMembersErrorObj,
  } = useGetAllMembersQuery(
    { page: 1, limit: 500, status: "ACTIVE", sortBy: "memberId", sortOrder: "asc" },
    { skip: !open || sheetMode !== "field" || Boolean(currentSomitiId) },
  );

  const fieldMembers = useMemo(() => {
    const rawList = currentSomitiId
      ? somitiMembersData?.data || []
      : allMembersData?.data || [];
    return [...rawList]
      .filter((m) => m.status === "ACTIVE")
      .sort((a, b) =>
        (a.memberId || "").localeCompare(b.memberId || "", undefined, {
          numeric: true,
        }),
      );
  }, [currentSomitiId, somitiMembersData, allMembersData]);

  const fieldTotals = useMemo(() => {
    return fieldMembers.reduce(
      (acc, m) => {
        const gen = Number(m.savingsAccount?.generalSavingsBalance || 0);
        const spc = Number(m.savingsAccount?.specialSavingsBalance || 0);
        acc.general += gen;
        acc.special += spc;
        return acc;
      },
      { general: 0, special: 0 },
    );
  }, [fieldMembers]);

  const isLoading =
    sheetMode === "posted"
      ? withdrawalsLoading
      : currentSomitiId
        ? somitiMembersLoading
        : allMembersLoading;
  const activeError =
    sheetMode === "posted"
      ? withdrawalsError
        ? withdrawalsErrorObj
        : null
      : currentSomitiId
        ? somitiMembersError
          ? somitiMembersErrorObj
          : null
        : allMembersError
          ? allMembersErrorObj
          : null;

  const officerName =
    activeSomiti?.fieldOfficer?.fullName ||
    activeSomiti?.fieldOfficer?.userName ||
    "All Field Officers";

  const periodLabel = useMemo(() => {
    if (periodMode === "all") return "All Dates";
    if (periodMode === "daily" && dailyDate) {
      return `${dailyDate.format("DD MMMM, YYYY")} (${dailyDate.format("dddd")})`;
    }
    if (periodMode === "monthly" && selectedMonth) {
      return selectedMonth.format("MMMM YYYY");
    }
    if (periodMode === "range" && customRange?.[0] && customRange?.[1]) {
      return `${customRange[0].format("DD MMM YYYY")} – ${customRange[1].format("DD MMM YYYY")}`;
    }
    return "—";
  }, [periodMode, dailyDate, selectedMonth, customRange]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1180}
      style={{ top: 20 }}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button
          key="print"
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
        >
          Print / Save PDF
        </Button>,
      ]}
      title={
        <div className="no-print" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PrinterOutlined style={{ color: "#e11d48", fontSize: 18 }} />
          <span style={{ fontWeight: 700 }}>Savings Withdrawal Sheet (Print Preview)</span>
        </div>
      }
      destroyOnClose
    >
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
          body * {
            visibility: hidden !important;
          }
          .savings-withdrawal-print-root,
          .savings-withdrawal-print-root * {
            visibility: visible !important;
          }
          .no-print {
            display: none !important;
          }
          .ant-modal-wrap,
          .ant-modal,
          .ant-modal-content,
          .ant-modal-body {
            position: static !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            background: transparent !important;
          }
          .preview-container {
            padding: 0 !important;
            margin: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            background: transparent !important;
          }
          .savings-withdrawal-print-root {
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .sw-print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 9.5px !important;
          }
          .sw-print-table th,
          .sw-print-table td {
            border: 1px solid #111 !important;
            padding: 4px 5px !important;
            line-height: 1.25 !important;
          }
          .sw-print-table tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .sw-print-table th {
            background-color: #f0f0f0 !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .sw-blank-box {
            height: 28px !important;
            min-height: 28px !important;
            background: #fff !important;
          }
        }

        .preview-container {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 6px;
          max-height: 72vh;
          overflow: auto;
        }
        .savings-withdrawal-print-root {
          background: #fff;
          padding: 18px 22px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          color: #111;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          min-width: 920px;
        }
        .sw-print-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          font-size: 11px;
        }
        .sw-print-table th,
        .sw-print-table td {
          border: 1px solid #333;
          padding: 5px 6px;
        }
        .sw-print-table th {
          background-color: #f3f4f6;
          font-weight: 600;
          text-align: center;
        }
        .sw-blank-box {
          height: 28px;
          min-height: 28px;
          background: #fafafa;
        }
      `}</style>

      {/* Filter Controls Bar */}
      <div
        className="no-print"
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 12,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Space wrap>
            <span style={{ fontWeight: 600, fontSize: 12, color: "#334155" }}>
              Sheet Mode:
            </span>
            <Radio.Group
              value={sheetMode}
              onChange={(e) => setSheetMode(e.target.value)}
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="posted">
                Posted Withdrawal Register
              </Radio.Button>
              <Radio.Button value="field">
                Field Withdrawal Sheet (Blank)
              </Radio.Button>
            </Radio.Group>
          </Space>

          <Space wrap>
            <span style={{ fontWeight: 600, fontSize: 12, color: "#334155" }}>
              Somiti:
            </span>
            <Select
              value={modalSomitiId}
              onChange={setModalSomitiId}
              size="small"
              style={{ width: 220 }}
              showSearch
              optionFilterProp="label"
              options={[
                { value: "ALL", label: "All Somities (Branch-wide)" },
                ...(somities || []).map((s) => ({
                  value: String(s.id),
                  label: `${s.name} (${s.somitiId || s.code || ""})`,
                })),
              ]}
            />
          </Space>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Space wrap>
            <span style={{ fontWeight: 600, fontSize: 12, color: "#334155" }}>
              Period:
            </span>
            <Radio.Group
              value={periodMode}
              onChange={(e) => setPeriodMode(e.target.value)}
              size="small"
            >
              <Radio.Button value="daily">Daily</Radio.Button>
              <Radio.Button value="monthly">Monthly</Radio.Button>
              <Radio.Button value="range">Custom Range</Radio.Button>
              {sheetMode === "posted" && (
                <Radio.Button value="all">All Dates</Radio.Button>
              )}
            </Radio.Group>

            {periodMode === "daily" && (
              <DatePicker
                size="small"
                value={dailyDate}
                onChange={(d) => d && setDailyDate(d)}
                format="DD MMM YYYY"
                allowClear={false}
                suffixIcon={<CalendarOutlined />}
              />
            )}
            {periodMode === "monthly" && (
              <DatePicker
                size="small"
                picker="month"
                value={selectedMonth}
                onChange={(d) => d && setSelectedMonth(d)}
                format="MMMM YYYY"
                allowClear={false}
              />
            )}
            {periodMode === "range" && (
              <RangePicker
                size="small"
                value={customRange}
                onChange={(vals) => vals && setCustomRange(vals)}
                format="DD MMM YYYY"
                allowClear={false}
              />
            )}
          </Space>

          {sheetMode === "posted" && (
            <Space wrap>
              <span style={{ fontWeight: 600, fontSize: 12, color: "#334155" }}>
                Savings Type:
              </span>
              <Radio.Group
                value={savingsTypeFilter}
                onChange={(e) => setSavingsTypeFilter(e.target.value)}
                size="small"
              >
                <Radio.Button value="ALL">All</Radio.Button>
                <Radio.Button value="GENERAL">General</Radio.Button>
                <Radio.Button value="SPECIAL">Special</Radio.Button>
              </Radio.Group>
            </Space>
          )}
        </div>
      </div>

      {/* Print Preview Area */}
      <div className="preview-container">
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Spin size="large" tip="Loading withdrawal sheet data..." />
          </div>
        ) : activeError ? (
          <Alert
            type="error"
            showIcon
            message="Failed to load savings withdrawal sheet data"
            description={
              activeError?.data?.message ||
              activeError?.message ||
              "Please check your connection and try again."
            }
          />
        ) : (
          <div className="savings-withdrawal-print-root" ref={printAreaRef}>
            {/* Organization Header */}
            <div style={{ textAlign: "center", marginBottom: 6 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: "bold",
                  letterSpacing: "0.5px",
                }}
              >
                {orgName}
              </h1>
              <p style={{ margin: "1px 0 0 0", fontSize: 11.5, color: "#333" }}>
                Microfinance &amp; Member Savings Program
              </p>
              <div
                style={{
                  display: "inline-block",
                  marginTop: 4,
                  padding: "2px 18px",
                  border: "1.2px solid #222",
                  borderRadius: 3,
                  fontWeight: "bold",
                  fontSize: 12,
                }}
              >
                {sheetMode === "posted"
                  ? "Savings Withdrawal Register Sheet (Posted Payouts)"
                  : "Savings Withdrawal Field Sheet (Member Request & Signature)"}
              </div>
            </div>

            {/* Meta Info Bar */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                border: "1px solid #333",
                background: "#fdfdfd",
                padding: "4px 8px",
                fontSize: 10.5,
                marginBottom: 6,
              }}
            >
              <div>
                <strong>Somiti: </strong>
                <span>{activeSomiti ? activeSomiti.name : "All Somities"}</span>
                {activeSomiti?.code && (
                  <span style={{ marginLeft: 3 }}>
                    ({activeSomiti.somitiId || activeSomiti.code})
                  </span>
                )}
              </div>
              <div>
                <strong>Period: </strong>
                <span>{periodLabel}</span>
              </div>
              <div>
                <strong>Filter: </strong>
                <span>
                  {sheetMode === "posted"
                    ? `${savingsTypeFilter} Savings`
                    : "Active Savings Accounts"}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <strong>Field Officer: </strong>
                <span>{officerName}</span>
              </div>
            </div>

            {/* Sheet Table Content */}
            {sheetMode === "posted" ? (
              postedRecords.length === 0 ? (
                <Empty
                  description="No savings withdrawals recorded for the selected period & Somiti"
                  style={{ padding: "36px 0" }}
                >
                  <Space wrap className="no-print">
                    {periodMode !== "all" && (
                      <Button size="small" onClick={() => setPeriodMode("all")}>
                        Show All Dates
                      </Button>
                    )}
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => setSheetMode("field")}
                    >
                      Open Field Withdrawal Sheet (Blank)
                    </Button>
                  </Space>
                </Empty>
              ) : (
                <table className="sw-print-table">
                  <thead>
                    <tr>
                      <th style={{ width: "3.5%" }}>SL</th>
                      <th style={{ width: "9%" }}>TRX ID</th>
                      <th style={{ width: "8.5%" }}>Date</th>
                      <th style={{ width: "8%" }}>Member ID</th>
                      <th style={{ width: "16%", textAlign: "left" }}>
                        Member Name
                      </th>
                      <th style={{ width: "10%" }}>Somiti</th>
                      <th style={{ width: "7.5%" }}>Type</th>
                      <th style={{ width: "9%", textAlign: "right" }}>
                        Prev. Bal
                      </th>
                      <th
                        style={{
                          width: "10%",
                          textAlign: "right",
                          background: "#fff1f2",
                        }}
                      >
                        Withdrawn Amt
                      </th>
                      <th style={{ width: "9%", textAlign: "right" }}>
                        New Bal
                      </th>
                      <th style={{ width: "7%" }}>Method</th>
                      <th style={{ width: "12%" }}>Member Signature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {postedRecords.map((rec, idx) => (
                      <tr key={rec.id || idx}>
                        <td style={{ textAlign: "center", fontWeight: "bold" }}>
                          {idx + 1}
                        </td>
                        <td
                          style={{
                            textAlign: "center",
                            fontFamily: "monospace",
                            fontSize: 10,
                          }}
                        >
                          {rec.transactionId}
                        </td>
                        <td style={{ textAlign: "center", fontSize: 10 }}>
                          {formatDate(rec.dhakaDate || rec.transactionDate)}
                        </td>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>
                          {rec.member?.memberId || "—"}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>
                            {rec.member?.fullName || "—"}
                          </div>
                          {(rec.member?.guardianName || rec.member?.fatherName) && (
                            <div style={{ fontSize: 9, color: "#64748b" }}>
                              G: {rec.member?.guardianName || rec.member?.fatherName}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: "center", fontSize: 9.5 }}>
                          {rec.member?.somiti?.name || "—"}
                        </td>
                        <td style={{ textAlign: "center", fontSize: 9.5, fontWeight: 600 }}>
                          {rec.savingsType}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {formatAmount(rec.balanceBefore)}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 700,
                            background: "#fff1f2",
                          }}
                        >
                          {formatAmount(rec.amount)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {formatAmount(rec.balanceAfter)}
                        </td>
                        <td style={{ textAlign: "center", fontSize: 9.5 }}>
                          {rec.paymentMethod?.replace(/_/g, " ") || "CASH"}
                        </td>
                        <td className="sw-blank-box"></td>
                      </tr>
                    ))}

                    <tr style={{ background: "#f8f9fa", fontWeight: "bold" }}>
                      <td colSpan={8} style={{ textAlign: "right", paddingRight: 8 }}>
                        Total Withdrawals ({postedSummary.totalCount} Vouchers | Gen:{" "}
                        {formatAmount(postedSummary.generalAmount)} | Spc:{" "}
                        {formatAmount(postedSummary.specialAmount)}):
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontSize: 11,
                          background: "#ffe4e6",
                        }}
                      >
                        {formatAmount(postedSummary.totalAmount)}
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                  </tbody>
                </table>
              )
            ) : fieldMembers.length === 0 ? (
              <Empty
                description="No active members found for the selected Somiti"
                style={{ padding: "36px 0" }}
              />
            ) : (
              <table className="sw-print-table">
                <thead>
                  <tr>
                    <th style={{ width: "4%" }}>SL</th>
                    <th style={{ width: "9%" }}>Member ID</th>
                    <th style={{ width: "18%", textAlign: "left" }}>
                      Member Name &amp; Guardian
                    </th>
                    <th style={{ width: "10.5%" }}>Mobile</th>
                    <th style={{ width: "10%", textAlign: "right" }}>
                      General Bal
                    </th>
                    <th style={{ width: "10%", textAlign: "right" }}>
                      Special Bal
                    </th>
                    <th style={{ width: "9%", background: "#fff1f2" }}>
                      Type (Gen/Spc)
                    </th>
                    <th style={{ width: "12%", background: "#fff1f2" }}>
                      Withdraw Amount
                    </th>
                    <th style={{ width: "17.5%" }}>Member Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldMembers.map((m, idx) => (
                    <tr key={m.id || idx}>
                      <td style={{ textAlign: "center", fontWeight: "bold" }}>
                        {idx + 1}
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 600 }}>
                        {m.memberId || ""}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{m.fullName || ""}</div>
                        {(m.guardianName || m.fatherName) && (
                          <div style={{ fontSize: 9, color: "#64748b" }}>
                            G: {m.guardianName || m.fatherName}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "center", fontSize: 10 }}>
                        {m.mobileNumber || ""}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {formatAmount(m.savingsAccount?.generalSavingsBalance || 0)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {formatAmount(m.savingsAccount?.specialSavingsBalance || 0)}
                      </td>
                      <td className="sw-blank-box" style={{ background: "#fff5f5" }}></td>
                      <td className="sw-blank-box" style={{ background: "#fff5f5" }}></td>
                      <td className="sw-blank-box"></td>
                    </tr>
                  ))}

                  <tr style={{ background: "#f8f9fa", fontWeight: "bold" }}>
                    <td colSpan={4} style={{ textAlign: "right", paddingRight: 8 }}>
                      Total Savings Liability ({fieldMembers.length} Members):
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatAmount(fieldTotals.general)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatAmount(fieldTotals.special)}
                    </td>
                    <td className="sw-blank-box"></td>
                    <td className="sw-blank-box"></td>
                    <td className="sw-blank-box"></td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* Signature Footer */}
            <div
              style={{
                marginTop: 40,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                padding: "0 16px",
              }}
            >
              <div style={{ textAlign: "center", width: "26%" }}>
                <div
                  style={{
                    borderTop: "1.2px solid #222",
                    paddingTop: 4,
                    fontWeight: "bold",
                    fontSize: 10.5,
                  }}
                >
                  Field Officer Signature &amp; Date
                </div>
                <div style={{ fontSize: 9.5, color: "#666" }}>Verifier</div>
              </div>

              <div style={{ textAlign: "center", width: "26%" }}>
                <div
                  style={{
                    borderTop: "1.2px solid #222",
                    paddingTop: 4,
                    fontWeight: "bold",
                    fontSize: 10.5,
                  }}
                >
                  Accountant / Cashier Signature
                </div>
                <div style={{ fontSize: 9.5, color: "#666" }}>Disbursed By</div>
              </div>

              <div style={{ textAlign: "center", width: "26%" }}>
                <div
                  style={{
                    borderTop: "1.2px solid #222",
                    paddingTop: 4,
                    fontWeight: "bold",
                    fontSize: 10.5,
                  }}
                >
                  Branch Manager Signature &amp; Seal
                </div>
                <div style={{ fontSize: 9.5, color: "#666" }}>
                  Authorized Approver
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 9,
                color: "#777",
                display: "flex",
                justifyContent: "space-between",
                borderTop: "1px dashed #ccc",
                paddingTop: 3,
              }}
            >
              <span>Print Time: {new Date().toLocaleString()}</span>
              <span>Software: {orgName} — Microfinance Management System</span>
              <span>Page: 01 / 01</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
