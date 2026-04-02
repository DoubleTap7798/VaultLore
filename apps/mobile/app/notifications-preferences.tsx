import { DetailCard, ScreenShell } from "../components/ScreenShell";

export default function NotificationsScreen() {
  return (
    <ScreenShell title="Notification preferences" subtitle="Manage watchlist alerts, market pulse digests, and scan completion notifications.">
      <DetailCard label="Daily digest" value="Market Pulse and featured grails" />
      <DetailCard label="Real-time" value="Target price and scan result alerts" />
    </ScreenShell>
  );
}
