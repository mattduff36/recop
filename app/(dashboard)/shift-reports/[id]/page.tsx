import { DailyReportDetailPage } from '@/app/(dashboard)/daily-reports/components/DailyReportPages';

export default async function ShiftReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DailyReportDetailPage module="shift-reports" id={id} />;
}
