# GitHub Secrets Setup

This document explains how to set up the required GitHub repository secrets for the CI/CD pipeline.

## Required Secrets

### JWT_SECRET_KEY
This secret is used to generate JWT tokens for authentication during testing.

**Setting up JWT_SECRET_KEY:**

1. **Get the secret key from your local environment:**
   ```bash
   # Navigate to the backend directory
   cd backend
   
   # View the SECRET_KEY from your .env file
   grep SECRET_KEY .env
   ```

2. **Add the secret to GitHub:**
   - Go to your GitHub repository
   - Navigate to: **Settings** → **Secrets and variables** → **Actions**
   - Click **"New repository secret"**
   - **Name:** `JWT_SECRET_KEY`
   - **Value:** The SECRET_KEY value from your backend/.env file
   - Click **"Add secret"**

## Optional Secrets

### Database Configuration (if different from defaults)
- `DB_USER` - PostgreSQL username (defaults to 'postgres')
- `DB_PASSWORD` - PostgreSQL password (defaults to 'postgres')

## Verification

After setting up the secrets, you can verify they work by:

1. **Triggering a CI run:**
   - Push a commit to the main branch
   - Or create a pull request

2. **Check the GitHub Actions logs:**
   - Go to the **Actions** tab in your repository
   - Look for successful test runs without "SKIPPED" messages

## Security Best Practices

✅ **DO:**
- Use GitHub repository secrets for sensitive values
- Rotate secrets periodically
- Use different secrets for different environments (dev/staging/prod)

❌ **DON'T:**
- Hardcode secrets in source code
- Share secrets in plain text
- Use the same secrets across multiple projects

## Troubleshooting

**Problem:** Tests are skipped with "TEST_AUTH_TOKEN environment variable not set"
**Solution:** Ensure `JWT_SECRET_KEY` secret is properly set in GitHub repository settings

**Problem:** "SECRET_KEY environment variable not set" error in CI
**Solution:** Check that the secret name is exactly `JWT_SECRET_KEY` (case-sensitive)

**Problem:** Authentication errors during tests
**Solution:** Verify the `JWT_SECRET_KEY` value matches your local backend/.env SECRET_KEY exactly
