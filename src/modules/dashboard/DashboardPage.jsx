import {
  BankOutlined,
  BookOutlined,
  DollarOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, Row, Statistic, Table, Typography } from "antd";
import { PageContainer } from "../../components/page-container/PageContainer.jsx";

const transactions = [
  {
    key: "1",
    member: "Rahima Begum",
    type: "Collection",
    amount: "৳2,188",
    date: "10 Sep 2026",
  },
  {
    key: "2",
    member: "Abdul Karim",
    type: "Savings Deposit",
    amount: "৳500",
    date: "09 Sep 2026",
  },
  {
    key: "3",
    member: "Nasrin Akter",
    type: "Savings Withdrawal",
    amount: "৳1,000",
    date: "08 Sep 2026",
  },
  {
    key: "4",
    member: "Jasim Uddin",
    type: "Collection",
    amount: "৳1,590",
    date: "05 Sep 2026",
  },
];

const columns = [
  { title: "Member", dataIndex: "member", key: "member" },
  { title: "Type", dataIndex: "type", key: "type" },
  { title: "Amount", dataIndex: "amount", key: "amount", align: "right" },
  { title: "Date", dataIndex: "date", key: "date" },
];

const stats = [
  { title: "Total Members", value: 6, note: "5 active", color: "#176b57" },
  { title: "Active Loans", value: 4, note: "2 overdue", color: "#176b57" },
  {
    title: "Total Loan Amount",
    value: "1,07,470",
    prefix: "৳",
    note: "Across 5 loans",
    color: "#176b57",
  },
  {
    title: "Total Collected",
    value: "54,688",
    prefix: "৳",
    note: "To date",
    color: "#176b57",
  },
  {
    title: "Total Outstanding",
    value: "52,782",
    prefix: "৳",
    note: "Yet to be collected",
    color: "#c94c4c",
  },
  {
    title: "Total Savings",
    value: "19,100",
    prefix: "৳",
    note: "6 savings accounts",
    color: "#176b57",
  },
  {
    title: "Today's Collection",
    value: "1,590",
    prefix: "৳",
    note: "19 Sep 2026",
    color: "#c58a1b",
  },
  {
    title: "Due Today",
    value: 1,
    note: "3 total on due list",
    color: "#176b57",
  },
];

export function DashboardPage() {
  return (
    <PageContainer>
      <div className="dashboard-heading">
        <Typography.Title level={2}>Dashboard</Typography.Title>
        <Typography.Text>
          Overview of members, loans and today's activity
        </Typography.Text>
      </div>

      <Row className="dashboard-stats" gutter={[12, 12]}>
        {stats.map((stat) => (
          <Col key={stat.title} xs={24} sm={12} xl={6}>
            <Card
              className="dashboard-stat-card"
              style={{ borderLeftColor: stat.color }}
            >
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.prefix}
              />
              <Typography.Text type="secondary">{stat.note}</Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Typography.Title level={5} className="dashboard-section-title">
        Quick actions
      </Typography.Title>
      <div className="quick-actions flex flex-row gap-2 ">
        <Button type="primary" icon={<UserAddOutlined />}>
          Add Member
        </Button>
        <Button icon={<BankOutlined />}>Create Loan</Button>
        <Button icon={<DollarOutlined />}>Collect Installment</Button>
        <Button icon={<BookOutlined />}>Add Savings</Button>
      </div>

      <Typography.Title level={5} className="dashboard-section-title">
        Recent transactions
      </Typography.Title>
      <Card className="transactions-card" bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={transactions}
          pagination={false}
          scroll={{ x: 580 }}
        />
      </Card>
    </PageContainer>
  );
}
