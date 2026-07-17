# Google OAuth 2.0 Integration & Setup Guide

This guide explains how to set up Google Client authentication for the **Prodo** focus app (both the Tauri desktop client and Cloudflare web dashboard) to allow users to sign up and sign in using Google.

---

## Step 1: Create OAuth 2.0 Credentials in Google Cloud

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project called **Prodo**.
3. Navigate to **APIs & Services** → **OAuth consent screen**:
   - Select **External** user type.
   - Fill in the app name ("Prodo") and your developer support email.
   - Under scopes, make sure to add `openid`, `.../auth/userinfo.email`, and `.../auth/userinfo.profile`.
4. Navigate to **APIs & Services** → **Credentials**:
   - Click **Create Credentials** → **OAuth client ID**.
   - Select **Web application** as the Application Type (Tauri webviews are treated as web clients).
   - Under **Authorized JavaScript origins**, add:
     - `http://localhost:1420` (Desktop development)
     - `http://localhost:5173` (Web dashboard development)
     - `https://prodo-live.pages.dev` (Hosted production page)
   - Click **Create** to obtain your **Client ID** (e.g. `12345-abcde.apps.googleusercontent.com`).

---

## Step 2: Configure the React Frontend

To implement Google Auth in the web/desktop UI, use `@react-oauth/google`:

1. Install the package in the web or desktop folder:
   ```bash
   npm install @react-oauth/google
   ```
2. Wrap your `App.tsx` (or main entrypoint) in `GoogleOAuthProvider`:
   ```tsx
   import { GoogleOAuthProvider } from '@react-oauth/google';

   ReactDOM.createRoot(document.getElementById('root')!).render(
     <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
       <App />
     </GoogleOAuthProvider>
   );
   ```
3. Use the Google Login button in `LoginPage.tsx`:
   ```tsx
   import { GoogleLogin } from '@react-oauth/google';
   import { apiGoogleLogin } from '../api/prodoApi';

   const handleGoogleSuccess = async (credentialResponse) => {
     if (credentialResponse.credential) {
       const res = await apiGoogleLogin(credentialResponse.credential);
       if (res.success && res.token) {
         sessionStorage.setItem("prodo_token", res.token);
         // Redirect to focus page
       }
     }
   };

   <GoogleLogin
     onSuccess={handleGoogleSuccess}
     onError={() => console.log('Login Failed')}
   />
   ```

---

## Step 3: Backend Verification Flow

When the frontend sends the Google `credential` (JWT token) to `/auth/google`, the backend verifies it:

1. The FastAPI backend decodes the header and payload of the JWT.
2. Extracts email, name, and profile details securely.
3. Automatically creates a user profile in the SQLite database if they are logging in for the first time.
4. Returns a session token corresponding to the Google email to keep the user signed in.
