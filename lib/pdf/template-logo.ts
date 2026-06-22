import { readFile } from 'fs/promises';
import { extname } from 'path';
import { resolve } from 'path';
import { templateConfig } from '@/lib/config/template-config';
import { getPreferredPdfLogoPath } from '@/lib/pdf/res-pdf-theme';

interface LoadTemplateLogoOptions {
  preferPdfLogo?: boolean;
}

export async function loadTemplateLogoDataUrl(options: LoadTemplateLogoOptions = {}): Promise<string | null> {
  try {
    const publicLogoPath = options.preferPdfLogo ? getPreferredPdfLogoPath() : templateConfig.branding.logoPath;
    const configuredLogoPath = resolve(process.cwd(), 'public', publicLogoPath.replace(/^\//, ''));
    const configuredExtension = extname(configuredLogoPath).toLowerCase();
    const logoPath = configuredExtension === '.svg' ? configuredLogoPath.replace(/\.svg$/i, '.png') : configuredLogoPath;
    const logoBuffer = await readFile(logoPath);
    const logoExtension = extname(logoPath).toLowerCase();
    const mimeType = logoExtension === '.jpg' || logoExtension === '.jpeg' ? 'image/jpeg' : 'image/png';
    return `data:${mimeType};base64,${logoBuffer.toString('base64')}`;
  } catch {
    return null;
  }
}
