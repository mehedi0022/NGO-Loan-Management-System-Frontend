import {
  ArrowLeftOutlined,
  CalendarOutlined,
  DollarCircleOutlined,
  SettingOutlined,
  TableOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Result,
  Row,
  Select,
  Skeleton,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { PageContainer } from "../../components/page-container/PageContainer.jsx";
import { useGetAllMembersQuery } from "../members/membersApi.js";
import { calculateLoanPreview } from "./loanCalculation.js";
import { formatCurrency } from "./loanFormatters.js";
import { useGetLoanByIdQuery, useUpdateLoanMutation } from "./loansApi.js";

const { Title, Text } = Typography;

export function EditLoanPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [formError, setFormError] = useState("");
  const [isCustomInstallment, setIsCustomInstallment] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const { data, isLoading, isError, error } = useGetLoanByIdQuery(id, {
    skip: !id,
  });
  const { data: membersResponse, isLoading: membersLoading } =
    useGetAllMembersQuery({
      page: 1,
      limit: 100,
      status: "ACTIVE",
      sortBy: "fullName",
      sortOrder: "asc",
    });
  const [updateLoan, { isLoading: isUpdating }] = useUpdateLoanMutation();
  const loan = data?.data;

  const memberOptions = useMemo(
    () =>
      (membersResponse?.data ?? []).map((member) => ({
        value: member.id,
        label: `${member.fullName} (${member.memberId || "Pending ID"})`,
      })),
    [membersResponse?.data],
  );

  // Form watchers for dynamic preview
  const principalAmount = Form.useWatch("principalAmount", form);
  const chargeType = Form.useWatch("chargeType", form) || "PERCENTAGE";
  const chargeValue = Form.useWatch("chargeValue", form);
  const installmentCount = Form.useWatch("installmentCount", form) || 12;
  const frequency = Form.useWatch("frequency", form) || "MONTHLY";
  const customInstallmentAmount = Form.useWatch(
    "customInstallmentAmount",
    form,
  );

  const loanCalc = useMemo(() => {
    return calculateLoanPreview({
      principalAmount: principalAmount ?? (loan ? Number(loan.principalAmount) : 0),
      chargeType,
      chargeValue: chargeValue ?? (loan ? Number(loan.chargeValue) : 0),
      installmentCount: installmentCount ?? (loan ? loan.installmentCount : 12),
      isCustomInstallment,
      customInstallmentAmount,
      frequency,
    });
  }, [
    principalAmount,
    chargeType,
    chargeValue,
    installmentCount,
    isCustomInstallment,
    customInstallmentAmount,
    frequency,
    loan,
  ]);

  if (isLoading)
    return (
      <PageContainer>
        <Card>
          <Skeleton active paragraph={{ rows: 9 }} />
        </Card>
      </PageContainer>
    );

  if (isError || !loan)
    return (
      <PageContainer>
        <Result
          status={error?.status === 404 ? "404" : "error"}
          title="Unable to edit loan"
          subTitle={error?.data?.message || "Loan not found."}
          extra={<Button onClick={() => navigate("/loans")}>Back to Loans</Button>}
        />
      </PageContainer>
    );

  if (loan.status !== "PENDING")
    return (
      <PageContainer>
        <Result
          status="warning"
          title="This loan cannot be edited"
          subTitle="Only pending loans can be edited."
          extra={
            <Button type="primary" onClick={() => navigate(`/loans/${loan.id}`)}>
              Back to Loan
            </Button>
          }
        />
      </PageContainer>
    );

  const submit = async (values) => {
    setFormError("");

    if (isCustomInstallment && loanCalc && !loanCalc.isValidCustomAmount) {
      setFormError(
        loanCalc.customAmountError || "Please enter a valid installment amount",
      );
      return;
    }

    try {
      const payload = {
        ...values,
        installmentAmount:
          isCustomInstallment && loanCalc?.regularInstallmentAmount
            ? loanCalc.regularInstallmentAmount
            : undefined,
      };

      await updateLoan({ id, payload }).unwrap();
      message.success("Loan updated successfully");
      navigate(`/loans/${id}`);
    } catch (requestError) {
      setFormError(
        requestError?.data?.message || "Unable to update the loan.",
      );
    }
  };

  const scheduleColumns = [
    {
      title: "No.",
      dataIndex: "installmentNo",
      key: "installmentNo",
      width: 65,
      render: (num) => <strong>#{num}</strong>,
    },
    {
      title: "Est. Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (date) => (
        <span className="text-slate-600 text-xs">
          <CalendarOutlined className="mr-1 text-slate-400" />
          {date}
        </span>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount, row) => (
        <Space>
          <strong
            className={row.isFinal ? "text-purple-600" : "text-emerald-700"}
          >
            {formatCurrency(amount)}
          </strong>
          {row.isFinal && (
            <Tag color="purple" className="text-[10px] font-semibold">
              Final Adjustment
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Remaining",
      dataIndex: "remaining",
      key: "remaining",
      render: (val) => (
        <span className="text-xs text-slate-500 font-mono">
          {formatCurrency(val)}
        </span>
      ),
    },
  ];

  return (
    <PageContainer>
      <div className="loan-page-heading mb-4">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/loans/${id}`)}
        >
          Back to Loan #{loan.loanId || loan.id}
        </Button>
        <Title level={2} className="m-0! text-slate-900 font-bold">
          Edit Pending Loan
        </Title>
      </div>

      {formError && (
        <Alert
          type="error"
          showIcon
          message="Failed to update loan"
          description={formError}
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setFormError("")}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          memberId: loan.memberId,
          principalAmount: Number(loan.principalAmount),
          chargeType: loan.chargeType,
          chargeValue: Number(loan.chargeValue),
          installmentCount: loan.installmentCount,
          frequency: loan.frequency,
          purpose: loan.purpose,
          notes: loan.notes,
          customInstallmentAmount: Number(loan.installmentAmount),
        }}
        onFinish={submit}
      >
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={15}>
            <Card
              title="Loan Parameters"
              className="border border-slate-200 rounded-xl shadow-sm"
              style={{ marginBottom: 20 }}
            >
              <Row gutter={[16, 0]}>
                <Col xs={24}>
                  <Form.Item
                    name="memberId"
                    label="Member"
                    rules={[{ required: true }]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      loading={membersLoading}
                      options={memberOptions}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="principalAmount"
                    label="Principal Amount"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      className="w-full rounded-lg"
                      min={0.01}
                      precision={2}
                      prefix="BDT "
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="installmentCount"
                    label="Installment Count"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      className="w-full rounded-lg"
                      min={1}
                      precision={0}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item name="chargeType" label="Charge Type">
                    <Select
                      options={[
                        { value: "PERCENTAGE", label: "Percentage" },
                        { value: "FLAT", label: "Flat amount" },
                      ]}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="chargeValue"
                    label="Charge Value"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      className="w-full rounded-lg"
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item name="frequency" label="Frequency">
                    <Select
                      options={[
                        { value: "MONTHLY", label: "Monthly" },
                        { value: "WEEKLY", label: "Weekly" },
                      ]}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item name="purpose" label="Purpose">
                    <Input />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item name="notes" label="Notes">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Custom Installment Control Card */}
            <Card
              title={
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <SettingOutlined className="text-blue-600" />
                    <span className="font-semibold text-slate-800">
                      Custom Installment Amount
                    </span>
                  </div>
                  <Switch
                    checked={isCustomInstallment}
                    onChange={(checked) => {
                      setIsCustomInstallment(checked);
                      if (checked && loanCalc?.autoInstallmentAmount) {
                        form.setFieldsValue({
                          customInstallmentAmount:
                            loanCalc.autoInstallmentAmount,
                        });
                      }
                    }}
                    checkedChildren="Manual"
                    unCheckedChildren="Auto"
                  />
                </div>
              }
              className="border border-slate-200 rounded-xl shadow-sm"
              style={{ marginBottom: 20 }}
            >
              {isCustomInstallment ? (
                <div>
                  <Row gutter={[16, 12]} align="middle">
                    <Col xs={24} sm={14}>
                      <Form.Item
                        label={`Regular Installment Amount (1 to ${Math.max(
                          1,
                          (installmentCount || 1) - 1,
                        )}th)`}
                        name="customInstallmentAmount"
                      >
                        <InputNumber
                          className="w-full rounded-lg"
                          prefix="BDT "
                          min={1}
                          precision={2}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={10}>
                      <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/70">
                        <div className="text-[11px] text-purple-700 font-semibold">
                          Final ({installmentCount || 12}th) Installment:
                        </div>
                        <div className="text-xl font-bold text-purple-900 mt-1">
                          {loanCalc
                            ? formatCurrency(loanCalc.lastInstallmentAmount)
                            : "BDT 0.00"}
                        </div>
                      </div>
                    </Col>
                  </Row>
                  {loanCalc && !loanCalc.isValidCustomAmount && (
                    <Alert
                      type="error"
                      showIcon
                      message="Invalid Amount"
                      description={loanCalc.customAmountError}
                      className="mt-2"
                    />
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic py-1">
                  Currently in standard automatic mode. Turn ON to specify
                  custom regular installments.
                </div>
              )}
            </Card>
          </Col>

          {/* Right Column: Live Calculation Breakdown */}
          <Col xs={24} lg={9}>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <DollarCircleOutlined className="text-emerald-600 text-lg" />
                  <span className="font-semibold text-slate-800">
                    Live Calculation Preview
                  </span>
                </div>
              }
              className="border border-slate-200 rounded-xl shadow-sm sticky top-4"
            >
              {loanCalc && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
                    <span className="text-slate-500">Principal</span>
                    <strong>{formatCurrency(loanCalc.principalAmount)}</strong>
                  </div>
                  <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
                    <span className="text-slate-500">Service Charge</span>
                    <strong className="text-blue-600">
                      + {formatCurrency(loanCalc.chargeAmount)}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-base py-2 border-b-2 border-slate-200">
                    <span className="font-semibold text-slate-900">
                      Total Payable
                    </span>
                    <strong className="text-emerald-700 text-lg">
                      {formatCurrency(loanCalc.totalPayable)}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 mt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600">
                        Regular (1st–{loanCalc.regularInstallmentCount}th):
                      </span>
                      <strong className="text-emerald-700 text-sm">
                        {formatCurrency(loanCalc.regularInstallmentAmount)} / inst
                      </strong>
                    </div>
                    {loanCalc.installmentCount > 1 && (
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
                        <span className="text-slate-600">
                          Final ({loanCalc.installmentCount}th inst):
                        </span>
                        <strong className="text-purple-700 text-sm">
                          {formatCurrency(loanCalc.lastInstallmentAmount)}
                        </strong>
                      </div>
                    )}
                  </div>

                  <Button
                    block
                    icon={<TableOutlined />}
                    onClick={() => setScheduleModalOpen(true)}
                    className="mt-3 rounded-lg"
                  >
                    View Schedule Breakdown
                  </Button>

                  <Button
                    block
                    type="primary"
                    htmlType="submit"
                    loading={isUpdating}
                    disabled={isCustomInstallment && !loanCalc.isValidCustomAmount}
                    className="mt-3 bg-emerald-600 hover:bg-emerald-700 font-semibold shadow-md rounded-lg"
                    style={{
                      height: 44,
                      backgroundColor: "#059669",
                      borderColor: "#059669",
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Form>

      {/* Schedule Preview Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <TableOutlined className="text-emerald-600" />
            <span>Repayment Schedule Preview</span>
          </div>
        }
        open={scheduleModalOpen}
        onOk={() => setScheduleModalOpen(false)}
        onCancel={() => setScheduleModalOpen(false)}
        width={650}
        footer={[
          <Button key="close" onClick={() => setScheduleModalOpen(false)}>
            Close
          </Button>,
        ]}
      >
        {loanCalc && (
          <Table
            dataSource={loanCalc.schedule}
            columns={scheduleColumns}
            rowKey="installmentNo"
            pagination={{ pageSize: 12, showSizeChanger: false }}
            size="small"
          />
        )}
      </Modal>
    </PageContainer>
  );
}
