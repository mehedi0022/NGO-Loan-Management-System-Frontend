import {
  PrinterOutlined,
  CalendarOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  DollarOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, DatePicker, Row, Select, Spin, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useGetAccountsQuery, useGetDailyCashSheetQuery } from "../accountsApi.js";

const { Title, Text } = Typography;

const moduleColorMap = {
  CAPITAL_INJECTION: "purple",
  MEMBER_ADMISSION: "cyan",
  LOAN_DISBURSEMENT: "volcano",
  LOAN_COLLECTION: "green",
  SAVINGS_DEPOSIT: "blue",
  SAVINGS_WITHDRAWAL: "orange",
  DPS_DEPOSIT: "geekblue",
  DPS_WITHDRAWAL: "gold",
  OFFICE_EXPENSE: "magenta",
  OTHER_INCOME: "lime",
  FUND_TRANSFER: "default",
};

export function DailyCashSheetView() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [selectedAccountId, setSelectedAccountId] = useState("DEFAULT");

  const { data: accountsData } = useGetAccountsQuery();
  const accounts = Array.isArray(accountsData?.data)
    ? accountsData.data
    : Array.isArray(accountsData?.data?.accounts)
    ? accountsData.data.accounts
    : [];

  const { data: sheetData, isLoading } = useGetDailyCashSheetQuery(
    {
      date: selectedDate,
      ...(selectedAccountId !== "DEFAULT" && { accountId: selectedAccountId }),
    },
    { refetchOnMountOrArgChange: true }
  );

  const sheet = sheetData?.data;

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    {
      title: "Particulars / Head",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          {record.subtitle && <div className="text-xs text-gray-400">{record.subtitle}</div>}
        </div>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 180,
      align: "right",
      render: (amount, record) => (
        <Text strong className={`text-base ${record.isTotal ? "text-blue-700" : ""}`}>
          ৳{Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
  ];

  const transactionColumns = [
    {
      title: "Time",
      dataIndex: "transactionDate",
      key: "transactionDate",
      width: 100,
      render: (date) => (
        <span className="text-xs text-gray-500">{dayjs(date).format("hh:mm A")}</span>
      ),
    },
    {
      title: "Tx ID",
      dataIndex: "transactionId",
      key: "transactionId",
      width: 130,
      render: (txId) => (
        <span className="font-mono text-xs font-semibold text-blue-700">{txId}</span>
      ),
    },
    {
      title: "Category",
      dataIndex: "sourceModule",
      key: "sourceModule",
      width: 160,
      render: (mod) => <Tag color={moduleColorMap[mod] || "default"}>{mod?.replace(/_/g, " ")}</Tag>,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 100,
      align: "center",
      render: (t) =>
        t === "DEBIT" ? (
          <Tag color="success">Cash In</Tag>
        ) : (
          <Tag color="error">Cash Out</Tag>
        ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 130,
      align: "right",
      render: (amt, record) => (
        <span className={`font-bold ${record.type === "DEBIT" ? "text-emerald-700" : "text-rose-700"}`}>
          {record.type === "DEBIT" ? "+" : "-"}৳{Number(amt).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (d) => <span className="text-xs text-gray-600">{d || "—"}</span>,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spin size="large" tip="Loading daily cash sheet..." />
      </div>
    );
  }

  const openingBalance = Number(sheet?.openingBalance || 0);
  const cashIn = sheet?.cashIn || {};
  const cashOut = sheet?.cashOut || {};
  const totalCashIn = Number(cashIn.total || 0);
  const totalCashOut = Number(cashOut.total || 0);
  const closingBalance = Number(sheet?.closingBalance || 0);
  const todayTransactions = sheet?.transactions || [];

  const cashInRows = [
    { key: "adm", name: "Member Admission Fees", amount: cashIn.admissionFee, subtitle: "Direct revenue from new admissions" },
    { key: "col", name: "Loan Collections (Principal & Service Charge)", amount: cashIn.loanCollection, subtitle: "Installment recoveries" },
    { key: "sav", name: "Savings Deposits", amount: (cashIn.generalSavingsDeposit || 0) + (cashIn.specialSavingsDeposit || 0), subtitle: "Member savings collections" },
    { key: "dps", name: "DPS Installment Deposits", amount: cashIn.dpsDeposit, subtitle: "DPS account deposits" },
    { key: "cap", name: "Capital Injections", amount: cashIn.capitalReceived, subtitle: "Head office / owner funds" },
    { key: "oth", name: "Other Operational Income", amount: cashIn.otherIncome, subtitle: "Income vouchers & miscellaneous receipts" },
    { key: "trf", name: "Transfers In", amount: cashIn.transfersIn, subtitle: "Funds received from bank / other accounts" },
  ];

  const cashOutRows = [
    { key: "dis", name: "Loan Disbursements", amount: cashOut.loanDisbursement, subtitle: "Principal disbursed to borrowers" },
    { key: "swd", name: "Savings Withdrawals", amount: cashOut.savingsWithdrawal, subtitle: "Savings paid out to members" },
    { key: "dwd", name: "DPS Withdrawals / Closures", amount: cashOut.dpsWithdrawal, subtitle: "Matured or closed DPS payouts" },
    { key: "exp", name: "Office & Operating Expenses", amount: cashOut.officeExpense, subtitle: "Rent, bills, stationery, salaries" },
    { key: "tro", name: "Transfers Out", amount: cashOut.transfersOut, subtitle: "Funds deposited to bank / other accounts" },
  ];

  return (
    <div className="daily-cash-sheet-wrapper space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarOutlined className="text-blue-600 text-lg" />
            <Text strong>Date:</Text>
            <DatePicker
              value={dayjs(selectedDate)}
              onChange={(date) => setSelectedDate(date ? date.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"))}
              format="DD MMMM YYYY"
              allowClear={false}
            />
          </div>

          <div className="flex items-center gap-2">
            <WalletOutlined className="text-purple-600 text-lg" />
            <Text strong>Account:</Text>
            <Select
              style={{ minWidth: 200 }}
              value={selectedAccountId}
              onChange={setSelectedAccountId}
              options={[
                { value: "DEFAULT", label: "Default Main Cash" },
                ...accounts.map((acc) => ({
                  value: acc.id,
                  label: `${acc.accountName} (${acc.accountType})`,
                })),
              ]}
            />
          </div>
        </div>

        <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
          Print Daily Cash Sheet
        </Button>
      </div>

      {/* Printable Sheet */}
      <div className="print-area bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        {/* NGO Header for Print */}
        <div className="text-center pb-6 border-b border-gray-200">
          <Title level={3} style={{ marginBottom: 4 }}>
            Purbasha Financial NGO
          </Title>
          <Text type="secondary" className="block text-sm">
            Daily Cash Reconciliation & Summary Sheet
          </Text>
          <div className="mt-2 inline-block px-4 py-1 bg-gray-50 border rounded-full text-xs font-semibold text-gray-700">
            Date: {dayjs(selectedDate).format("DD MMMM YYYY, dddd")} • Account: {sheet?.account?.accountName || "Main Cash"}
          </div>
        </div>

        {/* 4 Summary Cards */}
        <Row gutter={[16, 16]} className="mt-6">
          <Col xs={24} sm={12} lg={6}>
            <Card className="bg-slate-50 border-slate-200 shadow-none text-center">
              <Text type="secondary" className="text-xs uppercase font-medium">Opening Balance</Text>
              <div className="text-xl font-bold text-slate-800 mt-1">
                ৳{openingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="bg-emerald-50 border-emerald-200 shadow-none text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-700 text-xs uppercase font-medium">
                <ArrowDownOutlined /> Total Cash In
              </div>
              <div className="text-xl font-bold text-emerald-800 mt-1">
                +৳{totalCashIn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="bg-rose-50 border-rose-200 shadow-none text-center">
              <div className="flex items-center justify-center gap-1 text-rose-700 text-xs uppercase font-medium">
                <ArrowUpOutlined /> Total Cash Out
              </div>
              <div className="text-xl font-bold text-rose-800 mt-1">
                -৳{totalCashOut.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="bg-blue-50 border-blue-200 shadow-none text-center">
              <div className="flex items-center justify-center gap-1 text-blue-700 text-xs uppercase font-medium">
                <DollarOutlined /> Closing Balance
              </div>
              <div className="text-xl font-bold text-blue-800 mt-1">
                ৳{closingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </Card>
          </Col>
        </Row>

        {/* Cash In vs Cash Out Tables */}
        <Row gutter={[24, 24]} className="mt-6">
          <Col xs={24} lg={12}>
            <Card
              title={<span className="text-emerald-700 font-semibold">Cash Receipts / Inflow</span>}
              className="border-emerald-100 h-full"
              extra={<Tag color="green">Total: ৳{totalCashIn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Tag>}
            >
              <Table
                dataSource={cashInRows}
                columns={columns}
                rowKey="key"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={<span className="text-rose-700 font-semibold">Cash Payments / Outflow</span>}
              className="border-rose-100 h-full"
              extra={<Tag color="red">Total: ৳{totalCashOut.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Tag>}
            >
              <Table
                dataSource={cashOutRows}
                columns={columns}
                rowKey="key"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        </Row>

        {/* Today's Transactions Log */}
        {todayTransactions.length > 0 && (
          <div className="mt-8">
            <Card
              title={<span className="text-slate-800 font-semibold">Today's Detailed Activity Log ({todayTransactions.length} entries)</span>}
              className="border-gray-200"
              bodyStyle={{ padding: 0 }}
            >
              <Table
                dataSource={todayTransactions}
                columns={transactionColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          </div>
        )}

        {/* Footer Signature for Print */}
        <div className="hidden print:flex justify-between items-end pt-20 mt-12 border-t border-gray-300">
          <div className="text-center w-48 border-t border-gray-400 pt-2">
            <Text className="text-xs font-semibold">Cashier / Field Officer</Text>
          </div>
          <div className="text-center w-48 border-t border-gray-400 pt-2">
            <Text className="text-xs font-semibold">Accountant</Text>
          </div>
          <div className="text-center w-48 border-t border-gray-400 pt-2">
            <Text className="text-xs font-semibold">Branch Manager</Text>
          </div>
        </div>
      </div>
    </div>
  );
}
