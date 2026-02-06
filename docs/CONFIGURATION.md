# SonarQube Plugin Configuration Guide

## 🎯 Quick Start (Recommended)

The easiest and **most secure** way to configure the plugin is to **ask Claude for help**:

```
"Help me configure my SonarQube credentials"
```

Claude will:
- ✅ Ask if you're using SonarQube Cloud or Server
- ✅ For Cloud: Ask for organization key and optionally if using US region (defaults to EU)
- ✅ For Server: Ask for server URL
- ✅ Create a `.env` template file with placeholders
- ✅ **Guide you to add your token securely** (you never paste it in chat!)
- ✅ Provide step-by-step instructions to complete setup

**Note:** Most users are on the EU region (sonarcloud.io) which is the default.

🔒 **Security First:** Claude will NEVER ask you to paste your access token in the chat. You'll add it securely to a local file yourself.

## 🔧 Configuration Methods

### Method 1: Ask Claude (Easiest) ⭐

Just say: **"Help me configure my SonarQube credentials"**

Claude uses the `configure` skill to guide you through setup interactively.

### Method 2: Manual `.env` File

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your values:

   **For SonarQube Cloud (EU - Default):**
   ```bash
   export SONARQUBE_URL="https://sonarcloud.io"
   export SONARQUBE_ORG="your-org-key"
   export SONARQUBE_TOKEN="squ_your_token_here"
   ```

   **For SonarQube Cloud (US - If applicable):**
   ```bash
   export SONARQUBE_URL="https://sonarqube.us"
   export SONARQUBE_ORG="your-org-key"
   export SONARQUBE_TOKEN="squ_your_token_here"
   ```

   **For SonarQube Server:**
   ```bash
   export SONARQUBE_URL="http://localhost:9000"
   export SONARQUBE_TOKEN="squ_your_token_here"
   # Note: SONARQUBE_ORG not needed for Server
   ```

3. Reload Claude Code

### Method 3: Shell Configuration (Optional, Not Required)

**Note:** You don't need to do this! The plugin automatically loads `.env` when starting the MCP server.

However, if you want the variables available in your terminal for other purposes:

```bash
# Add to ~/.zshrc or ~/.bashrc (optional)
[ -f "/path/to/plugin/.env" ] && source "/path/to/plugin/.env"
```

Then reload:
```bash
source ~/.zshrc
```

## 🔑 Getting Credentials

### For SonarQube Cloud:

**Default:** Most users are on the EU region (https://sonarcloud.io)

**Check your region:** If you access SonarCloud at https://sonarqube.us, you're on the US region. Otherwise, you're on EU (default).

1. **Organization Key:**
   - Log in to your SonarCloud instance (sonarcloud.io or sonarqube.us)
   - Go to your organization
   - Find the organization key in the URL or organization settings
   - Example: `https://sonarcloud.io/organizations/YOUR-ORG-KEY`

2. **Access Token:**
   - EU: Go to https://sonarcloud.io/account/security
   - US: Go to https://sonarqube.us/account/security
   - Enter a name (e.g., "Claude Code Plugin")
   - Click **Generate**
   - **Copy the token immediately** (you won't see it again!)

### For SonarQube Server:

1. Log in to your SonarQube instance
2. Go to: **User Icon** → **My Account** → **Security**
3. Under "Generate Tokens":
   - Enter a name (e.g., "Claude Code Plugin")
   - Select token type (usually "User Token")
   - Set expiration (or "No expiration")
4. Click **Generate**
5. **Copy the token immediately** (you won't see it again!)

## 🚦 Configuration Status

When you start the plugin, the setup script will show:

**For SonarQube Cloud:**
```
✓ SonarQube credentials configured
  URL: https://sonarcloud.io  (or https://sonarqube.us)
  Organization: your-org-key
  Type: SonarQube Cloud (EU)  (or SonarQube Cloud (US))
```

**For SonarQube Server:**
```
✓ SonarQube credentials configured
  URL: http://localhost:9000
  Type: SonarQube Server
```

**If not configured:**
```
⚠️  SonarQube credentials not configured

📝 To configure, ask Claude:
   'Help me configure my SonarQube credentials'
```

**If Cloud is missing organization:**
```
⚠️  SonarQube Cloud requires organization key

📝 To configure, ask Claude:
   'Help me configure my SonarQube credentials'
```

## 🔒 Security Best Practices

### ⚠️ CRITICAL: Protect Your Access Token

Your access token is like a password - treat it with extreme care:

- ❌ **NEVER** paste your token in Claude chat
- ❌ **NEVER** commit `.env` to version control (it's git-ignored by default)
- ❌ **NEVER** share your `.env` file
- ❌ **NEVER** post tokens in Slack, email, or anywhere public
- ✅ **ONLY** store tokens in local files on your machine
- ✅ **USE** token expiration when possible
- ✅ **REVOKE** tokens you're no longer using
- ✅ **GENERATE** separate tokens for different machines/purposes

### Why This Matters

If someone gets your token, they can:
- Access your SonarQube projects
- Read your code analysis results
- Potentially modify project settings
- Impersonate you in the system

### Safe Configuration Process

1. Claude creates a template with `YOUR_TOKEN_HERE` placeholder
2. You generate a token in SonarQube (not in chat!)
3. You edit the local .env file yourself
4. Token never leaves your machine or enters chat history

## 🆘 Troubleshooting

### "Missing environment variables" error

**Solution:** Run the configuration again:
```
"Help me configure my SonarQube credentials"
```

### Variables not persisting across sessions

**Solution:** Add to shell configuration (~/.zshrc) or use the plugin's `.env` file

### Can't connect to SonarQube

1. Check URL is correct (include `http://` or `https://`)
2. Verify SonarQube is running
3. Ensure token is valid and not expired
4. Check network/firewall settings

## 📂 Configuration Files

```
sonarqube-claude-code-plugin/
├── .env                    # Your credentials (git-ignored, create from .env.example)
├── .env.example            # Template with instructions
└── .gitignore              # Ensures .env is never committed
```

## 🔄 Updating Configuration

To update your credentials, either:
1. Ask Claude: **"Help me update my SonarQube credentials"**
2. Edit `.env` directly and reload
3. Update your shell configuration

## 💡 Tips

- **Use SonarCloud?** Set `SONARQUBE_URL=https://sonarcloud.io` and include `SONARQUBE_ORG`
- **MCP Server not working?** Check that `.env` file exists and has your actual token (not `YOUR_TOKEN_HERE`)
- **Multiple projects?** You can configure per-project in `.env`
- **CI/CD?** Use environment variables from your CI system
- **Team setup?** Share the `.env.example` file (NOT `.env`!)
- **Wrong type?** If you configured Server but need Cloud (or vice versa), just ask Claude to reconfigure
- **No shell config needed!** The plugin automatically loads `.env` - just restart Claude Code

## 🔧 How Configuration Works

The plugin uses an **automatic** approach - no shell configuration required!

```
┌─────────────────────────────────────┐
│  .env file (plugin directory)       │
│  ──────────────────────────         │
│  Your credentials stored here       │
│  (git-ignored, local only)          │
└──────────────────┬──────────────────┘
                   │
                   ↓ (automatically loaded by)
┌─────────────────────────────────────┐
│  scripts/start-mcp-server.sh        │
│  ──────────────────────────         │
│  Wrapper script that:               │
│  1. Loads .env file                 │
│  2. Starts MCP server               │
└──────────────────┬──────────────────┘
                   │
                   ↓ (called by)
┌─────────────────────────────────────┐
│  .mcp.json                          │
│  ──────────────────────────         │
│  { "command": "start-mcp-server.sh" }│
│  (clean & simple!)                  │
└─────────────────────────────────────┘
```

✨ **Zero manual configuration** - just create `.env` and restart Claude Code!

## ⚠️ Important Notes

### SonarQube Cloud vs Server

| Feature | SonarQube Cloud | SonarQube Server |
|---------|----------------|------------------|
| URL | Always `https://sonarcloud.io` | Your server URL (e.g., `http://localhost:9000`) |
| Organization | **Required** (`SONARQUBE_ORG`) | **Not used** |
| Token | User token from SonarCloud | User token from your server |

### Common Mistakes

❌ **Don't** set `SONARQUBE_ORG` for SonarQube Server  
❌ **Don't** forget `SONARQUBE_ORG` for SonarQube Cloud  
❌ **Don't** use a custom URL for SonarCloud (always use `https://sonarcloud.io`)  
✅ **Do** ask Claude to help if you're unsure which type you have
