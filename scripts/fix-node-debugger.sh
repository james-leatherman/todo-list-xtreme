#!/bin/bash

# Fix Node.js MODULE_NOT_FOUND error caused by VS Code debugger
# This script clears the problematic NODE_OPTIONS environment variable

echo "🔧 Fixing Node.js VS Code debugger conflict..."

# Check if NODE_OPTIONS contains the problematic bootloader
if [[ "$NODE_OPTIONS" == *"bootloader.js"* ]]; then
    echo "❌ Found problematic NODE_OPTIONS: $NODE_OPTIONS"
    
    # Clear NODE_OPTIONS
    unset NODE_OPTIONS
    export NODE_OPTIONS=""
    
    echo "✅ Cleared NODE_OPTIONS"
    
    # Add to bashrc to make it permanent
    if ! grep -q 'export NODE_OPTIONS=""' ~/.bashrc; then
        echo 'export NODE_OPTIONS=""' >> ~/.bashrc
        echo "✅ Added NODE_OPTIONS override to ~/.bashrc"
    fi
    
    echo "🧪 Testing Node.js..."
    node -e "console.log('Node.js is working properly!')"
    
    echo ""
    echo "✅ Fix complete! You can now run npm commands without the MODULE_NOT_FOUND error."
    echo ""
    echo "To test:"
    echo "  npm run test:backend"
    echo "  npm run test:frontend"
    
else
    echo "✅ NODE_OPTIONS is clean (no problematic bootloader found)"
    node -e "console.log('Node.js is working properly!')"
fi
