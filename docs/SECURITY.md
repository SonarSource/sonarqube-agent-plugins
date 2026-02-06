# Security Guidelines

## 🔒 Protecting Your Credentials

This plugin requires SonarQube credentials to function. **Your security is our top priority.**

## Critical Security Rules

### ❌ NEVER Do This:

1. **NEVER paste your access token in Claude chat**
   - Chat history could be stored
   - Tokens could be exposed in logs
   - Other users might see chat history

2. **NEVER commit `.env` files to version control**
   - Tokens would be in git history forever
   - Anyone with repo access could see them
   - Public repos would expose tokens to the world

3. **NEVER share your `.env` file**
   - Don't email it
   - Don't post it in Slack/Teams
   - Don't put it in shared drives

4. **NEVER hardcode tokens in configuration files that get committed**
   - Use environment variables instead
   - Use placeholders in examples

### ✅ ALWAYS Do This:

1. **Generate tokens through SonarQube UI**
   - SonarCloud: https://sonarcloud.io/account/security
   - SonarQube Server: User → My Account → Security

2. **Store tokens in local files only**
   - Use the `.env` file in plugin directory (git-ignored)
   - Or in your shell configuration (`~/.zshrc`)
   - These files stay on your machine

3. **Use token expiration**
   - Set expiration dates when possible
   - Rotate tokens regularly
   - Revoke old tokens

4. **Generate separate tokens for different uses**
   - One for your laptop
   - One for CI/CD
   - One for each team member
   - Easier to revoke when needed

## How This Plugin Protects You

### Secure Configuration Process

1. **Claude creates a template** with placeholder text (`YOUR_TOKEN_HERE`)
2. **You edit the file locally** on your machine with your actual token
3. **Token never enters chat** - it stays in your local files
4. **`.env` is git-ignored** - can't accidentally commit it

### Built-in Safeguards

- ✅ `.gitignore` includes `.env` files by default
- ✅ Configuration skill never asks for tokens in chat
- ✅ Documentation emphasizes security throughout
- ✅ Template files use obvious placeholders
- ✅ Clear warnings at every step

## What If My Token Is Exposed?

If you accidentally expose your token (pasted in chat, committed to git, etc.):

### Immediate Actions:

1. **Revoke the token immediately**
   - SonarCloud: https://sonarcloud.io/account/security
   - SonarQube Server: User → My Account → Security

2. **Generate a new token**
   - Follow the same process
   - Update your `.env` file with new token

3. **Check for unauthorized access**
   - Review SonarQube audit logs
   - Look for unexpected activity
   - Notify your security team if needed

4. **If committed to git:**
   - Revoke token FIRST (can't undo git history easily)
   - Use tools like `git-filter-repo` to remove from history
   - Consider the repo compromised
   - Rotate all tokens that were in the repo

## Configuration File Security

### Files That Are Safe to Share/Commit:

✅ `.env.example` - Contains only placeholders
✅ `.mcp.json` - Contains only variable references
✅ `plugin.json` - Contains only configuration structure
✅ `CONFIGURATION.md` - Documentation only
✅ All other `.md` files - Documentation only

### Files That Must NEVER Be Shared/Committed:

❌ `.env` - Contains your actual token
❌ Any file with `YOUR_TOKEN_HERE` replaced with real token
❌ Shell config backups that include tokens

## Verification Checklist

Before sharing your plugin configuration:

- [ ] Check `.env` file is git-ignored
- [ ] Verify no tokens in any committed files
- [ ] Confirm `.env` uses the template
- [ ] Review git status for uncommitted sensitive files
- [ ] Check shell config doesn't have inline tokens (should source .env)

## Best Practices

### For Individual Users:

1. Use local `.env` file for configuration
2. Source `.env` from shell config
3. Use token expiration (30-90 days recommended)
4. Don't copy-paste tokens (use password manager if needed)
5. One token per machine/environment

### For Teams:

1. Each developer generates their own token
2. Share only `.env.example` template
3. Document the setup process
4. Use separate tokens for CI/CD
5. Regular token rotation policy
6. Audit token usage periodically

### For CI/CD:

1. Use CI/CD secrets management
2. Never store tokens in build scripts
3. Use dedicated "bot" or service account tokens
4. Rotate tokens regularly
5. Limit token permissions to minimum needed

## Questions?

If you have security concerns or questions:

1. Review this document first
2. Check [CONFIGURATION.md](./CONFIGURATION.md) for setup guidance
3. Contact your security team for organization-specific policies
4. Report security issues to: support@sonarsource.com

## Summary

🔐 **Golden Rule:** If you're about to paste your token anywhere other than a local file on your machine, STOP and reconsider.

The plugin is designed to keep your credentials secure. Follow these guidelines and you'll have a safe, secure configuration.
