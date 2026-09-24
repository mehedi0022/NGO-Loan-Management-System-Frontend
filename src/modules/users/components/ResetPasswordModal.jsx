import { Alert, Form, Input, Modal } from "antd";

export function ResetPasswordModal({ open, user, loading, onCancel, onSubmit }) {
  const [form] = Form.useForm();

  const submit = async () => {
    const values = await form.validateFields();
    await onSubmit(values.newPassword);
  };

  return (
    <Modal
      open={open}
      title={`Reset password${user ? ` — ${user.fullName || user.email}` : ""}`}
      okText="Reset Password"
      okButtonProps={{ danger: true }}
      confirmLoading={loading}
      onCancel={onCancel}
      onOk={submit}
      afterClose={() => form.resetFields()}
      destroyOnHidden
    >
      <Alert
        type="warning"
        showIcon
        className="mb-4"
        message="All existing sessions will be signed out."
      />
      <Form form={form} layout="vertical">
        <Form.Item
          name="newPassword"
          label="Temporary Password"
          rules={[
            { required: true, message: "Temporary password is required" },
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
          label="Confirm Password"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Confirm the password" },
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
