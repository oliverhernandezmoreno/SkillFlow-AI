export interface UserRoleProps {
  id: string;
  organizationId: string;
  userId: string;
  roleId: string;
}

export class UserRole {
  private constructor(private readonly props: UserRoleProps) {}

  static rehydrate(props: UserRoleProps): UserRole {
    return new UserRole(props);
  }

  toPrimitives(): UserRoleProps {
    return { ...this.props };
  }
}
