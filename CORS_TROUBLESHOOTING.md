# CORS Error Troubleshooting Guide

## Issue
Cross-Origin Request Blocked errors when connecting to Firestore:
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://firestore.googleapis.com/...
```

## Possible Causes & Solutions

### 1. Content Security Policy (CSP)
**Status:** ✅ Already configured in `next.config.ts`

The CSP includes:
- `https://*.googleapis.com` (covers firestore.googleapis.com)
- `https://firestore.googleapis.com` (explicit)
- `wss://*.firebaseio.com` (WebSocket connections)

**If still having issues:**
- Restart the dev server after changing `next.config.ts`
- Clear browser cache
- Check browser console for specific CSP violations

### 2. Firebase Project Configuration
**Check in Firebase Console:**
1. Go to Firebase Console > Project Settings
2. Under "Your apps", verify the web app configuration
3. Ensure Firestore is enabled in the project
4. Check Firestore Database > Settings > Rules (should allow authenticated users)

### 3. Network/Firewall Issues
**Possible causes:**
- Corporate firewall blocking Firebase
- VPN interfering with connections
- Antivirus blocking requests
- Browser extensions blocking requests

**Solutions:**
- Try a different network
- Disable VPN temporarily
- Try incognito/private mode
- Disable browser extensions

### 4. Browser Issues
**Try:**
- Clear browser cache and cookies
- Try a different browser
- Disable browser security extensions
- Check browser console for detailed errors

### 5. Development vs Production
**For local development:**
- Ensure you're running on `localhost` or `127.0.0.1`
- Don't use `0.0.0.0` or IP addresses
- Check that Firebase config matches your environment

### 6. Firestore Connection Settings
**Check Firestore initialization:**
- Verify Firebase config is correct
- Ensure Firestore is properly initialized
- Check for any custom Firestore settings

### 7. Temporary Workaround (Development Only)
If CSP is still blocking, you can temporarily relax it for development:

```typescript
// In next.config.ts - DEVELOPMENT ONLY
"connect-src 'self' https: wss:",
```

**⚠️ WARNING:** This is less secure and should only be used for development.

## Quick Fixes to Try

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Check Firebase Console:**
   - Verify Firestore is enabled
   - Check database rules
   - Verify project settings

4. **Browser DevTools:**
   - Open Network tab
   - Look for blocked requests
   - Check Console for specific errors

5. **Test in different browser:**
   - Chrome
   - Firefox
   - Safari
   - Edge

## Still Having Issues?

If the problem persists:
1. Check Firebase status: https://status.firebase.google.com/
2. Verify your Firebase project is active
3. Check if you're hitting any quotas/limits
4. Review Firebase Console logs
5. Check browser console for more detailed error messages

