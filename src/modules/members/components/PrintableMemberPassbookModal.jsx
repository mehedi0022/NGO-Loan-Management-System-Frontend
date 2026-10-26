import { PrinterOutlined } from "@ant-design/icons";
import { Button, Modal, Radio, Space, Typography } from "antd";
import { useState, useEffect } from "react";
import { formatCurrency, formatDate, formatEnum } from "../../loans/loanFormatters.js";
import { resolveUploadUrl } from "../../../utils/uploadUrl.js";

export function PrintableMemberPassbookModal({
  open,
  onClose,
  member,
  savingsTransactions = [],
  loans = [],
  defaultSection = "all",
}) {
  if (!member) return null;

  // View Mode: 'field' (Blank write-in boxes for pen entry) vs 'statement' (digital history)
  const [passbookMode, setPassbookMode] = useState("field");
  // Section Filter: 'all' (Both Loan & Savings) vs 'savings' (Savings Ledger only) vs 'loan' (Loan Card only)
  const [activeSection, setActiveSection] = useState(defaultSection);

  useEffect(() => {
    if (open) {
      setActiveSection(defaultSection || "all");
    }
  }, [open, defaultSection]);

  const somiti = member.somiti;
  const officer = somiti?.fieldOfficer;
  const savings = member.savingsAccount;
  const nominee = member.nominee;
  const presentAddress = member.addresses?.find((a) => a.type === "PRESENT");

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

  const handlePrint = () => {
    window.print();
  };

  const activeLoan = loans.find((l) => l.status === "ACTIVE" || l.status === "APPROVED") || loans[0];

  // If active loan has installments, use them. Otherwise generate 46 weekly blank rows.
  const rawInstallmentRows = activeLoan?.installments?.length
    ? activeLoan.installments
    : Array.from({ length: 46 }, (_, i) => ({
        id: `blank-${i + 1}`,
        installmentNo: i + 1,
        dueDate: null,
        amount: activeLoan?.installmentAmount || 0,
        paidAmount: 0,
        status: "PENDING",
      }));

  const totalPayable = Number(activeLoan?.totalPayable || activeLoan?.principalAmount || 0);

  // 1. Sort incoming savings transactions in ASCENDING chronological order (oldest to newest)
  const sortedTransactions = [...savingsTransactions].sort((a, b) => {
    const tA = new Date(a.transactionDate || a.createdAt || 0).getTime();
    const tB = new Date(b.transactionDate || b.createdAt || 0).getTime();
    if (tA !== tB) return tA - tB;
    return Number(a.id || 0) - Number(b.id || 0);
  });

  // 2. Group transactions from the same meeting / collection into a single passbook ledger line
  const savingsLedgerEntries = [];
  for (const trx of sortedTransactions) {
    const isDeposit = trx.type === "DEPOSIT";
    const trxDate = trx.transactionDate || trx.createdAt;
    const trxDateFormatted = formatDate(trxDate);
    const receipt =
      trx.reference ||
      trx.collection?.collectionId ||
      (trx.collectionId ? `COL-${String(trx.collectionId).padStart(6, "0")}` : null) ||
      trx.transactionId ||
      `TXN-${trx.id}`;

    const amt = Number(trx.amount || 0);
    const isGeneral = trx.savingsType === "GENERAL";
    const isSpecial = trx.savingsType === "SPECIAL";

    const lastEntry = savingsLedgerEntries[savingsLedgerEntries.length - 1];
    const isSameMeeting =
      lastEntry &&
      lastEntry.type === "DEPOSIT" &&
      isDeposit &&
      ((trx.collectionId && lastEntry.collectionId === trx.collectionId) ||
        (receipt && lastEntry.receipt === receipt) ||
        (formatDate(lastEntry.date) === trxDateFormatted &&
          ((isGeneral && lastEntry.generalAmount === 0) ||
            (isSpecial && lastEntry.specialAmount === 0))));

    if (isSameMeeting) {
      if (isGeneral) {
        lastEntry.generalAmount += amt;
      } else if (isSpecial) {
        lastEntry.specialAmount += amt;
      }
      lastEntry.totalDeposit += amt;
      if (trx.balanceAfter) {
        lastEntry.balanceAfter = Number(trx.balanceAfter);
      } else {
        lastEntry.balanceAfter += amt;
      }
      if (!lastEntry.receipt && receipt) {
        lastEntry.receipt = receipt;
      }
    } else {
      savingsLedgerEntries.push({
        id: trx.id,
        collectionId: trx.collectionId,
        date: trxDate,
        receipt,
        type: trx.type,
        savingsType: trx.savingsType,
        generalAmount: isDeposit ? (isGeneral ? amt : 0) : (isGeneral ? amt : 0),
        specialAmount: isDeposit ? (isSpecial ? amt : 0) : (isSpecial ? amt : 0),
        totalDeposit: isDeposit ? amt : 0,
        balanceAfter: Number(trx.balanceAfter || 0),
        sign: "Signed",
      });
    }
  }

  // 3. Reconcile Section A loan installments with Section B savings entries
  let cumulativePaid = 0;
  const installmentRows = rawInstallmentRows.map((inst, index) => {
    const paidAmt = Number(inst.paidAmount) || 0;
    const schedAmt = Number(inst.amount) || Number(activeLoan?.installmentAmount) || 0;
    const isPaid = inst.status === "PAID";
    const isPartial = inst.status === "PARTIAL";

    cumulativePaid += paidAmt;
    const remainingLoanBalance = Math.max(0, totalPayable - cumulativePaid);

    let genSavAmt = Number(inst.generalSavingsAmount || 0);
    let spcSavAmt = Number(inst.specialSavingsAmount || 0);
    let meetingDate = inst.paidAt || null;

    const targetDateFormatted = formatDate(inst.paidAt || inst.dueDate);

    // Look for matching entry in savings ledger
    const matchingLedgerEntry =
      (inst.collectionReceipt &&
        savingsLedgerEntries.find((e) => e.receipt === inst.collectionReceipt)) ||
      savingsLedgerEntries.find(
        (e) => formatDate(e.date) === targetDateFormatted && e.type === "DEPOSIT",
      ) ||
      (paidAmt > 0 && savingsLedgerEntries[index]?.type === "DEPOSIT"
        ? savingsLedgerEntries[index]
        : null);

    if (matchingLedgerEntry) {
      if (genSavAmt === 0 && spcSavAmt === 0) {
        genSavAmt = matchingLedgerEntry.generalAmount;
        spcSavAmt = matchingLedgerEntry.specialAmount;
      }
      if (!meetingDate) meetingDate = matchingLedgerEntry.date;
    }

    // Reciprocally: if installment collection recorded savings not present in savingsLedgerEntries:
    if (
      (genSavAmt > 0 || spcSavAmt > 0) &&
      !savingsLedgerEntries.some(
        (e) =>
          (inst.collectionReceipt && e.receipt === inst.collectionReceipt) ||
          formatDate(e.date) === formatDate(meetingDate || inst.dueDate),
      )
    ) {
      savingsLedgerEntries.push({
        id: `inst-sav-${inst.id || index}`,
        date: meetingDate || inst.dueDate,
        receipt: inst.collectionReceipt || `COL-${String(index + 1).padStart(6, "0")}`,
        type: "DEPOSIT",
        generalAmount: genSavAmt,
        specialAmount: spcSavAmt,
        totalDeposit: genSavAmt + spcSavAmt,
        balanceAfter: 0,
        sign: "Signed",
      });
    }

    const totalRecvAmt = paidAmt + genSavAmt + spcSavAmt;

    return {
      ...inst,
      installmentNo: inst.installmentNo || index + 1,
      meetingDate,
      paidAmt,
      schedAmt,
      isPaid,
      isPartial,
      cumulativePaid,
      remainingLoanBalance,
      genSavAmt,
      spcSavAmt,
      totalRecvAmt,
    };
  });

  // Re-sort savingsLedgerEntries by date ascending to ensure proper ledger sequence
  savingsLedgerEntries.sort((a, b) => {
    const tA = new Date(a.date || 0).getTime();
    const tB = new Date(b.date || 0).getTime();
    return tA - tB;
  });

  // Calculate / smooth cumulative running balance
  let runningSavingsBalance = 0;
  for (const entry of savingsLedgerEntries) {
    if (entry.balanceAfter > 0) {
      runningSavingsBalance = entry.balanceAfter;
    } else {
      if (entry.type === "DEPOSIT") {
        runningSavingsBalance += entry.generalAmount + entry.specialAmount;
      } else {
        runningSavingsBalance -= entry.generalAmount + entry.specialAmount;
      }
      entry.balanceAfter = runningSavingsBalance;
    }
  }

  // Blank rows for savings ledger (24 rows if savings only, 18 rows if full passbook)
  const blankSavingsRowsCount = Math.max(
    activeSection === "savings" ? 24 : 18,
    Math.max(0, 46 - savingsLedgerEntries.length),
  );
  const blankSavingsRows = Array.from(
    { length: Math.min(blankSavingsRowsCount, 30) },
    (_, i) => ({
      id: `sav-blank-${i + 1}`,
    }),
  );

  // 4. DPS Account & Installment Schedule preparation
  const dpsAccountsList = member.dpsAccounts || [];
  const activeDpsAccount =
    dpsAccountsList.find((d) => d.status === "ACTIVE") ||
    dpsAccountsList[0];

  const dpsDurationMonths = Number(activeDpsAccount?.durationMonths || 60);
  const dpsInstallmentAmount = Number(activeDpsAccount?.installmentAmount || 1000);
  const rawDpsInstallments = activeDpsAccount?.installments?.length
    ? activeDpsAccount.installments
    : Array.from({ length: dpsDurationMonths }, (_, i) => ({
        id: `dps-blank-${i + 1}`,
        installmentNo: i + 1,
        dueDate: null,
        amount: dpsInstallmentAmount,
        paidAmount: 0,
        status: "PENDING",
      }));

  let cumulativeDpsPaid = 0;
  const dpsRows = rawDpsInstallments.map((inst, index) => {
    const paidAmt = Number(inst.paidAmount) || 0;
    const isPaid = inst.status === "PAID" || (paidAmt > 0 && paidAmt >= Number(inst.amount || dpsInstallmentAmount));
    const isPartial = inst.status === "PARTIAL";
    cumulativeDpsPaid += paidAmt;

    return {
      ...inst,
      installmentNo: inst.installmentNo || index + 1,
      dueDate: inst.dueDate,
      paidAt: inst.paidAt,
      paidAmt,
      schedAmt: Number(inst.amount) || dpsInstallmentAmount,
      cumulativePaid: cumulativeDpsPaid,
      isPaid,
      isPartial,
    };
  });

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={940}
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
              Member Passbook — {member.fullName} ({member.memberId || `ID: ${member.id}`})
            </Typography.Text>
          </Space>
          <Space wrap>
            <Radio.Group
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value)}
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="all">Full Passbook</Radio.Button>
              <Radio.Button value="loan">Loan Card</Radio.Button>
              <Radio.Button value="savings">Savings Ledger</Radio.Button>
              <Radio.Button value="dps">DPS Ledger</Radio.Button>
            </Radio.Group>
            <Radio.Group
              value={passbookMode}
              onChange={(e) => setPassbookMode(e.target.value)}
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="field">Field Blank Book</Radio.Button>
              <Radio.Button value="statement">Account Statement</Radio.Button>
            </Radio.Group>
            <Button onClick={onClose}>Close</Button>
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
              Print Passbook / PDF
            </Button>
          </Space>
        </div>
      }
      footer={
        <div className="no-print" style={{ display: "flex", justifyContent: "flex-end" }}>
          <Space wrap>
            <Button onClick={onClose}>Close</Button>
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
              Print Passbook / PDF
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
          .passbook-print-root {
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
          .page-break {
            page-break-before: always !important;
            break-before: page !important;
          }
          .write-box {
            border: 1px dashed #64748b !important;
            height: 18px !important;
            background: transparent !important;
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
        .passbook-print-root {
          background: #fff;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          font-size: 11px;
          min-width: 680px;
        }
        .passbook-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 6px;
          margin-bottom: 16px;
        }
        .passbook-table th {
          background-color: #f1f5f9;
          color: #0f172a;
          font-weight: 700;
          font-size: 9.5px;
          text-align: center;
          padding: 4px 5px;
          border: 1px solid #94a3b8;
        }
        .passbook-table td {
          font-size: 9.5px;
          padding: 4px 5px;
          border: 1px solid #cbd5e1;
          color: #1e293b;
        }
        .write-box {
          height: 17px;
          border-bottom: 1px dotted #94a3b8;
          display: block;
          width: 100%;
        }
        .cover-box {
          border: 2px solid #0f172a;
          border-radius: 6px;
          padding: 14px;
          margin-bottom: 16px;
          background: #fff;
        }
      `}</style>

      <div className="preview-container">
        <div className="passbook-print-root">
          {/* ============================================================== */}
          {/* PAGE 1: PASSBOOK COVER & MEMBER IDENTITY                       */}
          {/* ============================================================== */}
          <div className="cover-box">
            <div
              style={{
                textAlign: "center",
                borderBottom: "2px solid #0f172a",
                paddingBottom: 6,
                marginBottom: 10,
              }}
            >
              <h1
                style={{
                  margin: "0 0 2px 0",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#1e293b",
                  textTransform: "uppercase",
                }}
              >
                Purbasha Financial Development Organization
              </h1>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                Member Savings & Loan Collection Passbook
              </div>
            </div>

            {/* Member Details Grid */}
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <div
                style={{
                  width: 90,
                  height: 105,
                  border: "1px solid #cbd5e1",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f8fafc",
                  overflow: "hidden",
                }}
              >
                {member.photoUrl ? (
                  <img
                    src={resolveUploadUrl(member.photoUrl)}
                    alt={member.fullName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 10 }}>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>
                      {member.fullName?.charAt(0)}
                    </div>
                    Passport Photo
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 260 }}>
                <table style={{ width: "100%", fontSize: 10.5, borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "20%", fontWeight: 600, color: "#475569" }}>
                        Member Name:
                      </td>
                      <td style={{ width: "30%", fontWeight: 700, fontSize: 12 }}>
                        {member.fullName}
                      </td>
                      <td style={{ width: "20%", fontWeight: 600, color: "#475569" }}>
                        Member ID:
                      </td>
                      <td style={{ width: "30%", fontWeight: 700, color: "#0284c7" }}>
                        {member.memberId || `ID: ${member.id}`}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, color: "#475569" }}>Somiti / Center:</td>
                      <td>
                        <strong>{somiti?.name || "—"}</strong> ({somiti?.code || "—"})
                      </td>
                      <td style={{ fontWeight: 600, color: "#475569" }}>Meeting Day:</td>
                      <td>
                        <strong>{formatEnum(somiti?.meetingDay)}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, color: "#475569" }}>Savings Account:</td>
                      <td>
                        <strong style={{ color: "#047857" }}>
                          {savings?.accountId || "SAV-00000"}
                        </strong>
                      </td>
                      <td style={{ fontWeight: 600, color: "#475569" }}>Mobile Phone:</td>
                      <td>{member.mobileNumber || "—"}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, color: "#475569" }}>Father / Husband:</td>
                      <td>{member.fatherName || member.guardianName || "—"}</td>
                      <td style={{ fontWeight: 600, color: "#475569" }}>National ID:</td>
                      <td>{member.nidNumber || "—"}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, color: "#475569" }}>Present Address:</td>
                      <td>{presentAddressStr}</td>
                      <td style={{ fontWeight: 600, color: "#475569" }}>Field Officer:</td>
                      <td>{officer?.fullName || "—"}</td>
                    </tr>
                    {nominee && (
                      <tr>
                        <td style={{ fontWeight: 600, color: "#475569" }}>Nominee:</td>
                        <td colSpan={3}>
                          <strong>{nominee.fullName}</strong> ({nominee.relationship}) — Phone:{" "}
                          {nominee.mobileNumber || "—"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION A: WEEKLY SOMITI COLLECTION & LOAN REPAYMENT CARD      */}
          {/* ============================================================== */}
          {(activeSection === "all" || activeSection === "loan") && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 10,
                  marginBottom: 4,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div>
                  <span style={{ fontWeight: 800, fontSize: 12, color: "#0f172a" }}>
                    A. Weekly Somiti Collection & Loan Repayment Card
                  </span>
                  <span style={{ fontSize: 10, color: "#64748b", marginLeft: 8 }}>
                    {passbookMode === "field"
                      ? "(Field Officer signs with pen upon collecting cash each meeting)"
                      : "(Digital Statement of recorded collections)"}
                  </span>
                </div>

                {activeLoan && (
                  <div style={{ display: "flex", gap: 10, fontSize: 10.5, flexWrap: "wrap" }}>
                    <span>
                      Loan ID: <strong>{activeLoan.loanId}</strong>
                    </span>
                    <span>
                      Principal: <strong>{formatCurrency(activeLoan.principalAmount)}</strong>
                    </span>
                    <span>
                      Total Payable: <strong>{formatCurrency(activeLoan.totalPayable)}</strong>
                    </span>
                    <span>
                      Installment: <strong>{formatCurrency(activeLoan.installmentAmount)}</strong>
                    </span>
                  </div>
                )}
              </div>

              <table className="passbook-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>Inst #</th>
                    <th style={{ width: 80 }}>Due Date</th>
                    <th style={{ width: 80 }}>Collection Date</th>
                    <th style={{ width: 75 }}>Scheduled Loan</th>
                    <th style={{ width: 75 }}>Loan Paid</th>
                    <th style={{ width: 75 }}>Loan Balance</th>
                    <th style={{ width: 70 }}>Gen Sav</th>
                    <th style={{ width: 70 }}>Spc Sav</th>
                    <th style={{ width: 80 }}>Total Recv</th>
                    <th style={{ width: 85 }}>Officer Sign</th>
                  </tr>
                </thead>
                <tbody>
                  {installmentRows.map((inst, index) => {
                    // In Field Passbook Mode: show pre-printed schedule with blank writable boxes for field pen entry
                    if (passbookMode === "field") {
                      return (
                        <tr key={inst.id || index}>
                          <td style={{ textAlign: "center", fontWeight: 700 }}>#{inst.installmentNo}</td>
                          <td style={{ textAlign: "center" }}>
                            {inst.dueDate ? formatDate(inst.dueDate) : <span className="write-box" />}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {inst.isPaid || inst.paidAmt > 0 ? (
                              <span style={{ fontSize: 9.5 }}>
                                {formatDate(inst.meetingDate || inst.paidAt || inst.dueDate)}
                              </span>
                            ) : (
                              <span className="write-box" />
                            )}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 600 }}>
                            {inst.schedAmt > 0 ? formatCurrency(inst.schedAmt) : <span className="write-box" />}
                          </td>
                          <td>
                            {inst.isPaid ? (
                              <span style={{ color: "#047857", fontWeight: 600 }}>{formatCurrency(inst.paidAmt)}</span>
                            ) : (
                              <span className="write-box" />
                            )}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {inst.isPaid || inst.paidAmt > 0 ? (
                              <span style={{ fontWeight: 600 }}>{formatCurrency(inst.remainingLoanBalance)}</span>
                            ) : (
                              <span className="write-box" />
                            )}
                          </td>
                          <td>
                            {inst.genSavAmt > 0 ? (
                              <span style={{ color: "#047857", fontWeight: 600 }}>{formatCurrency(inst.genSavAmt)}</span>
                            ) : (
                              <span className="write-box" />
                            )}
                          </td>
                          <td>
                            {inst.spcSavAmt > 0 ? (
                              <span style={{ color: "#047857", fontWeight: 600 }}>{formatCurrency(inst.spcSavAmt)}</span>
                            ) : (
                              <span className="write-box" />
                            )}
                          </td>
                          <td>
                            {inst.totalRecvAmt > 0 ? (
                              <span style={{ fontWeight: 700, color: "#047857" }}>{formatCurrency(inst.totalRecvAmt)}</span>
                            ) : (
                              <span className="write-box" />
                            )}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {inst.isPaid ? (
                              <span style={{ fontSize: 9, color: "#047857", fontWeight: 600 }}>Signed</span>
                            ) : (
                              <span className="write-box" />
                            )}
                          </td>
                        </tr>
                      );
                    }

                    // In Statement Mode: show all 10 recorded columns aligned with the 10 headers
                    return (
                      <tr key={inst.id || index}>
                        {/* 1. Inst # */}
                        <td style={{ textAlign: "center", fontWeight: 700 }}>#{inst.installmentNo}</td>
                        {/* 2. Due Date */}
                        <td style={{ textAlign: "center" }}>{inst.dueDate ? formatDate(inst.dueDate) : "—"}</td>
                        {/* 3. Collection Date */}
                        <td style={{ textAlign: "center" }}>
                          {inst.meetingDate || inst.paidAt
                            ? formatDate(inst.meetingDate || inst.paidAt)
                            : inst.paidAmt > 0
                              ? "Collected"
                              : "—"}
                        </td>
                        {/* 4. Scheduled Loan */}
                        <td style={{ textAlign: "right" }}>{inst.schedAmt > 0 ? formatCurrency(inst.schedAmt) : "—"}</td>
                        {/* 5. Loan Paid */}
                        <td
                          style={{
                            textAlign: "right",
                            color: inst.paidAmt > 0 ? "#047857" : "#64748b",
                            fontWeight: inst.paidAmt > 0 ? 600 : 400,
                          }}
                        >
                          {inst.paidAmt > 0 ? formatCurrency(inst.paidAmt) : "—"}
                        </td>
                        {/* 6. Loan Balance */}
                        <td style={{ textAlign: "right" }}>
                          {inst.paidAmt > 0 || inst.isPaid ? formatCurrency(inst.remainingLoanBalance) : "—"}
                        </td>
                        {/* 7. Gen Sav */}
                        <td style={{ textAlign: "right" }}>
                          {inst.genSavAmt > 0 ? (
                            <span style={{ color: "#047857", fontWeight: 600 }}>{formatCurrency(inst.genSavAmt)}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        {/* 8. Spc Sav */}
                        <td style={{ textAlign: "right" }}>
                          {inst.spcSavAmt > 0 ? (
                            <span style={{ color: "#047857", fontWeight: 600 }}>{formatCurrency(inst.spcSavAmt)}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        {/* 9. Total Recv */}
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: inst.totalRecvAmt > 0 ? 700 : 400,
                            color: inst.totalRecvAmt > 0 ? "#047857" : "inherit",
                          }}
                        >
                          {inst.totalRecvAmt > 0 ? formatCurrency(inst.totalRecvAmt) : "—"}
                        </td>
                        {/* 10. Officer Sign */}
                        <td style={{ textAlign: "center", fontSize: 9 }}>
                          {inst.isPaid ? (
                            <span style={{ color: "#047857", fontWeight: 600 }}>Signed</span>
                          ) : inst.isPartial ? (
                            <span style={{ color: "#d97706", fontWeight: 600 }}>Partial</span>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          {/* ============================================================== */}
          {/* SECTION B: DEDICATED SAVINGS DEPOSIT & WITHDRAWAL LEDGER       */}
          {/* ============================================================== */}
          {(activeSection === "all" || activeSection === "savings") && (
            <>
              {activeSection === "all" && <div className="page-break" />}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: activeSection === "savings" ? 10 : 16,
                  marginBottom: 4,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div>
                  <span style={{ fontWeight: 800, fontSize: 12, color: "#0f172a" }}>
                    B. Member Savings Account Ledger
                  </span>
                  <span style={{ fontSize: 10, color: "#64748b", marginLeft: 8 }}>
                    (General & Special Savings deposits/withdrawals with running balance)
                  </span>
                </div>

                {savings && (
                  <div style={{ display: "flex", gap: 12, fontSize: 11, flexWrap: "wrap" }}>
                    <span>
                      General: <strong>{formatCurrency(savings.generalSavingsBalance)}</strong>
                    </span>
                    <span>
                      Special: <strong>{formatCurrency(savings.specialSavingsBalance)}</strong>
                    </span>
                    <span>
                      Total Balance:{" "}
                      <strong style={{ color: "#047857" }}>
                        {formatCurrency(
                          Number(savings.generalSavingsBalance || 0) +
                            Number(savings.specialSavingsBalance || 0),
                        )}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              <table className="passbook-table">
                <thead>
                  <tr>
                    <th style={{ width: 30 }}>#</th>
                    <th style={{ width: 80 }}>Date</th>
                    <th style={{ width: 90 }}>Receipt / Trx #</th>
                    <th style={{ width: 90 }}>Type</th>
                    <th style={{ width: 95 }}>General Sav (Tk)</th>
                    <th style={{ width: 95 }}>Special Sav (Tk)</th>
                    <th style={{ width: 95 }}>Running Balance (Tk)</th>
                    <th style={{ width: 85 }}>Officer Sign</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Show reconciled savings ledger entries */}
                  {savingsLedgerEntries.map((entry, idx) => {
                    const isDeposit = entry.type === "DEPOSIT";
                    const isWithdrawal = entry.type === "WITHDRAWAL";

                    return (
                      <tr key={entry.id || idx}>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ textAlign: "center" }}>{formatDate(entry.date)}</td>
                        <td style={{ fontWeight: 600, color: "#0369a1" }}>{entry.receipt || "—"}</td>
                        <td>
                          <span
                            style={{
                              fontWeight: 600,
                              color: isDeposit ? "#047857" : "#b91c1c",
                            }}
                          >
                            {isDeposit ? "+ Deposit" : "- Withdrawal"}
                          </span>
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            color: isWithdrawal && entry.generalAmount > 0 ? "#b91c1c" : "inherit",
                            fontWeight: entry.generalAmount > 0 ? 600 : 400,
                          }}
                        >
                          {entry.generalAmount > 0
                            ? isWithdrawal
                              ? `-${formatCurrency(entry.generalAmount)}`
                              : formatCurrency(entry.generalAmount)
                            : "—"}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            color: isWithdrawal && entry.specialAmount > 0 ? "#b91c1c" : "inherit",
                            fontWeight: entry.specialAmount > 0 ? 600 : 400,
                          }}
                        >
                          {entry.specialAmount > 0
                            ? isWithdrawal
                              ? `-${formatCurrency(entry.specialAmount)}`
                              : formatCurrency(entry.specialAmount)
                            : "—"}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: "#047857" }}>
                          {formatCurrency(entry.balanceAfter)}
                        </td>
                        <td style={{ textAlign: "center", fontSize: 9, color: "#047857", fontWeight: 600 }}>
                          Signed
                        </td>
                      </tr>
                    );
                  })}

                  {/* Empty state when statement mode has no transactions */}
                  {savingsLedgerEntries.length === 0 && passbookMode === "statement" && (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          textAlign: "center",
                          padding: "16px 8px",
                          color: "#64748b",
                          fontStyle: "italic",
                        }}
                      >
                        No savings transactions recorded yet in the system.
                      </td>
                    </tr>
                  )}

                  {/* In Field Passbook Mode: append blank write-in rows for future weekly entries! */}
                  {passbookMode === "field" &&
                    blankSavingsRows.map((_, i) => (
                      <tr key={`blank-sav-${i}`}>
                        <td style={{ textAlign: "center" }}>{savingsLedgerEntries.length + i + 1}</td>
                        <td><span className="write-box" /></td>
                        <td><span className="write-box" /></td>
                        <td><span className="write-box" /></td>
                        <td><span className="write-box" /></td>
                        <td><span className="write-box" /></td>
                        <td><span className="write-box" /></td>
                        <td><span className="write-box" /></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </>
          )}

          {/* ============================================================== */}
          {/* SECTION C: MEMBER DPS ACCOUNT LEDGER (DEPOSIT PENSION SCHEME) */}
          {/* ============================================================== */}
          {(activeSection === "all" || activeSection === "dps") && (
            <>
              {activeSection === "all" && <div className="page-break" />}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: activeSection === "dps" ? 10 : 16,
                  marginBottom: 6,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div>
                  <span style={{ fontWeight: 800, fontSize: 12, color: "#0f172a" }}>
                    C. Member DPS Account Ledger (Deposit Pension Scheme)
                  </span>
                  <span style={{ fontSize: 10, color: "#64748b", marginLeft: 8 }}>
                    {activeDpsAccount
                      ? `Account: ${activeDpsAccount.dpsNumber || `DPS-${activeDpsAccount.id}`} · Monthly recurring deposit`
                      : "(No active DPS account found for this member)"}
                  </span>
                </div>

                {activeDpsAccount && (
                  <div style={{ display: "flex", gap: 12, fontSize: 11, flexWrap: "wrap" }}>
                    <span>
                      Monthly Deposit: <strong>{formatCurrency(activeDpsAccount.installmentAmount)}</strong>
                    </span>
                    <span>
                      Tenure: <strong>{activeDpsAccount.durationMonths} Mo ({Math.floor(activeDpsAccount.durationMonths / 12)} Yrs)</strong>
                    </span>
                    <span>
                      Profit Rate: <strong>{activeDpsAccount.interestRate}% p.a.</strong>
                    </span>
                    <span>
                      Total Deposited:{" "}
                      <strong style={{ color: "#047857" }}>
                        {formatCurrency(activeDpsAccount.totalPaidAmount)}
                      </strong>
                    </span>
                    <span>
                      Maturity Value:{" "}
                      <strong style={{ color: "#0284c7" }}>
                        {formatCurrency(activeDpsAccount.maturityAmount)}
                      </strong>
                    </span>
                    <span>
                      Maturity Date: <strong>{formatDate(activeDpsAccount.maturityDate)}</strong>
                    </span>
                  </div>
                )}
              </div>

              {!activeDpsAccount ? (
                <div
                  style={{
                    border: "1px dashed #cbd5e1",
                    borderRadius: 6,
                    padding: "24px 16px",
                    textAlign: "center",
                    color: "#64748b",
                    marginBottom: 16,
                  }}
                >
                  This member does not currently have an active DPS account.
                </div>
              ) : (
                <table className="passbook-table">
                  <thead>
                    <tr>
                      <th style={{ width: 45 }}>Inst #</th>
                      <th style={{ width: 90 }}>Due Date</th>
                      <th style={{ width: 95 }}>Collection Date</th>
                      <th style={{ width: 95 }}>Demand (Tk)</th>
                      <th style={{ width: 95 }}>Deposit Paid (Tk)</th>
                      <th style={{ width: 105 }}>Cumulative Paid (Tk)</th>
                      <th style={{ width: 100 }}>Receipt / Trx #</th>
                      <th style={{ width: 85 }}>Officer Sign</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dpsRows.map((inst, index) => {
                      if (passbookMode === "field") {
                        return (
                          <tr key={inst.id || index}>
                            <td style={{ textAlign: "center", fontWeight: 700 }}>
                              #{inst.installmentNo}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {inst.dueDate ? formatDate(inst.dueDate) : <span className="write-box" />}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {inst.isPaid || inst.paidAmt > 0 ? (
                                <span style={{ fontSize: 9.5 }}>
                                  {formatDate(inst.paidAt || inst.dueDate)}
                                </span>
                              ) : (
                                <span className="write-box" />
                              )}
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 600 }}>
                              {formatCurrency(inst.schedAmt)}
                            </td>
                            <td>
                              {inst.isPaid || inst.paidAmt > 0 ? (
                                <span style={{ color: "#047857", fontWeight: 600 }}>
                                  {formatCurrency(inst.paidAmt)}
                                </span>
                              ) : (
                                <span className="write-box" />
                              )}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {inst.isPaid || inst.paidAmt > 0 ? (
                                <span style={{ fontWeight: 700, color: "#047857" }}>
                                  {formatCurrency(inst.cumulativePaid)}
                                </span>
                              ) : (
                                <span className="write-box" />
                              )}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {inst.isPaid || inst.paidAmt > 0 ? (
                                <span style={{ fontSize: 9.5, color: "#0369a1", fontWeight: 600 }}>
                                  {inst.transactionId || (inst.id ? `DTX-${inst.id}` : "COL")}
                                </span>
                              ) : (
                                <span className="write-box" />
                              )}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {inst.isPaid || inst.paidAmt > 0 ? (
                                <span style={{ fontSize: 9, color: "#047857", fontWeight: 600 }}>
                                  Signed
                                </span>
                              ) : (
                                <span className="write-box" />
                              )}
                            </td>
                          </tr>
                        );
                      }

                      // Statement mode
                      return (
                        <tr key={inst.id || index}>
                          <td style={{ textAlign: "center", fontWeight: 700 }}>
                            #{inst.installmentNo}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {inst.dueDate ? formatDate(inst.dueDate) : "—"}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {inst.paidAt ? formatDate(inst.paidAt) : inst.paidAmt > 0 ? "Collected" : "—"}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {formatCurrency(inst.schedAmt)}
                          </td>
                          <td
                            style={{
                              textAlign: "right",
                              color: inst.paidAmt > 0 ? "#047857" : "#64748b",
                              fontWeight: inst.paidAmt > 0 ? 600 : 400,
                            }}
                          >
                            {inst.paidAmt > 0 ? formatCurrency(inst.paidAmt) : "—"}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700, color: "#047857" }}>
                            {inst.paidAmt > 0 ? formatCurrency(inst.cumulativePaid) : "—"}
                          </td>
                          <td style={{ textAlign: "center", fontSize: 9.5, color: "#0369a1", fontWeight: 600 }}>
                            {inst.paidAmt > 0 ? inst.transactionId || `DTX-${inst.id}` : "—"}
                          </td>
                          <td style={{ textAlign: "center", fontSize: 9 }}>
                            {inst.isPaid ? (
                              <span style={{ color: "#047857", fontWeight: 600 }}>Signed</span>
                            ) : inst.isPartial ? (
                              <span style={{ color: "#d97706", fontWeight: 600 }}>Partial</span>
                            ) : (
                              <span style={{ color: "#94a3b8" }}>Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* Passbook Signatures Footer */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 24,
              marginTop: 40,
              textAlign: "center",
              fontSize: 11,
              color: "#334155",
            }}
          >
            <div>
              <div style={{ height: 28 }} />
              <div style={{ borderTop: "1px dashed #64748b", paddingTop: 4 }}>
                <strong>Member Signature / Thumb</strong>
                <div style={{ fontSize: 9, color: "#64748b" }}>Authorized Member</div>
              </div>
            </div>

            <div>
              <div style={{ height: 28 }} />
              <div style={{ borderTop: "1px dashed #64748b", paddingTop: 4 }}>
                <strong>Field Officer Signature</strong>
                <div style={{ fontSize: 9, color: "#64748b" }}>
                  {officer?.fullName || "Field Officer"}
                </div>
              </div>
            </div>

            <div>
              <div style={{ height: 28 }} />
              <div style={{ borderTop: "1px dashed #64748b", paddingTop: 4 }}>
                <strong>Branch Manager Signature & Seal</strong>
                <div style={{ fontSize: 9, color: "#64748b" }}>Branch Management</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
