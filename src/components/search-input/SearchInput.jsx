import { SearchOutlined } from "@ant-design/icons";
import { Input } from "antd";

export function SearchInput({ value, onChange, placeholder = "Search" }) {
  return (
    <Input
      allowClear
      value={value}
      prefix={<SearchOutlined />}
      placeholder={placeholder}
      onChange={(event) => onChange?.(event.target.value)}
    />
  );
}
