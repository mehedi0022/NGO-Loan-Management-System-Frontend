import { PrinterOutlined } from "@ant-design/icons";
import { Button, Modal, Space, Typography } from "antd";
import {
  formatCurrency,
  formatDate,
  formatEnum,
  numberToWords,
} from "../loanFormatters.js";

export function PrintableLoanAgreementModal({ open, onClose, loan }) {
  if (!loan) return null;

  const member = loan.member;
  const guarantor = member?.guarantor;
  const somiti = member?.somiti;
  const officer = somiti?.fieldOfficer;

  const presentAddress = member?.addresses?.find((a) => a.type === "PRESENT");
  const presentAddressStr = presentAddress
    ? [
        presentAddress.village,
        presentAddress.union,
        presentAddress.upazila,
        presentAddress.district,
      ]
        .filter(Boolean)
        .join(", ")
    : "—";

  const guarantorAddressStr = guarantor
    ? [
        guarantor.village,
        guarantor.union,
        guarantor.upazila,
        guarantor.district,
      ]
        .filter(Boolean)
        .join(", ")
    : "—";

  const handlePrint = () => {
    window.print();
  };

  const sanctionDateStr = formatDate(
    loan.disbursementDate || loan.approvedAt || loan.applicationDate,
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={880}
      style={{ top: 15, maxWidth: "calc(100vw - 24px)", margin: "0 auto" }}
      title={
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingRight: 24,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <Space wrap>
            <PrinterOutlined style={{ fontSize: 18, color: "#1890ff" }} />
            <Typography.Text strong style={{ fontSize: 16 }}>
              Loan Sanction & Agreement Preview — {loan.loanId}
            </Typography.Text>
          </Space>
          <Space wrap className="hidden sm:inline-flex">
            <Button onClick={onClose}>Close</Button>
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
              Print Agreement / PDF
            </Button>
          </Space>
        </div>
      }
      footer={
        <div className="no-print" style={{ display: "flex", justifyContent: "flex-end" }}>
          <Space wrap>
            <Button onClick={onClose}>Close</Button>
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
              Print Agreement / PDF
            </Button>
          </Space>
        </div>
      }
      destroyOnClose
    >
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
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
          .sanction-sheet-root {
            position: static !important;
            width: 100% !important;
            min-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }

        .preview-container {
          background: #f8fafc;
          padding: 16px;
          border-radius: 8px;
          max-height: 80vh;
          overflow-y: auto;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .sanction-sheet-root {
          background: #fff;
          padding: 32px 36px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          font-size: 11.5px;
          min-width: 680px;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
        }
        .info-table th {
          background-color: #f8fafc;
          color: #475569;
          font-weight: 600;
          text-align: left;
          padding: 5px 8px;
          border: 1px solid #cbd5e1;
          width: 22%;
        }
        .info-table td {
          padding: 5px 8px;
          border: 1px solid #cbd5e1;
          width: 28%;
          color: #0f172a;
        }
        .terms-list {
          padding-left: 18px;
          margin: 6px 0;
          font-size: 10.5px;
          line-height: 1.5;
          color: #334155;
        }
        .terms-list li {
          margin-bottom: 4px;
        }
      `}</style>

      <div className="preview-container">
        <div className="sanction-sheet-root">
          {/* Header Title */}
          <div
            style={{
              textAlign: "center",
              borderBottom: "2px solid #0f172a",
              paddingBottom: 8,
              marginBottom: 12,
            }}
          >
            <h1
              style={{
                margin: "0 0 3px 0",
                fontSize: 20,
                fontWeight: 800,
                color: "#1e293b",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Purbasha Financial Development Organization
            </h1>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              Registered Microfinance & Social Development Institution
            </div>
            <div
              style={{
                display: "inline-block",
                marginTop: 6,
                padding: "3px 14px",
                background: "#0f172a",
                color: "#fff",
                fontWeight: 700,
                fontSize: 12,
                borderRadius: 4,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Loan Sanction Letter & Borrower Agreement
            </div>
          </div>

          {/* Metadata Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              background: "#f1f5f9",
              padding: "6px 12px",
              borderRadius: 4,
              border: "1px solid #e2e8f0",
              fontWeight: 600,
              fontSize: 11,
              marginBottom: 12,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div>
              <span>Loan ID: </span>
              <span style={{ color: "#0284c7" }}>{loan.loanId}</span>
            </div>
            <div>
              <span>Sanction Date: </span>
              <span>{sanctionDateStr}</span>
            </div>
            <div>
              <span>Somiti: </span>
              <span>
                {somiti?.name || "—"} ({somiti?.code || "—"})
              </span>
            </div>
          </div>

          {/* Section 1: Borrower Information */}
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4, color: "#0f172a" }}>
            1. Borrower Profile
          </div>
          <table className="info-table">
            <tbody>
              <tr>
                <th>Borrower Full Name</th>
                <td>
                  <strong>{member?.fullName || "—"}</strong>
                </td>
                <th>Member ID</th>
                <td>{member?.memberId || `ID: ${member?.id}`}</td>
              </tr>
              <tr>
                <th>Father / Husband</th>
                <td>{member?.fatherName || member?.guardianName || "—"}</td>
                <th>Mother's Name</th>
                <td>{member?.motherName || "—"}</td>
              </tr>
              <tr>
                <th>Mobile Number</th>
                <td>{member?.mobileNumber || "—"}</td>
                <th>National ID (NID)</th>
                <td>{member?.nidNumber || "—"}</td>
              </tr>
              <tr>
                <th>Present Address</th>
                <td colSpan={3}>{presentAddressStr}</td>
              </tr>
            </tbody>
          </table>

          {/* Section 2: Guarantor Information */}
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4, color: "#0f172a" }}>
            2. Guarantor Profile
          </div>
          <table className="info-table">
            <tbody>
              <tr>
                <th>Guarantor Name</th>
                <td>
                  <strong>{guarantor?.fullName || "—"}</strong>
                </td>
                <th>Relationship</th>
                <td>{guarantor?.relationship || "—"}</td>
              </tr>
              <tr>
                <th>Mobile Number</th>
                <td>{guarantor?.mobileNumber || "—"}</td>
                <th>National ID (NID)</th>
                <td>{guarantor?.nidNumber || "—"}</td>
              </tr>
              <tr>
                <th>Occupation</th>
                <td>{guarantor?.occupation || "—"}</td>
                <th>Guarantor Address</th>
                <td>{guarantorAddressStr}</td>
              </tr>
            </tbody>
          </table>

          {/* Section 3: Loan Sanction Specifications */}
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4, color: "#0f172a" }}>
            3. Sanction & Financial Terms
          </div>
          <table className="info-table">
            <tbody>
              <tr>
                <th>Principal Amount</th>
                <td>
                  <strong style={{ fontSize: 12, color: "#0284c7" }}>
                    {formatCurrency(loan.principalAmount)}
                  </strong>
                </td>
                <th>Principal In Words</th>
                <td>{numberToWords(loan.principalAmount)}</td>
              </tr>
              <tr>
                <th>Service Charge</th>
                <td>
                  {loan.chargeType === "PERCENTAGE"
                    ? `${loan.chargeValue}% (${formatCurrency(loan.chargeAmount)})`
                    : formatCurrency(loan.chargeAmount)}
                </td>
                <th>Total Repayable</th>
                <td>
                  <strong style={{ fontSize: 12, color: "#047857" }}>
                    {formatCurrency(loan.totalPayable)}
                  </strong>
                </td>
              </tr>
              <tr>
                <th>Installments</th>
                <td>{loan.installmentCount} installments</td>
                <th>Repayment Frequency</th>
                <td>{formatEnum(loan.frequency)}</td>
              </tr>
              <tr>
                <th>Installment Amount</th>
                <td>
                  <strong>{formatCurrency(loan.installmentAmount)}</strong>
                </td>
                <th>Repayment In Words</th>
                <td>{numberToWords(loan.installmentAmount)}</td>
              </tr>
              <tr>
                <th>First Due Date</th>
                <td>{formatDate(loan.firstDueDate)}</td>
                <th>Maturity Date</th>
                <td>{formatDate(loan.maturityDate)}</td>
              </tr>
              <tr>
                <th>Loan Purpose</th>
                <td colSpan={3}>{loan.purpose || "Microbusiness / Income Generating"}</td>
              </tr>
            </tbody>
          </table>

          {/* Section 4: Terms & Conditions */}
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4, color: "#0f172a" }}>
            4. Terms, Conditions & Borrower Undertaking
          </div>
          <div
            style={{
              background: "#fafafa",
              border: "1px solid #e2e8f0",
              padding: "8px 12px",
              borderRadius: 4,
              marginBottom: 36,
            }}
          >
            <ol className="terms-list">
              <li>
                <strong>Repayment Obligation:</strong> The borrower unconditionally agrees
                to repay the sanctioned loan amount along with the calculated service
                charges in regular weekly/monthly installments on the designated Somiti meeting
                days.
              </li>
              <li>
                <strong>Savings Collateral:</strong> The member agrees that their general
                and special savings balance shall remain pledged as secondary security
                against this loan and cannot be completely withdrawn until this loan balance is zero.
              </li>
              <li>
                <strong>Joint Guarantor Liability:</strong> The guarantor hereby agrees
                and guarantees full repayment of any outstanding balance, charges, or legal
                expenses should the borrower fail or delay to honor any installment.
              </li>
              <li>
                <strong>Verification & Sanction:</strong> Both borrower and guarantor affirm
                that all personal and financial statements provided are true, correct, and
                given freely without any undue influence.
              </li>
            </ol>
          </div>

          {/* Section 5: Four Official Signatures */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
              gap: 16,
              textAlign: "center",
              fontSize: 11,
              color: "#334155",
            }}
          >
            <div>
              <div style={{ height: 35 }}></div>
              <div style={{ borderTop: "1px dashed #64748b", paddingTop: 4 }}>
                <strong>Borrower Signature</strong>
                <div style={{ fontSize: 9, color: "#64748b" }}>Borrower / Thumb</div>
              </div>
            </div>

            <div>
              <div style={{ height: 35 }}></div>
              <div style={{ borderTop: "1px dashed #64748b", paddingTop: 4 }}>
                <strong>Guarantor Signature</strong>
                <div style={{ fontSize: 9, color: "#64748b" }}>Guarantor</div>
              </div>
            </div>

            <div>
              <div style={{ height: 35 }}></div>
              <div style={{ borderTop: "1px dashed #64748b", paddingTop: 4 }}>
                <strong>Field Officer</strong>
                <div style={{ fontSize: 9, color: "#64748b" }}>
                  {officer?.fullName || "Verified By"}
                </div>
              </div>
            </div>

            <div>
              <div style={{ height: 35 }}></div>
              <div style={{ borderTop: "1px dashed #64748b", paddingTop: 4 }}>
                <strong>Branch Manager</strong>
                <div style={{ fontSize: 9, color: "#64748b" }}>
                  Approved By & Seal
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
