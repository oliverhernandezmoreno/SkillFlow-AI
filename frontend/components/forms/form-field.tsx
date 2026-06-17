import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ label, htmlFor, error, children }: Readonly<FormFieldProps>) {
  const errorId = `${htmlFor}-error`;

  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p id={errorId} className={cn('text-sm text-destructive')} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
