# Real Device & Production Environment Setup

## Mobile (Expo)

### Environment variables

Create `apps/mobile/.env.local` (never commit this file):

```env
# API endpoint
EXPO_PUBLIC_API_URL=https://api.vaultlore.app/v1

# RevenueCat (get from https://app.revenuecat.com → Project → API Keys)
EXPO_PUBLIC_REVENUECAT_KEY=appl_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

For CI/CD, add these as EAS Secrets:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL        --value "https://api.vaultlore.app/v1"
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_KEY --value "appl_XXXX..."
```

### Building for real device

**Development build** (required for RevenueCat + camera native modules):
```bash
# First, install EAS CLI
npm install -g eas-cli
eas login

# Create development build
eas build --profile development --platform ios
# OR for Android
eas build --profile development --platform android

# Then run the dev server
pnpm --filter @vaultlore/mobile dev
```

> Expo Go does NOT support `react-native-purchases` or the camera native module.
> You must use a development build on a real device or simulator.

### EAS project setup (one-time)

1. `eas build:configure` — this fills in the EAS `projectId` in `app.json`
2. Replace `REPLACE_WITH_EAS_PROJECT_ID` in `apps/mobile/app.json` with the generated ID
3. For iOS submission: replace placeholders in `eas.json` submit block with your Apple credentials

---

## Server

Create `server/.env` (never commit):

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vaultlore

# Auth
JWT_SECRET=<random 64-char hex string>
REFRESH_TOKEN_SECRET=<another random 64-char hex>
REFRESH_TOKEN_TTL_DAYS=30

# App
PORT=4000
NODE_ENV=production
APP_BASE_URL=https://app.vaultlore.app

# Storage — choose one: local | s3 | r2
STORAGE_PROVIDER=s3
STORAGE_BUCKET=vaultlore-uploads
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
STORAGE_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
STORAGE_PUBLIC_BASE_URL=https://cdn.vaultlore.app

# For Cloudflare R2, also set:
# STORAGE_PROVIDER=r2
# STORAGE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com

# Email — choose one: console | resend | sendgrid
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXX
# OR for SendGrid:
# EMAIL_PROVIDER=sendgrid
# SENDGRID_API_KEY=SG.XXXXXXXXXXXXXXXXXXXX
EMAIL_FROM=noreply@vaultlore.app

# RevenueCat webhook (optional — for server-side entitlement sync)
REVENUECAT_WEBHOOK_SECRET=rc_webhook_XXXXXXXX

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

Generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Worker

Create `worker/.env` (never commit):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vaultlore
REDIS_HOST=localhost
REDIS_PORT=6379

# Optional: Google Cloud Vision for card scan intelligence
# If not set, falls back to seed-data stub matching
# GOOGLE_CLOUD_VISION_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## RevenueCat Configuration

1. Create project at https://app.revenuecat.com
2. Add App Store / Google Play app under your project
3. Create products in App Store Connect / Google Play Console matching the identifiers in `purchases-service.ts`:
   - `vault_pro_monthly` — $6.99/month
   - `legendary_annual` — $59.99/year
4. Create an Offering in RevenueCat with those products
5. Set the API key in `EXPO_PUBLIC_REVENUECAT_KEY` (iOS key starts with `appl_`, Android with `goog_`)
6. (Optional) Configure the webhook pointing to `POST https://api.vaultlore.app/v1/revenuecat/webhook`

---

## Deep links (password reset)

The password reset email sends a link like:
```
https://app.vaultlore.app/reset-password?token=<hex>
```

For this to open the mobile app you need universal links:
- **iOS**: configure Associated Domains in your Apple Developer account → add `applinks:app.vaultlore.app`
- **Android**: configure App Links with a `/.well-known/assetlinks.json` on your domain

For local testing, the deep link scheme `vaultlore://reset-password?token=<hex>` works immediately since `scheme: "vaultlore"` is set in `app.json`.
