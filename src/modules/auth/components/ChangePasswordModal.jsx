import { Alert, Form, Input, Modal } from "antd";

export function ChangePasswordModal({
  open,
  loading = false,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();

  const submit = async () => {
    const values = await form.validateFields();
    await onSubmit({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  };

  return (
    <Modal
      open={open}
      title="Change Password"
      okText="Change Password"
      confirmLoading={loading}
      onCancel={onCancel}
      onOk={submit}
      afterClose={() => form.resetFields()}
      destroyOnHidden
    >
      <Alert
        type="info"
        showIcon
        className="mb-4"
        message="You will need to sign in again after changing your password."
      />

      <Form form={form} layout="vertical">
        <Form.Item
          name="currentPassword"
          label="Current Password"
          rules={[{ required: true, message: "Current password is required" }]}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="New Password"
          rules={[
            { required: true, message: "New password is required" },
            { min: 8, message: "Password must be at least 8 characters" },
            { pattern: /[A-Z]/, message: "Include an uppercase letter" },
            { pattern: /[a-z]/, message: "Include a lowercase letter" },
            { pattern: /[0-9]/, message: "Include a number" },
            { pattern: /[^A-Za-z0-9]/, message: "Include a special character" },
          ]}
          hasFeedback
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirm New Password"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Confirm the new password" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                return !value || getFieldValue("newPassword") === value
                  ? Promise.resolve()
                  : Promise.reject(new Error("Passwords do not match"));
              },
            }),
          ]}
          hasFeedback
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
