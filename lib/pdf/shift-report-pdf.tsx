import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { ResPdfFooter, ResPdfHeader, ResPdfMetaGrid, ResPdfSectionTitle } from '@/lib/pdf/res-pdf-components';
import {
  dailyReportPdfStyles as styles,
  formatBoolean,
  formatHours,
  PdfTable,
  SignatureSummary,
  valueOrDash,
  type PdfColumn,
} from '@/lib/pdf/daily-report-pdf-shared';
import { formatDate } from '@/lib/utils/date';
import type { DelayInstructionRow, PlantEquipmentRow, ShiftReport, ShiftReportResourceAllocation, VisitorRow } from '@/types/daily-reports';

interface ShiftReportPDFProps {
  report: ShiftReport;
  employeeName?: string | null;
  approvedByName?: string | null;
  logoSrc?: string | null;
}

const resourceColumns: PdfColumn<ShiftReportResourceAllocation>[] = [
  { label: 'Name', width: '16%', render: (row) => row.name },
  { label: 'Company', width: '12%', render: (row) => row.company },
  { label: 'Grade', width: '8%', render: (row) => row.grade },
  { label: 'Travel', width: '8%', render: (row) => formatHours(row.travel_hours) },
  { label: 'Basic', width: '8%', render: (row) => formatHours(row.basic_hours) },
  { label: '1/3', width: '7%', render: (row) => formatHours(row.one_third_hours) },
  { label: '1/2', width: '7%', render: (row) => formatHours(row.half_hours) },
  { label: 'Double', width: '8%', render: (row) => formatHours(row.double_hours) },
  { label: 'Lodge', width: '7%', render: (row) => formatBoolean(row.lodge_allowance) },
  { label: 'Expenses', width: '10%', render: (row) => formatHours(row.expenses) },
  { label: 'Bonus', width: '9%', render: (row) => formatHours(row.bonus) },
];

const plantColumns: PdfColumn<PlantEquipmentRow>[] = [
  { label: 'Item Description', width: '55%', render: (row) => row.item_description },
  { label: 'Comment', width: '45%', render: (row) => row.comments },
];

const visitorColumns: PdfColumn<VisitorRow>[] = [
  { label: 'Name', width: '25%', render: (row) => row.name },
  { label: 'Position', width: '20%', render: (row) => row.position },
  { label: 'Company', width: '25%', render: (row) => row.company },
  { label: 'On Site', width: '15%', render: (row) => row.on_site_time },
  { label: 'Off Site', width: '15%', render: (row) => row.off_site_time },
];

const delayColumns: PdfColumn<DelayInstructionRow>[] = [
  { label: 'Item Description', width: '50%', render: (row) => row.item_description },
  { label: 'Comment', width: '50%', render: (row) => row.comments },
];

export function ShiftReportPDF({ report, employeeName, approvedByName, logoSrc = null }: ShiftReportPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ResPdfHeader title="Shift Report" formCode="QF3215" logoSrc={logoSrc} />
        <ResPdfMetaGrid
          columns={4}
          items={[
            { label: 'Job No', value: report.job_no },
            { label: 'Site', value: report.site },
            { label: 'Day', value: report.day_label },
            { label: 'Date', value: formatDate(report.report_date) },
            { label: 'Van Registration', value: report.van_registration },
            { label: 'Mileage', value: report.mileage },
            { label: 'Travel Time', value: `${valueOrDash(report.travel_start_time)} - ${valueOrDash(report.travel_finish_time)}` },
            { label: 'On Site Time', value: `${valueOrDash(report.site_start_time)} - ${valueOrDash(report.site_finish_time)}` },
            { label: 'Travel Duration', value: `${formatHours(report.travel_duration_hours)} hrs` },
            { label: 'On Site Duration', value: `${formatHours(report.onsite_duration_hours)} hrs` },
            { label: 'Total Time', value: `${formatHours(report.total_time_hours)} hrs` },
            { label: 'Status', value: report.status },
          ]}
        />

        <ResPdfSectionTitle>Activity & Description of Works</ResPdfSectionTitle>
        <Text style={styles.boxedText}>{report.activity_description || '-'}</Text>

        <View style={styles.sectionSpacing}>
          <ResPdfSectionTitle>Resource Allocation (Hrs)</ResPdfSectionTitle>
          <PdfTable columns={resourceColumns} rows={report.resource_allocations || []} minRows={6} />
        </View>

        <SignatureSummary
          completedBy={employeeName}
          signatureData={report.signature_data}
          approvedBy={approvedByName}
          comments={report.comments || report.manager_comments}
        />
        <ResPdfFooter formCode="QF3215" />
      </Page>

      <Page size="A4" style={styles.page}>
        <ResPdfHeader title="Shift Report" subtitle="Plant, visitors, delays and instructions" formCode="QF3215" logoSrc={logoSrc} />
        <View style={styles.twoColumn}>
          <View style={styles.flexColumn}>
            <ResPdfSectionTitle>Plant & Equipment On Site</ResPdfSectionTitle>
            <PdfTable columns={plantColumns} rows={report.plant_equipment || []} minRows={6} />
          </View>
          <View style={styles.flexColumn}>
            <ResPdfSectionTitle>Visitors On Site</ResPdfSectionTitle>
            <PdfTable columns={visitorColumns} rows={report.visitors || []} minRows={6} />
          </View>
        </View>

        <View style={styles.sectionSpacing}>
          <ResPdfSectionTitle>Instructed / Delays / Non-Contract Works</ResPdfSectionTitle>
          <PdfTable columns={delayColumns} rows={report.delay_instructions || []} minRows={8} />
        </View>

        <SignatureSummary
          completedBy={employeeName}
          signatureData={report.signature_data}
          approvedBy={approvedByName}
          comments={report.manager_comments}
        />
        <ResPdfFooter formCode="QF3215" />
      </Page>
    </Document>
  );
}
