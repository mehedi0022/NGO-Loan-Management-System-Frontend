import {
  Alert,
  Avatar,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Typography,
  message,
  theme,
} from "antd";
import {
  BankOutlined,
  SafetyOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useEffect } from "react";

import { formatCurrency } from "../../loans/loanFormatters.js";
import { useWithdrawSavingsMutation } from "../savingsApi.js";

const paymentMethods = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "MOBILE_PAYMENT", label: "Mobile Payment" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

const toAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

export function SavingsWithdrawalModal({
  open,
  member,
  account,
  onClose,
  onSuccess,
}) {
  const { token } = theme.useToken();
  const [form] = Form.useForm();

  const savingsType = Form.useWatch("savingsType", form) || "GENERAL";
  const amount = toAmount(Form.useWatch("amount", form));

  const generalBalance = toAmount(account?.generalSavingsBalance);
  const specialBalance = toAmount(account?.specialSavingsBalance);

  const availableBalance =
    savingsType === "GENERAL" ? generalBalance : specialBalance;

  const balanceAfter = Math.max(0, availableBalance - amount);

  const unavailable = !account || account.status !== "ACTIVE";
  const insufficientBalance = amount > availableBalance;
  const canSubmit =
    !unavailable && amount > 0 && !insufficientBalance && availableBalance > 0;

  const [withdrawSavings, { isLoading }] = useWithdrawSavingsMutation();

  useEffect(() => {
    if (!open) return;

    form.resetFields();

    form.setFieldsValue({
      savingsType: "GENERAL",
      amount: undefined,
      transactionDate: dayjs(),
      paymentMethod: "CASH",
      reference: undefined,
      notes: undefined,
    });
  }, [form, open, member?.id]);

  const handleTypeChange = () => {
    // Prevent an amount entered for one savings type from
    // accidentally being submitted against the other balance.
    form.setFieldValue("amount", undefined);
    form.setFields([
      {
        name: "amount",
        errors: [],
      },
    ]);
  };

  const handleClose = () => {
    if (isLoading) return;

    form.resetFields();
    onClose?.();
  };

  const submit = async () => {
    try {
      const values = await form.validateFields();

      const withdrawalAmount = toAmount(values.amount);

      await withdrawSavings({
        memberId: member.id,
        savingsType: values.savingsType,
        amount: withdrawalAmount,
        transactionDate: values.transactionDate.format("YYYY-MM-DD"),
        paymentMethod: values.paymentMethod,
        ...(values.reference?.trim() && {
          reference: values.reference.trim(),
        }),
        ...(values.notes?.trim() && {
          notes: values.notes.trim(),
        }),
      }).unwrap();

      message.success(
        `${formatCurrency(withdrawalAmount)} withdrawn successfully`,
      );

      form.resetFields();
      onSuccess?.();
      onClose?.();
    } catch (error) {
      if (error?.errorFields) return;

      message.error(error?.data?.message || "Unable to withdraw savings");
    }
  };

  return (
    <Modal
      title={
        <Space size={10}>
          <WalletOutlined />
          <span>Withdraw Savings</span>
        </Space>
      }
      open={open}
      onCancel={handleClose}
      onOk={submit}
      okText="Confirm Withdrawal"
      cancelText="Cancel"
      confirmLoading={isLoading}
      okButtonProps={{
        disabled: !canSubmit,
        danger: true,
      }}
      cancelButtonProps={{
        disabled: isLoading,
      }}
      width={560}
      destroyOnHidden
      maskClosable={!isLoading}
      keyboard={!isLoading}
    >
      {/* Member */}
      <div
        className="mt-5 flex items-center gap-3 rounded-lg border p-3"
        style={{
          backgroundColor: token.colorFillAlter,
          borderColor: token.colorBorderSecondary,
        }}
      >
        <Avatar
          size={44}
          icon={<UserOutlined />}
          style={{
            backgroundColor: token.colorPrimaryBg,
            color: token.colorPrimary,
          }}
        />

        <div className="min-w-0 flex-1">
          <Typography.Text strong className="block">
            {member?.fullName || "Unknown Member"}
          </Typography.Text>

          <Typography.Text type="secondary" className="text-sm">
            {member?.memberId || (member?.id ? `Member #${member.id}` : "—")}
          </Typography.Text>
        </div>

        {account?.status && (
          <Typography.Text
            type={account.status === "ACTIVE" ? "success" : "secondary"}
            strong
          >
            {account.status}
          </Typography.Text>
        )}
      </div>

      {unavailable && (
        <Alert
          className="mt-4"
          type="warning"
          showIcon
          message={
            account
              ? "Savings account is not active"
              : "This member does not have a savings account"
          }
          description={
            account
              ? "Withdrawal is only available for active savings accounts."
              : "A savings account must exist before a withdrawal can be made."
          }
        />
      )}

      <Form
        form={form}
        layout="vertical"
        className="mt-5"
        disabled={unavailable}
      >
        {/* Savings Type */}
        <Form.Item
          name="savingsType"
          label="Withdraw From"
          rules={[
            {
              required: true,
              message: "Select a savings type",
            },
          ]}
        >
          <Radio.Group className="w-full" onChange={handleTypeChange}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Radio.Button
                value="GENERAL"
                style={{
                  width: "100%",
                  height: "auto",
                  padding: 0,
                }}
              >
                <div className="p-3">
                  <Space>
                    <WalletOutlined />
                    <Typography.Text strong>General Savings</Typography.Text>
                  </Space>

                  <Typography.Title level={5} style={{ margin: "5px 0 0" }}>
                    {formatCurrency(generalBalance)}
                  </Typography.Title>
                </div>
              </Radio.Button>

              <Radio.Button
                value="SPECIAL"
                style={{
                  width: "100%",
                  height: "auto",
                  padding: 0,
                }}
              >
                <div className="p-3">
                  <Space>
                    <BankOutlined />
                    <Typography.Text strong>Special Savings</Typography.Text>
                  </Space>

                  <Typography.Title level={5} style={{ margin: "5px 0 0" }}>
                    {formatCurrency(specialBalance)}
                  </Typography.Title>
                </div>
              </Radio.Button>
            </div>
          </Radio.Group>
        </Form.Item>

        {/* Balance */}
        <div
          className="mb-5 rounded-lg border p-4"
          style={{
            backgroundColor: token.colorFillAlter,
            borderColor: token.colorBorderSecondary,
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Typography.Text type="secondary">
                Available Balance
              </Typography.Text>

              <Typography.Title
                level={4}
                style={{
                  margin: "4px 0 0",
                }}
              >
                {formatCurrency(availableBalance)}
              </Typography.Title>
            </div>

            <div className="text-right">
              <Typography.Text type="secondary">Balance After</Typography.Text>

              <Typography.Title
                level={4}
                style={{
                  margin: "4px 0 0",
                  color: insufficientBalance ? token.colorError : undefined,
                }}
              >
                {formatCurrency(balanceAfter)}
              </Typography.Title>
            </div>
          </div>
        </div>

        {/* Amount */}
        <Form.Item
          name="amount"
          label="Withdrawal Amount"
          dependencies={["savingsType"]}
          rules={[
            {
              required: true,
              message: "Enter withdrawal amount",
            },
            {
              validator: (_, value) => {
                const currentAmount = toAmount(value);

                if (!value && value !== 0) {
                  return Promise.resolve();
                }

                if (currentAmount <= 0) {
                  return Promise.reject(
                    new Error("Withdrawal amount must be greater than 0"),
                  );
                }

                if (currentAmount > availableBalance) {
                  return Promise.reject(
                    new Error(
                      `Maximum available balance is ${formatCurrency(
                        availableBalance,
                      )}`,
                    ),
                  );
                }

                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber
            min={0.01}
            max={availableBalance}
            precision={2}
            prefix="৳"
            placeholder="Enter amount"
            style={{ width: "100%" }}
            size="large"
          />
        </Form.Item>

        {insufficientBalance && (
          <Alert
            className="mb-4"
            type="error"
            showIcon
            message="Insufficient savings balance"
          />
        )}

        <Divider orientation="left" plain>
          Transaction Details
        </Divider>

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item
            name="transactionDate"
            label="Transaction Date"
            rules={[
              {
                required: true,
                message: "Select transaction date",
              },
            ]}
          >
            <DatePicker
              style={{ width: "100%" }}
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
                message: "Select payment method",
              },
            ]}
          >
            <Select options={paymentMethods} placeholder="Select method" />
          </Form.Item>
        </div>

        <Form.Item
          name="reference"
          label="Reference"
          extra="Optional transaction, cheque, or external reference."
        >
          <Input maxLength={255} placeholder="Enter reference" />
        </Form.Item>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea
            rows={3}
            maxLength={2000}
            showCount
            placeholder="Add a note about this withdrawal (optional)"
          />
        </Form.Item>

        {canSubmit && (
          <Alert
            type="warning"
            showIcon
            icon={<SafetyOutlined />}
            message="Confirm withdrawal"
            description={
              <span>
                {formatCurrency(amount)} will be withdrawn from{" "}
                <strong>
                  {savingsType === "GENERAL"
                    ? "General Savings"
                    : "Special Savings"}
                </strong>
                . The remaining balance will be{" "}
                <strong>{formatCurrency(balanceAfter)}</strong>.
              </span>
            }
          />
        )}
      </Form>
    </Modal>
  );
}
