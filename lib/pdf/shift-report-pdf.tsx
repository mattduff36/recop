import React from 'react';
import { Document, Image as PdfImage, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { formatDate } from '@/lib/utils/date';
import type { ShiftReport, ShiftReportActivityRow } from '@/types/daily-reports';

interface ShiftReportPDFProps {
  report: ShiftReport;
  employeeName?: string | null;
  approvedByName?: string | null;
  logoSrc?: string | null;
}

const minimumActivityRows = 22;
const colours = {
  border: '#111111',
  label: '#232B3A',
  subLabel: '#8795AF',
  value: '#ECEFF9',
  stripeA: '#EEF1FB',
  stripeB: '#DDE3F4',
  duration: '#D1D3D8',
  title: '#4B5563',
  white: '#FFFFFF',
};

const shiftReportStyles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingHorizontal: 18,
    paddingBottom: 20,
    fontFamily: 'Helvetica',
    fontSize: 7.3,
    color: '#394150',
  },
  masthead: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logoSlot: {
    width: 180,
    paddingTop: 2,
    paddingLeft: 10,
  },
  logo: {
    width: 110,
    height: 44,
    objectFit: 'contain',
  },
  fallbackLogo: {
    width: 46,
    height: 46,
    borderWidth: 1,
    borderColor: colours.label,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackLogoText: {
    color: colours.label,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  titleSlot: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 21,
  },
  title: {
    color: colours.title,
    fontSize: 19,
    fontWeight: 'bold',
    letterSpacing: 1.4,
    textDecoration: 'underline',
  },
  rightSpacer: {
    width: 180,
  },
  meta: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: colours.border,
  },
  metaRow: {
    flexDirection: 'row',
    minHeight: 31,
  },
  labelCell: {
    backgroundColor: colours.label,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colours.border,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  subLabelCell: {
    backgroundColor: colours.subLabel,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colours.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  valueCell: {
    backgroundColor: colours.value,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colours.border,
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  labelText: {
    color: colours.white,
    fontSize: 5.8,
    fontWeight: 'bold',
    textAlign: 'right',
    textTransform: 'uppercase',
  },
  subLabelText: {
    color: colours.white,
    fontSize: 5.7,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  valueText: {
    color: '#465064',
    fontSize: 7.4,
  },
  activityTable: {
    marginTop: 7,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#A5A5A5',
  },
  activityHeader: {
    flexDirection: 'row',
    minHeight: 33,
  },
  activityHeaderDescription: {
    width: '91%',
    backgroundColor: '#333C50',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#A5A5A5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityHeaderDuration: {
    width: '9%',
    backgroundColor: colours.white,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#A5A5A5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  activityHeaderText: {
    fontSize: 5.7,
    fontWeight: 'bold',
    color: colours.white,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  activityHeaderDurationText: {
    fontSize: 5.4,
    fontWeight: 'bold',
    color: colours.border,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  activityRow: {
    flexDirection: 'row',
    minHeight: 23,
  },
  activityDescriptionCell: {
    width: '91%',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#A5A5A5',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  activityDurationCell: {
    width: '9%',
    backgroundColor: colours.duration,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#A5A5A5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  activityText: {
    fontSize: 7.1,
    lineHeight: 1.17,
  },
  durationText: {
    fontSize: 7.1,
    textAlign: 'center',
  },
});

function valueOrBlank(value?: string | number | null): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function timeValue(value?: string | null): string {
  return value ? value.slice(0, 5) : '';
}

function formatDurationHours(value?: number | string | null): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';

  const totalMinutes = Math.round(parsed * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours && minutes) return `${hours}hr ${minutes}min`;
  if (hours) return `${hours}hr`;
  return `${minutes}min`;
}

function getDisplayRows(rows?: ShiftReportActivityRow[]): ShiftReportActivityRow[] {
  const displayRows = [...(rows || [])];
  while (displayRows.length < minimumActivityRows) {
    displayRows.push({
      display_order: displayRows.length,
      activity_description: '',
      duration_hours: null,
    });
  }

  return displayRows;
}

function MetaPair({ label, value, labelWidth, valueWidth }: { label: string; value?: string | number | null; labelWidth: string; valueWidth: string }) {
  return (
    <>
      <View style={[shiftReportStyles.labelCell, { width: labelWidth }]}>
        <Text style={shiftReportStyles.labelText}>{label}</Text>
      </View>
      <View style={[shiftReportStyles.valueCell, { width: valueWidth }]}>
        <Text style={shiftReportStyles.valueText}>{valueOrBlank(value)}</Text>
      </View>
    </>
  );
}

function TimePair({ label, value, labelWidth, valueWidth }: { label: string; value?: string | null; labelWidth: string; valueWidth: string }) {
  return (
    <>
      <View style={[shiftReportStyles.subLabelCell, { width: labelWidth }]}>
        <Text style={shiftReportStyles.subLabelText}>{label}</Text>
      </View>
      <View style={[shiftReportStyles.valueCell, { width: valueWidth }]}>
        <Text style={shiftReportStyles.valueText}>{timeValue(value)}</Text>
      </View>
    </>
  );
}

export function ShiftReportPDF({ report, employeeName, approvedByName, logoSrc = null }: ShiftReportPDFProps) {
  void employeeName;
  void approvedByName;
  const rows = getDisplayRows(report.activity_rows);

  return (
    <Document>
      <Page size="A4" style={shiftReportStyles.page}>
        <View style={shiftReportStyles.masthead}>
          <View style={shiftReportStyles.logoSlot}>
            {logoSrc ? (
              <PdfImage src={logoSrc} style={shiftReportStyles.logo} />
            ) : (
              <View style={shiftReportStyles.fallbackLogo}>
                <Text style={shiftReportStyles.fallbackLogoText}>RES</Text>
              </View>
            )}
          </View>
          <View style={shiftReportStyles.titleSlot}>
            <Text style={shiftReportStyles.title}>SHIFT REPORT</Text>
          </View>
          <View style={shiftReportStyles.rightSpacer} />
        </View>

        <View style={shiftReportStyles.meta}>
          <View style={shiftReportStyles.metaRow}>
            <MetaPair label="Day:" value={report.day_label} labelWidth="16%" valueWidth="17%" />
            <MetaPair label="Job No:" value={report.job_no} labelWidth="9%" valueWidth="24%" />
            <MetaPair label="Site:" value={report.site} labelWidth="17%" valueWidth="17%" />
          </View>
          <View style={shiftReportStyles.metaRow}>
            <MetaPair label="Date:" value={formatDate(report.report_date)} labelWidth="16%" valueWidth="17%" />
            <MetaPair label="Mileage" value={report.mileage} labelWidth="9%" valueWidth="24%" />
            <MetaPair label="Van Registration:" value={report.van_registration} labelWidth="17%" valueWidth="17%" />
          </View>
          <View style={shiftReportStyles.metaRow}>
            <View style={[shiftReportStyles.labelCell, { width: '16%' }]}>
              <Text style={shiftReportStyles.labelText}>Total Time Including{'\n'}Travel</Text>
            </View>
            <TimePair label="Start Time:" value={report.travel_start_time} labelWidth="8%" valueWidth="8.5%" />
            <TimePair label="Finish Time:" value={report.travel_finish_time} labelWidth="8.5%" valueWidth="8%" />
            <View style={[shiftReportStyles.labelCell, { width: '16%' }]}>
              <Text style={shiftReportStyles.labelText}>On Site Time</Text>
            </View>
            <TimePair label="Start Time:" value={report.site_start_time} labelWidth="8%" valueWidth="9%" />
            <TimePair label="Finish Time:" value={report.site_finish_time} labelWidth="9%" valueWidth="9%" />
          </View>
        </View>

        <View style={shiftReportStyles.activityTable}>
          <View style={shiftReportStyles.activityHeader}>
            <View style={shiftReportStyles.activityHeaderDescription}>
              <Text style={shiftReportStyles.activityHeaderText}>Activity & Description of Works</Text>
            </View>
            <View style={shiftReportStyles.activityHeaderDuration}>
              <Text style={shiftReportStyles.activityHeaderDurationText}>Duration{'\n'}(Hrs)</Text>
            </View>
          </View>
          {rows.map((row, index) => (
            <View key={row.id || index} style={shiftReportStyles.activityRow}>
              <View style={[shiftReportStyles.activityDescriptionCell, { backgroundColor: index % 2 === 0 ? colours.stripeA : colours.stripeB }]}>
                <Text style={shiftReportStyles.activityText}>{row.activity_description || ''}</Text>
              </View>
              <View style={shiftReportStyles.activityDurationCell}>
                <Text style={shiftReportStyles.durationText}>{formatDurationHours(row.duration_hours)}</Text>
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
