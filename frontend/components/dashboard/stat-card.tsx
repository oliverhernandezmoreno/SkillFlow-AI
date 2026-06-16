'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  tone: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate';
  icon: LucideIcon;
}

const toneClassMap = {
  indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300',
};

export function StatCard({ title, value, change, tone, icon: Icon }: Readonly<StatCardProps>) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-4 transition hover:-translate-y-0.5 hover:shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
          </div>
          <div className={cn('rounded-lg p-3', toneClassMap[tone])}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
        <p className="mt-4 text-xs font-medium text-muted-foreground">{change}</p>
      </Card>
    </motion.div>
  );
}
