import { Alert } from "antd";

export function ErrorState({
  message = "Something went wrong. Please try again.",
}) {
  return <Alert type="error" showIcon message={message} />;
}
