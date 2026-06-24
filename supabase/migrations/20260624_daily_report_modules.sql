BEGIN;

CREATE TABLE IF NOT EXISTS public.shift_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  day_label TEXT,
  job_no TEXT,
  site TEXT,
  van_registration TEXT,
  mileage NUMERIC(10,2),
  travel_start_time TIME,
  travel_finish_time TIME,
  site_start_time TIME,
  site_finish_time TIME,
  travel_duration_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  onsite_duration_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  total_time_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  activity_description TEXT,
  comments TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  signature_data TEXT,
  signed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  manager_comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT shift_reports_user_date_key UNIQUE (user_id, report_date)
);

CREATE TABLE IF NOT EXISTS public.shift_report_resource_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.shift_reports(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  name TEXT,
  company TEXT,
  grade TEXT,
  travel_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  basic_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  one_third_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  half_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  double_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  lodge_allowance BOOLEAN NOT NULL DEFAULT FALSE,
  expenses NUMERIC(10,2) NOT NULL DEFAULT 0,
  bonus NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shift_report_plant_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.shift_reports(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  item_description TEXT,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shift_report_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.shift_reports(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  name TEXT,
  position TEXT,
  company TEXT,
  on_site_time TIME,
  off_site_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shift_report_delay_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.shift_reports(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  item_description TEXT,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_site_diaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  day_label TEXT,
  job_no TEXT,
  site TEXT,
  van_registration TEXT,
  mileage NUMERIC(10,2),
  start_time TIME,
  finish_time TIME,
  duration_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  travel_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  onsite_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  total_time_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  fatigue_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  activity_description TEXT,
  comments TEXT,
  instructed_on_site_by TEXT,
  instructed_on_site_name TEXT,
  instructed_on_site_signature_data TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  signature_data TEXT,
  signed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  manager_comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT daily_site_diaries_user_date_key UNIQUE (user_id, report_date)
);

CREATE TABLE IF NOT EXISTS public.daily_site_diary_resource_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID NOT NULL REFERENCES public.daily_site_diaries(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  name TEXT,
  grade TEXT,
  travel_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  basic_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  one_third_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  half_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  double_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  annual_leave_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  lodge_allowance BOOLEAN NOT NULL DEFAULT FALSE,
  expenses NUMERIC(10,2) NOT NULL DEFAULT 0,
  bonus NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_site_diary_plant_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID NOT NULL REFERENCES public.daily_site_diaries(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  item_description TEXT,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_site_diary_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID NOT NULL REFERENCES public.daily_site_diaries(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  name TEXT,
  position TEXT,
  company TEXT,
  on_site_time TIME,
  off_site_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_site_diary_delay_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID NOT NULL REFERENCES public.daily_site_diaries(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  item_description TEXT,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shift_reports_user_date ON public.shift_reports(user_id, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_shift_reports_status_date ON public.shift_reports(status, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_shift_reports_reviewed_by ON public.shift_reports(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_shift_report_resource_report ON public.shift_report_resource_allocations(report_id, display_order);
CREATE INDEX IF NOT EXISTS idx_shift_report_plant_report ON public.shift_report_plant_equipment(report_id, display_order);
CREATE INDEX IF NOT EXISTS idx_shift_report_visitors_report ON public.shift_report_visitors(report_id, display_order);
CREATE INDEX IF NOT EXISTS idx_shift_report_delays_report ON public.shift_report_delay_instructions(report_id, display_order);

CREATE INDEX IF NOT EXISTS idx_daily_site_diaries_user_date ON public.daily_site_diaries(user_id, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_site_diaries_status_date ON public.daily_site_diaries(status, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_site_diaries_reviewed_by ON public.daily_site_diaries(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_daily_site_diary_resource_report ON public.daily_site_diary_resource_allocations(diary_id, display_order);
CREATE INDEX IF NOT EXISTS idx_daily_site_diary_plant_report ON public.daily_site_diary_plant_equipment(diary_id, display_order);
CREATE INDEX IF NOT EXISTS idx_daily_site_diary_visitors_report ON public.daily_site_diary_visitors(diary_id, display_order);
CREATE INDEX IF NOT EXISTS idx_daily_site_diary_delays_report ON public.daily_site_diary_delay_instructions(diary_id, display_order);

DROP TRIGGER IF EXISTS set_updated_at_shift_reports ON public.shift_reports;
CREATE TRIGGER set_updated_at_shift_reports
  BEFORE UPDATE ON public.shift_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_daily_site_diaries ON public.daily_site_diaries;
CREATE TRIGGER set_updated_at_daily_site_diaries
  BEFORE UPDATE ON public.daily_site_diaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_shift_report_resource_allocations ON public.shift_report_resource_allocations;
CREATE TRIGGER set_updated_at_shift_report_resource_allocations
  BEFORE UPDATE ON public.shift_report_resource_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_shift_report_plant_equipment ON public.shift_report_plant_equipment;
CREATE TRIGGER set_updated_at_shift_report_plant_equipment
  BEFORE UPDATE ON public.shift_report_plant_equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_shift_report_visitors ON public.shift_report_visitors;
CREATE TRIGGER set_updated_at_shift_report_visitors
  BEFORE UPDATE ON public.shift_report_visitors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_shift_report_delay_instructions ON public.shift_report_delay_instructions;
CREATE TRIGGER set_updated_at_shift_report_delay_instructions
  BEFORE UPDATE ON public.shift_report_delay_instructions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_daily_site_diary_resource_allocations ON public.daily_site_diary_resource_allocations;
CREATE TRIGGER set_updated_at_daily_site_diary_resource_allocations
  BEFORE UPDATE ON public.daily_site_diary_resource_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_daily_site_diary_plant_equipment ON public.daily_site_diary_plant_equipment;
CREATE TRIGGER set_updated_at_daily_site_diary_plant_equipment
  BEFORE UPDATE ON public.daily_site_diary_plant_equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_daily_site_diary_visitors ON public.daily_site_diary_visitors;
CREATE TRIGGER set_updated_at_daily_site_diary_visitors
  BEFORE UPDATE ON public.daily_site_diary_visitors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_daily_site_diary_delay_instructions ON public.daily_site_diary_delay_instructions;
CREATE TRIGGER set_updated_at_daily_site_diary_delay_instructions
  BEFORE UPDATE ON public.daily_site_diary_delay_instructions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.shift_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_report_resource_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_report_plant_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_report_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_report_delay_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_site_diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_site_diary_resource_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_site_diary_plant_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_site_diary_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_site_diary_delay_instructions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shift_reports_select ON public.shift_reports;
CREATE POLICY shift_reports_select ON public.shift_reports
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.effective_is_manager_admin()));

DROP POLICY IF EXISTS shift_reports_insert ON public.shift_reports;
CREATE POLICY shift_reports_insert ON public.shift_reports
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT public.effective_is_manager_admin()));

DROP POLICY IF EXISTS shift_reports_update_own ON public.shift_reports;
CREATE POLICY shift_reports_update_own ON public.shift_reports
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) AND status IN ('draft', 'rejected'))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS shift_reports_update_manager ON public.shift_reports;
CREATE POLICY shift_reports_update_manager ON public.shift_reports
  FOR UPDATE TO authenticated
  USING ((SELECT public.effective_is_manager_admin()))
  WITH CHECK ((SELECT public.effective_is_manager_admin()));

DROP POLICY IF EXISTS shift_reports_delete ON public.shift_reports;
CREATE POLICY shift_reports_delete ON public.shift_reports
  FOR DELETE TO authenticated
  USING ((user_id = (SELECT auth.uid()) AND status IN ('draft', 'rejected')) OR (SELECT public.effective_is_manager_admin()));

DROP POLICY IF EXISTS daily_site_diaries_select ON public.daily_site_diaries;
CREATE POLICY daily_site_diaries_select ON public.daily_site_diaries
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.effective_is_manager_admin()));

DROP POLICY IF EXISTS daily_site_diaries_insert ON public.daily_site_diaries;
CREATE POLICY daily_site_diaries_insert ON public.daily_site_diaries
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT public.effective_is_manager_admin()));

DROP POLICY IF EXISTS daily_site_diaries_update_own ON public.daily_site_diaries;
CREATE POLICY daily_site_diaries_update_own ON public.daily_site_diaries
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) AND status IN ('draft', 'rejected'))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS daily_site_diaries_update_manager ON public.daily_site_diaries;
CREATE POLICY daily_site_diaries_update_manager ON public.daily_site_diaries
  FOR UPDATE TO authenticated
  USING ((SELECT public.effective_is_manager_admin()))
  WITH CHECK ((SELECT public.effective_is_manager_admin()));

DROP POLICY IF EXISTS daily_site_diaries_delete ON public.daily_site_diaries;
CREATE POLICY daily_site_diaries_delete ON public.daily_site_diaries
  FOR DELETE TO authenticated
  USING ((user_id = (SELECT auth.uid()) AND status IN ('draft', 'rejected')) OR (SELECT public.effective_is_manager_admin()));

DROP POLICY IF EXISTS shift_report_resource_select ON public.shift_report_resource_allocations;
CREATE POLICY shift_report_resource_select ON public.shift_report_resource_allocations
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shift_reports reports WHERE reports.id = report_id));

DROP POLICY IF EXISTS shift_report_resource_modify ON public.shift_report_resource_allocations;
CREATE POLICY shift_report_resource_modify ON public.shift_report_resource_allocations
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shift_reports reports
    WHERE reports.id = report_id
      AND ((reports.user_id = (SELECT auth.uid()) AND reports.status IN ('draft', 'rejected')) OR (SELECT public.effective_is_manager_admin()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shift_reports reports
    WHERE reports.id = report_id
      AND ((reports.user_id = (SELECT auth.uid()) AND reports.status IN ('draft', 'rejected')) OR (SELECT public.effective_is_manager_admin()))
  ));

DROP POLICY IF EXISTS shift_report_plant_select ON public.shift_report_plant_equipment;
CREATE POLICY shift_report_plant_select ON public.shift_report_plant_equipment
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shift_reports reports WHERE reports.id = report_id));

DROP POLICY IF EXISTS shift_report_plant_modify ON public.shift_report_plant_equipment;
CREATE POLICY shift_report_plant_modify ON public.shift_report_plant_equipment
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shift_reports reports
    WHERE reports.id = report_id
      AND ((reports.user_id = (SELECT auth.uid()) AND reports.status IN ('draft', 'rejected')) OR (SELECT public.effective_is_manager_admin()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shift_reports reports
    WHERE reports.id = report_id
      AND ((reports.user_id = (SELECT auth.uid()) AND reports.status IN ('draft', 'rejected')) OR (SELECT public.effective_is_manager_admin()))
  ));

DROP POLICY IF EXISTS shift_report_visitors_select ON public.shift_report_visitors;
CREATE POLICY shift_report_visitors_select ON public.shift_report_visitors
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shift_reports reports WHERE reports.id = report_id));

DROP POLICY IF EXISTS shift_report_visitors_modify ON public.shift_report_visitors;
CREATE POLICY shift_report_visitors_modify ON public.shift_report_visitors
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shift_reports reports
    WHERE reports.id = report_id
      AND ((reports.user_id = (SELECT auth.uid()) AND reports.status IN ('draft', 'rejected')) OR (SELECT public.effective_is_manager_admin()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shift_reports reports
    WHERE reports.id = report_id
      AND ((reports.user_id = (SELECT auth.uid()) AND reports.status IN ('draft', 'rejected')) OR (SELECT public.effective_is_manager_admin()))
  ));

DROP POLICY IF EXISTS shift_report_delays_select ON public.shift_report_delay_instructions;
CREATE POLICY shift_report_delays_select ON public.shift_report_delay_instructions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shift_reports reports WHERE reports.id = report_id));

DROP POLICY IF EXISTS shift_report_delays_modify ON public.shift_report_delay_instructions;
CREATE POLICY shift_report_delays_modify ON public.shift_report_delay_instructions
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shift_reports reports
    WHERE reports.id = report_id
      AND ((reports.user_id = (SELECT auth.uid()) AND reports.status IN ('draft', 'rejected')) OR (SELECT public.effective_is_manager_admin()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shift_reports reports
    WHERE reports.id = report_id
      AND ((reports.user_id = (SELECT auth.uid()) AND reports.status IN ('draft', 'rejected')) OR (SELECT public.effective_is_manager_admin()))
  ));

DROP POLICY IF EXISTS daily_site_diary_resource_select ON public.daily_site_diary_resource_allocations;
CREATE POLICY daily_site_diary_resource_select ON public.daily_site_diary_resource_allocations
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.daily_site_diaries diaries WHERE diaries.id = diary_id));

DROP POLICY IF EXISTS daily_site_diary_resource_modify ON public.daily_site_diary_resource_allocations;
CREATE POLICY daily_site_diary_resource_modify ON public.daily_site_diary_resource_allocations
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.daily_site_diaries diaries
    WHERE diaries.id = diary_id
      AND ((diaries.user_id = (SELECT auth.uid()) AND diaries.status IN ('draft', 'rejected')) OR (SELECT public.effective_is_manager_admin()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.daily_site_diaries diaries
    WHERE diaries.id = diary_id
      AND ((diaries.user_id = (SELECT auth.uid()) AND diaries.status IN ('draft', 'rejected')) OR (SELECT public.effective_is_manager_admin()))
  ));

DROP POLICY IF EXISTS daily_site_diary_plant_select ON public.daily_site_diary_plant_equipment;
CREATE POLICY daily_site_diary_plant_select ON public.daily_site_diary_plant_equipment
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.daily_site_diaries diaries WHERE diaries.id = diary_id));

DROP POLICY IF EXISTS daily_site_diary_plant_modify ON public.daily_site_diary_plant_equipment;
CREATE POLICY daily_site_diary_plant_modify ON public.daily_site_diary_plant_equipment
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.daily_site_diaries diaries
    WHERE diaries.id = diary_id
      AND ((diaries.user_id = (SELECT auth.uid()) AND diaries.status IN ('draft', 'rejected')) OR (SELECT public.effective_is_manager_admin()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.daily_site_diaries diaries
    WHERE diaries.id = diary_id
      AND ((diaries.user_id = (SELECT auth.uid()) AND diaries.status IN ('draft', 'rejected')) OR (SELECT public.effective_is_manager_admin()))
  ));

DROP POLICY IF EXISTS daily_site_diary_visitors_select ON public.daily_site_diary_visitors;
CREATE POLICY daily_site_diary_visitors_select ON public.daily_site_diary_visitors
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.daily_site_diaries diaries WHERE diaries.id = diary_id));

DROP POLICY IF EXISTS daily_site_diary_visitors_modify ON public.daily_site_diary_visitors;
CREATE POLICY daily_site_diary_visitors_modify ON public.daily_site_diary_visitors
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.daily_site_diaries diaries
    WHERE diaries.id = diary_id
      AND ((diaries.user_id = (SELECT auth.uid()) AND diaries.status IN ('draft', 'rejected')) OR (SELECT public.effective_is_manager_admin()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.daily_site_diaries diaries
    WHERE diaries.id = diary_id
      AND ((diaries.user_id = (SELECT auth.uid()) AND diaries.status IN ('draft', 'rejected')) OR (SELECT public.effective_is_manager_admin()))
  ));

DROP POLICY IF EXISTS daily_site_diary_delays_select ON public.daily_site_diary_delay_instructions;
CREATE POLICY daily_site_diary_delays_select ON public.daily_site_diary_delay_instructions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.daily_site_diaries diaries WHERE diaries.id = diary_id));

DROP POLICY IF EXISTS daily_site_diary_delays_modify ON public.daily_site_diary_delay_instructions;
CREATE POLICY daily_site_diary_delays_modify ON public.daily_site_diary_delay_instructions
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.daily_site_diaries diaries
    WHERE diaries.id = diary_id
      AND ((diaries.user_id = (SELECT auth.uid()) AND diaries.status IN ('draft', 'rejected')) OR (SELECT public.effective_is_manager_admin()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.daily_site_diaries diaries
    WHERE diaries.id = diary_id
      AND ((diaries.user_id = (SELECT auth.uid()) AND diaries.status IN ('draft', 'rejected')) OR (SELECT public.effective_is_manager_admin()))
  ));

INSERT INTO public.permission_modules (module_name, minimum_role_id, sort_order)
SELECT seed.module_name, roles.id, seed.sort_order
FROM (
  VALUES
    ('shift-reports', 'employee', 92),
    ('daily-site-diary', 'employee', 94)
) AS seed(module_name, minimum_role_name, sort_order)
JOIN public.roles ON roles.name = seed.minimum_role_name
ON CONFLICT (module_name) DO UPDATE
SET minimum_role_id = EXCLUDED.minimum_role_id,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

INSERT INTO public.role_permissions (role_id, module_name, enabled)
SELECT roles.id, seed.module_name, FALSE
FROM public.roles
CROSS JOIN (
  VALUES
    ('shift-reports'),
    ('daily-site-diary')
) AS seed(module_name)
ON CONFLICT (role_id, module_name) DO NOTHING;

INSERT INTO public.team_module_permissions (team_id, module_name, enabled)
SELECT org_teams.id, seed.module_name, TRUE
FROM public.org_teams
CROSS JOIN (
  VALUES
    ('shift-reports'),
    ('daily-site-diary')
) AS seed(module_name)
WHERE org_teams.active = TRUE
ON CONFLICT (team_id, module_name) DO NOTHING;

COMMIT;
