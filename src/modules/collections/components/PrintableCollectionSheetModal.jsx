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
    (currentUser?.role === "FIELD_OFFICER" ? currentUser.fullName : "সকল কর্মকর্তা / শাখা");

  const officerPhone =
    selectedSomiti?.fieldOfficer?.mobileNumber ||
    (currentUser?.role === "FIELD_OFFICER" ? currentUser.mobileNumber : "");

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1180}
      style={{ top: 20 }}
      title={
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: 32 }}>
          <Space>
            <PrinterOutlined style={{ fontSize: 18, color: "#1890ff" }} />
            <Typography.Text strong style={{ fontSize: 16 }}>
              Collection Sheet Print Preview (ফিল্ড শিট প্রিভিউ)
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
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 6mm 8mm 8mm 8mm;
          }
          body * {
            visibility: hidden !important;
          }
          .collection-print-root,
          .collection-print-root * {
            visibility: visible !important;
          }
          .collection-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
            font-size: 11px !important;
          }
          .no-print {
            display: none !important;
          }
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 10.5px !important;
          }
          .print-table th,
          .print-table td {
            border: 1px solid #111 !important;
            padding: 4px 6px !important;
          }
          .print-table th {
            background-color: #f0f0f0 !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-blank-box {
            height: 24px !important;
            background: #fff !important;
          }
        }

        /* Screen Preview Styling */
        .preview-container {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 6px;
          max-height: 75vh;
          overflow-y: auto;
        }
        .collection-print-root {
          background: #fff;
          padding: 24px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          color: #111;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          font-size: 12px;
        }
        .print-table th,
        .print-table td {
          border: 1px solid #333;
          padding: 5px 6px;
        }
        .print-table th {
          background-color: #f3f4f6;
          font-weight: 600;
          text-align: center;
        }
        .print-blank-box {
          height: 26px;
          background: #fafafa;
        }
      `}</style>

      <div className="preview-container">
        <div className="collection-print-root" ref={printAreaRef}>
          {/* Organization Title & Sheet Header */}
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: "bold", letterSpacing: "0.5px" }}>
              পূর্বাশা আর্থিক উন্নয়ন সংস্থা
            </h1>
            <p style={{ margin: "2px 0 0 0", fontSize: 13, color: "#333" }}>
              ক্ষুদ্রঋণ ও সঞ্চয় কর্মসূচি (Microfinance Program)
            </p>
            <div style={{ display: "inline-block", marginTop: 4, padding: "2px 14px", border: "1.5px solid #222", borderRadius: 4, fontWeight: "bold", fontSize: 14 }}>
              দৈনিক কিস্তি ও সঞ্চয় আদায় তালিকা (Daily Field Collection Sheet)
            </div>
          </div>

          {/* Meta Info Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", border: "1px solid #333", background: "#fdfdfd", padding: "6px 10px", fontSize: 12, marginBottom: 10 }}>
            <div>
              <strong>সমিতির নাম: </strong>
              <span>{selectedSomiti ? selectedSomiti.name : "সকল সমিতি (All Somities)"}</span>
              {selectedSomiti?.code && (
                <span style={{ marginLeft: 4 }}>({selectedSomiti.somitiId || selectedSomiti.code})</span>
              )}
            </div>
            <div>
              <strong>আদায়ের তারিখ: </strong>
              <span>{dueDate.format("DD MMMM, YYYY")}</span>
              <span style={{ marginLeft: 6, color: "#555" }}>({dueDate.format("dddd")})</span>
            </div>
            <div>
              <strong>মাঠ কর্মকর্তা: </strong>
              <span>{officerName}</span>
              {officerPhone && <span style={{ marginLeft: 4 }}>({officerPhone})</span>}
            </div>
            <div>
              <strong>কেন্দ্র / এলাকা: </strong>
              <span>{selectedSomiti?.area || selectedSomiti?.address || "শাখা এলাকা"}</span>
            </div>
          </div>

          {installments.length === 0 ? (
            <Empty description="এই তারিখে ও সমিতিতে কোনো বকেয়া কিস্তি নেই" style={{ padding: "40px 0" }} />
          ) : (
            <>
              {/* Collection Table */}
              <table className="print-table">
                <thead>
                  <tr>
                    <th style={{ width: "3%" }}>ক্রঃ</th>
                    <th style={{ width: "8%" }}>সদস্য কোড</th>
                    <th style={{ width: "15%", textAlign: "left" }}>সদস্যের নাম</th>
                    <th style={{ width: "9%" }}>মোবাইল নং</th>
                    <th style={{ width: "7%" }}>ঋণ কোড</th>
                    <th style={{ width: "5%" }}>কিস্তি</th>
                    <th style={{ width: "9%", textAlign: "right" }}>ঋণের দাবি (৳)</th>
                    <th style={{ width: "8%", textAlign: "right" }}>সঞ্চয় দাবি (৳)</th>
                    <th style={{ width: "9%", textAlign: "right" }}>মোট দাবি (৳)</th>
                    <th style={{ width: "9%", color: "#000" }}>আদায়কিত ঋণ (৳)</th>
                    <th style={{ width: "9%", color: "#000" }}>আদায়কৃত সঞ্চয় (৳)</th>
                    <th style={{ width: "9%", color: "#000" }}>মোট আদায় (৳)</th>
                    <th style={{ width: "10%" }}>সদস্যের স্বাক্ষর</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((item, index) => {
                    const member = item.loan?.member;
                    const dueLoan = Math.max(0, toAmount(item.amount) - toAmount(item.paidAmount));
                    const expectedSavings = 0; // standard weekly entry
                    const totalDue = dueLoan + expectedSavings;

                    return (
                      <tr key={item.id}>
                        <td style={{ textAlign: "center", fontWeight: "bold" }}>{index + 1}</td>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>{member?.memberId || "—"}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{member?.fullName || "—"}</div>
                          {!selectedSomiti && member?.somiti?.name && (
                            <div style={{ fontSize: 10, color: "#555" }}>🏷️ {member.somiti.name}</div>
                          )}
                        </td>
                        <td style={{ textAlign: "center", fontSize: 11 }}>{member?.mobileNumber || "—"}</td>
                        <td style={{ textAlign: "center" }}>{item.loan?.loanId || "—"}</td>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>#{item.installmentNo}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(dueLoan)}</td>
                        <td style={{ textAlign: "right", color: "#666" }}>—</td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>{formatCurrency(totalDue)}</td>
                        {/* 3 Blank boxes for Field Officer's manual handwriting with pen */}
                        <td className="print-blank-box"></td>
                        <td className="print-blank-box"></td>
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
                    <td colSpan={6} style={{ textAlign: "right", paddingRight: 10 }}>
                      সর্বমোট দাবি ({installments.length} জন সদস্য):
                    </td>
                    <td style={{ textAlign: "right", fontSize: 13 }}>
                      {formatCurrency(totalDueLoan)}
                    </td>
                    <td style={{ textAlign: "right" }}>—</td>
                    <td style={{ textAlign: "right", fontSize: 13 }}>
                      {formatCurrency(totalDueLoan)}
                    </td>
                    <td className="print-blank-box" style={{ textAlign: "center", fontSize: 11, color: "#888" }}>
                      [মোট ঋণ]
                    </td>
                    <td className="print-blank-box" style={{ textAlign: "center", fontSize: 11, color: "#888" }}>
                      [মোট সঞ্চয়]
                    </td>
                    <td className="print-blank-box" style={{ textAlign: "center", fontSize: 11, color: "#888" }}>
                      [সর্বমোট আদায়]
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>

              {/* Instructions and Signature Blocks */}
              <div style={{ marginTop: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 20px" }}>
                <div style={{ textAlign: "center", width: "26%" }}>
                  <div style={{ borderTop: "1.5px solid #222", paddingTop: 4, fontWeight: "bold", fontSize: 11.5 }}>
                    মাঠ কর্মকর্তার স্বাক্ষর ও তারিখ
                  </div>
                  <div style={{ fontSize: 10, color: "#666" }}>আদায়কারী কর্মী</div>
                </div>

                <div style={{ textAlign: "center", width: "26%" }}>
                  <div style={{ borderTop: "1.5px solid #222", paddingTop: 4, fontWeight: "bold", fontSize: 11.5 }}>
                    যাচাইকারী / হিসাবরক্ষকের স্বাক্ষর
                  </div>
                  <div style={{ fontSize: 10, color: "#666" }}>টাকা গ্রহণকারী</div>
                </div>

                <div style={{ textAlign: "center", width: "26%" }}>
                  <div style={{ borderTop: "1.5px solid #222", paddingTop: 4, fontWeight: "bold", fontSize: 11.5 }}>
                    শাখা ব্যবস্থাপকের স্বাক্ষর ও সিল
                  </div>
                  <div style={{ fontSize: 10, color: "#666" }}>অনুমোদনকারী</div>
                </div>
              </div>

              {/* Bottom Print Note */}
              <div style={{ marginTop: 18, fontSize: 10, color: "#777", display: "flex", justifyContent: "space-between", borderTop: "1px dashed #ccc", paddingTop: 4 }}>
                <span>প্রিন্ট সময়: {new Date().toLocaleString()}</span>
                <span>সফটওয়্যার: পূর্বাশা ক্ষুদ্রঋণ ও সঞ্চয় ব্যবস্থাপনা</span>
                <span>পৃষ্ঠা: ০১ / ০১</span>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
