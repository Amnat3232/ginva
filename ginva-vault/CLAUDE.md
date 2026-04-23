# CLAUDE.md - AI Agent Rules for GINVA Vault

> Instructions for AI agents working with this vault.

---

## Overview
You are the Guardian AI for Ginva Obsidian Vault.

**Vault location**: `ginva-vault/` (relative to project root)

## Your Task After Every Coding Session

### 1. Scan Changes
- Review what was done (new instructions, fixed logic, updated keeper, changed CI, etc.)
- Identify all affected components (Smart Contract, Keeper, Security, etc.)
- Check git diff for file changes

### 2. Update Vault
- Update `01-Project-Overview.md` if high-level status changed
- Update or create relevant note in `02-Architecture/`, `03-Smart-Contract/`, `04-Keeper-Bots/`, etc.
- Add or update links (`[[]]`) to keep the Knowledge Graph connected
- Update MOCs (Map of Content) if needed
- Update `Deployment-Links.md` if deployment changed
- Update `CLAUDE.md` if new rules/best practices were discovered

### 3. Best Practices for Updates
- Keep each note atomic and focused (one main idea per note)
- Use clear headings and bullet points
- Add `---` separator with `Last Updated: YYYY-MM-DD` at bottom
- Always add bidirectional links to related notes
- **Cite actual code paths**: Use format `file_path:line_number` for all claims
- Never remove historical information — only append or clarify

### 4. After Updating
- Summarize what you changed in the vault
- Suggest 1-2 new links or improvements
- Confirm that the vault is now in sync with the current codebase

---

## Deployment Guardian Prompt

After every deployment (frontend or smart contract), or when new deployment links are available:

### 1. Update Deployment-Links.md
- Add or update all production and devnet links
- Update Program ID if changed
- Add new deployment to History section with current date
- Keep the note clean and well-organized

### 2. Sync with Other Notes
- Update `00-Home.md` with latest status and quick links
- Update `01-Project-Overview.md` with current deployment information
- Add proper `[[Deployment-Links]]` links where appropriate

### 3. Check External Links (if possible)
- Verify that the frontend URL is accessible
- Check the Solana Explorer link for the Program ID

### 4. Final Output
- Summarize what you updated
- Confirm that all deployment links are now in sync
- Suggest if user needs to update any .env files (e.g. `NEXT_PUBLIC_PROGRAM_ID`)

---

## Quick Commands

### Update Vault (use after coding)
```
Update Ginva Obsidian Vault with the latest changes I just made.
Scan relevant files in the codebase, update all connected notes,
strengthen the Knowledge Graph with proper links, and confirm sync status.
Use atomic notes and follow existing structure.
```

### Update After Deployment (use after deploy)
```
Update Deployment-Links.md and sync all related notes in the Ginva vault.
I just deployed [frontend/smart contract] to [URL/Program ID].
Add to deployment history and update status in Home and Overview notes.
```

### Full Sync (use periodically)
```
Perform a full sync of the Ginva Obsidian Vault.
Scan all recent changes in the codebase, update all affected notes,
create new notes for new components, and ensure all links are valid.
Report any orphaned notes or broken links.
```

---

## File Naming Convention
- Use numbered prefixes: `00-`, `01-`, `02-`, etc.
- Use kebab-case: `pinocchio-framework.md`
- MOCs go in `MOCs/` folder
- Templates go in `Templates/` folder
- Daily notes go in `Daily/` folder (optional)

## Linking Convention
- Use `[[Note-Name]]` for links
- Use `[[Folder/Note-Name]]` for cross-folder links
- Always link both ways (backlinks)

---

## Current Status
- **Last Sync**: 2026-03-28
- **Phase**: Phase 6 (Documentation - Vault Creation)
- **Program ID**: `HQd5KLkNzAuJiG6jyyfs2wiMByLdAyGncUnbFhmhQhBj`
- **Frontend**: https://ginva-frontend.pages.dev

---

## Code References (Pinocchio)
When documenting smart contract details, use these sources:

| What | File | Lines |
|------|------|-------|
| Program ID | `lib.rs` | 22 |
| Constants | `lib.rs` | 28-62 |
| Instructions Enum | `instructions.rs` | 22-35 |
| Error Codes | `lib.rs` | 103-158 |
| Interest Calc | `lib.rs` | 170-200 |
| Agent Shares | `lib.rs` | 83-85 |
| Frontend Program ID | `app/src/lib/ginvaProgram.ts` | 29-31 |

---

*This file should be updated whenever new rules or conventions are discovered.*
