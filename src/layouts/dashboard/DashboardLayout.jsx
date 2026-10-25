import { Layout } from "antd";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { DashboardHeader } from "./DashboardHeader.jsx";
import { DashboardSidebar } from "./DashboardSidebar.jsx";

const { Content } = Layout;

export function DashboardLayout() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 992,
  );
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 992,
  );

  // Close sidebar on Escape key when open on mobile
  useEffect(() => {
    if (!isMobile || collapsed) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setCollapsed(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, collapsed]);

  return (
    <Layout className="app-layout">
      <DashboardSidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        isMobile={isMobile}
        onBreakpointChange={setIsMobile}
      />
      {isMobile && !collapsed && (
        <div
          className="sidebar-backdrop"
          onClick={() => setCollapsed(true)}
          aria-hidden="true"
        />
      )}
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
