import { ClockCircleOutlined } from "@ant-design/icons";
import { Button, Table, Typography } from "antd";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "../../components/page-container/PageContainer.jsx";

const dueRows = [
  {
    key: "M-0104",
    initials: "AK",
    member: "Abdul Karim",
    phone: "01812-556677",
    loan: "L-3034",
    missed: 2,
    amount: "৳3,180",
    days: 47,
    lastPayment: "12 Aug 2026",
    type: "Overdue",
  },
  {
    key: "M-0135",
    initials: "SK",
    member: "Salma Khatun",
    phone: "01511-667788",
    loan: "L-3061",
    missed: 1,
    amount: "৳2,110",
    days: 12,
    lastPayment: "—",
    type: "Overdue",
  },
  {
    key: "M-0122",
    initials: "JU",
    member: "Jasim Uddin",
    phone: "01611-334455",
    loan: "L-3052",
    missed: 0,
    amount: "৳1,590",
    days: "Today",
    lastPayment: "05 Sep 2026",
    type: "Due Today",
  },
];

export function DueOverduePage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const filteredRows = useMemo(
    () =>
      filter === "All" ? dueRows : dueRows.filter((row) => row.type === filter),
    [filter],
  );

  const columns = [
    {
      title: "Member",
      dataIndex: "member",
      key: "member",
      render: (value, row) => (
        <div className="loan-member-cell">
          <span className="member-avatar">{row.initials}</span>
          <span>
            <b>{value}</b>
            <small>{row.key}</small>
          </span>
        </div>
      ),
    },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Loan", dataIndex: "loan", key: "loan" },
    { title: "Missed", dataIndex: "missed", key: "missed", align: "center" },
    { title: "Due amount", dataIndex: "amount", key: "amount", align: "right" },
    { title: "Days overdue", dataIndex: "days", key: "days", align: "right" },
    { title: "Last payment", dataIndex: "lastPayment", key: "lastPayment" },
    {
      title: "",
      key: "action",
      render: (_, row) => (
        <Button
          type="primary"
          size="small"
          onClick={() =>
            navigate(`/collections?member=${row.key}&loan=${row.loan}`)
          }
        >
          Collect
        </Button>
      ),
    },
  ];

  return (
    <PageContainer>
      <div className="loans-page-heading">
        <div>
          <Typography.Title level={2}>Due &amp; Overdue</Typography.Title>
          <Typography.Text>
            Members with an installment due today or overdue
          </Typography.Text>
        </div>
      </div>
      <div className="loan-filter-tabs due-filter-tabs">
        {["All", "Due Today", "Overdue"].map((value) => (
          <Button
            key={value}
            type={filter === value ? "primary" : "default"}
            icon={value === "Overdue" ? <ClockCircleOutlined /> : undefined}
            onClick={() => setFilter(value)}
          >
            {value}
          </Button>
        ))}
      </div>
      <div className="loans-table-card due-table-card">
        <Table
          columns={columns}
          dataSource={filteredRows}
          pagination={false}
          scroll={{ x: 1000 }}
        />
      </div>
    </PageContainer>
  );
}
