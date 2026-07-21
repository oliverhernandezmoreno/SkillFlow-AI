import { describe, expect, it } from 'vitest';
import { ConflictError, NotFoundError } from '../../../../shared/domain/errors.js';
import { ResolutionChainResolver } from './resolution-chain-resolver.js';

describe('ResolutionChainResolver', () => {
  it('reconstructs a deterministic five-level chain from initial to terminal', () => {
    const links = new Map<string, string | null>([
      ['r1', null],
      ['r2', 'r1'],
      ['r3', 'r2'],
      ['r4', 'r3'],
      ['r5', 'r4'],
    ]);
    expect(new ResolutionChainResolver().resolve(links, 'r5')).toEqual([
      'r1',
      'r2',
      'r3',
      'r4',
      'r5',
    ]);
  });
  it.each([
    new Map<string, string | null>([['a', 'a']]),
    new Map<string, string | null>([
      ['a', 'b'],
      ['b', 'a'],
    ]),
    new Map<string, string | null>([
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'a'],
    ]),
    new Map<string, string | null>([
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'd'],
      ['d', 'e'],
      ['e', 'b'],
    ]),
  ])('rejects direct, two-node, indirect, and deep cycles', (links) => {
    expect(() => {
      new ResolutionChainResolver().assertAcyclic(links);
    }).toThrow(ConflictError);
  });
  it('rejects a broken chain and enforces a defensive depth limit', () => {
    expect(() => new ResolutionChainResolver().resolve(new Map([['a', 'missing']]), 'a')).toThrow(
      NotFoundError,
    );
    const deep = new Map<string, string | null>();
    for (let index = 0; index < 101; index += 1)
      deep.set(`r${String(index)}`, index === 0 ? null : `r${String(index - 1)}`);
    expect(() => new ResolutionChainResolver(100).resolve(deep, 'r100')).toThrow(ConflictError);
  });
});
