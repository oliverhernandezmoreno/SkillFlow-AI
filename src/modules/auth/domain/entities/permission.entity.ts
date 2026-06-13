export interface PermissionProps {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export class Permission {
  private constructor(private readonly props: PermissionProps) {}

  static rehydrate(props: PermissionProps): Permission {
    return new Permission(props);
  }

  toPrimitives(): PermissionProps {
    return { ...this.props };
  }
}
