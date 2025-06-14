# GitHub Secrets Setup

This document explains how to set up the required GitHub repository secrets for the CI/CD pipeline.

## 🚨 **Current Status**

**FALLBACK MODE**: The CI pipeline currently uses a fallback test secret when `JWT_SECRET_KEY` is not set. For production security, please set up the GitHub secret as described below.

## Required Secrets

### JWT_SECRET_KEY
This secret is used to generate JWT tokens for authentication during testing.

**Setting up JWT_SECRET_KEY:**

1. **Generate a secure secret key:**
   ```bash
   # Option 1: Using Python (recommended)
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   
   # Option 2: Using OpenSSL
   openssl rand -base64 32
   
   # Option 3: Use existing local secret
   cd backend && grep SECRET_KEY .env | cut -d'=' -f2
   ```

2. **Add the secret to GitHub:**
   - Go to your GitHub repository
   - Navigate to: **Settings** → **Secrets and variables** → **Actions**
   - Click **"New repository secret"**
   - **Name:** `JWT_SECRET_KEY`
   - **Value:** The secure secret key from step 1
   - Click **"Add secret"**

## ✅ **Verification After Setup**

Once the secret is configured, the CI logs should show:
- ✅ No "WARNING: SECRET_KEY not found" message
- ✅ JWT token generation uses the secure secret
- ✅ All tests pass with proper authentication

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
