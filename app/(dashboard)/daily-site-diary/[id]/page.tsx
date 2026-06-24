import { DailyReportDetailPage } from '@/app/(dashboard)/daily-reports/components/DailyReportPages';

export default async function DailySiteDiaryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DailyReportDetailPage module="daily-site-diary" id={id} />;
}
