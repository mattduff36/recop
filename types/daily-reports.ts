export type DailyReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export type DailyReportModule = 'shift-reports' | 'daily-site-diary';

export interface ProfileSummary {
  id: string;
  full_name: string | null;
  employee_id?: string | null;
  team_id?: string | null;
}

export interface ShiftReportResourceAllocation {
  id?: string;
  display_order: number;
  name: string;
  company: string;
  grade: string;
  travel_hours: number;
  basic_hours: number;
  one_third_hours: number;
  half_hours: number;
  double_hours: number;
  lodge_allowance: boolean;
  expenses: number;
  bonus: number;
}

export interface ShiftReportActivityRow {
  id?: string;
  display_order: number;
  activity_description: string;
  duration_hours: number | null;
}

export interface SiteDiaryResourceAllocation {
  id?: string;
  display_order: number;
  name: string;
  grade: string;
  travel_hours: number;
  basic_hours: number;
  one_third_hours: number;
  half_hours: number;
  double_hours: number;
  annual_leave_hours: number;
  lodge_allowance: boolean;
  expenses: number;
  bonus: number;
}

export interface PlantEquipmentRow {
  id?: string;
  display_order: number;
  item_description: string;
  comments: string;
}

export interface VisitorRow {
  id?: string;
  display_order: number;
  name: string;
  position: string;
  company: string;
  on_site_time: string;
  off_site_time: string;
}

export interface DelayInstructionRow {
  id?: string;
  display_order: number;
  item_description: string;
  comments: string;
}

export interface ShiftReport {
  id: string;
  user_id: string;
  report_date: string;
  day_label: string | null;
  job_no: string | null;
  site: string | null;
  van_registration: string | null;
  mileage: number | null;
  travel_start_time: string | null;
  travel_finish_time: string | null;
  site_start_time: string | null;
  site_finish_time: string | null;
  travel_duration_hours: number;
  onsite_duration_hours: number;
  total_time_hours: number;
  activity_description: string | null;
  comments: string | null;
  status: DailyReportStatus;
  signature_data: string | null;
  signed_at: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  manager_comments: string | null;
  created_at: string;
  updated_at: string;
  profile?: ProfileSummary | null;
  activity_rows?: ShiftReportActivityRow[];
  resource_allocations?: ShiftReportResourceAllocation[];
  plant_equipment?: PlantEquipmentRow[];
  visitors?: VisitorRow[];
  delay_instructions?: DelayInstructionRow[];
}

export interface DailySiteDiary {
  id: string;
  user_id: string;
  report_date: string;
  day_label: string | null;
  job_no: string | null;
  site: string | null;
  van_registration: string | null;
  mileage: number | null;
  start_time: string | null;
  finish_time: string | null;
  duration_hours: number;
  travel_hours: number;
  onsite_hours: number;
  total_time_hours: number;
  fatigue_hours: number;
  activity_description: string | null;
  comments: string | null;
  instructed_on_site_by: string | null;
  instructed_on_site_name: string | null;
  instructed_on_site_signature_data: string | null;
  status: DailyReportStatus;
  signature_data: string | null;
  signed_at: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  manager_comments: string | null;
  created_at: string;
  updated_at: string;
  profile?: ProfileSummary | null;
  resource_allocations?: SiteDiaryResourceAllocation[];
  plant_equipment?: PlantEquipmentRow[];
  visitors?: VisitorRow[];
  delay_instructions?: DelayInstructionRow[];
}

export interface DailyReportModuleConfig {
  module: DailyReportModule;
  permission: DailyReportModule;
  title: string;
  singularTitle: string;
  description: string;
  basePath: string;
  tableName: 'shift_reports' | 'daily_site_diaries';
  parentIdColumn: 'report_id' | 'diary_id';
  activityTable?: 'shift_report_activity_rows';
  resourceTable: 'shift_report_resource_allocations' | 'daily_site_diary_resource_allocations';
  plantTable: 'shift_report_plant_equipment' | 'daily_site_diary_plant_equipment';
  visitorsTable: 'shift_report_visitors' | 'daily_site_diary_visitors';
  delaysTable: 'shift_report_delay_instructions' | 'daily_site_diary_delay_instructions';
  pdfPath: string;
}

export const SHIFT_REPORT_CONFIG: DailyReportModuleConfig = {
  module: 'shift-reports',
  permission: 'shift-reports',
  title: 'Shift Reports',
  singularTitle: 'Shift Report',
  description: 'Daily shift report for site labour, plant, visitors and instructions.',
  basePath: '/shift-reports',
  tableName: 'shift_reports',
  parentIdColumn: 'report_id',
  activityTable: 'shift_report_activity_rows',
  resourceTable: 'shift_report_resource_allocations',
  plantTable: 'shift_report_plant_equipment',
  visitorsTable: 'shift_report_visitors',
  delaysTable: 'shift_report_delay_instructions',
  pdfPath: '/api/shift-reports',
};

export const SITE_DIARY_CONFIG: DailyReportModuleConfig = {
  module: 'daily-site-diary',
  permission: 'daily-site-diary',
  title: 'Daily Site Diary',
  singularTitle: 'Daily Site Diary',
  description: 'Daily site record for activities, instructions, visitors and resources.',
  basePath: '/daily-site-diary',
  tableName: 'daily_site_diaries',
  parentIdColumn: 'diary_id',
  resourceTable: 'daily_site_diary_resource_allocations',
  plantTable: 'daily_site_diary_plant_equipment',
  visitorsTable: 'daily_site_diary_visitors',
  delaysTable: 'daily_site_diary_delay_instructions',
  pdfPath: '/api/daily-site-diary',
};

export function getDailyReportConfig(module: DailyReportModule): DailyReportModuleConfig {
  return module === 'shift-reports' ? SHIFT_REPORT_CONFIG : SITE_DIARY_CONFIG;
}

export function createEmptyShiftResource(displayOrder: number): ShiftReportResourceAllocation {
  return {
    display_order: displayOrder,
    name: '',
    company: '',
    grade: '',
    travel_hours: 0,
    basic_hours: 0,
    one_third_hours: 0,
    half_hours: 0,
    double_hours: 0,
    lodge_allowance: false,
    expenses: 0,
    bonus: 0,
  };
}

export function createEmptyShiftActivity(displayOrder: number): ShiftReportActivityRow {
  return {
    display_order: displayOrder,
    activity_description: '',
    duration_hours: null,
  };
}

export function createEmptySiteDiaryResource(displayOrder: number): SiteDiaryResourceAllocation {
  return {
    display_order: displayOrder,
    name: '',
    grade: '',
    travel_hours: 0,
    basic_hours: 0,
    one_third_hours: 0,
    half_hours: 0,
    double_hours: 0,
    annual_leave_hours: 0,
    lodge_allowance: false,
    expenses: 0,
    bonus: 0,
  };
}

export function createEmptyPlantEquipment(displayOrder: number): PlantEquipmentRow {
  return {
    display_order: displayOrder,
    item_description: '',
    comments: '',
  };
}

export function createEmptyVisitor(displayOrder: number): VisitorRow {
  return {
    display_order: displayOrder,
    name: '',
    position: '',
    company: '',
    on_site_time: '',
    off_site_time: '',
  };
}

export function createEmptyDelayInstruction(displayOrder: number): DelayInstructionRow {
  return {
    display_order: displayOrder,
    item_description: '',
    comments: '',
  };
}
