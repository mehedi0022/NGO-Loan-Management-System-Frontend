import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  TableOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { PageContainer } from "../../components/page-container/PageContainer.jsx";
import {
  useGetAllMembersQuery,
  useGetMemberByIdQuery,
} from "../members/membersApi.js";
import { calculateLoanPreview } from "./loanCalculation.js";
import { formatCurrency } from "./loanFormatters.js";
import { useCreateLoanMutation } from "./loansApi.js";

const { Title, Text, Paragraph } = Typography;

export function CreateLoanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [formError, setFormError] = useState("");
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [isCustomInstallment, setIsCustomInstallment] = useState(false);

  const memberIdFromQuery = Number(
    searchParams.get("memberId") ?? searchParams.get("member"),
  );
  const validMemberId =
    Number.isSafeInteger(memberIdFromQuery) && memberIdFromQuery > 0;

  const watchedMemberId = Form.useWatch("memberId", form);
  const currentMemberId =
    watchedMemberId || (validMemberId ? memberIdFromQuery : undefined);

  const { data: membersResponse, isLoading: membersLoading } =
    useGetAllMembersQuery({
      page: 1,
      limit: 100,
      status: "ACTIVE",
      sortBy: "fullName",
      sortOrder: "asc",
    });

  const { data: currentMemberResponse } = useGetMemberByIdQuery(
    currentMemberId,
    {
      skip: !currentMemberId,
    },
  );

  const activeLoan = useMemo(() => {
    return currentMemberResponse?.data?.loans?.find((l) => l.status === "ACTIVE");
  }, [currentMemberResponse]);

  const pendingOrApprovedLoan = useMemo(() => {
    return currentMemberResponse?.data?.loans?.find(
      (l) => l.status === "PENDING" || l.status === "APPROVED",
    );
  }, [currentMemberResponse]);

  const hasExistingLoan = Boolean(activeLoan || pendingOrApprovedLoan);

  const [createLoan, { isLoading: isCreating }] = useCreateLoanMutation();

  const memberOptions = useMemo(() => {
    const members = [...(membersResponse?.data ?? [])];
    const selectedMember = currentMemberResponse?.data;

    if (
      selectedMember &&
      !members.some((member) => member.id === selectedMember.id)
    ) {
      members.push(selectedMember);
    }

    return members.map((member) => ({
      value: member.id,
      label: `${member.fullName} (${member.memberId || "Pending ID"})`,
    }));
  }, [membersResponse?.data, currentMemberResponse?.data]);

  // Form watchers for dynamic calculations
  const principalAmount = Form.useWatch("principalAmount", form);
  const chargeType = Form.useWatch("chargeType", form) || "PERCENTAGE";
  const chargeValue = Form.useWatch("chargeValue", form);
  const installmentCount = Form.useWatch("installmentCount", form) || 12;
  const frequency = Form.useWatch("frequency", form) || "MONTHLY";
  const customInstallmentAmount = Form.useWatch(
    "customInstallmentAmount",
    form,
  );

  // Live Loan Calculation Preview
  const loanCalc = useMemo(() => {
    return calculateLoanPreview({
      principalAmount,
      chargeType,
      chargeValue: chargeValue || 0,
      installmentCount,
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
  ]);

  const handleSubmit = async (values) => {
    setFormError("");

    if (isCustomInstallment && loanCalc && !loanCalc.isValidCustomAmount) {
      setFormError(
        loanCalc.customAmountError || "Please enter a valid installment amount",
      );
      return;
    }

    if (hasExistingLoan) {
      const msg = activeLoan
        ? `This member already has an active loan (${activeLoan.loanId || `#${activeLoan.id}`}). Multiple loans are not allowed until the active loan is closed.`
        : `This member already has a ${pendingOrApprovedLoan?.status?.toLowerCase()} loan application (${pendingOrApprovedLoan?.loanId || `#${pendingOrApprovedLoan?.id}`}).`;
      setFormError(msg);
      message.error(msg);
      return;
    }

    try {
      const payload = {
        memberId: values.memberId,
        principalAmount: values.principalAmount,
        chargeType: values.chargeType,
        chargeValue: values.chargeValue,
        installmentCount: values.installmentCount,
        frequency: values.frequency,
        purpose: values.purpose?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
        installmentAmount:
          isCustomInstallment && loanCalc?.regularInstallmentAmount
            ? loanCalc.regularInstallmentAmount
            : undefined,
      };

      const response = await createLoan(payload).unwrap();
      message.success("Loan created successfully");
      navigate(`/loans/${response.data.id}`);
    } catch (error) {
      setFormError(
        error?.data?.message ||
          "Unable to create the loan. Please review the form and try again.",
      );
    }
  };

  const scheduleColumns = [
    {
      title: "No.",
      dataIndex: "installmentNo",
      key: "installmentNo",
      width: 65,
      render: (num) => <strong className="text-slate-700">#{num}</strong>,
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
      title: "Cumulative Paid",
      dataIndex: "cumulative",
      key: "cumulative",
      render: (val) => (
        <span className="text-xs text-slate-500">{formatCurrency(val)}</span>
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
          onClick={() => navigate("/loans")}
        >
          Back to Loans
        </Button>
        <Title level={2} className="m-0! text-slate-900 font-bold">
          Create Loan Application
        </Title>
        <Text type="secondary">
          Configure loan terms with automated schedule calculation or custom
          installment controls.
        </Text>
      </div>

      {formError && (
        <Alert
          type="error"
          showIcon
          message="Failed to create loan"
          description={formError}
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setFormError("")}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{
          memberId: validMemberId ? memberIdFromQuery : undefined,
          chargeType: "PERCENTAGE",
          chargeValue: 10,
          frequency: "MONTHLY",
          installmentCount: 12,
        }}
        onFinish={handleSubmit}
      >
        <Row gutter={[24, 24]} align="top">
          {/* Main Application Form Column */}
          <Col xs={24} lg={15}>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                    <FileTextOutlined className="text-base" />
                  </div>
                  <span className="font-semibold text-slate-800 text-base">
                    Loan Parameters
                  </span>
                </div>
              }
              className="border border-slate-200 rounded-xl shadow-sm"
            >
              <Row gutter={[16, 12]}>
                {/* Member selection */}
                <Col xs={24}>
                  <Form.Item
                    label="Member"
                    name="memberId"
                    rules={[{ required: true, message: "Select a member" }]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      loading={membersLoading}
                      options={memberOptions}
                      placeholder="Select member by name or code"
                      style={{ width: "100%" }}
                      className="rounded-lg"
                    />
                  </Form.Item>

                  {/* Active / Pending Loan Alerts */}
                  {activeLoan && (
                    <Alert
                      type="error"
                      showIcon
                      className="mb-4 rounded-lg"
                      message="সতর্কতা: এই মেম্বারের ইতোমধ্যে একটি একটিভ লোন চালু রয়েছে!"
                      description={
                        <div className="text-xs space-y-1">
                          <div>
                            বিদ্যমান লোন আইডি:{" "}
                            <strong>{activeLoan.loanId || `#${activeLoan.id}`}</strong>{" "}
                            (মূল ঋণ: BDT {Number(activeLoan.principalAmount).toLocaleString()} | মোট প্রদেয়: BDT {Number(activeLoan.totalPayable).toLocaleString()})
                          </div>
                          <div className="text-red-700 font-semibold">
                            নিয়ম অনুযায়ী, চলমান লোনটি সম্পূর্ণ পরিশোধ ও ক্লোজ (COMPLETED) না হওয়া পর্যন্ত নতুন কোনো লোন প্রদান করা যাবে না।
                          </div>
                        </div>
                      }
                    />
                  )}

                  {pendingOrApprovedLoan && !activeLoan && (
                    <Alert
                      type="warning"
                      showIcon
                      className="mb-4 rounded-lg"
                      message={`সতর্কতা: এই মেম্বারের একটি ${pendingOrApprovedLoan.status === "APPROVED" ? "অনুমোদিত (APPROVED)" : "পেন্ডিং (PENDING)"} লোন আবেদন রয়েছে!`}
                      description={
                        <div className="text-xs space-y-1">
                          <div>
                            আবেদনকৃত লোন আইডি:{" "}
                            <strong>{pendingOrApprovedLoan.loanId || `#${pendingOrApprovedLoan.id}`}</strong>
                          </div>
                          <div>
                            অনুগ্রহ করে পূর্বের আবেদনটি ডিসবার্স বা বাতিল করুন, অন্যথায় নতুন লোন আবেদন গ্রহণযোগ্য হবে না।
                          </div>
                        </div>
                      }
                    />
                  )}
                </Col>

                {/* Principal Amount & Frequency */}
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Principal Amount"
                    name="principalAmount"
                    rules={[
                      {
                        required: true,
                        message: "Enter the principal amount",
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      className="rounded-lg"
                      min={1}
                      precision={2}
                      prefix="BDT "
                      placeholder="50000"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Repayment Frequency"
                    name="frequency"
                    rules={[{ required: true }]}
                  >
                    <Select
                      style={{ width: "100%" }}
                      className="rounded-lg"
                      options={[
                        { value: "MONTHLY", label: "Monthly" },
                        { value: "WEEKLY", label: "Weekly" },
                      ]}
                    />
                  </Form.Item>
                </Col>

                {/* Charge Type & Charge Rate */}
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Charge Type"
                    name="chargeType"
                    rules={[{ required: true }]}
                  >
                    <Select
                      style={{ width: "100%" }}
                      className="rounded-lg"
                      options={[
                        { value: "PERCENTAGE", label: "Percentage (%)" },
                        { value: "FLAT", label: "Flat Amount (BDT)" },
                      ]}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label={
                      chargeType === "PERCENTAGE"
                        ? "Service Charge Rate (%)"
                        : "Fixed Charge Amount (BDT)"
                    }
                    name="chargeValue"
                    rules={[
                      { required: true, message: "Enter the charge value" },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      className="rounded-lg"
                      min={0}
                      max={chargeType === "PERCENTAGE" ? 100 : undefined}
                      precision={2}
                      suffix={chargeType === "PERCENTAGE" ? "%" : undefined}
                      prefix={chargeType === "FLAT" ? "BDT " : undefined}
                      placeholder="10"
                    />
                  </Form.Item>
                </Col>

                {/* Installment Count & Purpose */}
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Installment Count"
                    name="installmentCount"
                    rules={[
                      {
                        required: true,
                        message: "Enter the installment count",
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      className="rounded-lg"
                      min={1}
                      max={120}
                      precision={0}
                      placeholder="12"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item label="Purpose" name="purpose">
                    <Input
                      style={{ width: "100%" }}
                      placeholder="e.g. Small business, Agriculture"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>

                {/* Embedded Custom Installment Panel */}
                <Col xs={24}>
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 mt-1 mb-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <SettingOutlined className="text-blue-600 text-base" />
                        <div>
                          <span className="font-semibold text-slate-800 text-sm">
                            Custom Installment Amount
                          </span>
                          <Tag
                            color={isCustomInstallment ? "blue" : "default"}
                            className="ml-2 text-[10px] font-semibold"
                          >
                            {isCustomInstallment ? "Manual Mode" : "Auto Mode"}
                          </Tag>
                        </div>
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
                    <div className="text-[11px] text-slate-500 mt-1">
                      {isCustomInstallment
                        ? `Specify regular installments (1 to ${Math.max(
                            1,
                            (installmentCount || 1) - 1,
                          )}). The final installment auto-adjusts to cover the remaining balance.`
                        : "Regular installments are auto-calculated using the standard lower-10s rule. Toggle ON to manually specify regular installments."}
                    </div>

                    {isCustomInstallment && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <Row gutter={[16, 12]} align="middle">
                          <Col xs={24} sm={14}>
                            <Form.Item
                              label={
                                <span className="text-xs font-semibold text-slate-700">
                                  Regular Installment (1st to{" "}
                                  {Math.max(1, (installmentCount || 1) - 1)}
                                  th):
                                </span>
                              }
                              name="customInstallmentAmount"
                              style={{ marginBottom: 0 }}
                            >
                              <InputNumber
                                style={{ width: "100%" }}
                                className="rounded-lg text-base font-semibold"
                                prefix="BDT "
                                min={1}
                                precision={2}
                                placeholder="e.g. 4500"
                              />
                            </Form.Item>
                            {loanCalc?.autoInstallmentAmount ? (
                              <div className="text-[11px] text-slate-500 mt-1">
                                System auto amount was:{" "}
                                <button
                                  type="button"
                                  className="text-blue-600 underline font-medium cursor-pointer"
                                  onClick={() =>
                                    form.setFieldsValue({
                                      customInstallmentAmount:
                                        loanCalc.autoInstallmentAmount,
                                    })
                                  }
                                >
                                  {formatCurrency(
                                    loanCalc.autoInstallmentAmount,
                                  )}
                                </button>
                              </div>
                            ) : null}
                          </Col>

                          <Col xs={24} sm={10}>
                            <div className="p-3 rounded-lg border border-purple-200 bg-purple-50">
                              <div className="text-[11px] text-purple-700 font-semibold">
                                Final ({installmentCount || 12}th) Installment:
                              </div>
                              <div className="text-xl font-bold text-purple-900 mt-0.5">
                                {loanCalc
                                  ? formatCurrency(
                                      loanCalc.lastInstallmentAmount,
                                    )
                                  : "BDT 0.00"}
                              </div>
                              <div className="text-[10px] text-purple-600">
                                Remainder auto-adjusted
                              </div>
                            </div>
                          </Col>
                        </Row>

                        {loanCalc && !loanCalc.isValidCustomAmount && (
                          <Alert
                            type="error"
                            showIcon
                            message="Invalid Installment Amount"
                            description={loanCalc.customAmountError}
                            className="mt-3 rounded-lg"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </Col>

                {/* Notes */}
                <Col xs={24}>
                  <Form.Item
                    label="Notes / Comments"
                    name="notes"
                    style={{ marginBottom: 0 }}
                  >
                    <Input.TextArea
                      rows={2}
                      placeholder="Optional notes or remarks"
                      style={{ width: "100%" }}
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Right Column: Live Calculation Summary & Actions */}
          <Col xs={24} lg={9}>
            <Card
              title={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                      <DollarCircleOutlined className="text-base" />
                    </div>
                    <span className="font-semibold text-slate-800 text-base">
                      Live Loan Breakdown
                    </span>
                  </div>
                  {isCustomInstallment && (
                    <Tag color="orange" className="text-[10px] font-semibold m-0">
                      Custom Mode
                    </Tag>
                  )}
                </div>
              }
              className="border border-slate-200 rounded-xl shadow-sm sticky top-4"
            >
              {loanCalc ? (
                <div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
                      <span className="text-slate-500">Principal</span>
                      <strong className="text-slate-800">
                        {formatCurrency(loanCalc.principalAmount)}
                      </strong>
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

                    <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
                      <span className="text-slate-500">Total Installments</span>
                      <strong className="text-slate-800">
                        {loanCalc.installmentCount} ({frequency})
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 mt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600">
                          Regular (1st to {loanCalc.regularInstallmentCount}
                          th):
                        </span>
                        <strong className="text-emerald-700 text-sm">
                          {formatCurrency(loanCalc.regularInstallmentAmount)}{" "}
                          <span className="text-[11px] font-normal text-slate-500">
                            / inst
                          </span>
                        </strong>
                      </div>

                      {loanCalc.installmentCount > 1 && (
                        <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
                          <span className="text-slate-600">
                            Final ({loanCalc.installmentCount}th installment):
                          </span>
                          <strong className="text-purple-700 text-sm">
                            {formatCurrency(loanCalc.lastInstallmentAmount)}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    block
                    icon={<TableOutlined />}
                    onClick={() => setScheduleModalOpen(true)}
                    className="mt-4 rounded-lg font-semibold"
                    style={{ height: 40 }}
                  >
                    View Schedule Breakdown ({loanCalc.installmentCount} Inst)
                  </Button>

                  <Button
                    block
                    type="primary"
                    htmlType="submit"
                    loading={isCreating}
                    disabled={
                      hasExistingLoan ||
                      (isCustomInstallment && !loanCalc.isValidCustomAmount)
                    }
                    className="mt-3 bg-emerald-600 hover:bg-emerald-700 font-semibold shadow-md rounded-lg"
                    style={{
                      height: 44,
                      backgroundColor: "#059669",
                      borderColor: "#059669",
                    }}
                  >
                    Confirm & Create Loan
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <DollarCircleOutlined className="text-4xl text-slate-300 mb-2" />
                  <p className="text-xs">
                    Enter principal amount and terms to see live breakdown and
                    schedule.
                  </p>
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
            {loanCalc && (
              <Tag color="cyan">
                {loanCalc.installmentCount} Payments ({frequency})
              </Tag>
            )}
          </div>
        }
        open={scheduleModalOpen}
        onOk={() => setScheduleModalOpen(false)}
        onCancel={() => setScheduleModalOpen(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setScheduleModalOpen(false)}>
            Close
          </Button>,
        ]}
      >
        {loanCalc && (
          <div>
            <div className="mb-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap justify-between gap-3 text-xs">
              <div>
                Principal:{" "}
                <strong>{formatCurrency(loanCalc.principalAmount)}</strong>
              </div>
              <div>
                Charge: <strong>{formatCurrency(loanCalc.chargeAmount)}</strong>
              </div>
              <div>
                Total:{" "}
                <strong className="text-emerald-700 font-bold">
                  {formatCurrency(loanCalc.totalPayable)}
                </strong>
              </div>
              <div>
                Regular:{" "}
                <strong>
                  {formatCurrency(loanCalc.regularInstallmentAmount)}
                </strong>
              </div>
              <div>
                Final:{" "}
                <strong className="text-purple-700 font-bold">
                  {formatCurrency(loanCalc.lastInstallmentAmount)}
                </strong>
              </div>
            </div>

            <Table
              dataSource={loanCalc.schedule}
              columns={scheduleColumns}
              rowKey="installmentNo"
              pagination={{ pageSize: 12, showSizeChanger: false }}
              size="small"
              className="border border-slate-100 rounded-lg"
            />
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
