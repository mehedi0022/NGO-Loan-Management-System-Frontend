import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  EditOutlined,
  PhoneOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Col,
  Modal,
  Row,
  Space,
  Table,
  Tag,
  Tabs,
  Typography,
  Upload,
} from "antd";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageContainer } from "../../../components/page-container/PageContainer.jsx";

const profile = {
  name: "Rahima Begum",
  id: "M-0091",
  initials: "RB",
  phone: "01711-223344",
  fatherName: "Abdul Majid",
  motherName: "Ayesha Begum",
  guardianName: "Abdul Majid",
  nidNumber: "1987654321",
  status: "Active",
  loan: "L-3021",
  loanDue: "৳13,122",
  savings: "৳4,200",
  address: "Rahim Para, Palli Bikash Union, Sadar, Dhaka",
  joined: "12 Mar 2023",
};

const installmentRows = Array.from({ length: 12 }, (_, index) => {
  const month = [
    "10 Feb 2026",
    "10 Mar 2026",
    "10 Apr 2026",
    "10 May 2026",
    "10 Jun 2026",
    "10 Jul 2026",
    "10 Aug 2026",
    "10 Sep 2026",
    "10 Oct 2026",
    "10 Nov 2026",
    "10 Dec 2026",
    "10 Jan 2027",
  ][index];
  const paid = index < 6 ? "৳2,188" : "৳0";
  return {
    key: index + 1,
    number: index + 1,
    dueDate: month,
    amount: "৳2,188",
    paid,
    remaining: index < 6 ? "৳0" : "৳2,188",
    status: index < 6 ? "Paid" : index === 6 ? "Due" : "Upcoming",
  };
});

const loanRows = [
  {
    key: "L-3021",
    loanId: "L-3021",
    amount: "৳26,250",
    outstanding: "৳13,122",
    progress: "6/12",
    status: "Active",
  },
];
const transactionRows = [
  {
    key: "1",
    type: "Collection",
    amount: "৳2,188",
    date: "10 Sep 2026",
    reference: "Installment #6 · L-3021",
  },
  {
    key: "2",
    type: "Savings Deposit",
    amount: "৳300",
    date: "03 Sep 2026",
    reference: "Savings account",
  },
];

const statusTag = (value) => (
  <Tag className={`member-status-tag ${value.toLowerCase()}`}>
    <CheckCircleFilled /> {value}
  </Tag>
);

function DetailItem({ label, value, icon }) {
  return (
    <div className="member-profile-detail">
      <div className="member-profile-detail-label">
        {icon}
        <span>{label}</span>
      </div>
      <strong>{value || "—"}</strong>
    </div>
  );
}

export function MemberProfilePage() {
  const navigate = useNavigate();
  const { memberId } = useParams();
  const [imagePreview, setImagePreview] = useState("");
  const [loanModalOpen, setLoanModalOpen] = useState(false);

  const loanColumns = [
    { title: "Loan ID", dataIndex: "loanId", key: "loanId" },
    { title: "Amount", dataIndex: "amount", key: "amount", align: "right" },
    {
      title: "Outstanding",
      dataIndex: "outstanding",
      key: "outstanding",
      align: "right",
    },
    { title: "Progress", dataIndex: "progress", key: "progress" },
    { title: "Status", dataIndex: "status", key: "status", render: statusTag },
  ];

  const installmentColumns = [
    { title: "#", dataIndex: "number", key: "number" },
    { title: "Due date", dataIndex: "dueDate", key: "dueDate" },
    { title: "Amount", dataIndex: "amount", key: "amount", align: "right" },
    { title: "Paid", dataIndex: "paid", key: "paid", align: "right" },
    {
      title: "Remaining",
      dataIndex: "remaining",
      key: "remaining",
      align: "right",
    },
    { title: "Status", dataIndex: "status", key: "status", render: statusTag },
  ];

  const transactionColumns = [
    { title: "Type", dataIndex: "type", key: "type" },
    { title: "Amount", dataIndex: "amount", key: "amount", align: "right" },
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Reference", dataIndex: "reference", key: "reference" },
  ];

  const tabItems = [
    {
      key: "overview",
      label: "Overview",
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card title="Basic information" className="member-profile-card">
              <div className="member-profile-info-list">
                <DetailItem label="Member ID" value={memberId || profile.id} />
                <DetailItem label="Phone" value={profile.phone} />
                <DetailItem label="Address" value={profile.address} />
                <DetailItem label="NID" value={profile.nidNumber} />
                <DetailItem label="Father name" value={profile.fatherName} />
                <DetailItem label="Joined" value={profile.joined} />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card
              title="Current loan"
              className="member-profile-card current-loan-card"
            >
              <div className="member-profile-info-list">
                <DetailItem label="Loan ID" value={profile.loan} />
                <DetailItem label="Status" value={statusTag("Active")} />
                <DetailItem label="Outstanding" value={profile.loanDue} />
                <DetailItem label="Progress" value="6/12 installments" />
              </div>
              <Button block onClick={() => setLoanModalOpen(true)}>
                View loan
              </Button>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: "loans",
      label: "Loans",
      children: (
        <Table columns={loanColumns} dataSource={loanRows} pagination={false} />
      ),
    },
    {
      key: "installments",
      label: "Installments",
      children: (
        <Table
          columns={installmentColumns}
          dataSource={installmentRows}
          pagination={false}
          scroll={{ x: 760 }}
        />
      ),
    },
    {
      key: "savings",
      label: "Savings",
      children: (
        <>
          <Row gutter={[16, 16]} className="member-profile-tab-stats">
            <Col xs={24} md={8}>
              <Card>
                <Typography.Text type="secondary">
                  Current balance
                </Typography.Text>
                <Typography.Title level={3}>৳4,200</Typography.Title>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Typography.Text type="secondary">
                  Total deposited
                </Typography.Text>
                <Typography.Title level={3}>৳6,800</Typography.Title>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Typography.Text type="secondary">
                  Total withdrawn
                </Typography.Text>
                <Typography.Title level={3}>৳2,600</Typography.Title>
              </Card>
            </Col>
          </Row>
          <Space className="member-profile-tab-actions">
            <Button type="primary" icon={<PlusOutlined />}>
              Add savings
            </Button>
            <Button>Withdraw savings</Button>
          </Space>
          <Table
            columns={transactionColumns}
            dataSource={[transactionRows[1]]}
            pagination={false}
          />
        </>
      ),
    },
    {
      key: "transactions",
      label: "Transactions",
      children: (
        <Table
          columns={transactionColumns}
          dataSource={transactionRows}
          pagination={false}
        />
      ),
    },
  ];

  return (
    <PageContainer>
      <div className="member-profile-heading">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/members")}
        >
          Back to members
        </Button>
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/members/${memberId || profile.id}/edit`)}
          >
            Edit member
          </Button>
          <Button
            type="primary"
            onClick={() =>
              navigate(`/loans/new?member=${memberId || profile.id}`)
            }
          >
            Create new loan
          </Button>
        </Space>
      </div>

      <Card className="member-profile-hero">
        <div className="member-profile-identity">
          <Avatar
            size={92}
            className="member-profile-avatar"
            src={imagePreview || undefined}
          >
            {profile.initials}
          </Avatar>
          <div>
            <Typography.Title level={2}>{profile.name}</Typography.Title>
            <Typography.Text type="secondary">
              Member ID: {memberId || profile.id}
            </Typography.Text>
            <div className="member-profile-status">
              <Tag className="member-status-tag active">{profile.status}</Tag>
            </div>
          </div>
        </div>
        <div className="member-profile-contact">
          <Typography.Text type="secondary">Mobile number</Typography.Text>
          <div className="member-profile-contact-row">
            <Typography.Text strong>
              <PhoneOutlined /> {profile.phone}
            </Typography.Text>
            <Upload
              accept="image/png,image/jpeg"
              maxCount={1}
              showUploadList={false}
              beforeUpload={(file) => {
                const reader = new FileReader();
                reader.onload = () => setImagePreview(reader.result);
                reader.readAsDataURL(file);
                return false;
              }}
            >
              <Button size="small" icon={<UploadOutlined />}>
                Change photo
              </Button>
            </Upload>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]} className="member-profile-summary">
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">Active loan</Typography.Text>
            <Typography.Title level={3}>{profile.loan}</Typography.Title>
            <Typography.Text>Due {profile.loanDue}</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">Savings balance</Typography.Text>
            <Typography.Title level={3}>{profile.savings}</Typography.Title>
            <Typography.Text>Current balance</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">Member status</Typography.Text>
            <Typography.Title level={3}>Good standing</Typography.Title>
            <Typography.Text>Account is active</Typography.Text>
          </Card>
        </Col>
      </Row>
      <div className="member-profile-tabs">
        <Tabs items={tabItems} />
      </div>

      <Modal
        open={loanModalOpen}
        title={`Loan summary · ${profile.loan}`}
        width={880}
        footer={null}
        onCancel={() => setLoanModalOpen(false)}
      >
        <Row gutter={[16, 16]} className="loan-modal-summary">
          <Col xs={24} sm={6}>
            <Typography.Text type="secondary">Loan amount</Typography.Text>
            <Typography.Title level={4}>৳26,250</Typography.Title>
          </Col>
          <Col xs={24} sm={6}>
            <Typography.Text type="secondary">Total payable</Typography.Text>
            <Typography.Title level={4}>৳26,250</Typography.Title>
          </Col>
          <Col xs={24} sm={6}>
            <Typography.Text type="secondary">Paid</Typography.Text>
            <Typography.Title level={4}>৳13,128</Typography.Title>
          </Col>
          <Col xs={24} sm={6}>
            <Typography.Text type="secondary">Outstanding</Typography.Text>
            <Typography.Title level={4}>{profile.loanDue}</Typography.Title>
          </Col>
        </Row>
        <Typography.Title level={5} className="loan-modal-section-title">
          Installment schedule
        </Typography.Title>
        <Table
          columns={installmentColumns}
          dataSource={installmentRows}
          pagination={false}
          scroll={{ x: 760 }}
        />
      </Modal>
    </PageContainer>
  );
}
