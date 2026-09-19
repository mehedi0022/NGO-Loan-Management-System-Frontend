import { CheckOutlined, CloseOutlined, EyeOutlined } from "@ant-design/icons";
import { Button, Card, Modal, Space, Table, Tag, Typography } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "../../components/page-container/PageContainer.jsx";

const initialApprovals = [
  {
    key: "LA-001",
    member: "Rahima Begum",
    memberId: "M-0091",
    amount: "৳20,000",
    installments: 10,
    date: "19 Sep 2026",
    submittedBy: "Administrator",
    status: "Pending Approval",
  },
  {
    key: "LA-002",
    member: "Abdul Karim",
    memberId: "M-0104",
    amount: "৳35,000",
    installments: 12,
    date: "18 Sep 2026",
    submittedBy: "Field Officer",
    status: "Pending Approval",
  },
];

export function LoanApprovalPage() {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState(initialApprovals);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const updateStatus = (key, status) => {
    setApprovals((current) =>
      current.map((loan) => (loan.key === key ? { ...loan, status } : loan)),
    );
    setSelectedLoan(null);
  };

  const requestStatusChange = (loan, status) => {
    setPendingAction({ loan, status });
  };

  const confirmStatusChange = () => {
    if (!pendingAction) return;

    updateStatus(pendingAction.loan.key, pendingAction.status);
    setPendingAction(null);
  };

  const columns = [
    {
      title: "Member",
      dataIndex: "member",
      key: "member",
      render: (value, record) => (
        <div className="loan-member-cell">
          <span className="member-avatar">
            {value
              .split(" ")
              .map((namePart) => namePart[0])
              .join("")}
          </span>
          <span>
            <b>{value}</b>
            <small>{record.memberId}</small>
          </span>
        </div>
      ),
    },
    {
      title: "Loan amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
    },
    {
      title: "Installments",
      dataIndex: "installments",
      key: "installments",
      align: "center",
    },
    { title: "Submitted", dataIndex: "date", key: "date" },
    { title: "Submitted by", dataIndex: "submittedBy", key: "submittedBy" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) => (
        <Tag
          className={`loan-status-tag ${value === "Approved" ? "approved" : value === "Rejected" ? "cancelled" : "pending"}`}
        >
          {value}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setSelectedLoan(record)}
          >
            Review
          </Button>
          {record.status === "Pending Approval" && (
            <>
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => requestStatusChange(record, "Approved")}
              />
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => requestStatusChange(record, "Rejected")}
              />
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <div className="loan-page-heading approval-heading">
        <div>
          <Typography.Title level={2}>Loan Approval</Typography.Title>
          <Typography.Text>
            Review and decide on loan applications waiting for approval.
          </Typography.Text>
        </div>
        <Button type="primary" onClick={() => navigate("/loans/new")}>
          Create loan
        </Button>
      </div>
      <div className="approval-stat-row">
        <Card>
          <Typography.Text type="secondary">Pending approval</Typography.Text>
          <Typography.Title level={3}>
            {
              approvals.filter((loan) => loan.status === "Pending Approval")
                .length
            }
          </Typography.Title>
        </Card>
        <Card>
          <Typography.Text type="secondary">Approved today</Typography.Text>
          <Typography.Title level={3}>
            {approvals.filter((loan) => loan.status === "Approved").length}
          </Typography.Title>
        </Card>
        <Card>
          <Typography.Text type="secondary">Total requested</Typography.Text>
          <Typography.Title level={3}>৳55,000</Typography.Title>
        </Card>
      </div>
      <Card className="loans-table-card approval-table-card">
        <Table
          columns={columns}
          dataSource={approvals}
          pagination={false}
          scroll={{ x: 900 }}
        />
      </Card>
      <Modal
        open={Boolean(selectedLoan)}
        title="Review loan application"
        onCancel={() => setSelectedLoan(null)}
        footer={null}
      >
        {selectedLoan && (
          <div className="approval-review">
            <div>
              <span>Member</span>
              <b>
                {selectedLoan.member} ({selectedLoan.memberId})
              </b>
            </div>
            <div>
              <span>Loan amount</span>
              <b>{selectedLoan.amount}</b>
            </div>
            <div>
              <span>Installments</span>
              <b>{selectedLoan.installments}</b>
            </div>
            <div>
              <span>Submitted</span>
              <b>{selectedLoan.date}</b>
            </div>
            <Space>
              <Button onClick={() => setSelectedLoan(null)}>Close</Button>
              {selectedLoan.status === "Pending Approval" && (
                <>
                  <Button
                    danger
                    onClick={() =>
                      requestStatusChange(selectedLoan, "Rejected")
                    }
                  >
                    Reject
                  </Button>
                  <Button
                    type="primary"
                    onClick={() =>
                      requestStatusChange(selectedLoan, "Approved")
                    }
                  >
                    Approve loan
                  </Button>
                </>
              )}
            </Space>
          </div>
        )}
      </Modal>
      <Modal
        open={Boolean(pendingAction)}
        title={`${pendingAction?.status === "Approved" ? "Approve" : "Reject"} loan application?`}
        okText={
          pendingAction?.status === "Approved" ? "Approve loan" : "Reject loan"
        }
        okButtonProps={
          pendingAction?.status === "Rejected" ? { danger: true } : undefined
        }
        onOk={confirmStatusChange}
        onCancel={() => setPendingAction(null)}
      >
        {pendingAction && (
          <Typography.Paragraph>
            Are you sure you want to{" "}
            {pendingAction.status === "Approved" ? "approve" : "reject"} the
            loan application for <strong>{pendingAction.loan.member}</strong> (
            {pendingAction.loan.memberId}) for{" "}
            <strong>{pendingAction.loan.amount}</strong>?
          </Typography.Paragraph>
        )}
      </Modal>
    </PageContainer>
  );
}
