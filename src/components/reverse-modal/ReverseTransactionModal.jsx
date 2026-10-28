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
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-base font-semibold">
          <ExclamationCircleOutlined className="text-lg" />
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
      width={500}
    >
      <div className="py-1">
        <Alert
          type="warning"
          showIcon
          description="Reversing this transaction will restore member balances, revert installment statuses, and adjust the financial cash ledger."
          style={{
            marginBottom: 16,
            borderRadius: 12,
            backgroundColor: "rgba(254, 243, 199, 0.3)",
          }}
          className="mb-4 text-xs sm:text-sm"
        />

        {(transactionCode || amount !== undefined || detailsText) && (
          <div className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/60 p-3.5 text-sm space-y-2">
            {transactionCode && (
              <div className="flex justify-between items-center py-0.5 border-b border-slate-200/80 dark:border-slate-700/60 pb-2">
                <span className="text-slate-600 dark:text-slate-300 font-medium text-xs sm:text-sm">
                  Transaction:
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-xs sm:text-sm">
                  {transactionCode}
                </span>
              </div>
            )}
            {amount !== undefined && (
              <div className="flex justify-between items-center py-0.5 border-b border-slate-200/80 dark:border-slate-700/60 pb-2">
                <span className="text-slate-600 dark:text-slate-300 font-medium text-xs sm:text-sm">
                  Reversal Amount:
                </span>
                <span className="font-bold text-base text-rose-600 dark:text-rose-400">
                  {typeof amount === "number"
                    ? `৳${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                    : String(amount).startsWith("৳")
                      ? amount
                      : `৳${amount}`}
                </span>
              </div>
            )}
            {detailsText && (
              <div className="pt-1 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">•</span>
                <span>{detailsText}</span>
              </div>
            )}
          </div>
        )}

        <Form form={form} layout="vertical">
          <Form.Item
            name="reason"
            label={
              <span className="text-slate-800 dark:text-slate-200 font-semibold text-sm">
                Reason for Reversal / Cancellation
              </span>
            }
            rules={[
              {
                required: true,
                message: "Please provide a reason for reversal",
              },
              { min: 3, message: "Reason must be at least 3 characters" },
              { max: 500, message: "Reason cannot exceed 500 characters" },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="e.g. Wrong amount entered by field officer / Member mistyped"
              maxLength={500}
              showCount
              className="rounded-lg"
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
