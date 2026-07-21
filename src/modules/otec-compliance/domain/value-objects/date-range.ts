import { ValueObject } from '../../../../domain/shared/value-object.js';
import { BadRequestError } from '../../../../shared/domain/errors.js';

interface DateRangeProps {
  [key: string]: unknown;
  validFrom: Date | null;
  validUntil: Date | null;
}

export class DateRange extends ValueObject<DateRangeProps> {
  private constructor(props: DateRangeProps) {
    super(props);
  }

  static create(input: DateRangeProps): DateRange {
    if (input.validFrom && input.validUntil && input.validFrom > input.validUntil) {
      throw new BadRequestError('validFrom cannot be later than validUntil');
    }
    return new DateRange({ ...input });
  }

  isEffectiveAt(date: Date): boolean {
    return (
      (!this.props.validFrom || date >= this.props.validFrom) &&
      (!this.props.validUntil || date <= this.props.validUntil)
    );
  }

  get validFrom(): Date | null {
    return this.props.validFrom;
  }

  get validUntil(): Date | null {
    return this.props.validUntil;
  }
}
