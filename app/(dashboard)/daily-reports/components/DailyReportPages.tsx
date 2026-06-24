'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isSameDay, startOfMonth, subMonths } from 'date-fns';
import { CalendarDays, CheckCircle2, Download, FileText, Loader2, Plus, Save, Send, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AppPageHeader, AppPageShell } from '@/components/layout/AppPageShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageLoader } from '@/components/ui/page-loader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SignaturePad } from '@/components/forms/SignaturePad';
import { fetchUserDirectory } from '@/lib/client/user-directory';
import { useAuth } from '@/lib/hooks/useAuth';
import { useBrowserSupabaseClient } from '@/lib/hooks/useBrowserSupabaseClient';
import { usePermissionCheck } from '@/lib/hooks/usePermissionCheck';
import { cn } from '@/lib/utils/cn';
import { formatDate, formatDateISO } from '@/lib/utils/date';
import type {
  DailyReportModule,
  DailyReportModuleConfig,
  DailyReportStatus,
  DailySiteDiary,
  DelayInstructionRow,
  PlantEquipmentRow,
  ProfileSummary,
  ShiftReport,
  ShiftReportResourceAllocation,
  SiteDiaryResourceAllocation,
  VisitorRow,
} from '@/types/daily-reports';
import {
  createEmptyDelayInstruction,
  createEmptyPlantEquipment,
  createEmptyShiftResource,
  createEmptySiteDiaryResource,
  createEmptyVisitor,
  getDailyReportConfig,
} from '@/types/daily-reports';

interface QueryResult<T = unknown> {
  data: T | null;
  error: Error | null;
}

interface QueryBuilder {
  select: (columns?: string) => QueryBuilder;
  eq: (column: string, value: unknown) => QueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder;
  limit: (count: number) => Promise<QueryResult<unknown[]>>;
  single: () => Promise<QueryResult<unknown>>;
  insert: (payload: unknown) => QueryBuilder;
  update: (payload: unknown) => QueryBuilder;
  delete: () => QueryBuilder;
  then: Promise<QueryResult<unknown>>['then'];
}

type DailyReportDb = {
  from: (table: string) => QueryBuilder;
};

type ReportRow = ShiftReport | DailySiteDiary;

interface EmployeeOption {
  id: string;
  full_name: string;
  employee_id: string | null;
  has_module_access?: boolean;
}

interface ReportFormState {
  report_date: string;
  day_label: string;
  job_no: string;
  site: string;
  van_registration: string;
  mileage: string;
  travel_start_time: string;
  travel_finish_time: string;
  site_start_time: string;
  site_finish_time: string;
  start_time: string;
  finish_time: string;
  travel_duration_hours: string;
  onsite_duration_hours: string;
  duration_hours: string;
  total_time_hours: string;
  fatigue_hours: string;
  activity_description: string;
  comments: string;
  instructed_on_site_by: string;
  instructed_on_site_name: string;
  instructed_on_site_signature_data: string;
}

const statusLabel: Record<DailyReportStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
};

const statusVariant: Record<DailyReportStatus, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  draft: 'secondary',
  submitted: 'warning',
  approved: 'success',
  rejected: 'destructive',
};

function emptyFormState(): ReportFormState {
  const today = formatDateISO(new Date());
  return {
    report_date: today,
    day_label: format(new Date(), 'EEEE'),
    job_no: '',
    site: '',
    van_registration: '',
    mileage: '',
    travel_start_time: '',
    travel_finish_time: '',
    site_start_time: '',
    site_finish_time: '',
    start_time: '',
    finish_time: '',
    travel_duration_hours: '0',
    onsite_duration_hours: '0',
    duration_hours: '0',
    total_time_hours: '0',
    fatigue_hours: '0',
    activity_description: '',
    comments: '',
    instructed_on_site_by: '',
    instructed_on_site_name: '',
    instructed_on_site_signature_data: '',
  };
}

function numericValue(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function textValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function timeValue(value: unknown): string {
  return textValue(value).slice(0, 5);
}

function numberInputValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function isShiftReport(module: DailyReportModule): boolean {
  return module === 'shift-reports';
}

function getReportTitle(config: DailyReportModuleConfig, report: ReportRow): string {
  return `${config.singularTitle} - ${formatDate(report.report_date)}`;
}

function hasRowContent(row: Record<string, unknown>): boolean {
  return Object.entries(row).some(([key, value]) => {
    if (key === 'id' || key === 'display_order') return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'boolean') return value;
    return false;
  });
}

async function fetchReportChildren(db: DailyReportDb, config: DailyReportModuleConfig, reportId: string) {
  const parentColumn = config.parentIdColumn;
  const [resources, plant, visitors, delays] = await Promise.all([
    db.from(config.resourceTable).select('*').eq(parentColumn, reportId).order('display_order', { ascending: true }),
    db.from(config.plantTable).select('*').eq(parentColumn, reportId).order('display_order', { ascending: true }),
    db.from(config.visitorsTable).select('*').eq(parentColumn, reportId).order('display_order', { ascending: true }),
    db.from(config.delaysTable).select('*').eq(parentColumn, reportId).order('display_order', { ascending: true }),
  ]);

  if (resources.error) throw resources.error;
  if (plant.error) throw plant.error;
  if (visitors.error) throw visitors.error;
  if (delays.error) throw delays.error;

  return {
    resource_allocations: (resources.data || []) as unknown[],
    plant_equipment: (plant.data || []) as unknown[],
    visitors: (visitors.data || []) as unknown[],
    delay_instructions: (delays.data || []) as unknown[],
  };
}

async function fetchReport(db: DailyReportDb, config: DailyReportModuleConfig, id: string): Promise<ReportRow> {
  const selectProfile =
    config.module === 'shift-reports'
      ? '*, profile:profiles!shift_reports_user_id_fkey(id, full_name, employee_id, team_id)'
      : '*, profile:profiles!daily_site_diaries_user_id_fkey(id, full_name, employee_id, team_id)';
  const { data, error } = await db.from(config.tableName).select(selectProfile).eq('id', id).single();
  if (error) throw error;

  const children = await fetchReportChildren(db, config, id);
  if (config.module === 'shift-reports') {
    return {
      ...(data as ShiftReport),
      resource_allocations: children.resource_allocations as ShiftReportResourceAllocation[],
      plant_equipment: children.plant_equipment as PlantEquipmentRow[],
      visitors: children.visitors as VisitorRow[],
      delay_instructions: children.delay_instructions as DelayInstructionRow[],
    };
  }

  return {
    ...(data as DailySiteDiary),
    resource_allocations: children.resource_allocations as SiteDiaryResourceAllocation[],
    plant_equipment: children.plant_equipment as PlantEquipmentRow[],
    visitors: children.visitors as VisitorRow[],
    delay_instructions: children.delay_instructions as DelayInstructionRow[],
  };
}

function makeHeaderPayload(module: DailyReportModule, userId: string, form: ReportFormState, status: DailyReportStatus, signatureData?: string | null) {
  const shared = {
    user_id: userId,
    report_date: form.report_date,
    day_label: form.day_label || format(new Date(form.report_date), 'EEEE'),
    job_no: form.job_no.trim() || null,
    site: form.site.trim() || null,
    van_registration: form.van_registration.trim() || null,
    mileage: form.mileage.trim() ? numericValue(form.mileage) : null,
    total_time_hours: numericValue(form.total_time_hours),
    activity_description: form.activity_description.trim() || null,
    comments: form.comments.trim() || null,
    status,
    submitted_at: status === 'submitted' ? new Date().toISOString() : null,
    signature_data: signatureData || null,
    signed_at: signatureData ? new Date().toISOString() : null,
  };

  if (isShiftReport(module)) {
    return {
      ...shared,
      travel_start_time: form.travel_start_time || null,
      travel_finish_time: form.travel_finish_time || null,
      site_start_time: form.site_start_time || null,
      site_finish_time: form.site_finish_time || null,
      travel_duration_hours: numericValue(form.travel_duration_hours),
      onsite_duration_hours: numericValue(form.onsite_duration_hours),
    };
  }

  return {
    ...shared,
    start_time: form.start_time || null,
    finish_time: form.finish_time || null,
    duration_hours: numericValue(form.duration_hours),
    travel_hours: numericValue(form.travel_duration_hours),
    onsite_hours: numericValue(form.onsite_duration_hours),
    fatigue_hours: numericValue(form.fatigue_hours),
    instructed_on_site_by: form.instructed_on_site_by.trim() || null,
    instructed_on_site_name: form.instructed_on_site_name.trim() || null,
    instructed_on_site_signature_data: form.instructed_on_site_signature_data || null,
  };
}

function reportToFormState(module: DailyReportModule, report: ReportRow): ReportFormState {
  const base = emptyFormState();
  const shift = report as ShiftReport;
  const diary = report as DailySiteDiary;

  return {
    ...base,
    report_date: report.report_date,
    day_label: report.day_label || format(new Date(report.report_date), 'EEEE'),
    job_no: report.job_no || '',
    site: report.site || '',
    van_registration: report.van_registration || '',
    mileage: numberInputValue(report.mileage),
    travel_start_time: isShiftReport(module) ? timeValue(shift.travel_start_time) : '',
    travel_finish_time: isShiftReport(module) ? timeValue(shift.travel_finish_time) : '',
    site_start_time: isShiftReport(module) ? timeValue(shift.site_start_time) : '',
    site_finish_time: isShiftReport(module) ? timeValue(shift.site_finish_time) : '',
    start_time: !isShiftReport(module) ? timeValue(diary.start_time) : '',
    finish_time: !isShiftReport(module) ? timeValue(diary.finish_time) : '',
    travel_duration_hours: numberInputValue(isShiftReport(module) ? shift.travel_duration_hours : diary.travel_hours),
    onsite_duration_hours: numberInputValue(isShiftReport(module) ? shift.onsite_duration_hours : diary.onsite_hours),
    duration_hours: numberInputValue(!isShiftReport(module) ? diary.duration_hours : 0),
    total_time_hours: numberInputValue(report.total_time_hours),
    fatigue_hours: numberInputValue(!isShiftReport(module) ? diary.fatigue_hours : 0),
    activity_description: report.activity_description || '',
    comments: report.comments || '',
    instructed_on_site_by: !isShiftReport(module) ? diary.instructed_on_site_by || '' : '',
    instructed_on_site_name: !isShiftReport(module) ? diary.instructed_on_site_name || '' : '',
    instructed_on_site_signature_data: !isShiftReport(module) ? diary.instructed_on_site_signature_data || '' : '',
  };
}

function normalizeShiftResources(rows?: ShiftReportResourceAllocation[]): ShiftReportResourceAllocation[] {
  return rows?.length ? rows : [createEmptyShiftResource(0), createEmptyShiftResource(1), createEmptyShiftResource(2)];
}

function normalizeDiaryResources(rows?: SiteDiaryResourceAllocation[]): SiteDiaryResourceAllocation[] {
  return rows?.length ? rows : [createEmptySiteDiaryResource(0), createEmptySiteDiaryResource(1), createEmptySiteDiaryResource(2)];
}

function normalizeRows<T>(rows: T[] | undefined, factory: (index: number) => T): T[] {
  return rows?.length ? rows : [factory(0), factory(1)];
}

function StatusBadge({ status }: { status: DailyReportStatus }) {
  return <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>;
}

function EmployeeName({ profile, fallback }: { profile?: ProfileSummary | null; fallback: string }) {
  return <span>{profile?.full_name || fallback}</span>;
}

export function DailyReportListPage({ module }: { module: DailyReportModule }) {
  const config = getDailyReportConfig(module);
  const { user, isManager, isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const { hasPermission, loading: permissionLoading } = usePermissionCheck(config.permission);
  const supabase = useBrowserSupabaseClient();
  const db = supabase as unknown as DailyReportDb;
  const isElevated = isManager || isAdmin || isSuperAdmin;
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  useEffect(() => {
    if (!user || !hasPermission || authLoading || permissionLoading) return;

    let cancelled = false;
    const currentUserId = user.id;
    async function loadReports() {
      setLoading(true);
      try {
        const selectProfile =
          config.module === 'shift-reports'
            ? '*, profile:profiles!shift_reports_user_id_fkey(id, full_name, employee_id, team_id)'
            : '*, profile:profiles!daily_site_diaries_user_id_fkey(id, full_name, employee_id, team_id)';
        let query = db.from(config.tableName).select(selectProfile).order('report_date', { ascending: false });
        if (!isElevated) query = query.eq('user_id', currentUserId);
        const { data, error } = await query.limit(60);
        if (error) throw error;
        if (!cancelled) setReports((data || []) as ReportRow[]);
      } catch (error) {
        console.error(`Error loading ${config.title}:`, error);
        if (!cancelled) toast.error(`Unable to load ${config.title.toLowerCase()}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadReports();
    return () => {
      cancelled = true;
    };
  }, [authLoading, config, db, hasPermission, isElevated, permissionLoading, user]);

  const reportsByDate = useMemo(() => {
    const map = new Map<string, ReportRow[]>();
    reports.forEach((report) => {
      const rows = map.get(report.report_date) || [];
      rows.push(report);
      map.set(report.report_date, rows);
    });
    return map;
  }, [reports]);

  const downloadPdf = async (reportId: string) => {
    setDownloadingId(reportId);
    try {
      const response = await fetch(`${config.pdfPath}/${reportId}/pdf`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${config.module}-${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Unable to download PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  if (authLoading || permissionLoading) return <PageLoader message={`Loading ${config.title.toLowerCase()}...`} />;
  if (!hasPermission) return null;

  return (
    <AppPageShell width="wide">
      <AppPageHeader
        title={config.title}
        description={config.description}
        icon={<FileText className="h-6 w-6" />}
        actions={
          <Button asChild>
            <Link href={`${config.basePath}/new`}>
              <Plus className="mr-2 h-4 w-4" />
              New {config.singularTitle}
            </Link>
          </Button>
        }
      />

      {module === 'daily-site-diary' ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Diary Calendar
                </CardTitle>
                <CardDescription>Browse daily diary entries by month.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setMonth((current) => subMonths(current, 1))}>
                  Previous
                </Button>
                <div className="min-w-36 text-center font-medium">{format(month, 'MMMM yyyy')}</div>
                <Button type="button" variant="outline" onClick={() => setMonth((current) => addMonths(current, 1))}>
                  Next
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <MonthCalendar month={month} reportsByDate={reportsByDate} basePath={config.basePath} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Recent {config.title}</CardTitle>
          <CardDescription>{isElevated ? 'All submitted team records you can access.' : 'Your recent daily records.'}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : reports.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-muted-foreground">
              No {config.title.toLowerCase()} yet.
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-900/70 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`${config.basePath}/${report.id}`} className="font-semibold hover:text-primary">
                        {getReportTitle(config, report)}
                      </Link>
                      <StatusBadge status={report.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <EmployeeName profile={report.profile} fallback="Employee" />
                      {report.site ? ` · ${report.site}` : ''}
                      {report.job_no ? ` · Job ${report.job_no}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(report.status === 'draft' || report.status === 'rejected') && report.user_id === user?.id ? (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`${config.basePath}/new?id=${report.id}`}>Edit</Link>
                      </Button>
                    ) : null}
                    <Button asChild variant="outline" size="sm">
                      <Link href={`${config.basePath}/${report.id}`}>View</Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => void downloadPdf(report.id)} disabled={downloadingId === report.id}>
                      {downloadingId === report.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppPageShell>
  );
}

function MonthCalendar({
  month,
  reportsByDate,
  basePath,
}: {
  month: Date;
  reportsByDate: Map<string, ReportRow[]>;
  basePath: string;
}) {
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const leadingBlanks = (getDay(startOfMonth(month)) + 6) % 7;
  const today = new Date();

  return (
    <div className="grid grid-cols-7 gap-1 text-sm">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
        <div key={day} className="px-2 py-1 text-center text-xs font-semibold uppercase text-muted-foreground">
          {day}
        </div>
      ))}
      {Array.from({ length: leadingBlanks }).map((_, index) => (
        <div key={`blank-${index}`} className="min-h-20 rounded-md border border-transparent" />
      ))}
      {days.map((day) => {
        const iso = formatDateISO(day);
        const dayReports = reportsByDate.get(iso) || [];
        const primaryReport = dayReports[0];
        return (
          <Link
            key={iso}
            href={primaryReport ? `${basePath}/${primaryReport.id}` : `${basePath}/new?date=${iso}`}
            className={cn(
              'min-h-20 rounded-md border border-slate-700 bg-slate-900/70 p-2 transition-colors hover:border-primary hover:bg-slate-800',
              isSameDay(day, today) && 'border-primary'
            )}
          >
            <div className="font-medium">{format(day, 'd')}</div>
            {primaryReport ? (
              <div className="mt-2 space-y-1">
                <StatusBadge status={primaryReport.status} />
                <div className="line-clamp-2 text-xs text-muted-foreground">{primaryReport.site || primaryReport.job_no || 'Diary entry'}</div>
              </div>
            ) : (
              <div className="mt-2 text-xs text-muted-foreground">Create</div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export function DailyReportFormPage({ module }: { module: DailyReportModule }) {
  return (
    <Suspense fallback={<PageLoader message="Loading report form..." />}>
      <DailyReportFormContent module={module} />
    </Suspense>
  );
}

function DailyReportFormContent({ module }: { module: DailyReportModule }) {
  const config = getDailyReportConfig(module);
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingId = searchParams.get('id');
  const dateParam = searchParams.get('date');
  const { user, isManager, isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const { hasPermission, loading: permissionLoading } = usePermissionCheck(config.permission);
  const supabase = useBrowserSupabaseClient();
  const db = supabase as unknown as DailyReportDb;
  const isElevated = isManager || isAdmin || isSuperAdmin;
  const [form, setForm] = useState<ReportFormState>(() => {
    const initial = emptyFormState();
    if (dateParam) {
      initial.report_date = dateParam;
      initial.day_label = format(new Date(dateParam), 'EEEE');
    }
    return initial;
  });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [shiftResources, setShiftResources] = useState<ShiftReportResourceAllocation[]>(() => normalizeShiftResources());
  const [diaryResources, setDiaryResources] = useState<SiteDiaryResourceAllocation[]>(() => normalizeDiaryResources());
  const [plantRows, setPlantRows] = useState<PlantEquipmentRow[]>(() => normalizeRows(undefined, createEmptyPlantEquipment));
  const [visitorRows, setVisitorRows] = useState<VisitorRow[]>(() => normalizeRows(undefined, createEmptyVisitor));
  const [delayRows, setDelayRows] = useState<DelayInstructionRow[]>(() => normalizeRows(undefined, createEmptyDelayInstruction));
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingReport, setLoadingReport] = useState(Boolean(existingId));
  const [loadedStatus, setLoadedStatus] = useState<DailyReportStatus>('draft');

  useEffect(() => {
    if (!user?.id) return;
    setSelectedEmployeeId((current) => current || user.id);
  }, [user?.id]);

  useEffect(() => {
    if (!user || !isElevated || existingId) return;
    let cancelled = false;
    async function loadEmployees() {
      try {
        const directory = await fetchUserDirectory({ module: config.permission });
        if (cancelled) return;
        setEmployees(
          directory.map((employee) => ({
            id: employee.id,
            full_name: employee.full_name || 'Unknown User',
            employee_id: employee.employee_id,
            has_module_access: employee.has_module_access,
          }))
        );
      } catch (error) {
        console.error('Error loading employee options:', error);
      }
    }

    void loadEmployees();
    return () => {
      cancelled = true;
    };
  }, [config.permission, existingId, isElevated, user]);

  useEffect(() => {
    if (!existingId || !user || authLoading || permissionLoading) return;
    let cancelled = false;
    const reportId = existingId;

    async function loadExisting() {
      setLoadingReport(true);
      try {
        const report = await fetchReport(db, config, reportId);
        if (cancelled) return;
        setForm(reportToFormState(module, report));
        setSelectedEmployeeId(report.user_id);
        setLoadedStatus(report.status);
        setSignatureData(report.signature_data || null);
        setShiftResources(normalizeShiftResources((report as ShiftReport).resource_allocations));
        setDiaryResources(normalizeDiaryResources((report as DailySiteDiary).resource_allocations));
        setPlantRows(normalizeRows(report.plant_equipment, createEmptyPlantEquipment));
        setVisitorRows(normalizeRows(report.visitors, createEmptyVisitor));
        setDelayRows(normalizeRows(report.delay_instructions, createEmptyDelayInstruction));
      } catch (error) {
        console.error('Error loading report:', error);
        toast.error(`Unable to load ${config.singularTitle.toLowerCase()}`);
      } finally {
        if (!cancelled) setLoadingReport(false);
      }
    }

    void loadExisting();
    return () => {
      cancelled = true;
    };
  }, [authLoading, config, db, existingId, module, permissionLoading, user]);

  const updateForm = (key: keyof ReportFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === 'report_date' ? { day_label: value ? format(new Date(value), 'EEEE') : current.day_label } : {}),
    }));
  };

  const saveReport = async (status: DailyReportStatus, signature?: string | null) => {
    if (!selectedEmployeeId) {
      toast.error('Employee required');
      return;
    }
    if (!form.report_date) {
      toast.error('Date required');
      return;
    }
    if (status === 'submitted' && !signature) {
      setShowSignatureDialog(true);
      return;
    }
    if (status === 'submitted' && !form.activity_description.trim()) {
      toast.error('Activity description is required before submitting.');
      return;
    }

    setSaving(true);
    try {
      const shouldSubmit = status === 'submitted';
      const finalSignature = signature || signatureData;
      const headerPayload = makeHeaderPayload(module, selectedEmployeeId, form, shouldSubmit ? 'draft' : status, shouldSubmit ? null : finalSignature);
      let reportId = existingId;

      if (existingId) {
        const { error } = await db.from(config.tableName).update(headerPayload).eq('id', existingId);
        if (error) throw error;
      } else {
        const { data, error } = await db.from(config.tableName).insert(headerPayload).select('id').single();
        if (error) throw error;
        reportId = (data as { id: string }).id;
      }

      if (!reportId) throw new Error('Report ID was not returned.');
      await saveChildRows(db, config, reportId, {
        resources: isShiftReport(module) ? shiftResources : diaryResources,
        plantRows,
        visitorRows,
        delayRows,
      });

      if (shouldSubmit) {
        const submitPayload = {
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          signature_data: finalSignature,
          signed_at: finalSignature ? new Date().toISOString() : null,
        };
        const { error } = await db.from(config.tableName).update(submitPayload).eq('id', reportId);
        if (error) throw error;
      }

      toast.success(status === 'submitted' ? `${config.singularTitle} submitted` : `${config.singularTitle} saved`);
      router.push(config.basePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('duplicate key') || message.includes('23505')) {
        toast.error(`A ${config.singularTitle.toLowerCase()} already exists for this employee and date.`);
      } else {
        console.error('Error saving report:', error);
        toast.error(`Unable to save ${config.singularTitle.toLowerCase()}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || permissionLoading || loadingReport) return <PageLoader message={`Loading ${config.singularTitle.toLowerCase()}...`} />;
  if (!hasPermission) return null;

  const canEditExisting = !existingId || loadedStatus === 'draft' || loadedStatus === 'rejected' || isElevated;

  return (
    <AppPageShell width="wide">
      <AppPageHeader
        title={existingId ? `Edit ${config.singularTitle}` : `New ${config.singularTitle}`}
        description="Complete the daily report fields, save as draft, or submit with a signature."
        icon={<FileText className="h-6 w-6" />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
              <CardDescription>Daily site, job and vehicle information.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {isElevated && !existingId ? (
                <div className="space-y-2 md:col-span-2">
                  <Label>Employee</Label>
                  <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.full_name}{employee.employee_id ? ` (${employee.employee_id})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <Field label="Date" value={form.report_date} onChange={(value) => updateForm('report_date', value)} type="date" disabled={!canEditExisting} />
              <Field label="Day" value={form.day_label} onChange={(value) => updateForm('day_label', value)} disabled={!canEditExisting} />
              <Field label="Job No" value={form.job_no} onChange={(value) => updateForm('job_no', value)} disabled={!canEditExisting} />
              <Field label="Site" value={form.site} onChange={(value) => updateForm('site', value)} disabled={!canEditExisting} />
              <Field label="Van Registration" value={form.van_registration} onChange={(value) => updateForm('van_registration', value)} disabled={!canEditExisting} />
              <Field label="Mileage" value={form.mileage} onChange={(value) => updateForm('mileage', value)} type="number" disabled={!canEditExisting} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Times & Activity</CardTitle>
              <CardDescription>Record daily time and the activity description used on the PDF.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isShiftReport(module) ? (
                <div className="grid gap-4 md:grid-cols-4">
                  <Field label="Travel Start" value={form.travel_start_time} onChange={(value) => updateForm('travel_start_time', value)} type="time" disabled={!canEditExisting} />
                  <Field label="Travel Finish" value={form.travel_finish_time} onChange={(value) => updateForm('travel_finish_time', value)} type="time" disabled={!canEditExisting} />
                  <Field label="Site Start" value={form.site_start_time} onChange={(value) => updateForm('site_start_time', value)} type="time" disabled={!canEditExisting} />
                  <Field label="Site Finish" value={form.site_finish_time} onChange={(value) => updateForm('site_finish_time', value)} type="time" disabled={!canEditExisting} />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Start Time" value={form.start_time} onChange={(value) => updateForm('start_time', value)} type="time" disabled={!canEditExisting} />
                  <Field label="Finish Time" value={form.finish_time} onChange={(value) => updateForm('finish_time', value)} type="time" disabled={!canEditExisting} />
                  <Field label="Duration (hrs)" value={form.duration_hours} onChange={(value) => updateForm('duration_hours', value)} type="number" disabled={!canEditExisting} />
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Travel Duration (hrs)" value={form.travel_duration_hours} onChange={(value) => updateForm('travel_duration_hours', value)} type="number" disabled={!canEditExisting} />
                <Field label="On Site Time (hrs)" value={form.onsite_duration_hours} onChange={(value) => updateForm('onsite_duration_hours', value)} type="number" disabled={!canEditExisting} />
                <Field label="Total Time (hrs)" value={form.total_time_hours} onChange={(value) => updateForm('total_time_hours', value)} type="number" disabled={!canEditExisting} />
              </div>
              {!isShiftReport(module) ? (
                <Field label="Fatigue Hours" value={form.fatigue_hours} onChange={(value) => updateForm('fatigue_hours', value)} type="number" disabled={!canEditExisting} />
              ) : null}
              <div className="space-y-2">
                <Label>{isShiftReport(module) ? 'Activity & Description of Works' : 'Activity & Description'}</Label>
                <Textarea value={form.activity_description} onChange={(event) => updateForm('activity_description', event.target.value)} disabled={!canEditExisting} rows={5} />
              </div>
              <div className="space-y-2">
                <Label>Comments</Label>
                <Textarea value={form.comments} onChange={(event) => updateForm('comments', event.target.value)} disabled={!canEditExisting} rows={3} />
              </div>
            </CardContent>
          </Card>

          {isShiftReport(module) ? (
            <ShiftResourceEditor rows={shiftResources} setRows={setShiftResources} disabled={!canEditExisting} />
          ) : (
            <SiteDiaryResourceEditor rows={diaryResources} setRows={setDiaryResources} disabled={!canEditExisting} />
          )}

          <SimpleRowsEditor
            title="Plant & Equipment On Site"
            description="Structured rows for the plant/equipment section of the PDF."
            rows={plantRows}
            setRows={setPlantRows}
            disabled={!canEditExisting}
            addLabel="Add equipment"
            createRow={createEmptyPlantEquipment}
          />
          <VisitorsEditor rows={visitorRows} setRows={setVisitorRows} disabled={!canEditExisting} />
          <SimpleRowsEditor
            title={isShiftReport(module) ? 'Delays / Instructions / Non-Contract Works' : 'Delays / Instructions'}
            description="Capture item descriptions and comments for the report."
            rows={delayRows}
            setRows={setDelayRows}
            disabled={!canEditExisting}
            addLabel="Add item"
            createRow={createEmptyDelayInstruction}
          />

          {!isShiftReport(module) ? (
            <Card>
              <CardHeader>
                <CardTitle>Instructed On Site By</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field label="Role / Person" value={form.instructed_on_site_by} onChange={(value) => updateForm('instructed_on_site_by', value)} disabled={!canEditExisting} />
                <Field label="Name" value={form.instructed_on_site_name} onChange={(value) => updateForm('instructed_on_site_name', value)} disabled={!canEditExisting} />
              </CardContent>
            </Card>
          ) : null}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Submit</CardTitle>
            <CardDescription>Save drafts while working. Submit once the report is signed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {signatureData ? (
              <div className="rounded-md border border-slate-700 bg-slate-900 p-3 text-sm text-muted-foreground">
                Signature captured.
              </div>
            ) : null}
            <Button className="w-full" variant="outline" onClick={() => void saveReport('draft')} disabled={saving || !canEditExisting}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Draft
            </Button>
            <Button className="w-full" onClick={() => setShowSignatureDialog(true)} disabled={saving || !canEditExisting}>
              <Send className="mr-2 h-4 w-4" />
              Sign & Submit
            </Button>
            <Button className="w-full" variant="ghost" asChild>
              <Link href={config.basePath}>Cancel</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sign {config.singularTitle}</DialogTitle>
            <DialogDescription>Your signature will be included on the generated PDF.</DialogDescription>
          </DialogHeader>
          <SignaturePad
            initialValue={signatureData}
            onCancel={() => setShowSignatureDialog(false)}
            onSave={(signature) => {
              setSignatureData(signature);
              setShowSignatureDialog(false);
              void saveReport('submitted', signature);
            }}
            disabled={saving}
          />
        </DialogContent>
      </Dialog>
    </AppPageShell>
  );
}

async function saveChildRows(
  db: DailyReportDb,
  config: DailyReportModuleConfig,
  reportId: string,
  rows: {
    resources: Array<ShiftReportResourceAllocation | SiteDiaryResourceAllocation>;
    plantRows: PlantEquipmentRow[];
    visitorRows: VisitorRow[];
    delayRows: DelayInstructionRow[];
  }
) {
  const parentColumn = config.parentIdColumn;
  const deleteResults = await Promise.all([
    db.from(config.resourceTable).delete().eq(parentColumn, reportId),
    db.from(config.plantTable).delete().eq(parentColumn, reportId),
    db.from(config.visitorsTable).delete().eq(parentColumn, reportId),
    db.from(config.delaysTable).delete().eq(parentColumn, reportId),
  ]);
  const failedDelete = deleteResults.find((result): result is QueryResult<unknown> => Boolean(result?.error));
  if (failedDelete?.error) throw failedDelete.error;

  const resources = rows.resources
    .filter((row) => hasRowContent(row as unknown as Record<string, unknown>))
    .map(({ id: _id, ...row }, index) => ({ ...row, display_order: index, [parentColumn]: reportId }));
  const plant = rows.plantRows
    .filter((row) => hasRowContent(row as unknown as Record<string, unknown>))
    .map(({ id: _id, ...row }, index) => ({ ...row, display_order: index, [parentColumn]: reportId }));
  const visitors = rows.visitorRows
    .filter((row) => hasRowContent(row as unknown as Record<string, unknown>))
    .map(({ id: _id, ...row }, index) => ({ ...row, display_order: index, [parentColumn]: reportId }));
  const delays = rows.delayRows
    .filter((row) => hasRowContent(row as unknown as Record<string, unknown>))
    .map(({ id: _id, ...row }, index) => ({ ...row, display_order: index, [parentColumn]: reportId }));

  const operations = [
    resources.length ? db.from(config.resourceTable).insert(resources) : null,
    plant.length ? db.from(config.plantTable).insert(plant) : null,
    visitors.length ? db.from(config.visitorsTable).insert(visitors) : null,
    delays.length ? db.from(config.delaysTable).insert(delays) : null,
  ].filter((operation): operation is QueryBuilder => operation !== null);

  const results = await Promise.all(operations);
  const failed = results.find((result): result is QueryResult<unknown> => Boolean(result?.error));
  if (failed?.error) throw failed.error;
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} type={type} step={type === 'number' ? '0.25' : undefined} onChange={(event) => onChange(event.target.value)} disabled={disabled} />
    </div>
  );
}

function ShiftResourceEditor({
  rows,
  setRows,
  disabled,
}: {
  rows: ShiftReportResourceAllocation[];
  setRows: (rows: ShiftReportResourceAllocation[]) => void;
  disabled: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Allocation (Hrs)</CardTitle>
        <CardDescription>Labour and subcontractor hours for the shift report.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row, index) => (
          <div key={index} className="grid gap-3 rounded-lg border border-slate-700 p-3 md:grid-cols-4">
            <ResourceField label="Name" value={row.name} onChange={(value) => updateArrayRow(rows, setRows, index, 'name', value)} disabled={disabled} />
            <ResourceField label="Company" value={row.company} onChange={(value) => updateArrayRow(rows, setRows, index, 'company', value)} disabled={disabled} />
            <ResourceField label="Grade" value={row.grade} onChange={(value) => updateArrayRow(rows, setRows, index, 'grade', value)} disabled={disabled} />
            <ResourceNumber label="Travel" value={row.travel_hours} onChange={(value) => updateArrayRow(rows, setRows, index, 'travel_hours', value)} disabled={disabled} />
            <ResourceNumber label="Basic" value={row.basic_hours} onChange={(value) => updateArrayRow(rows, setRows, index, 'basic_hours', value)} disabled={disabled} />
            <ResourceNumber label="1/3" value={row.one_third_hours} onChange={(value) => updateArrayRow(rows, setRows, index, 'one_third_hours', value)} disabled={disabled} />
            <ResourceNumber label="1/2" value={row.half_hours} onChange={(value) => updateArrayRow(rows, setRows, index, 'half_hours', value)} disabled={disabled} />
            <ResourceNumber label="Double" value={row.double_hours} onChange={(value) => updateArrayRow(rows, setRows, index, 'double_hours', value)} disabled={disabled} />
            <ResourceNumber label="Expenses" value={row.expenses} onChange={(value) => updateArrayRow(rows, setRows, index, 'expenses', value)} disabled={disabled} />
            <ResourceNumber label="Bonus" value={row.bonus} onChange={(value) => updateArrayRow(rows, setRows, index, 'bonus', value)} disabled={disabled} />
            <label className="flex items-center gap-2 pt-7 text-sm">
              <input type="checkbox" checked={row.lodge_allowance} onChange={(event) => updateArrayRow(rows, setRows, index, 'lodge_allowance', event.target.checked)} disabled={disabled} />
              Lodge Allowance
            </label>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setRows([...rows, createEmptyShiftResource(rows.length)])} disabled={disabled}>
          Add resource
        </Button>
      </CardContent>
    </Card>
  );
}

function SiteDiaryResourceEditor({
  rows,
  setRows,
  disabled,
}: {
  rows: SiteDiaryResourceAllocation[];
  setRows: (rows: SiteDiaryResourceAllocation[]) => void;
  disabled: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Allocation (Hrs)</CardTitle>
        <CardDescription>Daily labour, travel, overtime, leave and allowances.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row, index) => (
          <div key={index} className="grid gap-3 rounded-lg border border-slate-700 p-3 md:grid-cols-4">
            <ResourceField label="Name" value={row.name} onChange={(value) => updateArrayRow(rows, setRows, index, 'name', value)} disabled={disabled} />
            <ResourceField label="Grade" value={row.grade} onChange={(value) => updateArrayRow(rows, setRows, index, 'grade', value)} disabled={disabled} />
            <ResourceNumber label="Travel" value={row.travel_hours} onChange={(value) => updateArrayRow(rows, setRows, index, 'travel_hours', value)} disabled={disabled} />
            <ResourceNumber label="Basic" value={row.basic_hours} onChange={(value) => updateArrayRow(rows, setRows, index, 'basic_hours', value)} disabled={disabled} />
            <ResourceNumber label="1/3" value={row.one_third_hours} onChange={(value) => updateArrayRow(rows, setRows, index, 'one_third_hours', value)} disabled={disabled} />
            <ResourceNumber label="1/2" value={row.half_hours} onChange={(value) => updateArrayRow(rows, setRows, index, 'half_hours', value)} disabled={disabled} />
            <ResourceNumber label="Double" value={row.double_hours} onChange={(value) => updateArrayRow(rows, setRows, index, 'double_hours', value)} disabled={disabled} />
            <ResourceNumber label="Annual Leave" value={row.annual_leave_hours} onChange={(value) => updateArrayRow(rows, setRows, index, 'annual_leave_hours', value)} disabled={disabled} />
            <ResourceNumber label="Expenses" value={row.expenses} onChange={(value) => updateArrayRow(rows, setRows, index, 'expenses', value)} disabled={disabled} />
            <ResourceNumber label="Bonus" value={row.bonus} onChange={(value) => updateArrayRow(rows, setRows, index, 'bonus', value)} disabled={disabled} />
            <label className="flex items-center gap-2 pt-7 text-sm">
              <input type="checkbox" checked={row.lodge_allowance} onChange={(event) => updateArrayRow(rows, setRows, index, 'lodge_allowance', event.target.checked)} disabled={disabled} />
              Lodge Allowance
            </label>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setRows([...rows, createEmptySiteDiaryResource(rows.length)])} disabled={disabled}>
          Add resource
        </Button>
      </CardContent>
    </Card>
  );
}

function ResourceField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean }) {
  return <Field label={label} value={value} onChange={onChange} disabled={disabled} />;
}

function ResourceNumber({ label, value, onChange, disabled }: { label: string; value: number; onChange: (value: number) => void; disabled: boolean }) {
  return <Field label={label} value={String(value)} onChange={(next) => onChange(numericValue(next))} type="number" disabled={disabled} />;
}

function SimpleRowsEditor<T extends PlantEquipmentRow | DelayInstructionRow>({
  title,
  description,
  rows,
  setRows,
  disabled,
  addLabel,
  createRow,
}: {
  title: string;
  description: string;
  rows: T[];
  setRows: (rows: T[]) => void;
  disabled: boolean;
  addLabel: string;
  createRow: (displayOrder: number) => T;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="grid gap-3 rounded-lg border border-slate-700 p-3 md:grid-cols-2">
            <Field label="Item Description" value={row.item_description} onChange={(value) => updateArrayRow(rows, setRows, index, 'item_description', value)} disabled={disabled} />
            <Field label="Comment" value={row.comments} onChange={(value) => updateArrayRow(rows, setRows, index, 'comments', value)} disabled={disabled} />
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setRows([...rows, createRow(rows.length)])} disabled={disabled}>
          {addLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

function VisitorsEditor({
  rows,
  setRows,
  disabled,
}: {
  rows: VisitorRow[];
  setRows: (rows: VisitorRow[]) => void;
  disabled: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visitors On Site</CardTitle>
        <CardDescription>Name, position, company and time on/off site.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="grid gap-3 rounded-lg border border-slate-700 p-3 md:grid-cols-5">
            <Field label="Name" value={row.name} onChange={(value) => updateArrayRow(rows, setRows, index, 'name', value)} disabled={disabled} />
            <Field label="Position" value={row.position} onChange={(value) => updateArrayRow(rows, setRows, index, 'position', value)} disabled={disabled} />
            <Field label="Company" value={row.company} onChange={(value) => updateArrayRow(rows, setRows, index, 'company', value)} disabled={disabled} />
            <Field label="On Site" value={row.on_site_time} onChange={(value) => updateArrayRow(rows, setRows, index, 'on_site_time', value)} type="time" disabled={disabled} />
            <Field label="Off Site" value={row.off_site_time} onChange={(value) => updateArrayRow(rows, setRows, index, 'off_site_time', value)} type="time" disabled={disabled} />
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setRows([...rows, createEmptyVisitor(rows.length)])} disabled={disabled}>
          Add visitor
        </Button>
      </CardContent>
    </Card>
  );
}

function updateArrayRow<T, K extends keyof T>(rows: T[], setRows: (rows: T[]) => void, index: number, key: K, value: T[K]) {
  setRows(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
}

export function DailyReportDetailPage({ module, id }: { module: DailyReportModule; id: string }) {
  const config = getDailyReportConfig(module);
  const router = useRouter();
  const { user, isManager, isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const { hasPermission, loading: permissionLoading } = usePermissionCheck(config.permission);
  const supabase = useBrowserSupabaseClient();
  const db = supabase as unknown as DailyReportDb;
  const isElevated = isManager || isAdmin || isSuperAdmin;
  const [report, setReport] = useState<ReportRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [managerComments, setManagerComments] = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!id || authLoading || permissionLoading || !hasPermission) return;
    let cancelled = false;
    async function loadReport() {
      setLoading(true);
      try {
        const loaded = await fetchReport(db, config, id);
        if (!cancelled) {
          setReport(loaded);
          setManagerComments(loaded.manager_comments || '');
        }
      } catch (error) {
        console.error('Error loading report:', error);
        if (!cancelled) toast.error(`Unable to load ${config.singularTitle.toLowerCase()}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadReport();
    return () => {
      cancelled = true;
    };
  }, [authLoading, config, db, hasPermission, id, permissionLoading]);

  const reviewReport = async (status: 'approved' | 'rejected') => {
    if (!user?.id) return;
    setActing(true);
    try {
      const { error } = await db
        .from(config.tableName)
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          manager_comments: managerComments.trim() || null,
        })
        .eq('id', id);
      if (error) throw error;
      toast.success(`${config.singularTitle} ${status}`);
      router.refresh();
      const loaded = await fetchReport(db, config, id);
      setReport(loaded);
    } catch (error) {
      console.error('Error reviewing report:', error);
      toast.error(`Unable to ${status === 'approved' ? 'approve' : 'reject'} report`);
    } finally {
      setActing(false);
    }
  };

  const downloadPdf = async () => {
    try {
      const response = await fetch(`${config.pdfPath}/${id}/pdf`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${config.module}-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Unable to download PDF');
    }
  };

  if (authLoading || permissionLoading || loading) return <PageLoader message={`Loading ${config.singularTitle.toLowerCase()}...`} />;
  if (!hasPermission || !report) return null;

  const canEdit = report.user_id === user?.id && (report.status === 'draft' || report.status === 'rejected');
  const shift = report as ShiftReport;
  const diary = report as DailySiteDiary;

  return (
    <AppPageShell width="wide">
      <AppPageHeader
        title={getReportTitle(config, report)}
        description={`${report.site || 'No site recorded'}${report.job_no ? ` · Job ${report.job_no}` : ''}`}
        icon={<FileText className="h-6 w-6" />}
        actions={
          <div className="flex flex-wrap gap-2">
            {canEdit ? (
              <Button asChild variant="outline">
                <Link href={`${config.basePath}/new?id=${report.id}`}>Edit</Link>
              </Button>
            ) : null}
            <Button onClick={() => void downloadPdf()}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>Report Summary</CardTitle>
                <StatusBadge status={report.status} />
              </div>
              <CardDescription>
                Completed by <EmployeeName profile={report.profile} fallback="Employee" /> on {formatDate(report.report_date)}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Summary label="Job No" value={report.job_no} />
              <Summary label="Site" value={report.site} />
              <Summary label="Van Registration" value={report.van_registration} />
              <Summary label="Mileage" value={report.mileage} />
              <Summary label="Total Time" value={`${report.total_time_hours || 0} hrs`} />
              <Summary label="Submitted" value={report.submitted_at ? formatDate(report.submitted_at) : '-'} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="whitespace-pre-wrap rounded-md border border-slate-700 bg-slate-900 p-4 text-sm">
                {report.activity_description || 'No activity description recorded.'}
              </div>
              {report.comments ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Comments</h3>
                  <div className="whitespace-pre-wrap rounded-md border border-slate-700 bg-slate-900 p-4 text-sm">{report.comments}</div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <ReadOnlyRows title="Resource Allocation" rows={report.resource_allocations || []} />
          <ReadOnlyRows title="Plant & Equipment" rows={report.plant_equipment || []} />
          <ReadOnlyRows title="Visitors" rows={report.visitors || []} />
          <ReadOnlyRows title="Delays / Instructions" rows={report.delay_instructions || []} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Time Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {isShiftReport(module) ? (
                <>
                  <Summary label="Travel Start" value={shift.travel_start_time} />
                  <Summary label="Travel Finish" value={shift.travel_finish_time} />
                  <Summary label="Site Start" value={shift.site_start_time} />
                  <Summary label="Site Finish" value={shift.site_finish_time} />
                  <Summary label="Travel Duration" value={`${shift.travel_duration_hours || 0} hrs`} />
                  <Summary label="On Site Time" value={`${shift.onsite_duration_hours || 0} hrs`} />
                </>
              ) : (
                <>
                  <Summary label="Start Time" value={diary.start_time} />
                  <Summary label="Finish Time" value={diary.finish_time} />
                  <Summary label="Duration" value={`${diary.duration_hours || 0} hrs`} />
                  <Summary label="Travel" value={`${diary.travel_hours || 0} hrs`} />
                  <Summary label="On Site" value={`${diary.onsite_hours || 0} hrs`} />
                  <Summary label="Fatigue" value={`${diary.fatigue_hours || 0} hrs`} />
                </>
              )}
            </CardContent>
          </Card>

          {isElevated && report.status === 'submitted' ? (
            <Card>
              <CardHeader>
                <CardTitle>Manager Review</CardTitle>
                <CardDescription>Approve or reject this submitted report.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea value={managerComments} onChange={(event) => setManagerComments(event.target.value)} placeholder="Manager comments" />
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" disabled={acting} onClick={() => void reviewReport('rejected')}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button disabled={acting} onClick={() => void reviewReport('approved')}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {report.signature_data ? (
            <Card>
              <CardHeader>
                <CardTitle>Signature</CardTitle>
              </CardHeader>
              <CardContent>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={report.signature_data} alt="Completed signature" className="max-h-28 rounded-md bg-white p-2" />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </AppPageShell>
  );
}

function Summary({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground">{value || '-'}</div>
    </div>
  );
}

function ReadOnlyRows({ title, rows }: { title: string; rows: unknown[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rows recorded.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((row, index) => {
              const rowRecord = row as Record<string, unknown>;
              return (
              <div key={String(rowRecord.id || index)} className="rounded-md border border-slate-700 bg-slate-900 p-3 text-sm">
                <div className="grid gap-2 md:grid-cols-3">
                  {Object.entries(rowRecord)
                    .filter(([key]) => !['id', 'report_id', 'diary_id', 'created_at', 'updated_at', 'display_order'].includes(key))
                    .map(([key, value]) => (
                      <Summary key={key} label={key.replaceAll('_', ' ')} value={typeof value === 'boolean' ? (value ? 'Yes' : 'No') : textValue(value) || String(value ?? '')} />
                    ))}
                </div>
              </div>
            );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
