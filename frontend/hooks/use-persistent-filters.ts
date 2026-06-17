'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

type FilterValue = string | number | undefined;
type Filters = Record<string, FilterValue>;

export function usePersistentFilters<TFilters extends Filters>(storageKey: string, defaults: TFilters) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [localFallback] = useState<TFilters>(() => {
    if (typeof window === 'undefined') {
      return defaults;
    }

    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return defaults;
    }

    return { ...defaults, ...(JSON.parse(stored) as Partial<TFilters>) };
  });

  const filters = useMemo(() => {
    const hasQuery = Array.from(searchParams.keys()).length > 0;
    const source = hasQuery ? defaults : localFallback;
    const next = { ...source };
    Object.keys(defaults).forEach((key) => {
      const value = searchParams.get(key);
      if (value !== null) {
        next[key as keyof TFilters] = coerceValue(value, defaults[key]) as TFilters[keyof TFilters];
      }
    });
    return next as TFilters;
  }, [defaults, localFallback, searchParams]);

  function setFilters(patch: Partial<TFilters>) {
    const next = { ...filters, ...patch };
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === defaults[key]) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    window.localStorage.setItem(storageKey, JSON.stringify(next));
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
  }

  return [filters, setFilters] as const;
}

function coerceValue(value: string, defaultValue: FilterValue) {
  if (typeof defaultValue === 'number') {
    return Number(value);
  }
  return value;
}
