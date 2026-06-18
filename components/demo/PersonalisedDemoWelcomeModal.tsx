'use client';

import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { CheckCircle2, FileText, Gauge, Palette, Sparkles, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { demoBranchConfig } from '@/lib/config/demo-branch-config';
import { templateConfig } from '@/lib/config/template-config';

const SESSION_STORAGE_PREFIX = 'digidocs:personalised-demo-welcome';

interface DetailCard {
  label: string;
  value: string;
  icon: LucideIcon;
}

interface OperationalFitSummaryInput {
  industryLabel: string | null | undefined;
  operatingRegion: string | null | undefined;
  companySizeLabel: string | null | undefined;
  teamLabels: string[];
  assetLabels: string[];
}

const shortWorkflowLabels: Record<string, string> = {
  'Absence and holiday management': 'absence',
  'Fleet, maintenance, and servicing': 'fleet and maintenance',
  'Inventory, tools, and equipment': 'inventory and equipment',
  'Maps, DVLA/MOT, or fleet integrations': 'fleet integrations',
  'Projects, RAMS, and compliance documents': 'projects and RAMS',
  'Quotes and customer records': 'quotes and customers',
  'Reports and management visibility': 'reports',
  'Timesheets and approvals': 'timesheets and approvals',
  'Van, HGV, or plant daily checks': 'daily checks',
  'Workshop tasks and repairs': 'workshop tasks',
};

function getSessionStorageKey(): string {
  return [
    SESSION_STORAGE_PREFIX,
    demoBranchConfig.submissionNumber ?? 'unknown-submission',
    demoBranchConfig.branchName ?? demoBranchConfig.companyName ?? 'personalised-demo',
  ].join(':');
}

function getItems(value: string[] | undefined): string[] {
  return (value ?? []).map((item) => item.trim()).filter(Boolean);
}

function joinItems(items: string[], fallback: string): string {
  if (items.length === 0) {
    return fallback;
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function getPreviewList(items: string[], fallback: string, maxItems = 3, overflowSummary = fallback): string {
  if (items.length === 0) {
    return fallback;
  }

  if (items.length <= maxItems) {
    return joinItems(items, fallback);
  }

  return overflowSummary;
}

function getShortWorkflowLabel(label: string): string {
  return shortWorkflowLabels[label] ?? label;
}

function getWorkflowFocusSummary(items: string[]): string {
  if (items.length === 0) {
    return 'The dashboard keeps the standard demo workflows available.';
  }

  const labels = items.map(getShortWorkflowLabel);

  if (labels.length === 1) {
    return `Your dashboard leads with ${labels[0]}.`;
  }

  if (labels.length === 2) {
    return `Your dashboard leads with ${labels[0]} plus ${labels[1]}.`;
  }

  return `Your dashboard leads with ${labels.slice(0, 2).join(', ')}, and the other workflows you chose.`;
}

function lowerFirst(value: string): string {
  return value ? `${value.charAt(0).toLowerCase()}${value.slice(1)}` : value;
}

function getBusinessContext({
  industryLabel,
  operatingRegion,
  companySizeLabel,
}: Pick<OperationalFitSummaryInput, 'industryLabel' | 'operatingRegion' | 'companySizeLabel'>): string {
  const industry = industryLabel && industryLabel.toLowerCase() !== 'other' ? lowerFirst(industryLabel) : '';

  if (operatingRegion && industry) {
    return `your ${operatingRegion} ${industry} operation`;
  }

  if (industry) {
    return `your ${industry} operation`;
  }

  if (operatingRegion) {
    return `your ${operatingRegion} operation`;
  }

  if (companySizeLabel) {
    return `your ${lowerFirst(companySizeLabel)} team`;
  }

  return 'your operation';
}

function getSampleFocus({ teamLabels, assetLabels }: Pick<OperationalFitSummaryInput, 'teamLabels' | 'assetLabels'>): string {
  if (teamLabels.length > 0 && assetLabels.length > 0) {
    return 'teams and assets';
  }

  if (teamLabels.length > 0) {
    return 'teams';
  }

  if (assetLabels.length > 0) {
    return 'assets';
  }

  return '';
}

function getOperationalFitSummary(input: OperationalFitSummaryInput): string {
  const businessContext = getBusinessContext(input);
  const sampleFocus = getSampleFocus(input);

  if (!sampleFocus) {
    return `Built for ${businessContext}, using safe details from your questionnaire.`;
  }

  return `Built for ${businessContext}, with sample ${sampleFocus} shaped around your answers.`;
}

export function PersonalisedDemoWelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const welcomeConfig = demoBranchConfig.welcome;
  const branding = demoBranchConfig.branding;
  const isPersonalisedDemo = templateConfig.isDemoMode && demoBranchConfig.enabled && Boolean(branding);
  const sessionStorageKey = getSessionStorageKey();

  useEffect(() => {
    if (!isPersonalisedDemo) {
      return;
    }

    try {
      if (sessionStorage.getItem(sessionStorageKey) === 'acknowledged') {
        return;
      }
    } catch {
      // If sessionStorage is unavailable, still show the welcome once for this mounted page.
    }

    const timeoutId = window.setTimeout(() => setIsOpen(true), 0);
    return () => window.clearTimeout(timeoutId);
  }, [isPersonalisedDemo, sessionStorageKey]);

  if (!isPersonalisedDemo || !branding) {
    return null;
  }

  const companyDisplayName = welcomeConfig?.companyDisplayName || demoBranchConfig.companyName || branding.companyName;
  const priorityModuleLabels = getItems(welcomeConfig?.priorityModuleLabels);
  const painPointLabels = getItems(welcomeConfig?.painPointLabels);
  const teamLabels = getItems(welcomeConfig?.teamLabels);
  const assetLabels = getItems(welcomeConfig?.assetLabels);
  const documentOutputLabels = getItems(welcomeConfig?.documentOutputLabels);
  const workflowFocusSummary = getWorkflowFocusSummary(priorityModuleLabels);
  const operationalFitSummary = getOperationalFitSummary({
    industryLabel: welcomeConfig?.industryLabel,
    operatingRegion: welcomeConfig?.operatingRegion,
    companySizeLabel: welcomeConfig?.companySizeLabel,
    teamLabels,
    assetLabels,
  });
  const detailCards: DetailCard[] = [
    {
      label: 'Branding',
      value: `${branding.appName} uses your submitted logo, colours, app naming, and install-screen identity.`,
      icon: Palette,
    },
    {
      label: 'Workflow focus',
      value: workflowFocusSummary,
      icon: Gauge,
    },
    {
      label: 'Operational fit',
      value: operationalFitSummary,
      icon: CheckCircle2,
    },
    {
      label: 'Outputs',
      value: `${getPreviewList(documentOutputLabels, 'Key demo outputs', 3, 'Selected demo outputs')} are branded for ${branding.companyName}.`,
      icon: FileText,
    },
  ];

  function handleAcknowledge() {
    try {
      sessionStorage.setItem(sessionStorageKey, 'acknowledged');
    } catch {
      // Nothing to persist if the browser blocks sessionStorage.
    }

    setIsOpen(false);
  }

  return (
    <AlertDialogPrimitive.Root
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setIsOpen(true);
        }
      }}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-[200] bg-slate-950/75 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialogPrimitive.Content
          onEscapeKeyDown={(event) => event.preventDefault()}
          className="fixed left-1/2 top-1/2 z-[201] grid max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto rounded-2xl border border-brand-yellow/25 bg-slate-950 p-5 text-slate-100 shadow-2xl shadow-slate-950/70 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:p-7"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-yellow to-transparent" />
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-yellow p-2 shadow-lg shadow-brand-yellow/20">
              <Image
                src={branding.logoPath}
                alt={`${branding.companyName} logo`}
                width={44}
                height={44}
                unoptimized
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="min-w-0 space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-yellow">
                <Sparkles className="h-3.5 w-3.5" />
                Personalised demo
              </div>
              <AlertDialogPrimitive.Title className="text-balance text-2xl font-bold leading-tight text-white sm:text-3xl">
                Welcome to your personalised demo of {companyDisplayName}&apos;s DigiDocs
              </AlertDialogPrimitive.Title>
              <AlertDialogPrimitive.Description className="text-sm leading-6 text-slate-300 sm:text-base">
                We&apos;ve set this demo up for {branding.companyName}, using your branding and the workflows you care
                about. Everything inside is still fictional sample data.
              </AlertDialogPrimitive.Description>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {detailCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className="rounded-xl border border-border/60 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/20"
                >
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-yellow/25 bg-brand-yellow/10 text-brand-yellow">
                      <Icon className="h-4 w-4" />
                    </span>
                    {card.label}
                  </div>
                  <p className="text-sm leading-6 text-slate-300">{card.value}</p>
                </div>
              );
            })}
          </div>

          {painPointLabels.length > 0 ? (
            <div className="rounded-xl border border-brand-yellow/25 bg-brand-yellow/10 p-4 text-sm leading-6 text-brand-yellow/95">
              Built around what you told us matters most:{' '}
              {getPreviewList(painPointLabels, 'your selected demo goals', 3, 'the goals you picked')}.
            </div>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-400">
              No passwords or sensitive access details are shown here. Demo account credentials stay on the login flow only.
            </p>
            <AlertDialogPrimitive.Action asChild>
              <Button
                type="button"
                onClick={handleAcknowledge}
                className="h-11 min-w-28 bg-brand-yellow px-6 font-semibold text-slate-950 shadow-lg shadow-brand-yellow/20 hover:bg-brand-yellow-hover focus-visible:ring-brand-yellow/70 focus-visible:ring-offset-slate-950"
              >
                OK
              </Button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
