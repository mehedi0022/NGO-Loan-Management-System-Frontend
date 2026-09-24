import { Form, Modal, Select } from "antd";
import { useEffect } from "react";

const roleOptions = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
];

export function ChangeRoleModal({ open, user, loading, onCancel, onSubmit }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && user) form.setFieldValue("role", user.role);
  }, [form, open, user]);

  const submit = async () => {
    const values = await form.validateFields();
    await onSubmit(values.role);
  };

  return (
    <Modal
      open={open}
      title={`Change role${user ? ` — ${user.fullName || user.email}` : ""}`}
      okText="Change Role"
      confirmLoading={loading}
      onCancel={onCancel}
      onOk={submit}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="role"
          label="New Role"
          rules={[{ required: true, message: "Select a role" }]}
        >
          <Select options={roleOptions} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
