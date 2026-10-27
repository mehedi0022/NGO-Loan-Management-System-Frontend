import {
  Alert,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Tag,
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
  const member = installment?.loan?.member || installment?.member;
  const isDpsOnly = Boolean(
    installment?.isDpsOnly || (installment && !installment?.loanId),
  );

  const remaining = Math.max(
    0,
    Number(installment?.amount || 0) - Number(installment?.paidAmount || 0),
  );

  const loanAmount = Form.useWatch("loanCollectionAmount", form) || 0;
  const generalSavings = Form.useWatch("generalSavingsAmount", form) || 0;
  const specialSavings = Form.useWatch("specialSavingsAmount", form) || 0;
  const dpsAmount = Form.useWatch("dpsAmount", form) || 0;
  const dpsAmounts = Form.useWatch("dpsAmounts", form) || {};
  const collectionDate = Form.useWatch("collectionDate", form);
  const activeDpsList = useMemo(
    () => (member?.dpsAccounts || []).filter((d) => d.status === "ACTIVE"),
    [member],
  );

  const effectiveDpsAmount = useMemo(() => {
    if (activeDpsList.length > 1) {
      return Object.values(dpsAmounts).reduce(
        (sum, val) => sum + toAmount(val),
        0,
      );
    }
    return toAmount(dpsAmount);
  }, [activeDpsList.length, dpsAmounts, dpsAmount]);

  const activeDps = activeDpsList[0];

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
    effectiveDpsAmount;

  useEffect(() => {
    if (!open || !installment) return;

    const initDpsAmounts = {};
    activeDpsList.forEach((d) => {
      initDpsAmounts[d.id] = 0;
    });

    form.setFieldsValue({
      loanCollectionAmount: remaining,
      generalSavingsAmount: 0,
      specialSavingsAmount: 0,
      dpsAmount: 0,
      dpsAmounts: initDpsAmounts,
      dpsAccountId: activeDps?.id || undefined,
      collectionDate: dayjs(),
      paymentMethod: "CASH",
      allowAdvance: false,
      reference: undefined,
      notes: undefined,
    });
  }, [form, installment, open, remaining, activeDpsList, activeDps]);

  const submit = async (values) => {
    let dpsCollections = undefined;
    let finalDpsAmount = 0;
    let finalDpsAccountId = undefined;

    if (activeDpsList.length > 1) {
      const amountsMap = values.dpsAmounts || {};
      dpsCollections = activeDpsList
        .map((dps) => ({
          dpsAccountId: dps.id,
          amount: toAmount(amountsMap[dps.id] || 0),
        }))
        .filter((d) => d.amount > 0);
      finalDpsAmount = dpsCollections.reduce((sum, d) => sum + d.amount, 0);
      finalDpsAccountId = dpsCollections[0]?.dpsAccountId || activeDpsList[0]?.id;
    } else if (activeDpsList.length === 1) {
      finalDpsAmount = toAmount(values.dpsAmount);
      finalDpsAccountId = activeDpsList[0].id;
      if (finalDpsAmount > 0) {
        dpsCollections = [
          { dpsAccountId: finalDpsAccountId, amount: finalDpsAmount },
        ];
      }
    }

    await onSubmit({
      memberId: member?.id,

      loanId: installment?.loanId || undefined,
      installmentId: installment?.loanId ? installment.id : undefined,

      loanCollectionAmount: toAmount(values.loanCollectionAmount),
      generalSavingsAmount: toAmount(values.generalSavingsAmount),
      specialSavingsAmount: toAmount(values.specialSavingsAmount),
      dpsAmount: finalDpsAmount,
      dpsAccountId: finalDpsAccountId,
      dpsCollections:
        dpsCollections && dpsCollections.length > 0
          ? dpsCollections
          : undefined,

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
                {isDpsOnly
                  ? "DPS / Savings Only"
                  : `${installment?.loan?.loanId || `#${installment?.loanId}`} / #${installment?.installmentNo}`}
              </div>
            </div>

            <div>
              <Typography.Text type="secondary">
                Installment Amount
              </Typography.Text>

              <div className="font-semibold">
                {isDpsOnly ? "—" : formatCurrency(installment?.amount)}
              </div>
            </div>

            <div>
              <Typography.Text type="secondary">Remaining</Typography.Text>

              <div className="font-semibold">
                {isDpsOnly ? "—" : formatCurrency(remaining)}
              </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Form.Item
            name="loanCollectionAmount"
            label="Loan Collection"
            rules={[
              {
                validator: (_, value) => {
                  if (isDpsOnly) {
                    return Promise.resolve();
                  }
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
              max={isDpsOnly ? 0 : remaining}
              disabled={isDpsOnly}
              placeholder={isDpsOnly ? "No loan" : undefined}
              precision={2}
              prefix="৳"
            />
          </Form.Item>

          <Form.Item
            name="generalSavingsAmount"
            label="General Savings"
            extra={
              member?.savingsAccount?.generalSavingsBalance !== undefined ? (
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  Balance: ৳{Number(member.savingsAccount.generalSavingsBalance).toLocaleString()}
                </span>
              ) : null
            }
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              precision={2}
              prefix="৳"
            />
          </Form.Item>

          <Form.Item
            name="specialSavingsAmount"
            label="Special Savings"
            extra={
              member?.savingsAccount?.specialSavingsBalance !== undefined ? (
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  Balance: ৳{Number(member.savingsAccount.specialSavingsBalance).toLocaleString()}
                </span>
              ) : null
            }
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              precision={2}
              prefix="৳"
            />
          </Form.Item>

          {activeDpsList.length === 0 && (
            <Form.Item name="dpsAmount" label="DPS (No Active Account)">
              <InputNumber
                style={{ width: "100%" }}
                disabled
                placeholder="No active DPS"
                prefix="৳"
              />
            </Form.Item>
          )}

          {activeDpsList.length === 1 && (
            <Form.Item
              name="dpsAmount"
              label={`DPS Deposit (${activeDps.dpsNumber || "DPS"} Due: ৳${activeDpsDue.toLocaleString()}${activeDpsPartialPaid > 0 ? ` [৳${activeDpsPartialPaid.toLocaleString()} adv]` : ""})`}
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
                placeholder={String(activeDpsDue)}
              />
            </Form.Item>
          )}

          {activeDpsList.length > 1 && (
            <div
              className="col-span-1 sm:col-span-2 md:col-span-4"
              style={{
                background: "#f8fafc",
                padding: "12px 14px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: 10,
                  fontSize: 13,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Active DPS Accounts ({activeDpsList.length})</span>
                <Tag color="cyan" style={{ margin: 0 }}>
                  Multiple DPS Supported
                </Tag>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {activeDpsList.map((dps) => {
                  const dTarget = Number(dps.installmentAmount || 0);
                  const dPaid = Number(dps.totalPaidAmount || 0);
                  const dPartial = dTarget > 0 ? dPaid % dTarget : 0;
                  const dDue = dPartial > 0 ? dTarget - dPartial : dTarget;
                  const isWk = dps.frequency === "WEEKLY";

                  return (
                    <Form.Item
                      key={dps.id}
                      name={["dpsAmounts", dps.id]}
                      label={
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            fontSize: 12,
                          }}
                        >
                          <span style={{ fontWeight: 600, color: "#0284c7" }}>
                            {dps.dpsNumber || `DPS-${dps.id}`}
                          </span>
                          <span
                            style={{
                              color: dPartial > 0 ? "#15803d" : "#475569",
                              fontSize: 11,
                            }}
                          >
                            Due: ৳{dDue.toLocaleString()}
                          </span>
                        </div>
                      }
                      extra={
                        dPartial > 0 ? (
                          <span style={{ fontSize: 10, color: "#15803d" }}>
                            ৳{dPartial.toLocaleString()} adv · Target: ৳{dTarget}/
                            {isWk ? "wk" : "mo"}
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, color: "#64748b" }}>
                            Target: ৳{dTarget}/{isWk ? "wk" : "mo"}
                          </span>
                        )
                      }
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        precision={2}
                        prefix="৳"
                        placeholder={String(dDue)}
                      />
                    </Form.Item>
                  );
                })}
              </div>

              <div
                style={{
                  marginTop: 8,
                  textAlign: "right",
                  fontSize: 12,
                  color: "#059669",
                  fontWeight: 600,
                }}
              >
                Total DPS: ৳{effectiveDpsAmount.toLocaleString()}
              </div>
            </div>
          )}
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
