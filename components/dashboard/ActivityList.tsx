import React from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { LucideIcon, CheckCircle2, AlertCircle, Bookmark, Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'warning' | 'info' | 'error';
  icon: LucideIcon;
  href?: string; // Ruta de navegación opcional al hacer clic en el item
}

interface ActivityListProps {
  activities: ActivityItem[];
  className?: string;
  viewAllHref?: string; // Ruta del botón "Ver todo"
}

const statusColors = {
  success: 'bg-green-100 text-green-600',
  warning: 'bg-amber-100 text-amber-600',
  info: 'bg-blue-100 text-blue-600',
  error: 'bg-red-100 text-red-600',
};

export function ActivityList({ activities, className, viewAllHref = '/dashboard/certificates' }: ActivityListProps) {
  const router = useRouter();

  return (
    <Card className={cn("overflow-hidden border-none shadow-sm rounded-3xl", className)}>
      <div className="divide-y divide-gray-50">
        {activities.map((activity) => {
          const Icon = activity.icon;
          const isClickable = !!activity.href;
          return (
            <div
              key={activity.id}
              className={cn(
                "p-5 flex items-start gap-4 transition-colors",
                isClickable
                  ? "hover:bg-gray-50 cursor-pointer active:bg-gray-100"
                  : "hover:bg-gray-50/50"
              )}
              onClick={() => activity.href && router.push(activity.href)}
            >
              <div className={cn(
                "p-2.5 rounded-full shrink-0",
                statusColors[activity.type] || statusColors.info
              )}>
                <Icon size={20} />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={cn(
                  "text-sm font-bold text-primary truncate",
                  isClickable && "group-hover:underline"
                )}>
                  {activity.title}
                </h4>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {activity.description}
                </p>
              </div>
              
              <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap pt-1">
                {activity.time}
              </span>
            </div>
          );
        })}
      </div>
      
      <div className="p-4 bg-gray-50/50 text-center border-t border-gray-50">
        <button
          onClick={() => router.push(viewAllHref)}
          className="text-[var(--color-accent)] text-xs font-bold uppercase tracking-wider hover:underline"
        >
          Ver todo
        </button>
      </div>
    </Card>
  );
}
