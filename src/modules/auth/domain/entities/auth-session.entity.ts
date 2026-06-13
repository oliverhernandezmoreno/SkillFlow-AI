export interface AuthSessionProps {
  accessToken: string;
  refreshToken: string;
  userId: string;
  organizationId: string;
}

export class AuthSession {
  constructor(private readonly props: AuthSessionProps) {}

  toPrimitives(): AuthSessionProps {
    return { ...this.props };
  }
}
