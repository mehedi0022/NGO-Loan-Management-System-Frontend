import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Typography,
  message,
} from "antd";
import { DollarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useDepositDpsInstallmentMutation } from "../dpsApi.js";
import { formatCurrency } from "../../loans/loanFormatters.js";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "MOBILE_PAYMENT", label: "Mobile Payment (bKash/Nagad)" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

export function DepositDpsModal({ open, onClose, dpsAccount, onSuccess }) {
  const [form] = Form.useForm();
  const [depositDps, { isLoading }] = useDepositDpsInstallmentMutation();

  useEffect(() => {
    if (open && dpsAccount) {
      form.setFieldsValue({
        amount: Number(dpsAccount.installmentAmount || 1000),
        installmentNo: (dpsAccount.paidInstallments || 0) + 1,
        paymentMethod: "CASH",
        transactionDate: dayjs(),
        reference: "",
        notes: "",
      });
    }
  }, [open, dpsAccount, form]);

  const handleSubmit = async (values) => {
    try {
      await depositDps({
        id: dpsAccount.id,
        amount: Number(values.amount),
        installmentNo: values.installmentNo ? Number(values.installmentNo) : undefined,
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
          <span>Collect DPS Installment — {dpsAccount?.dpsNumber}</span>
        </Space>
      }
      footer={null}
      destroyOnClose
      width={520}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div
          style={{
            background: "#f8fafc",
            padding: "10px 14px",
            borderRadius: 6,
            marginBottom: 16,
            fontSize: 12,
          }}
        >
          <div>
            <strong>DPS Number: </strong>
            <span style={{ color: "#0284c7" }}>{dpsAccount?.dpsNumber}</span>
          </div>
          <div>
            <strong>Monthly Installment: </strong>
            <span>{formatCurrency(dpsAccount?.installmentAmount)}</span>
          </div>
          <div>
            <strong>Paid so far: </strong>
            <span>
              {dpsAccount?.paidInstallments || 0} of {dpsAccount?.durationMonths || 0} months (
              {formatCurrency(dpsAccount?.totalPaidAmount)})
            </span>
          </div>
        </div>

        <Form.Item
          name="amount"
          label="Deposit Amount (৳)"
          rules={[{ required: true, message: "Please enter deposit amount" }]}
        >
          <InputNumber style={{ width: "100%" }} min={1} step={100} prefix="৳" />
        </Form.Item>

        <Form.Item name="installmentNo" label="Installment Number">
          <InputNumber style={{ width: "100%" }} min={1} max={dpsAccount?.durationMonths || 120} />
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
