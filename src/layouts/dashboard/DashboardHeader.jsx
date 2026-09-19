import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SearchOutlined,
  SunOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Dropdown,
  Input,
  Layout,
  Space,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useAppTheme } from "../../app/providers/ThemeContext.js";

const { Header } = Layout;

export function DashboardHeader({ collapsed, onToggle }) {
  const { isDark, toggleTheme } = useAppTheme();

  return (
    <Header className="app-header">
      <Space className="header-left" size="middle">
        <Button
          type="text"
          aria-label="Toggle sidebar"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
        />
        <Input
          className="global-search"
          prefix={<SearchOutlined />}
          placeholder="Search member, loan ID or phone..."
        />
      </Space>
      <Space className="header-actions" size="middle">
        <Typography.Text className="header-date">
          {dayjs().format("DD MMM YYYY")}
        </Typography.Text>
        <Tooltip title={isDark ? "Use light mode" : "Use dark mode"}>
          <Button
            type="text"
            aria-label={isDark ? "Use light mode" : "Use dark mode"}
            icon={isDark ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
          />
        </Tooltip>

        <Dropdown
          menu={{
            items: [
              { key: "profile", label: "Profile" },
              { key: "logout", label: "Log out" },
            ],
          }}
          trigger={["click"]}
        >
          <Button type="text" className="profile-button">
            <Avatar size="small" icon={<UserOutlined />} />
            <Typography.Text>Administrator</Typography.Text>
          </Button>
        </Dropdown>
      </Space>
    </Header>
  );
}
