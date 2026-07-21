'use client';
import { useOtecProfile } from './profile/hooks';

export function useActiveOtecProfileContext() {
  const query = useOtecProfile();
  const profile = query.data?.profile;
  return {
    profileId: profile?.registrationStatus === 'ACTIVE' ? profile.id : null,
    profileState: !profile ? 'missing' : profile.registrationStatus === 'ACTIVE' ? 'active' : 'inactive',
    query,
  } as const;
}
