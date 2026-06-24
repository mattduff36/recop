import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { getProfileWithRole } from '@/lib/utils/permissions';
import { logServerError } from '@/lib/utils/server-error-logger';
import { loadTemplateLogoDataUrl } from '@/lib/pdf/template-logo';
import { ShiftReportPDF } from '@/lib/pdf/shift-report-pdf';
import type { DelayInstructionRow, PlantEquipmentRow, ShiftReport, ShiftReportResourceAllocation, VisitorRow } from '@/types/daily-reports';

type DbClient = {
  from: (table: string) => QueryBuilder;
};

interface QueryResult<T = unknown> {
  data: T | null;
  error: Error | null;
}

interface QueryBuilder {
  select: (columns?: string) => QueryBuilder;
  eq: (column: string, value: unknown) => QueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder;
  single: () => Promise<QueryResult<unknown>>;
  then: Promise<QueryResult<unknown>>['then'];
}

async function streamToBuffer(stream: AsyncIterable<Uint8Array | string>): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const db = supabase as unknown as DbClient;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: report, error: reportError } = await db.from('shift_reports').select('*').eq('id', id).single();
    if (reportError || !report) {
      return NextResponse.json({ error: 'Shift report not found' }, { status: 404 });
    }

    const profile = await getProfileWithRole(user.id);
    const typedReport = report as ShiftReport;
    const isOwner = typedReport.user_id === user.id;
    const isManager = profile?.role?.is_manager_admin || false;
    if (!isOwner && !isManager) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [employeeResult, reviewerResult, resources, plant, visitors, delays] = await Promise.all([
      db.from('profiles').select('full_name').eq('id', typedReport.user_id).single(),
      typedReport.reviewed_by
        ? db.from('profiles').select('full_name').eq('id', typedReport.reviewed_by).single()
        : Promise.resolve({ data: null, error: null }),
      db.from('shift_report_resource_allocations').select('*').eq('report_id', id).order('display_order', { ascending: true }),
      db.from('shift_report_plant_equipment').select('*').eq('report_id', id).order('display_order', { ascending: true }),
      db.from('shift_report_visitors').select('*').eq('report_id', id).order('display_order', { ascending: true }),
      db.from('shift_report_delay_instructions').select('*').eq('report_id', id).order('display_order', { ascending: true }),
    ]);

    if (resources.error) throw resources.error;
    if (plant.error) throw plant.error;
    if (visitors.error) throw visitors.error;
    if (delays.error) throw delays.error;

    const logoSrc = await loadTemplateLogoDataUrl({ preferPdfLogo: true });
    const stream = await renderToStream(
      ShiftReportPDF({
        report: {
          ...typedReport,
          resource_allocations: (resources.data || []) as ShiftReportResourceAllocation[],
          plant_equipment: (plant.data || []) as PlantEquipmentRow[],
          visitors: (visitors.data || []) as VisitorRow[],
          delay_instructions: (delays.data || []) as DelayInstructionRow[],
        },
        employeeName: (employeeResult.data as { full_name?: string } | null)?.full_name || null,
        approvedByName: (reviewerResult.data as { full_name?: string } | null)?.full_name || null,
        logoSrc,
      })
    );
    const buffer = await streamToBuffer(stream);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="shift-report-${typedReport.report_date}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Shift report PDF generation error:', error);
    await logServerError({
      error: error as Error,
      request,
      componentName: '/api/shift-reports/[id]/pdf',
      additionalData: { endpoint: '/api/shift-reports/[id]/pdf' },
    });
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
