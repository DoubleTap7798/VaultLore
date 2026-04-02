import { DetailCard, ScreenShell } from "../components/ScreenShell";

export default function GradingAssistantScreen() {
  return (
    <ScreenShell title="Grade smarter" subtitle="Front/back upload, centering, edges, corners, surface, and likely ROI guidance.">
      <DetailCard label="Likely grade" value="8-9" />
      <DetailCard label="Worth grading score" value="82 / 100" />
      <DetailCard label="Confidence" value="Moderate with surface review disclaimer" />
    </ScreenShell>
  );
}
