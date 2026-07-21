import { ConflictError, NotFoundError } from '../../../../shared/domain/errors.js';
export class ResolutionChainResolver {
  constructor(private readonly maxDepth = 100) {}
  assertAcyclic(links: ReadonlyMap<string, string | null>): void {
    for (const id of links.keys()) this.walk(links, id);
  }
  resolve(links: ReadonlyMap<string, string | null>, terminalId: string): string[] {
    return this.walk(links, terminalId).reverse();
  }
  private walk(links: ReadonlyMap<string, string | null>, startId: string): string[] {
    const visited = new Set<string>();
    const chain: string[] = [];
    let currentId: string | null = startId;
    while (currentId !== null) {
      if (visited.has(currentId))
        throw new ConflictError('Resolution supersession would create a cycle');
      if (chain.length >= this.maxDepth)
        throw new ConflictError('Resolution supersession chain exceeds the defensive depth limit');
      if (!links.has(currentId))
        throw new NotFoundError('The resolution supersession chain is incomplete');
      visited.add(currentId);
      chain.push(currentId);
      currentId = links.get(currentId) ?? null;
    }
    return chain;
  }
}
