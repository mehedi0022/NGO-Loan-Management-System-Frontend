import { Col, Row, Typography } from "antd";

import { StatCard } from "../../../components/stat-card/StatCard.jsx";
import { formatCurrency } from "../../loans/loanFormatters.js";

const toAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

export function MemberFinancialSummary({ loans = [], savingsAccount, loading = false }) {
  const disbursedLoans = loans.filter((loan) =>
    ["ACTIVE", "COMPLETED"].includes(loan.status),
  );
  const totalBorrowed = disbursedLoans.reduce(
    (total, loan) => total + toAmount(loan.principalAmount),
    0,
  );
  const totalLoanPaid = disbursedLoans.reduce(
    (total, loan) => total + (loan.installments ?? []).reduce(
      (loanTotal, installment) => loanTotal + toAmount(installment.paidAmount),
      0,
    ),
    0,
  );
  const outstandingLoan = loans
    .filter((loan) => loan.status === "ACTIVE")
    .reduce(
      (total, loan) => total + (loan.installments ?? []).reduce(
        (loanTotal, installment) => loanTotal + Math.max(
          0,
          toAmount(installment.amount) - toAmount(installment.paidAmount),
        ),
        0,
      ),
      0,
    );
  const generalSavings = toAmount(savingsAccount?.generalSavingsBalance);
  const specialSavings = toAmount(savingsAccount?.specialSavingsBalance);
  const summaries = [
    { title: "Total Borrowed", value: totalBorrowed },
    { title: "Total Loan Paid", value: totalLoanPaid },
    { title: "Outstanding Loan", value: outstandingLoan },
    { title: "General Savings", value: generalSavings },
    { title: "Special Savings", value: specialSavings },
    { title: "Total Savings", value: generalSavings + specialSavings },
  ];

  return (
    <section className="mb-6">
      <Typography.Title level={4}>Financial Summary</Typography.Title>
      <Row gutter={[16, 16]}>
        {summaries.map((summary) => (
          <Col key={summary.title} xs={24} sm={12} lg={8} xl={4}>
            <StatCard
              title={summary.title}
              value={formatCurrency(summary.value)}
              loading={loading}
            />
          </Col>
        ))}
      </Row>
    </section>
  );
}
