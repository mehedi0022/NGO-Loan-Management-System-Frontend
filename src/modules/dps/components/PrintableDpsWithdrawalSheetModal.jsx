import { CalendarOutlined, PrinterOutlined } from "@ant-design/icons";
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
import { useGetSettingsQuery } from "../../settings/settingsApi.js";
import {
  useGetDpsAccountsQuery,
  useGetDpsWithdrawalsQuery,
} from "../dpsApi.js";

const { RangePicker } = DatePicker;

const formatAmount = (val, decimals = 2) => {
  const n = Number(val);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const getTotalInstallments = (acc) => {
  if (!acc) return 0;
  return acc.frequency === "WEEKLY"
    ? Math.round(((acc.durationMonths || 12) / 12) * 52)
    : acc.durationMonths || 0;
};

export function PrintableDpsWithdrawalSheetModal({
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

  const [sheetMode, setSheetMode] = useState("field"); // "field" | "posted"
  const [periodMode, setPeriodMode] = useState("daily"); // "daily" | "monthly" | "range" | "all"
  const [modalSomitiId, setModalSomitiId] = useState(
    defaultSomitiId ? String(defaultSomitiId) : "ALL",
  );
  const [closeTypeFilter, setCloseTypeFilter] = useState("ALL"); // "ALL" | "MATURITY_PAYOUT" | "PREMATURE_CLOSE"
  const [fieldStatusFilter, setFieldStatusFilter] = useState("ELIGIBLE"); // "ELIGIBLE" (ACTIVE+MATURED) | "MATURED" | "ACTIVE"

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
    return (
      (somities || []).find((s) => String(s.id) === String(modalSomitiId)) ||
      null
    );
  }, [modalSomitiId, somities]);

  const currentSomitiId = activeSomiti?.id ? Number(activeSomiti.id) : undefined;

  const queryParams = useMemo(() => {
    const params = {
      limit: 500,
      ...(currentSomitiId && { somitiId: currentSomitiId }),
      ...(closeTypeFilter !== "ALL" && { closeType: closeTypeFilter }),
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
    closeTypeFilter,
    periodMode,
    dailyDate,
    selectedMonth,
    customRange,
  ]);

  // 1. Fetch Posted DPS Withdrawals / Settlements
  const {
    data: withdrawalsData,
    isFetching: withdrawalsLoading,
    isError: withdrawalsError,
    error: withdrawalsErrorObj,
  } = useGetDpsWithdrawalsQuery(queryParams, {
    skip: !open || sheetMode !== "posted",
  });

  const postedRecords = withdrawalsData?.data?.records || [];
  const postedSummary = withdrawalsData?.data?.summary || {
    totalCount: 0,
    totalPayoutAmount: 0,
    totalDepositedPrincipal: 0,
    maturityCount: 0,
    prematureCount: 0,
  };

  const postedProfitTotal = useMemo(() => {
    return postedRecords.reduce(
      (sum, rec) => sum + Number(rec.profitOrAdjustment || 0),
      0,
    );
  }, [postedRecords]);

  // 2. Fetch Active / Matured DPS Accounts for Blank Field Sheet
  const {
    data: fieldDpsData,
    isFetching: fieldDpsLoading,
    isError: fieldDpsError,
    error: fieldDpsErrorObj,
  } = useGetDpsAccountsQuery(
    {
      page: 1,
      limit: 500,
      ...(currentSomitiId && { somitiId: currentSomitiId }),
      ...(fieldStatusFilter !== "ELIGIBLE"
        ? { status: fieldStatusFilter }
        : { excludeClosed: true }),
    },
    { skip: !open || sheetMode !== "field" },
  );

  const fieldAccounts = useMemo(() => {
    const raw =
      fieldDpsData?.data?.accounts ||
      (Array.isArray(fieldDpsData?.data) ? fieldDpsData.data : []);
    return [...raw]
      .filter((acc) => {
        if (fieldStatusFilter === "MATURED") return acc.status === "MATURED";
        if (fieldStatusFilter === "ACTIVE") return acc.status === "ACTIVE";
        return acc.status === "ACTIVE" || acc.status === "MATURED";
      })
      .sort((a, b) =>
        (a.member?.memberId || a.dpsNumber || "").localeCompare(
          b.member?.memberId || b.dpsNumber || "",
          undefined,
          { numeric: true },
        ),
      );
  }, [fieldDpsData, fieldStatusFilter]);

  const fieldTotals = useMemo(() => {
    return fieldAccounts.reduce(
      (acc, item) => {
        acc.deposited += Number(item.totalPaidAmount || 0);
        acc.maturity += Number(item.maturityAmount || 0);
        return acc;
      },
      { deposited: 0, maturity: 0 },
    );
  }, [fieldAccounts]);

  const isLoading =
    sheetMode === "posted" ? withdrawalsLoading : fieldDpsLoading;
  const activeError =
    sheetMode === "posted"
      ? withdrawalsError
        ? withdrawalsErrorObj
        : null
      : fieldDpsError
        ? fieldDpsErrorObj
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

  const closeTypeLabel =
    closeTypeFilter === "MATURITY_PAYOUT"
      ? "Maturity Payout Only"
      : closeTypeFilter === "PREMATURE_CLOSE"
        ? "Premature Break Only"
        : "All Settlements";

  const fieldFilterLabel =
    fieldStatusFilter === "MATURED"
      ? "Matured DPS Accounts"
      : fieldStatusFilter === "ACTIVE"
        ? "Active DPS Accounts"
        : "Active & Matured DPS";

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1200}
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
        <div
          className="no-print"
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          <PrinterOutlined style={{ color: "#e11d48", fontSize: 18 }} />
          <span style={{ fontWeight: 700 }}>
            DPS Withdrawal &amp; Settlement Sheet (Print Preview)
          </span>
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
          .dps-withdrawal-print-root,
          .dps-withdrawal-print-root * {
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
          .dw-preview-container {
            padding: 0 !important;
            margin: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            background: transparent !important;
          }
          .dps-withdrawal-print-root {
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .dw-print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 9px !important;
          }
          .dw-print-table th,
          .dw-print-table td {
            border: 1px solid #111 !important;
            padding: 4px 5px !important;
            line-height: 1.25 !important;
          }
          .dw-print-table tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .dw-print-table th {
            background-color: #f0f0f0 !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .dw-blank-box {
            height: 28px !important;
            min-height: 28px !important;
            background: #fff !important;
          }
        }

        .dw-preview-container {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 6px;
          max-height: 72vh;
          overflow: auto;
        }
        .dps-withdrawal-print-root {
          background: #fff;
          padding: 18px 22px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          color: #111;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          min-width: 960px;
        }
        .dw-print-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          font-size: 10.5px;
        }
        .dw-print-table th,
        .dw-print-table td {
          border: 1px solid #333;
          padding: 5px 6px;
        }
        .dw-print-table th {
          background-color: #f3f4f6;
          font-weight: 600;
          text-align: center;
        }
        .dw-blank-box {
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
              <Radio.Button value="field">
                Field DPS Withdrawal &amp; Break Sheet (Blank)
              </Radio.Button>
              <Radio.Button value="posted">
                Posted Settlement Register
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

          {sheetMode === "posted" ? (
            <Space wrap>
              <span style={{ fontWeight: 600, fontSize: 12, color: "#334155" }}>
                Settlement Type:
              </span>
              <Radio.Group
                value={closeTypeFilter}
                onChange={(e) => setCloseTypeFilter(e.target.value)}
                size="small"
              >
                <Radio.Button value="ALL">All</Radio.Button>
                <Radio.Button value="MATURITY_PAYOUT">Maturity</Radio.Button>
                <Radio.Button value="PREMATURE_CLOSE">Premature Break</Radio.Button>
              </Radio.Group>
            </Space>
          ) : (
            <Space wrap>
              <span style={{ fontWeight: 600, fontSize: 12, color: "#334155" }}>
                Account Status:
              </span>
              <Radio.Group
                value={fieldStatusFilter}
                onChange={(e) => setFieldStatusFilter(e.target.value)}
                size="small"
              >
                <Radio.Button value="ELIGIBLE">Active &amp; Matured</Radio.Button>
                <Radio.Button value="MATURED">Matured Only</Radio.Button>
                <Radio.Button value="ACTIVE">Active Only</Radio.Button>
              </Radio.Group>
            </Space>
          )}
        </div>
      </div>

      {/* Print Preview Area */}
      <div className="dw-preview-container">
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Spin size="large" tip="Loading DPS withdrawal sheet data..." />
          </div>
        ) : activeError ? (
          <Alert
            type="error"
            showIcon
            message="Failed to load DPS withdrawal sheet data"
            description={
              activeError?.data?.message ||
              activeError?.message ||
              "Please check your connection and try again."
            }
          />
        ) : (
          <div className="dps-withdrawal-print-root" ref={printAreaRef}>
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
                Deposit Pension Scheme (DPS) Program
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
                  ? "DPS Withdrawal & Settlement Register Sheet (Posted Payouts)"
                  : "DPS Withdrawal Field Sheet (Member Payout Request & Signature)"}
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
                  {sheetMode === "posted" ? closeTypeLabel : fieldFilterLabel}
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
                  description="No DPS withdrawals or settlements recorded for the selected period & Somiti"
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
                      Open Field DPS Withdrawal &amp; Break Sheet
                    </Button>
                  </Space>
                </Empty>
              ) : (
                <table className="dw-print-table">
                  <thead>
                    <tr>
                      <th style={{ width: "3%" }}>SL</th>
                      <th style={{ width: "8%" }}>TRX ID</th>
                      <th style={{ width: "7.5%" }}>Date</th>
                      <th style={{ width: "8.5%" }}>DPS No.</th>
                      <th style={{ width: "7%" }}>Member ID</th>
                      <th style={{ width: "14%", textAlign: "left" }}>
                        Member Name
                      </th>
                      <th style={{ width: "9.5%" }}>Settlement Type</th>
                      <th style={{ width: "6%" }}>Paid Inst.</th>
                      <th style={{ width: "8.5%", textAlign: "right" }}>
                        Principal Paid
                      </th>
                      <th
                        style={{
                          width: "9.5%",
                          textAlign: "right",
                          background: "#fff1f2",
                        }}
                      >
                        Payout Amount
                      </th>
                      <th style={{ width: "8%", textAlign: "right" }}>
                        Profit / Adj.
                      </th>
                      <th style={{ width: "6.5%" }}>Method</th>
                      <th style={{ width: "13%" }}>Member Signature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {postedRecords.map((rec, idx) => {
                      const acc = rec.dpsAccount || {};
                      const member = acc.member || {};
                      const totalInst = getTotalInstallments(acc);
                      const isMaturity = rec.type === "MATURITY_PAYOUT";

                      return (
                        <tr key={rec.id || idx}>
                          <td style={{ textAlign: "center", fontWeight: "bold" }}>
                            {idx + 1}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              fontFamily: "monospace",
                              fontSize: 9.5,
                            }}
                          >
                            {rec.transactionId || "—"}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {formatDate(rec.transactionDate)}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              fontFamily: "monospace",
                              fontWeight: 600,
                            }}
                          >
                            {acc.dpsNumber || "—"}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              fontFamily: "monospace",
                            }}
                          >
                            {member.memberId || "—"}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            <div>{member.fullName || "—"}</div>
                            {member.somiti?.name && (
                              <div
                                style={{
                                  fontSize: 9,
                                  color: "#555",
                                  fontWeight: 400,
                                }}
                              >
                                {member.somiti.name}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <Tag
                              color={isMaturity ? "green" : "red"}
                              style={{ margin: 0, fontSize: 9.5 }}
                            >
                              {isMaturity ? "Maturity" : "Premature"}
                            </Tag>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {acc.paidInstallments || 0}/{totalInst}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {formatAmount(rec.principalPaid)}
                          </td>
                          <td
                            style={{
                              textAlign: "right",
                              fontWeight: "bold",
                              color: "#be123c",
                              background: "#fff5f5",
                            }}
                          >
                            {formatAmount(rec.amount)}
                          </td>
                          <td
                            style={{
                              textAlign: "right",
                              color:
                                Number(rec.profitOrAdjustment) >= 0
                                  ? "#047857"
                                  : "#b45309",
                            }}
                          >
                            {formatAmount(rec.profitOrAdjustment)}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {rec.paymentMethod || "CASH"}
                          </td>
                          <td className="dw-blank-box"></td>
                        </tr>
                      );
                    })}

                    <tr style={{ background: "#f8f9fa", fontWeight: "bold" }}>
                      <td
                        colSpan={8}
                        style={{ textAlign: "right", paddingRight: 8 }}
                      >
                        Total Settlements ({postedSummary.totalCount} | Maturity:{" "}
                        {postedSummary.maturityCount}, Premature:{" "}
                        {postedSummary.prematureCount}):
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {formatAmount(postedSummary.totalDepositedPrincipal)}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          color: "#be123c",
                          background: "#ffe4e6",
                        }}
                      >
                        {formatAmount(postedSummary.totalPayoutAmount)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {formatAmount(postedProfitTotal)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tbody>
                </table>
              )
            ) : fieldAccounts.length === 0 ? (
              <Empty
                description="No eligible DPS accounts found for the selected Somiti & status filter"
                style={{ padding: "36px 0" }}
              />
            ) : (
              <table className="dw-print-table">
                <thead>
                  <tr>
                    <th style={{ width: "3.5%" }}>SL</th>
                    <th style={{ width: "9%" }}>DPS No.</th>
                    <th style={{ width: "7.5%" }}>Member ID</th>
                    <th style={{ width: "16%", textAlign: "left" }}>
                      Member Name &amp; Somiti
                    </th>
                    <th style={{ width: "9.5%" }}>Mobile</th>
                    <th style={{ width: "8%" }}>Tenure</th>
                    <th style={{ width: "7%" }}>Paid Inst.</th>
                    <th style={{ width: "10%", textAlign: "right" }}>
                      Deposited Amt
                    </th>
                    <th style={{ width: "10%", textAlign: "right" }}>
                      Maturity Value
                    </th>
                    <th style={{ width: "9.5%", background: "#fff1f2" }}>
                      Break / Payout Amt
                    </th>
                    <th style={{ width: "10%" }}>Member Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldAccounts.map((acc, idx) => {
                    const member = acc.member || {};
                    const totalInst = getTotalInstallments(acc);

                    return (
                      <tr key={acc.id || idx}>
                        <td style={{ textAlign: "center", fontWeight: "bold" }}>
                          {idx + 1}
                        </td>
                        <td
                          style={{
                            textAlign: "center",
                            fontFamily: "monospace",
                            fontWeight: 600,
                          }}
                        >
                          {acc.dpsNumber}
                        </td>
                        <td
                          style={{
                            textAlign: "center",
                            fontFamily: "monospace",
                          }}
                        >
                          {member.memberId || "—"}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>
                            {member.fullName || "—"}
                          </div>
                          {member.somiti?.name && (
                            <div style={{ fontSize: 9, color: "#555" }}>
                              {member.somiti.name}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: "center", fontSize: 10 }}>
                          {member.mobileNumber || "—"}
                        </td>
                        <td style={{ textAlign: "center", fontSize: 10 }}>
                          <div>
                            {acc.durationMonths}m (
                            {acc.frequency === "WEEKLY" ? "Wk" : "Mo"})
                          </div>
                          <div style={{ fontSize: 9, color: "#555" }}>
                            {acc.status === "ACTIVE" ? "Active (Breakable)" : acc.status}
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {acc.paidInstallments || 0}/{totalInst}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          {formatAmount(acc.totalPaidAmount)}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 600,
                            color: "#0369a1",
                          }}
                        >
                          {formatAmount(acc.maturityAmount)}
                        </td>
                        <td
                          className="dw-blank-box"
                          style={{ background: "#fff5f5" }}
                        ></td>
                        <td className="dw-blank-box"></td>
                      </tr>
                    );
                  })}

                  <tr style={{ background: "#f8f9fa", fontWeight: "bold" }}>
                    <td
                      colSpan={7}
                      style={{ textAlign: "right", paddingRight: 8 }}
                    >
                      Total DPS Liability ({fieldAccounts.length} Accounts):
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatAmount(fieldTotals.deposited)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatAmount(fieldTotals.maturity)}
                    </td>
                    <td className="dw-blank-box"></td>
                    <td className="dw-blank-box"></td>
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
