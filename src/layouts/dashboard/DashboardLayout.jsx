import { Layout } from "antd";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { DashboardHeader } from "./DashboardHeader.jsx";
import { DashboardSidebar } from "./DashboardSidebar.jsx";

const { Content } = Layout;

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout className="app-layout">
      <DashboardSidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <Layout>
        <DashboardHeader
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
        />
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
