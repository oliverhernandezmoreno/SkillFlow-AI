export interface UnitOfWork {
  readonly transactionBoundary: 'UNIT_OF_WORK';
}

export interface TransactionManager<TUnitOfWork extends UnitOfWork> {
  run<TResult>(work: (unitOfWork: TUnitOfWork) => Promise<TResult>): Promise<TResult>;
}
