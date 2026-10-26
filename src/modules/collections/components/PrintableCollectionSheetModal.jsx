import { Button, Empty, Modal, Space, Tag, Typography } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { useRef } from "react";
import { formatCurrency, formatDate } from "../../loans/loanFormatters.js";

const toAmount = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

export function PrintableCollectionSheetModal({
  open,
  onClose,
  installments = [],
  dueDate,
  selectedSomiti,
  currentUser,
}) {
  const printAreaRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const totalDueLoan = installments.reduce((acc, item) => {
    const due = Math.max(0, toAmount(item.amount) - toAmount(item.paidAmount));
    return acc + due;
  }, 0);

  const officerName =
    selectedSomiti?.fieldOfficer?.fullName ||
    (currentUser?.role === "FIELD_OFFICER" ? currentUser.fullName : "All Officers / Branch");

  const officerPhone =
    selectedSomiti?.fieldOfficer?.mobileNumber ||
    (currentUser?.role === "FIELD_OFFICER" ? currentUser.mobileNumber : "");

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1200}
      style={{ top: 15 }}
      title={
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: 32 }}>
          <Space>
            <PrinterOutlined style={{ fontSize: 18, color: "#1890ff" }} />
            <Typography.Text strong style={{ fontSize: 16 }}>
              Collection Sheet Print Preview
            </Typography.Text>
          </Space>
          <Space>
            <Button onClick={onClose}>Close</Button>
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
              Print Sheet / Save PDF
            </Button>
          </Space>
        </div>
      }
      footer={
        <div className="no-print" style={{ display: "flex", justifyContent: "flex-end" }}>
          <Space>
            <Button onClick={onClose}>Close</Button>
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
              Print Sheet / Save PDF
            </Button>
          </Space>
        </div>
      }
      destroyOnClose
    >
      {/* Precision Single-Page Print CSS */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            background: #fff !important;
          }
          /* Remove the main web app from print layout entirely */
          #root {
            display: none !important;
          }
          /* Neutralize Ant Design modal wrappers */
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
          .collection-print-root {
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 9.5px !important;
          }
          .print-table th,
          .print-table td {
            border: 1px solid #111 !important;
            padding: 2.5px 4px !important;
            line-height: 1.2 !important;
          }
          .print-table tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-table th {
            background-color: #f0f0f0 !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-blank-box {
            height: 18px !important;
            background: #fff !important;
          }
        }

        /* Screen Preview Styling */
        .preview-container {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 6px;
          max-height: 75vh;
          overflow-y: auto;
        }
        .collection-print-root {
          background: #fff;
          padding: 18px 22px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          color: #111;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          font-size: 11px;
        }
        .print-table th,
        .print-table td {
          border: 1px solid #333;
          padding: 4px 5px;
        }
        .print-table th {
          background-color: #f3f4f6;
          font-weight: 600;
          text-align: center;
        }
        .print-blank-box {
          height: 22px;
          background: #fafafa;
        }
      `}</style>

      <div className="preview-container">
        <div className="collection-print-root" ref={printAreaRef}>
          {/* Organization Title & Sheet Header */}
          <div style={{ textAlign: "center", marginBottom: 6 }}>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: "bold", letterSpacing: "0.5px" }}>
              Purbasha Financial Development Organization
            </h1>
            <p style={{ margin: "1px 0 0 0", fontSize: 11.5, color: "#333" }}>
              Microfinance & Savings Program
            </p>
            <div style={{ display: "inline-block", marginTop: 3, padding: "2px 14px", border: "1.2px solid #222", borderRadius: 3, fontWeight: "bold", fontSize: 12 }}>
              Daily Field Collection Sheet (Loan, General Savings & Special Savings)
            </div>
          </div>

          {/* Meta Info Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", border: "1px solid #333", background: "#fdfdfd", padding: "4px 8px", fontSize: 11, marginBottom: 6 }}>
            <div>
              <strong>Somiti Name: </strong>
              <span>{selectedSomiti ? selectedSomiti.name : "All Somities"}</span>
              {selectedSomiti?.code && (
                <span style={{ marginLeft: 4 }}>({selectedSomiti.somitiId || selectedSomiti.code})</span>
              )}
            </div>
            <div>
              <strong>Collection Date: </strong>
              <span>{dueDate.format("DD MMMM, YYYY")}</span>
              <span style={{ marginLeft: 5, color: "#555" }}>({dueDate.format("dddd")})</span>
            </div>
            <div>
              <strong>Field Officer: </strong>
              <span>{officerName}</span>
              {officerPhone && <span style={{ marginLeft: 4 }}>({officerPhone})</span>}
            </div>
            <div>
              <strong>Center / Area: </strong>
              <span>{selectedSomiti?.area || selectedSomiti?.address || "Branch Area"}</span>
            </div>
          </div>

          {installments.length === 0 ? (
            <Empty description="No due installments found for this date and somiti" style={{ padding: "30px 0" }} />
          ) : (
            <>
              {/* Collection Table */}
              <table className="print-table">
                <thead>
                  <tr>
                    <th style={{ width: "3%" }}>SL</th>
                    <th style={{ width: "8%" }}>Member ID</th>
                    <th style={{ width: "15%", textAlign: "left" }}>Member Name</th>
                    <th style={{ width: "9%" }}>Mobile No</th>
                    <th style={{ width: "7%" }}>Loan ID</th>
                    <th style={{ width: "4%" }}>Inst #</th>
                    <th style={{ width: "8%", textAlign: "right" }}>Loan Due (৳)</th>
                    <th style={{ width: "9%", color: "#000", background: "#eef2ff" }}>Collected Loan (৳)</th>
                    <th style={{ width: "9%", color: "#000", background: "#f0fdf4" }}>General Sav. (৳)</th>
                    <th style={{ width: "9%", color: "#000", background: "#fefce8" }}>Special Sav. (৳)</th>
                    <th style={{ width: "9%", color: "#000", fontWeight: "bold" }}>Total Coll. (৳)</th>
                    <th style={{ width: "10%" }}>Member Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((item, index) => {
                    const member = item.loan?.member;
                    const dueLoan = Math.max(0, toAmount(item.amount) - toAmount(item.paidAmount));

                    return (
                      <tr key={item.id}>
                        <td style={{ textAlign: "center", fontWeight: "bold" }}>{index + 1}</td>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>{member?.memberId || "—"}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{member?.fullName || "—"}</div>
                          {!selectedSomiti && member?.somiti?.name && (
                            <div style={{ fontSize: 9, color: "#555" }}>🏷️ {member.somiti.name}</div>
                          )}
                        </td>
                        <td style={{ textAlign: "center", fontSize: 10 }}>{member?.mobileNumber || "—"}</td>
                        <td style={{ textAlign: "center" }}>{item.loan?.loanId || "—"}</td>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>#{item.installmentNo}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(dueLoan)}</td>
                        {/* 4 Blank boxes for Field Officer's manual handwriting with pen */}
                        <td className="print-blank-box" style={{ background: "#fcfcff" }}></td>
                        <td className="print-blank-box" style={{ background: "#fcfffc" }}></td>
                        <td className="print-blank-box" style={{ background: "#fffdf9" }}></td>
                        <td className="print-blank-box"></td>
                        {/* Member Signature line */}
                        <td style={{ textAlign: "center", verticalAlign: "bottom", paddingBottom: 2 }}>
                          <div style={{ borderBottom: "1px dotted #888", width: "90%", margin: "0 auto" }}></div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Summary Row */}
                  <tr style={{ background: "#f8f9fa", fontWeight: "bold" }}>
                    <td colSpan={6} style={{ textAlign: "right", paddingRight: 8 }}>
                      Total Demand ({installments.length} Members):
                    </td>
                    <td style={{ textAlign: "right", fontSize: 11.5 }}>
                      {formatCurrency(totalDueLoan)}
                    </td>
                    <td className="print-blank-box" style={{ textAlign: "center", fontSize: 9.5, color: "#888" }}>
                      [Loan Total]
                    </td>
                    <td className="print-blank-box" style={{ textAlign: "center", fontSize: 9.5, color: "#888" }}>
                      [Gen. Sav Total]
                    </td>
                    <td className="print-blank-box" style={{ textAlign: "center", fontSize: 9.5, color: "#888" }}>
                      [Spc. Sav Total]
                    </td>
                    <td className="print-blank-box" style={{ textAlign: "center", fontSize: 9.5, color: "#888" }}>
                      [Grand Total]
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>

              {/* Instructions and Signature Blocks */}
              <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 16px" }}>
                <div style={{ textAlign: "center", width: "26%" }}>
                  <div style={{ borderTop: "1.2px solid #222", paddingTop: 3, fontWeight: "bold", fontSize: 10.5 }}>
                    Field Officer Signature & Date
                  </div>
                  <div style={{ fontSize: 9.5, color: "#666" }}>Collector</div>
                </div>

                <div style={{ textAlign: "center", width: "26%" }}>
                  <div style={{ borderTop: "1.2px solid #222", paddingTop: 3, fontWeight: "bold", fontSize: 10.5 }}>
                    Accountant / Cashier Signature
                  </div>
                  <div style={{ fontSize: 9.5, color: "#666" }}>Receiver</div>
                </div>

                <div style={{ textAlign: "center", width: "26%" }}>
                  <div style={{ borderTop: "1.2px solid #222", paddingTop: 3, fontWeight: "bold", fontSize: 10.5 }}>
                    Branch Manager Signature & Seal
                  </div>
                  <div style={{ fontSize: 9.5, color: "#666" }}>Authorized Approver</div>
                </div>
              </div>

              {/* Bottom Print Note */}
              <div style={{ marginTop: 8, fontSize: 9, color: "#777", display: "flex", justifyContent: "space-between", borderTop: "1px dashed #ccc", paddingTop: 3 }}>
                <span>Print Time: {new Date().toLocaleString()}</span>
                <span>Software: Microfinance & Loan Management System</span>
                <span>Page: 01 / 01</span>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
