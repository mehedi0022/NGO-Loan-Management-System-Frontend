import { Typography } from "antd";

import { ConfirmModal } from "../../../components/confirm-modal/ConfirmModal.jsx";

export function UserStatusAction({ user, loading, onCancel, onConfirm }) {
  const activating = user ? !user.isActive : false;

  return (
    <ConfirmModal
      open={Boolean(user)}
      title={`${activating ? "Activate" : "Deactivate"} user?`}
      loading={loading}
      onCancel={onCancel}
      onConfirm={onConfirm}
      content={
        <Typography.Paragraph>
          {activating
            ? `${user?.fullName || user?.email} will be able to sign in again.`
            : `${user?.fullName || user?.email} will be signed out from all sessions and cannot sign in.`}
        </Typography.Paragraph>
      }
    />
  );
}
