import { Button, Layout, Menu, Typography } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useAppTheme } from "../../app/providers/ThemeContext.js";
import { navigationItems } from "../../constants/navigation.jsx";
import { can } from "../../modules/auth/permissions.js";

const { Sider } = Layout;

const filterNavigationItems = (items, user) =>
  items.flatMap((item) => {
    if (item.permission && !can(user, item.permission)) return [];

    if (!item.children) return [item];

    const children = filterNavigationItems(item.children, user);
    return children.length ? [{ ...item, children }] : [];
  });

export function DashboardSidebar({
  collapsed,
  onCollapse,
  isMobile,
  onBreakpointChange,
}) {
  const { isDark } = useAppTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const visibleNavigationItems = useMemo(
    () => filterNavigationItems(navigationItems, user),
    [user],
  );
  const selectedKey = location.pathname === "/" ? "/" : location.pathname;
  const openKeys = location.pathname.startsWith("/loans")
    ? ["loans-group"]
    : [];

  return (
    <Sider
      breakpoint="lg"
      collapsedWidth="0"
      width={248}
      collapsed={collapsed}
      onCollapse={onCollapse}
      onBreakpoint={(broken) => {
        onBreakpointChange?.(broken);
        onCollapse(broken);
      }}
      trigger={null}
      theme={isDark ? "dark" : "light"}
      className={`app-sider ${isDark ? "app-sider-dark" : "app-sider-light"}`}
    >
      <div className="brand-lockup">
        <div className="brand-mark">
          <img src="/favicon.png" alt="Logo" />
        </div>
        <div className="brand-info">
          <Typography.Text className="brand-name">Purbasha NGO</Typography.Text>
          <Typography.Text className="brand-caption">
            Microfinance & Savings System
          </Typography.Text>
        </div>
        {isMobile && (
          <Button
            type="text"
            className="sidebar-close-btn"
            aria-label="Close navigation"
            icon={<CloseOutlined />}
            onClick={() => onCollapse(true)}
          />
        )}
      </div>
      <Menu
        mode="inline"
        theme={isDark ? "dark" : "light"}
        items={visibleNavigationItems}
        selectedKeys={[selectedKey]}
        defaultOpenKeys={openKeys}
        onClick={({ key }) => {
          if (!key.startsWith("/")) return;

          navigate(key);
          if (isMobile) {
            onCollapse(true);
          }
        }}
      />
    </Sider>
  );
}
