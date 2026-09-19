import { Spin } from "antd";

export function LoadingState({ tip = "Loading..." }) {
  return (
    <div className="state-panel">
      <Spin tip={tip} />
    </div>
  );
}
