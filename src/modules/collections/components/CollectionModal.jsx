import {
  Alert,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Typography,
  theme,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../../loans/loanFormatters.js";

const paymentMethods = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "MOBILE_PAYMENT", label: "Mobile Payment" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

const toAmount = (value) => Number(value || 0);
export function CollectionModal({
  open,
  installment,
  loading = false,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();
  const { token } = theme.useToken();
  const member = installment?.loan?.member;

  const remaining = Math.max(
    0,
    Number(installment?.amount || 0) - Number(installment?.paidAmount || 0),
  );

  const loanAmount = Form.useWatch("loanCollectionAmount", form) || 0;
  const generalSavings = Form.useWatch("generalSavingsAmount", form) || 0;
  const specialSavings = Form.useWatch("specialSavingsAmount", form) || 0;
  const dpsAmount = Form.useWatch("dpsAmount", form) || 0;
  const collectionDate = Form.useWatch("collectionDate", form);
  const activeDpsList = useMemo(
    () => (member?.dpsAccounts || []).filter((d) => d.status === "ACTIVE"),
    [member],
  );
  const [selectedDpsId, setSelectedDpsId] = useState(null);

  const activeDps =
    activeDpsList.find((d) => d.id === selectedDpsId) || activeDpsList[0];

  const activeDpsTarget = Number(activeDps?.installmentAmount || 0);
  const activeDpsTotalPaid = Number(activeDps?.totalPaidAmount || 0);
  const activeDpsPartialPaid =
    activeDpsTarget > 0 ? activeDpsTotalPaid % activeDpsTarget : 0;
  const activeDpsDue =
    activeDpsPartialPaid > 0
      ? activeDpsTarget - activeDpsPartialPaid
      : activeDpsTarget;

  const isUpcoming = Boolean(
    installment?.dueDate &&
      collectionDate &&
      dayjs(installment.dueDate).startOf("day").isAfter(collectionDate.startOf("day")),
  );

  const total =
    toAmount(loanAmount) +
    toAmount(generalSavings) +
    toAmount(specialSavings) +
    toAmount(dpsAmount);

  useEffect(() => {
    if (!open || !installment) return;

    const defaultDps = activeDpsList[0];
    setSelectedDpsId(defaultDps?.id || null);

    form.setFieldsValue({
      loanCollectionAmount: remaining,
      generalSavingsAmount: 0,
      specialSavingsAmount: 0,
      dpsAmount: 0,
      dpsAccountId: defaultDps?.id || undefined,
      collectionDate: dayjs(),
      paymentMethod: "CASH",
      allowAdvance: false,
      reference: undefined,
      notes: undefined,
    });
  }, [form, installment, open, remaining, activeDpsList]);

  const submit = async (values) => {
    await onSubmit({
      memberId: member?.id,

      loanId: installment.loanId,
      installmentId: installment.id,

      loanCollectionAmount: toAmount(values.loanCollectionAmount),
      generalSavingsAmount: toAmount(values.generalSavingsAmount),
      specialSavingsAmount: toAmount(values.specialSavingsAmount),
      dpsAmount: toAmount(values.dpsAmount),
      dpsAccountId: values.dpsAccountId || activeDps?.id || undefined,

      collectionDate: values.collectionDate.format("YYYY-MM-DD"),
      paymentMethod: values.paymentMethod,
      allowAdvance: Boolean(values.allowAdvance),

      reference: values.reference?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
    });
  };

  return (
    <Modal
      title="Collect Payment"
      open={open}
      okText={`Collect ${formatCurrency(total)}`}
      confirmLoading={loading}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
      width={620}
    >
      {installment && (
        <div
          className="mb-5 rounded-lg border p-4"
          style={{
            backgroundColor: token.colorFillAlter,
            borderColor: token.colorBorderSecondary,
            color: token.colorText,
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Typography.Text type="secondary">Member</Typography.Text>

              <div className="font-semibold">{member?.fullName || "—"}</div>

              <Typography.Text type="secondary" className="text-xs">
                {member?.memberId || "—"}
              </Typography.Text>
            </div>

            <div>
              <Typography.Text type="secondary">
                Loan / Installment
              </Typography.Text>

              <div className="font-semibold">
                {installment.loan?.loanId || `#${installment.loanId}`} / #
                {installment.installmentNo}
              </div>
            </div>

            <div>
              <Typography.Text type="secondary">
                Installment Amount
              </Typography.Text>

              <div className="font-semibold">
                {formatCurrency(installment.amount)}
              </div>
            </div>

            <div>
              <Typography.Text type="secondary">Remaining</Typography.Text>

              <div className="font-semibold">{formatCurrency(remaining)}</div>
            </div>
          </div>
        </div>
      )}

      {isUpcoming && toAmount(loanAmount) > 0 && (
        <Alert
          className="mb-4"
          type="warning"
          showIcon
          message="Upcoming installment"
          description="Confirm advance payment below to collect before the installment due date."
        />
      )}

      <Form form={form} layout="vertical" onFinish={submit}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Form.Item
            name="loanCollectionAmount"
            label="Loan Collection"
            rules={[
              {
                validator: (_, value) => {
                  const amount = toAmount(value);

                  if (amount < 0) {
                    return Promise.reject(
                      new Error("Loan collection cannot be negative"),
                    );
                  }

                  if (amount > remaining) {
                    return Promise.reject(
                      new Error(
                        `Loan collection cannot exceed ${formatCurrency(remaining)}`,
                      ),
                    );
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              max={remaining}
              precision={2}
              prefix="৳"
            />
          </Form.Item>

          <Form.Item name="generalSavingsAmount" label="General Savings">
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              precision={2}
              prefix="৳"
            />
          </Form.Item>

          <Form.Item name="specialSavingsAmount" label="Special Savings">
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              precision={2}
              prefix="৳"
            />
          </Form.Item>

          {activeDpsList.length > 1 && (
            <Form.Item
              name="dpsAccountId"
              label="Select DPS Account"
              rules={[{ required: true, message: "Select DPS account" }]}
              className="sm:col-span-2"
            >
              <Select
                value={selectedDpsId}
                onChange={(val) => {
                  setSelectedDpsId(val);
                  const chosen = activeDpsList.find((d) => d.id === val);
                  if (chosen) {
                    const cTarget = Number(chosen.installmentAmount || 0);
                    const cTotalPaid = Number(chosen.totalPaidAmount || 0);
                    const cPartial =
                      cTarget > 0 ? cTotalPaid % cTarget : 0;
                    const cDue =
                      cPartial > 0 ? cTarget - cPartial : cTarget;
                    form.setFieldsValue({
                      dpsAmount: cDue,
                    });
                  }
                }}
                options={activeDpsList.map((d) => {
                  const isWk = d.frequency === "WEEKLY";
                  const total = isWk
                    ? Math.round(((d.durationMonths || 12) / 12) * 52)
                    : d.durationMonths;
                  const dTarget = Number(d.installmentAmount || 0);
                  const dPaid = Number(d.totalPaidAmount || 0);
                  const dPartial = dTarget > 0 ? dPaid % dTarget : 0;
                  const dDue = dPartial > 0 ? dTarget - dPartial : dTarget;
                  return {
                    value: d.id,
                    label: `${d.dpsNumber || `DPS-${d.id}`} — Due: ৳${dDue.toLocaleString()} (Target: ৳${dTarget.toLocaleString()}/${isWk ? "wk" : "mo"}${dPartial > 0 ? `, ৳${dPartial.toLocaleString()} adv` : ""})`,
                  };
                })}
              />
            </Form.Item>
          )}

          <Form.Item
            name="dpsAmount"
            label={
              activeDps
                ? `DPS Deposit (${activeDps.dpsNumber || "DPS"} Due: ৳${activeDpsDue.toLocaleString()}${activeDpsPartialPaid > 0 ? ` [৳${activeDpsPartialPaid.toLocaleString()} adv]` : ""})`
                : "DPS (No Active Account)"
            }
            extra={
              activeDpsPartialPaid > 0 ? (
                <span style={{ fontSize: 11, color: "#059669" }}>
                  💡 ৳{activeDpsPartialPaid.toLocaleString()} already paid in advance. ৳{activeDpsDue.toLocaleString()} completes this installment.
                </span>
              ) : null
            }
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              precision={2}
              prefix="৳"
              disabled={!activeDps}
              placeholder={activeDps ? String(activeDpsDue) : "No active DPS"}
            />
          </Form.Item>
        </div>

        <div
          className="mb-5 flex items-center justify-between rounded-lg px-4 py-3"
          style={{
            backgroundColor: token.colorFillAlter,
            borderColor: token.colorBorderSecondary,
            color: token.colorText,
          }}
        >
          <Typography.Text strong>Total Collection</Typography.Text>

          <Typography.Title level={4} className="mb-0">
            {formatCurrency(total)}
          </Typography.Title>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Form.Item
            name="collectionDate"
            label="Collection Date"
            rules={[
              {
                required: true,
                message: "Collection date is required",
              },
            ]}
          >
            <DatePicker
              className="w-full"
              format="DD MMM YYYY"
              allowClear={false}
            />
          </Form.Item>

          <Form.Item
            name="paymentMethod"
            label="Payment Method"
            rules={[
              {
                required: true,
                message: "Payment method is required",
              },
            ]}
          >
            <Select options={paymentMethods} />
          </Form.Item>
        </div>

        <Form.Item
          name="allowAdvance"
          valuePropName="checked"
          dependencies={["collectionDate", "loanCollectionAmount"]}
          rules={[
            ({ getFieldValue }) => ({
              validator: (_, checked) => {
                const paymentDate = getFieldValue("collectionDate");
                const amount = toAmount(getFieldValue("loanCollectionAmount"));
                const beforeDueDate = Boolean(
                  paymentDate &&
                    installment?.dueDate &&
                    dayjs(installment.dueDate)
                      .startOf("day")
                      .isAfter(paymentDate.startOf("day")),
                );

                if (amount > 0 && beforeDueDate && !checked) {
                  return Promise.reject(
                    new Error("Confirm advance payment for this upcoming installment"),
                  );
                }

                return Promise.resolve();
              },
            }),
          ]}
        >
          <Checkbox>Confirm this loan amount as an advance payment</Checkbox>
        </Form.Item>

        <Form.Item name="reference" label="Reference (optional)">
          <Input
            maxLength={255}
            placeholder="Transaction or cheque reference"
          />
        </Form.Item>

        <Form.Item name="notes" label="Notes (optional)" className="mb-0">
          <Input.TextArea rows={3} maxLength={2000} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
