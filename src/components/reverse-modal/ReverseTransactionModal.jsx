import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Alert, Form, Input, Modal, Typography } from "antd";
import { useEffect } from "react";

/**
 * Reusable modal for confirming transaction / collection reversal.
 * Requires a reason before proceeding.
 */
export function ReverseTransactionModal({
  open,
  onClose,
  onConfirm,
  confirmLoading = false,
  title = "Confirm Reversal",
  transactionCode,
  amount,
  detailsText,
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onConfirm(values.reason);
    } catch {
      // validation error
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
          <ExclamationCircleOutlined />
          <span>{title}</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Confirm Reversal"
      okButtonProps={{ danger: true, loading: confirmLoading }}
      cancelButtonProps={{ disabled: confirmLoading }}
      destroyOnClose
      width={480}
    >
      <div className="py-2">
        <Alert
          type="warning"
          showIcon
          className="mb-3"
          message="Reversing this transaction will restore member balances, revert installment statuses, and adjust the financial cash ledger."
        />

        {(transactionCode || amount !== undefined || detailsText) && (
          <div className="mb-4 rounded-lg bg-gray-50 dark:bg-gray-800/60 p-3 text-sm">
            {transactionCode && (
              <div className="flex justify-between py-0.5">
                <span className="text-gray-500 dark:text-gray-400">Transaction:</span>
                <span className="font-semibold">{transactionCode}</span>
              </div>
            )}
            {amount !== undefined && (
              <div className="flex justify-between py-0.5">
                <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {amount}
                </span>
              </div>
            )}
            {detailsText && (
              <div className="mt-1 pt-1 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                {detailsText}
              </div>
            )}
          </div>
        )}

        <Form form={form} layout="vertical">
          <Form.Item
            name="reason"
            label={
              <Typography.Text strong>
                Reason for Reversal / Cancellation <span className="text-rose-500">*</span>
              </Typography.Text>
            }
            rules={[
              { required: true, message: "Please provide a reason for reversal" },
              { min: 3, message: "Reason must be at least 3 characters" },
              { max: 500, message: "Reason cannot exceed 500 characters" },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="e.g. Wrong amount entered by field officer / Member mistyped"
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
