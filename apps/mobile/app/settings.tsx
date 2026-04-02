import { DetailCard, ScreenShell } from "../components/ScreenShell";

export default function SettingsScreen() {
  return (
    <ScreenShell title="Settings" subtitle="Profile, plan, support, legal, notification, and account lifecycle controls.">
      <DetailCard label="Security" value="Session restore and logout" />
      <DetailCard label="Compliance" value="Delete account entry point available" />
    </ScreenShell>
  );
}
