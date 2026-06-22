import React from 'react';
import { Image as PdfImage, StyleSheet, Text, View } from '@react-pdf/renderer';
import { templateConfig } from '@/lib/config/template-config';
import { getPdfContactLine, getPdfRegisteredOfficeLine } from '@/lib/pdf/branding';
import { getPdfCompanyDisplayName, getPdfFormCode, resPdfColors } from '@/lib/pdf/res-pdf-theme';

const sharedStyles = StyleSheet.create({
  header: {
    borderWidth: 1,
    borderColor: resPdfColors.black,
    marginBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    minHeight: 54,
    borderBottomWidth: 1,
    borderBottomColor: resPdfColors.black,
  },
  logoCell: {
    width: 82,
    borderRightWidth: 1,
    borderRightColor: resPdfColors.black,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  logo: {
    width: 58,
    height: 34,
    objectFit: 'contain',
  },
  titleCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: resPdfColors.black,
    letterSpacing: 0.5,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  subtitle: {
    marginTop: 3,
    fontSize: 7.5,
    color: resPdfColors.grey,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  codeCell: {
    width: 92,
    borderLeftWidth: 1,
    borderLeftColor: resPdfColors.black,
    padding: 5,
    justifyContent: 'space-between',
  },
  codeText: {
    fontSize: 7,
    color: resPdfColors.black,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  companyText: {
    fontSize: 6.5,
    color: resPdfColors.grey,
    textAlign: 'right',
    lineHeight: 1.2,
  },
  detailStrip: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: resPdfColors.paleGrey,
  },
  detailText: {
    fontSize: 6.5,
    color: resPdfColors.grey,
    textAlign: 'center',
    lineHeight: 1.25,
  },
  metaGrid: {
    borderWidth: 1,
    borderColor: resPdfColors.black,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    minHeight: 24,
    borderBottomWidth: 1,
    borderBottomColor: resPdfColors.black,
  },
  metaRowLast: {
    flexDirection: 'row',
    minHeight: 24,
  },
  metaCell: {
    flex: 1,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: resPdfColors.black,
  },
  metaCellLast: {
    flex: 1,
    padding: 4,
  },
  metaLabel: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: resPdfColors.black,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 8,
    color: resPdfColors.black,
    lineHeight: 1.25,
  },
  sectionTitle: {
    borderWidth: 1,
    borderColor: resPdfColors.black,
    backgroundColor: resPdfColors.navy,
    color: resPdfColors.white,
    fontSize: 8,
    fontWeight: 'bold',
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginTop: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  signatureGrid: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: resPdfColors.black,
    marginTop: 8,
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
    fontSize: 7,
    fontWeight: 'bold',
    color: resPdfColors.black,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  signatureValue: {
    fontSize: 8,
    color: resPdfColors.black,
    lineHeight: 1.25,
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 24,
    right: 24,
    borderTopWidth: 1,
    borderTopColor: resPdfColors.black,
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 6.5,
    color: resPdfColors.grey,
  },
});

export interface ResPdfMetaItem {
  label: string;
  value?: string | number | null;
}

export function ResPdfHeader({
  title,
  subtitle,
  formCode,
  logoSrc,
}: {
  title: string;
  subtitle?: string;
  formCode: string;
  logoSrc?: string | null;
}) {
  return (
    <View style={sharedStyles.header}>
      <View style={sharedStyles.headerTop}>
        <View style={sharedStyles.logoCell}>
          {logoSrc ? (
            <PdfImage src={logoSrc} style={sharedStyles.logo} />
          ) : (
            <Text style={[sharedStyles.title, { fontSize: 12 }]}>RES</Text>
          )}
        </View>
        <View style={sharedStyles.titleCell}>
          <Text style={sharedStyles.title}>{title}</Text>
          {subtitle ? <Text style={sharedStyles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={sharedStyles.codeCell}>
          <Text style={sharedStyles.codeText}>{getPdfFormCode(formCode)}</Text>
          <Text style={sharedStyles.companyText}>{getPdfCompanyDisplayName()}</Text>
        </View>
      </View>
      <View style={sharedStyles.detailStrip}>
        <Text style={sharedStyles.detailText}>
          {getPdfRegisteredOfficeLine()}  |  {getPdfContactLine()}  |  {templateConfig.branding.appName}
        </Text>
      </View>
    </View>
  );
}

export function ResPdfMetaGrid({ items, columns = 3 }: { items: ResPdfMetaItem[]; columns?: 2 | 3 | 4 }) {
  const rows: ResPdfMetaItem[][] = [];
  for (let index = 0; index < items.length; index += columns) {
    rows.push(items.slice(index, index + columns));
  }

  return (
    <View style={sharedStyles.metaGrid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={rowIndex === rows.length - 1 ? sharedStyles.metaRowLast : sharedStyles.metaRow}>
          {Array.from({ length: columns }, (_, columnIndex) => {
            const item = row[columnIndex];
            return (
              <View
                key={`${rowIndex}-${columnIndex}`}
                style={columnIndex === columns - 1 ? sharedStyles.metaCellLast : sharedStyles.metaCell}
              >
                {item ? (
                  <>
                    <Text style={sharedStyles.metaLabel}>{item.label}</Text>
                    <Text style={sharedStyles.metaValue}>{item.value || '-'}</Text>
                  </>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function ResPdfSectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={sharedStyles.sectionTitle}>{children}</Text>;
}

export function ResPdfSignatureGrid({
  completedBy,
  approvedBy,
  comments,
}: {
  completedBy?: string | null;
  approvedBy?: string | null;
  comments?: string | null;
}) {
  return (
    <View style={sharedStyles.signatureGrid}>
      <View style={sharedStyles.signatureCell}>
        <Text style={sharedStyles.signatureLabel}>Completed By:</Text>
        <Text style={sharedStyles.signatureValue}>{completedBy || '-'}</Text>
      </View>
      <View style={sharedStyles.signatureCell}>
        <Text style={sharedStyles.signatureLabel}>Approved By:</Text>
        <Text style={sharedStyles.signatureValue}>{approvedBy || '-'}</Text>
      </View>
      <View style={sharedStyles.signatureCellLast}>
        <Text style={sharedStyles.signatureLabel}>Comments:</Text>
        <Text style={sharedStyles.signatureValue}>{comments || '-'}</Text>
      </View>
    </View>
  );
}

export function ResPdfFooter({ formCode }: { formCode: string }) {
  return (
    <View style={sharedStyles.footer} fixed>
      <Text style={sharedStyles.footerText}>{getPdfFormCode(formCode)}</Text>
      <Text style={sharedStyles.footerText}>{getPdfCompanyDisplayName()} | Demonstration export</Text>
    </View>
  );
}
