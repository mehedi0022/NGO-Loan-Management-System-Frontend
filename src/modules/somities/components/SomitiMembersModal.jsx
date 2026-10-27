import { Avatar, Button, Empty, Modal, Space, Table, Tag, Typography } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useGetSomitiMembersQuery } from "../somitiesApi.js";
import { resolveUploadUrl } from "../../../utils/uploadUrl.js";
import { formatDate } from "../../loans/loanFormatters.js";

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

export function SomitiMembersModal({ open, somiti, onClose }) {
  const navigate = useNavigate();
  const somitiId = somiti?.id;

  const { data: response, isLoading } = useGetSomitiMembersQuery(somitiId, {
    skip: !open || !somitiId,
  });

  const members = response?.data ?? [];

  const columns = [
    {
      title: "Member",
      key: "fullName",
      render: (_, member) => (
        <Space size={12}>
          <Avatar
            src={resolveUploadUrl(member.photoUrl) || undefined}
            style={{ backgroundColor: "#1890ff" }}
          >
            {getInitials(member.fullName)}
          </Avatar>
          <div>
            <Typography.Text strong style={{ display: "block" }}>
              {member.fullName}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {member.memberId || "Pending ID"}
            </Typography.Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Mobile",
      dataIndex: "mobileNumber",
      key: "mobileNumber",
    },
    {
      title: "Join Date",
      dataIndex: "joinDate",
      key: "joinDate",
      render: (date) => (date ? formatDate(date) : "—"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "ACTIVE" ? "success" : "default"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, member) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            onClose();
            navigate(`/members/${member.id}`);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      title={
        <div>
          <span>{somiti?.name || "Somiti"} — Members</span>
          {somiti?.code && (
            <Tag color="blue" style={{ marginLeft: 8 }}>
              {somiti.code}
            </Tag>
          )}
        </div>
      }
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      width={720}
      destroyOnClose
    >
      <div style={{ marginTop: 16 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={members}
          loading={isLoading}
          scroll={{ x: 550 }}
          pagination={{ pageSize: 5 }}
          locale={{
            emptyText: (
              <Empty
                description="No members enrolled in this somiti yet"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </div>
    </Modal>
  );
}
