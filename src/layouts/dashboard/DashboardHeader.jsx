import {
  CloseOutlined,
  KeyOutlined,
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
  Space,
  Tooltip,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { useAppTheme } from "../../app/providers/ThemeContext.js";
import {
  useChangePasswordMutation,
  useLogoutMutation,
} from "../../modules/auth/authApi.js";
import { clearAuth } from "../../modules/auth/authSlice.js";
import { ChangePasswordModal } from "../../modules/auth/components/ChangePasswordModal.jsx";
import { baseApi } from "../../services/baseApi.js";

const { Header } = Layout;

export function DashboardHeader({ collapsed, onToggle }) {
  const { isDark, toggleTheme } = useAppTheme();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [changePassword, { isLoading: isChangingPassword }] =
    useChangePasswordMutation();

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
      return;
    }

    if (key === "change-password") {
      setChangePasswordOpen(true);
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
      key: "change-password",
      icon: <KeyOutlined />,
      label: "Change Password",
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

  const handleChangePassword = async (values) => {
    try {
      await changePassword(values).unwrap();
      setChangePasswordOpen(false);
      message.success("Password changed successfully. Please sign in again.");
      dispatch(clearAuth());
      dispatch(baseApi.util.resetApiState());
      navigate("/login", { replace: true });
    } catch (error) {
      message.error(error?.data?.message || "Unable to change password");
    }
  };

  return (
    <Header className="app-header">
      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="mobile-search-bar">
          <Input
            autoFocus
            prefix={<SearchOutlined />}
            placeholder="Search member, loan ID, phone..."
            style={{ width: "100%" }}
            allowClear
          />
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={() => setMobileSearchOpen(false)}
          />
        </div>
      )}

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

      <Space className="header-actions" size="small">
        {/* Mobile search toggle trigger */}
        <Button
          type="text"
          className="mobile-search-toggle-btn"
          icon={<SearchOutlined style={{ fontSize: 16 }} />}
          onClick={() => setMobileSearchOpen((v) => !v)}
          aria-label="Toggle Search"
        />

        <Typography.Text className="header-date">
          {dayjs().format("DD MMM YYYY")}
        </Typography.Text>

        <Tooltip title={isDark ? "Use light mode" : "Use dark mode"}>
          <Button
            type="text"
            aria-label={isDark ? "Use light mode" : "Use dark mode"}
            icon={
              isDark ? (
                <SunOutlined style={{ color: "#f59e0b", fontSize: 17 }} />
              ) : (
                <MoonOutlined style={{ fontSize: 17 }} />
              )
            }
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
            <Typography.Text className="profile-user-name">
              {user?.userName || "User"}
            </Typography.Text>
          </Button>
        </Dropdown>
      </Space>

      <ChangePasswordModal
        open={changePasswordOpen}
        loading={isChangingPassword}
        onCancel={() => setChangePasswordOpen(false)}
        onSubmit={handleChangePassword}
      />
    </Header>
  );
}
