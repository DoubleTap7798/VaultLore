import { DetailCard, ScreenShell } from "../components/ScreenShell";

export default function WishlistScreen() {
  return (
    <ScreenShell title="Wishlist" subtitle="Track grails, next pickups, and same-subject additions you want to pursue next.">
      <DetailCard label="Priority" value="Charizard Base Set centered copy" />
      <DetailCard label="Next action" value="Watch comps and set target range" />
    </ScreenShell>
  );
}
