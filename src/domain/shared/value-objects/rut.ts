import { ValueObject } from '../value-object.js';

export class Rut extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }

  static create(raw: string): Rut {
    const normalized = raw.replace(/\./g, '').replace('-', '').toUpperCase();

    if (!Rut.isValid(normalized)) {
      throw new Error('Invalid RUT');
    }

    return new Rut(normalized);
  }

  static isValid(value: string): boolean {
    return /^[0-9]+[0-9K]$/.test(value);
  }

  get value(): string {
    return this.props.value;
  }
}
