import {
  DeleteOutlined,
  EditOutlined,
  LockOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import { useState } from "react";
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useUpdateCategoryMutation,
} from "../incomeExpenseApi.js";

export function CategoryManagementModal({ open, onClose }) {
  const [filterType, setFilterType] = useState("ALL");
  const [editingCategory, setEditingCategory] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: categoriesData, isLoading } = useGetCategoriesQuery(
    filterType === "ALL" ? {} : { type: filterType },
  );
  const [createCategory, { isLoading: isCreating }] =
    useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] =
    useDeleteCategoryMutation();

  const handleOpenAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({ type: "EXPENSE", isActive: true });
    setFormOpen(true);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      type: category.type,
      description: category.description || "",
      isActive: category.isActive,
    });
    setFormOpen(true);
  };

  const handleSaveCategory = async () => {
    try {
      const values = await form.validateFields();
      if (editingCategory) {
        await updateCategory({ id: editingCategory.id, ...values }).unwrap();
        message.success("Category updated successfully");
      } else {
        await createCategory(values).unwrap();
        message.success("Category created successfully");
      }
      setFormOpen(false);
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.data?.message || "Failed to save category");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategory(id).unwrap();
      message.success("Category deleted successfully");
    } catch (err) {
      message.error(err?.data?.message || "Failed to delete category");
    }
  };

  const handleToggleActive = async (category, checked) => {
    try {
      await updateCategory({ id: category.id, isActive: checked }).unwrap();
      message.success(`Category marked as ${checked ? "active" : "inactive"}`);
    } catch (err) {
      message.error(err?.data?.message || "Failed to update category status");
    }
  };

  const columns = [
    {
      title: "Category Name",
      dataIndex: "name",
      key: "name",
      render: (val, record) => (
        <Space>
          <span style={{ fontWeight: 600 }}>{val}</span>
          {record.isSystem && (
            <Tag icon={<LockOutlined />} color="default">
              System
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type) => (
        <Tag color={type === "INCOME" ? "green" : "volcano"}>{type}</Tag>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (val) => val || "—",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (isActive, record) => (
        <Switch
          size="small"
          checked={isActive}
          onChange={(checked) => handleToggleActive(record, checked)}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(record)}
          />
          {!record.isSystem && (
            <Popconfirm
              title="Delete Category"
              description="Are you sure you want to delete this category?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes, Delete"
              cancelText="Cancel"
            >
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            Close
          </Button>,
        ]}
        width={800}
        title={
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pr-8">
            <span className="text-sm sm:text-base font-semibold">Manage Categories</span>
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleOpenAdd} className="w-fit">
              New Category
            </Button>
          </div>
        }
        destroyOnClose
      >
        <div className="mb-4 mt-3 overflow-x-auto">
          <Radio.Group
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            buttonStyle="solid"
            size="small"
          >
            <Radio.Button value="ALL">All Categories</Radio.Button>
            <Radio.Button value="INCOME">Income Categories</Radio.Button>
            <Radio.Button value="EXPENSE">Expense Categories</Radio.Button>
          </Radio.Group>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={categoriesData?.data ?? []}
          loading={isLoading || isDeleting}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          size="middle"
          scroll={{ x: 600 }}
        />
      </Modal>

      {/* Add / Edit Category Submodal */}
      <Modal
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={handleSaveCategory}
        confirmLoading={isCreating || isUpdating}
        title={editingCategory ? "Edit Category" : "Add New Category"}
        okText={editingCategory ? "Save Changes" : "Create"}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: "Please enter category name" }]}
          >
            <Input placeholder="e.g. Utility Bills, Donations" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Category Type"
            rules={[{ required: true }]}
          >
            <Radio.Group disabled={Boolean(editingCategory)}>
              <Radio value="INCOME">Income</Radio>
              <Radio value="EXPENSE">Expense</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Optional notes about this category" />
          </Form.Item>

          <Form.Item name="isActive" label="Status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
