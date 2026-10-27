import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  PhoneOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Result,
  Row,
  Skeleton,
  Space,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { PageContainer } from "../../components/page-container/PageContainer.jsx";
import { StatusTag } from "../../components/status-tag/StatusTag.jsx";
import { CollectionModal } from "../collections/components/CollectionModal.jsx";
import { InstallmentScheduleTable } from "../collections/components/InstallmentScheduleTable.jsx";
import { LoanPaymentHistoryTable } from "../collections/components/LoanPaymentHistoryTable.jsx";
import { useCreateCollectionMutation } from "../collections/collectionsApi.js";
import { DetailItem } from "../members/components/DetailItem.jsx";
import { PrintableLoanAgreementModal } from "./components/PrintableLoanAgreementModal.jsx";
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

const SOMITI_DAY_MAP = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const getNextSomitiDay = (fromDate, targetDayIndex) => {
  if (!fromDate || targetDayIndex === undefined) return null;
  let next = fromDate.add(1, "day");
  while (next.day() !== targetDayIndex) {
    next = next.add(1, "day");
  }
  return next;
};

export function LoanDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [disbursementOpen, setDisbursementOpen] = useState(false);
  const [disbursementConfirmation, setDisbursementConfirmation] =
    useState(null);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [agreementOpen, setAgreementOpen] = useState(false);

  const [rejectForm] = Form.useForm();
  const [disbursementForm] = Form.useForm();

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetLoanByIdQuery(id, {
    skip: !id,
  });

  const [approveLoan, { isLoading: approving }] = useApproveLoanMutation();

  const [rejectLoan, { isLoading: rejecting }] = useRejectLoanMutation();

  const [disburseLoan, { isLoading: disbursing }] = useDisburseLoanMutation();

  const [createCollection, { isLoading: creatingCollection }] =
    useCreateCollectionMutation();

  const loan = response?.data;
  const somitiMeetingDay = loan?.member?.somiti?.meetingDay;
  const somitiDayIndex =
    somitiMeetingDay && SOMITI_DAY_MAP[somitiMeetingDay] !== undefined
      ? SOMITI_DAY_MAP[somitiMeetingDay]
      : undefined;

  useEffect(() => {
    if (disbursementOpen) {
      const today = dayjs();
      const nextSomiti = getNextSomitiDay(today, somitiDayIndex);
      disbursementForm.setFieldsValue({
        disbursementDate: today,
        firstDueDate: nextSomiti || today.add(7, "day"),
      });
    }
  }, [disbursementOpen, somitiDayIndex, disbursementForm]);

  /*
   * Preferred backend shape:
   *
   * loan.payments = [
   *   {
   *     id,
   *     paymentId,
   *     amount,
   *     paymentDate,
   *     paymentMethod,
   *     reference,
   *     notes,
   *     installment: {
   *       id,
   *       installmentNo
   *     }
   *   }
   * ]
   *
   * If payments are not currently returned by GET /loans/:id,
   * this will simply be an empty array until the backend relation
   * is added.
   */
  const payments = loan?.payments ?? [];

  const nextPayableInstallment = (loan?.installments || []).find(
    (inst) =>
      ["PENDING", "PARTIAL"].includes(inst.status) &&
      Math.max(0, Number(inst.amount || 0) - Number(inst.paidAmount || 0)) > 0,
  );

  const approve = () => {
    Modal.confirm({
      title: "Approve this loan?",
      content: "Are you sure you want to approve this loan?",
      okText: "Approve",
      okButtonProps: {
        loading: approving,
      },

      onOk: async () => {
        try {
          await approveLoan(loan.id).unwrap();

          message.success("Loan approved successfully");
        } catch (requestError) {
          message.error(
            requestError?.data?.message || "Unable to approve loan",
          );

          throw requestError;
        }
      },
    });
  };

  const reject = async ({ rejectionReason }) => {
    try {
      await rejectLoan({
        id: loan.id,
        rejectionReason: rejectionReason.trim(),
      }).unwrap();

      message.success("Loan rejected successfully");

      rejectForm.resetFields();
      setRejectOpen(false);
    } catch (requestError) {
      message.error(requestError?.data?.message || "Unable to reject loan");
    }
  };

  const requestDisbursement = (values) => {
    setDisbursementConfirmation({
      disbursementDate: values.disbursementDate.format("YYYY-MM-DD"),

      firstDueDate: values.firstDueDate.format("YYYY-MM-DD"),
    });
  };

  const confirmDisbursement = async () => {
    if (!disbursementConfirmation) return;

    try {
      await disburseLoan({
        id: loan.id,
        payload: disbursementConfirmation,
      }).unwrap();

      message.success("Loan disbursed and installment schedule generated");

      disbursementForm.resetFields();
      setDisbursementConfirmation(null);
      setDisbursementOpen(false);
    } catch (requestError) {
      message.error(requestError?.data?.message || "Unable to disburse loan");
    }
  };

  const handleCollectInstallment = (installment) => {
    /*
     * Installments returned inside loan.installments may not
     * contain the complete loan/member relation.
     *
     * CollectionModal expects:
     * installment.loan.member
     *
     * So normalize the object here.
     */
    setSelectedInstallment({
      ...installment,

      loanId: loan.id,

      loan: {
        id: loan.id,
        loanId: loan.loanId,
        member: loan.member,
      },
    });
  };

  const submitCollection = async (payload) => {
    if (!selectedInstallment) return;

    try {
      await createCollection(payload).unwrap();

      message.success("Collection completed successfully");

      setSelectedInstallment(null);
      refetch();
    } catch (requestError) {
      message.error(
        requestError?.data?.message || "Unable to complete collection",
      );

      throw requestError;
    }
  };

  const closeDisbursementModal = () => {
    disbursementForm.resetFields();
    setDisbursementConfirmation(null);
    setDisbursementOpen(false);
  };

  const closeRejectModal = () => {
    rejectForm.resetFields();
    setRejectOpen(false);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <Card>
          <Skeleton
            active
            paragraph={{
              rows: 10,
            }}
          />
        </Card>
      </PageContainer>
    );
  }

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

  if (!loan) {
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
  }

  const detail = (label, value, icon) => (
    <DetailItem label={label} value={value} icon={icon} />
  );

  return (
    <PageContainer>
      {/* Header */}

      <div className="member-profile-heading">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/loans")}
        >
          Back to Loans
        </Button>

        <Space wrap>
          <Button
            icon={<PrinterOutlined />}
            onClick={() => setAgreementOpen(true)}
          >
            Print Loan Agreement
          </Button>

          {loan.status === "PENDING" && (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={() => navigate(`/loans/${loan.id}/edit`)}
              >
                Edit Loan
              </Button>

              <Button
                type="primary"
                icon={<CheckOutlined />}
                loading={approving}
                onClick={approve}
              >
                Approve
              </Button>

              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => setRejectOpen(true)}
              >
                Reject
              </Button>
            </>
          )}

          {loan.status === "APPROVED" && (
            <Button type="primary" onClick={() => setDisbursementOpen(true)}>
              Disburse Loan
            </Button>
          )}

          {loan.status === "ACTIVE" && nextPayableInstallment && (
            <Button
              type="primary"
              onClick={() => handleCollectInstallment(nextPayableInstallment)}
            >
              Collect Installment #{nextPayableInstallment.installmentNo}
            </Button>
          )}
        </Space>
      </div>

      {isFetching && (
        <Alert
          type="info"
          showIcon
          message="Refreshing loan information..."
          style={{
            marginBottom: 16,
          }}
        />
      )}

      {/* Hero */}

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

      {/* Summary */}

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

      {/* Details */}

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

        {(loan.status === "APPROVED" || loan.status === "REJECTED") && (
          <Col xs={24} lg={12}>
            <Card title="Approval Information" className="member-profile-card">
              <div className="member-profile-info-list">
                {loan.status === "APPROVED" ? (
                  <>
                    {detail("Approved At", formatDate(loan.approvedAt))}

                    {detail(
                      "Approved By",
                      loan.approvedBy?.fullName || loan.approvedBy?.userName,
                    )}
                  </>
                ) : (
                  <>
                    {detail("Rejected At", formatDate(loan.rejectedAt))}

                    {detail(
                      "Rejected By",
                      loan.rejectedBy?.fullName || loan.rejectedBy?.userName,
                    )}

                    {detail("Rejection Reason", loan.rejectionReason)}
                  </>
                )}
              </div>
            </Card>
          </Col>
        )}

        {/* Member */}

        <Col xs={24} lg={12}>
          <Card title="Member Information" className="member-profile-card">
            <div className="member-profile-info-list">
              {detail("Member ID", loan.member?.memberId)}

              {detail(
                "Full Name",
                loan.member ? (
                  <Button
                    type="link"
                    className="p-0!"
                    onClick={() => navigate(`/members/${loan.member.id}`)}
                  >
                    {loan.member.fullName}
                  </Button>
                ) : (
                  "—"
                ),
              )}

              {detail(
                "Mobile Number",
                loan.member?.mobileNumber,
                <PhoneOutlined />,
              )}
            </div>
          </Card>
        </Col>

        {/* Financial */}

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

        {/* Installment Plan */}

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
                    `${formatCurrency(loan.installmentAmount)} × ${
                      loan.regularInstallmentCount
                    }`,
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

        {/* Dates */}

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

        {/* Purpose */}

        <Col xs={24}>
          <Card title="Purpose / Notes" className="member-profile-card">
            <Space direction="vertical" size={12}>
              <Typography.Text type="secondary">Purpose</Typography.Text>

              <Typography.Paragraph>{loan.purpose || "—"}</Typography.Paragraph>

              <Typography.Text type="secondary">Notes</Typography.Text>

              <Typography.Paragraph
                style={{
                  marginBottom: 0,
                }}
              >
                {loan.notes || "—"}
              </Typography.Paragraph>
            </Space>
          </Card>
        </Col>

        {/* Installment Schedule */}

        {["ACTIVE", "COMPLETED"].includes(loan.status) && (
          <Col xs={24}>
            <Card title="Installment Schedule" className="member-profile-card">
              <InstallmentScheduleTable
                installments={loan.installments ?? []}
                loanStatus={loan.status}
                onCollect={handleCollectInstallment}
                loading={isFetching}
              />
            </Card>
          </Col>
        )}

        {/* Loan Payment History */}

        {["ACTIVE", "COMPLETED"].includes(loan.status) && (
          <Col xs={24}>
            <Card title="Loan Payment History" className="member-profile-card">
              <LoanPaymentHistoryTable
                payments={payments}
                loading={isFetching}
              />
            </Card>
          </Col>
        )}
      </Row>

      {/* Disbursement Form */}

      <Modal
        title="Disburse Loan"
        open={disbursementOpen}
        onCancel={closeDisbursementModal}
        footer={null}
        destroyOnHidden
      >
        {somitiMeetingDay && (
          <div
            style={{
              background: "#f0f9ff",
              border: "1px solid #bae6fd",
              padding: "10px 14px",
              borderRadius: 6,
              marginBottom: 16,
            }}
          >
            <div style={{ fontWeight: 600, color: "#0369a1", fontSize: 13 }}>
              📌 Somiti Meeting Day: {somitiMeetingDay}{" "}
              {loan.member?.somiti?.name ? `(${loan.member.somiti.name})` : ""}
            </div>
            <div style={{ color: "#0284c7", fontSize: 11, marginTop: 2 }}>
              First installment due date is strictly locked to only allow{" "}
              <strong>{somitiMeetingDay}s</strong>.
            </div>
          </div>
        )}

        <Form
          form={disbursementForm}
          layout="vertical"
          onFinish={requestDisbursement}
        >
          <Form.Item
            name="disbursementDate"
            label="Disbursement Date"
            rules={[
              {
                required: true,
                message: "Disbursement date is required",
              },
            ]}
          >
            <DatePicker
              className="full-width-control"
              format="DD MMM YYYY"
              onChange={(val) => {
                if (val && somitiDayIndex !== undefined) {
                  const nextSomiti = getNextSomitiDay(val, somitiDayIndex);
                  if (nextSomiti) {
                    disbursementForm.setFieldsValue({
                      firstDueDate: nextSomiti,
                    });
                  }
                }
              }}
            />
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
                  label={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <span>First Installment Due Date</span>
                      {somitiMeetingDay && (
                        <span
                          style={{
                            color: "#0369a1",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          Only {somitiMeetingDay}s allowed
                        </span>
                      )}
                    </div>
                  }
                  dependencies={["disbursementDate"]}
                  rules={[
                    {
                      required: true,
                      message: "First installment due date is required",
                    },

                    () => ({
                      validator(_, value) {
                        if (!value) return Promise.resolve();
                        if (
                          disbursementDate &&
                          !value.isAfter(disbursementDate, "day")
                        ) {
                          return Promise.reject(
                            new Error(
                              "First installment due date must be after disbursement date",
                            ),
                          );
                        }

                        if (
                          somitiDayIndex !== undefined &&
                          value.day() !== somitiDayIndex
                        ) {
                          return Promise.reject(
                            new Error(
                              `First installment due date must fall on Somiti meeting day (${somitiMeetingDay})`,
                            ),
                          );
                        }

                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <DatePicker
                    className="full-width-control"
                    format="DD MMM YYYY"
                    disabledDate={(current) => {
                      if (!disbursementDate) return true;
                      if (!current.isAfter(disbursementDate, "day")) return true;
                      if (somitiDayIndex !== undefined) {
                        return current.day() !== somitiDayIndex;
                      }
                      return false;
                    }}
                  />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Space>
            <Button onClick={closeDisbursementModal}>Cancel</Button>

            <Button type="primary" htmlType="submit">
              Continue
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* Disbursement Confirmation */}

      <Modal
        title="Confirm loan disbursement"
        open={Boolean(disbursementConfirmation)}
        okText="Disburse Loan"
        confirmLoading={disbursing}
        onOk={confirmDisbursement}
        onCancel={() => setDisbursementConfirmation(null)}
      >
        <Typography.Paragraph>
          Disbursing this loan will activate it and generate the installment
          schedule. Continue?
        </Typography.Paragraph>

        {disbursementConfirmation && (
          <div className="member-profile-info-list">
            {detail(
              "Disbursement Date",
              formatDate(disbursementConfirmation.disbursementDate),
            )}

            {detail(
              "First Due Date",
              formatDate(disbursementConfirmation.firstDueDate),
            )}
          </div>
        )}
      </Modal>

      {/* Reject Loan */}

      <Modal
        title="Reject Loan"
        open={rejectOpen}
        onCancel={closeRejectModal}
        footer={null}
        destroyOnHidden
      >
        <Form form={rejectForm} layout="vertical" onFinish={reject}>
          <Form.Item
            name="rejectionReason"
            label="Rejection Reason"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Rejection reason is required",
              },
            ]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Space>
            <Button onClick={closeRejectModal}>Cancel</Button>

            <Button danger type="primary" htmlType="submit" loading={rejecting}>
              Reject Loan
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* Unified Collection */}

      <CollectionModal
        open={Boolean(selectedInstallment)}
        installment={selectedInstallment}
        loading={creatingCollection}
        onCancel={() => setSelectedInstallment(null)}
        onSubmit={submitCollection}
      />

      <PrintableLoanAgreementModal
        open={agreementOpen}
        loan={loan}
        onClose={() => setAgreementOpen(false)}
      />
    </PageContainer>
  );
}
