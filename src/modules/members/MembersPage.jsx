import {
  EyeOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Input, Select, Table, Tag, Typography } from "antd";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "../../components/page-container/PageContainer.jsx";

const members = [
  {
    key: "M-0091",
    initials: "RB",
    name: "Rahima Begum",
    phone: "01711-223344",
    loan: "L-3021",
    due: "৳13,122",
    savings: "৳4,200",
    status: "Active",
    hasDue: true,
  },
  {
    key: "M-0104",
    initials: "AK",
    name: "Abdul Karim",
    phone: "01812-556677",
    loan: "L-3034",
    due: "৳12,720",
    savings: "৳1,800",
    status: "Active",
    hasDue: true,
  },
  {
    key: "M-0117",
    initials: "NA",
    name: "Nasrin Akter",
    phone: "01911-889900",
    loan: "—",
    due: "—",
    savings: "৳6,600",
    status: "Active",
    hasDue: false,
  },
  {
    key: "M-0122",
    initials: "JU",
    name: "Jasim Uddin",
    phone: "01611-334455",
    loan: "L-3052",
    due: "৳7,950",
    savings: "৳900",
    status: "Active",
    hasDue: true,
  },
  {
    key: "M-0135",
    initials: "SK",
    name: "Salma Khatun",
    phone: "01511-667788",
    loan: "L-3061",
    due: "৳18,990",
    savings: "৳3,100",
    status: "Active",
    hasDue: true,
  },
  {
    key: "M-0140",
    initials: "MR",
    name: "Moklesur Rahman",
    phone: "01711-990011",
    loan: "—",
    due: "—",
    savings: "৳2,500",
    status: "Inactive",
    hasDue: false,
  },
];

export function MembersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loanDue, setLoanDue] = useState("all");

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return members.filter((member) => {
      const matchesSearch =
        !query ||
        [member.name, member.key, member.phone].some((value) =>
          value.toLowerCase().includes(query),
        );
      const matchesStatus =
        status === "all" || member.status.toLowerCase() === status;
      const matchesDue =
        loanDue === "all" ||
        (loanDue === "due" ? member.hasDue : !member.hasDue);
      return matchesSearch && matchesStatus && matchesDue;
    });
  }, [loanDue, search, status]);

  const columns = [
    {
      title: "Member",
      key: "member",
      render: (_, member) => (
        <div className="member-table-identity">
          <span className="member-avatar">{member.initials}</span>
          <span>
            <strong>{member.name}</strong>
            <small>{member.key}</small>
          </span>
        </div>
      ),
    },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Active loan", dataIndex: "loan", key: "loan" },
    { title: "Loan due", dataIndex: "due", key: "due", align: "right" },
    { title: "Savings", dataIndex: "savings", key: "savings", align: "right" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) => (
        <Tag className={`member-status-tag ${value.toLowerCase()}`}>
          {value}
        </Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 52,
      render: (_, member) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                label: "View member",
                icon: <EyeOutlined />,
                onClick: () => navigate(`/members/${member.key}`),
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            aria-label="Member actions"
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <PageContainer>
      <div className="members-page-heading">
        <div>
          <Typography.Title level={2}>Members</Typography.Title>
          <Typography.Text>6 members registered</Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/members/new")}
        >
          Add Member
        </Button>
      </div>

      <div className="members-toolbar">
        <Input
          allowClear
          value={search}
          prefix={<SearchOutlined />}
          placeholder="Search by name, ID or phone"
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
        <Select
          value={loanDue}
          onChange={setLoanDue}
          options={[
            { value: "all", label: "Has loan due" },
            { value: "due", label: "Has loan due" },
            { value: "none", label: "No loan due" },
          ]}
        />
      </div>

      <div className="members-table-card">
        <Table
          columns={columns}
          dataSource={filteredMembers}
          pagination={false}
          scroll={{ x: 900 }}
        />
      </div>
    </PageContainer>
  );
}
