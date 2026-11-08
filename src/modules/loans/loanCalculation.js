import dayjs from "dayjs";

/**
 * Calculates loan financials and schedule preview with support for
 * both automatic lower-10s formula and manual/custom installment control.
 *
 * @param {Object} params
 * @param {number} params.principalAmount
 * @param {"PERCENTAGE"|"FLAT"} params.chargeType
 * @param {number} params.chargeValue
 * @param {number} params.installmentCount
 * @param {boolean} [params.isCustomInstallment=false]
 * @param {number} [params.customInstallmentAmount]
 * @param {"MONTHLY"|"WEEKLY"} [params.frequency="MONTHLY"]
 * @param {dayjs.Dayjs|string} [params.firstDueDate]
 */
export const calculateLoanPreview = ({
  principalAmount = 0,
  chargeType = "PERCENTAGE",
  chargeValue = 0,
  installmentCount = 1,
  isCustomInstallment = false,
  customInstallmentAmount = 0,
  frequency = "MONTHLY",
  firstDueDate = null,
}) => {
  const principal = Number(principalAmount) || 0;
  const count = Math.max(1, Math.floor(Number(installmentCount) || 1));
  const rateOrValue = Number(chargeValue) || 0;

  if (principal <= 0) {
    return null;
  }

  const chargeAmount =
    chargeType === "PERCENTAGE"
      ? Math.round(((principal * rateOrValue) / 100) * 100) / 100
      : Math.round(rateOrValue * 100) / 100;

  const totalPayable = Math.round((principal + chargeAmount) * 100) / 100;
  const totalPayableInPaisa = Math.round(totalPayable * 100);
  const regularCount = Math.max(0, count - 1);

  // 1. Auto Installment Calculation (Default System - lower 10s)
  let autoInstallmentAmount = 0;
  if (count === 1) {
    autoInstallmentAmount = totalPayable;
  } else if (totalPayable / count >= 10) {
    autoInstallmentAmount =
      Math.floor(totalPayableInPaisa / count / 1000) * 10;
  } else {
    autoInstallmentAmount = Math.max(1, Math.floor(totalPayable / count));
  }

  let effectiveInstallmentAmount = autoInstallmentAmount;
  let isValidCustomAmount = true;
  let customAmountError = "";

  if (isCustomInstallment) {
    const customNum = Number(customInstallmentAmount);
    if (!customNum || customNum <= 0) {
      isValidCustomAmount = false;
      customAmountError = "Please enter a valid regular installment amount";
      effectiveInstallmentAmount = autoInstallmentAmount;
    } else if (count > 1) {
      const regularTotalInPaisa = Math.round(customNum * 100) * regularCount;
      const remainderInPaisa = totalPayableInPaisa - regularTotalInPaisa;

      if (remainderInPaisa <= 0) {
        isValidCustomAmount = false;
        customAmountError = `Amount is too high. BDT ${customNum.toLocaleString()} × ${regularCount} installments equals BDT ${(
          customNum * regularCount
        ).toLocaleString()}, which exceeds or equals total payable (BDT ${totalPayable.toLocaleString()}).`;
        effectiveInstallmentAmount = customNum;
      } else {
        effectiveInstallmentAmount = customNum;
      }
    } else {
      effectiveInstallmentAmount = customNum;
    }
  }

  // 2. Last Installment Amount
  const regularTotalInPaisa =
    Math.round(effectiveInstallmentAmount * 100) * regularCount;
  const lastInstallmentAmount =
    count === 1
      ? totalPayable
      : (totalPayableInPaisa - regularTotalInPaisa) / 100;

  // 3. Generate Schedule Preview
  const baseDate = firstDueDate ? dayjs(firstDueDate) : dayjs().add(7, "day");
  const schedule = [];
  let cumulative = 0;

  for (let i = 0; i < count; i++) {
    const isFinal = i === regularCount && count > 1;
    const amount = isFinal ? lastInstallmentAmount : effectiveInstallmentAmount;
    cumulative = Math.round((cumulative + amount) * 100) / 100;

    let dueDate = null;
    if (frequency === "WEEKLY") {
      dueDate = baseDate.add(i, "week");
    } else {
      dueDate = baseDate.add(i, "month");
    }

    schedule.push({
      installmentNo: i + 1,
      dueDate: dueDate.format("DD MMM YYYY"),
      amount,
      isFinal,
      cumulative,
      remaining: Math.max(
        0,
        Math.round((totalPayable - cumulative) * 100) / 100,
      ),
    });
  }

  return {
    principalAmount: principal,
    chargeAmount,
    totalPayable,
    installmentCount: count,
    autoInstallmentAmount,
    regularInstallmentAmount: effectiveInstallmentAmount,
    regularInstallmentCount: regularCount,
    lastInstallmentAmount,
    isCustomInstallment,
    isValidCustomAmount,
    customAmountError,
    schedule,
  };
};
