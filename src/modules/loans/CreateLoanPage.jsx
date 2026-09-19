import { ArrowLeftOutlined, CheckCircleOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageContainer } from "../../components/page-container/PageContainer.jsx";

const memberOptions = [
  { value: "M-0091", label: "Rahima Begum (M-0091)" },
  { value: "M-0104", label: "Abdul Karim (M-0104)" },
  { value: "M-0117", label: "Nasrin Akter (M-0117)" },
];

export function CreateLoanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [submittedValues, setSubmittedValues] = useState(null);
  const memberId = searchParams.get("member");
  const values = Form.useWatch([], form) || {};
  const loanAmount = Number(values.loanAmount) || 0;
  const installments = Number(values.installments) || 1;
  const serviceChargeRate = Number(values.serviceCharge) || 0;
  const serviceCharge = loanAmount * (serviceChargeRate / 100);
  const totalPayable = loanAmount + serviceCharge;
  const installmentAmount = totalPayable / installments;
  const firstInstallment =
    values.firstInstallmentDate || dayjs().add(1, "month");
  const expectedCompletion = firstInstallment.add(
    Math.max(installments - 1, 0),
    "month",
  );

  const summary = useMemo(
    () => ({
      loanAmount,
      serviceCharge,
      totalPayable,
      installmentAmount,
      installments,
      firstInstallment,
      expectedCompletion,
    }),
    [
      expectedCompletion,
      firstInstallment,
      installmentAmount,
      installments,
      loanAmount,
      serviceCharge,
      totalPayable,
    ],
  );

  const handleSubmit = (formValues) => {
    setSubmittedValues(formValues);
    setConfirmationOpen(true);
  };

  const confirmSubmission = () => {
    setConfirmationOpen(false);
    navigate("/loans/approval");
  };

  return (
    <PageContainer>
      <div className="loan-page-heading">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/loans")}
        >
          Back to Loans
        </Button>
        <Typography.Title level={2}>Create Loan</Typography.Title>
        <Typography.Text>
          Set up a new loan and submit it for approval.
        </Typography.Text>
      </div>

      <Modal
        open={confirmationOpen}
        title="Confirm loan submission"
        okText="Submit for approval"
        cancelText="Review again"
        onOk={confirmSubmission}
        onCancel={() => setConfirmationOpen(false)}
      >
        <div className="loan-confirmation-content">
          <Typography.Paragraph>
            Please review this loan application before sending it to the
            approval queue.
          </Typography.Paragraph>
          <div className="loan-confirmation-list">
            <SummaryItem
              label="Member"
              value={
                memberOptions.find(
                  (member) => member.value === submittedValues?.member,
                )?.label || "—"
              }
            />
            <SummaryItem
              label="Loan amount"
              value={`৳${summary.loanAmount.toLocaleString("en-IN")}`}
            />
            <SummaryItem
              label="Total payable"
              value={`৳${summary.totalPayable.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
              strong
            />
            <SummaryItem label="Installments" value={summary.installments} />
            <SummaryItem
              label="First installment"
              value={summary.firstInstallment.format("DD MMM YYYY")}
            />
          </div>
        </div>
      </Modal>

      <div className="loan-form-layout">
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleSubmit}
          initialValues={{
            member: memberOptions.some((member) => member.value === memberId)
              ? memberId
              : undefined,
            loanDate: dayjs(),
            installments: 10,
            frequency: "monthly",
            serviceCharge: 6,
            firstInstallmentDate: dayjs().add(1, "month"),
          }}
          className="loan-form-card"
        >
          <Card>
            <Row gutter={[20, 0]}>
              <Col xs={24}>
                <Form.Item
                  label="Member"
                  name="member"
                  rules={[{ required: true, message: "Select a member" }]}
                >
                  <Select placeholder="Select member" options={memberOptions} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Loan amount"
                  name="loanAmount"
                  rules={[{ required: true, message: "Enter loan amount" }]}
                >
                  <InputNumber
                    className="full-width-control"
                    min={1}
                    prefix="৳"
                    placeholder="20000"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Loan date" name="loanDate">
                  <DatePicker
                    className="full-width-control"
                    format="DD MMM YYYY"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Number of installments"
                  name="installments"
                  rules={[
                    { required: true, message: "Enter installment count" },
                  ]}
                >
                  <InputNumber
                    className="full-width-control"
                    min={1}
                    max={60}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Frequency" name="frequency">
                  <Select
                    options={[
                      { value: "monthly", label: "Monthly" },
                      { value: "weekly", label: "Weekly" },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label="Service charge (%)" name="serviceCharge">
                  <InputNumber
                    className="full-width-control"
                    min={0}
                    max={100}
                    suffix="%"
                  />
                </Form.Item>
                <Typography.Text type="secondary">
                  Applied once on the principal; this NGO does not compound
                  interest.
                </Typography.Text>
              </Col>
              <Col xs={24}>
                <Form.Item
                  label="First installment date"
                  name="firstInstallmentDate"
                >
                  <DatePicker
                    className="full-width-control"
                    format="DD MMM YYYY"
                  />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label="Notes" name="notes">
                  <Input.TextArea rows={3} placeholder="Optional" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Form>

        <Card title="Loan summary" className="loan-summary-card">
          <div className="loan-summary-list">
            <SummaryItem
              label="Loan amount"
              value={`৳${summary.loanAmount.toLocaleString("en-IN")}`}
            />
            <SummaryItem
              label="Service charge"
              value={`৳${summary.serviceCharge.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
            />
            <div className="loan-summary-divider" />
            <SummaryItem
              label="Total payable"
              value={`৳${summary.totalPayable.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
              strong
            />
            <SummaryItem
              label="Installment amount"
              value={`৳${summary.installmentAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
            />
            <SummaryItem
              label="Number of installments"
              value={summary.installments}
            />
            <SummaryItem
              label="First installment"
              value={summary.firstInstallment.format("DD MMM YYYY")}
            />
            <SummaryItem
              label="Expected completion"
              value={summary.expectedCompletion.format("DD MMM YYYY")}
            />
          </div>
          <Button
            block
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => form.submit()}
          >
            Submit for approval
          </Button>
        </Card>
      </div>
    </PageContainer>
  );
}

function SummaryItem({ label, value, strong = false }) {
  return (
    <div className={`loan-summary-item${strong ? " strong" : ""}`}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
