import { Layout, Menu, Typography } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { navigationItems } from "../../constants/navigation.jsx";

const { Sider } = Layout;

export function DashboardSidebar({ collapsed, onCollapse }) {
  const location = useLocation();
  const navigate = useNavigate();
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
      className="app-sider"
    >
      <div className="brand-lockup">
        <div className="brand-mark">প</div>
        <div>
          <Typography.Text className="brand-name">
            পূর্বাশা আর্থিক উন্নয়ন সংস্থা
          </Typography.Text>
        </div>
      </div>
      <Menu
        mode="inline"
        theme="dark"
        items={navigationItems}
        selectedKeys={[selectedKey]}
        defaultOpenKeys={openKeys}
        onClick={({ key }) => key.startsWith("/") && navigate(key)}
      />
    </Sider>
  );
}
