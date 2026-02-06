# SonarQube Cloud vs Server Configuration

Quick reference guide for configuring the plugin with different SonarQube types.

## Quick Comparison

| Feature | SonarQube Cloud | SonarQube Server |
|---------|----------------|------------------|
| **URL** | `https://sonarcloud.io` (EU - Default)<br>`https://sonarqube.us` (US region) | Your server URL (variable) |
| **Organization** | ✅ **Required** | ❌ Not used |
| **Token Location** | sonarcloud.io/account/security (Default)<br>sonarqube.us/account/security (US only) | Your Server → User → My Account → Security |

**Note:** Most SonarQube Cloud users are on the EU region (sonarcloud.io).

## Configuration Examples

### SonarQube Cloud

**Default (EU Region - Most Users):**
```bash
# .env file
export SONARQUBE_URL="https://sonarcloud.io"
export SONARQUBE_ORG="my-organization"
export SONARQUBE_TOKEN="abc123..."
```

**US Region (If you access sonarqube.us):**
```bash
# .env file
export SONARQUBE_URL="https://sonarqube.us"
export SONARQUBE_ORG="my-organization"
export SONARQUBE_TOKEN="abc123..."
```

**Required Variables:**
- ✅ `SONARQUBE_URL` - `https://sonarcloud.io` (default) or `https://sonarqube.us` (US only)
- ✅ `SONARQUBE_ORG` - Your organization key
- ✅ `SONARQUBE_TOKEN` - Your user token

### SonarQube Server

```bash
# .env file
export SONARQUBE_URL="http://localhost:9000"
export SONARQUBE_TOKEN="xyz789..."
```

**Required Variables:**
- ✅ `SONARQUBE_URL` - Your server URL
- ✅ `SONARQUBE_TOKEN` - Your user token
- ❌ `SONARQUBE_ORG` - Not used

## How to Tell Which One You Have

### You have SonarQube Cloud if:
- You access it at https://sonarcloud.io (most common) or https://sonarqube.us (US region)
- You see "organizations" in the URL or interface
- You signed up through their cloud service
- Your projects are under an organization

**Region:** If you're not sure, you're probably on EU (sonarcloud.io) - it's the default.

### You have SonarQube Server if:
- You access it through a custom URL (e.g., `http://localhost:9000`)
- Your company/team hosts it internally
- You installed SonarQube yourself or via Docker
- You don't see organization keys

## Common Issues

### ❌ "Missing environment variables: SONARQUBE_ORG"

**Problem:** You're connecting to SonarQube Cloud but didn't provide the organization key.

**Solution:**
```bash
# Add to your .env file
export SONARQUBE_ORG="your-org-key"
```

### ❌ Connection fails with organization set

**Problem:** You're connecting to SonarQube Server but set `SONARQUBE_ORG`.

**Solution:**
```bash
# Remove SONARQUBE_ORG from your .env file
# Only use for SonarQube Cloud
```

### ❌ "Invalid token" on SonarCloud

**Problem:** Using a token from SonarQube Server on SonarCloud, wrong region, or vice versa.

**Solution:** Generate a new token from the correct location:
- Cloud EU: https://sonarcloud.io/account/security
- Cloud US: https://sonarqube.us/account/security
- Server: Your server's security page

**Note:** Tokens are region-specific for Cloud. An EU token won't work with the US region and vice versa.

## Still Confused?

Just ask Claude:
```
"Help me configure my SonarQube credentials"
```

Claude will ask which type you're using and guide you through the correct setup!
