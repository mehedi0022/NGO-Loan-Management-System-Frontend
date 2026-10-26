import { Button, Empty, Modal, Radio, Space, Typography } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { useMemo, useRef, useState } from "react";
import { formatCurrency, formatDate } from "../../loans/loanFormatters.js";

const toAmount = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

export function PrintableCollectionSheetModal({
  open,
  onClose,
  installments = [],
  somitiMembers = [],
  dueDate,
  selectedSomiti,
  currentUser,
  defaultSheetType = "savings",
}) {
  const printAreaRef = useRef(null);
  const [sheetType, setSheetType] = useState(defaultSheetType);

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

  // Prepare full member list for Savings and DPS sheets
  const membersList = useMemo(() => {
    if (Array.isArray(somitiMembers) && somitiMembers.length > 0) {
      return somitiMembers;
    }
    // Fallback: extract unique members from installments
    const memberMap = new Map();
    for (const item of installments) {
      const member = item.loan?.member;
      if (member && !memberMap.has(member.id)) {
        memberMap.set(member.id, member);
      }
    }
    return Array.from(memberMap.values());
  }, [somitiMembers, installments]);

  const totalGenSavingsBalance = membersList.reduce(
    (sum, m) => sum + toAmount(m.savingsAccount?.generalSavingsBalance),
    0,
  );
  const totalSpcSavingsBalance = membersList.reduce(
    (sum, m) => sum + toAmount(m.savingsAccount?.specialSavingsBalance),
    0,
  );

  // DPS accounts list for members
  const dpsList = useMemo(() => {
    return membersList.map((m, idx) => {
      const dps = m.dpsAccount;
      const dpsNo = dps?.dpsNumber || m.dpsNumber || `DPS-${String(m.id || idx + 1).padStart(6, "0")}`;
      const monthlyDemand = Number(dps?.installmentAmount || 1000);
      const tenure = dps?.durationMonths ? `${Math.floor(dps.durationMonths / 12)} Yrs` : "5 Yrs";
      const instNo = dps?.paidInstallments ? `#${dps.paidInstallments + 1}` : "#1";
      return {
        ...m,
        dpsNo,
        monthlyDemand,
        tenure,
        instNo,
      };
    });
  }, [membersList]);

  const totalDpsDemand = dpsList.reduce((sum, item) => sum + item.monthlyDemand, 0);

  const sheetMeta = {
    savings: {
      program: "Microfinance & Savings Program",
      badge: "1. Daily Field Collection Sheet — Savings (General & Special)",
    },
    dps: {
      program: "Deposit Pension Scheme (DPS) Program",
      badge: "2. Daily Field Collection Sheet — DPS (Deposit Pension Scheme)",
    },
    loan: {
      program: "Microfinance & Credit Program",
      badge: "3. Daily Field Collection Sheet — Loan Repayment",
    },
    combined: {
      program: "Microfinance, Savings & Credit Program",
      badge: "4. Daily Field Collection Sheet — Consolidated (Loan, Savings & DPS)",
    },
  }[sheetType] || {
    program: "Microfinance & Savings Program",
    badge: "Daily Field Collection Sheet",
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1240}
      style={{ top: 15, maxWidth: "calc(100vw - 20px)" }}
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
              Field Collection Sheets Print
            </Typography.Text>
          </Space>
          <Space wrap>
            <Radio.Group
              value={sheetType}
              onChange={(e) => setSheetType(e.target.value)}
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="savings">1. Savings Sheet</Radio.Button>
              <Radio.Button value="dps">2. DPS Sheet</Radio.Button>
              <Radio.Button value="loan">3. Loan Sheet</Radio.Button>
              <Radio.Button value="combined">4. Consolidated</Radio.Button>
            </Radio.Group>
            <Button onClick={onClose}>Close</Button>
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
              Print Sheet / Save PDF
            </Button>
          </Space>
        </div>
      }
      footer={
        <div className="no-print" style={{ display: "flex", justifyContent: "flex-end" }}>
          <Space wrap>
            <Button onClick={onClose}>Close</Button>
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
              Print Sheet / Save PDF
            </Button>
          </Space>
        </div>
      }
      destroyOnClose
    >
      {/* Precision Single-Page Landscape Print CSS */}
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
          .collection-print-root {
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 9.5px !important;
          }
          .print-table th,
          .print-table td {
            border: 1px solid #111 !important;
            padding: 3px 4px !important;
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
            height: 20px !important;
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
          overflow-x: auto;
        }
        .collection-print-root {
          background: #fff;
          padding: 18px 22px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          color: #111;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          min-width: 900px;
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
          padding: 4px 6px;
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
              {sheetMeta.program}
            </p>
            <div
              style={{
                display: "inline-block",
                marginTop: 3,
                padding: "2px 16px",
                border: "1.2px solid #222",
                borderRadius: 3,
                fontWeight: "bold",
                fontSize: 12,
              }}
            >
              {sheetMeta.badge}
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
              fontSize: 11,
              marginBottom: 6,
            }}
          >
            <div>
              <strong>Somiti Name: </strong>
              <span>{selectedSomiti ? selectedSomiti.name : "All Somities"}</span>
              {selectedSomiti?.code && (
                <span style={{ marginLeft: 4 }}>
                  ({selectedSomiti.somitiId || selectedSomiti.code})
                </span>
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

          {/* ============================================================== */}
          {/* SHEET 1: SAVINGS COLLECTION SHEET                              */}
          {/* ============================================================== */}
          {sheetType === "savings" && (
            <>
              {membersList.length === 0 ? (
                <Empty description="No members found for this Somiti" style={{ padding: "30px 0" }} />
              ) : (
                <table className="print-table">
                  <thead>
                    <tr>
                      <th style={{ width: "4%" }}>SL</th>
                      <th style={{ width: "9%" }}>Member ID</th>
                      <th style={{ width: "18%", textAlign: "left" }}>Member Name</th>
                      <th style={{ width: "10%" }}>Mobile No</th>
                      <th style={{ width: "11%", textAlign: "right" }}>Gen. Sav. Bal. (৳)</th>
                      <th style={{ width: "11%", background: "#f0fdf4" }}>Gen. Sav. Coll (৳)</th>
                      <th style={{ width: "11%", textAlign: "right" }}>Spc. Sav. Bal. (৳)</th>
                      <th style={{ width: "11%", background: "#fefce8" }}>Spc. Sav. Coll (৳)</th>
                      <th style={{ width: "11%", fontWeight: "bold" }}>Total Sav. Coll (৳)</th>
                      <th style={{ width: "14%" }}>Member Signature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membersList.map((member, index) => {
                      const genBal = toAmount(member.savingsAccount?.generalSavingsBalance);
                      const spcBal = toAmount(member.savingsAccount?.specialSavingsBalance);

                      return (
                        <tr key={member.id || index}>
                          <td style={{ textAlign: "center", fontWeight: "bold" }}>{index + 1}</td>
                          <td style={{ textAlign: "center", fontWeight: 600 }}>
                            {member.memberId || `ID: ${member.id}`}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{member.fullName}</div>
                            {member.fatherName && (
                              <div style={{ fontSize: 9, color: "#64748b" }}>
                                Guardian: {member.fatherName}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: "center", fontSize: 10 }}>
                            {member.mobileNumber || "—"}
                          </td>
                          <td style={{ textAlign: "right", color: "#047857", fontWeight: 600 }}>
                            {formatCurrency(genBal)}
                          </td>
                          {/* Blank pen-entry box for General Savings */}
                          <td className="print-blank-box" style={{ background: "#fcfffc" }}></td>
                          <td style={{ textAlign: "right", color: "#0284c7", fontWeight: 600 }}>
                            {formatCurrency(spcBal)}
                          </td>
                          {/* Blank pen-entry box for Special Savings */}
                          <td className="print-blank-box" style={{ background: "#fffdf9" }}></td>
                          {/* Blank pen-entry box for Total Savings */}
                          <td className="print-blank-box" style={{ background: "#fcfcff" }}></td>
                          {/* Member Signature line */}
                          <td style={{ textAlign: "center", verticalAlign: "bottom", paddingBottom: 2 }}>
                            <div
                              style={{
                                borderBottom: "1px dotted #888",
                                width: "90%",
                                margin: "0 auto",
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}

                    {/* Summary Row */}
                    <tr style={{ background: "#f8f9fa", fontWeight: "bold" }}>
                      <td colSpan={4} style={{ textAlign: "right", paddingRight: 8 }}>
                        Total Somiti Members ({membersList.length} Members):
                      </td>
                      <td style={{ textAlign: "right", color: "#047857" }}>
                        {formatCurrency(totalGenSavingsBalance)}
                      </td>
                      <td
                        className="print-blank-box"
                        style={{ textAlign: "center", fontSize: 9.5, color: "#888" }}
                      >
                        [Gen. Sav Total]
                      </td>
                      <td style={{ textAlign: "right", color: "#0284c7" }}>
                        {formatCurrency(totalSpcSavingsBalance)}
                      </td>
                      <td
                        className="print-blank-box"
                        style={{ textAlign: "center", fontSize: 9.5, color: "#888" }}
                      >
                        [Spc. Sav Total]
                      </td>
                      <td
                        className="print-blank-box"
                        style={{ textAlign: "center", fontSize: 9.5, color: "#888" }}
                      >
                        [Grand Sav Total]
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* ============================================================== */}
          {/* SHEET 2: DPS COLLECTION SHEET                                  */}
          {/* ============================================================== */}
          {sheetType === "dps" && (
            <>
              {dpsList.length === 0 ? (
                <Empty description="No DPS accounts found for this Somiti" style={{ padding: "30px 0" }} />
              ) : (
                <table className="print-table">
                  <thead>
                    <tr>
                      <th style={{ width: "4%" }}>SL</th>
                      <th style={{ width: "9%" }}>Member ID</th>
                      <th style={{ width: "18%", textAlign: "left" }}>Member Name</th>
                      <th style={{ width: "10%" }}>DPS Acc #</th>
                      <th style={{ width: "7%" }}>Tenure</th>
                      <th style={{ width: "6%" }}>Inst #</th>
                      <th style={{ width: "11%", textAlign: "right" }}>Monthly Target (৳)</th>
                      <th style={{ width: "11%", background: "#eff6ff" }}>Collected DPS (৳)</th>
                      <th style={{ width: "8%" }}>Late Fine (৳)</th>
                      <th style={{ width: "11%", fontWeight: "bold" }}>Total Received (৳)</th>
                      <th style={{ width: "13%" }}>Member Signature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dpsList.map((item, index) => (
                      <tr key={item.id || index}>
                        <td style={{ textAlign: "center", fontWeight: "bold" }}>{index + 1}</td>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>
                          {item.memberId || `ID: ${item.id}`}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.fullName}</div>
                          <div style={{ fontSize: 9, color: "#64748b" }}>{item.mobileNumber}</div>
                        </td>
                        <td style={{ textAlign: "center", fontWeight: 700, color: "#0369a1" }}>
                          {item.dpsNo}
                        </td>
                        <td style={{ textAlign: "center", fontSize: 10 }}>{item.tenure}</td>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>{item.instNo}</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {formatCurrency(item.monthlyDemand)}
                        </td>
                        {/* Blank pen-entry box for DPS collection */}
                        <td className="print-blank-box" style={{ background: "#fcfcff" }}></td>
                        {/* Blank pen-entry box for Late Fine */}
                        <td className="print-blank-box"></td>
                        {/* Blank pen-entry box for Total DPS received */}
                        <td className="print-blank-box" style={{ background: "#f8fafc" }}></td>
                        {/* Member Signature line */}
                        <td style={{ textAlign: "center", verticalAlign: "bottom", paddingBottom: 2 }}>
                          <div
                            style={{
                              borderBottom: "1px dotted #888",
                              width: "90%",
                              margin: "0 auto",
                            }}
                          />
                        </td>
                      </tr>
                    ))}

                    {/* Summary Row */}
                    <tr style={{ background: "#f8f9fa", fontWeight: "bold" }}>
                      <td colSpan={6} style={{ textAlign: "right", paddingRight: 8 }}>
                        Total DPS Demand ({dpsList.length} Accounts):
                      </td>
                      <td style={{ textAlign: "right", fontSize: 11 }}>
                        {formatCurrency(totalDpsDemand)}
                      </td>
                      <td
                        className="print-blank-box"
                        style={{ textAlign: "center", fontSize: 9.5, color: "#888" }}
                      >
                        [DPS Total]
                      </td>
                      <td
                        className="print-blank-box"
                        style={{ textAlign: "center", fontSize: 9.5, color: "#888" }}
                      >
                        [Fine Total]
                      </td>
                      <td
                        className="print-blank-box"
                        style={{ textAlign: "center", fontSize: 9.5, color: "#888" }}
                      >
                        [Grand Total]
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* ============================================================== */}
          {/* SHEET 3: LOAN REPAYMENT SHEET                                  */}
          {/* ============================================================== */}
          {sheetType === "loan" && (
            <>
              {installments.length === 0 ? (
                <Empty description="No due loan installments found for this date" style={{ padding: "30px 0" }} />
              ) : (
                <table className="print-table">
                  <thead>
                    <tr>
                      <th style={{ width: "4%" }}>SL</th>
                      <th style={{ width: "9%" }}>Member ID</th>
                      <th style={{ width: "19%", textAlign: "left" }}>Member Name</th>
                      <th style={{ width: "10%" }}>Mobile No</th>
                      <th style={{ width: "9%" }}>Loan ID</th>
                      <th style={{ width: "6%" }}>Inst #</th>
                      <th style={{ width: "12%", textAlign: "right" }}>Loan Due / Demand (৳)</th>
                      <th style={{ width: "12%", background: "#eef2ff" }}>Collected Loan (৳)</th>
                      <th style={{ width: "11%", textAlign: "right" }}>Remaining Balance (৳)</th>
                      <th style={{ width: "14%" }}>Member Signature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installments.map((item, index) => {
                      const member = item.loan?.member;
                      const dueLoan = Math.max(0, toAmount(item.amount) - toAmount(item.paidAmount));

                      return (
                        <tr key={item.id || index}>
                          <td style={{ textAlign: "center", fontWeight: "bold" }}>{index + 1}</td>
                          <td style={{ textAlign: "center", fontWeight: 600 }}>
                            {member?.memberId || `ID: ${member?.id || "—"}`}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{member?.fullName || "—"}</div>
                            {member?.fatherName && (
                              <div style={{ fontSize: 9, color: "#64748b" }}>
                                Guardian: {member.fatherName}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: "center", fontSize: 10 }}>
                            {member?.mobileNumber || "—"}
                          </td>
                          <td style={{ textAlign: "center", fontWeight: 600 }}>
                            {item.loan?.loanId || "—"}
                          </td>
                          <td style={{ textAlign: "center", fontWeight: 600 }}>
                            #{item.installmentNo}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700, color: "#1e293b" }}>
                            {formatCurrency(dueLoan)}
                          </td>
                          {/* Blank pen-entry box for Collected Loan */}
                          <td className="print-blank-box" style={{ background: "#fcfcff" }}></td>
                          {/* Blank pen-entry box for Remaining Balance */}
                          <td className="print-blank-box"></td>
                          {/* Member Signature line */}
                          <td style={{ textAlign: "center", verticalAlign: "bottom", paddingBottom: 2 }}>
                            <div
                              style={{
                                borderBottom: "1px dotted #888",
                                width: "90%",
                                margin: "0 auto",
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}

                    {/* Summary Row */}
                    <tr style={{ background: "#f8f9fa", fontWeight: "bold" }}>
                      <td colSpan={6} style={{ textAlign: "right", paddingRight: 8 }}>
                        Total Loan Demand ({installments.length} Members):
                      </td>
                      <td style={{ textAlign: "right", fontSize: 11.5 }}>
                        {formatCurrency(totalDueLoan)}
                      </td>
                      <td
                        className="print-blank-box"
                        style={{ textAlign: "center", fontSize: 9.5, color: "#888" }}
                      >
                        [Loan Total]
                      </td>
                      <td
                        className="print-blank-box"
                        style={{ textAlign: "center", fontSize: 9.5, color: "#888" }}
                      >
                        [Balance Total]
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* ============================================================== */}
          {/* SHEET 4: CONSOLIDATED ALL-IN-ONE SHEET                         */}
          {/* ============================================================== */}
          {sheetType === "combined" && (
            <>
              {installments.length === 0 ? (
                <Empty description="No due installments found for this date" style={{ padding: "30px 0" }} />
              ) : (
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
                      <th style={{ width: "9%", background: "#eef2ff" }}>Collected Loan (৳)</th>
                      <th style={{ width: "9%", background: "#f0fdf4" }}>General Sav. (৳)</th>
                      <th style={{ width: "9%", background: "#fefce8" }}>Special Sav. (৳)</th>
                      <th style={{ width: "9%", fontWeight: "bold" }}>Total Coll. (৳)</th>
                      <th style={{ width: "10%" }}>Member Signature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installments.map((item, index) => {
                      const member = item.loan?.member;
                      const dueLoan = Math.max(0, toAmount(item.amount) - toAmount(item.paidAmount));

                      return (
                        <tr key={item.id || index}>
                          <td style={{ textAlign: "center", fontWeight: "bold" }}>{index + 1}</td>
                          <td style={{ textAlign: "center", fontWeight: 600 }}>
                            {member?.memberId || "—"}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{member?.fullName || "—"}</div>
                            {!selectedSomiti && member?.somiti?.name && (
                              <div style={{ fontSize: 9, color: "#555" }}>
                                🏷️ {member.somiti.name}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: "center", fontSize: 10 }}>
                            {member?.mobileNumber || "—"}
                          </td>
                          <td style={{ textAlign: "center" }}>{item.loan?.loanId || "—"}</td>
                          <td style={{ textAlign: "center", fontWeight: 600 }}>
                            #{item.installmentNo}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 600 }}>
                            {formatCurrency(dueLoan)}
                          </td>
                          {/* Blank boxes for Field Officer's manual handwriting */}
                          <td className="print-blank-box" style={{ background: "#fcfcff" }}></td>
                          <td className="print-blank-box" style={{ background: "#fcfffc" }}></td>
                          <td className="print-blank-box" style={{ background: "#fffdf9" }}></td>
                          <td className="print-blank-box"></td>
                          {/* Member Signature line */}
                          <td style={{ textAlign: "center", verticalAlign: "bottom", paddingBottom: 2 }}>
                            <div
                              style={{
                                borderBottom: "1px dotted #888",
                                width: "90%",
                                margin: "0 auto",
                              }}
                            />
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
                      <td
                        className="print-blank-box"
                        style={{ textAlign: "center", fontSize: 9.5, color: "#888" }}
                      >
                        [Loan Total]
                      </td>
                      <td
                        className="print-blank-box"
                        style={{ textAlign: "center", fontSize: 9.5, color: "#888" }}
                      >
                        [Gen. Sav Total]
                      </td>
                      <td
                        className="print-blank-box"
                        style={{ textAlign: "center", fontSize: 9.5, color: "#888" }}
                      >
                        [Spc. Sav Total]
                      </td>
                      <td
                        className="print-blank-box"
                        style={{ textAlign: "center", fontSize: 9.5, color: "#888" }}
                      >
                        [Grand Total]
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* Instructions and Signature Blocks */}
          <div
            style={{
              marginTop: 14,
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
                  paddingTop: 3,
                  fontWeight: "bold",
                  fontSize: 10.5,
                }}
              >
                Field Officer Signature & Date
              </div>
              <div style={{ fontSize: 9.5, color: "#666" }}>Collector</div>
            </div>

            <div style={{ textAlign: "center", width: "26%" }}>
              <div
                style={{
                  borderTop: "1.2px solid #222",
                  paddingTop: 3,
                  fontWeight: "bold",
                  fontSize: 10.5,
                }}
              >
                Accountant / Cashier Signature
              </div>
              <div style={{ fontSize: 9.5, color: "#666" }}>Receiver</div>
            </div>

            <div style={{ textAlign: "center", width: "26%" }}>
              <div
                style={{
                  borderTop: "1.2px solid #222",
                  paddingTop: 3,
                  fontWeight: "bold",
                  fontSize: 10.5,
                }}
              >
                Branch Manager Signature & Seal
              </div>
              <div style={{ fontSize: 9.5, color: "#666" }}>Authorized Approver</div>
            </div>
          </div>

          {/* Bottom Print Note */}
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
            <span>Software: Purbasha Microfinance & Loan Management System</span>
            <span>Page: 01 / 01</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
