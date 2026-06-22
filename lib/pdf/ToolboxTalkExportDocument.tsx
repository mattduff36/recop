import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image as PdfImage } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { templateConfig } from '@/lib/config/template-config';
import { resPdfColors } from '@/lib/pdf/res-pdf-theme';

const styles = StyleSheet.create({
  page: {
    padding: 32,
    paddingBottom: 46,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    border: `1pt solid ${resPdfColors.black}`,
    padding: 10,
  },
  logo: {
    width: 92,
    height: 46,
    objectFit: 'contain',
  },
  headerText: {
    flex: 1,
    marginLeft: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: resPdfColors.black,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: resPdfColors.grey,
    marginBottom: 3,
  },
  section: {
    marginTop: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    backgroundColor: resPdfColors.navy,
    padding: 8,
    border: `1pt solid ${resPdfColors.black}`,
    color: '#ffffff',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
    width: 120,
    color: resPdfColors.black,
  },
  value: {
    flex: 1,
    color: resPdfColors.black,
  },
  messageBody: {
    padding: 10,
    backgroundColor: resPdfColors.paleGrey,
    border: `1pt solid ${resPdfColors.black}`,
    marginTop: 10,
    color: resPdfColors.black,
    lineHeight: 1.5,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: resPdfColors.paleGrey,
    border: `1pt solid ${resPdfColors.black}`,
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: resPdfColors.navy,
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 9,
    color: resPdfColors.black,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: resPdfColors.navy,
    padding: 8,
    fontWeight: 'bold',
    borderBottom: `1pt solid ${resPdfColors.black}`,
    color: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: `0.5pt solid ${resPdfColors.black}`,
  },
  tableCell: {
    flex: 1,
    color: resPdfColors.black,
  },
  tableCellName: {
    flex: 2,
    color: resPdfColors.black,
  },
  signatureBox: {
    marginTop: 10,
    padding: 10,
    border: `1pt solid ${resPdfColors.black}`,
    backgroundColor: resPdfColors.white,
    breakInside: 'avoid',
  },
  signatureImage: {
    width: 200,
    height: 60,
    objectFit: 'contain',
    marginTop: 5,
  },
  signatureContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 15,
  },
  signatureLeftColumn: {
    flex: 1,
  },
  signatureRightColumn: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: resPdfColors.grey,
    fontSize: 8,
    borderTop: `1pt solid ${resPdfColors.black}`,
    paddingTop: 10,
  },
  pdfNote: {
    marginTop: 10,
    padding: 10,
    backgroundColor: resPdfColors.paleGrey,
    border: `1pt solid ${resPdfColors.black}`,
  },
  pdfNoteText: {
    fontSize: 9,
    color: resPdfColors.grey,
    fontStyle: 'italic',
  },
});

interface ToolboxTalkExportDocumentProps {
  message: {
    id: string;
    subject: string;
    body: string;
    created_at: string;
    sender_name: string;
    pdf_file_path: string | null;
  };
  recipients: Array<{
    id: string;
    status: 'PENDING' | 'SIGNED';
    signed_at: string | null;
    signature_data: string | null;
    user: {
      full_name: string;
      role: string;
      employee_id: string | null;
    } | null;
  }>;
  logoUrl: string;
}

export function ToolboxTalkExportDocument({
  message,
  recipients,
  logoUrl,
}: ToolboxTalkExportDocumentProps) {
  const signedRecipients = recipients.filter(r => r.status === 'SIGNED');
  const pendingRecipients = recipients.filter(r => r.status === 'PENDING');
  const totalSigned = signedRecipients.length;
  const totalPending = pendingRecipients.length;
  const complianceRate =
    recipients.length > 0 ? Math.round((totalSigned / recipients.length) * 100) : 0;

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <PdfImage src={logoUrl} style={styles.logo} />
          <View style={styles.headerText}>
            <Text style={styles.title}>{message.subject}</Text>
            <Text style={styles.subtitle}>Toolbox Talk - Signature Record</Text>
            <Text style={styles.subtitle}>
              Exported on {format(new Date(), 'PPP')} at {format(new Date(), 'p')}
            </Text>
          </View>
        </View>

        {/* Message Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Subject:</Text>
            <Text style={styles.value}>{message.subject}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Sent By:</Text>
            <Text style={styles.value}>{message.sender_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Sent Date:</Text>
            <Text style={styles.value}>
              {format(new Date(message.created_at), 'PPP')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Sent Time:</Text>
            <Text style={styles.value}>
              {format(new Date(message.created_at), 'p')}
            </Text>
          </View>
          
          {message.pdf_file_path && (
            <View style={styles.pdfNote}>
              <Text style={styles.pdfNoteText}>
                📎 A PDF document was attached to this toolbox talk message
              </Text>
            </View>
          )}
        </View>

        {/* Compliance Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compliance Summary</Text>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{recipients.length}</Text>
              <Text style={styles.statLabel}>Total Assigned</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#22c55e' }]}>{totalSigned}</Text>
              <Text style={styles.statLabel}>Signed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#ef4444' }]}>{totalPending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{complianceRate}%</Text>
              <Text style={styles.statLabel}>Compliance Rate</Text>
            </View>
          </View>
        </View>

        {/* Message Body */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message Content</Text>
          <View style={styles.messageBody}>
            <Text>{message.body}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>
            Generated by {templateConfig.branding.appName} • {format(new Date(), 'PPP')} • Confidential
          </Text>
        </View>
      </Page>

      {/* Signed Recipients */}
      {signedRecipients.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <PdfImage src={logoUrl} style={styles.logo} />
            <View style={styles.headerText}>
              <Text style={styles.title}>Signed Recipients</Text>
              <Text style={styles.subtitle}>{message.subject}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Employees Who Signed ({signedRecipients.length})
            </Text>

            {signedRecipients.map((recipient) => (
              <View key={recipient.id} style={styles.signatureBox} wrap={false}>
                {/* Two column layout: Info on left, Signature on right */}
                <View style={styles.signatureContentRow}>
                  {/* Left Column - Employee Info */}
                  <View style={styles.signatureLeftColumn}>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Name:</Text>
                      <Text style={styles.value}>
                        {recipient.user?.full_name || 'Deleted User'}
                      </Text>
                    </View>
                    {recipient.user?.employee_id && (
                      <View style={styles.infoRow}>
                        <Text style={styles.label}>Employee ID:</Text>
                        <Text style={styles.value}>{recipient.user.employee_id}</Text>
                      </View>
                    )}
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Role:</Text>
                      <Text style={styles.value}>{recipient.user?.role || '-'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Signed Date:</Text>
                      <Text style={styles.value}>
                        {recipient.signed_at
                          ? format(new Date(recipient.signed_at), 'PPP p')
                          : '-'}
                      </Text>
                    </View>
                  </View>

                  {/* Right Column - Signature */}
                  <View style={styles.signatureRightColumn}>
                    <Text style={{ ...styles.label, marginBottom: 5 }}>Signature:</Text>
                    {recipient.signature_data && (
                      <PdfImage
                        src={recipient.signature_data}
                        style={styles.signatureImage}
                      />
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Text>
              Generated by {templateConfig.branding.appName} • {format(new Date(), 'PPP')} • Confidential
            </Text>
          </View>
        </Page>
      )}

      {/* Pending Recipients */}
      {pendingRecipients.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <PdfImage src={logoUrl} style={styles.logo} />
            <View style={styles.headerText}>
              <Text style={styles.title}>Pending Signatures</Text>
              <Text style={styles.subtitle}>{message.subject}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Employees Awaiting Signature ({pendingRecipients.length})
            </Text>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCellName}>Name</Text>
                <Text style={styles.tableCell}>Employee ID</Text>
                <Text style={styles.tableCell}>Role</Text>
                <Text style={styles.tableCell}>Status</Text>
              </View>
              {pendingRecipients.map((recipient) => (
                <View key={recipient.id} style={styles.tableRow}>
                  <Text style={styles.tableCellName}>
                    {recipient.user?.full_name || 'Deleted User'}
                  </Text>
                  <Text style={styles.tableCell}>
                    {recipient.user?.employee_id || '-'}
                  </Text>
                  <Text style={styles.tableCell}>
                    {recipient.user?.role || '-'}
                  </Text>
                  <Text style={[styles.tableCell, { color: '#ef4444', fontWeight: 'bold' }]}>
                    PENDING
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.footer}>
            <Text>
              Generated by {templateConfig.branding.appName} • {format(new Date(), 'PPP')} • Confidential
            </Text>
          </View>
        </Page>
      )}
    </Document>
  );
}

