import { Button, Layout, Menu, Typography } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useAppTheme } from "../../app/providers/ThemeContext.js";
import { navigationItems } from "../../constants/navigation.jsx";
import { can, canAny } from "../../modules/auth/permissions.js";

const { Sider } = Layout;

const filterNavigationItems = (items, user) =>
  items.flatMap((item) => {
    const { permission, anyOf, children, ...menuItem } = item;

    if (permission && !can(user, permission)) return [];
    if (anyOf && !canAny(user, anyOf)) return [];

    if (!children) return [menuItem];

    const filteredChildren = filterNavigationItems(children, user);
    return filteredChildren.length
      ? [{ ...menuItem, children: filteredChildren }]
      : [];
  });

const collectLeafKeys = (items) =>
  items.flatMap((item) =>
    item.children ? collectLeafKeys(item.children) : [item.key],
  );

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

  const leafKeys = useMemo(
    () => collectLeafKeys(visibleNavigationItems),
    [visibleNavigationItems],
  );

  // Match exact route first, or fall back to longest prefix (e.g. /members/12 -> /members)
  const selectedKey = useMemo(() => {
    if (location.pathname === "/") return "/";
    if (leafKeys.includes(location.pathname)) return location.pathname;
    const prefixMatch = leafKeys
      .filter((k) => k !== "/" && location.pathname.startsWith(`${k}/`))
      .sort((a, b) => b.length - a.length)[0];
    return prefixMatch || location.pathname;
  }, [location.pathname, leafKeys]);

  const [openKeys, setOpenKeys] = useState(() => {
    const initial = [];
    if (location.pathname.startsWith("/members")) initial.push("members-group");
    if (location.pathname.startsWith("/loans")) initial.push("loans-group");
    return initial;
  });

  useEffect(() => {
    if (location.pathname.startsWith("/members") && !openKeys.includes("members-group")) {
      setOpenKeys((prev) => [...prev, "members-group"]);
    }
    if (location.pathname.startsWith("/loans") && !openKeys.includes("loans-group")) {
      setOpenKeys((prev) => [...prev, "loans-group"]);
    }
  }, [location.pathname]);

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
        openKeys={openKeys}
        onOpenChange={(keys) => setOpenKeys(keys)}
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
