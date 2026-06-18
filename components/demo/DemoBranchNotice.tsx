import { Info } from 'lucide-react';
import { demoBranchConfig } from '@/lib/config/demo-branch-config';
import { cn } from '@/lib/utils';

interface DemoBranchNoticeProps {
  className?: string;
  compact?: boolean;
  centered?: boolean;
}

export const demoSharedDataNoticeText =
  'This demo uses shared sample data. Feel free to add your own data, but be aware everything added may be visible on other DigiDocs demo sites.';

export function DemoBranchNotice({ className, compact = false, centered = false }: DemoBranchNoticeProps) {
  if (!demoBranchConfig.enabled || !demoBranchConfig.companyName) {
    return null;
  }

  return (
    <div
      role="note"
      className={cn(
        'rounded-xl border border-brand-yellow/30 bg-brand-yellow/10 text-brand-yellow shadow-lg shadow-brand-yellow/5 backdrop-blur-sm',
        compact ? 'px-4 py-3 text-sm' : 'px-4 py-3 sm:px-5',
        className
      )}
    >
      <div className={cn('space-y-1 text-left', centered && 'text-center')}>
        <p className={cn('font-semibold text-white', compact ? 'text-sm' : 'text-sm sm:text-base')}>
          Personalised demo preview for {demoBranchConfig.companyName}
        </p>
        <div className={cn('flex items-start gap-2 text-left', centered && 'justify-center')}>
          <Info className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
          <p className={cn('text-brand-yellow/90', compact ? 'text-xs leading-5' : 'text-xs leading-5 sm:text-sm')}>
            {demoSharedDataNoticeText}
          </p>
        </div>
      </div>
    </div>
  );
}
