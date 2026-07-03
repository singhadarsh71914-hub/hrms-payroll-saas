# Payroll Engine

## Immutable Payroll Runs

Once a payroll run reaches the `COMPLETED` or `LOCKED` state, it is mathematically immutable. All metadata is snapshotted to guarantee historical precision regardless of future configuration changes.

## Snapshot Architecture

During payroll processing, the following structures are embedded into the payload:
- **Salary Structures:** Version-locked copies of the active structure.
- **Formulas:** Raw math expressions utilized during computation.
- **Compliance Rules:** The exact active LWF/ESI/PT tax rates utilized at the microsecond of generation.

## Salary Computations

Salary processing streams compute recursively:
1. Validates base salary variables.
2. Expands dependencies mapped by Formula components.
3. Extrapolates deductions natively via the active Compliance Engine version.

## Reversal Model

Direct deletion (`DELETE /payroll`) is strictly banned. 
If an error occurs, an inverse offset payroll run (Reversal) must be injected to balance the financial ledger.

## PDF Generation

All generation tasks emit deterministic hashed PDFs verifiable by SHA256 fingerprints to guarantee zero-tampering.
