import { bootstrapDemoData, type DemoBootstrapSummary } from '../services/demo-bootstrap.service.js';

export interface BootstrapDemoUseCaseInput {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class BootstrapDemoUseCase {
  async execute(input: BootstrapDemoUseCaseInput = {}): Promise<DemoBootstrapSummary> {
    return bootstrapDemoData(input);
  }
}
