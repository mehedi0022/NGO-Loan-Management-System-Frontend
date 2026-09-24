import { Form, Input, Select } from "antd";
import { useEffect } from "react";

import { FormDrawer } from "../../../components/form-drawer/FormDrawer.jsx";

export function UserFormDrawer({
  open,
  user,
  roleOptions,
  loading = false,
  onClose,
  onSubmit,
}) {
  const [form] = Form.useForm();
  const editing = Boolean(user);

  useEffect(() => {
    if (!open) return;

    if (user) {
      form.setFieldsValue({
        fullName: user.fullName,
        userName: user.userName,
      });
    } else {
      form.resetFields();
      form.setFieldValue("role", roleOptions[0]?.value);
    }
  }, [form, open, roleOptions, user]);

  const submit = async () => {
    const values = await form.validateFields();

    await onSubmit(
      editing
        ? {
            fullName: values.fullName.trim(),
            userName: values.userName.trim(),
          }
        : {
            fullName: values.fullName.trim(),
            userName: values.userName.trim(),
            email: values.email.trim().toLowerCase(),
            password: values.password,
            role: values.role,
          },
    );
  };

  return (
    <FormDrawer
      open={open}
      title={editing ? "Edit User" : "Add User"}
      loading={loading}
      submitLabel={editing ? "Save Changes" : "Create User"}
      onClose={onClose}
      onSubmit={submit}
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Form.Item
          name="fullName"
          label="Full Name"
          rules={[
            { required: true, message: "Full name is required" },
            { min: 4, message: "Full name must be at least 4 characters" },
          ]}
        >
          <Input placeholder="Enter full name" autoComplete="name" />
        </Form.Item>

        <Form.Item
          name="userName"
          label="Username"
          rules={[
            { required: true, message: "Username is required" },
            { min: 3, message: "Username must be at least 3 characters" },
          ]}
        >
          <Input placeholder="Enter username" autoComplete="username" />
        </Form.Item>

        {!editing && (
          <>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Email is required" },
                { type: "email", message: "Enter a valid email address" },
              ]}
            >
              <Input placeholder="name@example.com" autoComplete="email" />
            </Form.Item>

            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: "Role is required" }]}
            >
              <Select options={roleOptions} />
            </Form.Item>

            <Form.Item
              name="password"
              label="Temporary Password"
              rules={[
                { required: true, message: "Temporary password is required" },
                { min: 8, message: "Password must be at least 8 characters" },
                { pattern: /[A-Z]/, message: "Include an uppercase letter" },
                { pattern: /[a-z]/, message: "Include a lowercase letter" },
                { pattern: /[0-9]/, message: "Include a number" },
                {
                  pattern: /[^A-Za-z0-9]/,
                  message: "Include a special character",
                },
              ]}
              hasFeedback
            >
              <Input.Password
                placeholder="Create a strong temporary password"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Confirm the password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    return !value || getFieldValue("password") === value
                      ? Promise.resolve()
                      : Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}
              hasFeedback
            >
              <Input.Password
                placeholder="Repeat the temporary password"
                autoComplete="new-password"
              />
            </Form.Item>
          </>
        )}
      </Form>
    </FormDrawer>
  );
}
