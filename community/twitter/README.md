# Crewspace Twitter/X Account

This directory contains the configuration and setup tooling for the official Crewspace Twitter/X account used for project announcements.

## Account Details

| Field | Value |
|-------|-------|
| **Handle** | `@crewspace_dev` |
| **Display Name** | Crewspace |
| **URL** | [github.com/aviferdman/ProjectX2-Product](https://github.com/aviferdman/ProjectX2-Product) |

## Content Categories

| Category | Frequency | Description |
|----------|-----------|-------------|
| Release Announcements | On event | New version releases and changelogs |
| Feature Highlights | Weekly | Deep dives into specific features |
| Community Showcase | Weekly | Highlighting community projects and contributions |
| Tips & Tutorials | Biweekly | Quick tips, code snippets, and guides |
| Ecosystem & Industry | Biweekly | AI agent ecosystem news and commentary |

## Hashtags

**Global:** `#crewspace` `#TypeScript` `#AIagents` `#OpenSource`

Each content category has additional topic-specific hashtags.

## Setup

### Preview the Setup Plan

```bash
npx tsx community/twitter/setup-twitter.ts --dry-run
```

### JSON Output

```bash
npx tsx community/twitter/setup-twitter.ts --format json
```

### Generate Checklist

```bash
npx tsx community/twitter/setup-twitter.ts
```

## Configuration

All account configuration is defined in [`account-config.ts`](./account-config.ts). To modify the account setup:

1. Edit `account-config.ts`
2. Run `npx tsx community/twitter/setup-twitter.ts --dry-run` to preview
3. Follow the generated checklist to apply changes manually

The configuration is validated at runtime — the setup script will reject invalid configs (bad handles, duplicate categories, etc.).

## Posting Schedule

- **Days:** Monday through Friday
- **Times (UTC):** 14:00, 17:00
- **Max posts per day:** 3
- **Timezone:** UTC

## Account Link

Once the account is created, it will be available at:

```
https://x.com/crewspace_dev
```

> **Note:** Replace with the actual URL after account creation.
