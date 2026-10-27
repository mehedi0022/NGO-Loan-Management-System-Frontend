import { Form, Input, InputNumber, Modal, Select, message } from "antd";
import { useEffect } from "react";
import { useGetAccountsQuery, useInjectCapitalMutation } from "../accountsApi.js";

const capitalSources = [
  { value: "HEAD_OFFICE", label: "Head Office Grant / Fund" },
  { value: "OWNER_EQUITY", label: "Owner / Director Equity" },
  { value: "BANK_LOAN", label: "Commercial Bank Borrowing" },
  { value: "DONOR_FUND", label: "Donor / External Grant" },
  { value: "OPENING_BALANCE", label: "Opening Balance / Initial Capital" },
  { value: "OTHER", label: "Other Source" },
];

export function InjectCapitalModal({ open, onClose, account = null }) {
  const [form] = Form.useForm();
  const { data: accountsData, isLoading: accountsLoading } = useGetAccountsQuery();
  const [injectCapital, { isLoading: isInjecting }] = useInjectCapitalMutation();

  const accounts = Array.isArray(accountsData?.data)
    ? accountsData.data
    : Array.isArray(accountsData?.data?.accounts)
    ? accountsData.data.accounts
    : [];

  const defaultAccount = accounts.find((a) => a.isDefault) || accounts[0];

  useEffect(() => {
    if (open) {
      form.resetFields();
      const targetId = account?.id || defaultAccount?.id;
      if (targetId) {
        form.setFieldValue("accountId", targetId);
      }
    }
  }, [open, account, defaultAccount, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await injectCapital({
        accountId: values.accountId,
        amount: values.amount,
        source: values.source,
        notes: values.notes,
      }).unwrap();
      message.success("Capital deposited successfully");
      onClose();
    } catch (error) {
      if (error?.data?.message) {
        message.error(error.data.message);
      }
    }
  };

  const accountOptions = accounts.map((acc) => ({
    value: acc.id,
    label: `${acc.accountName} (${acc.accountType}) - Current: ৳${Number(acc.currentBalance).toLocaleString("en-IN")}`,
  }));

  return (
    <Modal
      open={open}
      title="Add Capital / Fund Deposit"
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={isInjecting}
      okText="Deposit Fund"
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          label="Deposit To Account"
          name="accountId"
          rules={[{ required: true, message: "Please select account" }]}
        >
          <Select
            placeholder="Select account"
            options={accountOptions}
            loading={accountsLoading}
          />
        </Form.Item>

        <Form.Item
          label="Deposit Amount"
          name="amount"
          rules={[
            { required: true, message: "Please enter deposit amount" },
            { type: "number", min: 1, message: "Amount must be greater than 0" },
          ]}
        >
          <InputNumber
            className="w-full"
            style={{ width: "100%" }}
            prefix="৳"
            placeholder="e.g. 500000"
            min={1}
          />
        </Form.Item>

        <Form.Item
          label="Fund Source / Category"
          name="source"
          rules={[{ required: true, message: "Please select fund source" }]}
        >
          <Select placeholder="Select fund source" options={capitalSources} />
        </Form.Item>

        <Form.Item label="Note / Reference" name="notes">
          <Input.TextArea rows={2} placeholder="e.g. Received from Head Office via Bank Cheque #44920" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
