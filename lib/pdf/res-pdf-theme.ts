import { demoBranchConfig } from '@/lib/config/demo-branch-config';
import { templateConfig } from '@/lib/config/template-config';

const RES_SUBMISSION_NUMBER = 5;
const RES_COMPANY_NAME = 'Railway Electrical Services';
const RES_LOGO_PATH = '/demo-personalisation/submission-5/railway-electrical-services-logo-small.png';

export const resPdfColors = {
  navy: '#00245D',
  navyDark: '#06152F',
  black: '#111111',
  white: '#FFFFFF',
  paper: '#FFFFFF',
  grey: '#6B7280',
  lightGrey: '#E5E7EB',
  paleGrey: '#F4F6F8',
  success: '#166534',
  danger: '#B91C1C',
};

export function isResPdfThemeEnabled(): boolean {
  return (
    demoBranchConfig.enabled &&
    demoBranchConfig.submissionNumber === RES_SUBMISSION_NUMBER &&
    demoBranchConfig.companyName === RES_COMPANY_NAME
  );
}

export function getPdfReadableAccentColor(): string {
  const configured = templateConfig.branding.brandColor.trim().toLowerCase();
  if (!configured || configured === '#fff' || configured === '#ffffff' || configured === 'white') {
    return resPdfColors.navy;
  }

  return templateConfig.branding.brandColor;
}

export function getPreferredPdfLogoPath(): string {
  return isResPdfThemeEnabled() ? RES_LOGO_PATH : templateConfig.branding.logoPath;
}

export function getPdfCompanyDisplayName(): string {
  return templateConfig.branding.companyName || RES_COMPANY_NAME;
}

export function getPdfFormCode(documentCode: string): string {
  return isResPdfThemeEnabled() ? `${documentCode} DATE: 07/25` : documentCode;
}
