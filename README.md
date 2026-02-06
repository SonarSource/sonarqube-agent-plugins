# SonarQube Plugin for Claude Code

Integrate SonarQube and SonarLint code quality analysis directly into your Claude Code workflow.

## Features

- **Code Analysis**: Run SonarQube/SonarLint analysis on your codebase
- **Issue Fixing**: Automatically fix code quality issues following SonarQube rules
- **Rule Explanation**: Get detailed explanations of SonarQube rules
- **Automatic Checks**: Post-edit hooks to check code quality after modifications

## Installation

### Prerequisites

Install SonarLint CLI or SonarScanner:

```bash
# SonarLint CLI (recommended for quick checks)
npm install -g sonarlint-cli

# OR SonarScanner (for full analysis)
# Download from: https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/
```

### Add Plugin to Claude Code

```bash
# From GitHub (once published)
/plugin marketplace add SonarSource/sonar-claude-code-plugin

# Local development
claude --plugin-dir ./path/to/sonar-claude-code-plugin
```

## Usage

### Analyze Code Quality

```bash
# Analyze entire project
/sonarqube:analyze

# Analyze specific files
/sonarqube:analyze src/main/java/MyClass.java

# Analyze directory
/sonarqube:analyze src/main/java/
```

### Fix Issues

```bash
# Fix by rule key and location
/sonarqube:fix-issue java:S1481 src/main/java/MyClass.java:42

# Fix by description
/sonarqube:fix-issue Remove unused variable in MyClass.java
```

### Understand Rules

```bash
# Explain a specific rule
/sonarqube:explain-rule java:S1481

# Search by description
/sonarqube:explain-rule unused local variables
```

## Configuration

### Setup SonarQube Credentials

🔒 **Security First:** This plugin uses a secure configuration process where **you never paste your access token in chat**. 

When you first use the plugin, simply ask:

```
"Help me configure my SonarQube credentials"
```

Claude will create a configuration template and guide you to add your token securely in a local file.

Claude will guide you through configuring for either:

**SonarQube Cloud:**
- URL: `https://sonarcloud.io` (default EU region, or `https://sonarqube.us` for US)
- Organization key (required)
- Access token

**SonarQube Server:**
- Your server URL (e.g., `http://localhost:9000`)
- Access token (organization not needed)

**Manual Configuration** (alternative):

Create a `.env` file in the plugin directory and restart Claude Code:

**For SonarQube Cloud (most users - EU region):**
```bash
export SONARQUBE_URL="https://sonarcloud.io"
export SONARQUBE_ORG="your-org-key"
export SONARQUBE_TOKEN="your-token"
```

**For SonarQube Cloud US region (if applicable):**
```bash
export SONARQUBE_URL="https://sonarqube.us"
export SONARQUBE_ORG="your-org-key"
export SONARQUBE_TOKEN="your-token"
```

**For SonarQube Server:**
```bash
export SONARQUBE_URL="http://localhost:9000"
export SONARQUBE_TOKEN="your-token"
```

✨ **No shell configuration needed!** The plugin automatically loads the `.env` file when starting.

**Generate a Token:**
- **SonarCloud EU:** https://sonarcloud.io/account/security
- **SonarCloud US:** https://sonarqube.us/account/security
- **SonarQube Server:** User → My Account → Security → Generate Tokens

**Not sure which one you have?** See [CLOUD_VS_SERVER.md](./CLOUD_VS_SERVER.md) for a detailed comparison.

**Documentation:**
- [CONFIGURATION.md](./CONFIGURATION.md) - Complete configuration guide
- [SECURITY.md](./SECURITY.md) - Security best practices (read this first!)
- [MCP_CONFIG.md](./MCP_CONFIG.md) - How the MCP server configuration works
- [CLOUD_VS_SERVER.md](./CLOUD_VS_SERVER.md) - Cloud vs Server comparison

### Optional: sonar-project.properties

Create a `sonar-project.properties` file in your project root:

```properties
sonar.projectKey=my-project
sonar.projectName=My Project
sonar.projectVersion=1.0
sonar.sources=src
sonar.sourceEncoding=UTF-8
```

## Automatic Hooks

The plugin automatically checks modified files after Write/Edit operations. To disable:

In `.claude/settings.json`
```json
{
  "disabledHooks": {
    "sonarqube": ["PostToolUse"]
  }
}
```

## Development

### Project Structure

```
sonar-claude-code-plugin/
├── .claude-plugin/
│   └── plugin.json           # Plugin manifest
├── skills/                   # Agent skills
│   ├── analyze/
│   ├── fix-issue/
│   └── explain-rule/
├── hooks/
│   └── hooks.json           # Event hooks
├── scripts/                 # Shell scripts
│   ├── setup.sh
│   └── check-sonar.sh
└── README.md
```

### Testing Locally

```bash
claude --plugin-dir .
```

## Contributing

Contributions are welcome! Please read our contributing guidelines.

## License

LGPL-3.0

## Support

- Documentation: https://docs.sonarsource.com
- Issues: https://github.com/SonarSource/sonar-claude-code-plugin/issues
