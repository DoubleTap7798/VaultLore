import { DetailCard, ScreenShell } from "../components/ScreenShell";

export default function MarketScreen() {
  return (
    <ScreenShell title="Market hub" subtitle="Top risers, fallers, category movers, hot sets, and recent comp snapshots.">
      <DetailCard label="Top mover" value="2018 Prizm Luka Silver +18.7%" />
      <DetailCard label="Category pulse" value="Pokemon broad demand, football event-driven" />
      <DetailCard label="Collector use" value="Spot momentum before buying, selling, or grading" />
    </ScreenShell>
  );
}
