# Google OAuth Setup Guide

This guide explains how to configure Google OAuth authentication for the Student Marketplace application.

## Overview

The application uses Supabase's built-in Google OAuth provider, which handles the OAuth flow securely. This means you need to configure Google OAuth in **two places**:

1. Google Cloud Console (to create OAuth credentials)
2. Supabase Dashboard (to enable Google as an auth provider)

---

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**

### 1.2 Configure OAuth Consent Screen

1. Click **OAuth consent screen** in the left sidebar
2. Select **External** user type (unless you have Google Workspace)
3. Fill in the required fields:
   - **App name**: Student Marketplace
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Click **Save and Continue**
5. On the **Scopes** page, add these scopes:
   - `email`
   - `profile`
   - `openid`
6. Click **Save and Continue**
7. Add test users if in testing mode, then **Save and Continue**

### 1.3 Create OAuth Client ID

1. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
2. Select **Web application**
3. Name it: `Student Marketplace Web Client`
4. Add **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```
5. Add **Authorized redirect URIs**:
   ```
   https://bfpaawywaljnfudynnke.supabase.co/auth/v1/callback
   ```
   *(This is your Supabase project's callback URL)*

6. Click **Create**
7. **Save your Client ID and Client Secret** - you'll need these for Supabase

---

## Step 2: Configure Supabase

### 2.1 Enable Google Provider in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** and click to expand
5. Toggle **Enable Sign in with Google** to ON
6. Enter your credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
7. Click **Save**

### 2.2 Configure Redirect URLs

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Set the **Site URL**:
   - For local development: `http://localhost:3000`
   - For production: `https://your-domain.com`
3. Add **Redirect URLs** (one per line):
   ```
   http://localhost:3000/auth/callback
   https://your-domain.com/auth/callback
   ```
4. Click **Save**

---

## Step 3: Environment Variables

Add these to your `.env` or `ini.env` file:

```env
# Site URL for OAuth redirects
SITE_URL=http://localhost:3000

# For production, use your actual domain:
# SITE_URL=https://your-domain.com
```

For Vercel deployment, add `SITE_URL` in **Project Settings** → **Environment Variables**.

---

## Step 4: Test the Integration

### Local Testing

1. Start your server:
   ```bash
   npm start
   ```

2. Go to `http://localhost:3000`

3. Click **"Continue with Google"**

4. You should be redirected to Google's consent screen

5. After authorization, you'll be redirected back and signed in

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "redirect_uri_mismatch" | Ensure the redirect URI in Google Console exactly matches Supabase's callback URL |
| "Invalid client" | Double-check Client ID and Secret in Supabase settings |
| Tokens not received | Check browser console for errors, ensure callback page loads |
| User not created in database | Check server logs for student table insert errors |

---

## How It Works

### Authentication Flow

```
1. User clicks "Continue with Google"
           ↓
2. Frontend calls GET /api/auth/google/url
           ↓
3. Backend returns Supabase OAuth URL
           ↓
4. User redirected to Google consent screen
           ↓
5. User authorizes, Google redirects to Supabase
           ↓
6. Supabase processes tokens, redirects to /auth/callback
           ↓
7. auth-callback.html extracts tokens from URL hash
           ↓
8. Frontend sends tokens to POST /auth/google/callback
           ↓
9. Backend sets session, creates/updates student profile
           ↓
10. User redirected to landing page, logged in
```

### Files Modified

| File | Purpose |
|------|---------|
| `server.js` | OAuth endpoints: `/auth/google`, `/auth/callback`, `/auth/google/callback` |
| `public/views/auth-callback.html` | Handles OAuth redirect, extracts tokens |
| `public/login_signup.js` | Triggers Google OAuth flow |

---

## Security Considerations

1. **Never expose your Client Secret** in frontend code
2. **Use HTTPS in production** - Google requires it for OAuth
3. **Validate tokens on the backend** - The server verifies tokens with Supabase
4. **Session management** - Tokens are stored in localStorage for persistence

---

## User Data Synced from Google

When a user signs in with Google, the following data is synced:

| Field | Source |
|-------|--------|
| `first_name` | Google's `given_name` or first part of `full_name` |
| `last_name` | Google's `family_name` or remaining parts of `full_name` |
| `profile_picture` | Google's `avatar_url` or `picture` |

The user's email is stored in Supabase Auth and can be accessed via the session.

---

## Production Checklist

- [ ] Google OAuth app is out of testing mode (or all users are added as testers)
- [ ] Production domain added to Google Console authorized origins
- [ ] Production callback URL added to Google Console redirect URIs
- [ ] `SITE_URL` environment variable set to production URL
- [ ] Production URL added to Supabase redirect URLs
- [ ] HTTPS enabled on production domain
