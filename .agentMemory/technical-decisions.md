# Technical Decisions & Notes

## Build Configuration
- **Rust**: nightly-2026-04-01 with edition 2024
- **Anchor**: Uses `cargo build-sbf` (not `cargo build-bpf`)
- **Solana**: BPF compatibility

## Security
- Multiple security audits completed
- Known issues documented in SECURITY_AUDIT_FINAL.md
- Fixes implemented in develop branch

## Testing
- Test files in `/tests/` directory
- Key tests: ginva.ts, ginva-liquidation-test.ts, ginva-test.ts
- Test coverage plan: TEST_COVERAGE_PLAN.md

## Deployment
- Devnet: Currently configured
- Production: Requires audit pass + additional review