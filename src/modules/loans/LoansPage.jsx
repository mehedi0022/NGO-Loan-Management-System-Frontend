import { PlusOutlined } from "@ant-design/icons";
import { Button, Table, Tag, Typography } from "antd";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "../../components/page-container/PageContainer.jsx";

const loans = [
  {
    key: "L-3021",
    memberId: "M-0091",
    initials: "RB",
    member: "Rahima Begum",
    amount: "৳25,000",
    total: "৳26,250",
    paid: "৳13,128",
    outstanding: "৳13,122",
    progress: "6/12",
    status: "Active",
  },
  {
    key: "L-3034",
    memberId: "M-0104",
    initials: "AK",
    member: "Abdul Karim",
    amount: "৳15,000",
    total: "৳15,900",
    paid: "৳3,180",
    outstanding: "৳12,720",
    progress: "2/10",
    status: "Overdue",
  },
  {
    key: "L-3040",
    memberId: "M-0117",
    initials: "NA",
    member: "Nasrin Akter",
    amount: "৳30,000",
    total: "৳31,500",
    paid: "৳31,500",
    outstanding: "৳0",
    progress: "12/12",
    status: "Completed",
  },
  {
    key: "L-3052",
    memberId: "M-0122",
    initials: "JU",
    member: "Jasim Uddin",
    amount: "৳12,000",
    total: "৳12,720",
    paid: "৳4,770",
    outstanding: "৳7,950",
    progress: "3/8",
    status: "Active",
  },
  {
    key: "L-3061",
    memberId: "M-0135",
    initials: "SK",
    member: "Salma Khatun",
    amount: "৳20,000",
    total: "৳21,100",
    paid: "৳2,110",
    outstanding: "৳18,990",
    progress: "1/10",
    status: "Overdue",
  },
];

const filters = ["All", "Active", "Overdue", "Completed", "Cancelled"];

export function LoansPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const filteredLoans = useMemo(
    () =>
      activeFilter === "All"
        ? loans
        : loans.filter((loan) => loan.status === activeFilter),
    [activeFilter],
  );

  const columns = [
    { title: "Loan ID", dataIndex: "key", key: "key" },
    {
      title: "Member",
      dataIndex: "member",
      key: "member",
      render: (value, loan) => (
        <div className="loan-member-cell">
          <span className="member-avatar">{loan.initials}</span>
          <span>
            <b>{value}</b>
            <small>{loan.memberId}</small>
          </span>
        </div>
      ),
    },
    { title: "Amount", dataIndex: "amount", key: "amount", align: "right" },
    {
      title: "Total payable",
      dataIndex: "total",
      key: "total",
      align: "right",
    },
    { title: "Paid", dataIndex: "paid", key: "paid", align: "right" },
    {
      title: "Outstanding",
      dataIndex: "outstanding",
      key: "outstanding",
      align: "right",
    },
    { title: "Progress", dataIndex: "progress", key: "progress" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) => (
        <Tag className={`loan-status-tag ${value.toLowerCase()}`}>{value}</Tag>
      ),
    },
  ];

  return (
    <PageContainer>
      <div className="loans-page-heading">
        <div>
          <Typography.Title level={2}>All Loans</Typography.Title>
          <Typography.Text>{loans.length} loans on record</Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/loans/new")}
        >
          Create Loan
        </Button>
      </div>
      <div className="loan-filter-tabs">
        {filters.map((filter) => (
          <Button
            key={filter}
            type={activeFilter === filter ? "primary" : "default"}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </Button>
        ))}
      </div>
      <div className="loans-table-card">
        <Table
          columns={columns}
          dataSource={filteredLoans}
          pagination={false}
          scroll={{ x: 1000 }}
        />
      </div>
    </PageContainer>
  );
}
