import {
  PrinterOutlined,
  CalendarOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  DollarOutlined,
  WalletOutlined,
  LockOutlined,
  UnlockOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Col, DatePicker, Row, Select, Space, Spin, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { can, permissions } from "../../auth/permissions.js";
import { useGetAccountsQuery, useGetDailyCashSheetQuery } from "../accountsApi.js";
import { useGetActiveBusinessDayQuery } from "../../dayClosing/dayClosingApi.js";
import { DayClosingModal } from "../../dayClosing/components/DayClosingModal.jsx";
import { EmergencyReopenModal } from "../../dayClosing/components/EmergencyReopenModal.jsx";

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
  const user = useSelector((state) => state.auth.user);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState("DEFAULT");
  const [closingModalOpen, setClosingModalOpen] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);

  const { data: activeDayData } = useGetActiveBusinessDayQuery();
  const activeDay = activeDayData?.data;

  // Sync selectedDate with active business day initially or whenever active day changes
  useEffect(() => {
    if (activeDay?.businessDate && !selectedDate) {
      setSelectedDate(activeDay.businessDate);
    }
  }, [activeDay?.businessDate, selectedDate]);

  const effectiveDate = selectedDate || activeDay?.businessDate || dayjs().format("YYYY-MM-DD");

  const { data: accountsData } = useGetAccountsQuery();
  const accounts = Array.isArray(accountsData?.data)
    ? accountsData.data
    : Array.isArray(accountsData?.data?.accounts)
    ? accountsData.data.accounts
    : [];

  const { data: sheetData, isLoading } = useGetDailyCashSheetQuery(
    {
      date: effectiveDate,
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
      {/* Active Business Day Banner & Day Closing Action */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-300">
              Active Business Day
            </span>
            <Tag color="green" icon={<CheckCircleOutlined />}>
              OPEN
            </Tag>
          </div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>{activeDay?.businessDate || dayjs().format("YYYY-MM-DD")}</span>
            {activeDay?.businessDate && activeDay.businessDate < dayjs().format("YYYY-MM-DD") && (
              <Tag color="warning" icon={<WarningOutlined />} className="text-xs font-medium">
                Deferred Day Closing (Pending)
              </Tag>
            )}
          </div>
          <div className="text-xs text-slate-300">
            All system transactions and financial postings are recorded against this business day.
          </div>
        </div>

        <Space wrap>
          {(can(user, permissions.dayClosingReopen) || user?.role === "SUPER_ADMIN") && (
            <Button
              icon={<UnlockOutlined />}
              size="large"
              onClick={() => setReopenModalOpen(true)}
              className="bg-slate-800 text-amber-300 hover:text-amber-200 border-slate-700 font-semibold px-4 shadow-sm"
            >
              Reopen Last Day
            </Button>
          )}
          {can(user, permissions.dayClosingExecute) && (
            <Button
              type="primary"
              danger
              icon={<LockOutlined />}
              size="large"
              onClick={() => setClosingModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-500 border-none font-semibold px-6 shadow-md"
            >
              Execute Day Closing
            </Button>
          )}
        </Space>
      </div>

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row flex-wrap justify-between items-stretch sm:items-center gap-3 bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm print:hidden">
        <div className="grid grid-cols-1 sm:flex sm:flex-row sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <CalendarOutlined className="text-blue-600 text-lg flex-shrink-0" />
            <Text strong className="whitespace-nowrap text-xs sm:text-sm">Date:</Text>
            <DatePicker
              className="flex-1 sm:w-auto"
              value={dayjs(effectiveDate)}
              onChange={(date) => setSelectedDate(date ? date.format("YYYY-MM-DD") : activeDay?.businessDate || dayjs().format("YYYY-MM-DD"))}
              format="DD MMMM YYYY"
              allowClear={false}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <WalletOutlined className="text-purple-600 text-lg flex-shrink-0" />
            <Text strong className="whitespace-nowrap text-xs sm:text-sm">Account:</Text>
            <Select
              className="flex-1 sm:min-w-[200px]"
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

        <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint} className="w-full sm:w-auto">
          Print Daily Cash Sheet
        </Button>
      </div>

      {/* Printable Sheet */}
      <div className="print-area bg-white p-3 sm:p-6 rounded-xl border border-gray-100 shadow-sm">
        {/* NGO Header for Print */}
        <div className="text-center pb-6 border-b border-gray-200">
          <Title level={3} style={{ marginBottom: 4 }}>
            Purbasha Financial NGO
          </Title>
          <Text type="secondary" className="block text-sm">
            Daily Cash Reconciliation & Summary Sheet
          </Text>
          <div className="mt-2 inline-block px-4 py-1 bg-gray-50 border rounded-full text-xs font-semibold text-gray-700">
            Date: {dayjs(effectiveDate).format("DD MMMM YYYY, dddd")} • Account: {sheet?.account?.accountName || "Main Cash"}
          </div>
        </div>

        {/* 4 Summary Cards */}
        <Row gutter={[12, 12]} className="mt-6">
          <Col xs={12} sm={12} lg={6}>
            <Card className="bg-slate-50 border-slate-200 shadow-none text-center" styles={{ body: { padding: "12px 8px" } }}>
              <Text type="secondary" className="text-[10px] sm:text-xs uppercase font-medium truncate block">Opening Balance</Text>
              <div className="text-sm sm:text-xl font-bold text-slate-800 mt-1 truncate">
                ৳{openingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={12} lg={6}>
            <Card className="bg-emerald-50 border-emerald-200 shadow-none text-center" styles={{ body: { padding: "12px 8px" } }}>
              <div className="flex items-center justify-center gap-1 text-emerald-700 text-[10px] sm:text-xs uppercase font-medium truncate">
                <ArrowDownOutlined /> Total Cash In
              </div>
              <div className="text-sm sm:text-xl font-bold text-emerald-800 mt-1 truncate">
                +৳{totalCashIn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={12} lg={6}>
            <Card className="bg-rose-50 border-rose-200 shadow-none text-center" styles={{ body: { padding: "12px 8px" } }}>
              <div className="flex items-center justify-center gap-1 text-rose-700 text-[10px] sm:text-xs uppercase font-medium truncate">
                <ArrowUpOutlined /> Total Cash Out
              </div>
              <div className="text-sm sm:text-xl font-bold text-rose-800 mt-1 truncate">
                -৳{totalCashOut.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={12} lg={6}>
            <Card className="bg-blue-50 border-blue-200 shadow-none text-center" styles={{ body: { padding: "12px 8px" } }}>
              <div className="flex items-center justify-center gap-1 text-blue-700 text-[10px] sm:text-xs uppercase font-medium truncate">
                <DollarOutlined /> Closing Balance
              </div>
              <div className="text-sm sm:text-xl font-bold text-blue-800 mt-1 truncate">
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
                scroll={{ x: 380 }}
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
                scroll={{ x: 380 }}
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
              styles={{ body: { padding: 0 } }}
            >
              <Table
                dataSource={todayTransactions}
                columns={transactionColumns}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: 750 }}
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

      {/* Day Closing Modal */}
      <DayClosingModal
        open={closingModalOpen}
        onClose={() => {
          setClosingModalOpen(false);
          setSelectedDate(null);
        }}
      />

      {/* Emergency Day Reopen Modal */}
      <EmergencyReopenModal
        open={reopenModalOpen}
        onClose={() => setReopenModalOpen(false)}
      />
    </div>
  );
}
