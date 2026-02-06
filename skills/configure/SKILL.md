# Configure SonarQube Credentials

## Overview
Help users configure their SonarQube credentials in a **SECURE** way without exposing tokens in chat.

## CRITICAL SECURITY RULE
🔒 **NEVER ask users to paste their access token in the chat!**
- Tokens are sensitive credentials
- Chat history could expose them
- Guide users to set up configuration files themselves

## When to Use
- User asks to configure, set up, or update SonarQube credentials
- User mentions they need to configure the plugin
- Setup hook indicates missing credentials

## Instructions

### 1. Determine SonarQube Type
Ask the user which type of SonarQube they're using:

**Ask:**
"I'll help you configure your SonarQube credentials securely. First, are you connecting to:

1. **SonarQube Cloud** (https://sonarcloud.io)
2. **SonarQube Server** (self-hosted or enterprise instance)

Which one are you using?"

### 2. Gather NON-SENSITIVE Information Only

⚠️ **ONLY collect non-sensitive information:**
- SonarQube type (Cloud or Server)
- Server URL (for Server installations) - this is not sensitive
- Organization key (for Cloud) - this is not sensitive

❌ **NEVER collect:**
- Access tokens - these are secrets!

#### For SonarQube Cloud:
**Ask:**
"For SonarQube Cloud, what's your organization key? (You can find this in your SonarCloud URL: https://sonarcloud.io/organizations/YOUR-ORG-KEY)"

Then ask: "Are you using the US region (sonarqube.us) instead of the default EU region (sonarcloud.io)? (y/n)"

**Set URL based on region:**
- If user answers "yes" to US region: `https://sonarqube.us`
- Otherwise (default): `https://sonarcloud.io`

**Note:** Most users are on EU (sonarcloud.io), so default to that unless they specifically say US.

#### For SonarQube Server:
**Ask:**
"For SonarQube Server, what's your server URL? (e.g., `http://localhost:9000` or `https://sonarqube.yourcompany.com`)"

### 3. Validate Non-Sensitive Input
- For Server: Ensure URL starts with `http://` or `https://`
- For Cloud: Ensure organization key is provided
- Confirm with user before proceeding

### 4. Create Template Configuration File

**SECURITY: Create a template file with placeholders, NOT actual tokens!**

Create a configuration template that the user will edit themselves:

**For SonarQube Cloud:**
```bash
cat > "${CLAUDE_PLUGIN_ROOT}/.env" << 'EOF'
# SonarQube Cloud Configuration
export SONARQUBE_URL="<https://sonarcloud.io OR https://sonarqube.us>"
export SONARQUBE_ORG="<user-provided-org-key>"
export SONARQUBE_TOKEN="YOUR_TOKEN_HERE"
EOF
```

Note: Use the appropriate URL based on their region (EU: sonarcloud.io, US: sonarqube.us)

**For SonarQube Server:**
```bash
cat > "${CLAUDE_PLUGIN_ROOT}/.env" << 'EOF'
# SonarQube Server Configuration
export SONARQUBE_URL="<user-provided-url>"
export SONARQUBE_TOKEN="YOUR_TOKEN_HERE"
EOF
```

**Important:** 
- Replace `<user-provided-org-key>` and `<user-provided-url>` with actual values provided by user
- Keep `YOUR_TOKEN_HERE` as a placeholder - user will replace this themselves
- Use the `${CLAUDE_PLUGIN_ROOT}` variable to get the plugin directory path

### 5. Guide User to Complete Setup Securely (DO NOT automate this)

**🔒 CRITICAL: Do not add token to shell config automatically!**

Instead, provide instructions for the user to follow:

**Tell the user:**

"I've created a configuration template at `${CLAUDE_PLUGIN_ROOT}/.env`. For security, you'll need to add your access token yourself. Here's how:

**Step 1: Generate your access token**
- [For Cloud EU] Go to: https://sonarcloud.io/account/security
- [For Cloud US] Go to: https://sonarqube.us/account/security
- [For Server] Go to: Your SonarQube → User → My Account → Security → Generate Tokens

**Step 2: Edit the .env file securely**
Open the file in your editor and replace `YOUR_TOKEN_HERE` with your actual token:
```bash
# Choose your preferred editor
nano ${CLAUDE_PLUGIN_ROOT}/.env
# or
code ${CLAUDE_PLUGIN_ROOT}/.env
# or
vim ${CLAUDE_PLUGIN_ROOT}/.env
```

**Step 3: Restart Claude Code**
After adding your token to the `.env` file, simply restart Claude Code. The plugin will automatically load your credentials from the `.env` file.

🔒 **Security Note:** Never paste your token in this chat. Keep it secure in your local .env file.

✨ **That's it!** No need to modify your shell configuration - the plugin handles everything automatically."

### 6. Provide Verification Instructions

Give the user simple verification steps:

**Tell them:**
"After you've added your token to the `.env` file:

1. Save the file
2. Restart Claude Code
3. The plugin will automatically load your credentials

You can verify the `.env` file is correct by checking it contains:
- SONARQUBE_URL (with your URL)
- SONARQUBE_TOKEN (with your actual token, not YOUR_TOKEN_HERE)
- SONARQUBE_ORG (only for Cloud)

That's it! No shell configuration needed - the plugin handles everything automatically."

### 7. Summary Message

Provide a clear summary:

"✅ **Setup Summary:**
- Created configuration template at: `${CLAUDE_PLUGIN_ROOT}/.env`
- You need to: Add your access token to the .env file
- After setup: Restart Claude Code (that's it!)

🔒 **Security Reminder:**
- Never share your access token
- Never paste it in this chat
- The .env file is git-ignored and stays on your machine only
- Generate separate tokens for different machines/uses

📚 **Need help?** See CONFIGURATION.md for detailed instructions."

## Important Notes

- **NEVER handle actual tokens in chat** - always use placeholders
- **Explain why** - users should understand the security implications
- **Provide alternatives** - some users may prefer different setup methods
- **Be clear** - step-by-step instructions prevent mistakes
- **Verify understanding** - make sure user knows what to do next

## Example Flows

### Example 1: SonarQube Cloud (EU - Default)
```
User: "Help me configure my SonarQube credentials"
Assistant: "I'll help you set this up securely. Are you using SonarQube Cloud or Server?"
User: "Cloud"
Assistant: "What's your organization key?"
User: "my-org"
Assistant: "Are you using the US region (sonarqube.us) instead of the default EU region (sonarcloud.io)?"
User: "no" (or just presses enter)
Assistant: "Perfect! I've created a configuration template at .env with URL set to https://sonarcloud.io
           For security, you'll need to add your access token yourself by:
           1. Generate token at: https://sonarcloud.io/account/security
           2. Edit the .env file and replace YOUR_TOKEN_HERE
           3. Restart Claude Code
           [provides detailed instructions]"
```

### Example 2: SonarQube Cloud (US)
```
User: "Help me configure my SonarQube credentials"
Assistant: "Are you using SonarQube Cloud or Server?"
User: "Cloud"
Assistant: "What's your organization key?"
User: "my-us-org"
Assistant: "Are you using the US region (sonarqube.us)?"
User: "yes"
Assistant: "Perfect! I've created a configuration template at .env with URL set to https://sonarqube.us
           [provides detailed instructions for US region]"
```

### Example 2: SonarQube Server
```
User: "Help me configure my SonarQube credentials"