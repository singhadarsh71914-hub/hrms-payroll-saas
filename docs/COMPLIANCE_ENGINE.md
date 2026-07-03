# Compliance Engine

The Compliance Engine mathematically governs statutory deductions required by Indian labor laws.

## Supported Modules

- **Professional Tax (PT):** State-specific slab deduction logic mapped to region codes.
- **ESI:** Employer and employee standard percentage contribution rules.
- **LWF:** Labour Welfare Fund calculations.
- **Gratuity:** 15/26 computations mapped to continuous service rules.
- **Tax Regimes:** Multi-tier JSON slab schemas representing Old and New regimes seamlessly.

## Versioning & Effective Dates

Rules are never overwritten. A new rule generates an explicit version increment linked via `effective_date`. Payroll computation always queries the engine utilizing the isolated processing window mapped precisely to the active version string during that period.

## Historical Snapshots

All outputs from the engine are baked permanently into the `compliance_snapshot` field during payroll execution preventing historical discrepancies.
