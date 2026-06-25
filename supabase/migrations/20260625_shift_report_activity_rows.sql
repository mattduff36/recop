BEGIN;

CREATE TABLE IF NOT EXISTS public.shift_report_activity_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.shift_reports(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  activity_description TEXT,
  duration_hours NUMERIC(6,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shift_report_activity_rows_report
  ON public.shift_report_activity_rows(report_id, display_order);

DROP TRIGGER IF EXISTS set_updated_at_shift_report_activity_rows ON public.shift_report_activity_rows;
CREATE TRIGGER set_updated_at_shift_report_activity_rows
  BEFORE UPDATE ON public.shift_report_activity_rows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.shift_report_activity_rows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shift_report_activity_rows_select ON public.shift_report_activity_rows;
CREATE POLICY shift_report_activity_rows_select ON public.shift_report_activity_rows
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shift_reports reports WHERE reports.id = report_id));

DROP POLICY IF EXISTS shift_report_activity_rows_modify ON public.shift_report_activity_rows;
CREATE POLICY shift_report_activity_rows_modify ON public.shift_report_activity_rows
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

INSERT INTO public.shift_report_activity_rows (
  report_id,
  display_order,
  activity_description,
  duration_hours,
  created_at,
  updated_at
)
SELECT
  reports.id,
  0,
  reports.activity_description,
  NULL,
  reports.created_at,
  reports.updated_at
FROM public.shift_reports reports
WHERE NULLIF(BTRIM(reports.activity_description), '') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.shift_report_activity_rows rows
    WHERE rows.report_id = reports.id
  );

COMMIT;
