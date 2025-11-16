import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {Icon && (
        <div className="mb-4 rounded-full bg-muted p-4">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-md">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-6">
          {action.icon && <action.icon className="mr-2 h-4 w-4" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface EmptyTableStateProps {
  colSpan?: number;
  message: string;
  icon?: LucideIcon;
}

export function EmptyTableState({ colSpan = 1, message, icon: Icon }: EmptyTableStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="h-24 text-center">
        <div className="flex flex-col items-center justify-center gap-2">
          {Icon && <Icon className="h-8 w-8 text-muted-foreground opacity-50" />}
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </td>
    </tr>
  );
}
