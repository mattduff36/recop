import React from 'react';
import { Image as PdfImage, StyleSheet, Text, View } from '@react-pdf/renderer';
import { resPdfColors } from '@/lib/pdf/res-pdf-theme';

export const dailyReportPdfStyles = StyleSheet.create({
  page: {
    padding: 22,
    paddingBottom: 38,
    fontSize: 7,
    fontFamily: 'Helvetica',
    color: resPdfColors.black,
  },
  sectionSpacing: {
    marginTop: 7,
  },
  boxedText: {
    borderWidth: 1,
    borderColor: resPdfColors.black,
    minHeight: 48,
    padding: 5,
    fontSize: 7,
    lineHeight: 1.25,
  },
  table: {
    borderWidth: 1,
    borderColor: resPdfColors.black,
  },
  tableRow: {
    flexDirection: 'row',
    minHeight: 22,
    borderBottomWidth: 1,
    borderBottomColor: resPdfColors.black,
  },
  tableRowLast: {
    flexDirection: 'row',
    minHeight: 22,
  },
  tableHeader: {
    backgroundColor: resPdfColors.navy,
  },
  cell: {
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: resPdfColors.black,
    justifyContent: 'center',
  },
  cellLast: {
    padding: 3,
    justifyContent: 'center',
  },
  headerText: {
    color: resPdfColors.white,
    fontSize: 6.2,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  cellText: {
    fontSize: 6.5,
    lineHeight: 1.2,
  },
  signatureRow: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: resPdfColors.black,
    flexDirection: 'row',
  },
  signatureCell: {
    flex: 1,
    minHeight: 44,
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: resPdfColors.black,
  },
  signatureCellLast: {
    flex: 1,
    minHeight: 44,
    padding: 5,
  },
  signatureLabel: {
    fontSize: 6.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  signatureValue: {
    fontSize: 7,
    lineHeight: 1.2,
  },
  signatureImage: {
    width: 120,
    height: 28,
    objectFit: 'contain',
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 8,
  },
  flexColumn: {
    flex: 1,
  },
});

export interface PdfColumn<T> {
  label: string;
  width: number | string;
  render: (row: T) => string | number | null | undefined;
}

export function valueOrDash(value?: string | number | null): string {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

export function formatHours(value?: number | string | null): string {
  const parsed = Number(value || 0);
  return parsed ? parsed.toFixed(2) : '';
}

export function formatBoolean(value?: boolean | null): string {
  return value ? 'Y' : '';
}

export function PdfTable<T>({ columns, rows, minRows = 3 }: { columns: PdfColumn<T>[]; rows: T[]; minRows?: number }) {
  const displayRows = [...rows];
  while (displayRows.length < minRows) {
    displayRows.push({} as T);
  }

  return (
    <View style={dailyReportPdfStyles.table}>
      <View style={[dailyReportPdfStyles.tableRow, dailyReportPdfStyles.tableHeader]}>
        {columns.map((column, index) => (
          <View
            key={column.label}
            style={[index === columns.length - 1 ? dailyReportPdfStyles.cellLast : dailyReportPdfStyles.cell, { width: column.width }]}
          >
            <Text style={dailyReportPdfStyles.headerText}>{column.label}</Text>
          </View>
        ))}
      </View>
      {displayRows.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={rowIndex === displayRows.length - 1 ? dailyReportPdfStyles.tableRowLast : dailyReportPdfStyles.tableRow}
        >
          {columns.map((column, columnIndex) => (
            <View
              key={`${rowIndex}-${column.label}`}
              style={[columnIndex === columns.length - 1 ? dailyReportPdfStyles.cellLast : dailyReportPdfStyles.cell, { width: column.width }]}
            >
              <Text style={dailyReportPdfStyles.cellText}>{valueOrDash(column.render(row))}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function SignatureSummary({
  completedBy,
  signatureData,
  approvedBy,
  comments,
}: {
  completedBy?: string | null;
  signatureData?: string | null;
  approvedBy?: string | null;
  comments?: string | null;
}) {
  return (
    <View style={dailyReportPdfStyles.signatureRow}>
      <View style={dailyReportPdfStyles.signatureCell}>
        <Text style={dailyReportPdfStyles.signatureLabel}>Completed By:</Text>
        <Text style={dailyReportPdfStyles.signatureValue}>{completedBy || '-'}</Text>
      </View>
      <View style={dailyReportPdfStyles.signatureCell}>
        <Text style={dailyReportPdfStyles.signatureLabel}>Signature:</Text>
        {signatureData ? <PdfImage src={signatureData} style={dailyReportPdfStyles.signatureImage} /> : <Text style={dailyReportPdfStyles.signatureValue}>-</Text>}
      </View>
      <View style={dailyReportPdfStyles.signatureCell}>
        <Text style={dailyReportPdfStyles.signatureLabel}>Approved By:</Text>
        <Text style={dailyReportPdfStyles.signatureValue}>{approvedBy || '-'}</Text>
      </View>
      <View style={dailyReportPdfStyles.signatureCellLast}>
        <Text style={dailyReportPdfStyles.signatureLabel}>Comments:</Text>
        <Text style={dailyReportPdfStyles.signatureValue}>{comments || '-'}</Text>
      </View>
    </View>
  );
}
