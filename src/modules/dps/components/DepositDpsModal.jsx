import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CheckCircleFilled,
  DollarOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import {
  useDepositDpsInstallmentMutation,
  useGetDpsAccountByIdQuery,
} from "../dpsApi.js";
import { formatCurrency } from "../../loans/loanFormatters.js";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "MOBILE_PAYMENT", label: "Mobile Payment (bKash/Nagad)" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

export function DepositDpsModal({
  open,
  onClose,
  dpsAccount,
  member,
  onSuccess,
}) {
  const [form] = Form.useForm();
  const [depositDps, { isLoading }] = useDepositDpsInstallmentMutation();
  const [userEditedAmount, setUserEditedAmount] = useState(false);

  // Fetch full account details including installments schedule
  const { data: detailsData } = useGetDpsAccountByIdQuery(dpsAccount?.id, {
    skip: !open || !dpsAccount?.id,
  });

  const activeAccount = detailsData?.data || dpsAccount;
  const displayMember = member || activeAccount?.member;
  const isWeekly = activeAccount?.frequency === "WEEKLY";
  const targetAmount = Number(activeAccount?.installmentAmount || 0);

  const totalInstallments = isWeekly
    ? Math.round(((activeAccount?.durationMonths || 12) / 12) * 52)
    : activeAccount?.durationMonths || 12;

  // Find the first unpaid / partial installment from schedule
  const unpaidInstallment = (activeAccount?.installments || []).find(
    (inst) => inst.status !== "PAID",
  );

  // Fallback math calculation based on totalPaidAmount
  const totalPaid = Number(activeAccount?.totalPaidAmount || 0);
  const mathRemainder = targetAmount > 0 ? totalPaid % targetAmount : 0;
  const mathDue =
    mathRemainder > 0 ? targetAmount - mathRemainder : targetAmount;

  const currentInstallmentNo = unpaidInstallment
    ? unpaidInstallment.installmentNo
    : Math.min((activeAccount?.paidInstallments || 0) + 1, totalInstallments);

  const alreadyPaidInCurrent = unpaidInstallment
    ? Number(unpaidInstallment.paidAmount || 0)
    : mathRemainder;

  const remainingDueInCurrent = unpaidInstallment
    ? Math.max(
        0,
        Number(unpaidInstallment.amount || targetAmount) - alreadyPaidInCurrent,
      )
    : mathDue;

  const isPartial = alreadyPaidInCurrent > 0 && remainingDueInCurrent > 0;
  const suggestedAmount =
    remainingDueInCurrent > 0 ? remainingDueInCurrent : targetAmount;

  useEffect(() => {
    if (open && activeAccount) {
      if (!userEditedAmount) {
        form.setFieldsValue({
          amount: suggestedAmount || (isWeekly ? 250 : 1000),
          paymentMethod: "CASH",
          transactionDate: dayjs(),
          reference: "",
          notes: "",
        });
      }
    } else {
      setUserEditedAmount(false);
    }
  }, [
    open,
    activeAccount?.id,
    suggestedAmount,
    form,
    isWeekly,
    userEditedAmount,
  ]);

  const handleSubmit = async (values) => {
    try {
      await depositDps({
        id: activeAccount.id,
        amount: Number(values.amount),
        paymentMethod: values.paymentMethod,
        transactionDate: values.transactionDate
          ? values.transactionDate.toISOString()
          : new Date().toISOString(),
        reference: values.reference,
        notes: values.notes,
      }).unwrap();

      message.success("DPS installment collected successfully!");
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      message.error(err?.data?.message || "Failed to record DPS deposit");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <Space>
          <DollarOutlined style={{ color: "#047857", fontSize: 18 }} />
          <span>
            Collect DPS Installment —{" "}
            {activeAccount?.dpsNumber || `DPS #${activeAccount?.id}`}
          </span>
        </Space>
      }
      footer={null}
      destroyOnClose
      width={560}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* Info Card */}
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            padding: "12px 14px",
            borderRadius: 6,
            marginBottom: 16,
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          {displayMember && (
            <div style={{ marginBottom: 4 }}>
              <strong>Member: </strong>
              <span style={{ fontWeight: 600, color: "#1e293b" }}>
                {displayMember.fullName}
              </span>
              <span style={{ color: "#64748b", marginLeft: 4 }}>
                ({displayMember.memberId || `#${displayMember.id}`})
              </span>
              {displayMember.somiti?.name && (
                <span style={{ color: "#475569", marginLeft: 6 }}>
                  · 🏷️ {displayMember.somiti.name}
                </span>
              )}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4px 12px",
              marginTop: 4,
            }}
          >
            <div>
              <strong>DPS Number: </strong>
              <span style={{ color: "#0284c7", fontWeight: 700 }}>
                {activeAccount?.dpsNumber || `DPS #${activeAccount?.id}`}
              </span>
            </div>
            <div>
              <strong>Frequency: </strong>
              <Tag
                color={isWeekly ? "blue" : "purple"}
                style={{ fontSize: 10, lineHeight: "16px" }}
              >
                {isWeekly ? "Weekly" : "Monthly"}
              </Tag>
            </div>
            <div>
              <strong>{isWeekly ? "Weekly" : "Monthly"} Target: </strong>
              <span style={{ fontWeight: 700, color: "#047857" }}>
                {formatCurrency(targetAmount)}
              </span>
            </div>
            <div>
              <strong>Progress: </strong>
              <span>
                {activeAccount?.paidInstallments || 0} of {totalInstallments}{" "}
                {isWeekly ? "wks" : "mos"} paid
              </span>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <strong>Total Deposited: </strong>
              <span style={{ fontWeight: 700, color: "#047857" }}>
                {formatCurrency(activeAccount?.totalPaidAmount)}
              </span>
            </div>

            {isPartial && (
              <div
                style={{
                  gridColumn: "span 2",
                  background: "#ecfdf5",
                  border: "1px dashed #6ee7b7",
                  padding: "6px 10px",
                  borderRadius: 6,
                  marginTop: 6,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#065f46", fontSize: 12 }}>
                  ⚡ <strong>Installment #{currentInstallmentNo} Status:</strong>
                </span>
                <span style={{ fontSize: 12, color: "#047857" }}>
                  {formatCurrency(alreadyPaidInCurrent)} Paid ·{" "}
                  <strong style={{ color: "#065f46" }}>
                    {formatCurrency(remainingDueInCurrent)} Due to Complete
                  </strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Clear Advance / Partial Alert Banner */}
        {isPartial && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: 8,
              padding: "12px 14px",
              marginBottom: 16,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <CheckCircleFilled
              style={{ color: "#16a34a", fontSize: 18, marginTop: 2 }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 4,
                }}
              >
                <strong style={{ color: "#15803d", fontSize: 13 }}>
                  Advance / Partial Deposit Detected (Installment #{currentInstallmentNo})
                </strong>
                <Tag
                  color="success"
                  style={{ margin: 0, fontWeight: 600 }}
                >
                  ৳{alreadyPaidInCurrent.toLocaleString()} Paid in Advance
                </Tag>
              </div>
              <div
                style={{
                  color: "#166534",
                  fontSize: 12,
                  marginTop: 4,
                  lineHeight: 1.5,
                }}
              >
                From previous deposits,{" "}
                <strong>{formatCurrency(alreadyPaidInCurrent)}</strong> has
                already been credited to this installment. To complete this{" "}
                {isWeekly ? "week's" : "month's"} installment, member only
                needs to deposit{" "}
                <strong
                  style={{
                    fontSize: 14,
                    color: "#14532d",
                    textDecoration: "underline",
                  }}
                >
                  {formatCurrency(remainingDueInCurrent)}
                </strong>{" "}
                to mark it fully PAID.
              </div>
            </div>
          </div>
        )}

        {/* Quick Amount Buttons */}
        {targetAmount > 0 && (
          <div style={{ marginBottom: 14 }}>
            <Typography.Text
              type="secondary"
              style={{ fontSize: 11, marginRight: 8 }}
            >
              Quick Fill:
            </Typography.Text>
            <Space size="small" wrap>
              {isPartial && (
                <Button
                  size="small"
                  type="primary"
                  style={{ background: "#059669", borderColor: "#059669" }}
                  onClick={() => {
                    setUserEditedAmount(true);
                    form.setFieldsValue({ amount: remainingDueInCurrent });
                  }}
                >
                  🎯 Due for #{currentInstallmentNo} (
                  {formatCurrency(remainingDueInCurrent)})
                </Button>
              )}
              <Button
                size="small"
                onClick={() => {
                  setUserEditedAmount(true);
                  form.setFieldsValue({ amount: targetAmount });
                }}
              >
                Full Target ({formatCurrency(targetAmount)})
              </Button>
              {isPartial && (
                <Button
                  size="small"
                  onClick={() => {
                    setUserEditedAmount(true);
                    form.setFieldsValue({
                      amount: remainingDueInCurrent + targetAmount,
                    });
                  }}
                >
                  Due #{currentInstallmentNo} + Next 1x (
                  {formatCurrency(remainingDueInCurrent + targetAmount)})
                </Button>
              )}
              <Button
                size="small"
                onClick={() => {
                  setUserEditedAmount(true);
                  form.setFieldsValue({ amount: targetAmount * 2 });
                }}
              >
                2x Target ({formatCurrency(targetAmount * 2)})
              </Button>
              {isWeekly && (
                <Button
                  size="small"
                  onClick={() => {
                    setUserEditedAmount(true);
                    form.setFieldsValue({ amount: targetAmount * 4 });
                  }}
                >
                  4x Target ({formatCurrency(targetAmount * 4)})
                </Button>
              )}
            </Space>
          </div>
        )}

        <Form.Item
          name="amount"
          label={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                alignItems: "center",
              }}
            >
              <span>{isWeekly ? "Weekly" : "Monthly"} Deposit Amount (৳)</span>
              {isPartial ? (
                <Tag
                  color="green"
                  style={{ margin: 0, fontSize: 11, fontWeight: 700 }}
                >
                  💡 Only {formatCurrency(remainingDueInCurrent)} completes #
                  {currentInstallmentNo}
                </Tag>
              ) : (
                <span style={{ color: "#64748b", fontSize: 11 }}>
                  Target: {formatCurrency(targetAmount)}
                </span>
              )}
            </div>
          }
          extra={
            isPartial ? (
              <span
                style={{
                  color: "#15803d",
                  fontSize: 11,
                  display: "block",
                  marginTop: 3,
                }}
              >
                ✓ Suggested{" "}
                <strong>{formatCurrency(remainingDueInCurrent)}</strong> will
                fulfill the rest of Installment #{currentInstallmentNo}. Any
                extra amount cascades to upcoming installments automatically.
              </span>
            ) : (
              <span
                style={{
                  color: "#64748b",
                  fontSize: 11,
                  display: "block",
                  marginTop: 3,
                }}
              >
                Regular target: {formatCurrency(targetAmount)} /{" "}
                {isWeekly ? "week" : "month"}. Extra amount will cascade to
                upcoming installments automatically.
              </span>
            )
          }
          rules={[{ required: true, message: "Please enter deposit amount" }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={1}
            step={isWeekly ? 50 : 100}
            prefix="৳"
            onChange={() => setUserEditedAmount(true)}
          />
        </Form.Item>

        {/* Non-editable Next Installment Indicator with Progress */}
        <Form.Item
          label="Next Due Installment"
          tooltip="Installments are automatically allocated in chronological order via waterfall cascade"
        >
          <div
            style={{
              padding: "10px 14px",
              background: isPartial ? "#f0fdf4" : "#f1f5f9",
              border: `1px solid ${isPartial ? "#86efac" : "#cbd5e1"}`,
              borderRadius: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}
              >
                Installment #{currentInstallmentNo} of {totalInstallments}
              </span>
              {isPartial ? (
                <Space size={4}>
                  <Tag color="orange" style={{ margin: 0, fontWeight: 600 }}>
                    ৳{alreadyPaidInCurrent.toLocaleString()} Partial Paid
                  </Tag>
                  <Tag color="green" style={{ margin: 0, fontWeight: 700 }}>
                    ৳{remainingDueInCurrent.toLocaleString()} Due
                  </Tag>
                </Space>
              ) : (
                <Tag color="cyan" style={{ margin: 0, fontWeight: 500 }}>
                  Auto Managed
                </Tag>
              )}
            </div>

            {isPartial && (
              <div style={{ marginTop: 8 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    color: "#475569",
                    marginBottom: 3,
                  }}
                >
                  <span>
                    Paid: <strong>{formatCurrency(alreadyPaidInCurrent)}</strong>{" "}
                    of {formatCurrency(targetAmount)}
                  </span>
                  <span style={{ color: "#059669", fontWeight: 700 }}>
                    Remaining:{" "}
                    <strong>{formatCurrency(remainingDueInCurrent)}</strong>
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: 6,
                    background: "#cbd5e1",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (alreadyPaidInCurrent / (targetAmount || 1)) * 100,
                        ),
                      )}%`,
                      height: "100%",
                      background: "#10b981",
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </Form.Item>

        <Form.Item name="paymentMethod" label="Payment Method">
          <Select options={PAYMENT_METHODS} />
        </Form.Item>

        <Form.Item name="transactionDate" label="Deposit Date">
          <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
        </Form.Item>

        <Form.Item name="reference" label="Receipt / Voucher Number">
          <Input placeholder="e.g. REC-00042" />
        </Form.Item>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={2} placeholder="Optional notes" />
        </Form.Item>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Confirm Deposit
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
