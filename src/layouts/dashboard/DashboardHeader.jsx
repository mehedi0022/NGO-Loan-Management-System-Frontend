import {
  LogoutOutlined,
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
  message,
  Space,
  Tooltip,
  Typography,
} from "antd";

import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { useAppTheme } from "../../app/providers/ThemeContext.js";
import { useLogoutMutation } from "../../modules/auth/authApi.js";
import { clearAuth } from "../../modules/auth/authSlice.js";
import { baseApi } from "../../services/baseApi.js";

const { Header } = Layout;

export function DashboardHeader({ collapsed, onToggle }) {
  const { isDark, toggleTheme } = useAppTheme();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);

  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();

      message.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      dispatch(clearAuth());
      dispatch(baseApi.util.resetApiState());

      navigate("/login", {
        replace: true,
      });
    }
  };

  const handleMenuClick = ({ key }) => {
    if (key === "profile") {
      // Profile page will be added later.
      return;
    }

    if (key === "logout") {
      handleLogout();
    }
  };

  const menuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: isLoggingOut ? "Logging out..." : "Log out",
      danger: true,
      disabled: isLoggingOut,
    },
  ];

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
            items: menuItems,
            onClick: handleMenuClick,
          }}
          trigger={["click"]}
        >
          <Button type="text" className="profile-button">
            <Avatar size="small" icon={<UserOutlined />} />

            <Typography.Text>{user?.userName || "User"}</Typography.Text>
          </Button>
        </Dropdown>
      </Space>
    </Header>
  );
}
