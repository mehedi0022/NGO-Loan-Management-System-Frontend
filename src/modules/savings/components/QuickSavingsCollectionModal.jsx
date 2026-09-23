import {
  Avatar,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Typography,
  message,
  theme,
} from "antd";
import {
  CalendarOutlined,
  DollarOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useEffect } from "react";

import { formatCurrency } from "../../loans/loanFormatters.js";
import { useCreateCollectionMutation } from "../../collections/collectionsApi.js";
import { MemberSavingsSelector } from "./MemberSavingsSelector.jsx";

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

export function QuickSavingsCollectionModal({
  open,
  member,
  onClose,
  onSuccess,
}) {
  const { token } = theme.useToken();
  const [form] = Form.useForm();

  const generalSavingsAmount = toAmount(
    Form.useWatch("generalSavingsAmount", form),
  );

  const specialSavingsAmount = toAmount(
    Form.useWatch("specialSavingsAmount", form),
  );

  const totalSavings = generalSavingsAmount + specialSavingsAmount;

  const [createCollection, { isLoading }] = useCreateCollectionMutation();

  useEffect(() => {
    if (!open) return;

    form.resetFields();

    form.setFieldsValue({
      memberId: member?.id,
      generalSavingsAmount: undefined,
      specialSavingsAmount: undefined,
      collectionDate: dayjs(),
      paymentMethod: "CASH",
      reference: undefined,
      notes: undefined,
    });
  }, [form, open, member?.id]);

  const handleClose = () => {
    if (isLoading) return;

    form.resetFields();
    onClose?.();
  };

  const submit = async () => {
    try {
      const values = await form.validateFields();

      const generalAmount = toAmount(values.generalSavingsAmount);

      const specialAmount = toAmount(values.specialSavingsAmount);

      if (generalAmount + specialAmount <= 0) {
        form.setFields([
          {
            name: "generalSavingsAmount",
            errors: ["Enter General or Special savings amount"],
          },
          {
            name: "specialSavingsAmount",
            errors: ["Enter General or Special savings amount"],
          },
        ]);

        return;
      }

      await createCollection({
        memberId: Number(values.memberId),

        // Savings-only collection.
        // Do not send loanId/installmentId.
        loanCollectionAmount: 0,

        generalSavingsAmount: generalAmount,
        specialSavingsAmount: specialAmount,

        collectionDate: values.collectionDate.format("YYYY-MM-DD"),

        paymentMethod: values.paymentMethod,

        ...(values.reference?.trim() && {
          reference: values.reference.trim(),
        }),

        ...(values.notes?.trim() && {
          notes: values.notes.trim(),
        }),
      }).unwrap();

      message.success(
        `${formatCurrency(totalSavings)} savings collected successfully`,
      );

      form.resetFields();
      onSuccess?.();
      onClose?.();
    } catch (error) {
      if (error?.errorFields) return;

      message.error(error?.data?.message || "Unable to collect savings");
    }
  };

  return (
    <Modal
      title={
        <Space size={10}>
          <WalletOutlined />
          <span>Collect Savings</span>
        </Space>
      }
      open={open}
      onCancel={handleClose}
      onOk={submit}
      okText="Collect Savings"
      confirmLoading={isLoading}
      okButtonProps={{
        disabled: totalSavings <= 0,
      }}
      cancelButtonProps={{
        disabled: isLoading,
      }}
      width={560}
      destroyOnHidden
      maskClosable={!isLoading}
      keyboard={!isLoading}
    >
      <Form form={form} layout="vertical" className="mt-5">
        {/* Member */}
        {member ? (
          <>
            <div
              className="mb-5 flex items-center gap-3 rounded-lg border p-3"
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
                  {member.fullName}
                </Typography.Text>

                <Typography.Text type="secondary" className="text-sm">
                  {member.memberId || `Member #${member.id}`}
                </Typography.Text>
              </div>
            </div>

            <Form.Item name="memberId" hidden>
              <Input />
            </Form.Item>
          </>
        ) : (
          <Form.Item
            name="memberId"
            label="Member"
            rules={[
              {
                required: true,
                message: "Select a member",
              },
            ]}
          >
            <MemberSavingsSelector />
          </Form.Item>
        )}

        {/* Savings amounts */}
        <Typography.Text strong>Savings Amount</Typography.Text>

        <Typography.Paragraph type="secondary" className="mb-3! text-sm">
          Enter an amount for General Savings, Special Savings, or both.
        </Typography.Paragraph>

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item label="General Savings" name="generalSavingsAmount">
            <InputNumber
              min={0}
              precision={2}
              prefix="৳"
              placeholder="0.00"
              size="large"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item label="Special Savings" name="specialSavingsAmount">
            <InputNumber
              min={0}
              precision={2}
              prefix="৳"
              placeholder="0.00"
              size="large"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </div>

        {/* Collection summary */}
        <div
          className="mb-5 rounded-lg border p-4"
          style={{
            backgroundColor: token.colorFillAlter,
            borderColor: token.colorBorderSecondary,
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <Typography.Text type="secondary">
                Total Savings Collection
              </Typography.Text>

              <Typography.Title
                level={3}
                style={{
                  margin: "3px 0 0",
                  color: totalSavings > 0 ? token.colorPrimary : undefined,
                }}
              >
                {formatCurrency(totalSavings)}
              </Typography.Title>
            </div>

            <DollarOutlined
              style={{
                fontSize: 28,
                color: token.colorPrimary,
              }}
            />
          </div>

          {totalSavings > 0 && (
            <div
              className="mt-3 grid grid-cols-2 gap-3 border-t pt-3"
              style={{
                borderColor: token.colorBorderSecondary,
              }}
            >
              <div>
                <Typography.Text type="secondary" className="text-xs">
                  General
                </Typography.Text>

                <div>
                  <Typography.Text strong>
                    {formatCurrency(generalSavingsAmount)}
                  </Typography.Text>
                </div>
              </div>

              <div>
                <Typography.Text type="secondary" className="text-xs">
                  Special
                </Typography.Text>

                <div>
                  <Typography.Text strong>
                    {formatCurrency(specialSavingsAmount)}
                  </Typography.Text>
                </div>
              </div>
            </div>
          )}
        </div>

        <Divider orientation="left" plain>
          Collection Details
        </Divider>

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item
            name="collectionDate"
            label="Collection Date"
            rules={[
              {
                required: true,
                message: "Select collection date",
              },
            ]}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="DD MMM YYYY"
              allowClear={false}
              suffixIcon={<CalendarOutlined />}
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
            placeholder="Add a note about this collection (optional)"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
