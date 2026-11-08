import {
  Button,
  DatePicker,
  Empty,
  Modal,
  Radio,
  Select,
  Space,
  Spin,
  Typography,
} from "antd";
import { CalendarOutlined, PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatDate } from "../../loans/loanFormatters.js";
import { useGetDueInstallmentsQuery } from "../collectionsApi.js";
import { useGetSomitiMembersQuery } from "../../somities/somitiesApi.js";
import { useGetDpsAccountsQuery } from "../../dps/dpsApi.js";

const toAmount = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

// Formats amounts as clean numeric text without any currency prefix (no BDT, no ৳)
const formatAmount = (val, decimals = 2) => {
  const n = Number(val);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
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
  somities = [],
  defaultSheetType = "savings",
}) {
  const printAreaRef = useRef(null);

  // Track selected Somiti within the modal (can be changed independently from parent)
  const [modalSomitiId, setModalSomitiId] = useState(
    selectedSomiti?.id ? String(selectedSomiti.id) : "ALL",
  );

  useEffect(() => {
    if (selectedSomiti?.id) {
      setModalSomitiId(String(selectedSomiti.id));
    }
  }, [selectedSomiti?.id]);

  const activeSomiti = useMemo(() => {
    if (!modalSomitiId || modalSomitiId === "ALL") return null;
    return (
      (somities || []).find((s) => String(s.id) === String(modalSomitiId)) ||
      (selectedSomiti?.id && String(selectedSomiti.id) === String(modalSomitiId)
        ? selectedSomiti
        : null)
    );
  }, [modalSomitiId, somities, selectedSomiti]);

  const currentSomitiId = activeSomiti?.id ? Number(activeSomiti.id) : undefined;

  // Track Daily Date & Monthly Month independently
  const [dailyDate, setDailyDate] = useState(
    dueDate ? dayjs(dueDate) : dayjs(),
  );

  useEffect(() => {
    if (dueDate) {
      setDailyDate(dayjs(dueDate));
    }
  }, [dueDate]);

  const [sheetType, setSheetType] = useState(
    defaultSheetType === "combined"
      ? "all"
      : defaultSheetType === "monthly"
        ? "monthly_all"
        : defaultSheetType,
  );
  const [selectedMonth, setSelectedMonth] = useState(
    dueDate ? dayjs(dueDate).startOf("month") : dayjs().startOf("month"),
  );

  // Filters for handling mixed frequencies (Weekly vs Monthly) and non-loan members
  const [loanFrequencyFilter, setLoanFrequencyFilter] = useState("ALL"); // "ALL" | "WEEKLY" | "MONTHLY"
  const [loanMemberFilter, setLoanMemberFilter] = useState("ACTIVE_ONLY"); // "ACTIVE_ONLY" | "ALL_MEMBERS"
  const [dpsFrequencyFilter, setDpsFrequencyFilter] = useState("ALL"); // "ALL" | "WEEKLY" | "MONTHLY"

  const isMonthlyMode =
    sheetType.startsWith("monthly") || sheetType === "monthly";

  const handlePrint = () => {
    window.print();
  };

  const dailyDateStr = dailyDate
    ? dailyDate.format("YYYY-MM-DD")
    : dayjs().format("YYYY-MM-DD");

  // 1. Fetch daily installments dynamically when in Daily mode
  const { data: dailyInstallmentsData, isLoading: dailyLoading } =
    useGetDueInstallmentsQuery(
      {
        dueDate: dailyDateStr,
        somitiId: currentSomitiId,
      },
      { skip: !open || isMonthlyMode },
    );

  // 2. Fetch month-wide due installments dynamically when in Monthly mode (works for specific somiti or ALL)
  const monthStartStr = selectedMonth
    ? selectedMonth.startOf("month").format("YYYY-MM-DD")
    : null;
  const monthEndStr = selectedMonth
    ? selectedMonth.endOf("month").format("YYYY-MM-DD")
    : null;

  const { data: monthInstallmentsData, isLoading: monthLoading } =
    useGetDueInstallmentsQuery(
      {
        startDate: monthStartStr,
        endDate: monthEndStr,
        somitiId: currentSomitiId,
      },
      { skip: !open || !isMonthlyMode },
    );
  const monthInstallments = monthInstallmentsData?.data || [];

  // 3. Fetch Somiti members if a specific somiti is selected
  const { data: modalSomitiMembersData } = useGetSomitiMembersQuery(
    Number(currentSomitiId),
    { skip: !open || !currentSomitiId },
  );

  // 4. Fetch DPS accounts for the selected Somiti or branch
  const { data: modalDpsData } = useGetDpsAccountsQuery(
    {
      status: "ACTIVE",
      limit: 500,
      somitiId: currentSomitiId,
    },
    { skip: !open },
  );

  // Active Daily Installments: prioritize fetched query, fallback to prop if dates match
  const activeDailyInstallments = useMemo(() => {
    if (dailyInstallmentsData?.data) {
      return dailyInstallmentsData.data;
    }
    if (dailyDateStr === (dueDate ? dayjs(dueDate).format("YYYY-MM-DD") : "")) {
      return installments;
    }
    return [];
  }, [dailyInstallmentsData, dailyDateStr, dueDate, installments]);

  const loanInstallments = useMemo(() => {
    return (activeDailyInstallments || []).filter(
      (item) =>
        !item.isDpsOnly &&
        Boolean(item.loanId) &&
        Boolean(item.loan?.id) &&
        item.loan?.loanId !== "DPS Only" &&
        item.loan?.status === "ACTIVE",
    );
  }, [activeDailyInstallments]);

  const totalDueLoan = useMemo(() => {
    return loanInstallments.reduce((acc, item) => {
      const due = Math.max(0, toAmount(item.amount) - toAmount(item.paidAmount));
      return acc + due;
    }, 0);
  }, [loanInstallments]);

  const totalLoanPrincipal = useMemo(() => {
    return loanInstallments.reduce((acc, item) => {
      return acc + toAmount(item.loan?.principalAmount ?? item.loan?.amount ?? 0);
    }, 0);
  }, [loanInstallments]);

  const officerName =
    activeSomiti?.fieldOfficer?.fullName ||
    (currentUser?.role === "FIELD_OFFICER"
      ? currentUser.fullName
      : "All Officers / Branch");

  const officerPhone =
    activeSomiti?.fieldOfficer?.mobileNumber ||
    (currentUser?.role === "FIELD_OFFICER" ? currentUser.mobileNumber : "");

  // Prepare full member list for Savings, DPS and Monthly sheets
  const membersList = useMemo(() => {
    let list = [];
    if (
      Array.isArray(modalSomitiMembersData?.data) &&
      modalSomitiMembersData.data.length > 0
    ) {
      list = [...modalSomitiMembersData.data];
    } else if (Array.isArray(somitiMembers) && somitiMembers.length > 0) {
      list = [...somitiMembers];
    } else {
      // Fallback: extract unique members from active installments
      const sourceInstallments = isMonthlyMode
        ? monthInstallments
        : activeDailyInstallments;
      const memberMap = new Map();
      for (const item of sourceInstallments) {
        const member = item.loan?.member || item.dpsAccount?.member;
        if (member && !memberMap.has(member.id)) {
          memberMap.set(member.id, member);
        }
      }
      list = Array.from(memberMap.values());
    }

    // Natural ascending sort by Member ID so all sheets match row-for-row
    return list.sort((a, b) =>
      (a.memberId || "").localeCompare(b.memberId || "", undefined, {
        numeric: true,
      }),
    );
  }, [
    modalSomitiMembersData,
    somitiMembers,
    isMonthlyMode,
    monthInstallments,
    activeDailyInstallments,
  ]);

  const totalGenSavingsBalance = membersList.reduce(
    (sum, m) => sum + toAmount(m.savingsAccount?.generalSavingsBalance),
    0,
  );
  const totalSpcSavingsBalance = membersList.reduce(
    (sum, m) => sum + toAmount(m.savingsAccount?.specialSavingsBalance),
    0,
  );

  // DPS accounts list: 100% dynamic from actual active DPS accounts in the database
  const allDpsAccounts = useMemo(() => {
    if (
      Array.isArray(modalDpsData?.data?.accounts) &&
      modalDpsData.data.accounts.length > 0
    ) {
      return modalDpsData.data.accounts;
    }
    if (Array.isArray(dpsAccounts) && dpsAccounts.length > 0) {
      return dpsAccounts;
    }
    return [];
  }, [modalDpsData, dpsAccounts]);

  const dpsList = useMemo(() => {
    let list = [];
    const targetDaily = dailyDate ? dayjs(dailyDate) : dayjs();
    const monthEnd = selectedMonth
      ? dayjs(selectedMonth).endOf("month")
      : dayjs().endOf("month");
    const cutoffDate = isMonthlyMode ? monthEnd : targetDaily;

    // 1. If explicit DPS accounts are fetched or provided
    if (Array.isArray(allDpsAccounts) && allDpsAccounts.length > 0) {
      list = allDpsAccounts
        .filter((acc) => {
          if (acc.status && acc.status !== "ACTIVE") return false;
          if (currentSomitiId) {
            const accSomitiId =
              acc.member?.somitiId ??
              acc.member?.somiti?.id ??
              acc.somitiId ??
              acc.somiti?.id;
            if (accSomitiId && Number(accSomitiId) !== Number(currentSomitiId)) {
              return false;
            }
          }
          // Strict Date Filter: Account must be opened on or before the viewed collection period!
          const rawStart = acc.startDate || acc.openDateRaw || acc.createdAt;
          if (rawStart) {
            const startD = dayjs(rawStart);
            if (startD.isValid() && startD.isAfter(cutoffDate, "day")) {
              return false;
            }
          }
          return true;
        })
        .map((acc, idx) => {
          const member = acc.member || {};
          const paid = Number(acc.paidInstallments) || 0;
          const isWk = acc.frequency === "WEEKLY";
          const totalInst = isWk
            ? acc.durationMonths
              ? Math.round((acc.durationMonths / 12) * 52)
              : acc.installments?.length || 52
            : acc.durationMonths || acc.installments?.length || 12;
          const tenure = isWk ? `${totalInst} W` : `${totalInst} M`;

          return {
            id: acc.id || idx + 1,
            rawAccount: acc,
            memberId: member.memberId || "",
            fullName: member.fullName || "",
            fatherName: member.fatherName,
            guardianName: member.guardianName,
            mobileNumber: member.mobileNumber || "",
            dpsNo:
              acc.dpsNumber ||
              `DPS-${String(acc.id || idx + 1).padStart(6, "0")}`,
            openDate: acc.startDate ? formatDate(acc.startDate) : "—",
            openDateRaw: acc.startDate,
            frequency: acc.frequency || "MONTHLY",
            tenure,
            paidInstallments: paid,
            totalInstallments: totalInst,
            nextInstallmentNo: paid + 1,
            instNo: `#${paid + 1}`,
            installmentAmount: toAmount(acc.installmentAmount),
            monthlyDemand: toAmount(acc.installmentAmount),
          };
        });
    } else {
      // 2. Otherwise extract active DPS accounts from membersList
      for (const member of membersList) {
        if (
          currentSomitiId &&
          member.somitiId &&
          Number(member.somitiId) !== Number(currentSomitiId)
        ) {
          continue;
        }

        const activeAccounts = Array.isArray(member.dpsAccounts)
          ? member.dpsAccounts.filter((d) => !d.status || d.status === "ACTIVE")
          : member.dpsAccount &&
              (!member.dpsAccount.status || member.dpsAccount.status === "ACTIVE")
            ? [member.dpsAccount]
            : [];

        for (const dps of activeAccounts) {
          // Strict Date Filter: Account must be opened on or before the viewed collection period!
          const rawStart = dps.startDate || dps.openDateRaw || dps.createdAt;
          if (rawStart) {
            const startD = dayjs(rawStart);
            if (startD.isValid() && startD.isAfter(cutoffDate, "day")) {
              continue;
            }
          }

          const paid = Number(dps.paidInstallments) || 0;
          const isWk = dps.frequency === "WEEKLY";
          const totalInst = isWk
            ? dps.durationMonths
              ? Math.round((dps.durationMonths / 12) * 52)
              : dps.installments?.length || 52
            : dps.durationMonths || dps.tenureMonths || dps.installments?.length || 12;
          const tenure = isWk ? `${totalInst} W` : `${totalInst} M`;

          list.push({
            id: dps.id,
            rawAccount: dps,
            memberId: member.memberId || "",
            fullName: member.fullName || "",
            fatherName: member.fatherName,
            guardianName: member.guardianName,
            mobileNumber: member.mobileNumber || "",
            dpsNo: dps.dpsNumber || `DPS-${String(dps.id).padStart(6, "0")}`,
            openDate: dps.startDate ? formatDate(dps.startDate) : "—",
            openDateRaw: dps.startDate,
            frequency: dps.frequency || "MONTHLY",
            tenure,
            paidInstallments: paid,
            totalInstallments: totalInst,
            nextInstallmentNo: paid + 1,
            instNo: `#${paid + 1}`,
            installmentAmount: toAmount(
              dps.installmentAmount ?? dps.monthlyInstallment ?? 0,
            ),
            monthlyDemand: toAmount(
              dps.installmentAmount ?? dps.monthlyInstallment ?? 0,
            ),
          });
        }
      }
    }

    // Sort naturally by Member ID so DPS sheet rows match row-for-row with Savings & Loans
    return list.sort((a, b) =>
      (a.memberId || "").localeCompare(b.memberId || "", undefined, {
        numeric: true,
      }),
    );
  }, [allDpsAccounts, membersList, currentSomitiId, selectedMonth, dailyDate, isMonthlyMode]);

  // Compute weekly collection meeting dates for the chosen month
  const meetingDates = useMemo(() => {
    if (!selectedMonth) return [];
    const SOMITI_DAY_MAP = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
    };
    const somitiDayName = activeSomiti?.meetingDay?.toUpperCase();
    const targetDayOfWeek =
      somitiDayName && SOMITI_DAY_MAP[somitiDayName] !== undefined
        ? SOMITI_DAY_MAP[somitiDayName]
        : dailyDate
          ? dailyDate.day()
          : 3; // default Wednesday

    const dates = [];
    const start = dayjs(selectedMonth).startOf("month");
    const end = dayjs(selectedMonth).endOf("month");

    let curr = start;
    while (curr.isBefore(end) || curr.isSame(end, "day")) {
      if (curr.day() === targetDayOfWeek) {
        dates.push(curr);
      }
      curr = curr.add(1, "day");
    }

    if (dates.length === 0) {
      dates.push(
        start.add(7, "day"),
        start.add(14, "day"),
        start.add(21, "day"),
        start.add(28, "day"),
      );
    }
    return dates;
  }, [selectedMonth, activeSomiti, dailyDate]);

  // Helper: map any date to the closest weekly meeting date index (0..meetingDates.length-1)
  const getWeekIndexForDate = (dueDateVal, dates) => {
    if (!dueDateVal || !dates || dates.length === 0) return 0;
    const d = dayjs(dueDateVal);
    const targetDateKey = d.format("YYYY-MM-DD");

    // 1. Exact match with a meeting date
    const exactIdx = dates.findIndex(
      (mDate) => mDate.format("YYYY-MM-DD") === targetDateKey,
    );
    if (exactIdx !== -1) return exactIdx;

    // 2. Nearest meeting date
    let bestIdx = 0;
    let minDiff = Infinity;
    dates.forEach((mDate, idx) => {
      const diff = Math.abs(d.diff(mDate, "day"));
      if (diff < minDiff) {
        minDiff = diff;
        bestIdx = idx;
      }
    });
    return bestIdx;
  };

  // Map member active loans & installments across the month with exact weekly mapping
  const memberLoansMap = useMemo(() => {
    const map = new Map();

    const processItem = (item) => {
      // STRICT FILTER: If it is DPS-only, or has no real active loan, SKIP!
      if (
        item.isDpsOnly ||
        !item.loanId ||
        !item.loan?.id ||
        item.loan?.loanId === "DPS Only" ||
        item.loan?.status !== "ACTIVE"
      ) {
        return;
      }
      const memId = item.loan?.member?.id;
      if (!memId) return;
      if (!map.has(memId)) {
        map.set(memId, {
          loan: item.loan,
          weeklyInstallments: new Map(), // weekIndex -> installment
          allInstallments: [],
          totalActualMonthDemand: 0,
          totalActualMonthPaid: 0,
        });
      }
      const memData = map.get(memId);
      // Ensure we don't duplicate installments
      if (!memData.allInstallments.some((x) => x.id === item.id)) {
        memData.allInstallments.push(item);
        const wkIdx = getWeekIndexForDate(item.dueDate, meetingDates);
        const instAmount = toAmount(item.amount);
        const paidAmount = toAmount(item.paidAmount);
        const due = Math.max(0, instAmount - paidAmount);
        const isPaid = item.status === "PAID" || (paidAmount >= instAmount && instAmount > 0);

        const prev = memData.weeklyInstallments.get(wkIdx);
        if (prev) {
          prev.amount = (prev.amount || 0) + instAmount;
          prev.paidAmount = (prev.paidAmount || 0) + paidAmount;
          prev.due += due;
          prev.isPaid = prev.isPaid && isPaid;
          prev.items.push(item);
        } else {
          memData.weeklyInstallments.set(wkIdx, {
            amount: instAmount,
            paidAmount,
            due,
            isPaid,
            items: [item],
          });
        }
        memData.totalActualMonthDemand += instAmount;
        memData.totalActualMonthPaid = (memData.totalActualMonthPaid || 0) + paidAmount;
      }
    };

    // Process monthInstallments ONLY (all installments due in this month across 30/31 days)
    for (const item of monthInstallments) {
      processItem(item);
    }

    return map;
  }, [monthInstallments, meetingDates]);

  // Active loan accounts list for the Monthly Loan Sheet with frequency & membership filters
  const monthLoanAccountsList = useMemo(() => {
    const list = [];
    const seenLoanIds = new Set();

    // 1. Iterate through Somiti members
    for (const member of membersList) {
      const memLoanData = memberLoansMap.get(member.id);
      if (
        memLoanData?.loan &&
        memLoanData.loan.id &&
        memLoanData.loan.loanId !== "DPS Only" &&
        memLoanData.loan.status === "ACTIVE"
      ) {
        const loanId = memLoanData.loan.loanId || memLoanData.loan.id;
        if (loanId && !seenLoanIds.has(loanId)) {
          seenLoanIds.add(loanId);
          list.push({
            id: memLoanData.loan.id,
            memberId: member.memberId || "",
            fullName: member.fullName || "",
            guardianName: member.guardianName || member.fatherName || "",
            mobileNumber: member.mobileNumber || "",
            loanId: memLoanData.loan.loanId || "",
            disbursementDate: memLoanData.loan.disbursementDate,
            principalAmount: memLoanData.loan.principalAmount,
            installmentAmount: memLoanData.loan.installmentAmount,
            frequency: (memLoanData.loan.frequency || "WEEKLY").toUpperCase(),
            weeklyInstallments: memLoanData.weeklyInstallments,
            totalActualMonthDemand: memLoanData.totalActualMonthDemand,
            totalActualMonthPaid: memLoanData.totalActualMonthPaid || 0,
            hasActiveLoan: true,
            loan: memLoanData.loan,
          });
        }
      } else if (loanMemberFilter === "ALL_MEMBERS") {
        // Member has no active loan in this month
        list.push({
          id: `no-loan-${member.id}`,
          memberId: member.memberId || "",
          fullName: member.fullName || "",
          guardianName: member.guardianName || member.fatherName || "",
          mobileNumber: member.mobileNumber || "",
          loanId: "—",
          disbursementDate: null,
          principalAmount: 0,
          installmentAmount: 0,
          frequency: "—",
          weeklyInstallments: new Map(),
          totalActualMonthDemand: 0,
          hasActiveLoan: false,
          loan: null,
        });
      }
    }

    // 2. Append any loan accounts from memberLoansMap that might not be in membersList
    for (const [memberId, memLoanData] of memberLoansMap.entries()) {
      if (
        !memLoanData?.loan ||
        !memLoanData.loan.id ||
        memLoanData.loan.loanId === "DPS Only" ||
        memLoanData.loan.status !== "ACTIVE"
      ) {
        continue;
      }
      const loanId = memLoanData.loan?.loanId || memLoanData.loan?.id;
      if (loanId && !seenLoanIds.has(loanId)) {
        seenLoanIds.add(loanId);
        const mem = memLoanData.loan?.member;
        list.push({
          id: memLoanData.loan.id,
          memberId: mem?.memberId || "",
          fullName: mem?.fullName || "",
          guardianName: mem?.guardianName || mem?.fatherName || "",
          mobileNumber: mem?.mobileNumber || "",
          loanId: memLoanData.loan.loanId || "",
          disbursementDate: memLoanData.loan.disbursementDate,
          principalAmount: memLoanData.loan.principalAmount,
          installmentAmount: memLoanData.loan.installmentAmount,
          frequency: (memLoanData.loan.frequency || "WEEKLY").toUpperCase(),
          weeklyInstallments: memLoanData.weeklyInstallments,
          totalActualMonthDemand: memLoanData.totalActualMonthDemand,
          totalActualMonthPaid: memLoanData.totalActualMonthPaid || 0,
          hasActiveLoan: true,
          loan: memLoanData.loan,
        });
      }
    }

    // 3. Filter by Loan Frequency (ALL, WEEKLY, MONTHLY)
    let finalList = list;
    if (loanFrequencyFilter !== "ALL") {
      finalList = list.filter(
        (item) => !item.hasActiveLoan || item.frequency === loanFrequencyFilter,
      );
    }

    // Sort naturally by Member ID so Loan Sheet rows match row-for-row with Savings & DPS
    return finalList.sort((a, b) =>
      (a.memberId || "").localeCompare(b.memberId || "", undefined, {
        numeric: true,
      }),
    );
  }, [membersList, memberLoansMap, loanMemberFilter, loanFrequencyFilter]);

  const totalMonthLoanPrincipal = useMemo(() => {
    return monthLoanAccountsList.reduce((acc, item) => {
      return acc + (item.hasActiveLoan ? toAmount(item.principalAmount) : 0);
    }, 0);
  }, [monthLoanAccountsList]);

  // DPS Accounts list with frequency filter
  const filteredDpsList = useMemo(() => {
    if (dpsFrequencyFilter === "ALL") return dpsList;
    return dpsList.filter(
      (item) => (item.frequency || "MONTHLY").toUpperCase() === dpsFrequencyFilter,
    );
  }, [dpsList, dpsFrequencyFilter]);

  // DPS Accounts with exact weekly installment schedule for the selected month
  const dpsAccountsWithSchedule = useMemo(() => {
    const monthEnd = selectedMonth
      ? dayjs(selectedMonth).endOf("month")
      : dayjs().endOf("month");

    return filteredDpsList
      .filter((item) => {
        // Strict filter: accounts opened after the month must never appear in this month's sheet
        const rawStart =
          item.rawAccount?.startDate ||
          item.openDateRaw ||
          item.rawAccount?.createdAt;
        if (rawStart) {
          const startD = dayjs(rawStart);
          if (startD.isValid() && startD.isAfter(monthEnd, "day")) {
            return false;
          }
        }
        return true;
      })
      .map((item) => {
      const isWk = item.frequency === "WEEKLY";
      const weeklySchedule = new Map(); // weekIndex -> { demand, paid, due, isPaid, isDue, inst, installmentNo, instNumbers }
      let monthDpsDemand = 0;
      let monthDpsPaid = 0;

      const rawAcc = item.rawAccount;
      const accInstallments = Array.isArray(rawAcc?.installments)
        ? rawAcc.installments
        : [];
      const hasDbInstallments = accInstallments.length > 0;

      // 1. If we have actual installments from backend database, strictly use them
      if (hasDbInstallments && selectedMonth && meetingDates.length > 0) {
        const monthStart = dayjs(selectedMonth).startOf("month");
        const monthEnd = dayjs(selectedMonth).endOf("month");

        const thisMonthInsts = accInstallments.filter((inst) => {
          if (!inst.dueDate) return false;
          const d = dayjs(inst.dueDate);
          return (
            (d.isAfter(monthStart) || d.isSame(monthStart, "day")) &&
            (d.isBefore(monthEnd) || d.isSame(monthEnd, "day"))
          );
        });

        for (const inst of thisMonthInsts) {
          const wkIdx = getWeekIndexForDate(inst.dueDate, meetingDates);
          const instAmount = toAmount(inst.amount);
          const paidAmount = toAmount(inst.paidAmount);
          const due = Math.max(0, instAmount - paidAmount);
          const isPaid = inst.status === "PAID" || (paidAmount >= instAmount && instAmount > 0);

          const existing = weeklySchedule.get(wkIdx);
          if (existing) {
            existing.demand += instAmount;
            existing.paid = (existing.paid || 0) + paidAmount;
            existing.due += due;
            existing.isPaid = existing.isPaid && isPaid;
            existing.installments.push(inst);
            if (inst.installmentNo && !existing.instNumbers.includes(inst.installmentNo)) {
              existing.instNumbers.push(inst.installmentNo);
            }
          } else {
            weeklySchedule.set(wkIdx, {
              demand: instAmount,
              paid: paidAmount,
              due,
              isPaid,
              installments: [inst],
              inst,
              installmentNo: inst.installmentNo,
              instNumbers: inst.installmentNo ? [inst.installmentNo] : [],
              isDue: true,
            });
          }
          monthDpsDemand += instAmount;
          monthDpsPaid += paidAmount;
        }
      }

      // 2. Fallback: ONLY if no installments array was returned from the database
      if (!hasDbInstallments && meetingDates.length > 0) {
        const regAmount = item.installmentAmount;
        const openDayjs = item.openDateRaw ? dayjs(item.openDateRaw) : null;

        if (isWk) {
          // Weekly DPS: only due on weekly meeting dates ON OR AFTER account start date
          meetingDates.forEach((mDate, idx) => {
            const isAfterStart = !openDayjs || !mDate.isBefore(openDayjs, "day");
            if (isAfterStart) {
              const calculatedInstNo = (item.paidInstallments || 0) + 1 + idx;
              weeklySchedule.set(idx, {
                demand: regAmount,
                paid: 0,
                due: regAmount,
                isPaid: false,
                installments: [],
                inst: null,
                installmentNo: calculatedInstNo,
                instNumbers: [calculatedInstNo],
                isDue: true,
              });
              monthDpsDemand += regAmount;
            }
          });
        } else {
          // Monthly DPS: due once per month on meeting date closest to open date
          const openDay = openDayjs ? openDayjs.date() : 1;
          const targetDate = dayjs(selectedMonth).date(
            Math.min(openDay, dayjs(selectedMonth).daysInMonth()),
          );
          const isAfterStart = !openDayjs || !targetDate.isBefore(openDayjs, "day");
          if (isAfterStart) {
            const wkIdx = getWeekIndexForDate(targetDate, meetingDates);
            const calculatedInstNo = (item.paidInstallments || 0) + 1;
            weeklySchedule.set(wkIdx, {
              demand: regAmount,
              paid: 0,
              due: regAmount,
              isPaid: false,
              installments: [],
              inst: null,
              installmentNo: calculatedInstNo,
              instNumbers: [calculatedInstNo],
              isDue: true,
            });
            monthDpsDemand = regAmount;
          }
        }
      }

      return {
        ...item,
        weeklySchedule,
        monthDpsDemand,
        monthDpsPaid,
      };
    });
  }, [filteredDpsList, meetingDates, selectedMonth]);

  const totalDpsDemand = useMemo(() => {
    return isMonthlyMode
      ? dpsAccountsWithSchedule.reduce((sum, item) => sum + item.monthDpsDemand, 0)
      : filteredDpsList.reduce((sum, item) => sum + item.monthlyDemand, 0);
  }, [isMonthlyMode, dpsAccountsWithSchedule, filteredDpsList]);

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
  const renderMetaBar = (isMonthly = false) => {
    const targetDateDayjs = dailyDate ? dayjs(dailyDate) : dayjs();
    const monthDayjs = selectedMonth ? dayjs(selectedMonth) : dayjs();
    const monthStart = monthDayjs.startOf("month").format("01 MMM");
    const monthEnd = monthDayjs.endOf("month").format("DD MMM YYYY");

    return (
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
          {isMonthly ? (
            <>
              <strong>Collection Month: </strong>
              <span style={{ fontWeight: 600 }}>
                {monthDayjs.format("MMMM YYYY")}
              </span>
            </>
          ) : (
            <>
              <strong>Collection Date: </strong>
              <span>{targetDateDayjs.format("DD MMMM, YYYY")}</span>
              <span style={{ marginLeft: 4, color: "#555" }}>
                ({targetDateDayjs.format("dddd")})
              </span>
            </>
          )}
        </div>
        <div>
          <strong>Meeting Day: </strong>
          <span>
            {activeSomiti?.meetingDay
              ? activeSomiti.meetingDay.toUpperCase()
              : "—"}
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <strong>Field Officer: </strong>
          <span>{officerName}</span>
          {officerPhone && <span style={{ marginLeft: 3 }}>({officerPhone})</span>}
        </div>
      </div>
    );
  };

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
            <th style={{ width: "8%" }}>Member ID</th>
            <th style={{ width: "7.5%" }}>Adm. Date</th>
            <th style={{ width: "17%", textAlign: "left" }}>
              Member Name
            </th>
            <th style={{ width: "9.5%" }}>Mobile</th>
            <th style={{ width: "9%", textAlign: "right" }}>
              Gen. Sev Bal
            </th>
            <th style={{ width: "12.5%", background: "#f0fdf4" }}>
              Gen. Sev Collection
            </th>
            <th style={{ width: "9%", textAlign: "right" }}>
              Spc. Sev Bal
            </th>
            <th style={{ width: "12.5%", background: "#fefce8" }}>
              Spc. Sev Collection
            </th>
            <th style={{ width: "11.5%", fontWeight: "bold" }}>
              Total Collection
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
                <td
                  style={{
                    textAlign: "center",
                    fontSize: 9.5,
                    color: "#475569",
                  }}
                >
                  {member.joinDate ? formatDate(member.joinDate) : "—"}
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{member.fullName}</div>
                  {(member.guardianName || member.fatherName) && (
                    <div style={{ fontSize: 9, color: "#64748b" }}>
                      G: {member.guardianName || member.fatherName}
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
                  {formatAmount(genBal)}
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
                  {formatAmount(spcBal)}
                </td>
                <td
                  className="print-blank-box"
                  style={{ background: "#fffdf9" }}
                ></td>
                <td
                  className="print-blank-box"
                  style={{ background: "#fcfcff" }}
                ></td>
              </tr>
            );
          })}

          {/* Summary Row */}
          <tr style={{ background: "#f8f9fa", fontWeight: "bold" }}>
            <td colSpan={5} style={{ textAlign: "right", paddingRight: 8 }}>
              Total ({membersList.length} Members):
            </td>
            <td style={{ textAlign: "right", color: "#047857" }}>
              {formatAmount(totalGenSavingsBalance)}
            </td>
            <td className="print-blank-box"></td>
            <td style={{ textAlign: "right", color: "#0284c7" }}>
              {formatAmount(totalSpcSavingsBalance)}
            </td>
            <td className="print-blank-box"></td>
            <td className="print-blank-box"></td>
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
            <th style={{ width: "3.5%" }}>SL</th>
            <th style={{ width: "8.5%" }}>Member ID</th>
            <th style={{ width: "19%", textAlign: "left" }}>
              Member Name
            </th>
            <th style={{ width: "10%" }}>Mobile</th>
            <th style={{ width: "8.5%" }}>Open Date</th>
            <th style={{ width: "5%" }}>Tenure</th>
            <th style={{ width: "6%" }}>Paid / Tot</th>
            <th style={{ width: "5%" }}>Inst. No</th>
            <th style={{ width: "9.5%", textAlign: "right" }}>
              Target Inst
            </th>
            <th style={{ width: "12.5%", background: "#eff6ff" }}>
              DPS Collection
            </th>
            <th style={{ width: "12.5%", fontWeight: "bold" }}>
              Total Collection
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
                    G: {item.guardianName || item.fatherName}
                  </div>
                )}
              </td>
              <td style={{ textAlign: "center", fontSize: 10 }}>
                {item.mobileNumber || ""}
              </td>
              <td
                style={{
                  textAlign: "center",
                  fontSize: 9.5,
                  color: "#475569",
                }}
              >
                {item.openDate || "—"}
              </td>
              <td style={{ textAlign: "center", fontSize: 10 }}>
                {item.tenure}
                <span
                  style={{
                    fontSize: 7.5,
                    marginLeft: 2,
                    color: item.frequency === "WEEKLY" ? "#0369a1" : "#b45309",
                    fontWeight: 600,
                  }}
                >
                  ({item.frequency === "WEEKLY" ? "Wk" : "Mo"})
                </span>
              </td>
              <td style={{ textAlign: "center", fontSize: 9.5 }}>
                <span
                  style={{
                    fontWeight: 600,
                    color: item.paidInstallments > 0 ? "#047857" : "#475569",
                  }}
                >
                  {item.paidInstallments}/{item.totalInstallments}
                </span>
              </td>
              <td style={{ textAlign: "center", fontWeight: 600, fontSize: 9.5 }}>
                {item.nextInstallmentNo}
              </td>
              <td style={{ textAlign: "right", fontWeight: 700 }}>
                {formatAmount(item.monthlyDemand)}
              </td>
              <td
                className="print-blank-box"
                style={{ background: "#eff6ff" }}
              ></td>
              <td
                className="print-blank-box"
                style={{ background: "#f8fafc" }}
              ></td>
            </tr>
          ))}

          {/* Summary Row */}
          <tr style={{ background: "#f8f9fa", fontWeight: "bold" }}>
            <td colSpan={8} style={{ textAlign: "right", paddingRight: 8 }}>
              Total DPS Demand ({dpsList.length} Accounts):
            </td>
            <td style={{ textAlign: "right", fontSize: 11 }}>
              {formatAmount(totalDpsDemand)}
            </td>
            <td className="print-blank-box"></td>
            <td className="print-blank-box"></td>
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
            <th style={{ width: "9%" }}>Member ID</th>
            <th style={{ width: "19%", textAlign: "left" }}>
              Member Name
            </th>
            <th style={{ width: "11%" }}>Mobile</th>
            <th style={{ width: "9.5%" }}>Disb. Date</th>
            <th style={{ width: "11%", textAlign: "right" }}>
              Principal
            </th>
            <th style={{ width: "6%" }}>Inst. No</th>
            <th style={{ width: "11%", textAlign: "right" }}>
              Loan Due
            </th>
            <th style={{ width: "20%", background: "#eef2ff" }}>
              Loan Collection
            </th>
          </tr>
        </thead>
        <tbody>
          {loanInstallments.map((item, index) => {
            const member = item.loan?.member;
            const instAmount = toAmount(item.amount);
            const paidAmount = toAmount(item.paidAmount);
            const dueLoan = Math.max(0, instAmount - paidAmount);
            const isPaid = item.status === "PAID" || (paidAmount >= instAmount && instAmount > 0);

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
                      G: {member?.guardianName || member?.fatherName}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: "center", fontSize: 10 }}>
                  {member?.mobileNumber || ""}
                </td>
                <td
                  style={{
                    textAlign: "center",
                    fontSize: 9.5,
                    color: "#475569",
                  }}
                >
                  {item.loan?.disbursementDate
                    ? formatDate(item.loan.disbursementDate)
                    : "—"}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  {formatAmount(item.loan?.principalAmount ?? item.loan?.amount ?? 0)}
                </td>
                <td style={{ textAlign: "center", fontWeight: 600 }}>
                  {item.installmentNo}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    fontWeight: 700,
                    color: isPaid ? "#047857" : "#1e293b",
                  }}
                >
                  {formatAmount(isPaid ? instAmount : dueLoan)}
                </td>
                <td
                  className={isPaid ? "" : "print-blank-box"}
                  style={{
                    background: isPaid ? "#f0fdf4" : "#fcfcff",
                    textAlign: isPaid ? "right" : "center",
                    padding: isPaid ? "4px 8px" : 0,
                    fontWeight: 700,
                    color: "#047857",
                  }}
                >
                  {isPaid || paidAmount > 0 ? formatAmount(paidAmount) : null}
                </td>
              </tr>
            );
          })}

          {/* Summary Row */}
          <tr style={{ background: "#f8f9fa", fontWeight: "bold" }}>
            <td colSpan={5} style={{ textAlign: "right", paddingRight: 8 }}>
              Total Loan Demand ({loanInstallments.length} Members):
            </td>
            <td style={{ textAlign: "right", fontSize: 11 }}>
              {formatAmount(totalLoanPrincipal)}
            </td>
            <td></td>
            <td style={{ textAlign: "right", fontSize: 11.5 }}>
              {formatAmount(totalDueLoan)}
            </td>
            <td className="print-blank-box"></td>
          </tr>
        </tbody>
      </table>
    );
  };

  // Helper: Monthly Savings Table (Sheet 1 — Full 1 Month for ALL Members)
  const renderMonthlySavingsTable = () => {
    if (membersList.length === 0) {
      return (
        <Empty
          description="No members found for this Somiti"
          style={{ padding: "30px 0" }}
        />
      );
    }

    return (
      <table className="print-table" style={{ fontSize: 9 }}>
        <thead>
          <tr>
            <th rowSpan={2} style={{ width: "2%" }}>SL</th>
            <th rowSpan={2} style={{ width: "4.5%" }}>Member ID</th>
            <th rowSpan={2} style={{ width: "4.5%" }}>Adm. Date</th>
            <th rowSpan={2} style={{ width: "10%", textAlign: "left" }}>Member Name</th>
            <th rowSpan={2} style={{ width: "6%" }}>Mobile</th>
            <th rowSpan={2} style={{ width: "4.5%", textAlign: "right" }}>Gen. Sev Bal</th>
            <th rowSpan={2} style={{ width: "4.5%", textAlign: "right" }}>Spc. Sev Bal</th>

            {/* Weekly Meeting Dates */}
            {meetingDates.map((date, idx) => (
              <th
                key={idx}
                colSpan={2}
                style={{
                  background: idx % 2 === 0 ? "#f8fafc" : "#f1f5f9",
                  borderBottom: "1px solid #cbd5e1",
                }}
              >
                Wk {idx + 1} ({date.format("DD MMM")})
              </th>
            ))}

            <th rowSpan={2} style={{ width: "4.5%", background: "#f0fdf4" }}>Month Gen. Sev</th>
            <th rowSpan={2} style={{ width: "4.5%", background: "#fefce8" }}>Month Spc. Sev</th>
            <th rowSpan={2} style={{ width: "5%", fontWeight: "bold" }}>Total Savings Collection</th>
          </tr>
          <tr>
            {meetingDates.map((_, idx) => (
              <>
                <th
                  key={`dem-gen-${idx}`}
                  style={{
                    fontSize: 8,
                    width: `${50 / (meetingDates.length * 2)}%`,
                    minWidth: 32,
                    background: idx % 2 === 0 ? "#f0fdf4" : "#e6f9ed",
                  }}
                >
                  Gen. Sev
                </th>
                <th
                  key={`dem-spc-${idx}`}
                  style={{
                    fontSize: 8,
                    width: `${50 / (meetingDates.length * 2)}%`,
                    minWidth: 32,
                    background: idx % 2 === 0 ? "#fefce8" : "#fef9c3",
                  }}
                >
                  Spc. Sev
                </th>
              </>
            ))}
          </tr>
        </thead>
        <tbody>
          {membersList.map((member, index) => {
            const genBal = toAmount(member.savingsAccount?.generalSavingsBalance);
            const spcBal = toAmount(member.savingsAccount?.specialSavingsBalance);

            return (
              <tr key={member.id || index}>
                <td style={{ textAlign: "center", fontWeight: "bold" }}>{index + 1}</td>
                <td style={{ textAlign: "center", fontWeight: 600 }}>{member.memberId || ""}</td>
                <td style={{ textAlign: "center", fontSize: 8.5, color: "#475569" }}>
                  {member.joinDate ? formatDate(member.joinDate) : "—"}
                </td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 9.5 }}>{member.fullName}</div>
                  {(member.guardianName || member.fatherName) && (
                    <div style={{ fontSize: 8, color: "#64748b" }}>
                      G: {member.guardianName || member.fatherName}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: "center", fontSize: 8.5 }}>{member.mobileNumber || ""}</td>
                <td style={{ textAlign: "right", color: "#047857", fontWeight: 600, fontSize: 9 }}>
                  {formatAmount(genBal)}
                </td>
                <td style={{ textAlign: "right", color: "#0284c7", fontWeight: 600, fontSize: 9 }}>
                  {formatAmount(spcBal)}
                </td>

                {/* Blank writable boxes for weekly General & Special savings collection */}
                {meetingDates.map((_, idx) => (
                  <>
                    <td
                      key={`wk-gen-${idx}`}
                      className="print-blank-box"
                      style={{ background: "#fcfffc" }}
                    ></td>
                    <td
                      key={`wk-spc-${idx}`}
                      className="print-blank-box"
                      style={{ background: "#fffdf9" }}
                    ></td>
                  </>
                ))}

                <td className="print-blank-box" style={{ background: "#f0fdf4" }}></td>
                <td className="print-blank-box" style={{ background: "#fefce8" }}></td>
                <td className="print-blank-box" style={{ background: "#fcfcff" }}></td>
              </tr>
            );
          })}

          {/* Grand Summary Row */}
          <tr style={{ background: "#f8f9fa", fontWeight: "bold" }}>
            <td colSpan={5} style={{ textAlign: "right", paddingRight: 6 }}>
              Total ({membersList.length} Members):
            </td>
            <td style={{ textAlign: "right", color: "#047857", fontSize: 9.5 }}>
              {formatAmount(totalGenSavingsBalance)}
            </td>
            <td style={{ textAlign: "right", color: "#0284c7", fontSize: 9.5 }}>
              {formatAmount(totalSpcSavingsBalance)}
            </td>
            {meetingDates.map((_, idx) => (
              <>
                <td key={`tot-gen-${idx}`} className="print-blank-box"></td>
                <td key={`tot-spc-${idx}`} className="print-blank-box"></td>
              </>
            ))}
            <td className="print-blank-box"></td>
            <td className="print-blank-box"></td>
            <td className="print-blank-box"></td>
          </tr>
        </tbody>
      </table>
    );
  };

  // Helper: Monthly DPS Table (Sheet 2 — Full 1 Month for DPS Accounts)
  const renderMonthlyDpsTable = () => {
    if (dpsAccountsWithSchedule.length === 0) {
      return (
        <Empty
          description="No DPS accounts match the selected filter"
          style={{ padding: "30px 0" }}
        />
      );
    }

    let grandMonthDemand = 0;
    let grandMonthPaid = 0;
    const weeklyTotals = meetingDates.map(() => ({ demand: 0, paid: 0 }));

    return (
      <table className="print-table" style={{ fontSize: 9 }}>
        <thead>
          <tr>
            <th rowSpan={2} style={{ width: "2.5%" }}>SL</th>
            <th rowSpan={2} style={{ width: "5.5%" }}>Member ID</th>
            <th rowSpan={2} style={{ width: "14%", textAlign: "left" }}>Member Name</th>
            <th rowSpan={2} style={{ width: "8%" }}>Mobile</th>
            <th rowSpan={2} style={{ width: "7%" }}>Open Date</th>
            <th rowSpan={2} style={{ width: "5%" }}>Tenure</th>
            <th rowSpan={2} style={{ width: "5.5%" }}>Paid / Tot</th>
            <th rowSpan={2} style={{ width: "5.5%", textAlign: "right" }}>Inst.</th>

            {/* Weekly Columns with Demand and Collection */}
            {meetingDates.map((date, idx) => (
              <th
                key={idx}
                colSpan={2}
                style={{
                  background: idx % 2 === 0 ? "#eff6ff" : "#dbeafe",
                  borderBottom: "1px solid #cbd5e1",
                }}
              >
                Wk {idx + 1} ({date.format("DD MMM")})
              </th>
            ))}

            <th rowSpan={2} style={{ width: "7%", fontWeight: "bold" }}>Month Demand</th>
            <th rowSpan={2} style={{ width: "8%", background: "#eff6ff", fontWeight: "bold" }}>Month Collection</th>
          </tr>
          <tr>
            {meetingDates.map((_, idx) => (
              <>
                <th
                  key={`dem-${idx}`}
                  style={{
                    fontSize: 8,
                    width: `${32 / (meetingDates.length * 2)}%`,
                    background: idx % 2 === 0 ? "#eff6ff" : "#dbeafe",
                  }}
                >
                  Demand
                </th>
                <th
                  key={`col-${idx}`}
                  style={{
                    fontSize: 8,
                    width: `${32 / (meetingDates.length * 2)}%`,
                    background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                  }}
                >
                  Collection
                </th>
              </>
            ))}
          </tr>
        </thead>
        <tbody>
          {dpsAccountsWithSchedule.map((item, index) => {
            const memberMonthDemand = item.monthDpsDemand || 0;
            const memberMonthPaid = item.monthDpsPaid || 0;
            grandMonthDemand += memberMonthDemand;
            grandMonthPaid += memberMonthPaid;
            const isWk = item.frequency === "WEEKLY";

            return (
              <tr key={item.id || index}>
                <td style={{ textAlign: "center", fontWeight: "bold" }}>{index + 1}</td>
                <td style={{ textAlign: "center", fontWeight: 600 }}>{item.memberId || ""}</td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 9.5 }}>{item.fullName}</div>
                  {(item.guardianName || item.fatherName) && (
                    <div style={{ fontSize: 8, color: "#64748b" }}>
                      G: {item.guardianName || item.fatherName}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: "center", fontSize: 8.5 }}>{item.mobileNumber || ""}</td>
                <td style={{ textAlign: "center", fontSize: 8.5, color: "#475569" }}>
                  {item.openDate || "—"}
                </td>
                <td style={{ textAlign: "center", fontSize: 8.5 }}>
                  {item.tenure}
                  <span
                    style={{
                      fontSize: 7.5,
                      marginLeft: 2,
                      color: isWk ? "#0369a1" : "#b45309",
                      fontWeight: 600,
                    }}
                  >
                    ({isWk ? "Wk" : "Mo"})
                  </span>
                </td>
                <td style={{ textAlign: "center", fontSize: 8.5 }}>
                  <span style={{ fontWeight: 600, color: item.paidInstallments > 0 ? "#047857" : "#334155" }}>
                    {item.paidInstallments}/{item.totalInstallments}
                  </span>
                </td>
                <td style={{ textAlign: "right", fontWeight: 600, fontSize: 9 }}>
                  {formatAmount(item.installmentAmount)}
                </td>

                {/* Week by Week Installments — displays exact installment number (#13, #14...) and amount */}
                {meetingDates.map((date, idx) => {
                  const wkData = item.weeklySchedule?.get(idx);
                  const isDueThisWeek = Boolean(wkData && wkData.isDue);
                  const weekDemand = wkData ? wkData.demand : 0;
                  const weekPaid = wkData ? (wkData.paid || 0) : 0;
                  const isPaid = wkData?.isPaid || (weekPaid >= weekDemand && weekDemand > 0);

                  if (weekDemand > 0) {
                    weeklyTotals[idx].demand += weekDemand;
                    weeklyTotals[idx].paid += weekPaid;
                  }

                  const instNumber = wkData?.installmentNo ?? (isWk ? item.nextInstallmentNo + idx : null);
                  const showInst = isWk
                    ? (instNumber && instNumber <= item.totalInstallments ? instNumber : null)
                    : (isDueThisWeek && wkData?.installmentNo ? wkData.installmentNo : null);

                  return (
                    <>
                      <td
                        key={`dem-${idx}`}
                        style={{
                          textAlign: "right",
                          fontSize: 8.5,
                          background: idx % 2 === 0 ? "#eff6ff" : "#f0f9ff",
                          padding: "2px 4px",
                        }}
                      >
                        {isDueThisWeek && weekDemand > 0 ? (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: showInst ? "space-between" : "flex-end",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            {showInst && (
                              <span
                                style={{
                                  fontSize: 7.5,
                                  fontWeight: 700,
                                  color: isPaid ? "#047857" : "#0369a1",
                                  background: isPaid ? "#dcfce7" : "#e0f2fe",
                                  padding: "0 3px",
                                  borderRadius: 2,
                                  border: isPaid ? "1px solid #86efac" : "1px solid #bae6fd",
                                  lineHeight: 1.2,
                                }}
                                title={`Installment ${showInst}${isPaid ? " (Paid)" : ""}`}
                              >
                                {showInst}
                              </span>
                            )}
                            <span
                              style={{
                                fontWeight: 600,
                                color: isPaid ? "#047857" : "#0369a1",
                                fontSize: 8.5,
                              }}
                            >
                              {formatAmount(weekDemand)}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>
                      <td
                        key={`col-${idx}`}
                        className={isPaid ? "" : "print-blank-box"}
                        style={{
                          background: isPaid ? "#f0fdf4" : "#ffffff",
                          textAlign: "right",
                          padding: "2px 4px",
                          fontWeight: 600,
                          fontSize: 8.5,
                          color: "#047857",
                        }}
                      >
                        {isPaid || weekPaid > 0 ? (
                          <span>{formatAmount(weekPaid > 0 ? weekPaid : (isPaid ? weekDemand : 0))}</span>
                        ) : null}
                      </td>
                    </>
                  );
                })}

                {/* Total Month DPS Demand */}
                <td
                  style={{
                    textAlign: "right",
                    fontWeight: "bold",
                    color: "#0369a1",
                    fontSize: 9.5,
                  }}
                >
                  {memberMonthDemand > 0 ? formatAmount(memberMonthDemand) : "—"}
                </td>

                {/* Single Month Collection: Displays amount paid if any, else blank writable box */}
                <td
                  className={memberMonthPaid > 0 ? "" : "print-blank-box"}
                  style={{
                    background: memberMonthPaid > 0 ? "#f0fdf4" : "#eff6ff",
                    textAlign: "right",
                    padding: "2px 4px",
                    fontWeight: "bold",
                    color: "#047857",
                    fontSize: 9.5,
                  }}
                >
                  {memberMonthPaid > 0 ? formatAmount(memberMonthPaid) : null}
                </td>
              </tr>
            );
          })}

          {/* Grand Summary Row */}
          <tr style={{ background: "#f8f9fa", fontWeight: "bold" }}>
            <td colSpan={7} style={{ textAlign: "right", paddingRight: 6 }}>
              Total ({dpsAccountsWithSchedule.length} DPS Accounts):
            </td>
            <td></td>
            {meetingDates.map((_, idx) => (
              <>
                <td
                  key={`tot-dem-${idx}`}
                  style={{ textAlign: "right", fontSize: 8.5, color: "#0369a1" }}
                >
                  {formatAmount(weeklyTotals[idx].demand)}
                </td>
                <td
                  key={`tot-col-${idx}`}
                  className={weeklyTotals[idx].paid > 0 ? "" : "print-blank-box"}
                  style={{
                    textAlign: "right",
                    fontSize: 8.5,
                    color: "#047857",
                    background: weeklyTotals[idx].paid > 0 ? "#f0fdf4" : "#ffffff",
                    padding: "2px 4px",
                  }}
                >
                  {weeklyTotals[idx].paid > 0 ? formatAmount(weeklyTotals[idx].paid) : ""}
                </td>
              </>
            ))}
            <td
              style={{
                textAlign: "right",
                fontSize: 9.5,
                color: "#0369a1",
              }}
            >
              {formatAmount(grandMonthDemand)}
            </td>
            <td
              className={grandMonthPaid > 0 ? "" : "print-blank-box"}
              style={{
                textAlign: "right",
                fontSize: 9.5,
                color: "#047857",
                background: grandMonthPaid > 0 ? "#f0fdf4" : "#eff6ff",
                padding: "2px 4px",
              }}
            >
              {grandMonthPaid > 0 ? formatAmount(grandMonthPaid) : ""}
            </td>
          </tr>
        </tbody>
      </table>
    );
  };

  // Helper: Monthly Loan Table (Sheet 3 — Full 1 Month for Loan Accounts)
  const renderMonthlyLoanTable = () => {
    if (monthLoanAccountsList.length === 0) {
      return (
        <Empty
          description="No active loans found for this Somiti"
          style={{ padding: "30px 0" }}
        />
      );
    }

    let grandMonthDemand = 0;
    let grandMonthPaid = 0;
    const weeklyTotals = meetingDates.map(() => ({ demand: 0, paid: 0 }));

    return (
      <table className="print-table" style={{ fontSize: 9 }}>
        <thead>
          <tr>
            <th rowSpan={2} style={{ width: "2.5%" }}>SL</th>
            <th rowSpan={2} style={{ width: "6%" }}>Member ID</th>
            <th rowSpan={2} style={{ width: "15%", textAlign: "left" }}>Member Name</th>
            <th rowSpan={2} style={{ width: "8.5%" }}>Mobile</th>
            <th rowSpan={2} style={{ width: "7.5%" }}>Disb. Date</th>
            <th rowSpan={2} style={{ width: "8%", textAlign: "right" }}>Principal</th>
            <th rowSpan={2} style={{ width: "6.5%", textAlign: "right" }}>Inst.</th>

            {/* Weekly Columns */}
            {meetingDates.map((date, idx) => (
              <th
                key={idx}
                colSpan={2}
                style={{
                  background: idx % 2 === 0 ? "#f8fafc" : "#f1f5f9",
                  borderBottom: "1px solid #cbd5e1",
                }}
              >
                Wk {idx + 1} ({date.format("DD MMM")})
              </th>
            ))}

            <th rowSpan={2} style={{ width: "7%", fontWeight: "bold" }}>Month Demand</th>
            <th rowSpan={2} style={{ width: "8%", background: "#fffbeb", fontWeight: "bold" }}>Month Collection</th>
          </tr>
          <tr>
            {meetingDates.map((_, idx) => (
              <>
                <th
                  key={`dem-${idx}`}
                  style={{
                    fontSize: 8,
                    width: `${31 / (meetingDates.length * 2)}%`,
                    background: idx % 2 === 0 ? "#f8fafc" : "#f1f5f9",
                  }}
                >
                  Demand
                </th>
                <th
                  key={`col-${idx}`}
                  style={{
                    fontSize: 8,
                    width: `${31 / (meetingDates.length * 2)}%`,
                    background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                  }}
                >
                  Collection
                </th>
              </>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthLoanAccountsList.map((item, index) => {
            const loan = item.loan;
            const regInst = loan ? toAmount(loan.installmentAmount) : 0;
            let memberMonthDemand = 0;
            let memberMonthPaid = 0;

            return (
              <tr key={item.loanId || index}>
                <td style={{ textAlign: "center", fontWeight: "bold" }}>{index + 1}</td>
                <td style={{ textAlign: "center", fontWeight: 600 }}>{item.memberId || ""}</td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 9.5 }}>{item.fullName}</div>
                  {item.guardianName && (
                    <div style={{ fontSize: 8, color: "#64748b" }}>
                      G: {item.guardianName}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: "center", fontSize: 8.5 }}>{item.mobileNumber || ""}</td>
                <td style={{ textAlign: "center", fontSize: 8.5, color: "#475569" }}>
                  {item.disbursementDate ? formatDate(item.disbursementDate) : "—"}
                </td>
                <td style={{ textAlign: "right", fontWeight: 600, fontSize: 9 }}>
                  {item.hasActiveLoan ? formatAmount(item.principalAmount || item.loan?.principalAmount) : "—"}
                </td>
                <td style={{ textAlign: "right", fontWeight: 600, fontSize: 9 }}>
                  {item.hasActiveLoan ? (
                    <>
                      {formatAmount(regInst)}
                      <span
                        style={{
                          fontSize: 7.5,
                          marginLeft: 2,
                          color: item.frequency === "WEEKLY" ? "#0369a1" : "#b45309",
                          fontWeight: 600,
                        }}
                      >
                        ({item.frequency === "WEEKLY" ? "Wk" : "Mo"})
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </td>

                {/* Week by Week Installments — strictly shows actual installments due in that week */}
                {meetingDates.map((date, idx) => {
                  const inst = item.weeklyInstallments?.get(idx);
                  const instAmount = inst
                    ? typeof inst.amount === "number"
                      ? inst.amount
                      : toAmount(inst.items?.[0]?.amount)
                    : 0;
                  const instPaid = inst
                    ? typeof inst.paidAmount === "number"
                      ? inst.paidAmount
                      : toAmount(inst.items?.[0]?.paidAmount)
                    : 0;
                  const isPaid = inst?.isPaid || (instPaid >= instAmount && instAmount > 0);
                  const instNo = inst?.items?.[0]?.installmentNo;

                  if (instAmount > 0) {
                    memberMonthDemand += instAmount;
                    memberMonthPaid += instPaid;
                    weeklyTotals[idx].demand += instAmount;
                    weeklyTotals[idx].paid += instPaid;
                  }

                  return (
                    <>
                      <td
                        key={`dem-${idx}`}
                        style={{
                          textAlign: "right",
                          fontSize: 8.5,
                          background: idx % 2 === 0 ? "#f8fafc" : "#f1f5f9",
                          padding: "2px 4px",
                        }}
                      >
                        {instAmount > 0 ? (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: instNo ? "space-between" : "flex-end",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            {instNo && (
                              <span
                                style={{
                                  fontSize: 7.5,
                                  fontWeight: 700,
                                  color: isPaid ? "#047857" : "#334155",
                                  background: isPaid ? "#dcfce7" : "#f1f5f9",
                                  padding: "0 3px",
                                  borderRadius: 2,
                                  border: isPaid ? "1px solid #86efac" : "1px solid #cbd5e1",
                                  lineHeight: 1.2,
                                }}
                                title={`Installment ${instNo}${isPaid ? " (Paid)" : ""}`}
                              >
                                {instNo}
                              </span>
                            )}
                            <span
                              style={{
                                fontWeight: 600,
                                color: isPaid ? "#047857" : "#1e293b",
                                fontSize: 8.5,
                              }}
                            >
                              {formatAmount(instAmount)}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>
                      <td
                        key={`col-${idx}`}
                        className={isPaid ? "" : "print-blank-box"}
                        style={{
                          background: isPaid ? "#f0fdf4" : "#ffffff",
                          textAlign: "right",
                          padding: "2px 4px",
                          fontWeight: 600,
                          fontSize: 8.5,
                          color: "#047857",
                        }}
                      >
                        {isPaid || instPaid > 0 ? (
                          <span>{formatAmount(instPaid)}</span>
                        ) : null}
                      </td>
                    </>
                  );
                })}

                {/* Total Month Demand — exact total due in this month */}
                <td
                  style={{
                    textAlign: "right",
                    fontWeight: "bold",
                    color: "#047857",
                    fontSize: 9.5,
                  }}
                >
                  {(() => {
                    grandMonthDemand += memberMonthDemand;
                    grandMonthPaid += memberMonthPaid;
                    return memberMonthDemand > 0
                      ? formatAmount(memberMonthDemand)
                      : "—";
                  })()}
                </td>

                {/* Total Month Collection */}
                <td
                  className={memberMonthPaid > 0 ? "" : "print-blank-box"}
                  style={{
                    background: memberMonthPaid > 0 ? "#f0fdf4" : "#fffdf9",
                    textAlign: "right",
                    padding: "2px 4px",
                    fontWeight: "bold",
                    color: "#047857",
                    fontSize: 9.5,
                  }}
                >
                  {memberMonthPaid > 0 ? formatAmount(memberMonthPaid) : null}
                </td>
              </tr>
            );
          })}

          {/* Grand Summary Row */}
          <tr style={{ background: "#f8f9fa", fontWeight: "bold" }}>
            <td colSpan={5} style={{ textAlign: "right", paddingRight: 6 }}>
              Total ({monthLoanAccountsList.length} Loans):
            </td>
            <td style={{ textAlign: "right", fontSize: 9, fontWeight: "bold" }}>
              {formatAmount(totalMonthLoanPrincipal)}
            </td>
            <td></td>
            {meetingDates.map((_, idx) => (
              <>
                <td
                  key={`tot-dem-${idx}`}
                  style={{ textAlign: "right", fontSize: 8.5 }}
                >
                  {formatAmount(weeklyTotals[idx].demand)}
                </td>
                <td
                  key={`tot-col-${idx}`}
                  className={weeklyTotals[idx].paid > 0 ? "" : "print-blank-box"}
                  style={{
                    textAlign: "right",
                    fontSize: 8.5,
                    color: "#047857",
                    background: weeklyTotals[idx].paid > 0 ? "#f0fdf4" : "#ffffff",
                    padding: "2px 4px",
                  }}
                >
                  {weeklyTotals[idx].paid > 0 ? formatAmount(weeklyTotals[idx].paid) : ""}
                </td>
              </>
            ))}
            <td
              style={{
                textAlign: "right",
                fontSize: 9.5,
                color: "#047857",
              }}
            >
              {formatAmount(grandMonthDemand)}
            </td>
            <td
              className={grandMonthPaid > 0 ? "" : "print-blank-box"}
              style={{
                textAlign: "right",
                fontSize: 9.5,
                color: "#047857",
                background: grandMonthPaid > 0 ? "#f0fdf4" : "#eff6ff",
                padding: "2px 4px",
              }}
            >
              {grandMonthPaid > 0 ? formatAmount(grandMonthPaid) : ""}
            </td>
          </tr>
        </tbody>
      </table>
    );
  };

  // Helper: Monthly Combined Master Table (Sheet 4 — Single Matrix View)
  const renderMonthlyCombinedTable = () => {
    if (membersList.length === 0) {
      return (
        <Empty
          description="No members found for this Somiti"
          style={{ padding: "30px 0" }}
        />
      );
    }

    let grandMonthDemand = 0;
    let grandMonthPaid = 0;
    const weeklyTotals = meetingDates.map(() => ({ demand: 0, paid: 0 }));

    return (
      <table className="print-table" style={{ fontSize: 9 }}>
        <thead>
          <tr>
            <th rowSpan={2} style={{ width: "3%" }}>
              SL
            </th>
            <th rowSpan={2} style={{ width: "6%" }}>
              Member ID
            </th>
            <th rowSpan={2} style={{ width: "13.5%", textAlign: "left" }}>
              Member / Guardian Name
            </th>
            <th rowSpan={2} style={{ width: "6.5%" }}>
              Admission Date
            </th>
            <th rowSpan={2} style={{ width: "7.5%" }}>
              Loan & Disb
            </th>
            <th rowSpan={2} style={{ width: "5%" }}>
              Inst.
            </th>

            {/* Weekly Columns */}
            {meetingDates.map((date, idx) => (
              <th
                key={idx}
                colSpan={2}
                style={{
                  background: idx % 2 === 0 ? "#f8fafc" : "#f1f5f9",
                  borderBottom: "1px solid #cbd5e1",
                }}
              >
                Wk {idx + 1} ({date.format("DD MMM")})
              </th>
            ))}

            <th rowSpan={2} style={{ width: "6%", background: "#f0fdf4" }}>
              Savings Collection
            </th>
            <th rowSpan={2} style={{ width: "6%", background: "#eff6ff" }}>
              DPS Collection
            </th>
            <th rowSpan={2} style={{ width: "7.5%", fontWeight: "bold" }}>
              Month Demand
            </th>
            <th rowSpan={2} style={{ width: "7.5%", background: "#fffbeb", fontWeight: "bold" }}>
              Month Collection
            </th>
          </tr>
          <tr>
            {meetingDates.map((_, idx) => (
              <>
                <th
                  key={`dem-${idx}`}
                  style={{
                    fontSize: 8,
                    width: `${26 / (meetingDates.length * 2)}%`,
                    background: idx % 2 === 0 ? "#f8fafc" : "#f1f5f9",
                  }}
                >
                  Demand
                </th>
                <th
                  key={`col-${idx}`}
                  style={{
                    fontSize: 8,
                    width: `${26 / (meetingDates.length * 2)}%`,
                    background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                  }}
                >
                  Collection
                </th>
              </>
            ))}
          </tr>
        </thead>
        <tbody>
          {membersList.map((member, index) => {
            const memLoanData = memberLoansMap.get(member.id);
            const loan =
              memLoanData?.loan &&
              memLoanData.loan.id &&
              memLoanData.loan.loanId !== "DPS Only" &&
              memLoanData.loan.status === "ACTIVE"
                ? memLoanData.loan
                : null;
            const regInst = loan ? toAmount(loan.installmentAmount) : 0;

            let memberMonthDemand = 0;
            let memberMonthPaid = 0;

            return (
              <tr key={member.id || index}>
                <td style={{ textAlign: "center", fontWeight: "bold" }}>
                  {index + 1}
                </td>
                <td style={{ textAlign: "center", fontWeight: 600 }}>
                  {member.memberId || ""}
                </td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 9.5 }}>
                    {member.fullName}
                  </div>
                  {(member.guardianName || member.fatherName) && (
                    <div style={{ fontSize: 8, color: "#64748b" }}>
                      G: {member.guardianName || member.fatherName}
                    </div>
                  )}
                  {member.mobileNumber && (
                    <div style={{ fontSize: 8, color: "#94a3b8" }}>
                      {member.mobileNumber}
                    </div>
                  )}
                </td>
                <td
                  style={{
                    textAlign: "center",
                    fontSize: 8.5,
                    color: "#475569",
                  }}
                >
                  {member.joinDate ? formatDate(member.joinDate) : "—"}
                </td>
                <td style={{ textAlign: "center", fontSize: 8.5 }}>
                  {loan ? (
                    <div>
                      <strong className="text-blue-700">{loan.loanId}</strong>
                      <div style={{ fontSize: 8, color: "#64748b" }}>
                        {loan.disbursementDate
                          ? formatDate(loan.disbursementDate)
                          : "—"}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: "#94a3b8" }}>No Loan</span>
                  )}
                </td>
                <td
                  style={{ textAlign: "right", fontWeight: 600, fontSize: 9 }}
                >
                  {loan ? formatAmount(regInst) : "—"}
                </td>

                {/* Week by Week Installments — strictly shows actual installments due in that week */}
                {meetingDates.map((date, idx) => {
                  const inst = memLoanData?.weeklyInstallments?.get(idx);
                  const instAmount = inst
                    ? typeof inst.amount === "number"
                      ? inst.amount
                      : toAmount(inst.items?.[0]?.amount)
                    : 0;
                  const instPaid = inst
                    ? typeof inst.paidAmount === "number"
                      ? inst.paidAmount
                      : toAmount(inst.items?.[0]?.paidAmount)
                    : 0;
                  const isPaid = inst?.isPaid || (instPaid >= instAmount && instAmount > 0);
                  const instNo = inst?.items?.[0]?.installmentNo;

                  if (instAmount > 0) {
                    memberMonthDemand += instAmount;
                    memberMonthPaid += instPaid;
                    weeklyTotals[idx].demand += instAmount;
                    weeklyTotals[idx].paid += instPaid;
                  }

                  return (
                    <>
                      <td
                        key={`dem-${idx}`}
                        style={{
                          textAlign: "right",
                          fontSize: 8.5,
                          background: idx % 2 === 0 ? "#f8fafc" : "#f1f5f9",
                          padding: "2px 4px",
                        }}
                      >
                        {instAmount > 0 ? (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: instNo ? "space-between" : "flex-end",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            {instNo && (
                              <span
                                style={{
                                  fontSize: 7.5,
                                  fontWeight: 700,
                                  color: isPaid ? "#047857" : "#334155",
                                  background: isPaid ? "#dcfce7" : "#f1f5f9",
                                  padding: "0 3px",
                                  borderRadius: 2,
                                  border: isPaid ? "1px solid #86efac" : "1px solid #cbd5e1",
                                  lineHeight: 1.2,
                                }}
                                title={`Installment ${instNo}${isPaid ? " (Paid)" : ""}`}
                              >
                                {instNo}
                              </span>
                            )}
                            <span
                              style={{
                                fontWeight: 600,
                                color: isPaid ? "#047857" : "#1e293b",
                                fontSize: 8.5,
                              }}
                            >
                              {formatAmount(instAmount)}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>
                      <td
                        key={`col-${idx}`}
                        className={isPaid ? "" : "print-blank-box"}
                        style={{
                          background: isPaid ? "#f0fdf4" : "#ffffff",
                          textAlign: "right",
                          padding: "2px 4px",
                          fontWeight: 600,
                          fontSize: 8.5,
                          color: "#047857",
                        }}
                      >
                        {isPaid || instPaid > 0 ? (
                          <span>{formatAmount(instPaid)}</span>
                        ) : null}
                      </td>
                    </>
                  );
                })}

                {/* Savings Coll */}
                <td
                  className="print-blank-box"
                  style={{ background: "#fcfffc" }}
                ></td>
                {/* DPS Coll */}
                <td
                  className="print-blank-box"
                  style={{ background: "#f8fafc" }}
                ></td>

                {/* Total Month Demand */}
                <td
                  style={{
                    textAlign: "right",
                    fontWeight: "bold",
                    color: "#047857",
                    fontSize: 9.5,
                  }}
                >
                  {(() => {
                    grandMonthDemand += memberMonthDemand;
                    grandMonthPaid += memberMonthPaid;
                    return memberMonthDemand > 0
                      ? formatAmount(memberMonthDemand)
                      : "—";
                  })()}
                </td>

                {/* Total Month Coll */}
                <td
                  className={memberMonthPaid > 0 ? "" : "print-blank-box"}
                  style={{
                    background: memberMonthPaid > 0 ? "#f0fdf4" : "#fffdf9",
                    textAlign: "right",
                    padding: "2px 4px",
                    fontWeight: "bold",
                    color: "#047857",
                    fontSize: 9.5,
                  }}
                >
                  {memberMonthPaid > 0 ? formatAmount(memberMonthPaid) : null}
                </td>
              </tr>
            );
          })}

          {/* Grand Summary Row */}
          <tr style={{ background: "#f8f9fa", fontWeight: "bold" }}>
            <td colSpan={6} style={{ textAlign: "right", paddingRight: 6 }}>
              Total ({membersList.length} Members):
            </td>
            {meetingDates.map((_, idx) => (
              <>
                <td
                  key={`tot-dem-${idx}`}
                  style={{ textAlign: "right", fontSize: 8.5 }}
                >
                  {formatAmount(weeklyTotals[idx].demand)}
                </td>
                <td
                  key={`tot-col-${idx}`}
                  className={weeklyTotals[idx].paid > 0 ? "" : "print-blank-box"}
                  style={{
                    textAlign: "right",
                    fontSize: 8.5,
                    color: "#047857",
                    background: weeklyTotals[idx].paid > 0 ? "#f0fdf4" : "#ffffff",
                    padding: "2px 4px",
                  }}
                >
                  {weeklyTotals[idx].paid > 0 ? formatAmount(weeklyTotals[idx].paid) : ""}
                </td>
              </>
            ))}
            <td className="print-blank-box"></td>
            <td className="print-blank-box"></td>
            <td
              style={{
                textAlign: "right",
                fontSize: 9.5,
                color: "#047857",
              }}
            >
              {formatAmount(grandMonthDemand)}
            </td>
            <td
              className={grandMonthPaid > 0 ? "" : "print-blank-box"}
              style={{
                textAlign: "right",
                fontSize: 9.5,
                color: "#047857",
                background: grandMonthPaid > 0 ? "#f0fdf4" : "#eff6ff",
                padding: "2px 4px",
              }}
            >
              {grandMonthPaid > 0 ? formatAmount(grandMonthPaid) : ""}
            </td>
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
            gap: 10,
          }}
        >
          <Space wrap>
            <PrinterOutlined style={{ fontSize: 18, color: "#1890ff" }} />
            <div>
              <Typography.Text strong style={{ fontSize: 16 }}>
                Field Collection Sheets
              </Typography.Text>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                {activeSomiti ? activeSomiti.name : "All Somities"} •{" "}
                {isMonthlyMode
                  ? `Monthly Full Sheet (${selectedMonth ? selectedMonth.format("MMMM YYYY") : ""})`
                  : `Daily Collection (${dailyDate ? formatDate(dailyDate) : "Today"})`}
              </div>
            </div>
          </Space>

          <div className="overflow-x-auto max-w-full flex items-center gap-2 flex-wrap">
            {/* Somiti Selector inside Modal */}
            {somities && somities.length > 0 && (
              <Select
                size="small"
                style={{ width: 175 }}
                value={modalSomitiId}
                onChange={(val) => setModalSomitiId(val)}
                options={[
                  { value: "ALL", label: "All Somities" },
                  ...somities.map((s) => ({
                    value: String(s.id),
                    label: `${s.name}${s.meetingDay ? ` (${s.meetingDay.slice(0, 3)})` : ""}`,
                  })),
                ]}
              />
            )}

            {/* Primary Mode Toggle: Daily vs Monthly */}
            <Radio.Group
              value={isMonthlyMode ? "monthly" : "daily"}
              onChange={(e) => {
                const nextMode = e.target.value;
                if (nextMode === "monthly") {
                  setSheetType("monthly_all");
                } else {
                  setSheetType("all");
                }
              }}
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="daily">📅 Daily</Radio.Button>
              <Radio.Button value="monthly">🗓️ Monthly</Radio.Button>
            </Radio.Group>

            {/* Daily Date Picker when in Daily Mode */}
            {!isMonthlyMode && (
              <DatePicker
                value={dailyDate}
                onChange={(val) => val && setDailyDate(val)}
                size="small"
                allowClear={false}
                format="DD MMM YYYY"
                style={{ width: 130 }}
              />
            )}

            {/* Month Picker when in Monthly Mode */}
            {isMonthlyMode && (
              <DatePicker
                picker="month"
                value={selectedMonth}
                onChange={(val) => val && setSelectedMonth(val)}
                size="small"
                allowClear={false}
                format="MMMM YYYY"
                style={{ width: 140 }}
              />
            )}

            {/* Sub-sheet Selection */}
            {isMonthlyMode ? (
              <Radio.Group
                value={sheetType === "monthly" ? "monthly_all" : sheetType}
                onChange={(e) => setSheetType(e.target.value)}
                size="small"
              >
                <Radio.Button value="monthly_all">
                  All Monthly Sheets
                </Radio.Button>
                <Radio.Button value="monthly_savings">
                  1. Savings
                </Radio.Button>
                <Radio.Button value="monthly_dps">2. DPS</Radio.Button>
                <Radio.Button value="monthly_loan">3. Loan</Radio.Button>
                <Radio.Button value="monthly_matrix">
                  4. Combined Matrix
                </Radio.Button>
              </Radio.Group>
            ) : (
              <Radio.Group
                value={sheetType === "combined" ? "all" : sheetType}
                onChange={(e) => setSheetType(e.target.value)}
                size="small"
              >
                <Radio.Button value="all">All Daily Sheets</Radio.Button>
                <Radio.Button value="savings">1. Savings</Radio.Button>
                <Radio.Button value="dps">2. DPS</Radio.Button>
                <Radio.Button value="loan">3. Loan</Radio.Button>
              </Radio.Group>
            )}
          </div>
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
            padding: 4px 5px !important;
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
            height: 28px !important;
            min-height: 28px !important;
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
          padding: 5px 6px;
        }
        .print-table th {
          background-color: #f3f4f6;
          font-weight: 600;
          text-align: center;
        }
        .print-blank-box {
          height: 28px;
          min-height: 28px;
          background: #fafafa;
        }
      `}</style>

      {/* Interactive Controls Bar for Frequency & Members filtering */}
      <div
        className="no-print"
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 6,
          padding: "8px 14px",
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          fontSize: 12,
        }}
      >
        <Space wrap size="middle">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 600, color: "#334155" }}>
              Loan Frequency:
            </span>
            <Radio.Group
              value={loanFrequencyFilter}
              onChange={(e) => setLoanFrequencyFilter(e.target.value)}
              size="small"
              buttonStyle="solid"
            >
              <Radio.Button value="ALL">All Loans</Radio.Button>
              <Radio.Button value="WEEKLY">Weekly</Radio.Button>
              <Radio.Button value="MONTHLY">Monthly</Radio.Button>
            </Radio.Group>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 600, color: "#334155" }}>
              Loan Members:
            </span>
            <Radio.Group
              value={loanMemberFilter}
              onChange={(e) => setLoanMemberFilter(e.target.value)}
              size="small"
            >
              <Radio.Button value="ACTIVE_ONLY">
                Active Loans Only ({monthLoanAccountsList.filter((x) => x.hasActiveLoan).length})
              </Radio.Button>
              <Radio.Button value="ALL_MEMBERS">
                All Members ({membersList.length})
              </Radio.Button>
            </Radio.Group>
          </div>
        </Space>

        <Space wrap size="middle">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 600, color: "#334155" }}>
              DPS Frequency:
            </span>
            <Radio.Group
              value={dpsFrequencyFilter}
              onChange={(e) => setDpsFrequencyFilter(e.target.value)}
              size="small"
              buttonStyle="solid"
            >
              <Radio.Button value="ALL">All DPS ({dpsList.length})</Radio.Button>
              <Radio.Button value="WEEKLY">Weekly</Radio.Button>
              <Radio.Button value="MONTHLY">Monthly</Radio.Button>
            </Radio.Group>
          </div>
        </Space>
      </div>

      {(isMonthlyMode ? monthLoading : dailyLoading) && (
        <div
          className="no-print"
          style={{
            textAlign: "center",
            padding: "8px 16px",
            background: "#f0f9ff",
            color: "#0284c7",
            borderRadius: 6,
            marginBottom: 10,
            fontSize: 12,
            fontWeight: 500,
            border: "1px solid #bae6fd",
          }}
        >
          <Spin size="small" style={{ marginRight: 8 }} />
          Loading collection sheet data...
        </div>
      )}

      <div className="preview-container">
        <div className="collection-print-root" ref={printAreaRef}>
          {/* ============================================================== */}
          {/* DAILY OPTION 1: SAVINGS ONLY                                   */}
          {/* ============================================================== */}
          {sheetType === "savings" && (
            <div className="sheet-page">
              {renderHeader(
                "Microfinance & Savings Program",
                "1. Daily Field Collection Sheet — Savings (General & Special)",
              )}
              {renderMetaBar(false)}
              {renderSavingsTable()}
              {renderSignatureBlock()}
              {renderFooter(1, 1)}
            </div>
          )}

          {/* ============================================================== */}
          {/* DAILY OPTION 2: DPS ONLY                                       */}
          {/* ============================================================== */}
          {sheetType === "dps" && (
            <div className="sheet-page">
              {renderHeader(
                "Deposit Pension Scheme (DPS) Program",
                "2. Daily Field Collection Sheet — DPS (Deposit Pension Scheme)",
              )}
              {renderMetaBar(false)}
              {renderDpsTable()}
              {renderSignatureBlock()}
              {renderFooter(1, 1)}
            </div>
          )}

          {/* ============================================================== */}
          {/* DAILY OPTION 3: LOAN ONLY                                      */}
          {/* ============================================================== */}
          {sheetType === "loan" && (
            <div className="sheet-page">
              {renderHeader(
                "Microfinance & Credit Program",
                "3. Daily Field Collection Sheet — Loan Repayment",
              )}
              {renderMetaBar(false)}
              {renderLoanTable()}
              {renderSignatureBlock()}
              {renderFooter(1, 1)}
            </div>
          )}

          {/* ============================================================== */}
          {/* DAILY OPTION 4: ALL DAILY SHEETS (SAVINGS + DPS + LOAN)        */}
          {/* ============================================================== */}
          {(sheetType === "all" || sheetType === "combined") && (
            <>
              {/* Sheet 1: Savings */}
              <div className="sheet-page">
                {renderHeader(
                  "Microfinance & Savings Program",
                  "1. Daily Field Collection Sheet — Savings (General & Special)",
                )}
                {renderMetaBar(false)}
                {renderSavingsTable()}
                {renderSignatureBlock()}
                {renderFooter(1, 3)}
              </div>

              {/* Automatic Page Break */}
              <div className="sheet-page-break" />

              {/* Sheet 2: DPS */}
              <div className="sheet-page">
                {renderHeader(
                  "Deposit Pension Scheme (DPS) Program",
                  "2. Daily Field Collection Sheet — DPS (Deposit Pension Scheme)",
                )}
                {renderMetaBar(false)}
                {renderDpsTable()}
                {renderSignatureBlock()}
                {renderFooter(2, 3)}
              </div>

              {/* Automatic Page Break */}
              <div className="sheet-page-break" />

              {/* Sheet 3: Loan */}
              <div className="sheet-page">
                {renderHeader(
                  "Microfinance & Credit Program",
                  "3. Daily Field Collection Sheet — Loan Repayment",
                )}
                {renderMetaBar(false)}
                {renderLoanTable()}
                {renderSignatureBlock()}
                {renderFooter(3, 3)}
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* MONTHLY OPTION 1: MONTHLY SAVINGS ONLY (ALL MEMBERS)           */}
          {/* ============================================================== */}
          {sheetType === "monthly_savings" && (
            <div className="sheet-page">
              {renderHeader(
                "Microfinance & Savings Program",
                `1. Monthly Field Collection Sheet — Savings (General & Special) — ${selectedMonth ? selectedMonth.format("MMMM YYYY") : "Monthly"}`,
              )}
              {renderMetaBar(true)}
              {renderMonthlySavingsTable()}
              {renderSignatureBlock()}
              {renderFooter(1, 1)}
            </div>
          )}

          {/* ============================================================== */}
          {/* MONTHLY OPTION 2: MONTHLY DPS ONLY (DPS ACCOUNTS)              */}
          {/* ============================================================== */}
          {sheetType === "monthly_dps" && (
            <div className="sheet-page">
              {renderHeader(
                "Deposit Pension Scheme (DPS) Program",
                `2. Monthly Field Collection Sheet — DPS (Deposit Pension Scheme) — ${selectedMonth ? selectedMonth.format("MMMM YYYY") : "Monthly"}`,
              )}
              {renderMetaBar(true)}
              {renderMonthlyDpsTable()}
              {renderSignatureBlock()}
              {renderFooter(1, 1)}
            </div>
          )}

          {/* ============================================================== */}
          {/* MONTHLY OPTION 3: MONTHLY LOAN ONLY (LOAN ACCOUNTS)            */}
          {/* ============================================================== */}
          {sheetType === "monthly_loan" && (
            <div className="sheet-page">
              {renderHeader(
                "Microfinance & Credit Program",
                `3. Monthly Field Collection Sheet — Loan Repayment — ${selectedMonth ? selectedMonth.format("MMMM YYYY") : "Monthly"}`,
              )}
              {renderMetaBar(true)}
              {renderMonthlyLoanTable()}
              {renderSignatureBlock()}
              {renderFooter(1, 1)}
            </div>
          )}

          {/* ============================================================== */}
          {/* MONTHLY OPTION 4: COMBINED MASTER MATRIX                       */}
          {/* ============================================================== */}
          {sheetType === "monthly_matrix" && (
            <div className="sheet-page">
              {renderHeader(
                "Microfinance & Credit Program",
                `Monthly Field Collection Master Matrix — ${selectedMonth ? selectedMonth.format("MMMM YYYY") : "Monthly Ledger"}`,
              )}
              {renderMetaBar(true)}
              {renderMonthlyCombinedTable()}
              {renderSignatureBlock()}
              {renderFooter(1, 1)}
            </div>
          )}

          {/* ============================================================== */}
          {/* MONTHLY OPTION 5: ALL MONTHLY SHEETS (SAVINGS + DPS + LOAN)   */}
          {/* ============================================================== */}
          {(sheetType === "monthly_all" || sheetType === "monthly") && (
            <>
              {/* Sheet 1: Monthly Savings (All Somiti Members) */}
              <div className="sheet-page">
                {renderHeader(
                  "Microfinance & Savings Program",
                  `1. Monthly Field Collection Sheet — Savings (General & Special) — ${selectedMonth ? selectedMonth.format("MMMM YYYY") : "Monthly"}`,
                )}
                {renderMetaBar(true)}
                {renderMonthlySavingsTable()}
                {renderSignatureBlock()}
                {renderFooter(1, 3)}
              </div>

              {/* Automatic Page Break */}
              <div className="sheet-page-break" />

              {/* Sheet 2: Monthly DPS (DPS Accounts) */}
              <div className="sheet-page">
                {renderHeader(
                  "Deposit Pension Scheme (DPS) Program",
                  `2. Monthly Field Collection Sheet — DPS (Deposit Pension Scheme) — ${selectedMonth ? selectedMonth.format("MMMM YYYY") : "Monthly"}`,
                )}
                {renderMetaBar(true)}
                {renderMonthlyDpsTable()}
                {renderSignatureBlock()}
                {renderFooter(2, 3)}
              </div>

              {/* Automatic Page Break */}
              <div className="sheet-page-break" />

              {/* Sheet 3: Monthly Loan (Active Loan Accounts) */}
              <div className="sheet-page">
                {renderHeader(
                  "Microfinance & Credit Program",
                  `3. Monthly Field Collection Sheet — Loan Repayment — ${selectedMonth ? selectedMonth.format("MMMM YYYY") : "Monthly"}`,
                )}
                {renderMetaBar(true)}
                {renderMonthlyLoanTable()}
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
