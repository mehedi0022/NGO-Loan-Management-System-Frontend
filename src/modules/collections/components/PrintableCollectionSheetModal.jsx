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
  dpsAccounts = [],
  dueDate,
  selectedSomiti,
  currentUser,
  defaultSheetType = "savings",
}) {
  const printAreaRef = useRef(null);
  const [sheetType, setSheetType] = useState(
    defaultSheetType === "combined" ? "all" : defaultSheetType,
  );

  const handlePrint = () => {
    window.print();
  };

  const loanInstallments = useMemo(() => {
    return (installments || []).filter(
      (item) => !item.isDpsOnly && item.loanId,
    );
  }, [installments]);

  const totalDueLoan = useMemo(() => {
    return loanInstallments.reduce((acc, item) => {
      const due = Math.max(0, toAmount(item.amount) - toAmount(item.paidAmount));
      return acc + due;
    }, 0);
  }, [loanInstallments]);

  const officerName =
    selectedSomiti?.fieldOfficer?.fullName ||
    (currentUser?.role === "FIELD_OFFICER"
      ? currentUser.fullName
      : "All Officers / Branch");

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

  // DPS accounts list: 100% dynamic from actual active DPS accounts in the database
  const dpsList = useMemo(() => {
    // 1. If explicit dpsAccounts prop is provided
    if (Array.isArray(dpsAccounts) && dpsAccounts.length > 0) {
      return dpsAccounts
        .filter((acc) => !acc.status || acc.status === "ACTIVE")
        .map((acc, idx) => {
          const member = acc.member || {};
          const paid = Number(acc.paidInstallments) || 0;
          const isWk = acc.frequency === "WEEKLY";
          const tenure = isWk
            ? `${acc.durationMonths ? Math.round((acc.durationMonths / 12) * 52) : 52} W`
            : `${acc.durationMonths || 12} M`;

          return {
            id: acc.id || idx + 1,
            memberId: member.memberId || "",
            fullName: member.fullName || "",
            fatherName: member.fatherName,
            guardianName: member.guardianName,
            mobileNumber: member.mobileNumber || "",
            dpsNo:
              acc.dpsNumber ||
              `DPS-${String(acc.id || idx + 1).padStart(6, "0")}`,
            frequency: acc.frequency || "MONTHLY",
            tenure,
            instNo: `#${paid + 1}`,
            monthlyDemand: toAmount(acc.installmentAmount),
          };
        });
    }

    // 2. Otherwise extract active DPS accounts from membersList
    const list = [];
    for (const member of membersList) {
      const activeAccounts = Array.isArray(member.dpsAccounts)
        ? member.dpsAccounts.filter((d) => !d.status || d.status === "ACTIVE")
        : member.dpsAccount &&
            (!member.dpsAccount.status || member.dpsAccount.status === "ACTIVE")
          ? [member.dpsAccount]
          : [];

      for (const dps of activeAccounts) {
        const paid = Number(dps.paidInstallments) || 0;
        const isWk = dps.frequency === "WEEKLY";
        const tenure = isWk
          ? `${dps.durationMonths ? Math.round((dps.durationMonths / 12) * 52) : 52} W`
          : dps.durationMonths
            ? `${dps.durationMonths} M`
            : dps.tenureMonths
              ? `${dps.tenureMonths} M`
              : "";

        list.push({
          id: dps.id,
          memberId: member.memberId || "",
          fullName: member.fullName || "",
          fatherName: member.fatherName,
          guardianName: member.guardianName,
          mobileNumber: member.mobileNumber || "",
          dpsNo: dps.dpsNumber || `DPS-${String(dps.id).padStart(6, "0")}`,
          frequency: dps.frequency || "MONTHLY",
          tenure,
          instNo: `#${paid + 1}`,
          monthlyDemand: toAmount(
            dps.installmentAmount ?? dps.monthlyInstallment ?? 0,
          ),
        });
      }
    }
    return list;
  }, [dpsAccounts, membersList]);

  const totalDpsDemand = dpsList.reduce(
    (sum, item) => sum + item.monthlyDemand,
    0,
  );

  // Helper: Header block for an individual sheet
  const renderHeader = (program, badge) => (
    <div style={{ textAlign: "center", marginBottom: 6 }}>
      <h1
        style={{
          margin: 0,
          fontSize: 17,
          fontWeight: "bold",
          letterSpacing: "0.5px",
        }}
      >
        Purbasha Financial Development Organization
      </h1>
      <p style={{ margin: "1px 0 0 0", fontSize: 11.5, color: "#333" }}>
        {program}
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
        {badge}
      </div>
    </div>
  );

  // Helper: Meta Info Bar
  const renderMetaBar = () => (
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
        <span style={{ marginLeft: 5, color: "#555" }}>
          ({dueDate.format("dddd")})
        </span>
      </div>
      <div>
        <strong>Field Officer: </strong>
        <span>{officerName}</span>
        {officerPhone && <span style={{ marginLeft: 4 }}>({officerPhone})</span>}
      </div>
      <div>
        <strong>Center / Area: </strong>
        <span>
          {selectedSomiti?.area || selectedSomiti?.address || "Branch Area"}
        </span>
      </div>
    </div>
  );

  // Helper: Signature Block with enhanced top padding
  const renderSignatureBlock = () => (
    <div
      style={{
        marginTop: 38,
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
          Field Officer Signature & Date
        </div>
        <div style={{ fontSize: 9.5, color: "#666" }}>Collector</div>
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
        <div style={{ fontSize: 9.5, color: "#666" }}>Receiver</div>
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
          Branch Manager Signature & Seal
        </div>
        <div style={{ fontSize: 9.5, color: "#666" }}>Authorized Approver</div>
      </div>
    </div>
  );

  // Helper: Footer
  const renderFooter = (pageNum = 1, totalPages = 1) => (
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
      <span>
        Page: {String(pageNum).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}
      </span>
    </div>
  );

  // Helper: Savings Table (Sheet 1)
  const renderSavingsTable = () => {
    if (membersList.length === 0) {
      return (
        <Empty
          description="No members found for this Somiti"
          style={{ padding: "30px 0" }}
        />
      );
    }
    return (
      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: "3.5%" }}>SL</th>
            <th style={{ width: "8.5%" }}>Member ID</th>
            <th style={{ width: "16%", textAlign: "left" }}>
              Member / Guardian Name
            </th>
            <th style={{ width: "9%" }}>Mobile No</th>
            <th style={{ width: "9.5%", textAlign: "right" }}>
              Gen. Sav. Bal. (৳)
            </th>
            <th style={{ width: "9.5%", background: "#f0fdf4" }}>
              Gen. Sav. Coll (৳)
            </th>
            <th style={{ width: "9.5%", textAlign: "right" }}>
              Spc. Sav. Bal. (৳)
            </th>
            <th style={{ width: "9.5%", background: "#fefce8" }}>
              Spc. Sav. Coll (৳)
            </th>
            <th style={{ width: "10%", fontWeight: "bold" }}>
              Total Sav. Coll (৳)
            </th>
            <th style={{ width: "15%", whiteSpace: "nowrap" }}>
              Member Signature
            </th>
          </tr>
        </thead>
        <tbody>
          {membersList.map((member, index) => {
            const genBal = toAmount(member.savingsAccount?.generalSavingsBalance);
            const spcBal = toAmount(member.savingsAccount?.specialSavingsBalance);

            return (
              <tr key={member.id || index}>
                <td style={{ textAlign: "center", fontWeight: "bold" }}>
                  {index + 1}
                </td>
                <td style={{ textAlign: "center", fontWeight: 600 }}>
                  {member.memberId || ""}
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{member.fullName}</div>
                  {(member.guardianName || member.fatherName) && (
                    <div style={{ fontSize: 9, color: "#64748b" }}>
                      Guardian: {member.guardianName || member.fatherName}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: "center", fontSize: 10 }}>
                  {member.mobileNumber || ""}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    color: "#047857",
                    fontWeight: 600,
                  }}
                >
                  {formatCurrency(genBal)}
                </td>
                <td
                  className="print-blank-box"
                  style={{ background: "#fcfffc" }}
                ></td>
                <td
                  style={{
                    textAlign: "right",
                    color: "#0284c7",
                    fontWeight: 600,
                  }}
                >
                  {formatCurrency(spcBal)}
                </td>
                <td
                  className="print-blank-box"
                  style={{ background: "#fffdf9" }}
                ></td>
                <td
                  className="print-blank-box"
                  style={{ background: "#fcfcff" }}
                ></td>
                <td
                  className="print-blank-box"
                  style={{ textAlign: "center" }}
                ></td>
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
            <td className="print-blank-box"></td>
            <td style={{ textAlign: "right", color: "#0284c7" }}>
              {formatCurrency(totalSpcSavingsBalance)}
            </td>
            <td className="print-blank-box"></td>
            <td className="print-blank-box"></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    );
  };

  // Helper: DPS Table (Sheet 2)
  const renderDpsTable = () => {
    if (dpsList.length === 0) {
      return (
        <Empty
          description="No DPS accounts found for this Somiti"
          style={{ padding: "30px 0" }}
        />
      );
    }
    return (
      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: "3%" }}>SL</th>
            <th style={{ width: "8%" }}>Member ID</th>
            <th style={{ width: "15%", textAlign: "left" }}>
              Member / Guardian Name
            </th>
            <th style={{ width: "8.5%" }}>Mobile No</th>
            <th style={{ width: "8%" }}>DPS Acc #</th>
            <th style={{ width: "5.5%" }}>Tenure</th>
            <th style={{ width: "4.5%" }}>Inst #</th>
            <th style={{ width: "9%", textAlign: "right" }}>
              Target Inst. (৳)
            </th>
            <th style={{ width: "9%", background: "#eff6ff" }}>
              Collected DPS (৳)
            </th>
            <th style={{ width: "6.5%" }}>Late Fine (৳)</th>
            <th style={{ width: "9%", fontWeight: "bold" }}>
              Total Received (৳)
            </th>
            <th style={{ width: "14%", whiteSpace: "nowrap" }}>
              Member Signature
            </th>
          </tr>
        </thead>
        <tbody>
          {dpsList.map((item, index) => (
            <tr key={item.id || index}>
              <td style={{ textAlign: "center", fontWeight: "bold" }}>
                {index + 1}
              </td>
              <td style={{ textAlign: "center", fontWeight: 600 }}>
                {item.memberId || ""}
              </td>
              <td>
                <div style={{ fontWeight: 600 }}>{item.fullName}</div>
                {(item.guardianName || item.fatherName) && (
                  <div style={{ fontSize: 9, color: "#64748b" }}>
                    Guardian: {item.guardianName || item.fatherName}
                  </div>
                )}
              </td>
              <td style={{ textAlign: "center", fontSize: 10 }}>
                {item.mobileNumber || ""}
              </td>
              <td
                style={{
                  textAlign: "center",
                  fontWeight: 700,
                  color: "#0369a1",
                }}
              >
                {item.dpsNo}
              </td>
              <td style={{ textAlign: "center", fontSize: 10 }}>{item.tenure}</td>
              <td style={{ textAlign: "center", fontWeight: 600 }}>
                {item.instNo}
              </td>
              <td style={{ textAlign: "right", fontWeight: 700 }}>
                {formatCurrency(item.monthlyDemand)}
                {item.frequency === "WEEKLY" && (
                  <span
                    style={{
                      fontSize: 8.5,
                      color: "#0369a1",
                      marginLeft: 2,
                    }}
                  >
                    (Wk)
                  </span>
                )}
              </td>
              <td
                className="print-blank-box"
                style={{ background: "#fcfcff" }}
              ></td>
              <td className="print-blank-box"></td>
              <td
                className="print-blank-box"
                style={{ background: "#f8fafc" }}
              ></td>
              <td
                className="print-blank-box"
                style={{ textAlign: "center" }}
              ></td>
            </tr>
          ))}

          {/* Summary Row */}
          <tr style={{ background: "#f8f9fa", fontWeight: "bold" }}>
            <td colSpan={7} style={{ textAlign: "right", paddingRight: 8 }}>
              Total DPS Demand ({dpsList.length} Accounts):
            </td>
            <td style={{ textAlign: "right", fontSize: 11 }}>
              {formatCurrency(totalDpsDemand)}
            </td>
            <td className="print-blank-box"></td>
            <td className="print-blank-box"></td>
            <td className="print-blank-box"></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    );
  };

  // Helper: Loan Table (Sheet 3)
  const renderLoanTable = () => {
    if (loanInstallments.length === 0) {
      return (
        <Empty
          description="No due loan installments found for this date"
          style={{ padding: "30px 0" }}
        />
      );
    }
    return (
      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: "3.5%" }}>SL</th>
            <th style={{ width: "8.5%" }}>Member ID</th>
            <th style={{ width: "16%", textAlign: "left" }}>
              Member / Guardian Name
            </th>
            <th style={{ width: "9%" }}>Mobile No</th>
            <th style={{ width: "8%" }}>Loan ID</th>
            <th style={{ width: "5%" }}>Inst #</th>
            <th style={{ width: "11.5%", textAlign: "right" }}>
              Loan Due / Demand (৳)
            </th>
            <th style={{ width: "11.5%", background: "#eef2ff" }}>
              Collected Loan (৳)
            </th>
            <th style={{ width: "11%", textAlign: "right" }}>
              Remaining Balance (৳)
            </th>
            <th style={{ width: "16%", whiteSpace: "nowrap" }}>
              Member Signature
            </th>
          </tr>
        </thead>
        <tbody>
          {loanInstallments.map((item, index) => {
            const member = item.loan?.member;
            const dueLoan = Math.max(
              0,
              toAmount(item.amount) - toAmount(item.paidAmount),
            );

            return (
              <tr key={item.id || index}>
                <td style={{ textAlign: "center", fontWeight: "bold" }}>
                  {index + 1}
                </td>
                <td style={{ textAlign: "center", fontWeight: 600 }}>
                  {member?.memberId || ""}
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{member?.fullName || ""}</div>
                  {(member?.guardianName || member?.fatherName) && (
                    <div style={{ fontSize: 9, color: "#64748b" }}>
                      Guardian: {member?.guardianName || member?.fatherName}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: "center", fontSize: 10 }}>
                  {member?.mobileNumber || ""}
                </td>
                <td style={{ textAlign: "center", fontWeight: 600 }}>
                  {item.loan?.loanId || ""}
                </td>
                <td style={{ textAlign: "center", fontWeight: 600 }}>
                  #{item.installmentNo}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    fontWeight: 700,
                    color: "#1e293b",
                  }}
                >
                  {formatCurrency(dueLoan)}
                </td>
                <td
                  className="print-blank-box"
                  style={{ background: "#fcfcff" }}
                ></td>
                <td className="print-blank-box"></td>
                <td
                  className="print-blank-box"
                  style={{ textAlign: "center" }}
                ></td>
              </tr>
            );
          })}

          {/* Summary Row */}
          <tr style={{ background: "#f8f9fa", fontWeight: "bold" }}>
            <td colSpan={6} style={{ textAlign: "right", paddingRight: 8 }}>
              Total Loan Demand ({loanInstallments.length} Members):
            </td>
            <td style={{ textAlign: "right", fontSize: 11.5 }}>
              {formatCurrency(totalDueLoan)}
            </td>
            <td className="print-blank-box"></td>
            <td className="print-blank-box"></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    );
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
              value={sheetType === "combined" ? "all" : sheetType}
              onChange={(e) => setSheetType(e.target.value)}
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="savings">1. Savings Sheet</Radio.Button>
              <Radio.Button value="dps">2. DPS Sheet</Radio.Button>
              <Radio.Button value="loan">3. Loan Sheet</Radio.Button>
              <Radio.Button value="all">4. All Sheets (1, 2, 3)</Radio.Button>
            </Radio.Group>
          </Space>
        </div>
      }
      footer={
        <div
          className="no-print"
          style={{ display: "flex", justifyContent: "flex-end" }}
        >
          <Space wrap>
            <Button onClick={onClose}>Close</Button>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
            >
              Print Sheet / Save PDF
            </Button>
          </Space>
        </div>
      }
      destroyOnClose
    >
      {/* Precision Landscape Print CSS */}
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
          .sheet-page {
            page-break-after: auto;
          }
          .sheet-page-break {
            display: block !important;
            page-break-after: always !important;
            break-after: page !important;
            height: 0 !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
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
        .sheet-page {
          background: #fff;
        }
        .sheet-page-break {
          border-top: 2px dashed #94a3b8;
          margin: 32px 0 28px 0;
          position: relative;
        }
        .sheet-page-break::after {
          content: "✂ Page Break (Next Sheet in Print / PDF)";
          position: absolute;
          top: -10px;
          right: 16px;
          background: #f1f5f9;
          color: #475569;
          font-size: 10px;
          font-weight: 600;
          padding: 0 8px;
          border-radius: 4px;
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
          {/* ============================================================== */}
          {/* OPTION 1: SAVINGS ONLY                                         */}
          {/* ============================================================== */}
          {sheetType === "savings" && (
            <div className="sheet-page">
              {renderHeader(
                "Microfinance & Savings Program",
                "1. Daily Field Collection Sheet — Savings (General & Special)",
              )}
              {renderMetaBar()}
              {renderSavingsTable()}
              {renderSignatureBlock()}
              {renderFooter(1, 1)}
            </div>
          )}

          {/* ============================================================== */}
          {/* OPTION 2: DPS ONLY                                             */}
          {/* ============================================================== */}
          {sheetType === "dps" && (
            <div className="sheet-page">
              {renderHeader(
                "Deposit Pension Scheme (DPS) Program",
                "2. Daily Field Collection Sheet — DPS (Deposit Pension Scheme)",
              )}
              {renderMetaBar()}
              {renderDpsTable()}
              {renderSignatureBlock()}
              {renderFooter(1, 1)}
            </div>
          )}

          {/* ============================================================== */}
          {/* OPTION 3: LOAN ONLY                                            */}
          {/* ============================================================== */}
          {sheetType === "loan" && (
            <div className="sheet-page">
              {renderHeader(
                "Microfinance & Credit Program",
                "3. Daily Field Collection Sheet — Loan Repayment",
              )}
              {renderMetaBar()}
              {renderLoanTable()}
              {renderSignatureBlock()}
              {renderFooter(1, 1)}
            </div>
          )}

          {/* ============================================================== */}
          {/* OPTION 4: ALL SHEETS (SAVINGS + DPS + LOAN IN SINGLE PDF)      */}
          {/* ============================================================== */}
          {(sheetType === "all" || sheetType === "combined") && (
            <>
              {/* Sheet 1: Savings */}
              <div className="sheet-page">
                {renderHeader(
                  "Microfinance & Savings Program",
                  "1. Daily Field Collection Sheet — Savings (General & Special)",
                )}
                {renderMetaBar()}
                {renderSavingsTable()}
                {renderSignatureBlock()}
                {renderFooter(1, 3)}
              </div>

              {/* Automatic Page Break for Printing & Clean Preview Divider */}
              <div className="sheet-page-break" />

              {/* Sheet 2: DPS */}
              <div className="sheet-page">
                {renderHeader(
                  "Deposit Pension Scheme (DPS) Program",
                  "2. Daily Field Collection Sheet — DPS (Deposit Pension Scheme)",
                )}
                {renderMetaBar()}
                {renderDpsTable()}
                {renderSignatureBlock()}
                {renderFooter(2, 3)}
              </div>

              {/* Automatic Page Break for Printing & Clean Preview Divider */}
              <div className="sheet-page-break" />

              {/* Sheet 3: Loan */}
              <div className="sheet-page">
                {renderHeader(
                  "Microfinance & Credit Program",
                  "3. Daily Field Collection Sheet — Loan Repayment",
                )}
                {renderMetaBar()}
                {renderLoanTable()}
                {renderSignatureBlock()}
                {renderFooter(3, 3)}
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
