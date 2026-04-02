# Apple + Google App Review Compliance Checklist

## Account + Authentication

- [ ] Sign up works in production
- [ ] Sign in works in production
- [ ] Forgot password email is delivered from production environment
- [ ] Reset password token cannot be reused
- [ ] Delete account works fully in-app and removes access

## Subscriptions

- [ ] Purchase flow uses real RevenueCat products
- [ ] Restore purchases works in development build and production build
- [ ] No fake premium entitlement is returned on failure/cancel

## Permissions

- [ ] Camera permission copy is user-friendly and accurate
- [ ] Photo library permission copy is user-friendly and accurate
- [ ] Notification permission copy is user-friendly and accurate

## Legal and Support

- [ ] Privacy policy URL is live and public
- [ ] Terms URL is live and public
- [ ] Support URL or support email page is live and public
- [ ] Store listing references same URLs as in app

## Core User Flows

- [ ] Onboarding completion persists
- [ ] Card scan upload succeeds in production
- [ ] Scan queue job transitions to completed
- [ ] Scan result visible on device
- [ ] Collection list/detail/edit/delete work in production

## Reliability + Monitoring

- [ ] API Sentry errors visible
- [ ] Worker Sentry errors visible
- [ ] Mobile Sentry errors visible
- [ ] Web Sentry errors visible
- [ ] Queue failures recorded in jobs_log
