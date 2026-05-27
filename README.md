# F.R.I.D.A.Y. Cybernetic Admin Dashboard (v4.2.0)

Welcome to **F.R.I.D.A.Y.**, a military-grade security HUD and live synchronization administrative portal for Discord servers. Engineered with a futuristic cyberpunk **ORION Interface**, this application enables real-time server tracking, dynamic role deployments, citizen quarantine protocols, and automated fault analysis utilizing high-performance server-side intelligence.

---

## 🛠️ Environment Configuration & Setup

To operationalize the direct Discord API connection, you must supply active bot credentials.

### Step 1: Create a Discord Bot
1. Navigate to the [Discord Developer Portal](https://discord.com/developers/applications) and sign in.
2. Click **New Application** and name it (e.g., `FRIDAY System Core`).
3. Proceed to the **Bot** tab in the sidebar and click **Add Bot**.
4. Click **Reset Token** and copy the resulting string. This is your `DISCORD_BOT_TOKEN`.

### Step 2: Privilege Gateway Intents (CRITICAL)
For the bot client to sync logs, presences, and user details, you **must enable privileged intents** in your Developer Portal panel:
1. In the **Bot** tab, scroll down to **Privileged Gateway Intents**.
2. Toggle **ON** the following options:
   - **Presence Intent** (required to draw active operators onto the canvas radar)
   - **Server Members Intent** (required to populate citizen databases)
   - **Message Content Intent** (required for cognitive fault communication)
3. Save your changes.

### Step 3: Invite the Bot to Your Server
1. Go to the **OAuth2** tab in the Developer Portal, then click **URL Generator**.
2. In **Scopes**, check the `bot` box.
3. In **Bot Permissions**, select:
   - `Administrator` (or explicitly: `Manage Roles`, `Kick Members`, `Ban Members`, `Moderate Members`, `View Audit Log`, `Send Messages`)
4. Copy the generated invite link at the bottom and open it in a new web browser tab.
5. Select your Discord server and authorize the invitation.

---

## 🔑 Configure Secrets
Provide these values inside your platform's environment settings (or `.env` file):

```env
# Gemini secure backend authentication
GEMINI_API_KEY="your_api_key_here"

# Discord credential keys
DISCORD_BOT_TOKEN="your_copied_bot_token"
DISCORD_GUILD_ID="your_target_discord_server_id"
ADMIN_DISCORD_ID="your_personal_numeric_discord_username_id"
```

*Note: Your numeric Discord User ID can be acquired by enabling **Developer Mode** under Discord's Advanced Settings, right-clicking your avatar/name, and clicking **Copy User ID**.*

---

## 💎 Features Built

### 1. Unified 2-Column Sidebar Layout
- **Left Navigation Rail**: A permanent tactical sidebar featuring microdiagnostic telemetry feeds, real-time sync status pulses, custom frame borders, and visual menu shortcuts.
- **6th Tab: Live Security Feed**: Translates raw WebSocket audit streams into an intercepted scrolling terminal readout with clean categorization labels (`voice`, `presence`, `roles`, `moderation`).

### 2. High-Performance Canvas Sweep Radar
- Swaps out generic CSS animations for an interactive HTML5 `<canvas>` rendering circles, crosshairs, radial sweeps, and neon glow blips.
- **Stable Hash Plotter**: Maps Discord users to stationary polar grid locations based on standard username ID hashing so that icons persist in location coordinates.
- **Mouse Detection Overlay**: Coordinates mouse trajectories to trigger glowing hover popup tooltips identifying citizen metadata (`@username` and assigned clearances).

### 3. Tactical Containment Cards (Moderation Grid)
- Replaces standard table configurations with high-density bento cards.
- Displays interactive warn triggers, clear warning metrics, and mute indicators.
- **Safety Interlock Switches**: Deploys secondary binary confirmation triggers on destructive `KICK` and `BAN` actions to avoid unintended server expulsions.

### 4. Dynamic KPI Counters
- Animates all critical server statistics inside the bento header using automatic mathematical ticker calculations to count from 0 up to values seamlessly on sector load.
