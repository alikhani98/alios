// Stage 4 stores domain objects without a separate persistence shape. Add explicit
// mappers here only if a future schema diverges from the domain model.
export type DexieRecord<TDomain> = TDomain;
