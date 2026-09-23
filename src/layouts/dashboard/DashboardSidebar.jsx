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
        items={navigationItems}
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
