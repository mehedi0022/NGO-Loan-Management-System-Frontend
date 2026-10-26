export const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const formatEnum = (value) =>
  value
    ? value
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (character) => character.toUpperCase())
    : "—";

export const formatCharge = (loan) =>
  loan.chargeType === "PERCENTAGE"
    ? `${loan.chargeValue}% (${formatCurrency(loan.chargeAmount)})`
    : formatCurrency(loan.chargeAmount);

export const numberToWords = (num) => {
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
};
