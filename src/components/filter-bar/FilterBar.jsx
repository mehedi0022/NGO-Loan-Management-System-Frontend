import { FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Space } from "antd";

export function FilterBar({ children, onReset }) {
  return (
    <div className="filter-bar">
      <Space wrap>
        <FilterOutlined className="filter-icon" />
        {children}
        {onReset && (
          <Button type="link" icon={<ReloadOutlined />} onClick={onReset}>
            Reset
          </Button>
        )}
      </Space>
    </div>
  );
}
