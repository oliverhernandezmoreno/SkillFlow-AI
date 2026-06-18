'use client';

import { Building2, KeyRound, Settings, ShieldCheck } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { ResourcePage } from '@/components/layout/resource-page';

export default function SettingsPage() {
  return (
    <AppShell>
      <ResourcePage
        title="Configuración"
        description="Gestiona preferencias de la organización, autenticación y configuración de plataforma."
        actionLabel="Actualizar configuración"
        icon={Settings}
        rows={[
          { name: 'Perfil de organización', area: 'Workspace', metric: 'Minera Andes Capacitación', status: 'ACTIVE' },
          { name: 'Política de autenticación', area: 'Seguridad', metric: 'JWT habilitado', status: 'ACTIVE' },
          { name: 'Configuración de cumplimiento', area: 'SENCE', metric: 'Modo demo', status: 'READY' },
        ]}
        emptyDescription="Configura la organización después de conectar el backend productivo."
        stats={[
          { title: 'Workspace', value: '1', change: 'Demo activa', tone: 'indigo', icon: Building2 },
          { title: 'Políticas RBAC', value: '42', change: 'Permisos mapeados', tone: 'emerald', icon: ShieldCheck },
          { title: 'Flujos de token', value: '2', change: 'Acceso y refresh', tone: 'cyan', icon: KeyRound },
        ]}
      />
    </AppShell>
  );
}
