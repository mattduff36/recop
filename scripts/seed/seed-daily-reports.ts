import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetUserEmail = process.env.SAMPLE_DAILY_REPORT_USER_EMAIL;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type DailyReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

interface Profile {
  id: string;
  full_name: string | null;
  employee_id: string | null;
  role: string | null;
}

interface ShiftResourceRow {
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

interface SiteDiaryResourceRow {
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

interface PlantEquipmentRow {
  display_order: number;
  item_description: string;
  comments: string;
}

interface VisitorRow {
  display_order: number;
  name: string;
  position: string;
  company: string;
  on_site_time: string;
  off_site_time: string;
}

interface DelayInstructionRow {
  display_order: number;
  item_description: string;
  comments: string;
}

interface ShiftReportSample {
  job_no: string;
  site: string;
  van_registration: string;
  mileage: number;
  travel_start_time: string;
  travel_finish_time: string;
  site_start_time: string;
  site_finish_time: string;
  travel_duration_hours: number;
  onsite_duration_hours: number;
  total_time_hours: number;
  activity_description: string;
  comments: string;
  status: DailyReportStatus;
  resources: ShiftResourceRow[];
  plant: PlantEquipmentRow[];
  visitors: VisitorRow[];
  delays: DelayInstructionRow[];
}

interface DailySiteDiarySample {
  job_no: string;
  site: string;
  van_registration: string;
  mileage: number;
  start_time: string;
  finish_time: string;
  duration_hours: number;
  travel_hours: number;
  onsite_hours: number;
  total_time_hours: number;
  fatigue_hours: number;
  activity_description: string;
  comments: string;
  instructed_on_site_by: string;
  instructed_on_site_name: string;
  status: DailyReportStatus;
  resources: SiteDiaryResourceRow[];
  plant: PlantEquipmentRow[];
  visitors: VisitorRow[];
  delays: DelayInstructionRow[];
}

const shiftReportSamples: ShiftReportSample[] = [
  {
    job_no: 'SR-SAMPLE-001',
    site: 'Kings Cross Platform 3',
    van_registration: 'YX25 MNO',
    mileage: 42118,
    travel_start_time: '06:00:00',
    travel_finish_time: '07:15:00',
    site_start_time: '07:30:00',
    site_finish_time: '16:30:00',
    travel_duration_hours: 1.25,
    onsite_duration_hours: 9,
    total_time_hours: 10.25,
    activity_description: 'Installed containment and completed cable pulls for platform lighting upgrade. Tested temporary supplies before handback.',
    comments: 'All work completed within possession. Awaiting client confirmation for final luminaire positions.',
    status: 'approved',
    resources: [
      makeShiftResource(0, 'Tom Bradley', 'RES', 'Electrician', 1.25, 8, 1, 0, 0, false, 0, 35),
      makeShiftResource(1, 'Lewis Grant', 'RES', 'Mate', 1.25, 8, 1, 0, 0, false, 12.5, 20),
    ],
    plant: [
      { display_order: 0, item_description: 'Mobile tower scaffold', comments: 'Inspected before use and tagged.' },
      { display_order: 1, item_description: 'Cable drum trailer', comments: 'Returned to depot at end of shift.' },
    ],
    visitors: [{ display_order: 0, name: 'Helen Morris', position: 'Site Manager', company: 'Network Rail', on_site_time: '09:00:00', off_site_time: '10:30:00' }],
    delays: [{ display_order: 0, item_description: 'Access delay', comments: 'Fifteen minute delay while adjacent gang cleared the work area.' }],
  },
  {
    job_no: 'SR-SAMPLE-002',
    site: 'Reading Depot Siding 4',
    van_registration: 'YX24 JKL',
    mileage: 38672,
    travel_start_time: '05:45:00',
    travel_finish_time: '07:00:00',
    site_start_time: '07:15:00',
    site_finish_time: '15:45:00',
    travel_duration_hours: 1.25,
    onsite_duration_hours: 8.5,
    total_time_hours: 9.75,
    activity_description: 'Carried out fault finding on points heater circuit and replaced damaged junction box glands.',
    comments: 'Circuit tested satisfactory. Photos uploaded to job pack.',
    status: 'submitted',
    resources: [
      makeShiftResource(0, 'Amelia Carter', 'RES', 'Supervisor', 1.25, 8, 0.5, 0, 0, false, 0, 40),
      makeShiftResource(1, 'Ryan Ellis', 'RES', 'Electrician', 1.25, 8, 0.5, 0, 0, false, 8, 30),
    ],
    plant: [{ display_order: 0, item_description: 'Megger tester', comments: 'Calibration in date.' }],
    visitors: [{ display_order: 0, name: 'Mark Davies', position: 'Maintenance Engineer', company: 'GWR', on_site_time: '11:15:00', off_site_time: '11:45:00' }],
    delays: [{ display_order: 0, item_description: 'Instruction', comments: 'Client requested additional photos of junction box before cover was refitted.' }],
  },
  {
    job_no: 'SR-SAMPLE-003',
    site: 'Wembley Central Footbridge',
    van_registration: 'YX23 GHI',
    mileage: 51204,
    travel_start_time: '06:15:00',
    travel_finish_time: '07:05:00',
    site_start_time: '07:20:00',
    site_finish_time: '16:00:00',
    travel_duration_hours: 0.83,
    onsite_duration_hours: 8.67,
    total_time_hours: 9.5,
    activity_description: 'Completed bracket installation and first fix containment on footbridge lighting route.',
    comments: 'Two fixings changed to chemical anchors due to substrate condition.',
    status: 'draft',
    resources: [
      makeShiftResource(0, 'Daniel Price', 'RES', 'Electrician', 0.83, 8, 0.67, 0, 0, false, 0, 25),
      makeShiftResource(1, 'Owen Hughes', 'RES', 'Mate', 0.83, 8, 0.67, 0, 0, false, 0, 15),
    ],
    plant: [{ display_order: 0, item_description: 'SDS drill and dust extraction', comments: 'Used for bracket installation.' }],
    visitors: [],
    delays: [{ display_order: 0, item_description: 'Non-contract work', comments: 'Additional anchor changes requested by site supervisor.' }],
  },
  {
    job_no: 'SR-SAMPLE-004',
    site: 'Acton Yard Welfare Compound',
    van_registration: 'YX22 DEF',
    mileage: 60418,
    travel_start_time: '06:30:00',
    travel_finish_time: '07:10:00',
    site_start_time: '07:30:00',
    site_finish_time: '17:00:00',
    travel_duration_hours: 0.67,
    onsite_duration_hours: 9.5,
    total_time_hours: 10.17,
    activity_description: 'Installed temporary distribution board for welfare compound and labelled circuits.',
    comments: 'Generator changeover tested with client representative present.',
    status: 'approved',
    resources: [
      makeShiftResource(0, 'Priya Shah', 'RES', 'Approved Electrician', 0.67, 8, 1.5, 0, 0, false, 0, 45),
      makeShiftResource(1, 'Jack Turner', 'RES', 'Electrician', 0.67, 8, 1.5, 0, 0, false, 16, 35),
    ],
    plant: [
      { display_order: 0, item_description: 'Temporary DB', comments: 'Installed and labelled.' },
      { display_order: 1, item_description: '110v transformer', comments: 'Left on site for follow-on works.' },
    ],
    visitors: [{ display_order: 0, name: 'Sophie Green', position: 'HSE Advisor', company: 'Principal Contractor', on_site_time: '13:00:00', off_site_time: '14:10:00' }],
    delays: [{ display_order: 0, item_description: 'Instruction', comments: 'Additional socket circuit requested for drying room.' }],
  },
  {
    job_no: 'SR-SAMPLE-005',
    site: 'Oxford Parkway Car Park',
    van_registration: 'YX21 ABC',
    mileage: 44890,
    travel_start_time: '05:30:00',
    travel_finish_time: '07:00:00',
    site_start_time: '07:15:00',
    site_finish_time: '16:15:00',
    travel_duration_hours: 1.5,
    onsite_duration_hours: 9,
    total_time_hours: 10.5,
    activity_description: 'Replaced damaged feeder cable section and reinstated duct route across car park island.',
    comments: 'Temporary barriers left in place until tarmac reinstatement is complete.',
    status: 'submitted',
    resources: [
      makeShiftResource(0, 'Grace Wilson', 'RES', 'Supervisor', 1.5, 8, 1, 0, 0, false, 18, 40),
      makeShiftResource(1, 'Nathan Cole', 'RES', 'Electrician', 1.5, 8, 1, 0, 0, false, 0, 30),
    ],
    plant: [{ display_order: 0, item_description: 'Mini excavator', comments: 'Operated by approved plant operator.' }],
    visitors: [{ display_order: 0, name: 'Chris Morgan', position: 'Project Engineer', company: 'Client Team', on_site_time: '10:00:00', off_site_time: '12:00:00' }],
    delays: [{ display_order: 0, item_description: 'Delay', comments: 'Service scan required before excavation started.' }],
  },
];

const dailySiteDiarySamples: DailySiteDiarySample[] = [
  {
    job_no: 'DSD-SAMPLE-001',
    site: 'Euston Concourse Lighting',
    van_registration: 'YX25 MNO',
    mileage: 42236,
    start_time: '07:00:00',
    finish_time: '16:30:00',
    duration_hours: 9.5,
    travel_hours: 1,
    onsite_hours: 8.5,
    total_time_hours: 9.5,
    fatigue_hours: 9.5,
    activity_description: 'Set out new lighting containment, completed isolations, and installed first run above retail unit frontage.',
    comments: 'Access maintained for station staff throughout. No safety incidents reported.',
    instructed_on_site_by: 'Site Manager',
    instructed_on_site_name: 'Helen Morris',
    status: 'approved',
    resources: [
      makeDiaryResource(0, 'Tom Bradley', 'Electrician', 1, 8, 0.5, 0, 0, 0, false, 0, 35),
      makeDiaryResource(1, 'Lewis Grant', 'Mate', 1, 8, 0.5, 0, 0, 0, false, 10, 20),
    ],
    plant: [{ display_order: 0, item_description: 'Podium steps', comments: 'Used within segregated work zone.' }],
    visitors: [{ display_order: 0, name: 'Helen Morris', position: 'Site Manager', company: 'Network Rail', on_site_time: '08:30:00', off_site_time: '09:15:00' }],
    delays: [{ display_order: 0, item_description: 'Instruction', comments: 'Work sequence adjusted to keep retail fire exit clear.' }],
  },
  {
    job_no: 'DSD-SAMPLE-002',
    site: 'Clapham Junction Substation',
    van_registration: 'YX24 JKL',
    mileage: 38804,
    start_time: '06:45:00',
    finish_time: '15:45:00',
    duration_hours: 9,
    travel_hours: 1.25,
    onsite_hours: 7.75,
    total_time_hours: 9,
    fatigue_hours: 9,
    activity_description: 'Completed containment survey, marked cable routes, and confirmed isolation points with electrical responsible person.',
    comments: 'Survey notes issued to project engineer for drawing update.',
    instructed_on_site_by: 'Electrical Responsible Person',
    instructed_on_site_name: 'Mark Davies',
    status: 'submitted',
    resources: [
      makeDiaryResource(0, 'Amelia Carter', 'Supervisor', 1.25, 7.75, 0, 0, 0, 0, false, 0, 40),
      makeDiaryResource(1, 'Ryan Ellis', 'Electrician', 1.25, 7.75, 0, 0, 0, 0, false, 0, 30),
    ],
    plant: [{ display_order: 0, item_description: 'Cable avoidance tool', comments: 'Used during route verification.' }],
    visitors: [{ display_order: 0, name: 'Paul Stevens', position: 'CEM', company: 'Principal Contractor', on_site_time: '12:10:00', off_site_time: '13:00:00' }],
    delays: [{ display_order: 0, item_description: 'Delay', comments: 'Brief wait for substation access keys.' }],
  },
  {
    job_no: 'DSD-SAMPLE-003',
    site: 'Paddington Platform 12',
    van_registration: 'YX23 GHI',
    mileage: 51302,
    start_time: '22:00:00',
    finish_time: '05:30:00',
    duration_hours: 7.5,
    travel_hours: 0.75,
    onsite_hours: 6.75,
    total_time_hours: 7.5,
    fatigue_hours: 7.5,
    activity_description: 'Night shift to install final containment lids, terminate lighting feeds, and complete pre-energisation checks.',
    comments: 'Possession handed back on time. Remaining snag list limited to labelling.',
    instructed_on_site_by: 'Night Shift Manager',
    instructed_on_site_name: 'Sophie Green',
    status: 'draft',
    resources: [
      makeDiaryResource(0, 'Daniel Price', 'Electrician', 0.75, 6.75, 0, 0, 0, 0, false, 0, 25),
      makeDiaryResource(1, 'Owen Hughes', 'Mate', 0.75, 6.75, 0, 0, 0, 0, false, 0, 15),
    ],
    plant: [{ display_order: 0, item_description: 'Battery lighting tower', comments: 'Used during isolation window.' }],
    visitors: [],
    delays: [{ display_order: 0, item_description: 'Instruction', comments: 'Labels to follow client naming convention issued during shift.' }],
  },
  {
    job_no: 'DSD-SAMPLE-004',
    site: 'Slough Station Back-of-House',
    van_registration: 'YX22 DEF',
    mileage: 60531,
    start_time: '07:30:00',
    finish_time: '17:00:00',
    duration_hours: 9.5,
    travel_hours: 0.75,
    onsite_hours: 8.75,
    total_time_hours: 9.5,
    fatigue_hours: 9.5,
    activity_description: 'Installed small power containment and mounted isolators for back-of-house equipment upgrade.',
    comments: 'Material shortage resolved by collecting additional trunking from Reading depot.',
    instructed_on_site_by: 'Works Supervisor',
    instructed_on_site_name: 'Chris Morgan',
    status: 'approved',
    resources: [
      makeDiaryResource(0, 'Priya Shah', 'Approved Electrician', 0.75, 8, 0.75, 0, 0, 0, false, 0, 45),
      makeDiaryResource(1, 'Jack Turner', 'Electrician', 0.75, 8, 0.75, 0, 0, 0, false, 14, 35),
    ],
    plant: [{ display_order: 0, item_description: 'Cordless trunking saw', comments: 'Used with dust extraction.' }],
    visitors: [{ display_order: 0, name: 'Nadia Khan', position: 'Station Manager', company: 'GWR', on_site_time: '14:20:00', off_site_time: '14:45:00' }],
    delays: [{ display_order: 0, item_description: 'Delay', comments: 'Thirty minute material collection from depot.' }],
  },
  {
    job_no: 'DSD-SAMPLE-005',
    site: 'Basingstoke Cable Route',
    van_registration: 'YX21 ABC',
    mileage: 45012,
    start_time: '06:30:00',
    finish_time: '16:00:00',
    duration_hours: 9.5,
    travel_hours: 1.5,
    onsite_hours: 8,
    total_time_hours: 9.5,
    fatigue_hours: 9.5,
    activity_description: 'Pulled multicore control cable through existing duct route and completed continuity checks at both ends.',
    comments: 'Duct section between chambers 4 and 5 tight but cable installed without damage.',
    instructed_on_site_by: 'Project Engineer',
    instructed_on_site_name: 'Paul Stevens',
    status: 'submitted',
    resources: [
      makeDiaryResource(0, 'Grace Wilson', 'Supervisor', 1.5, 8, 0, 0, 0, 0, false, 15, 40),
      makeDiaryResource(1, 'Nathan Cole', 'Electrician', 1.5, 8, 0, 0, 0, 0, false, 0, 30),
    ],
    plant: [
      { display_order: 0, item_description: 'Cable rollers', comments: 'Installed at chamber entry and exit points.' },
      { display_order: 1, item_description: 'Winch', comments: 'Used at low tension throughout pull.' },
    ],
    visitors: [{ display_order: 0, name: 'Andrew Lee', position: 'Possession Planner', company: 'Client Team', on_site_time: '09:30:00', off_site_time: '10:15:00' }],
    delays: [{ display_order: 0, item_description: 'Non-contract work', comments: 'Additional chamber clean-out requested before cable pull.' }],
  },
];

function makeShiftResource(
  display_order: number,
  name: string,
  company: string,
  grade: string,
  travel_hours: number,
  basic_hours: number,
  one_third_hours: number,
  half_hours: number,
  double_hours: number,
  lodge_allowance: boolean,
  expenses: number,
  bonus: number
): ShiftResourceRow {
  return { display_order, name, company, grade, travel_hours, basic_hours, one_third_hours, half_hours, double_hours, lodge_allowance, expenses, bonus };
}

function makeDiaryResource(
  display_order: number,
  name: string,
  grade: string,
  travel_hours: number,
  basic_hours: number,
  one_third_hours: number,
  half_hours: number,
  double_hours: number,
  annual_leave_hours: number,
  lodge_allowance: boolean,
  expenses: number,
  bonus: number
): SiteDiaryResourceRow {
  return { display_order, name, grade, travel_hours, basic_hours, one_third_hours, half_hours, double_hours, annual_leave_hours, lodge_allowance, expenses, bonus };
}

function makeShiftActivityRows(sample: ShiftReportSample): Array<{ display_order: number; activity_description: string; duration_hours: number }> {
  const descriptions = sample.activity_description
    .split('.')
    .map((description) => description.trim())
    .filter(Boolean)
    .map((description) => `${description}.`);
  const activityCount = descriptions.length || 1;
  const roundedShare = Number((sample.onsite_duration_hours / activityCount).toFixed(2));
  let allocatedHours = 0;

  return (descriptions.length ? descriptions : [sample.activity_description]).map((activity_description, index) => {
    const isLastRow = index === activityCount - 1;
    const duration_hours = isLastRow ? Number((sample.onsite_duration_hours - allocatedHours).toFixed(2)) : roundedShare;
    allocatedHours += duration_hours;
    return {
      display_order: index,
      activity_description,
      duration_hours,
    };
  });
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getDayLabel(reportDate: string): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${reportDate}T12:00:00Z`));
}

function getRecentWeekdays(limit: number): string[] {
  const dates: string[] = [];
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - 1);

  while (dates.length < limit) {
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6) dates.push(formatDate(date));
    date.setUTCDate(date.getUTCDate() - 1);
  }

  return dates;
}

async function getTargetProfile(): Promise<Profile> {
  if (targetUserEmail) {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw new Error(`Unable to list auth users: ${error.message}`);

    const authUser = data.users.find((user) => user.email?.toLowerCase() === targetUserEmail.toLowerCase());
    if (!authUser) throw new Error(`No auth user found for SAMPLE_DAILY_REPORT_USER_EMAIL=${targetUserEmail}`);

    const { data: profile, error: profileError } = await supabase.from('profiles').select('id, full_name, employee_id, role').eq('id', authUser.id).single();
    if (profileError) throw new Error(`Unable to load profile for ${targetUserEmail}: ${profileError.message}`);
    return profile as Profile;
  }

  const { data: profiles, error } = await supabase.from('profiles').select('id, full_name, employee_id, role').order('full_name', { ascending: true }).limit(50);
  if (error) throw new Error(`Unable to load profiles: ${error.message}`);
  if (!profiles?.length) throw new Error('No profiles found. Create at least one user before seeding daily reports.');

  const typedProfiles = profiles as Profile[];
  return (
    typedProfiles.find((profile) => profile.employee_id === 'DEMO-EMP-01') ||
    typedProfiles.find((profile) => profile.full_name === 'Jamie Carter') ||
    typedProfiles.find((profile) => profile.role === 'employee') ||
    typedProfiles[0]
  );
}

async function getManagerId(): Promise<string | null> {
  const { data, error } = await supabase.from('profiles').select('id').in('role', ['admin', 'manager']).limit(1);
  if (error) {
    console.warn(`Unable to load manager for approved sample rows: ${error.message}`);
    return null;
  }

  return data?.[0]?.id || null;
}

async function getAvailableDates(tableName: 'shift_reports' | 'daily_site_diaries', userId: string, count: number): Promise<string[]> {
  const candidates = getRecentWeekdays(80);
  const { data, error } = await supabase.from(tableName).select('report_date').eq('user_id', userId).in('report_date', candidates);
  if (error) throw new Error(`Unable to check existing ${tableName}: ${error.message}`);

  const usedDates = new Set((data || []).map((row) => String(row.report_date)));
  const availableDates = candidates.filter((date) => !usedDates.has(date)).slice(0, count);
  if (availableDates.length < count) throw new Error(`Could not find ${count} available weekdays for ${tableName}.`);

  return availableDates;
}

function reviewFields(status: DailyReportStatus, managerId: string | null) {
  const isSubmitted = status === 'submitted' || status === 'approved' || status === 'rejected';
  const isReviewed = status === 'approved' || status === 'rejected';
  return {
    submitted_at: isSubmitted ? new Date().toISOString() : null,
    reviewed_by: isReviewed ? managerId : null,
    reviewed_at: isReviewed ? new Date().toISOString() : null,
    manager_comments: status === 'approved' ? 'Sample report approved for demonstration.' : null,
  };
}

async function insertRows(tableName: string, rows: Array<Record<string, unknown>>): Promise<void> {
  if (rows.length === 0) return;

  const { error } = await supabase.from(tableName).insert(rows);
  if (error) throw new Error(`Unable to insert ${tableName}: ${error.message}`);
}

async function seedShiftReports(profile: Profile, managerId: string | null): Promise<number> {
  const dates = await getAvailableDates('shift_reports', profile.id, shiftReportSamples.length);
  let createdCount = 0;

  for (const [index, sample] of shiftReportSamples.entries()) {
    const reportDate = dates[index];
    const { resources, plant, visitors, delays, ...header } = sample;
    const { data, error } = await supabase
      .from('shift_reports')
      .insert({
        ...header,
        ...reviewFields(sample.status, managerId),
        user_id: profile.id,
        report_date: reportDate,
        day_label: getDayLabel(reportDate),
      })
      .select('id')
      .single();

    if (error) throw new Error(`Unable to insert shift report ${sample.job_no}: ${error.message}`);

    const reportId = String(data.id);
    await insertRows(
      'shift_report_activity_rows',
      makeShiftActivityRows(sample).map((row) => ({ ...row, report_id: reportId }))
    );
    await insertRows(
      'shift_report_resource_allocations',
      resources.map((row) => ({ ...row, report_id: reportId }))
    );
    await insertRows(
      'shift_report_plant_equipment',
      plant.map((row) => ({ ...row, report_id: reportId }))
    );
    await insertRows(
      'shift_report_visitors',
      visitors.map((row) => ({ ...row, report_id: reportId }))
    );
    await insertRows(
      'shift_report_delay_instructions',
      delays.map((row) => ({ ...row, report_id: reportId }))
    );

    createdCount += 1;
    console.log(`Created shift report ${sample.job_no} for ${reportDate}`);
  }

  return createdCount;
}

async function seedDailySiteDiaries(profile: Profile, managerId: string | null): Promise<number> {
  const dates = await getAvailableDates('daily_site_diaries', profile.id, dailySiteDiarySamples.length);
  let createdCount = 0;

  for (const [index, sample] of dailySiteDiarySamples.entries()) {
    const reportDate = dates[index];
    const { resources, plant, visitors, delays, ...header } = sample;
    const { data, error } = await supabase
      .from('daily_site_diaries')
      .insert({
        ...header,
        ...reviewFields(sample.status, managerId),
        user_id: profile.id,
        report_date: reportDate,
        day_label: getDayLabel(reportDate),
      })
      .select('id')
      .single();

    if (error) throw new Error(`Unable to insert daily site diary ${sample.job_no}: ${error.message}`);

    const diaryId = String(data.id);
    await insertRows(
      'daily_site_diary_resource_allocations',
      resources.map((row) => ({ ...row, diary_id: diaryId }))
    );
    await insertRows(
      'daily_site_diary_plant_equipment',
      plant.map((row) => ({ ...row, diary_id: diaryId }))
    );
    await insertRows(
      'daily_site_diary_visitors',
      visitors.map((row) => ({ ...row, diary_id: diaryId }))
    );
    await insertRows(
      'daily_site_diary_delay_instructions',
      delays.map((row) => ({ ...row, diary_id: diaryId }))
    );

    createdCount += 1;
    console.log(`Created daily site diary ${sample.job_no} for ${reportDate}`);
  }

  return createdCount;
}

async function main(): Promise<void> {
  console.log('Seeding sample shift reports and daily site diaries...');

  const profile = await getTargetProfile();
  const managerId = await getManagerId();
  const shiftReportCount = await seedShiftReports(profile, managerId);
  const dailySiteDiaryCount = await seedDailySiteDiaries(profile, managerId);

  console.log('');
  console.log(`Created ${shiftReportCount} shift reports and ${dailySiteDiaryCount} daily site diary entries.`);
  console.log(`Assigned to ${profile.full_name || 'selected profile'}${profile.employee_id ? ` (${profile.employee_id})` : ''}.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
