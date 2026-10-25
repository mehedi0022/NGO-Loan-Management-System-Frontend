import { Form, Input, Select } from "antd";
import { useEffect } from "react";
import { FormDrawer } from "../../../components/form-drawer/FormDrawer.jsx";
import { useGetUsersQuery } from "../../users/usersApi.js";

const dayOptions = [
  { value: "SATURDAY", label: "Saturday / শনিবার" },
  { value: "SUNDAY", label: "Sunday / রবিবার" },
  { value: "MONDAY", label: "Monday / সোমবার" },
  { value: "TUESDAY", label: "Tuesday / মঙ্গলবার" },
  { value: "WEDNESDAY", label: "Wednesday / বুধবার" },
  { value: "THURSDAY", label: "Thursday / বৃহস্পতিবার" },
  { value: "FRIDAY", label: "Friday / শুক্রবার" },
];

const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

export function SomitiFormDrawer({
  open,
  somiti,
  loading = false,
  onClose,
  onSubmit,
}) {
  const [form] = Form.useForm();
  const editing = Boolean(somiti);

  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery({
    limit: 100,
    status: "ACTIVE",
  });

  const fieldOfficerOptions = (usersData?.data ?? [])
    .filter((u) => u.role === "FIELD_OFFICER" || u.role === "ADMIN" || u.role === "SUPER_ADMIN" || u.role === "MANAGER")
    .map((user) => ({
      value: user.id,
      label: `${user.fullName} (${user.role.replace("_", " ")})`,
    }));

  useEffect(() => {
    if (!open) return;

    if (somiti) {
      form.setFieldsValue({
        name: somiti.name,
        code: somiti.code || "",
        meetingDay: somiti.meetingDay,
        meetingTime: somiti.meetingTime || "",
        fieldOfficerId: somiti.fieldOfficerId || somiti.fieldOfficer?.id || undefined,
        area: somiti.area || "",
        address: somiti.address || "",
        status: somiti.status || "ACTIVE",
        description: somiti.description || "",
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        meetingDay: "SATURDAY",
        status: "ACTIVE",
      });
    }
  }, [form, open, somiti]);

  const submit = async () => {
    const values = await form.validateFields();

    const payload = {
      name: values.name.trim(),
      ...(values.code?.trim() && { code: values.code.trim().toUpperCase() }),
      meetingDay: values.meetingDay,
      meetingTime: values.meetingTime?.trim() || undefined,
      fieldOfficerId: values.fieldOfficerId ? Number(values.fieldOfficerId) : undefined,
      area: values.area?.trim() || undefined,
      address: values.address?.trim() || undefined,
      status: values.status || "ACTIVE",
      description: values.description?.trim() || undefined,
    };

    await onSubmit(payload);
  };

  return (
    <FormDrawer
      open={open}
      title={editing ? "Edit Somiti" : "Create New Somiti"}
      loading={loading}
      submitLabel={editing ? "Save Changes" : "Create Somiti"}
      onClose={onClose}
      onSubmit={submit}
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Form.Item
          name="name"
          label="Somiti Name (সমিতির নাম)"
          rules={[
            { required: true, message: "Somiti name is required" },
            { min: 2, message: "Name must be at least 2 characters" },
          ]}
        >
          <Input placeholder="e.g. পদ্মা মহিলা সমিতি / Padma Somiti" />
        </Form.Item>

        <Form.Item
          name="code"
          label="Somiti Code (সমিতি কোড)"
          extra="Leave empty for auto-generated code (e.g. SM-00001)"
        >
          <Input placeholder="e.g. SM-00001" />
        </Form.Item>

        <Form.Item
          name="meetingDay"
          label="Meeting Day (সাপ্তাহিক কিস্তির বার)"
          rules={[{ required: true, message: "Meeting day is required" }]}
        >
          <Select options={dayOptions} placeholder="Select meeting day" />
        </Form.Item>

        <Form.Item
          name="meetingTime"
          label="Meeting Time (কিস্তির সময়)"
        >
          <Input placeholder="e.g. 10:00 AM" />
        </Form.Item>

        <Form.Item
          name="fieldOfficerId"
          label="Assigned Field Officer (দায়িত্বপ্রাপ্ত ফিল্ড অফিসার)"
        >
          <Select
            placeholder="Assign a Field Officer"
            allowClear
            loading={usersLoading}
            options={fieldOfficerOptions}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item name="area" label="Area / Village (এলাকা / গ্রাম)">
          <Input placeholder="e.g. Rupnagar, Ward 4" />
        </Form.Item>

        <Form.Item name="address" label="Address / Center Location (ঠিকানা / কেন্দ্র)">
          <Input placeholder="e.g. Primary School Road, Center #1" />
        </Form.Item>

        {editing && (
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Status is required" }]}
          >
            <Select options={statusOptions} />
          </Form.Item>
        )}

        <Form.Item name="description" label="Notes / Description (বিবরণ)">
          <Input.TextArea rows={3} placeholder="Optional notes about this somiti" />
        </Form.Item>
      </Form>
    </FormDrawer>
  );
}
