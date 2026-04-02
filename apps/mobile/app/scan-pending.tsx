import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useQuery } from "@tanstack/react-query";

import { vaultLoreTheme } from "@vaultlore/ui";

import { apiClient } from "../lib/api";

const STATUS_COPY: Record<string, { headline: string; caption: string }> = {
  queued: {
    headline: "In the queue",
    caption: "Your scan has been submitted and is waiting for a worker slot."
  },
  processing: {
    headline: "Analyzing the card",
    caption: "The worker is identifying your card and pulling market intelligence."
  },
  completed: {
    headline: "Match found",
    caption: "Identification complete. Loading your results now…"
  },
  failed: {
    headline: "Scan failed",
    caption: "Something went wrong during analysis. Retry to try again."
  }
};

export default function ScanPendingScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();

  const { data, isError, refetch } = useQuery({
    queryKey: ["scan-job", jobId],
    queryFn: () => apiClient.getScanJob(jobId ?? ""),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") return false;
      return 2500;
    }
  });

  const status = data?.status ?? "queued";
  const copy = STATUS_COPY[status] ?? STATUS_COPY["queued"];
  const isPending = status === "queued" || status === "processing";
  const isCompleted = status === "completed";
  const isFailed = status === "failed";

  useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(() => {
        router.replace(`/scan-result?jobId=${jobId}` as never);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isCompleted, jobId, router]);

  return (
    <LinearGradient colors={["#07090d", "#111624", "#261d16"]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <View style={styles.panel}>
            <Text style={styles.badge}>VaultLore</Text>
            <Text style={styles.jobId}>Job {jobId ? jobId.slice(0, 8) : "—"}</Text>

            <View style={styles.statusArea}>
              {isPending && (
                <ActivityIndicator
                  size="large"
                  color={vaultLoreTheme.colors.accentGold}
                  style={{ marginBottom: 16 }}
                />
              )}
              {isCompleted && (
                <Text style={styles.successGlyph}>◈</Text>
              )}
              {isFailed && (
                <Text style={styles.failGlyph}>✕</Text>
              )}

              <Text style={styles.statusHeadline}>{copy.headline}</Text>
              <Text style={styles.statusCaption}>{copy.caption}</Text>
            </View>

            {isPending && (
              <View style={styles.steps}>
                <StepRow label="Image received" done />
                <StepRow label="Category detection" done={status === "processing" || isCompleted} />
                <StepRow label="Card identification" done={isCompleted} />
                <StepRow label="Market intel pull" done={isCompleted} />
              </View>
            )}

            {isFailed && (
              <View style={styles.retryArea}>
                {isError && (
                  <Text style={styles.errorText}>Could not connect to the server.</Text>
                )}
                <Pressable
                  style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => void refetch()}
                >
                  <Text style={styles.retryText}>Retry scan status</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => router.replace("/scan")}
                >
                  <Text style={styles.backBtnText}>Start a new scan</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function StepRow({ label, done }: { label: string; done?: boolean }) {
  return (
    <View style={stepStyles.row}>
      <View style={[stepStyles.dot, done && stepStyles.dotDone]}>
        {done ? <Text style={stepStyles.checkmark}>✓</Text> : null}
      </View>
      <Text style={[stepStyles.label, done && stepStyles.labelDone]}>{label}</Text>
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: vaultLoreTheme.colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  dotDone: {
    backgroundColor: vaultLoreTheme.colors.accentGold,
    borderColor: vaultLoreTheme.colors.accentGold
  },
  checkmark: { color: "#111", fontSize: 11, fontWeight: "800" },
  label: { color: vaultLoreTheme.colors.textSecondary, fontSize: 14 },
  labelDone: { color: vaultLoreTheme.colors.textPrimary, fontWeight: "600" }
});

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  panel: {
    width: "100%",
    backgroundColor: "rgba(18,21,29,0.92)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.lg,
    padding: 28,
    gap: 24,
    alignItems: "center"
  },
  badge: {
    color: vaultLoreTheme.colors.accentGold,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 11,
    fontWeight: "700"
  },
  jobId: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 12,
    fontFamily: "monospace",
    marginTop: -16
  },
  statusArea: { alignItems: "center", gap: 10, width: "100%" },
  successGlyph: {
    color: vaultLoreTheme.colors.accentGold,
    fontSize: 48,
    marginBottom: 8
  },
  failGlyph: {
    color: vaultLoreTheme.colors.accentCrimson,
    fontSize: 48,
    marginBottom: 8
  },
  statusHeadline: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center"
  },
  statusCaption: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center"
  },
  steps: { width: "100%", gap: 10 },
  retryArea: { width: "100%", gap: 12, alignItems: "center" },
  errorText: {
    color: "#f4a0b0",
    fontSize: 13,
    textAlign: "center"
  },
  retryBtn: {
    backgroundColor: vaultLoreTheme.colors.accentGold,
    borderRadius: vaultLoreTheme.radii.pill,
    paddingVertical: 13,
    paddingHorizontal: 32
  },
  retryText: { color: "#111", fontWeight: "800", fontSize: 14 },
  backBtn: { paddingVertical: 8 },
  backBtnText: {
    color: vaultLoreTheme.colors.accentPlatinum,
    fontSize: 14
  }
});

