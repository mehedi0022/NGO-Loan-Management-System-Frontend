import { PrinterOutlined } from "@ant-design/icons";
import { Button, Modal, Space, Typography } from "antd";
import { formatCurrency, formatDate } from "../../loans/loanFormatters.js";

export function PrintableReportModal({
  open,
  onClose,
  reportType,
  title,
  subtitle,
  data = [],
  summary = {},
  currentUser,
}) {
  const handlePrint = () => {
    window.print();
  };

  const nowFormatted = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1200}
      style={{ top: 20 }}
      title={
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingRight: 24,
          }}
        >
          <Space>
            <PrinterOutlined style={{ fontSize: 18, color: "#1890ff" }} />
            <Typography.Text strong style={{ fontSize: 16 }}>
              Print Preview — {title}
            </Typography.Text>
          </Space>
          <Space>
            <Button onClick={onClose}>Close</Button>
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
              Print Report / Save PDF
            </Button>
          </Space>
        </div>
      }
      footer={
        <div className="no-print" style={{ display: "flex", justifyContent: "flex-end" }}>
          <Space>
            <Button onClick={onClose}>Close</Button>
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
              Print Report / Save PDF
            </Button>
          </Space>
        </div>
      }
      destroyOnClose
    >
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 6mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            background: #fff !important;
          }
          #root {
            display: none !important;
          }
          .ant-modal-root,
          .ant-modal-wrap {
            position: static !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
            background: none !important;
          }
          .ant-modal-mask,
          .ant-modal-header,
          .ant-modal-footer,
          .ant-modal-close,
          .no-print {
            display: none !important;
          }
          .ant-modal {
            position: static !important;
            top: 0 !important;
            left: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          .ant-modal-content {
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
          }
          .preview-container {
            padding: 0 !important;
            margin: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            background: transparent !important;
          }
          .report-print-root {
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .report-table th,
          .report-table td {
            font-size: 10px !important;
            padding: 4px 6px !important;
          }
        }

        .preview-container {
          background: #f3f4f6;
          padding: 16px;
          border-radius: 8px;
          max-height: 75vh;
          overflow-y: auto;
        }
        .report-print-root {
          background: #fff;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          color: #111827;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        }
        .report-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          margin-bottom: 16px;
        }
        .report-table th {
          background-color: #f8fafc;
          color: #0f172a;
          font-weight: 600;
          font-size: 11px;
          text-align: left;
          padding: 6px 8px;
          border: 1px solid #cbd5e1;
        }
        .report-table td {
          font-size: 11px;
          padding: 6px 8px;
          border: 1px solid #e2e8f0;
          color: #334155;
        }
        .report-table tr:nth-child(even) td {
          background-color: #fbfcfe;
        }
        .report-table tfoot td {
          background-color: #f1f5f9;
          font-weight: 700;
          color: #0f172a;
          border-top: 2px solid #94a3b8;
        }
      `}</style>

      <div className="preview-container">
        <div className="report-print-root">
          {/* Organization Header */}
          <div
            style={{
              textAlign: "center",
              borderBottom: "2px solid #0f172a",
              paddingBottom: 10,
              marginBottom: 12,
            }}
          >
            <h1
              style={{
                margin: "0 0 2px 0",
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: 0.5,
                color: "#1e293b",
                textTransform: "uppercase",
              }}
            >
              Purbasha Financial Development Organization
            </h1>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Microfinance & Community Loan Management System
            </div>
            <div
              style={{
                display: "inline-block",
                marginTop: 6,
                padding: "2px 14px",
                background: "#0284c7",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                borderRadius: 4,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {title}
            </div>
          </div>

          {/* Metadata Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "#475569",
              padding: "6px 8px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 4,
              marginBottom: 12,
            }}
          >
            <div>
              <strong>Filter Scope:</strong> {subtitle || "All Records"}
            </div>
            <div style={{ textAlign: "right" }}>
              <span>
                <strong>Generated On:</strong> {nowFormatted} |{" "}
                <strong>Printed By:</strong> {currentUser?.fullName || "Staff"}
              </span>
            </div>
          </div>

          {/* Summary KPIs Strip */}
          {summary && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: 8,
                marginBottom: 12,
              }}
            >
              {reportType === "daily-collections" && (
                <>
                  <SummaryBox label="Total Collections" value={summary.totalTransactions ?? 0} />
                  <SummaryBox
                    label="Loan Principal/Return"
                    value={formatCurrency(summary.totalLoanAmount ?? 0)}
                  />
                  <SummaryBox
                    label="General Savings"
                    value={formatCurrency(summary.totalGeneralSavingsAmount ?? 0)}
                  />
                  <SummaryBox
                    label="Special Savings"
                    value={formatCurrency(summary.totalSpecialSavingsAmount ?? 0)}
                  />
                  <SummaryBox
                    label="DPS Installments"
                    value={formatCurrency(summary.totalDpsAmount ?? 0)}
                  />
                  <SummaryBox
                    label="Grand Total Collected"
                    value={formatCurrency(summary.totalCollectedAmount ?? 0)}
                    highlight
                  />
                </>
              )}
              {reportType === "dps-summary" && (
                <>
                  <SummaryBox label="Total Accounts" value={summary.totalAccounts ?? 0} />
                  <SummaryBox label="Active Accounts" value={summary.activeAccounts ?? 0} />
                  <SummaryBox
                    label="Monthly Demand"
                    value={formatCurrency(summary.totalMonthlyDemand ?? 0)}
                  />
                  <SummaryBox
                    label="Total Deposited"
                    value={formatCurrency(summary.totalPaidAmount ?? 0)}
                  />
                  <SummaryBox
                    label="Maturity Liability"
                    value={formatCurrency(summary.totalMaturityLiability ?? 0)}
                    highlight
                  />
                </>
              )}
              {reportType === "loan-portfolio" && (
                <>
                  <SummaryBox label="Active/Total Loans" value={summary.totalLoans ?? 0} />
                  <SummaryBox
                    label="Disbursed Principal"
                    value={formatCurrency(summary.totalPrincipalDisbursed ?? 0)}
                  />
                  <SummaryBox
                    label="Total Payable"
                    value={formatCurrency(summary.totalPayable ?? 0)}
                  />
                  <SummaryBox
                    label="Total Recovered"
                    value={formatCurrency(summary.totalRecovered ?? 0)}
                  />
                  <SummaryBox
                    label="Outstanding Portfolio"
                    value={formatCurrency(summary.totalOutstanding ?? 0)}
                    highlight
                  />
                </>
              )}
              {reportType === "overdue" && (
                <>
                  <SummaryBox
                    label="Overdue Installments"
                    value={summary.totalOverdueInstallments ?? 0}
                  />
                  <SummaryBox
                    label="Overdue Borrowers"
                    value={summary.totalOverdueMembers ?? 0}
                  />
                  <SummaryBox
                    label="Total Overdue Amount"
                    value={formatCurrency(summary.totalOverdueAmount ?? 0)}
                    highlight
                  />
                </>
              )}
              {reportType === "savings-summary" && (
                <>
                  <SummaryBox label="Total Accounts" value={summary.totalAccounts ?? 0} />
                  <SummaryBox
                    label="General Savings"
                    value={formatCurrency(summary.totalGeneralSavingsBalance ?? 0)}
                  />
                  <SummaryBox
                    label="Special Savings"
                    value={formatCurrency(summary.totalSpecialSavingsBalance ?? 0)}
                  />
                  <SummaryBox
                    label="Total Savings Liability"
                    value={formatCurrency(summary.totalSavingsBalance ?? 0)}
                    highlight
                  />
                </>
              )}
            </div>
          )}

          {/* Data Tables */}
          {reportType === "daily-collections" && (
            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: 35, textAlign: "center" }}>#</th>
                  <th>Receipt #</th>
                  <th>Date</th>
                  <th>Member Name (ID)</th>
                  <th>Somiti</th>
                  <th>Method</th>
                  <th style={{ textAlign: "right" }}>Loan Recv (Tk)</th>
                  <th style={{ textAlign: "right" }}>Gen Sav (Tk)</th>
                  <th style={{ textAlign: "right" }}>Spc Sav (Tk)</th>
                  <th style={{ textAlign: "right" }}>DPS (Tk)</th>
                  <th style={{ textAlign: "right" }}>Total (Tk)</th>
                  <th>Collected By</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ textAlign: "center", padding: 16 }}>
                      No collection records found.
                    </td>
                  </tr>
                ) : (
                  data.map((row, idx) => (
                    <tr key={row.id}>
                      <td style={{ textAlign: "center" }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{row.receiptNumber}</td>
                      <td>{formatDate(row.collectionDate)}</td>
                      <td>
                        <strong>{row.member?.fullName || "—"}</strong>
                        <div style={{ fontSize: 9, color: "#64748b" }}>
                          {row.member?.memberId || `ID: ${row.member?.id}`}
                        </div>
                      </td>
                      <td>{row.somiti?.name || "—"}</td>
                      <td>{row.paymentMethod}</td>
                      <td style={{ textAlign: "right" }}>
                        {formatCurrency(row.loanCollectionAmount)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {formatCurrency(row.generalSavingsAmount)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {formatCurrency(row.specialSavingsAmount)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {formatCurrency(row.dpsAmount || 0)}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        {formatCurrency(row.totalAmount)}
                      </td>
                      <td>{row.collectedBy?.fullName || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {data.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={6} style={{ textAlign: "right" }}>
                      Total ({data.length} records):
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(
                        data.reduce((acc, r) => acc + (r.loanCollectionAmount || 0), 0),
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(
                        data.reduce((acc, r) => acc + (r.generalSavingsAmount || 0), 0),
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(
                        data.reduce((acc, r) => acc + (r.specialSavingsAmount || 0), 0),
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(
                        data.reduce((acc, r) => acc + (r.dpsAmount || 0), 0),
                      )}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {formatCurrency(
                        data.reduce((acc, r) => acc + (r.totalAmount || 0), 0),
                      )}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}

          {reportType === "loan-portfolio" && (
            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: 35, textAlign: "center" }}>#</th>
                  <th>Loan ID</th>
                  <th>Member Name (ID)</th>
                  <th>Somiti</th>
                  <th>Disbursed</th>
                  <th style={{ textAlign: "right" }}>Principal (Tk)</th>
                  <th style={{ textAlign: "right" }}>Total Payable (Tk)</th>
                  <th style={{ textAlign: "right" }}>Paid / Recv (Tk)</th>
                  <th style={{ textAlign: "right" }}>Outstanding (Tk)</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", padding: 16 }}>
                      No loan records found.
                    </td>
                  </tr>
                ) : (
                  data.map((row, idx) => (
                    <tr key={row.id}>
                      <td style={{ textAlign: "center" }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{row.loanId}</td>
                      <td>
                        <strong>{row.member?.fullName || "—"}</strong>
                        <div style={{ fontSize: 9, color: "#64748b" }}>
                          {row.member?.memberId || `ID: ${row.member?.id}`}
                        </div>
                      </td>
                      <td>{row.somiti?.name || "—"}</td>
                      <td>{formatDate(row.disbursementDate || row.createdAt)}</td>
                      <td style={{ textAlign: "right" }}>
                        {formatCurrency(row.principalAmount)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {formatCurrency(row.totalPayable)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {formatCurrency(row.paidAmount)}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "#b91c1c" }}>
                        {formatCurrency(row.outstandingAmount)}
                      </td>
                      <td style={{ textAlign: "center" }}>{row.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {data.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={5} style={{ textAlign: "right" }}>
                      Total ({data.length} loans):
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(
                        data.reduce((acc, r) => acc + (r.principalAmount || 0), 0),
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(
                        data.reduce((acc, r) => acc + (r.totalPayable || 0), 0),
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(
                        data.reduce((acc, r) => acc + (r.paidAmount || 0), 0),
                      )}
                    </td>
                    <td style={{ textAlign: "right", color: "#b91c1c" }}>
                      {formatCurrency(
                        data.reduce((acc, r) => acc + (r.outstandingAmount || 0), 0),
                      )}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}

          {reportType === "overdue" && (
            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: 35, textAlign: "center" }}>#</th>
                  <th>Inst #</th>
                  <th>Member Name (ID)</th>
                  <th>Somiti</th>
                  <th>Officer</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: "center" }}>Overdue Days</th>
                  <th style={{ textAlign: "right" }}>Installment (Tk)</th>
                  <th style={{ textAlign: "right" }}>Paid (Tk)</th>
                  <th style={{ textAlign: "right" }}>Overdue Due (Tk)</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", padding: 16 }}>
                      No overdue installments found.
                    </td>
                  </tr>
                ) : (
                  data.map((row, idx) => (
                    <tr key={row.id}>
                      <td style={{ textAlign: "center" }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>#{row.installmentNo}</td>
                      <td>
                        <strong>{row.member?.fullName || "—"}</strong>
                        <div style={{ fontSize: 9, color: "#64748b" }}>
                          {row.member?.mobileNumber || row.member?.memberId}
                        </div>
                      </td>
                      <td>{row.somiti?.name || "—"}</td>
                      <td>{row.somiti?.fieldOfficer?.fullName || "—"}</td>
                      <td>{formatDate(row.dueDate)}</td>
                      <td
                        style={{
                          textAlign: "center",
                          fontWeight: 700,
                          color: row.daysOverdue > 30 ? "#b91c1c" : "#d97706",
                        }}
                      >
                        {row.daysOverdue} days
                      </td>
                      <td style={{ textAlign: "right" }}>{formatCurrency(row.amount)}</td>
                      <td style={{ textAlign: "right" }}>
                        {formatCurrency(row.paidAmount)}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "#b91c1c" }}>
                        {formatCurrency(row.remainingDue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {data.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={7} style={{ textAlign: "right" }}>
                      Total ({data.length} overdue installments):
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(
                        data.reduce((acc, r) => acc + (r.amount || 0), 0),
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(
                        data.reduce((acc, r) => acc + (r.paidAmount || 0), 0),
                      )}
                    </td>
                    <td style={{ textAlign: "right", color: "#b91c1c" }}>
                      {formatCurrency(
                        data.reduce((acc, r) => acc + (r.remainingDue || 0), 0),
                      )}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}

          {reportType === "savings-summary" && (
            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: 35, textAlign: "center" }}>#</th>
                  <th>Account ID</th>
                  <th>Member Name (ID)</th>
                  <th>Mobile Number</th>
                  <th>Somiti</th>
                  <th style={{ textAlign: "right" }}>General Savings (Tk)</th>
                  <th style={{ textAlign: "right" }}>Special Savings (Tk)</th>
                  <th style={{ textAlign: "right" }}>Total Balance (Tk)</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: 16 }}>
                      No savings accounts found.
                    </td>
                  </tr>
                ) : (
                  data.map((row, idx) => (
                    <tr key={row.id}>
                      <td style={{ textAlign: "center" }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{row.accountId}</td>
                      <td>
                        <strong>{row.member?.fullName || "—"}</strong>
                        <div style={{ fontSize: 9, color: "#64748b" }}>
                          {row.member?.memberId || `ID: ${row.member?.id}`}
                        </div>
                      </td>
                      <td>{row.member?.mobileNumber || "—"}</td>
                      <td>{row.somiti?.name || "—"}</td>
                      <td style={{ textAlign: "right" }}>
                        {formatCurrency(row.generalSavingsBalance)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {formatCurrency(row.specialSavingsBalance)}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "#047857" }}>
                        {formatCurrency(row.totalBalance)}
                      </td>
                      <td style={{ textAlign: "center" }}>{row.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {data.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={5} style={{ textAlign: "right" }}>
                      Total ({data.length} accounts):
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(
                        data.reduce((acc, r) => acc + (r.generalSavingsBalance || 0), 0),
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(
                        data.reduce((acc, r) => acc + (r.specialSavingsBalance || 0), 0),
                      )}
                    </td>
                    <td style={{ textAlign: "right", color: "#047857" }}>
                      {formatCurrency(
                        data.reduce((acc, r) => acc + (r.totalBalance || 0), 0),
                      )}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}

          {reportType === "dps-summary" && (
            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: 35, textAlign: "center" }}>#</th>
                  <th>DPS #</th>
                  <th>Member Name (ID)</th>
                  <th>Somiti</th>
                  <th style={{ textAlign: "right" }}>Monthly (Tk)</th>
                  <th style={{ textAlign: "center" }}>Tenure</th>
                  <th style={{ textAlign: "center" }}>Progress</th>
                  <th style={{ textAlign: "right" }}>Total Paid (Tk)</th>
                  <th style={{ textAlign: "right" }}>Maturity Value (Tk)</th>
                  <th>Maturity Date</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: "center", padding: 16 }}>
                      No DPS accounts found.
                    </td>
                  </tr>
                ) : (
                  data.map((row, idx) => (
                    <tr key={row.id}>
                      <td style={{ textAlign: "center" }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600, color: "#0284c7" }}>{row.dpsNumber}</td>
                      <td>
                        <strong>{row.member?.fullName || "—"}</strong>
                        <div style={{ fontSize: 9, color: "#64748b" }}>
                          {row.member?.memberId || `ID: ${row.member?.id}`}
                        </div>
                      </td>
                      <td>{row.somiti?.name || "—"}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {formatCurrency(row.installmentAmount)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {row.durationMonths} Mo
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {row.paidInstallments || 0} / {row.durationMonths}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "#047857" }}>
                        {formatCurrency(row.totalPaidAmount)}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "#0284c7" }}>
                        {formatCurrency(row.maturityAmount)}
                      </td>
                      <td>{formatDate(row.maturityDate)}</td>
                      <td style={{ textAlign: "center" }}>{row.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {data.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ textAlign: "right" }}>
                      Total ({data.length} accounts):
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(
                        data.reduce((acc, r) => acc + (r.installmentAmount || 0), 0),
                      )}
                    </td>
                    <td colSpan={2}></td>
                    <td style={{ textAlign: "right", color: "#047857" }}>
                      {formatCurrency(
                        data.reduce((acc, r) => acc + (r.totalPaidAmount || 0), 0),
                      )}
                    </td>
                    <td style={{ textAlign: "right", color: "#0284c7" }}>
                      {formatCurrency(
                        data.reduce((acc, r) => acc + (r.maturityAmount || 0), 0),
                      )}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}

          {/* Signatures Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 20,
              marginTop: 48,
              textAlign: "center",
              fontSize: 11,
              color: "#334155",
            }}
          >
            <div>
              <div style={{ borderTop: "1px dashed #64748b", paddingTop: 4 }}>
                Prepared By
              </div>
            </div>
            <div>
              <div style={{ borderTop: "1px dashed #64748b", paddingTop: 4 }}>
                Field Officer
              </div>
            </div>
            <div>
              <div style={{ borderTop: "1px dashed #64748b", paddingTop: 4 }}>
                Branch Accountant
              </div>
            </div>
            <div>
              <div style={{ borderTop: "1px dashed #64748b", paddingTop: 4 }}>
                Branch Manager
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function SummaryBox({ label, value, highlight = false }) {
  return (
    <div
      style={{
        background: highlight ? "#eff6ff" : "#f8fafc",
        border: highlight ? "1px solid #93c5fd" : "1px solid #e2e8f0",
        borderRadius: 4,
        padding: "8px 10px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 10, color: highlight ? "#1d4ed8" : "#64748b", fontWeight: 600 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: highlight ? "#1e40af" : "#0f172a",
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  );
}
