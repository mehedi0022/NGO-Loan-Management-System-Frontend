import { Modal } from "antd";

export function ConfirmModal({
  open,
  title,
  content,
  loading = false,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal
      open={open}
      title={title}
      confirmLoading={loading}
      onCancel={onCancel}
      onOk={onConfirm}
    >
      {content}
    </Modal>
  );
}
