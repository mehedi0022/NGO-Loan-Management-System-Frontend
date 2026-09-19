import { Empty } from "antd";
import { PageContainer } from "../../components/page-container/PageContainer.jsx";
import { PageHeader } from "../../components/page-header/PageHeader.jsx";

export function PlaceholderPage({ title, description }) {
  return (
    <PageContainer>
      <PageHeader title={title} description={description} />
      <div className="placeholder-panel">
        <Empty description="This workspace is ready for the next implementation phase." />
      </div>
    </PageContainer>
  );
}
