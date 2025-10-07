# GitHub Webhook Setup Guide

## 🎯 Overview
This guide shows how to set up GitHub webhooks to automatically sync PRs and commits with your PM system.

## 🔧 Setup Steps

### 1. Deploy Your App
First, make sure your app is deployed and accessible via HTTPS:
```bash
# Example with Vercel
vercel --prod

# Your webhook URL will be:
# https://your-app.vercel.app/api/webhooks/github
```

### 2. Create GitHub Webhook

1. **Go to your GitHub repository**
2. **Click Settings → Webhooks → Add webhook**
3. **Configure the webhook:**
   - **Payload URL**: `https://your-app.vercel.app/api/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: (optional, but recommended for security)
   - **Events**: Select individual events:
     - ✅ Pull requests
     - ✅ Pushes
     - ✅ Create (branches)
     - ✅ Delete (branches)

### 3. Link Repository to Project

In your PM system:
1. **Go to Organization page**
2. **Edit a project**
3. **Add GitHub repository info:**
   - **GitHub Repo URL**: `https://github.com/owner/repo`
   - **GitHub Repo Name**: `owner/repo`

### 4. Test the Integration

1. **Create a branch** with a ticket reference:
   ```bash
   git checkout -b feature/TICKET-123-user-auth
   ```

2. **Make commits** with ticket references:
   ```bash
   git commit -m "TICKET-123: Add user authentication logic"
   ```

3. **Create a PR** with ticket reference:
   ```
   Title: Fix user authentication bug
   Body: This PR fixes the login issue. Closes TICKET-123
   ```

## 🎯 How It Works

### Automatic Ticket Linking
The system automatically links GitHub activity to tickets by looking for:

- **In PR titles/descriptions:**
  - `Closes TICKET-123`
  - `Fixes TICKET-123` 
  - `Resolves TICKET-123`
  - `Refs TICKET-123`
  - `TICKET-123` (anywhere)
  - `[TICKET-123]` (bracketed)

- **In commit messages:**
  - Same patterns as above

- **In branch names:**
  - `feature/TICKET-123-description`
  - `fix/TICKET-123`

### Automatic Status Updates
- **PR opened** → Ticket status unchanged
- **PR merged** → Ticket status changed to "Done" (if linked)
- **Commits pushed** → Logged in activity feed

### What Gets Tracked
- **🌿 Branches**: Created automatically from commits/PRs
- **🔀 Pull Requests**: Title, body, state, author, stats
- **📝 Commits**: Message, author, file changes, stats
- **🔗 Ticket Links**: Automatic linking based on references
- **📊 Activity Logs**: All GitHub activity logged to project

## 🎨 UI Features

### GitHub Tab
- **Pull Requests view**: All PRs with status, stats, linked tickets
- **Commits view**: Recent commits with branch info, linked tickets
- **Real-time updates**: Automatically refreshes when webhooks fire

### Ticket Integration
- **Manual GitHub URLs**: Add any GitHub URL to tickets
- **Automatic linking**: PRs/commits automatically link to tickets
- **Status sync**: Merged PRs can auto-complete tickets

## 🔍 Troubleshooting

### Webhook Not Firing
1. Check webhook delivery in GitHub Settings → Webhooks
2. Look for error responses or failed deliveries
3. Verify your app is accessible via HTTPS

### Repository Not Found
1. Ensure `githubRepoName` matches exactly: `owner/repo`
2. Check project has correct GitHub repo info
3. Repository name is case-sensitive

### Tickets Not Linking
1. Verify ticket names match the references (case-insensitive)
2. Check ticket references use supported patterns
3. Look in browser console for any errors

### Testing Webhook Locally
```bash
# Use ngrok to expose local server
ngrok http 3000

# Use the ngrok URL as webhook URL:
# https://abc123.ngrok.io/api/webhooks/github
```

## 🎯 Example Workflow

1. **Developer creates branch**: `feature/TICKET-123-user-login`
2. **Makes commits**: `"TICKET-123: Add login form validation"`
3. **Creates PR**: `"Fix user login validation - Closes TICKET-123"`
4. **PM sees in GitHub tab**: 
   - New branch created
   - Commits pushed
   - PR opened and linked to TICKET-123
5. **PR gets merged**: TICKET-123 automatically marked as "Done"
6. **All activity logged**: Complete audit trail in Activity tab

## 🚀 Benefits

- **🔄 Automatic sync**: No manual linking needed
- **📊 Complete visibility**: See all development activity
- **🎯 Smart linking**: AI-like ticket detection
- **⚡ Real-time updates**: Instant UI updates via webhooks
- **📝 Audit trail**: Every GitHub action logged
- **🎨 Rich UI**: Beautiful GitHub activity dashboard

The integration is now ready! Your GitHub activity will automatically appear in the PM system. 🎉
