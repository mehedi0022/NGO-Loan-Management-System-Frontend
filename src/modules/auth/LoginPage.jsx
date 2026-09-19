import {
  ArrowRightOutlined,
  LockOutlined,
  MailOutlined,
  MoonOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
  SunOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  Space,
  Tooltip,
  Typography,
} from "antd";
import { useAppTheme } from "../../app/providers/ThemeContext.js";

export function LoginPage() {
  const { isDark, toggleTheme } = useAppTheme();

  return (
    <main className="login-page">
      <section className="login-intro" aria-label="Nuru Finance">
        <div className="login-brand">
          <div className="login-brand-mark">N</div>
          <div>
            <Typography.Text className="login-brand-name">
              Nuru Finance
            </Typography.Text>
            <Typography.Text className="login-brand-caption">
              Loan management
            </Typography.Text>
          </div>
        </div>

        <div className="login-intro-copy">
          <Typography.Text className="login-eyebrow">
            OPERATIONS WORKSPACE
          </Typography.Text>
          <Typography.Title level={1}>
            Lending clarity,
            <br />
            every day.
          </Typography.Title>
          <Typography.Paragraph>
            A focused workspace for the people who keep your lending operations
            moving.
          </Typography.Paragraph>
        </div>

        <div className="login-insight-card">
          <div className="login-insight-heading">
            <span>Portfolio pulse</span>
            <RiseOutlined />
          </div>
          <div className="login-insight-value">৳1,07,470</div>
          <div className="login-insight-meta">
            <span>Active loan value</span>
            <strong>+12.8%</strong>
          </div>
          <div className="login-sparkline" aria-hidden="true">
            <span style={{ height: "32%" }} />
            <span style={{ height: "48%" }} />
            <span style={{ height: "42%" }} />
            <span style={{ height: "65%" }} />
            <span style={{ height: "58%" }} />
            <span style={{ height: "82%" }} />
            <span style={{ height: "100%" }} />
          </div>
        </div>

        <div className="login-intro-footer">
          <SafetyCertificateOutlined />
          <Typography.Text>Secure organisation access</Typography.Text>
        </div>
      </section>

      <section className="login-form-section">
        <Tooltip title={isDark ? "Use light mode" : "Use dark mode"}>
          <Button
            className="login-theme-toggle"
            type="text"
            aria-label={isDark ? "Use light mode" : "Use dark mode"}
            icon={isDark ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
          />
        </Tooltip>
        <Card bordered={false} className="login-card">
          <div className="login-card-heading">
            <Typography.Text className="login-mobile-label">
              NURU FINANCE
            </Typography.Text>
            <Typography.Text className="login-card-kicker">
              WORKSPACE ACCESS
            </Typography.Text>
            <Typography.Title level={2}>Welcome back</Typography.Title>
            <Typography.Paragraph>
              Sign in to continue to your workspace.
            </Typography.Paragraph>
          </div>

          <Form
            layout="vertical"
            requiredMark={false}
            size="large"
            validateTrigger="onBlur"
            autoComplete="off"
          >
            <Form.Item
              label="Email address"
              name="email"
              rules={[
                { required: true, message: "Enter your email address" },
                { type: "email", message: "Enter a valid email address" },
              ]}
            >
              <Input
                autoComplete="off"
                data-1p-ignore="true"
                data-bwignore="true"
                data-form-type="other"
                data-lpignore="true"
                prefix={<MailOutlined />}
                placeholder="you@organisation.org"
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Enter your password" }]}
            >
              <Input.Password
                autoComplete="new-password"
                data-1p-ignore="true"
                data-bwignore="true"
                data-form-type="other"
                data-lpignore="true"
                prefix={<LockOutlined />}
                placeholder="Enter your password"
              />
            </Form.Item>

            <div className="login-form-options">
              <Checkbox>Remember me</Checkbox>
              <Button type="link" className="login-forgot-button">
                Forgot password?
              </Button>
            </div>

            <Form.Item className="login-submit-item">
              <Button
                block
                type="primary"
                htmlType="submit"
                icon={<ArrowRightOutlined />}
                iconPosition="end"
              >
                Sign in
              </Button>
            </Form.Item>
          </Form>

          <Space className="login-help" direction="vertical" size={4}>
            <Typography.Text>Need access to this workspace?</Typography.Text>
            <Typography.Text type="secondary">
              Contact your organisation administrator.
            </Typography.Text>
          </Space>
        </Card>
      </section>
    </main>
  );
}
