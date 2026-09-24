import { Layout, Menu, Typography } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useSelector } from "react-redux";
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

export function DashboardSidebar({ collapsed, onCollapse }) {
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
      onBreakpoint={(broken) => onCollapse(broken)}
      trigger={null}
      className="app-sider"
    >
      <div className="brand-lockup">
        <div className="brand-mark">
          {" "}
          <img src="./favicon.png" alt="" />{" "}
        </div>
        <div>
          <Typography.Text className="text-sm">
            পূর্বাশা আর্থিক উন্নয়ন সংস্থা
          </Typography.Text>
          <Typography.Text className="brand-caption">
            ক্ষুদ্রঋণ ও সঞ্চয় ব্যবস্থাপনা সিস্টেম
          </Typography.Text>
        </div>
      </div>
      <Menu
        mode="inline"
        theme="dark"
        items={visibleNavigationItems}
        selectedKeys={[selectedKey]}
        defaultOpenKeys={openKeys}
        onClick={({ key }) => {
          if (!key.startsWith("/")) return;

          navigate(key);
          onCollapse(false);
        }}
      />
    </Sider>
  );
}
