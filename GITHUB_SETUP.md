# 🚀 GitHub Integration Setup Guide

## Overview
This guide will help you set up the GitHub integration to make it fully functional with real GitHub OAuth and API calls.

## Prerequisites
- Node.js and npm installed
- A GitHub account
- Basic knowledge of GitHub OAuth apps

## Step 1: Create GitHub OAuth App

### 1.1 Go to GitHub Developer Settings
1. Visit [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "OAuth Apps" in the left sidebar
3. Click "New OAuth App"

### 1.2 Configure OAuth App
Fill in the following details:

```
Application name: Bilda
Homepage URL: http://localhost:8080
Application description: A social platform for tracking and sharing build sessions
Authorization callback URL: http://localhost:8080/auth/github/callback
```

### 1.3 Save and Note Credentials
After creating the app, you'll get:
- **Client ID** (public)
- **Client Secret** (keep this private!)

## Step 2: Set Up Environment Variables

### 2.1 Frontend Environment (.env)
Create a `.env` file in the root directory:

```env
VITE_GITHUB_CLIENT_ID=your_github_client_id_here
VITE_GITHUB_REDIRECT_URI=http://localhost:8080/auth/github/callback
```

### 2.2 Backend Environment (.env)
Create a `.env` file in the `server/` directory:

```env
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
PORT=3001
```

## Step 3: Install Backend Dependencies

```bash
cd server
npm install
```

## Step 4: Start the Backend Server

```bash
cd server
npm run dev
```

The server will start on `http://localhost:3001`

## Step 5: Update Frontend API Base URL

Update the GitHub service to use the correct API base URL:

```typescript
// In src/lib/github.ts, update the API calls to use the backend server
const API_BASE_URL = 'http://localhost:3001';

// Update the handleCallback method:
const response = await fetch(`${API_BASE_URL}/api/github/oauth/callback`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ code }),
});
```

## Step 6: Handle OAuth Callback

Create a callback page to handle the GitHub OAuth redirect:

### 6.1 Create Callback Component
Create `src/pages/GitHubCallback.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { githubService } from '@/lib/github';

const GitHubCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code || !state) {
        setStatus('error');
        return;
      }

      try {
        const success = await githubService.handleCallback(code, state);
        if (success) {
          setStatus('success');
          // Redirect back to the page they came from
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('GitHub callback error:', error);
        setStatus('error');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <h2 className="mt-6 text-3xl font-bold text-gray-900">Connecting to GitHub...</h2>
              <p className="mt-2 text-sm text-gray-600">Please wait while we complete the authentication.</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-bold text-gray-900">Successfully Connected!</h2>
              <p className="mt-2 text-sm text-gray-600">Redirecting you back to the dashboard...</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-bold text-gray-900">Connection Failed</h2>
              <p className="mt-2 text-sm text-gray-600">There was an error connecting to GitHub. Please try again.</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800"
              >
                Back to Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GitHubCallback;
```

### 6.2 Add Callback Route
Add the callback route to `src/App.tsx`:

```tsx
import GitHubCallback from "./pages/GitHubCallback";

// Add this route:
<Route path="/auth/github/callback" element={<GitHubCallback />} />
```

## Step 7: Test the Integration

### 7.1 Start Both Servers
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd server
npm run dev
```

### 7.2 Test the Flow
1. Go to `http://localhost:8080`
2. Navigate to Settings
3. Click "Connect GitHub"
4. Complete the OAuth flow
5. Select repositories
6. Start a session and test commit import

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure the backend server is running and CORS is properly configured
2. **OAuth Errors**: Double-check your GitHub OAuth app configuration
3. **API Rate Limits**: GitHub has rate limits, consider implementing caching
4. **Environment Variables**: Ensure all environment variables are properly set

### Debug Tips:

1. Check browser console for frontend errors
2. Check server logs for backend errors
3. Verify GitHub OAuth app settings
4. Test API endpoints with Postman

## Security Considerations

1. **Never commit secrets** to version control
2. **Use environment variables** for all sensitive data
3. **Implement proper error handling** for production
4. **Add rate limiting** to prevent abuse
5. **Validate OAuth state** to prevent CSRF attacks

## Production Deployment

For production deployment:

1. Update OAuth app URLs to your production domain
2. Set up proper environment variables on your hosting platform
3. Deploy the backend server to a cloud provider
4. Update the frontend API base URL to your production backend
5. Add proper SSL certificates
6. Implement proper error handling and logging

## Next Steps

Once the basic integration is working:

1. **Add caching** for GitHub API responses
2. **Implement webhooks** for real-time updates
3. **Add more integrations** (Figma, Notion, etc.)
4. **Improve error handling** and user feedback
5. **Add analytics** to track usage patterns

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify all environment variables are set
3. Ensure both servers are running
4. Test the GitHub OAuth app configuration
5. Check network requests in browser dev tools

Happy building! 🚀 