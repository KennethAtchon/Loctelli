# Pre-Migration Checklist

## Overview

Before starting the migration, complete this checklist to ensure a smooth transition. This phase is critical for identifying potential issues and preparing your environment.

## 1. Codebase Backup

### Create Backup

```bash
# Create a backup branch
git checkout -b backup/pre-migration-$(date +%Y%m%d)
git push origin backup/pre-migration-$(date +%Y%m%d)

# Or create a full backup
cp -r frontend frontend-backup-$(date +%Y%m%d)
```

### Verify Backup

- [ ] Backup branch created and pushed
- [ ] All uncommitted changes are committed
- [ ] Current state is tagged: `git tag pre-migration-v1.0`

## 2. Dependency Audit

### Current Dependency Versions

```bash
cd frontend
pnpm list --depth=0 > dependency-audit-$(date +%Y%m%d).txt
```

### Check for Updates

```bash
# Check outdated packages
pnpm outdated

# Check for security vulnerabilities
pnpm audit
```

### Document Findings

- [ ] List all outdated packages
- [ ] Identify breaking changes in major version updates
- [ ] Document security vulnerabilities
- [ ] Note any deprecated packages

### Key Dependencies to Audit

- [ ] `next@^15.4.7` - Check Next.js 15 breaking changes
- [ ] `react@^19.2.1` - Check React 19 breaking changes
- [ ] `@tanstack/react-query@^5.62.11` - Check React Query changes
- [ ] `react-hook-form@^7.54.1` - Check form library updates
- [ ] `tailwindcss@^4.0.0` - Check Tailwind v4 migration guide
- [ ] All `@radix-ui/*` packages - Check for version consistency

## 3. Environment Variables Documentation

### Document Current Environment Variables

```bash
# Check environment files
cat .env.local 2>/dev/null || echo "No .env.local"
cat .env.development 2>/dev/null || echo "No .env.development"
cat .env.production 2>/dev/null || echo "No .env.production"
```

### Required Variables

Document all environment variables used in:

- [ ] `lib/utils/envUtils.ts`
- [ ] `next.config.ts`
- [ ] `app/api/proxy/` routes
- [ ] Any component using `process.env`

### Environment Variable Checklist

- [ ] `NEXT_PUBLIC_API_URL` - Backend API URL
- [ ] Any other `NEXT_PUBLIC_*` variables
- [ ] Server-side only variables
- [ ] Build-time variables

## 4. Configuration Files Review

### Review Current Configurations

- [ ] `package.json` - Scripts and dependencies
- [ ] `tsconfig.json` - TypeScript configuration
- [ ] `next.config.ts` - Next.js configuration
- [ ] `tailwind.config.js` or `postcss.config.mjs` - Styling config
- [ ] `jest.config.js` - Test configuration
- [ ] `eslint.config.mjs` - Linting configuration
- [ ] `components.json` - Shadcn/ui configuration

### Document Custom Configurations

- [ ] Note any custom webpack configurations
- [ ] Document custom image optimization settings
- [ ] Note any experimental features enabled
- [ ] Document custom headers or redirects

## 5. Codebase Analysis

### File Structure Analysis

```bash
# Count files by type
find . -name "*.tsx" | wc -l
find . -name "*.ts" | wc -l
find . -name "*.test.ts" | wc -l
find . -name "*.test.tsx" | wc -l
```

### Component Inventory

- [ ] List all components in `components/` directory
- [ ] Document component dependencies
- [ ] Note any third-party component libraries
- [ ] Identify custom hooks

### API Integration Points

- [ ] List all API endpoints used
- [ ] Document API client usage patterns
- [ ] Note any custom API middleware
- [ ] Document authentication flow

## 6. Testing Status

### Current Test Coverage

```bash
# Run tests to establish baseline
pnpm test:coverage
```

### Test Inventory

- [ ] Count total test files
- [ ] Document test utilities
- [ ] Note any test mocks or fixtures
- [ ] Check MSW (Mock Service Worker) setup

### Test Results

- [ ] All tests passing before migration
- [ ] Document any flaky tests
- [ ] Note any skipped tests

## 7. Build Verification

### Current Build Status

```bash
# Test production build
pnpm run build

# Check build output
ls -la .next/
```

### Build Checklist

- [ ] Production build succeeds
- [ ] No TypeScript errors
- [ ] No ESLint errors (if enabled)
- [ ] Build output size documented
- [ ] Build time documented

## 8. Runtime Dependencies

### Node.js Version

```bash
node --version
# Should be Node.js 20+ for Next.js 15
```

- [ ] Node.js version compatible (20+)
- [ ] pnpm version compatible
- [ ] Docker version (if using containers)

### System Requirements

- [ ] Sufficient disk space for node_modules
- [ ] Network access for package downloads
- [ ] Access to private registries (if any)

## 9. Migration Branch Setup

### Create Migration Branch

```bash
git checkout -b migration/frontend-upgrade
git push -u origin migration/frontend-upgrade
```

- [ ] Migration branch created
- [ ] Branch pushed to remote
- [ ] Team notified of migration branch

## 10. Documentation Review

### Review Existing Documentation

- [ ] `README.md` - Current setup instructions
- [ ] `AI_CONTEXT.md` - System architecture
- [ ] Any migration guides from dependencies
- [ ] Changelogs for major dependencies

### Create Migration Log

Create a file to track migration progress:

```bash
touch migration/migration-log.md
```

## 11. Team Communication

### Notify Team

- [ ] Inform team about migration timeline
- [ ] Schedule migration window (if needed)
- [ ] Document rollback procedure
- [ ] Set up communication channel for issues

## 12. Rollback Plan

### Rollback Preparation

- [ ] Document rollback steps
- [ ] Test rollback procedure
- [ ] Ensure backup is accessible
- [ ] Document data migration requirements (if any)

## 13. Migration Tools

### Required Tools

- [ ] Git for version control
- [ ] pnpm for package management
- [ ] Code editor with TypeScript support
- [ ] Browser DevTools for debugging
- [ ] API testing tool (Postman/Insomnia)

## 14. Pre-Migration Testing

### Smoke Tests

Create a list of critical user flows to test after migration:

- [ ] User login/registration
- [ ] Admin login/registration
- [ ] Dashboard loading
- [ ] API calls working
- [ ] Form submissions
- [ ] Navigation
- [ ] Theme switching (if applicable)

## Completion Checklist

Before proceeding to the next phase:

- [ ] All items above completed
- [ ] Backup verified and accessible
- [ ] Dependencies audited
- [ ] Environment variables documented
- [ ] Migration branch created
- [ ] Team notified
- [ ] Rollback plan ready

## Next Steps

Once this checklist is complete, proceed to:

- **[02-dependencies-migration.md](./02-dependencies-migration.md)** - Start migrating dependencies

## Notes

Document any issues or concerns discovered during this phase:

```
[Add your notes here]
```
