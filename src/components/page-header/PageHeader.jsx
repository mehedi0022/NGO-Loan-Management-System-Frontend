import { Space, Typography } from "antd";

export function PageHeader({ title, description, actions }) {
  return (
    <div className="page-header">
      <div>
        <Typography.Title level={2}>{title}</Typography.Title>
        {description && (
          <Typography.Paragraph>{description}</Typography.Paragraph>
        )}
      </div>
      {actions && <Space>{actions}</Space>}
    </div>
  );
}
