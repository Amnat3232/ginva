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

### 2. Update Vault
- Update `01-Project-Overview.md` if high-level status changed
- Update or create relevant note in `02-Architecture/`, `03-Smart-Contract/`, `04-Keeper-Bots/`, etc.
- Add or update links (`[[]]`) to keep the Knowledge Graph connected
- Update MOCs (Map of Content) if needed
- Update `CLAUDE.md` if new rules/best practices were discovered

### 3. Best Practices for Updates
- Keep each note atomic and focused (one main idea per note)
- Use clear headings and bullet points
- Add `---` separator with `Last Updated: YYYY-MM-DD` at bottom
- Always add bidirectional links to related notes
- Never remove historical information — only append or clarify

### 4. After Updating
- Summarize what you changed in the vault
- Suggest 1-2 new links or improvements
- Confirm that the vault is now in sync with the current codebase

---

## Quick Commands

### Update Vault (use after coding)
```
Update Ginva Obsidian Vault with the latest changes I just made.
Scan relevant files in the codebase, update all connected notes,
strengthen the Knowledge Graph with proper links, and confirm sync status.
Use atomic notes and follow existing structure.
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
- **Phase**: Phase 6 (New Features + Vault Creation)
- **Program ID**: `HQd5KLkNzAuJiG6jyyfs2wiMByLdAyGncUnbFhmhQhBj`

---

*This file should be updated whenever new rules or conventions are discovered.*
