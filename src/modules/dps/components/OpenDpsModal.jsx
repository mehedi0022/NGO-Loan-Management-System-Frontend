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
  Tag,
  Typography,
  message,
} from "antd";
import { DollarOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useCreateDpsAccountMutation } from "../dpsApi.js";
import { useGetAllMembersQuery } from "../../members/membersApi.js";
import { formatCurrency } from "../../loans/loanFormatters.js";

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
  if (!fromDate || targetDayIndex === undefined) return fromDate || dayjs();
  let next = fromDate;
  while (next.day() !== targetDayIndex) {
    next = next.add(1, "day");
  }
  return next;
};

const MONTHLY_TENURE_OPTIONS = [
  { label: "1 Year (12 Months)", value: 12 },
  { label: "2 Years (24 Months)", value: 24 },
  { label: "3 Years (36 Months)", value: 36 },
  { label: "5 Years (60 Months)", value: 60 },
  { label: "7 Years (84 Months)", value: 84 },
  { label: "10 Years (120 Months)", value: 120 },
];

const WEEKLY_TENURE_OPTIONS = [
  { label: "1 Year (52 Weeks / 12 Months)", value: 12 },
  { label: "2 Years (104 Weeks / 24 Months)", value: 24 },
  { label: "3 Years (156 Weeks / 36 Months)", value: 36 },
  { label: "5 Years (260 Weeks / 60 Months)", value: 60 },
  { label: "7 Years (364 Weeks / 84 Months)", value: 84 },
  { label: "10 Years (520 Weeks / 120 Months)", value: 120 },
];

const MONTHLY_PRESET_AMOUNTS = [500, 1000, 1500, 2000, 2500, 3000, 5000];
const WEEKLY_PRESET_AMOUNTS = [100, 200, 250, 500, 1000, 1500, 2000];

export function OpenDpsModal({ open, onClose, member, onSuccess }) {
  const [form] = Form.useForm();
  const [createDps, { isLoading }] = useCreateDpsAccountMutation();
  const [memberSearch, setMemberSearch] = useState("");

  const { data: membersData, isFetching: membersFetching } =
    useGetAllMembersQuery(
      {
        page: 1,
        limit: 100,
        search: memberSearch || undefined,
        status: "ACTIVE",
      },
      { skip: !open || Boolean(member) },
    );

  const [frequency, setFrequency] = useState("MONTHLY");
  const [installmentAmount, setInstallmentAmount] = useState(1000);
  const [durationMonths, setDurationMonths] = useState(60);
  const [interestRate, setInterestRate] = useState(8.5);

  const selectedMemberId = Form.useWatch("memberId", form);
  const activeMember =
    member ||
    (membersData?.data ?? []).find(
      (m) => String(m.id) === String(selectedMemberId),
    );
  const somitiMeetingDay = activeMember?.somiti?.meetingDay;
  const somitiDayIndex = somitiMeetingDay
    ? SOMITI_DAY_MAP[somitiMeetingDay]
    : undefined;

  useEffect(() => {
    if (open) {
      const initialMeetingDay = member?.somiti?.meetingDay;
      const initialDayIndex = initialMeetingDay
        ? SOMITI_DAY_MAP[initialMeetingDay]
        : undefined;

      const initialStartDate =
        initialDayIndex !== undefined
          ? getNextSomitiDay(dayjs(), initialDayIndex)
          : dayjs();

      form.setFieldsValue({
        memberId: member?.id,
        frequency: "MONTHLY",
        installmentAmount: 1000,
        durationMonths: 60,
        interestRate: 8.5,
        startDate: initialStartDate,
        notes: "",
      });
      setFrequency("MONTHLY");
      setInstallmentAmount(1000);
      setDurationMonths(60);
      setInterestRate(8.5);
    }
  }, [open, form, member]);

  const handleMemberChange = (newMemberId) => {
    if (!newMemberId) return;
    const mem = (membersData?.data ?? []).find(
      (m) => String(m.id) === String(newMemberId),
    );
    if (mem?.somiti?.meetingDay) {
      const dayIdx = SOMITI_DAY_MAP[mem.somiti.meetingDay];
      if (dayIdx !== undefined) {
        form.setFieldsValue({
          startDate: getNextSomitiDay(dayjs(), dayIdx),
        });
      }
    }
  };

  const isWeekly = frequency === "WEEKLY";
  const installmentCount = isWeekly
    ? Math.round((durationMonths / 12) * 52)
    : durationMonths;

  const totalPrincipal = installmentAmount * installmentCount;
  // Statutory Recurring Deposit interest formula:
  // Monthly: (P * n * (n + 1) * r) / (2 * 12 * 100) = 2400
  // Weekly:  (P * n * (n + 1) * r) / (2 * 52 * 100) = 10400
  const divisor = isWeekly ? 10400 : 2400;
  const estimatedProfit =
    (installmentAmount * installmentCount * (installmentCount + 1) * interestRate) /
    divisor;
  const estimatedMaturity = totalPrincipal + estimatedProfit;

  const presetAmounts = isWeekly ? WEEKLY_PRESET_AMOUNTS : MONTHLY_PRESET_AMOUNTS;
  const tenureOptions = isWeekly ? WEEKLY_TENURE_OPTIONS : MONTHLY_TENURE_OPTIONS;

  const handleSubmit = async (values) => {
    const targetMemberId = member?.id || values.memberId;
    if (!targetMemberId) {
      message.error("Please select a member");
      return;
    }

    try {
      await createDps({
        memberId: Number(targetMemberId),
        frequency: values.frequency || frequency || "MONTHLY",
        installmentAmount: Number(values.installmentAmount),
        durationMonths: Number(values.durationMonths),
        interestRate: Number(values.interestRate),
        startDate: values.startDate
          ? values.startDate.format("YYYY-MM-DD")
          : dayjs().format("YYYY-MM-DD"),
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
          <SafetyCertificateOutlined
            style={{ color: "#0284c7", fontSize: 18 }}
          />
          <span>
            {member
              ? `Open New DPS Account — ${member.fullName}`
              : "Open New DPS Account"}
          </span>
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
          frequency: "MONTHLY",
          installmentAmount: 1000,
          durationMonths: 60,
          interestRate: 8.5,
          startDate: dayjs(),
        }}
      >
        {member ? (
          <div style={{ marginBottom: 16 }}>
            <Typography.Text type="secondary">Member ID: </Typography.Text>
            <Typography.Text strong>
              {member.memberId || `ID: ${member.id}`}
            </Typography.Text>
            <span style={{ margin: "0 8px" }}>•</span>
            <Typography.Text type="secondary">Somiti: </Typography.Text>
            <Typography.Text strong>
              {member.somiti?.name || "—"}
            </Typography.Text>
            {member.somiti?.meetingDay && (
              <>
                <span style={{ margin: "0 8px" }}>•</span>
                <Tag color="blue">Day: {member.somiti.meetingDay}</Tag>
              </>
            )}
          </div>
        ) : (
          <>
            <Form.Item
              name="memberId"
              label="Select Member"
              rules={[
                { required: true, message: "Please select a member to open DPS" },
              ]}
            >
              <Select
                showSearch
                allowClear
                loading={membersFetching}
                optionFilterProp="label"
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
                onSearch={setMemberSearch}
                onChange={handleMemberChange}
                placeholder="Search by member name, ID, or mobile"
                notFoundContent={
                  membersFetching ? "Searching..." : "No member found"
                }
                options={(membersData?.data ?? []).map((m) => ({
                  value: m.id,
                  label: `${m.fullName} (${m.memberId || `#${m.id}`}) — ${m.mobileNumber}`,
                }))}
              />
            </Form.Item>
            {activeMember && (
              <div style={{ marginTop: -12, marginBottom: 16 }}>
                <Typography.Text type="secondary">Somiti: </Typography.Text>
                <Typography.Text strong>
                  {activeMember.somiti?.name || "—"}
                </Typography.Text>
                {activeMember.somiti?.meetingDay && (
                  <>
                    <span style={{ margin: "0 8px" }}>•</span>
                    <Tag color="blue">Meeting Day: {activeMember.somiti.meetingDay}</Tag>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* Deposit Frequency Toggle */}
        <Form.Item
          name="frequency"
          label="Deposit Frequency"
          rules={[{ required: true }]}
        >
          <Radio.Group
            value={frequency}
            onChange={(e) => {
              const newFreq = e.target.value;
              setFrequency(newFreq);
              form.setFieldsValue({ frequency: newFreq });

              // Auto switch default amounts cleanly
              if (newFreq === "WEEKLY" && installmentAmount === 1000) {
                setInstallmentAmount(250);
                form.setFieldsValue({ installmentAmount: 250 });
              } else if (newFreq === "MONTHLY" && installmentAmount === 250) {
                setInstallmentAmount(1000);
                form.setFieldsValue({ installmentAmount: 1000 });
              }
            }}
            buttonStyle="solid"
          >
            <Radio.Button value="MONTHLY">Monthly DPS</Radio.Button>
            <Radio.Button value="WEEKLY">Weekly DPS</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {/* Preset Amount Selector */}
        <Form.Item
          label={`Preset ${isWeekly ? "Weekly" : "Monthly"} Deposit Amount`}
        >
          <div className="overflow-x-auto max-w-full pb-1">
            <Radio.Group
              value={
                presetAmounts.includes(installmentAmount)
                  ? installmentAmount
                  : null
              }
              onChange={(e) => {
                const val = e.target.value;
                setInstallmentAmount(val);
                form.setFieldsValue({ installmentAmount: val });
              }}
              optionType="button"
              buttonStyle="solid"
              size="small"
            >
              {presetAmounts.map((amt) => (
                <Radio.Button key={amt} value={amt}>
                  ৳{amt.toLocaleString()}
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="installmentAmount"
              label={`${isWeekly ? "Weekly" : "Monthly"} Installment Amount (৳)`}
              rules={[
                {
                  required: true,
                  message: `Please enter ${isWeekly ? "weekly" : "monthly"} installment amount`,
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={50}
                max={100000}
                step={50}
                prefix="৳"
                onChange={(val) => setInstallmentAmount(Number(val) || 0)}
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
                options={tenureOptions}
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
              label={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <span>First Installment Date</span>
                  {somitiMeetingDay && (
                    <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                      Somiti: {somitiMeetingDay}
                    </Tag>
                  )}
                </div>
              }
              rules={[{ required: true, message: "Please select start date" }]}
              extra={
                somitiMeetingDay
                  ? `Deposit schedule aligns with member's Somiti meeting day (${somitiMeetingDay}).`
                  : undefined
              }
            >
              <DatePicker
                style={{ width: "100%" }}
                format="DD MMM YYYY"
                disabledDate={(current) => {
                  if (!current) return false;
                  const isPast = current.isBefore(dayjs().startOf("day"));
                  if (somitiDayIndex !== undefined) {
                    return isPast || current.day() !== somitiDayIndex;
                  }
                  return isPast;
                }}
              />
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
                title={`Total Principal (${installmentCount} Inst.)`}
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
                valueStyle={{
                  color: "#047857",
                  fontWeight: 700,
                  fontSize: 18,
                }}
              />
            </Col>
          </Row>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>
            💡 Depositing{" "}
            <strong>{formatCurrency(installmentAmount)}</strong>/
            {isWeekly ? "week" : "month"} for{" "}
            <strong>
              {installmentCount} {isWeekly ? "weeks" : "months"}
            </strong>{" "}
            ({durationMonths / 12} years) at <strong>{interestRate}%</strong>{" "}
            interest yield.
          </div>
        </Card>

        <Form.Item name="notes" label="Notes / Comments">
          <Input.TextArea
            rows={2}
            placeholder="Optional notes for this DPS account"
          />
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
