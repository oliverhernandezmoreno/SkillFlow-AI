export interface RolePermissionProps {
  id: string;
  organizationId: string;
  roleId: string;
  permissionId: string;
}

export class RolePermission {
  private constructor(private readonly props: RolePermissionProps) {}

  static rehydrate(props: RolePermissionProps): RolePermission {
    return new RolePermission(props);
  }

  toPrimitives(): RolePermissionProps {
    return { ...this.props };
  }
}
