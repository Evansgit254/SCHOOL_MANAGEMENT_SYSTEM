#!/bin/bash

# Production Readiness Test Script
# This script tests your application before pushing to GitHub

set -e  # Exit on error

echo "🚀 Starting Production Readiness Tests..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to print test result
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}: $2"
        ((FAILED++))
    fi
    echo ""
}

# 1. Check if .env file exists
echo "📋 Test 1: Checking environment configuration..."
if [ -f .env ]; then
    test_result 0 ".env file exists"
else
    echo -e "${YELLOW}⚠ WARNING${NC}: .env file not found. Copy .env.example to .env"
    test_result 1 ".env file check"
fi

# 2. Check if node_modules exists
echo "📦 Test 2: Checking dependencies..."
if [ -d node_modules ]; then
    test_result 0 "Dependencies installed"
else
    echo "Installing dependencies..."
    npm install
    test_result $? "Dependency installation"
fi

# 3. Check for TypeScript errors
echo "🔍 Test 3: Running TypeScript check..."
npx tsc --noEmit > /dev/null 2>&1
test_result $? "TypeScript compilation"

# 4. Run ESLint
echo "🔍 Test 4: Running ESLint..."
npm run lint > /dev/null 2>&1
test_result $? "ESLint check"

# 5. Check Prisma schema
echo "🗄️  Test 5: Validating Prisma schema..."
npx prisma validate > /dev/null 2>&1
test_result $? "Prisma schema validation"

# 6. Check for hardcoded secrets
echo "🔒 Test 6: Checking for hardcoded secrets..."
if grep -r -E "(api[_-]?key|secret|password|token).*=.*['\"][a-zA-Z0-9]{20,}['\"]" src/ --exclude-dir=node_modules > /dev/null 2>&1; then
    test_result 1 "No hardcoded secrets (found potential secrets)"
else
    test_result 0 "No hardcoded secrets"
fi

# 7. Check for console.log without NODE_ENV check
echo "🐛 Test 7: Checking for unguarded console.log..."
if grep -r "console\.log" src/ --exclude-dir=node_modules | grep -v "NODE_ENV" | grep -v "//.*console\.log" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ WARNING${NC}: Found console.log statements without NODE_ENV check"
    test_result 1 "Console.log check"
else
    test_result 0 "Console.log properly guarded"
fi

# 8. Check if LICENSE exists
echo "📄 Test 8: Checking for LICENSE file..."
if [ -f LICENSE ]; then
    test_result 0 "LICENSE file exists"
else
    test_result 1 "LICENSE file missing"
fi

# 9. Check if .env.example exists
echo "📄 Test 9: Checking for .env.example..."
if [ -f .env.example ]; then
    test_result 0 ".env.example exists"
else
    test_result 1 ".env.example missing"
fi

# 10. Check if README.md exists and is not empty
echo "📄 Test 10: Checking README.md..."
if [ -f README.md ] && [ -s README.md ]; then
    test_result 0 "README.md exists and is not empty"
else
    test_result 1 "README.md missing or empty"
fi

# 11. Try to build the project
echo "🏗️  Test 11: Building production bundle..."
npm run build > /dev/null 2>&1
test_result $? "Production build"

# 12. Check for .gitignore
echo "📄 Test 12: Checking .gitignore..."
if [ -f .gitignore ]; then
    test_result 0 ".gitignore exists"
else
    test_result 1 ".gitignore missing"
fi

# 13. Check if .env is in .gitignore
echo "🔒 Test 13: Checking if .env is ignored..."
if grep -q "^\.env" .gitignore 2>/dev/null; then
    test_result 0 ".env is in .gitignore"
else
    test_result 1 ".env not in .gitignore"
fi

# 14. Check for large files that shouldn't be committed
echo "📦 Test 14: Checking for large files..."
LARGE_FILES=$(find . -type f -size +5M -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./.next/*" 2>/dev/null)
if [ -z "$LARGE_FILES" ]; then
    test_result 0 "No large files found"
else
    echo "Large files found:"
    echo "$LARGE_FILES"
    test_result 1 "Large files check"
fi

# 15. Check Docker configuration
echo "🐳 Test 15: Checking Docker configuration..."
if [ -f Dockerfile ] && [ -f docker-compose.yml ]; then
    test_result 0 "Docker files exist"
else
    test_result 1 "Docker files missing"
fi

# Summary
echo ""
echo "================================"
echo "📊 Test Summary"
echo "================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Your project is ready for GitHub.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review PRODUCTION_CHECKLIST.md"
    echo "2. git add ."
    echo "3. git commit -m 'Initial commit'"
    echo "4. git push origin main"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please fix the issues before pushing.${NC}"
    exit 1
fi
