# Crewspace Discord Server

This directory contains the configuration and setup tooling for the official Crewspace community Discord server.

## Server Structure

### Categories & Channels

| Category | Channel | Type | Purpose |
|----------|---------|------|---------|
| 📢 Info | `#welcome` | Text (read-only) | Welcome message and server introduction |
| 📢 Info | `#rules` | Text (read-only) | Community guidelines and Code of Conduct |
| 📢 Info | `#announcements` | Announcement | Official releases, events, and updates |
| 📢 Info | `#changelog` | Text (read-only) | Automated release notes |
| 💬 General | `#general` | Text | General discussion about Crewspace |
| 💬 General | `#introductions` | Text | Community member introductions |
| 💬 General | `#off-topic` | Text | Non-Crewspace chat |
| 🛠️ Development | `#help` | Forum | Q&A for using Crewspace |
| 🛠️ Development | `#bug-reports` | Forum | Bug reports with reproduction steps |
| 🛠️ Development | `#feature-requests` | Forum | Feature suggestions and ideas |
| 🛠️ Development | `#contributing` | Text | PR discussion, code review, dev setup |
| 🛠️ Development | `#ci-notifications` | Text (read-only) | Automated CI/CD notifications |
| 🎨 Showcase | `#showcase` | Forum | Share projects built with Crewspace |
| 🎨 Showcase | `#templates` | Text | Agent templates and crew configs |
| 🔊 Voice | `community-call` | Voice | Weekly community calls |
| 🔊 Voice | `pair-programming` | Voice | Pair programming sessions |

### Roles

| Role | Color | Description |
|------|-------|-------------|
| **Maintainer** | Red | Core team with full access |
| **Contributor** | Blue | Community members who contributed code/docs |
| **Community** | Green | Verified community members |
| **Bot** | Gray | Automated bots (GitHub, CI) |

## Setup

### Prerequisites

1. Create a Discord Application at [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a bot for the application
3. Enable the following bot permissions:
   - Manage Channels
   - Manage Roles
   - Manage Server
   - Send Messages
4. Invite the bot to your Discord server using the OAuth2 URL generator

### Dry Run

Preview the setup plan without making changes:

```bash
npx tsx community/discord/setup-discord.ts --dry-run
```

### Apply

```bash
DISCORD_BOT_TOKEN=<your-token> npx tsx community/discord/setup-discord.ts --guild-id <server-id>
```

## Configuration

All server configuration is defined in [`server-config.ts`](./server-config.ts). To modify the server structure:

1. Edit `server-config.ts`
2. Run `npx tsx community/discord/setup-discord.ts --dry-run` to preview
3. Apply changes with the setup script

The configuration is validated at runtime — the setup script will reject invalid configs (duplicate channels, missing required channels, etc.).

## Automated Welcome Messages

When a new member joins the server, two automated messages are sent:

### Channel Welcome Message
Posted in `#welcome` — visible to all members:
- Greets the new member by name
- Shows current member count
- Points to `#rules` and `#introductions`
- Includes a rich embed with quick-start links

### Direct Message
Sent privately to the new member:
- Personalized greeting
- Links to documentation, GitHub, and contributing guide

### Auto-Assign Role
New members are automatically assigned the **Community** role upon joining.

### Configuration

Welcome message templates use `{variable}` placeholders that are resolved at runtime:

| Variable | Description |
|----------|-------------|
| `{username}` | The new member's display name |
| `{server}` | Server name (Crewspace) |
| `{memberCount}` | Current member count |
| `{rulesChannel}` | Name of the rules channel |
| `{introChannel}` | Name of the introductions channel |

The default configuration is defined in [`welcome-messages.ts`](./welcome-messages.ts). To customize:

1. Edit the `DEFAULT_WELCOME_CONFIG` export or create a new `WelcomeConfig`
2. Use `validateWelcomeConfig()` to check for issues
3. Use `renderWelcomeMessage()` to resolve templates at runtime

### Preview

```bash
npx tsx -e "
  import { DEFAULT_WELCOME_CONFIG, formatWelcomeConfig } from './community/discord/welcome-messages.js';
  console.log(formatWelcomeConfig(DEFAULT_WELCOME_CONFIG));
"
```

## Invite Link

Once the server is created, share this invite link with the community:

```
https://discord.gg/crewspace
```

> **Note:** Replace with the actual invite link after server creation.
