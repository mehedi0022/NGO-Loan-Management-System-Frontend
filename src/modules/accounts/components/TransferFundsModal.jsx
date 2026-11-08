import { Alert, DatePicker, Form, Input, InputNumber, Modal, Select, message } from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useGetActiveBusinessDayQuery } from "../../dayClosing/dayClosingApi.js";
import { useGetAccountsQuery, useTransferFundsMutation } from "../accountsApi.js";

export function TransferFundsModal({ open, onClose }) {
  const [form] = Form.useForm();
  const { data: accountsData, isLoading: accountsLoading } = useGetAccountsQuery();
  const [transferFunds, { isLoading: isTransferring }] = useTransferFundsMutation();
  const { data: activeDayData } = useGetActiveBusinessDayQuery();
  const activeBusinessDate = activeDayData?.data?.businessDate;

  const accounts = Array.isArray(accountsData?.data)
    ? accountsData.data
    : Array.isArray(accountsData?.data?.accounts)
    ? accountsData.data.accounts
    : [];

  const fromAccountId = Form.useWatch("fromAccountId", form);
  const selectedFromAccount = accounts.find((a) => a.id === fromAccountId);

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldValue(
        "transferDate",
        activeBusinessDate ? dayjs(activeBusinessDate) : dayjs()
      );
    }
  }, [open, activeBusinessDate, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await transferFunds({
        fromAccountId: values.fromAccountId,
        toAccountId: values.toAccountId,
        amount: values.amount,
        transferDate: values.transferDate ? values.transferDate.format("YYYY-MM-DD") : undefined,
        notes: values.notes,
      }).unwrap();
      message.success("Funds transferred successfully");
      onClose();
    } catch (error) {
      if (error?.data?.message) {
        message.error(error.data.message);
      }
    }
  };

  const fromOptions = accounts.map((acc) => ({
    value: acc.id,
    label: `${acc.accountName} (${acc.accountType}) - ৳${Number(acc.currentBalance).toLocaleString("en-IN")}`,
  }));

  const toOptions = accounts
    .filter((acc) => acc.id !== fromAccountId)
    .map((acc) => ({
      value: acc.id,
      label: `${acc.accountName} (${acc.accountType}) - ৳${Number(acc.currentBalance).toLocaleString("en-IN")}`,
    }));

  return (
    <Modal
      open={open}
      title="Transfer Funds"
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={isTransferring}
      okText="Transfer Now"
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          label="From Account"
          name="fromAccountId"
          rules={[{ required: true, message: "Please select sender account" }]}
        >
          <Select
            placeholder="Select source account"
            options={fromOptions}
            loading={accountsLoading}
          />
        </Form.Item>

        {selectedFromAccount && (
          <Alert
            message={`Available Balance: ৳${Number(selectedFromAccount.currentBalance).toLocaleString("en-IN")}`}
            type="info"
            showIcon
            className="mb-4"
          />
        )}

        <Form.Item
          label="To Account"
          name="toAccountId"
          rules={[{ required: true, message: "Please select destination account" }]}
        >
          <Select
            placeholder="Select recipient account"
            options={toOptions}
            loading={accountsLoading}
            disabled={!fromAccountId}
          />
        </Form.Item>

        <Form.Item
          label="Transfer Amount"
          name="amount"
          rules={[
            { required: true, message: "Please enter amount" },
            {
              type: "number",
              min: 1,
              message: "Amount must be at least 1",
            },
            ...(selectedFromAccount
              ? [
                  {
                    type: "number",
                    max: Number(selectedFromAccount.currentBalance),
                    message: "Amount cannot exceed current available balance",
                  },
                ]
              : []),
          ]}
        >
          <InputNumber
            className="w-full"
            style={{ width: "100%" }}
            prefix="৳"
            placeholder="Enter amount"
            min={1}
            max={selectedFromAccount ? Number(selectedFromAccount.currentBalance) : undefined}
          />
        </Form.Item>

        <Form.Item
          label={
            <div className="flex items-center justify-between w-full">
              <span>Transfer Date</span>
              {activeBusinessDate && (
                <span className="text-xs text-blue-600 font-normal">
                  Active Business Day: {dayjs(activeBusinessDate).format("DD MMM YYYY")}
                </span>
              )}
            </div>
          }
          name="transferDate"
          rules={[{ required: true, message: "Please select transfer date" }]}
        >
          <DatePicker
            className="w-full"
            style={{ width: "100%" }}
            format="DD MMMM YYYY"
            allowClear={false}
            inputReadOnly
            disabledDate={(current) => {
              if (!current || !activeBusinessDate) return false;
              return current.format("YYYY-MM-DD") !== activeBusinessDate;
            }}
          />
        </Form.Item>

        <Form.Item label="Note / Reference" name="notes">
          <Input.TextArea rows={2} placeholder="e.g. Bank to Cash withdrawal or Cash deposit" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
