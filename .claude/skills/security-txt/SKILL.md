---
name: security-txt
description: Solana security contact info embedding - let whitehats report vulnerabilities
---

# Solana Security TXT

Embed security contact information directly into Solana smart contracts using the `solana-security-txt` Rust library.

## Installation

```toml
# Cargo.toml
solana-security-txt = "0.2"
```

## Usage

Add the macro to your Solana program:

```rust
use solana_security_txt::security_txt;

security_txt!(
    project_name = "Ginva Protocol",
    url = "https://ginva.io",
    contact = "security@ginva.io",
    policy = "https://ginva.io/security-policy",
    source = "https://github.com/ginva/ginva",
    encryption = "https://keys.openpgp.org/vks/v1/by-email/security@ginva.io",
    auditors = "Neodyme, Audit Realm",
    acknowledgments = "Thanks to all whitehat contributors"
);
```

## Required Fields

- **project_name** - Name of the project
- **url** - Project website  
- **contact** - How to reach security team (email, link, Discord, Telegram, Twitter)
- **policy** - Link to security policy

## Optional Fields

- **source** - Link to source code
- **encryption** - PGP encryption key URL
- **preferred_languages** - Comma-separated language codes
- **revision** - Revision identifier
- **auditors** - Security audit firms
- **acknowledgments** - List of security researchers

## Why Use Security TXT

- Whitehat researchers can contact you when they find vulnerabilities
- Required for many bug bounty programs
- Follows securitytxt.org standard
- Information stored on-chain in the contract binary

## Query Tool

Use query-security-txt to extract security info:

```bash
cargo install query-security-txt
query-security-txt <PROGRAM_ADDRESS>
```

## Status

✅ Already added to Cargo.toml as dependency
