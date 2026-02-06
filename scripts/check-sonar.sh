#!/bin/bash

# Check if SonarLint CLI or SonarScanner is available
if command -v sonarlint &> /dev/null; then
    echo "✓ SonarLint detected, checking modified files..."
    # Add SonarLint check logic here
elif command -v sonar-scanner &> /dev/null; then
    echo "✓ SonarScanner detected"
    # Add SonarScanner logic here
else
    echo "⚠ SonarLint/SonarScanner not found. Install SonarLint for automatic checks."
    exit 0
fi
