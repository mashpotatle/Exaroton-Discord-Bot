# Exaroton Discord Bot

A Discord bot that bridges your Discord server and your [Exaroton](https://exaroton.com/)-hosted Minecraft server — with real-time chat sync, a whitelist system, and death tracking. No mods or plugins required.

---

## Features

| Feature | Description |
|---|---|
| 💬 **Chat Bridge** | Messages sync both ways between Discord and Minecraft in real time |
| 📋 **Whitelist Management** | Players must whitelist via Discord before they can join the server |
| 💀 **Death Counter** | Track how many times each player has died |
| 🔧 **Admin Tools** | Moderator commands for managing the whitelist and syncing roles |
| 🪨 **Vanilla Compatible** | Works on standard Minecraft servers — no mods or plugins needed |

---

## Prerequisites

Before setting up the bot, make sure you have:

- [Node.js](https://nodejs.org/) installed (v16 or higher recommended)
- A [Discord bot token](https://discord.com/developers/applications)
- An [Exaroton API key](https://exaroton.com/account/) and your server ID
- Your Discord server set up with a **player role**, a **moderator role**, and a **chat relay channel**

---

## Setup

**1. Clone the repository**
```bash
git clone https://github.com/mashpotatle/Exaroton-Discord-Bot.git
cd Exaroton-Discord-Bot
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure your `.env` file**

Open the `.env` file and fill in your credentials:

```env
DISCORD_TOKEN=your_discord_bot_token
EXAROTON_API_KEY=your_exaroton_api_key
EXAROTON_SERVER_ID=your_exaroton_server_id

PLAYER_ROLE_ID=your_player_role_id
MOD_ROLE_ID=your_moderator_role_id
CHAT_CHANNEL_ID=your_chat_relay_channel_id
```

**4. Invite the bot to your Discord server**

In the [Discord Developer Portal](https://discord.com/developers/applications), generate an invite link with the `bot` and `applications.commands` scopes and the necessary permissions (Send Messages, Manage Roles, etc.).

**5. Run the bot**
```bash
node index.js
```

---

## Project Structure

```
Exaroton-Discord-Bot/
├── commands/        # Slash command definitions and handlers
├── data/            # Persistent data (e.g. whitelist.json)
├── utils/           # Helper functions (API calls, role management, etc.)
├── index.js         # Bot entry point — starts everything up
├── package.json     # Project dependencies
└── .env             # Your secret keys (never share this!)
```

**How it works at a high level:**
- `index.js` starts the bot, connects to Discord and to Exaroton's WebSocket for live events
- When a player chats in Minecraft, the Exaroton API fires an event → the bot forwards it to your Discord channel
- When someone types in the Discord relay channel, the bot sends it to the Minecraft server via the Exaroton API
- The whitelist commands update `data/whitelist.json` and use the Exaroton API to add/remove players from the server whitelist

---

## Commands

### Player Commands

| Command | Description |
|---|---|
| `/whitelist add <username>` | Start the whitelist process to get verified and join the server |
| `/whitelist update <username>` | Update your username if it has changed |
| `/whitelist remove` | Remove yourself from the whitelist |
| `/whitelist show` | Display your currently whitelisted username |
| `/deathcount` | Show your death count on the server |

### Admin Only Commands

| Command | Description |
|---|---|
| `/list` | Show all Discord accounts with their linked Minecraft usernames |
| `/resync roles` | Re-assign player roles based on the current `whitelist.json` |
| `/resync exaroton` | Push the current whitelist to Exaroton to sync the server |
