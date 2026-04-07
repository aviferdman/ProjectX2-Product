# Crewspace GitHub Discussions

This directory contains the configuration and setup tooling for Crewspace's GitHub Discussions forum, used for community Q&A, ideas, showcases, and general discussions.

## Discussion Categories

| Category | Format | Description |
|----------|--------|-------------|
| 💬 Q&A | Question / Answer | Ask questions and get answers from the community |
| 💡 Ideas | Open | Share and discuss ideas for new features |
| 🎨 Show & Tell | Open | Show off projects built with Crewspace |
| 💬 General | Open | General conversations about Crewspace |

## Discussion Templates

Form templates are located in [`.github/DISCUSSION_TEMPLATE/`](../../.github/DISCUSSION_TEMPLATE/):

- `q-a.yml` — Structured Q&A form with area selection and environment details
- `ideas.yml` — Feature idea submission with motivation and example usage
- `show-and-tell.yml` — Project showcase with highlights and lessons learned
- `general.yml` — Open-ended general discussion

## Setup

### Preview the Setup Plan

```bash
npx tsx community/discussions/setup-discussions.ts --dry-run
```

### JSON Output

```bash
npx tsx community/discussions/setup-discussions.ts --format json
```

### Generate Checklist

```bash
npx tsx community/discussions/setup-discussions.ts
```

## Configuration

All discussion configuration is defined in [`discussions-config.ts`](./discussions-config.ts). To modify the setup:

1. Edit `discussions-config.ts`
2. Run `npx tsx community/discussions/setup-discussions.ts --dry-run` to preview
3. Follow the generated checklist to apply changes in GitHub Settings

The configuration is validated at runtime — the setup script will reject invalid configs (bad slugs, duplicate categories, etc.).

## Enabling Discussions

To enable GitHub Discussions on the repository:

1. Go to **Settings → General → Features**
2. Check **Discussions**
3. Create the categories listed above
4. Pin the welcome discussion
5. Update the issue template `config.yml` to redirect questions to Discussions

## Links

- [GitHub Discussions](https://github.com/aviferdman/ProjectX2-Product/discussions)
- [Discord Community](https://discord.gg/crewspace)
- [Documentation](https://crewspace.dev/docs)
