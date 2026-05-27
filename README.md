<div align="center">
<img width="1200" height="475" alt="F.R.I.D.A.Y. Admin Core" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# F.R.I.D.A.Y. Discord Admin Core

**A futuristic, holographic Discord server management dashboard powered by Google Gemini AI**

> *"I am F.R.I.D.A.Y. (Female Replacement Intelligent Digital Assistant Youth), at your service."*

A Stark Industries-themed cyberpunk admin panel for managing Discord servers with real-time moderation, automated AI support tickets, encrypted backups, and secure audit logging.

---

## 🌟 Features

### Core Administration
- **Role Management** - Create, update, and delete server roles with customizable permissions
- **Member Moderation** - View member profiles, assign roles, mute, warn, kick, or ban members
- **Real-time Synchronization** - Live updates across multiple tabs using Server-Sent Events (SSE)
- **Audit Logging** - Comprehensive security logs with timestamps, categories, and severity levels

### AI-Powered Support System
- **F.R.I.D.A.Y. Support Tickets** - Automated ticket creation and AI-powered responses using Google Gemini 3.5-flash
- **Intelligent Conversations** - Natural language processing for context-aware support responses
- **Ticket Management** - Create, track, and resolve support tickets with conversation history
- **Smart Prompting** - Support for different ticket types (general, onboarding, ticket-triage)

### Data Protection & Infrastructure
- **Encrypted Backups** - Military-grade encrypted snapshots with SHA-256 checksums and AES-GCM encryption
- **System Diagnostics** - Real-time bot health monitoring (latency, CPU usage, memory, uptime)
- **Live Telemetry** - Monitor server shard status and performance metrics
- **Server Statistics** - Track active members, role distribution, threat levels, and more

### User Experience
- **Cyberpunk UI** - Futuristic holographic dashboard with animated elements
- **Dark Theme** - Eye-friendly interface with cyan/blue accent colors
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Real-time Updates** - Instant synchronization of changes across all connected clients

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **Google Gemini API Key** (from [Google AI Studio](https://ai.google.dev))
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/imzyrix/Friday-discord.git
   cd Friday-discord
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   - Add your Gemini API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   APP_URL=http://localhost:3000
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   ```
   http://localhost:3000
   ```

---

## 📚 Project Structure

```
Friday-discord/
├── src/
│   ├── App.tsx                 # Main React application component
│   ├── types.ts                # TypeScript interfaces for data structures
│   ├── mockData.ts             # Initial mock data for development
│   ├── main.tsx                # React entry point
│   ├── index.css               # Global styles
│   └── components/             # React UI components (HudDisplay, RolesManager, etc.)
├── server.ts                   # Express.js backend server with API routes
├── package.json                # Project dependencies and scripts
├── vite.config.ts              # Vite build configuration
├── tsconfig.json               # TypeScript configuration
├── metadata.json               # App metadata for AI Studio
├── index.html                  # HTML template
└── README.md                   # This file
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/discord-simulate` - Simulate Discord OAuth2 authentication

### Roles Management
- `GET /api/roles` - Retrieve all server roles
- `POST /api/roles` - Create a new role
- `PUT /api/roles/:id` - Update an existing role
- `DELETE /api/roles/:id` - Delete a role

### Members Management
- `GET /api/members` - Retrieve all server members
- `PUT /api/members/:id` - Update member profile or roles
- `DELETE /api/members/:id?type=kick|ban` - Remove member (kick or ban)

### Support Tickets
- `GET /api/tickets` - Retrieve all support tickets
- `POST /api/tickets` - Create a new ticket
- `POST /api/tickets/:id/message` - Send a message in a ticket (triggers AI response)
- `PUT /api/tickets/:id/status` - Update ticket status (open, assigned, resolved)

### Backups
- `GET /api/backups` - Retrieve backup history
- `POST /api/backups` - Create an encrypted backup snapshot

### AI Chat
- `POST /api/friday/chat` - Direct F.R.I.D.A.Y. AI chat interface

### Real-time Updates
- `GET /api/realtime/stream` - SSE stream for real-time synchronization
- `GET /api/bot/status` - Get current bot diagnostics

---

## 🧠 Data Types

### Role
```typescript
interface Role {
  id: string;
  name: string;
  color: string;
  hoist: boolean;
  permissions: string[];
  memberCount: number;
}
```

### Member
```typescript
interface Member {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  joinedAt: string;
  roles: string[];
  warnings: number;
  isMuted: boolean;
}
```

### SupportTicket
```typescript
interface SupportTicket {
  id: string;
  author: string;
  channelName: string;
  title: string;
  description: string;
  status: 'open' | 'assigned' | 'resolved';
  createdAt: string;
  category: string;
  conversation: {
    sender: 'user' | 'friday';
    message: string;
    timestamp: string;
  }[];
}
```

### BotDiagnostic
```typescript
interface BotDiagnostic {
  status: 'optimal' | 'warning' | 'degraded';
  latency: number;
  cpuUsage: number;
  memoryUsage: { heapUsed: number; heapTotal: number };
  uptime: number;
  shards: { id: number; status: string; latency: number }[];
}
```

---

## 🛠️ Development Scripts

```bash
# Start development server with live reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type check with TypeScript
npm run lint

# Clean build artifacts
npm run clean
```

---

## 🤖 F.R.I.D.A.Y. AI Integration

F.R.I.D.A.Y. uses **Google Gemini 3.5-flash** for intelligent responses. The AI system:

- **Responds to support tickets** with context-aware answers
- **Maintains conversation history** for coherent multi-turn discussions
- **Supports specialized prompting** for onboarding and ticket triage
- **Uses professional terminology** (Protocol, Telemetry, Authorized, Diagnostics)
- **Respects privacy & security protocols** for all interactions

### Customizing F.R.I.D.A.Y.

Edit the system instruction in `server.ts` (line 342-345) to customize F.R.I.D.A.Y.'s personality and behavior:

```typescript
const systemInstruction = `You are F.R.I.D.A.Y., the elite holographic AI created by Tony Stark...`;
```

---

## 🔐 Security Features

- **OAuth2 Simulation** - Secure authentication flow
- **Encrypted Backups** - AES-GCM encrypted database snapshots with SHA-256 checksums
- **Audit Trail** - Complete logging of all administrative actions
- **Role-based Access** - Granular permission management
- **Muting & Warnings** - Progressive moderation system
- **Session Management** - Real-time user session tracking

---

## 🎨 Technology Stack

### Frontend
- **React 19** - Modern UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icon library
- **Motion (Framer Motion)** - Smooth animations

### Backend
- **Express.js** - Web server framework
- **Server-Sent Events (SSE)** - Real-time synchronization
- **Google Genai API** - AI-powered responses
- **Node.js** - JavaScript runtime

### Tools & Utilities
- **dotenv** - Environment variable management
- **esbuild** - Fast JavaScript bundler
- **tsx** - TypeScript execution

---

## 📊 Dashboard Tabs

### 1. **Cognitive Diagnostics & Backups**
Monitor bot health, system performance, and manage encrypted backups

### 2. **Clearances & Role Deploy**
Create, edit, and manage server roles with custom permissions

### 3. **Citizens Security Profile**
View and manage member information, roles, mutes, warnings, and bans

### 4. **Security Audit Stream**
Real-time audit log with categorized entries (security, moderation, roles, backups, bot)

### 5. **F.R.I.D.A.Y. Cognition Tickets**
Support ticket system with AI-powered responses and conversation tracking

---

## 🌐 Deployment

This application is built for **Google Cloud Run** via AI Studio but can be deployed to any Node.js hosting:

### Build for Production
```bash
npm run build
npm start
```

The application will serve on port `3000` (configurable via environment variables).

---

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key for AI responses | `sk-...` |
| `APP_URL` | Application URL for OAuth callbacks | `http://localhost:3000` |
| `NODE_ENV` | Environment mode | `development` or `production` |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🙋 Support

For questions or issues:
1. Check existing [GitHub Issues](https://github.com/imzyrix/Friday-discord/issues)
2. Create a new issue with detailed information
3. Join our community Discord (if available)

---

## 🎬 Project Status

✅ **Active Development** - Core features complete, ready for deployment and customization

---

<div align="center">

**Made with 🤖 AI and ⚡ TypeScript**

*"Sir, I have completed the diagnostics of the Stark Industries security infrastructure."*

</div>
