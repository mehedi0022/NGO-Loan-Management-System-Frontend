import {
  ArrowDownOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import { Card, Col, DatePicker, Row, Select, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useGetAccountsQuery, useGetTransactionsQuery } from "../accountsApi.js";

const { Text } = Typography;
const { RangePicker } = DatePicker;

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

const moduleLabels = {
  CAPITAL_INJECTION: "Capital Injection",
  MEMBER_ADMISSION: "Member Admission",
  LOAN_DISBURSEMENT: "Loan Disbursement",
  LOAN_COLLECTION: "Loan Collection",
  SAVINGS_DEPOSIT: "Savings Deposit",
  SAVINGS_WITHDRAWAL: "Savings Withdrawal",
  DPS_DEPOSIT: "DPS Deposit",
  DPS_WITHDRAWAL: "DPS Withdrawal",
  OFFICE_EXPENSE: "Office Expense",
  OTHER_INCOME: "Other Income",
  FUND_TRANSFER: "Fund Transfer",
};

export function LedgerTransactionsTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [accountId, setAccountId] = useState("ALL");
  const [sourceModule, setSourceModule] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [dateRange, setDateRange] = useState([]);

  const { data: accountsData } = useGetAccountsQuery();
  const accounts = Array.isArray(accountsData?.data)
    ? accountsData.data
    : Array.isArray(accountsData?.data?.accounts)
    ? accountsData.data.accounts
    : [];

  const { data: txData, isLoading } = useGetTransactionsQuery({
    page,
    limit: pageSize,
    accountId,
    sourceModule,
    type,
    fromDate: dateRange[0],
    toDate: dateRange[1],
  });

  const transactions = txData?.data || [];
  const meta = txData?.meta || { total: 0 };

  const columns = [
    {
      title: "Date & Time",
      dataIndex: "transactionDate",
      key: "transactionDate",
      width: 160,
      render: (date) => (
        <div>
          <div className="font-semibold text-xs text-slate-800">
            {dayjs(date).format("DD MMM YYYY")}
          </div>
          <div className="text-gray-400 text-xs">
            {dayjs(date).format("hh:mm A")}
          </div>
        </div>
      ),
    },
    {
      title: "Tx ID / Ref",
      dataIndex: "transactionId",
      key: "transactionId",
      width: 140,
      render: (txId, record) => (
        <div>
          <span className="font-mono text-xs font-semibold text-blue-700">{txId}</span>
          {record.referenceId && (
            <div className="text-gray-400 text-xs">Ref: #{record.referenceId}</div>
          )}
        </div>
      ),
    },
    {
      title: "Account",
      dataIndex: "account",
      key: "account",
      width: 180,
      render: (account) => (
        <div>
          <div className="font-medium text-slate-900">{account?.accountName}</div>
          <div className="text-xs text-gray-400 capitalize">{account?.accountType?.toLowerCase()}</div>
        </div>
      ),
    },
    {
      title: "Category / Module",
      dataIndex: "sourceModule",
      key: "sourceModule",
      width: 160,
      render: (module) => (
        <Tag color={moduleColorMap[module] || "blue"}>
          {moduleLabels[module] || module}
        </Tag>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 110,
      align: "center",
      render: (t) =>
        t === "DEBIT" ? (
          <Tag color="success" icon={<ArrowDownOutlined />}>
            Cash In
          </Tag>
        ) : (
          <Tag color="error" icon={<ArrowUpOutlined />}>
            Cash Out
          </Tag>
        ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 140,
      align: "right",
      render: (amt, record) => (
        <span
          className={`font-bold ${
            record.type === "DEBIT" ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          {record.type === "DEBIT" ? "+" : "-"}৳
          {Number(amt).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: "Balance After",
      dataIndex: "balanceAfter",
      key: "balanceAfter",
      width: 140,
      align: "right",
      render: (bal) => (
        <span className="font-semibold text-slate-700">
          ৳{Number(bal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (desc) => <Text type="secondary" className="text-xs">{desc || "—"}</Text>,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Row */}
      <Card className="border-gray-200 shadow-sm" bodyStyle={{ padding: "16px" }}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <div className="text-xs text-gray-500 mb-1">Account:</div>
            <Select
              className="w-full"
              value={accountId}
              onChange={setAccountId}
              options={[
                { value: "ALL", label: "All Accounts" },
                ...accounts.map((a) => ({ value: a.id, label: a.accountName })),
              ]}
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div className="text-xs text-gray-500 mb-1">Module / Source:</div>
            <Select
              className="w-full"
              value={sourceModule}
              onChange={setSourceModule}
              options={[
                { value: "ALL", label: "All Modules" },
                ...Object.entries(moduleLabels).map(([k, v]) => ({ value: k, label: v })),
              ]}
            />
          </Col>

          <Col xs={24} sm={12} md={4}>
            <div className="text-xs text-gray-500 mb-1">Type:</div>
            <Select
              className="w-full"
              value={type}
              onChange={setType}
              options={[
                { value: "ALL", label: "All Types" },
                { value: "DEBIT", label: "Cash In" },
                { value: "CREDIT", label: "Cash Out" },
              ]}
            />
          </Col>

          <Col xs={24} sm={12} md={8}>
            <div className="text-xs text-gray-500 mb-1">Date Range:</div>
            <RangePicker
              className="w-full"
              format="DD MMM YYYY"
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0].format("YYYY-MM-DD"), dates[1].format("YYYY-MM-DD")]);
                } else {
                  setDateRange([]);
                }
              }}
            />
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card className="border-gray-200 shadow-sm" bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={transactions}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize,
            total: meta.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          scroll={{ x: 1000 }}
          size="middle"
        />
      </Card>
    </div>
  );
}
