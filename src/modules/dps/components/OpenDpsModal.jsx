import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Statistic,
  Typography,
  message,
} from "antd";
import { DollarOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useCreateDpsAccountMutation } from "../dpsApi.js";
import { useGetAllMembersQuery } from "../../members/membersApi.js";
import { formatCurrency } from "../../loans/loanFormatters.js";

const TENURE_OPTIONS = [
  { label: "1 Year (12 Months)", value: 12 },
  { label: "2 Years (24 Months)", value: 24 },
  { label: "3 Years (36 Months)", value: 36 },
  { label: "5 Years (60 Months)", value: 60 },
  { label: "7 Years (84 Months)", value: 84 },
  { label: "10 Years (120 Months)", value: 120 },
];

const PRESET_AMOUNTS = [500, 1000, 1500, 2000, 2500, 3000, 5000];

export function OpenDpsModal({ open, onClose, member, onSuccess }) {
  const [form] = Form.useForm();
  const [createDps, { isLoading }] = useCreateDpsAccountMutation();
  const [memberSearch, setMemberSearch] = useState("");

  const { data: membersData, isFetching: membersFetching } = useGetAllMembersQuery(
    {
      page: 1,
      limit: 20,
      search: memberSearch || undefined,
      status: "ACTIVE",
    },
    { skip: !open || Boolean(member) },
  );

  const [monthlyAmount, setMonthlyAmount] = useState(1000);
  const [durationMonths, setDurationMonths] = useState(60);
  const [interestRate, setInterestRate] = useState(8.5);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        memberId: member?.id,
        installmentAmount: 1000,
        durationMonths: 60,
        interestRate: 8.5,
        startDate: dayjs(),
        notes: "",
      });
      setMonthlyAmount(1000);
      setDurationMonths(60);
      setInterestRate(8.5);
    }
  }, [open, form, member]);

  const totalPrincipal = monthlyAmount * durationMonths;
  // Statutory Recurring Deposit interest formula: (P * n * (n + 1) * r) / 2400
  const estimatedProfit =
    (monthlyAmount * durationMonths * (durationMonths + 1) * interestRate) / 2400;
  const estimatedMaturity = totalPrincipal + estimatedProfit;

  const handleSubmit = async (values) => {
    const targetMemberId = member?.id || values.memberId;
    if (!targetMemberId) {
      message.error("Please select a member");
      return;
    }

    try {
      await createDps({
        memberId: Number(targetMemberId),
        installmentAmount: Number(values.installmentAmount),
        durationMonths: Number(values.durationMonths),
        interestRate: Number(values.interestRate),
        startDate: values.startDate ? values.startDate.toISOString() : new Date().toISOString(),
        notes: values.notes,
      }).unwrap();

      message.success("DPS account opened successfully!");
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      message.error(err?.data?.message || "Failed to open DPS account");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: "#0284c7", fontSize: 18 }} />
          <span>{member ? `Open New DPS Account — ${member.fullName}` : "Open New DPS Account"}</span>
        </Space>
      }
      footer={null}
      destroyOnClose
      width={680}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          memberId: member?.id,
          installmentAmount: 1000,
          durationMonths: 60,
          interestRate: 8.5,
          startDate: dayjs(),
        }}
      >
        {member ? (
          <div style={{ marginBottom: 16 }}>
            <Typography.Text type="secondary">Member ID: </Typography.Text>
            <Typography.Text strong>{member.memberId || `ID: ${member.id}`}</Typography.Text>
            <span style={{ margin: "0 8px" }}>•</span>
            <Typography.Text type="secondary">Somiti: </Typography.Text>
            <Typography.Text strong>{member.somiti?.name || "—"}</Typography.Text>
          </div>
        ) : (
          <Form.Item
            name="memberId"
            label="Select Member"
            rules={[{ required: true, message: "Please select a member to open DPS" }]}
          >
            <Select
              showSearch
              allowClear
              loading={membersFetching}
              filterOption={false}
              onSearch={setMemberSearch}
              placeholder="Search by member name, ID, or mobile"
              notFoundContent={membersFetching ? "Searching..." : "No member found"}
              options={(membersData?.data ?? []).map((m) => ({
                value: m.id,
                label: `${m.fullName} (${m.memberId || `#${m.id}`}) — ${m.mobileNumber}`,
              }))}
            />
          </Form.Item>
        )}

        {/* Preset Amount Selector */}
        <Form.Item label="Preset Monthly Deposit">
          <Radio.Group
            value={PRESET_AMOUNTS.includes(monthlyAmount) ? monthlyAmount : null}
            onChange={(e) => {
              const val = e.target.value;
              setMonthlyAmount(val);
              form.setFieldsValue({ installmentAmount: val });
            }}
            optionType="button"
            buttonStyle="solid"
            size="small"
          >
            {PRESET_AMOUNTS.map((amt) => (
              <Radio.Button key={amt} value={amt}>
                ৳{amt.toLocaleString()}
              </Radio.Button>
            ))}
          </Radio.Group>
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="installmentAmount"
              label="Monthly Installment Amount (৳)"
              rules={[{ required: true, message: "Please enter monthly installment amount" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={100}
                max={100000}
                step={100}
                prefix="৳"
                onChange={(val) => setMonthlyAmount(Number(val) || 0)}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="durationMonths"
              label="DPS Duration / Tenure"
              rules={[{ required: true, message: "Please select duration" }]}
            >
              <Select
                options={TENURE_OPTIONS}
                onChange={(val) => setDurationMonths(Number(val))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="interestRate"
              label="Annual Profit Rate (%)"
              rules={[{ required: true, message: "Please enter profit rate" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                max={25}
                step={0.5}
                suffix="%"
                onChange={(val) => setInterestRate(Number(val) || 0)}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="startDate"
              label="Start Date"
              rules={[{ required: true, message: "Please select start date" }]}
            >
              <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
            </Form.Item>
          </Col>
        </Row>

        {/* Real-time Calculation Projection Card */}
        <Card
          size="small"
          style={{
            background: "#f0fdf4",
            borderColor: "#86efac",
            marginBottom: 20,
          }}
        >
          <Row gutter={16} align="middle">
            <Col xs={8}>
              <Statistic
                title="Total Principal"
                value={totalPrincipal}
                precision={2}
                prefix="৳"
                valueStyle={{ color: "#1e293b", fontSize: 16 }}
              />
            </Col>
            <Col xs={8}>
              <Statistic
                title="Estimated Profit"
                value={estimatedProfit}
                precision={2}
                prefix="৳"
                valueStyle={{ color: "#0284c7", fontSize: 16 }}
              />
            </Col>
            <Col xs={8}>
              <Statistic
                title="Maturity Value"
                value={estimatedMaturity}
                precision={2}
                prefix="৳"
                valueStyle={{ color: "#047857", fontWeight: 700, fontSize: 18 }}
              />
            </Col>
          </Row>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>
            💡 Depositing <strong>{formatCurrency(monthlyAmount)}</strong>/month for{" "}
            <strong>{durationMonths} months</strong> ({durationMonths / 12} years) at{" "}
            <strong>{interestRate}%</strong> interest yield.
          </div>
        </Card>

        <Form.Item name="notes" label="Notes / Comments">
          <Input.TextArea rows={2} placeholder="Optional notes for this DPS account" />
        </Form.Item>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Confirm & Open DPS
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
