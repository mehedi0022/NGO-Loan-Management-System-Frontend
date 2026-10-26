import { PrinterOutlined } from "@ant-design/icons";
import { Button, Modal, Space, Typography } from "antd";
import { formatCurrency, formatDate } from "../../loans/loanFormatters.js";

// Helper: Convert numbers to English words
function numberToWords(num) {
  const n = Math.floor(Number(num) || 0);
  if (n === 0) return "Zero Taka Only";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const b = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function convertGroup(val) {
    let s = "";
    if (val >= 100) {
      s += a[Math.floor(val / 100)] + " Hundred ";
      val %= 100;
    }
    if (val >= 20) {
      s += b[Math.floor(val / 10)] + (val % 10 ? " " + a[val % 10] : "") + " ";
    } else if (val > 0) {
      s += a[val] + " ";
    }
    return s.trim();
  }

  let words = "";
  let crore = Math.floor(n / 10000000);
  let remainder = n % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder %= 100000;
  let thousand = Math.floor(remainder / 1000);
  remainder %= 1000;
  let hundreds = remainder;

  if (crore > 0) words += convertGroup(crore) + " Crore ";
  if (lakh > 0) words += convertGroup(lakh) + " Lakh ";
  if (thousand > 0) words += convertGroup(thousand) + " Thousand ";
  if (hundreds > 0) words += convertGroup(hundreds) + " ";

  return (words.trim() + " Taka Only").replace(/\s+/g, " ");
}

export function PrintableVoucherModal({ open, onClose, voucher }) {
  if (!voucher) return null;

  const isIncome = voucher.type === "INCOME";
  const voucherTitle = isIncome
    ? "Credit Voucher / Money Receipt"
    : "Debit Voucher / Payment Voucher";

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={780}
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
            <PrinterOutlined style={{ fontSize: 18, color: isIncome ? "#16a34a" : "#dc2626" }} />
            <Typography.Text strong style={{ fontSize: 16 }}>
              Voucher Preview — {voucher.voucherNo}
            </Typography.Text>
          </Space>
          <Space>
            <Button onClick={onClose}>Close</Button>
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
              Print Voucher / PDF
            </Button>
          </Space>
        </div>
      }
      footer={
        <div className="no-print" style={{ display: "flex", justifyContent: "flex-end" }}>
          <Space>
            <Button onClick={onClose}>Close</Button>
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
              Print Voucher / PDF
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
          .voucher-print-root {
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
            box-shadow: none !important;
            border: 1px solid #334155 !important;
          }
        }

        .preview-container {
          background: #f8fafc;
          padding: 16px;
          border-radius: 8px;
          max-height: 80vh;
          overflow-y: auto;
        }
        .voucher-print-root {
          background: #fff;
          padding: 28px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          color: #0f172a;
          border: 1px solid #cbd5e1;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        }
        .voucher-table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }
        .voucher-table th {
          background: #f1f5f9;
          font-weight: 700;
          font-size: 12px;
          text-align: left;
          padding: 8px 10px;
          border: 1px solid #cbd5e1;
        }
        .voucher-table td {
          font-size: 12px;
          padding: 8px 10px;
          border: 1px solid #cbd5e1;
          color: #1e293b;
        }
      `}</style>

      <div className="preview-container">
        <div className="voucher-print-root">
          {/* Header */}
          <div
            style={{
              textAlign: "center",
              borderBottom: "2px solid #0f172a",
              paddingBottom: 12,
              marginBottom: 16,
            }}
          >
            <h1
              style={{
                margin: "0 0 4px 0",
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
                marginTop: 8,
                padding: "3px 18px",
                background: isIncome ? "#16a34a" : "#dc2626",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                borderRadius: 4,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {voucherTitle}
            </div>
          </div>

          {/* Voucher Info Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              background: "#f8fafc",
              padding: "10px 14px",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ marginBottom: 4 }}>
                <strong>Voucher No:</strong>{" "}
                <span style={{ fontWeight: 700, color: "#0f172a" }}>
                  {voucher.voucherNo}
                </span>
              </div>
              <div>
                <strong>Payment Method:</strong> {voucher.paymentMethod}
              </div>
              {voucher.reference && (
                <div style={{ marginTop: 4 }}>
                  <strong>Reference / Memo:</strong> {voucher.reference}
                </div>
              )}
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ marginBottom: 4 }}>
                <strong>Date:</strong> {formatDate(voucher.date)}
              </div>
              <div>
                <strong>Associated Somiti:</strong>{" "}
                {voucher.somiti?.name || "General (Branch/HQ)"}
              </div>
              <div style={{ marginTop: 4 }}>
                <strong>Prepared By:</strong>{" "}
                {voucher.createdBy?.fullName || "Staff"}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="voucher-table">
            <thead>
              <tr>
                <th style={{ width: 40, textAlign: "center" }}>#</th>
                <th style={{ width: 220 }}>Account Head / Category</th>
                <th>Particulars / Description</th>
                <th style={{ width: 140, textAlign: "right" }}>Amount (BDT)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: "center" }}>1</td>
                <td>
                  <strong style={{ fontSize: 13 }}>
                    {voucher.category?.name || "—"}
                  </strong>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    Type: {voucher.type}
                  </div>
                </td>
                <td>
                  <div>{voucher.description || "Operational transaction"}</div>
                  {voucher.reference && (
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                      Ref: {voucher.reference}
                    </div>
                  )}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    fontSize: 14,
                    fontWeight: 700,
                    color: isIncome ? "#16a34a" : "#dc2626",
                  }}
                >
                  {formatCurrency(voucher.amount)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ textAlign: "right", fontWeight: 700 }}>
                  Grand Total (Tk):
                </td>
                <td
                  style={{
                    textAlign: "right",
                    fontWeight: 800,
                    fontSize: 15,
                    color: isIncome ? "#16a34a" : "#dc2626",
                  }}
                >
                  {formatCurrency(voucher.amount)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Amount in Words */}
          <div
            style={{
              padding: "8px 12px",
              background: "#f1f5f9",
              border: "1px dashed #94a3b8",
              borderRadius: 4,
              fontSize: 12,
              marginBottom: 40,
            }}
          >
            <strong>In Words:</strong> {numberToWords(voucher.amount)}
          </div>

          {/* Signatures */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
              marginTop: 48,
              textAlign: "center",
              fontSize: 11,
              color: "#334155",
            }}
          >
            <div>
              <div style={{ borderTop: "1px dashed #64748b", paddingTop: 4 }}>
                {isIncome ? "Deposited By / Payer" : "Received By / Payee"}
              </div>
            </div>
            <div>
              <div style={{ borderTop: "1px dashed #64748b", paddingTop: 4 }}>
                Prepared By ({voucher.createdBy?.fullName || "Staff"})
              </div>
            </div>
            <div>
              <div style={{ borderTop: "1px dashed #64748b", paddingTop: 4 }}>
                Checked By (Accountant)
              </div>
            </div>
            <div>
              <div style={{ borderTop: "1px dashed #64748b", paddingTop: 4 }}>
                Approved By (Manager)
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
