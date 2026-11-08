import { ExclamationCircleOutlined, UnlockOutlined } from "@ant-design/icons";
import { Alert, Form, Input, Modal, message } from "antd";
import { useState } from "react";
import { useReopenDayMutation } from "../dayClosingApi.js";

const { TextArea } = Input;

export function EmergencyReopenModal({ open, onClose, targetDate }) {
  const [form] = Form.useForm();
  const [reopenDay, { isLoading }] = useReopenDayMutation();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await reopenDay({ reason: values.reason }).unwrap();
      message.success("Business day reopened successfully");
      form.resetFields();
      onClose();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(
        err?.data?.message || err?.message || "Failed to reopen business day",
      );
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-rose-600">
          <UnlockOutlined />
          <span>Emergency Business Day Reopen</span>
        </div>
      }
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={handleOk}
      confirmLoading={isLoading}
      okText="Confirm & Reopen Day"
      okButtonProps={{ danger: true, className: "bg-rose-600 hover:bg-rose-500" }}
      cancelText="Cancel"
      destroyOnClose
      width={540}
    >
      <div className="space-y-4 py-2">
        <Alert
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message="Super Admin Emergency Action"
          description={
            <div className="text-xs space-y-1 mt-1 text-slate-700">
              <p>
                This action will revert the most recently closed business day{" "}
                {targetDate ? <strong>({targetDate})</strong> : ""} back to{" "}
                <strong className="text-emerald-700">OPEN</strong> status, and remove
                the empty active business day.
              </p>
              <p className="font-semibold text-rose-700">
                Criteria: Reopening is strictly forbidden if any transactions
                (collections, loans, savings, vouchers) have already been recorded on
                today's open business day.
              </p>
            </div>
          }
        />

        <Form form={form} layout="vertical" className="mt-3">
          <Form.Item
            name="reason"
            label="Reason for Emergency Reopen"
            rules={[
              { required: true, message: "Please provide a reason for reopening" },
              { min: 5, message: "Reason must be at least 5 characters" },
              { max: 500, message: "Reason cannot exceed 500 characters" },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="e.g. Field officer arrived late with 4 pending collections from yesterday that must be booked before day close..."
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
