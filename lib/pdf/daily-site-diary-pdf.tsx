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
import type { DailySiteDiary, DelayInstructionRow, PlantEquipmentRow, SiteDiaryResourceAllocation, VisitorRow } from '@/types/daily-reports';

interface DailySiteDiaryPDFProps {
  diary: DailySiteDiary;
  employeeName?: string | null;
  approvedByName?: string | null;
  logoSrc?: string | null;
}

const resourceColumns: PdfColumn<SiteDiaryResourceAllocation>[] = [
  { label: 'Name', width: '16%', render: (row) => row.name },
  { label: 'Grade', width: '8%', render: (row) => row.grade },
  { label: 'Travel', width: '8%', render: (row) => formatHours(row.travel_hours) },
  { label: 'Basic', width: '8%', render: (row) => formatHours(row.basic_hours) },
  { label: '1/3', width: '7%', render: (row) => formatHours(row.one_third_hours) },
  { label: '1/2', width: '7%', render: (row) => formatHours(row.half_hours) },
  { label: 'Double', width: '8%', render: (row) => formatHours(row.double_hours) },
  { label: 'Annual Leave', width: '10%', render: (row) => formatHours(row.annual_leave_hours) },
  { label: 'Lodge', width: '7%', render: (row) => formatBoolean(row.lodge_allowance) },
  { label: 'Expenses', width: '10%', render: (row) => formatHours(row.expenses) },
  { label: 'Bonus', width: '11%', render: (row) => formatHours(row.bonus) },
];

const compactColumns: PdfColumn<PlantEquipmentRow | DelayInstructionRow>[] = [
  { label: 'Description', width: '55%', render: (row) => row.item_description },
  { label: 'Comment', width: '45%', render: (row) => row.comments },
];

const visitorColumns: PdfColumn<VisitorRow>[] = [
  { label: 'Name', width: '25%', render: (row) => row.name },
  { label: 'Position', width: '20%', render: (row) => row.position },
  { label: 'Company', width: '25%', render: (row) => row.company },
  { label: 'On Site', width: '15%', render: (row) => row.on_site_time },
  { label: 'Off Site', width: '15%', render: (row) => row.off_site_time },
];

export function DailySiteDiaryPDF({ diary, employeeName, approvedByName, logoSrc = null }: DailySiteDiaryPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ResPdfHeader title="Daily Site Diary" formCode="QF3215" logoSrc={logoSrc} />
        <ResPdfMetaGrid
          columns={4}
          items={[
            { label: 'Job No', value: diary.job_no },
            { label: 'Site', value: diary.site },
            { label: 'Day', value: diary.day_label },
            { label: 'Date', value: formatDate(diary.report_date) },
            { label: 'Van Registration', value: diary.van_registration },
            { label: 'Mileage', value: diary.mileage },
            { label: 'Start / Finish', value: `${valueOrDash(diary.start_time)} - ${valueOrDash(diary.finish_time)}` },
            { label: 'Duration', value: `${formatHours(diary.duration_hours)} hrs` },
            { label: 'Travel', value: `${formatHours(diary.travel_hours)} hrs` },
            { label: 'On Site', value: `${formatHours(diary.onsite_hours)} hrs` },
            { label: 'Total Time', value: `${formatHours(diary.total_time_hours)} hrs` },
            { label: 'Fatigue Hours', value: `${formatHours(diary.fatigue_hours)} hrs` },
          ]}
        />

        <ResPdfSectionTitle>Activity & Description</ResPdfSectionTitle>
        <Text style={styles.boxedText}>{diary.activity_description || '-'}</Text>

        <View style={styles.sectionSpacing}>
          <ResPdfSectionTitle>Resource Allocation (Hrs)</ResPdfSectionTitle>
          <PdfTable columns={resourceColumns} rows={diary.resource_allocations || []} minRows={5} />
        </View>

        <View style={[styles.twoColumn, styles.sectionSpacing]}>
          <View style={styles.flexColumn}>
            <ResPdfSectionTitle>Plant & Equipment On Site</ResPdfSectionTitle>
            <PdfTable columns={compactColumns} rows={diary.plant_equipment || []} minRows={4} />
          </View>
          <View style={styles.flexColumn}>
            <ResPdfSectionTitle>Visitors On Site</ResPdfSectionTitle>
            <PdfTable columns={visitorColumns} rows={diary.visitors || []} minRows={4} />
          </View>
        </View>

        <View style={styles.sectionSpacing}>
          <ResPdfSectionTitle>Delays / Instructions Description</ResPdfSectionTitle>
          <PdfTable columns={compactColumns} rows={diary.delay_instructions || []} minRows={4} />
        </View>

        <ResPdfMetaGrid
          columns={3}
          items={[
            { label: 'Instructed On Site By', value: diary.instructed_on_site_by },
            { label: 'Name', value: diary.instructed_on_site_name },
            { label: 'Comments', value: diary.comments },
          ]}
        />

        <SignatureSummary
          completedBy={employeeName}
          signatureData={diary.signature_data}
          approvedBy={approvedByName}
          comments={diary.manager_comments}
        />
        <ResPdfFooter formCode="QF3215" />
      </Page>
    </Document>
  );
}
