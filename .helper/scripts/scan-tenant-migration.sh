#!/bin/bash

# Tenant System Migration Scanner
# Scans the codebase to identify files that still need tenant system migration

echo "🔍 Tenant System Migration Scanner"
echo "===================================="
echo ""

FRONTEND_DIR="my-app"
RESULTS_FILE=".helper/TENANT-MIGRATION-SCAN-RESULTS.md"

# Initialize results file
cat > "$RESULTS_FILE" << 'EOF'
# Tenant System Migration Scan Results

Generated on: $(date)

## Summary

This scan identifies files that still use the old `useSubaccountFilter` pattern
and need to be migrated to the new `useTenant` system.

---

EOF

echo "📊 Scanning for useSubaccountFilter usage..."
echo ""

# Find all files using useSubaccountFilter
FILES_WITH_OLD_PATTERN=$(grep -r "useSubaccountFilter" "$FRONTEND_DIR" --include="*.tsx" --include="*.ts" -l 2>/dev/null | grep -v "node_modules" | grep -v "/tenant-context.tsx" | grep -v "/subaccount-filter-context.tsx" | sort)

# Count total files
TOTAL_FILES=$(echo "$FILES_WITH_OLD_PATTERN" | grep -c '^' 2>/dev/null || echo "0")

echo "Found $TOTAL_FILES files still using useSubaccountFilter"
echo ""

# Categories
PAGES=()
COMPONENTS=()
DIALOGS=()
OTHER=()

# Categorize files
while IFS= read -r file; do
    if [[ -z "$file" ]]; then
        continue
    fi

    if [[ "$file" == *"/page.tsx" ]]; then
        PAGES+=("$file")
    elif [[ "$file" == *"dialog"* ]] || [[ "$file" == *"Dialog"* ]]; then
        DIALOGS+=("$file")
    elif [[ "$file" == *"/components/"* ]]; then
        COMPONENTS+=("$file")
    else
        OTHER+=("$file")
    fi
done <<< "$FILES_WITH_OLD_PATTERN"

# Write summary to results file
{
    echo "## Overview"
    echo ""
    echo "- **Total Files**: $TOTAL_FILES"
    echo "- **Pages**: ${#PAGES[@]}"
    echo "- **Components**: ${#COMPONENTS[@]}"
    echo "- **Dialogs**: ${#DIALOGS[@]}"
    echo "- **Other**: ${#OTHER[@]}"
    echo ""
    echo "---"
    echo ""
} >> "$RESULTS_FILE"

# Function to analyze a file
analyze_file() {
    local file="$1"
    local category="$2"

    # Get line number where useSubaccountFilter is used
    local line_num=$(grep -n "useSubaccountFilter" "$file" | head -1 | cut -d: -f1 | tr -d '\r\n')

    # Check if already imports useTenant
    local has_use_tenant=$(grep -c "useTenant" "$file" 2>/dev/null | tr -d '\r\n' || echo "0")

    # Count occurrences of getCurrentSubaccount
    local get_current_count=$(grep -c "getCurrentSubaccount" "$file" 2>/dev/null | tr -d '\r\n' || echo "0")

    # Count occurrences of currentFilter
    local current_filter_count=$(grep -c "currentFilter" "$file" 2>/dev/null | tr -d '\r\n' || echo "0")

    # Determine migration status
    local status="⚠️ Needs Migration"
    if [[ "$has_use_tenant" -gt 0 ]]; then
        status="🔄 Partial Migration (both hooks present)"
    fi

    # Get file size for complexity estimate
    local line_count=$(wc -l < "$file" 2>/dev/null | tr -d '\r\n ' || echo "0")
    local complexity="Simple"
    if [[ "$line_count" -gt 300 ]]; then
        complexity="Complex (${line_count} lines)"
    elif [[ "$line_count" -gt 150 ]]; then
        complexity="Medium (${line_count} lines)"
    else
        complexity="Simple (${line_count} lines)"
    fi

    echo "### $file"
    echo ""
    echo "- **Status**: $status"
    echo "- **Category**: $category"
    echo "- **Complexity**: $complexity"
    echo "- **Line**: $line_num"
    echo "- **getCurrentSubaccount calls**: $get_current_count"
    echo "- **currentFilter references**: $current_filter_count"
    echo ""

    # Show the actual usage
    echo "**Current Usage:**"
    echo '```typescript'
    grep -A 2 "useSubaccountFilter" "$file" | head -5
    echo '```'
    echo ""

    # Migration hint
    echo "**Migration Pattern:**"
    echo '```typescript'
    echo "// Replace:"
    echo "- import { useSubaccountFilter } from '@/contexts/subaccount-filter-context';"
    echo "- const { getCurrentSubaccount } = useSubaccountFilter();"
    echo ""
    echo "// With:"
    echo "+ import { useTenant } from '@/contexts/tenant-context';"
    echo "+ const { getTenantQueryParams } = useTenant();"
    echo '```'
    echo ""
    echo "---"
    echo ""
}

# Write Pages section
if [[ ${#PAGES[@]} -gt 0 ]]; then
    {
        echo "## 📄 Pages (${#PAGES[@]})"
        echo ""
        echo "List/detail pages that need migration:"
        echo ""
    } >> "$RESULTS_FILE"
fi

for file in "${PAGES[@]}"; do
    analyze_file "$file" "Page" >> "$RESULTS_FILE"
done

# Write Dialogs section
if [[ ${#DIALOGS[@]} -gt 0 ]]; then
    {
        echo "## 💬 Dialogs (${#DIALOGS[@]})"
        echo ""
        echo "Dialog components that fetch data:"
        echo ""
    } >> "$RESULTS_FILE"
fi

for file in "${DIALOGS[@]}"; do
    analyze_file "$file" "Dialog" >> "$RESULTS_FILE"
done

# Write Components section
if [[ ${#COMPONENTS[@]} -gt 0 ]]; then
    {
        echo "## 🧩 Components (${#COMPONENTS[@]})"
        echo ""
        echo "Other components that need migration:"
        echo ""
    } >> "$RESULTS_FILE"
fi

for file in "${COMPONENTS[@]}"; do
    analyze_file "$file" "Component" >> "$RESULTS_FILE"
done

# Write Other section
if [[ ${#OTHER[@]} -gt 0 ]]; then
    {
        echo "## 📁 Other Files (${#OTHER[@]})"
        echo ""
    } >> "$RESULTS_FILE"
fi

for file in "${OTHER[@]}"; do
    analyze_file "$file" "Other" >> "$RESULTS_FILE"
done

# Add migration checklist
{
    echo "## ✅ Migration Checklist"
    echo ""
    echo "Use this checklist to track your progress:"
    echo ""

    if [[ ${#PAGES[@]} -gt 0 ]]; then
        echo "### Pages"
        for file in "${PAGES[@]}"; do
            echo "- [ ] $file"
        done
        echo ""
    fi

    if [[ ${#DIALOGS[@]} -gt 0 ]]; then
        echo "### Dialogs"
        for file in "${DIALOGS[@]}"; do
            echo "- [ ] $file"
        done
        echo ""
    fi

    if [[ ${#COMPONENTS[@]} -gt 0 ]]; then
        echo "### Components"
        for file in "${COMPONENTS[@]}"; do
            echo "- [ ] $file"
        done
        echo ""
    fi

    if [[ ${#OTHER[@]} -gt 0 ]]; then
        echo "### Other"
        for file in "${OTHER[@]}"; do
            echo "- [ ] $file"
        done
        echo ""
    fi

    echo "---"
    echo ""
    echo "## 📚 Quick Reference"
    echo ""
    echo "### Standard Migration Pattern"
    echo ""
    echo '```typescript'
    echo "// 1. Update imports"
    echo "- import { useSubaccountFilter } from '@/contexts/subaccount-filter-context';"
    echo "+ import { useTenant } from '@/contexts/tenant-context';"
    echo ""
    echo "// 2. Update hook usage"
    echo "- const { getCurrentSubaccount } = useSubaccountFilter();"
    echo "+ const { getTenantQueryParams, subAccountId } = useTenant();"
    echo ""
    echo "// 3. Update API calls"
    echo "- const currentSubaccount = getCurrentSubaccount();"
    echo "- const data = await api.getData("
    echo "-   currentSubaccount ? { subAccountId: currentSubaccount.id } : undefined"
    echo "- );"
    echo "+ const data = await api.getData(getTenantQueryParams());"
    echo '```'
    echo ""
    echo "### For Admin Filter (Users, Dashboard)"
    echo ""
    echo '```typescript'
    echo "// Use adminFilter for APIs that expect the filter string directly"
    echo "const { adminFilter } = useTenant();"
    echo "const users = await api.adminAuth.getAllUsers(adminFilter);"
    echo '```'
    echo ""
    echo "---"
    echo ""
    echo "## 🎯 Priority Order"
    echo ""
    echo "Recommended migration order:"
    echo ""
    echo "1. **High Priority** - Pages users interact with most:"
    echo "   - forms/submissions/page.tsx"
    echo "   - Any frequently used list pages"
    echo ""
    echo "2. **Medium Priority** - Create/Edit pages:"
    echo "   - leads/new/page.tsx"
    echo "   - strategies/new/page.tsx"
    echo "   - Edit pages for main entities"
    echo ""
    echo "3. **Low Priority** - Dialogs and less-used components"
    echo ""
    echo "---"
    echo ""
    echo "Generated by: scan-tenant-migration.sh"
} >> "$RESULTS_FILE"

# Console output
echo "✅ Scan complete!"
echo ""
echo "📊 Results Summary:"
echo "  - Pages: ${#PAGES[@]}"
echo "  - Dialogs: ${#DIALOGS[@]}"
echo "  - Components: ${#COMPONENTS[@]}"
echo "  - Other: ${#OTHER[@]}"
echo ""
echo "📝 Detailed results saved to: $RESULTS_FILE"
echo ""

# Display critical files
if [[ ${#PAGES[@]} -gt 0 ]]; then
    echo "🚨 Critical Pages to Migrate:"
    for file in "${PAGES[@]}"; do
        echo "   - $file"
    done
    echo ""
fi

echo "💡 Run: cat $RESULTS_FILE"
echo "   to view the full migration guide"
echo ""
