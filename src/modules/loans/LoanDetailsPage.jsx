import { ArrowLeftOutlined, CheckOutlined, CloseOutlined, EditOutlined, PhoneOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Result,
  Row,
  Skeleton,
  Space,
  Form, Input, Modal, Table, message,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

import { PageContainer } from "../../components/page-container/PageContainer.jsx";
import { StatusTag } from "../../components/status-tag/StatusTag.jsx";
import { DetailItem } from "../members/components/DetailItem.jsx";
import {
  formatCharge,
  formatCurrency,
  formatDate,
  formatEnum,
} from "./loanFormatters.js";
import {
  useApproveLoanMutation,
  useDisburseLoanMutation,
  useGetLoanByIdQuery,
  useRejectLoanMutation,
} from "./loansApi.js";

export function LoanDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetLoanByIdQuery(id, { skip: !id });
  const loan = response?.data;
  const [rejectOpen, setRejectOpen] = useState(false);
  const [disbursementOpen, setDisbursementOpen] = useState(false);
  const [disbursementConfirmation, setDisbursementConfirmation] = useState(null);
  const [rejectForm] = Form.useForm();
  const [disbursementForm] = Form.useForm();
  const [approveLoan, { isLoading: approving }] = useApproveLoanMutation();
  const [rejectLoan, { isLoading: rejecting }] = useRejectLoanMutation();
  const [disburseLoan, { isLoading: disbursing }] = useDisburseLoanMutation();
  const approve = () => Modal.confirm({ title: "Approve this loan?", content: "Are you sure you want to approve this loan?", okText: "Approve", okButtonProps: { loading: approving }, onOk: async () => { try { await approveLoan(loan.id).unwrap(); message.success("Loan approved successfully"); } catch (requestError) { message.error(requestError?.data?.message || "Unable to approve loan"); throw requestError; } } });
  const reject = async ({ rejectionReason }) => { try { await rejectLoan({ id: loan.id, rejectionReason: rejectionReason.trim() }).unwrap(); message.success("Loan rejected successfully"); rejectForm.resetFields(); setRejectOpen(false); } catch (requestError) { message.error(requestError?.data?.message || "Unable to reject loan"); } };
  const requestDisbursement = (values) => {
    setDisbursementConfirmation({
      disbursementDate: values.disbursementDate.format("YYYY-MM-DD"),
      firstDueDate: values.firstDueDate.format("YYYY-MM-DD"),
    });
  };
  const confirmDisbursement = async () => {
    if (!disbursementConfirmation) return;
    try {
      await disburseLoan({ id: loan.id, payload: disbursementConfirmation }).unwrap();
      message.success("Loan disbursed and installment schedule generated");
      disbursementForm.resetFields();
      setDisbursementConfirmation(null);
      setDisbursementOpen(false);
    } catch (requestError) {
      message.error(requestError?.data?.message || "Unable to disburse loan");
    }
  };

  if (isLoading)
    return (
      <PageContainer>
        <Card>
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </PageContainer>
    );

  if (isError) {
    const notFound = error?.status === 404;
    return (
      <PageContainer>
        <Result
          status={notFound ? "404" : "error"}
          title={notFound ? "Loan not found" : "Failed to load loan"}
          subTitle={
            error?.data?.message ||
            (notFound
              ? "The loan you are looking for does not exist."
              : "Something went wrong while loading the loan.")
          }
          extra={[
            !notFound && (
              <Button key="retry" type="primary" onClick={refetch}>
                Try Again
              </Button>
            ),
            <Button key="back" onClick={() => navigate("/loans")}>
              Back to Loans
            </Button>,
          ]}
        />
      </PageContainer>
    );
  }

  if (!loan)
    return (
      <PageContainer>
        <Result
          status="404"
          title="Loan not found"
          subTitle="The loan you are looking for does not exist."
          extra={
            <Button type="primary" onClick={() => navigate("/loans")}>
              Back to Loans
            </Button>
          }
        />
      </PageContainer>
    );

  const detail = (label, value, icon) => (
    <DetailItem label={label} value={value} icon={icon} />
  );
  const getInstallmentDisplayStatus = (installment) => {
    if (installment.status !== "PENDING") return installment.status;

    return dayjs(installment.dueDate).isBefore(dayjs().startOf("day"))
      ? "OVERDUE"
      : "UPCOMING";
  };

  return (
    <PageContainer>
      <div className="member-profile-heading">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/loans")}
        >
          Back to Loans
        </Button>
        {loan.status === "PENDING" && (
          <Space><Button icon={<EditOutlined />} onClick={() => navigate(`/loans/${loan.id}/edit`)}>Edit Loan</Button><Button type="primary" icon={<CheckOutlined />} loading={approving} onClick={approve}>Approve</Button><Button danger icon={<CloseOutlined />} onClick={() => setRejectOpen(true)}>Reject</Button></Space>
        )}
        {loan.status === "APPROVED" && (
          <Button type="primary" onClick={() => setDisbursementOpen(true)}>
            Disburse Loan
          </Button>
        )}
      </div>
      {isFetching && (
        <Alert
          type="info"
          showIcon
          message="Refreshing loan information..."
          style={{ marginBottom: 16 }}
        />
      )}
      <Card className="member-profile-hero">
        <div>
          <Typography.Title level={2}>
            {loan.loanId || "Pending Loan ID"}
          </Typography.Title>
          <Typography.Text type="secondary">Loan application</Typography.Text>
          <div className="member-profile-status">
            <StatusTag status={loan.status} label={formatEnum(loan.status)} />
          </div>
        </div>
        <div className="member-profile-contact">
          <Typography.Text type="secondary">Total Payable</Typography.Text>
          <Typography.Text strong>
            {formatCurrency(loan.totalPayable)}
          </Typography.Text>
        </div>
      </Card>
      <Row gutter={[16, 16]} className="member-profile-summary">
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Typography.Text type="secondary">Principal Amount</Typography.Text>
            <Typography.Title level={4}>
              {formatCurrency(loan.principalAmount)}
            </Typography.Title>
            <Typography.Text type="secondary">
              Original loan amount
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Typography.Text type="secondary">
              {loan.regularInstallmentCount === 0
                ? "Single Installment"
                : "Regular Installment"}
            </Typography.Text>
            <Typography.Title level={4}>
              {formatCurrency(
                loan.regularInstallmentCount === 0
                  ? loan.lastInstallmentAmount
                  : loan.installmentAmount,
              )}
            </Typography.Title>
            <Typography.Text type="secondary">
              {loan.regularInstallmentCount === 0
                ? "One payment"
                : `${loan.regularInstallmentCount} regular payments`}
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Typography.Text type="secondary">Frequency</Typography.Text>
            <Typography.Title level={4}>
              {formatEnum(loan.frequency)}
            </Typography.Title>
            <Typography.Text type="secondary">
              Repayment schedule
            </Typography.Text>
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Loan Overview" className="member-profile-card">
            <div className="member-profile-info-list">
              {detail("Loan ID", loan.loanId)}
              {detail(
                "Status",
                <StatusTag
                  status={loan.status}
                  label={formatEnum(loan.status)}
                />,
              )}
              {detail("Application Date", formatDate(loan.applicationDate))}
              {detail("Frequency", formatEnum(loan.frequency))}
              {detail("Installment Count", loan.installmentCount)}
            </div>
          </Card>
        </Col>
        {(loan.status === "APPROVED" || loan.status === "REJECTED") && <Col xs={24} lg={12}><Card title="Approval Information" className="member-profile-card"><div className="member-profile-info-list">{loan.status === "APPROVED" ? <>{detail("Approved At", formatDate(loan.approvedAt))}{detail("Approved By", loan.approvedBy?.fullName || loan.approvedBy?.userName)}</> : <>{detail("Rejected At", formatDate(loan.rejectedAt))}{detail("Rejected By", loan.rejectedBy?.fullName || loan.rejectedBy?.userName)}{detail("Rejection Reason", loan.rejectionReason)}</>}</div></Card></Col>}
        <Col xs={24} lg={12}>
          <Card title="Member Information" className="member-profile-card">
            <div className="member-profile-info-list">
              {detail("Member ID", loan.member?.memberId)}
              {detail(
                "Full Name",
                loan.member ? (
                  <Button
                    type="link"
                    onClick={() => navigate(`/members/${loan.member.id}`)}
                  >
                    {loan.member.fullName}
                  </Button>
                ) : undefined,
              )}
              {detail(
                "Mobile Number",
                loan.member?.mobileNumber,
                <PhoneOutlined />,
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Financial Information" className="member-profile-card">
            <div className="member-profile-info-list">
              {detail("Principal Amount", formatCurrency(loan.principalAmount))}
              {detail("Charge Type", formatEnum(loan.chargeType))}
              {detail(
                "Charge Value",
                loan.chargeType === "PERCENTAGE"
                  ? `${loan.chargeValue}%`
                  : formatCurrency(loan.chargeValue),
              )}
              {detail("Charge Amount", formatCharge(loan))}
              {detail("Total Payable", formatCurrency(loan.totalPayable))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Installment Plan" className="member-profile-card">
            <div className="member-profile-info-list">
              {loan.regularInstallmentCount === 0 ? (
                detail(
                  "Single Installment",
                  formatCurrency(loan.lastInstallmentAmount),
                )
              ) : (
                <>
                  {detail(
                    "Regular Installment",
                    `${formatCurrency(loan.installmentAmount)} × ${loan.regularInstallmentCount}`,
                  )}
                  {detail(
                    "Final Installment",
                    formatCurrency(loan.lastInstallmentAmount),
                  )}
                </>
              )}
              {detail("Total Installments", loan.installmentCount)}
              {detail("Total Payable", formatCurrency(loan.totalPayable))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Important Dates" className="member-profile-card">
            <div className="member-profile-info-list">
              {detail("Application Date", formatDate(loan.applicationDate))}
              {detail("Disbursement Date", formatDate(loan.disbursementDate))}
              {detail("First Due Date", formatDate(loan.firstDueDate))}
              {detail("Maturity Date", formatDate(loan.maturityDate))}
            </div>
          </Card>
        </Col>
        <Col xs={24}>
          <Card title="Purpose / Notes" className="member-profile-card">
            <Space direction="vertical" size={12}>
              <Typography.Text type="secondary">Purpose</Typography.Text>
              <Typography.Paragraph>{loan.purpose || "—"}</Typography.Paragraph>
              <Typography.Text type="secondary">Notes</Typography.Text>
              <Typography.Paragraph style={{ marginBottom: 0 }}>
                {loan.notes || "—"}
              </Typography.Paragraph>
            </Space>
          </Card>
        </Col>
        {loan.status === "ACTIVE" && (
          <Col xs={24}>
            <Card title="Installment Schedule" className="member-profile-card">
              <Table
                rowKey="id"
                dataSource={loan.installments ?? []}
                pagination={false}
                scroll={{ x: 760 }}
                columns={[
                  {
                    title: "Installment",
                    dataIndex: "installmentNo",
                    render: (number) => `#${number}`,
                  },
                  { title: "Due Date", dataIndex: "dueDate", render: formatDate },
                  { title: "Amount", dataIndex: "amount", align: "right", render: formatCurrency },
                  { title: "Paid", dataIndex: "paidAmount", align: "right", render: formatCurrency },
                  {
                    title: "Remaining",
                    align: "right",
                    render: (_, installment) =>
                      formatCurrency(
                        Math.max(
                          0,
                          Number(installment.amount) - Number(installment.paidAmount),
                        ),
                      ),
                  },
                  {
                    title: "Status",
                    render: (_, installment) => {
                      const displayStatus = getInstallmentDisplayStatus(installment);
                      return (
                        <StatusTag
                          status={displayStatus}
                          label={formatEnum(displayStatus)}
                        />
                      );
                    },
                  },
                ]}
              />
            </Card>
          </Col>
        )}
      </Row>
      <Modal
        title="Disburse Loan"
        open={disbursementOpen}
        onCancel={() => {
          disbursementForm.resetFields();
          setDisbursementOpen(false);
        }}
        footer={null}
        destroyOnHidden
      >
        <Form form={disbursementForm} layout="vertical" onFinish={requestDisbursement}>
          <Form.Item
            name="disbursementDate"
            label="Disbursement Date"
            rules={[{ required: true, message: "Disbursement date is required" }]}
          >
            <DatePicker className="full-width-control" format="DD MMM YYYY" />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(previous, current) =>
              previous.disbursementDate !== current.disbursementDate
            }
          >
            {({ getFieldValue }) => {
              const disbursementDate = getFieldValue("disbursementDate");
              return (
                <Form.Item
                  name="firstDueDate"
                  label="First Installment Due Date"
                  dependencies={["disbursementDate"]}
                  rules={[
                    { required: true, message: "First installment due date is required" },
                    () => ({
                      validator(_, value) {
                        if (!value || !disbursementDate || value.isAfter(disbursementDate, "day")) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("First installment due date must be after disbursement date"),
                        );
                      },
                    }),
                  ]}
                >
                  <DatePicker
                    className="full-width-control"
                    format="DD MMM YYYY"
                    disabledDate={(current) =>
                      Boolean(disbursementDate && !current.isAfter(disbursementDate, "day"))
                    }
                  />
                </Form.Item>
              );
            }}
          </Form.Item>
          <Space>
            <Button onClick={() => setDisbursementOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={disbursing}>
              Continue
            </Button>
          </Space>
        </Form>
      </Modal>
      <Modal
        title="Confirm loan disbursement"
        open={Boolean(disbursementConfirmation)}
        okText="Disburse Loan"
        confirmLoading={disbursing}
        onOk={confirmDisbursement}
        onCancel={() => setDisbursementConfirmation(null)}
      >
        <Typography.Paragraph>
          Disbursing this loan will activate it and generate the installment schedule. Continue?
        </Typography.Paragraph>
        {disbursementConfirmation && (
          <div className="member-profile-info-list">
            {detail("Disbursement Date", formatDate(disbursementConfirmation.disbursementDate))}
            {detail("First Due Date", formatDate(disbursementConfirmation.firstDueDate))}
          </div>
        )}
      </Modal>
      <Modal title="Reject Loan" open={rejectOpen} onCancel={() => setRejectOpen(false)} footer={null} destroyOnHidden><Form form={rejectForm} layout="vertical" onFinish={reject}><Form.Item name="rejectionReason" label="Rejection Reason" rules={[{ required: true, whitespace: true, message: "Rejection reason is required" }]}><Input.TextArea rows={4} /></Form.Item><Space><Button onClick={() => setRejectOpen(false)}>Cancel</Button><Button danger type="primary" htmlType="submit" loading={rejecting}>Reject Loan</Button></Space></Form></Modal>
    </PageContainer>
  );
}
