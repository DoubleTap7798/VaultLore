import { DetailCard, ScreenShell } from "../components/ScreenShell";

export default function WatchlistScreen() {
  return (
    <ScreenShell title="Watchlist" subtitle="Target prices, grade-aware alerts, and category or subject follow states.">
      <DetailCard label="Alert type" value="Target buy price" />
      <DetailCard label="Signal" value="2 cards within 5% of target" />
    </ScreenShell>
  );
}
