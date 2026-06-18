import type { Metadata } from 'next';

import { QueryProvider } from '@/components/layout/query-provider';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { ToastProvider } from '@/components/feedback/toast-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'SkillFlow AI',
  description: 'La plataforma inteligente para gestionar capacitación, cumplimiento y talento.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CL" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <QueryProvider>{children}</QueryProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
