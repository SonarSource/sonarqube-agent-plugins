#!/bin/bash

echo "🔍 Setting up SonarQube plugin for Claude Code..."
echo ""

# Get the plugin directory
PLUGIN_DIR="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
ENV_FILE="$PLUGIN_DIR/.env"

# Function to check and load environment variables
check_env_vars() {
    # Try to load from .env file if it exists
    if [ -f "$ENV_FILE" ]; then
        source "$ENV_FILE"
    fi
    
    # Check if basic variables are set
    if [ -z "$SONARQUBE_TOKEN" ] || [ -z "$SONARQUBE_URL" ]; then
        return 1
    fi
    
    # Check if Cloud requires organization (both EU and US regions)
    if { [ "$SONARQUBE_URL" = "https://sonarcloud.io" ] || [ "$SONARQUBE_URL" = "https://sonarqube.us" ]; } && [ -z "$SONARQUBE_ORG" ]; then
        return 2  # Cloud without org
    fi
    
    return 0
}

# Check environment variables
check_env_vars
ENV_STATUS=$?

if [ $ENV_STATUS -eq 0 ]; then
    echo "✓ SonarQube credentials configured"
    echo "  URL: $SONARQUBE_URL"
    if [ "$SONARQUBE_URL" = "https://sonarcloud.io" ] || [ "$SONARQUBE_URL" = "https://sonarqube.us" ]; then
        echo "  Organization: $SONARQUBE_ORG"
        if [ "$SONARQUBE_URL" = "https://sonarqube.us" ]; then
            echo "  Type: SonarQube Cloud (US)"
        else
            echo "  Type: SonarQube Cloud (EU)"
        fi
    else
        echo "  Type: SonarQube Server"
    fi
    echo ""
    echo "💡 Tip: To ensure MCP server has access, add credentials to your shell config:"
    echo "   source \"$ENV_FILE\" in your ~/.zshrc"
elif [ $ENV_STATUS -eq 2 ]; then
    echo "⚠️  SonarQube Cloud requires organization key"
    echo ""
    echo "📝 To configure, ask Claude:"
    echo "   'Help me configure my SonarQube credentials'"
    echo ""
    echo "Or add to $ENV_FILE:"
    echo "   export SONARQUBE_ORG=your-org-key"
    echo ""
else
    echo "⚠️  SonarQube credentials not configured"
    echo ""
    echo "📝 To configure, ask Claude:"
    echo "   'Help me configure my SonarQube credentials'"
    echo ""
    echo "Or manually create $ENV_FILE with:"
    echo ""
    echo "   For SonarQube Cloud (Default - EU):"
    echo "     export SONARQUBE_URL=https://sonarcloud.io"
    echo "     export SONARQUBE_ORG=your-org-key"
    echo "     export SONARQUBE_TOKEN=your-token"
    echo ""
    echo "   For SonarQube Cloud (US Region only):"
    echo "     export SONARQUBE_URL=https://sonarqube.us"
    echo "     export SONARQUBE_ORG=your-org-key"
    echo "     export SONARQUBE_TOKEN=your-token"
    echo ""
    echo "   For SonarQube Server:"
    echo "     export SONARQUBE_URL=your-server-url"
    echo "     export SONARQUBE_TOKEN=your-token"
    echo ""
fi

echo ""

# Check for SonarLint
if command -v sonarlint &> /dev/null; then
    echo "✓ SonarLint CLI found: $(sonarlint --version)"
else
    echo "⚠ SonarLint CLI not found"
    echo "  Install: npm install -g sonarlint-cli"
fi

# Check for SonarScanner
if command -v sonar-scanner &> /dev/null; then
    echo "✓ SonarScanner found: $(sonar-scanner --version | head -n 1)"
else
    echo "⚠ SonarScanner not found"
    echo "  Download: https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/"
fi

# Check for sonar-project.properties
if [ -f "sonar-project.properties" ]; then
    echo "✓ sonar-project.properties found"
else
    echo "ℹ No sonar-project.properties found (optional)"
fi

echo ""
echo "✓ SonarQube plugin ready!"
echo ""
echo "Available skills:"
echo "  @sonarqube:analyze       - Analyze code quality"
echo "  @sonarqube:fix-issue     - Fix a specific issue"
echo "  @sonarqube:explain-rule  - Explain a rule"
