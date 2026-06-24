import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { getProfileWithRole } from '@/lib/utils/permissions';
import { logServerError } from '@/lib/utils/server-error-logger';
import { loadTemplateLogoDataUrl } from '@/lib/pdf/template-logo';
import { DailySiteDiaryPDF } from '@/lib/pdf/daily-site-diary-pdf';
import type { DailySiteDiary, DelayInstructionRow, PlantEquipmentRow, SiteDiaryResourceAllocation, VisitorRow } from '@/types/daily-reports';

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

    const { data: diary, error: diaryError } = await db.from('daily_site_diaries').select('*').eq('id', id).single();
    if (diaryError || !diary) {
      return NextResponse.json({ error: 'Daily site diary not found' }, { status: 404 });
    }

    const profile = await getProfileWithRole(user.id);
    const typedDiary = diary as DailySiteDiary;
    const isOwner = typedDiary.user_id === user.id;
    const isManager = profile?.role?.is_manager_admin || false;
    if (!isOwner && !isManager) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [employeeResult, reviewerResult, resources, plant, visitors, delays] = await Promise.all([
      db.from('profiles').select('full_name').eq('id', typedDiary.user_id).single(),
      typedDiary.reviewed_by
        ? db.from('profiles').select('full_name').eq('id', typedDiary.reviewed_by).single()
        : Promise.resolve({ data: null, error: null }),
      db.from('daily_site_diary_resource_allocations').select('*').eq('diary_id', id).order('display_order', { ascending: true }),
      db.from('daily_site_diary_plant_equipment').select('*').eq('diary_id', id).order('display_order', { ascending: true }),
      db.from('daily_site_diary_visitors').select('*').eq('diary_id', id).order('display_order', { ascending: true }),
      db.from('daily_site_diary_delay_instructions').select('*').eq('diary_id', id).order('display_order', { ascending: true }),
    ]);

    if (resources.error) throw resources.error;
    if (plant.error) throw plant.error;
    if (visitors.error) throw visitors.error;
    if (delays.error) throw delays.error;

    const logoSrc = await loadTemplateLogoDataUrl({ preferPdfLogo: true });
    const stream = await renderToStream(
      DailySiteDiaryPDF({
        diary: {
          ...typedDiary,
          resource_allocations: (resources.data || []) as SiteDiaryResourceAllocation[],
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
        'Content-Disposition': `attachment; filename="daily-site-diary-${typedDiary.report_date}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Daily site diary PDF generation error:', error);
    await logServerError({
      error: error as Error,
      request,
      componentName: '/api/daily-site-diary/[id]/pdf',
      additionalData: { endpoint: '/api/daily-site-diary/[id]/pdf' },
    });
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
