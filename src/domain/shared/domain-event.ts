export interface DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly eventName: string;
  readonly aggregateId: string;
  readonly organizationId?: string;
  readonly payload: Record<string, unknown>;
}
