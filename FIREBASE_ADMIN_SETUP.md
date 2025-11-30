# Firebase Admin SDK Setup Guide

## How to Add Firebase Service Account Key

You have downloaded the Firebase Service Account Key JSON file. Here's how to add it to your environment variables:

### Step 1: Read the JSON File Content

The service account key file is located at:
```
/home/surya/Downloads/studio-573678501-5e40f-firebase-adminsdk-fbsvc-35b1b66c1c.json
```

### Step 2: Add to Environment Variables

You need to add the **entire JSON content** as a single-line string to your environment variable `FIREBASE_SERVICE_ACCOUNT_KEY`.

#### Option A: For Vercel (Recommended)

1. Go to your Vercel Dashboard: https://vercel.com
2. Select your project (`naari` or `naarimani`)
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value:** Paste the entire JSON content (as a single line, no line breaks)
   - **Environment:** Production, Preview, Development (select all)
5. Click **Save**
6. **Redeploy** your application for changes to take effect

#### Option B: For Netlify

1. Go to your Netlify Dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add new variable:
   - **Key:** `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value:** Paste the entire JSON content (as a single line)
5. Click **Save**
6. **Redeploy** your site

#### Option C: For Local Development (.env.local)

1. Open the JSON file in a text editor
2. Copy the entire content
3. In your project root, create or edit `.env.local`
4. Add this line (replace with your actual JSON, all on one line):
   ```env
   FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"studio-573678501-5e40f",...}'
   ```
   **Important:** The entire JSON must be on a single line, or use escaped newlines.

### Step 3: Format the JSON for Environment Variable

The JSON needs to be a single-line string. You can:

**Method 1: Use a JSON minifier**
- Go to https://jsonformatter.org/json-minify
- Paste your JSON
- Copy the minified version (single line)
- Use that as the environment variable value

**Method 2: Use command line (Linux/Mac)**
```bash
cat /home/surya/Downloads/studio-573678501-5e40f-firebase-adminsdk-fbsvc-35b1b66c1c.json | jq -c .
```

**Method 3: Manual (remove all line breaks)**
- Open the JSON file
- Copy all content
- Remove all line breaks and extra spaces
- Paste as the environment variable value

### Step 4: Verify Setup

After adding the environment variable:

1. **Redeploy** your application
2. Try making a payment
3. Check server logs to ensure Firebase Admin SDK initializes correctly

### Security Notes

⚠️ **Important:**
- Never commit the service account key file to Git
- The `.json` file should be in `.gitignore`
- Only add it as an environment variable in your hosting platform
- The environment variable is secure and not exposed to the client

### Alternative: Use Project ID Only (Simpler, but may have limitations)

If you're using Firebase App Hosting or Google Cloud Platform, you can also just set:
```env
FIREBASE_PROJECT_ID=studio-573678501-5e40f
```

This uses Application Default Credentials, which may work in some environments.

### Troubleshooting

If you get errors:
1. Check that the JSON is valid (no syntax errors)
2. Ensure it's a single line (no line breaks in the environment variable)
3. Verify the project ID matches your Firebase project
4. Check server logs for specific error messages

