import { Avatar, Descriptions, Drawer, Space, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";

import { StatusTag } from "../../../components/status-tag/StatusTag.jsx";
import { formatDate } from "../../loans/loanFormatters.js";
import { RoleTag } from "./RoleTag.jsx";

export function UserDetailsDrawer({ open, user, onClose }) {
  return (
    <Drawer open={open} title="User Details" width={480} onClose={onClose}>
      {user && (
        <>
          <Space size="middle" className="mb-6">
            <Avatar size={64} icon={<UserOutlined />} />
            <div>
              <Typography.Title level={4} className="mb-1!">
                {user.fullName || user.userName || "Unnamed user"}
              </Typography.Title>
              <Typography.Text type="secondary">{user.email}</Typography.Text>
            </div>
          </Space>

          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="User ID">#{user.id}</Descriptions.Item>
            <Descriptions.Item label="Username">
              {user.userName || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
            <Descriptions.Item label="Role">
              <RoleTag role={user.role} />
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <StatusTag
                status={user.isActive ? "ACTIVE" : "INACTIVE"}
                label={user.isActive ? "Active" : "Inactive"}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Email Verified">
              {user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : "Not verified"}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {formatDate(user.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {formatDate(user.updatedAt)}
            </Descriptions.Item>
          </Descriptions>
        </>
      )}
    </Drawer>
  );
}
