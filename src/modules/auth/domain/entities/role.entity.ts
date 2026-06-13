export interface RoleProps {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export class Role {
  private constructor(private readonly props: RoleProps) {}

  static rehydrate(props: RoleProps): Role {
    return new Role(props);
  }

  toPrimitives(): RoleProps {
    return { ...this.props };
  }
}
