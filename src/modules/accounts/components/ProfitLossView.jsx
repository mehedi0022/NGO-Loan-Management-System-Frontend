import {
  PrinterOutlined,
  CalendarOutlined,
  RiseOutlined,
  FallOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, DatePicker, Empty, Row, Spin, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useGetProfitLossQuery } from "../accountsApi.js";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export function ProfitLossView() {
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month").format("YYYY-MM-DD"),
    dayjs().endOf("month").format("YYYY-MM-DD"),
  ]);

  const { data: plData, isLoading } = useGetProfitLossQuery(
    {
      fromDate: dateRange[0],
      toDate: dateRange[1],
    },
    { refetchOnMountOrArgChange: true }
  );

  const report = plData?.data;

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spin size="large" tip="Calculating Profit & Loss statement..." />
      </div>
    );
  }

  const revenue = report?.revenue || {};
  const expenses = report?.expenses || {};

  const totalRevenue = Number(revenue.totalRevenue || 0);
  const totalExpense = Number(expenses.totalExpenses || 0);
  const netSurplus = Number(report?.netSurplus || 0);
  const isProfitable = netSurplus >= 0;

  const revenueItems = [
    {
      key: "loan-interest",
      name: "Loan Service Charge / Profit Earned",
      amount: revenue.loanServiceCharge || 0,
      description: "Service charge collected during this period",
    },
    {
      key: "admission-fees",
      name: "Member Admission Fees",
      amount: revenue.admissionFee || 0,
      description: "Non-refundable new member admission charges",
    },
    ...Object.entries(revenue.otherIncomes || {}).map(([catName, amt], idx) => ({
      key: `oth-${idx}`,
      name: catName,
      amount: amt,
      description: "Miscellaneous institutional receipts",
    })),
  ];

  const expenseItems = Object.entries(expenses.byCategory || {}).map(([catName, amt], idx) => ({
    key: `exp-${idx}`,
    name: catName,
    amount: amt,
  }));

  const revenueColumns = [
    {
      title: "Revenue Head",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div>
          <div className="font-semibold text-slate-800">{text}</div>
          <Text type="secondary" className="text-xs">{record.description}</Text>
        </div>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      width: 180,
      render: (amt) => (
        <span className="font-bold text-emerald-700 text-base">
          ৳{Number(amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  const expenseColumns = [
    {
      title: "Expense Category",
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="font-medium text-slate-800">{text}</span>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      width: 180,
      render: (amt) => (
        <span className="font-bold text-rose-700 text-base">
          ৳{Number(amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  return (
    <div className="profit-loss-wrapper space-y-6">
      {/* Date controls */}
      <div className="flex flex-col sm:flex-row flex-wrap justify-between items-stretch sm:items-center gap-3 bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm print:hidden">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <CalendarOutlined className="text-blue-600 text-lg flex-shrink-0" />
            <Text strong className="whitespace-nowrap">Period:</Text>
          </div>
          <RangePicker
            className="w-full sm:w-auto"
            value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0].format("YYYY-MM-DD"), dates[1].format("YYYY-MM-DD")]);
              }
            }}
            format="DD MMM YYYY"
            allowClear={false}
          />
        </div>
        <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint} className="w-full sm:w-auto">
          Print P&L Statement
        </Button>
      </div>

      {/* Main Statement */}
      <div className="print-area bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
        <div className="text-center pb-4 border-b border-gray-200">
          <Title level={3} style={{ marginBottom: 4 }}>
            Purbasha Financial NGO
          </Title>
          <Text type="secondary" className="block text-sm">
            Statement of Profit & Loss / Financial Performance
          </Text>
          <div className="mt-2 inline-block px-4 py-1 bg-gray-50 border rounded-full text-xs font-semibold text-gray-700">
            {dayjs(dateRange[0]).format("DD MMMM YYYY")} — {dayjs(dateRange[1]).format("DD MMMM YYYY")}
          </div>
        </div>

        {/* 3 Metric Cards */}
        <Row gutter={[12, 12]}>
          <Col xs={12} md={8}>
            <Card className="bg-emerald-50 border-emerald-200 text-center" styles={{ body: { padding: "14px 10px" } }}>
              <div className="flex items-center justify-center gap-1.5 text-emerald-800 text-[10px] sm:text-xs font-semibold uppercase truncate">
                <RiseOutlined /> Total Revenue
              </div>
              <div className="text-base sm:text-2xl font-black text-emerald-800 mt-1 sm:mt-2 truncate">
                ৳{totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </Card>
          </Col>
          <Col xs={12} md={8}>
            <Card className="bg-rose-50 border-rose-200 text-center" styles={{ body: { padding: "14px 10px" } }}>
              <div className="flex items-center justify-center gap-1.5 text-rose-800 text-[10px] sm:text-xs font-semibold uppercase truncate">
                <FallOutlined /> Total Expense
              </div>
              <div className="text-base sm:text-2xl font-black text-rose-800 mt-1 sm:mt-2 truncate">
                ৳{totalExpense.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className={isProfitable ? "bg-blue-50 border-blue-300 text-center" : "bg-red-50 border-red-300 text-center"} styles={{ body: { padding: "14px 10px" } }}>
              <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-semibold uppercase truncate">
                <TrophyOutlined className={isProfitable ? "text-blue-700" : "text-red-700"} />
                <span className={isProfitable ? "text-blue-800" : "text-red-800"}>
                  {isProfitable ? "Net Surplus / Profit" : "Net Deficit / Loss"}
                </span>
              </div>
              <div className={`text-base sm:text-2xl font-black mt-1 sm:mt-2 truncate ${isProfitable ? "text-blue-800" : "text-red-800"}`}>
                ৳{netSurplus.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </Card>
          </Col>
        </Row>

        {/* Tables */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card
              title={<span className="text-emerald-800 font-bold">1. Operating Revenue</span>}
              className="border-emerald-100 h-full"
              extra={<Tag color="green">Total: ৳{totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Tag>}
            >
              <Table
                dataSource={revenueItems}
                columns={revenueColumns}
                pagination={false}
                size="middle"
                scroll={{ x: 380 }}
              />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={<span className="text-rose-800 font-bold">2. Operating Expenses</span>}
              className="border-rose-100 h-full"
              extra={<Tag color="red">Total: ৳{totalExpense.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Tag>}
            >
              <Table
                dataSource={expenseItems}
                columns={expenseColumns}
                pagination={false}
                size="middle"
                scroll={{ x: 380 }}
                locale={{ emptyText: <Empty description="No office expenses in this period" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
              />
            </Card>
          </Col>
        </Row>

        {/* Footer Signature for Print */}
        <div className="hidden print:flex justify-between items-end pt-20 mt-12 border-t border-gray-300">
          <div className="text-center w-48 border-t border-gray-400 pt-2">
            <Text className="text-xs font-semibold">Senior Accountant</Text>
          </div>
          <div className="text-center w-48 border-t border-gray-400 pt-2">
            <Text className="text-xs font-semibold">Internal Auditor</Text>
          </div>
          <div className="text-center w-48 border-t border-gray-400 pt-2">
            <Text className="text-xs font-semibold">Executive Director / CEO</Text>
          </div>
        </div>
      </div>
    </div>
  );
}
