import { Button, Drawer, Flex, Space } from "antd";

export function FormDrawer({
  open,
  title,
  children,
  loading = false,
  onClose,
  onSubmit,
  submitLabel = "Save",
}) {
  return (
    <Drawer
      open={open}
      title={title}
      onClose={onClose}
      destroyOnClose
      footer={
        <Flex justify="flex-end">
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" loading={loading} onClick={onSubmit}>
              {submitLabel}
            </Button>
          </Space>
        </Flex>
      }
    >
      {children}
    </Drawer>
  );
}
