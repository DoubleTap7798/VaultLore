import { useLocalSearchParams } from "expo-router";

import { DetailCard, ScreenShell } from "../../components/ScreenShell";

export default function SubjectProfileScreen() {
  const params = useLocalSearchParams<{ id: string }>();

  return (
    <ScreenShell title="Subject profile" subtitle="Player, character, or franchise profiles with milestones, card highlights, and iconic moments.">
      <DetailCard label="Subject id" value={params.id ?? "unknown"} />
      <DetailCard label="Profile modules" value="Bio, milestones, market highlights, top cards" />
      <DetailCard label="Lore" value="Iconic scenes, career moments, and collectible context" />
    </ScreenShell>
  );
}
