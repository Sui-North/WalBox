import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-6 p-6 rounded-full bg-primary/10 animate-float">
        <Icon className="h-16 w-16 text-primary" />
      </div>
      <h3 className="text-2xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        {description}
      </p>
      {action && (
        <Button 
          onClick={action.onClick}
          className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
