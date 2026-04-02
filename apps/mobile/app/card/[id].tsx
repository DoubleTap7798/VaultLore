import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { vaultLoreTheme } from "@vaultlore/ui";

import { apiClient } from "../../lib/api";
import { useAuthStore } from "../../lib/auth-store";

const { width } = Dimensions.get("window");
const CARD_W = (width - 48) * 0.42;
const CARD_H = CARD_W * 1.4;

const TIER_COLOR: Record<string, string> = {
  iconic: "#d6aa52",
  legendary: "#c0a0e0",
  "super-rare": "#7ab8ed",
  rare: "#74c994"
};

function ValueCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={valStyles.cell}>
      <Text style={valStyles.label}>{label}</Text>
      <Text style={[valStyles.value, accent && valStyles.valueAccent]}>{value}</Text>
    </View>
  );
}

const valStyles = StyleSheet.create({
  cell: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: vaultLoreTheme.radii.md,
    padding: 14,
    alignItems: "center",
    gap: 4
  },
  label: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center"
  },
  value: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center"
  },
  valueAccent: { color: vaultLoreTheme.colors.accentGold }
});

type AddModalProps = {
  cardId: string;
  visible: boolean;
  onClose: () => void;
};

function AddToCollectionModal({ cardId, visible, onClose }: AddModalProps) {
  const qc = useQueryClient();
  const [condition, setCondition] = useState<"raw" | "graded">("raw");
  const [gradeValue, setGradeValue] = useState("");
  const [gradeCompany, setGradeCompany] = useState("PSA");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.addToCollection({
        cardId,
        condition,
        gradeCompany: condition === "graded" ? gradeCompany : undefined,
        gradeValue: condition === "graded" && gradeValue ? parseFloat(gradeValue) : undefined,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["collection"] });
      setSaved(true);
      setTimeout(onClose, 1400);
    },
    onError: () => setErr("Failed to add — check sign-in status and try again.")
  });

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.sheetTitle}>Add to collection</Text>

          {saved ? (
            <View style={modalStyles.savedState}>
              <Text style={modalStyles.savedGlyph}>◈</Text>
              <Text style={modalStyles.savedText}>Added to your vault</Text>
            </View>
          ) : (
            <>
              <View style={modalStyles.conditionRow}>
                {(["raw", "graded"] as const).map((c) => (
                  <Pressable
                    key={c}
                    style={[modalStyles.condBtn, condition === c && modalStyles.condBtnActive]}
                    onPress={() => setCondition(c)}
                  >
                    <Text style={[modalStyles.condBtnText, condition === c && modalStyles.condBtnTextActive]}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {condition === "graded" && (
                <View style={modalStyles.gradeRow}>
                  <TextInput
                    keyboardType="default"
                    placeholder="PSA"
                    placeholderTextColor={vaultLoreTheme.colors.textSecondary}
                    style={[modalStyles.input, { flex: 0, width: 80 }]}
                    value={gradeCompany}
                    onChangeText={setGradeCompany}
                  />
                  <TextInput
                    keyboardType="decimal-pad"
                    placeholder="Grade (e.g. 9)"
                    placeholderTextColor={vaultLoreTheme.colors.textSecondary}
                    style={[modalStyles.input, { flex: 1 }]}
                    value={gradeValue}
                    onChangeText={setGradeValue}
                  />
                </View>
              )}

              <TextInput
                keyboardType="decimal-pad"
                placeholder="Purchase price (USD, optional)"
                placeholderTextColor={vaultLoreTheme.colors.textSecondary}
                style={modalStyles.input}
                value={purchasePrice}
                onChangeText={setPurchasePrice}
              />

              {err ? <Text style={modalStyles.errText}>{err}</Text> : null}

              <Pressable
                disabled={mutation.isPending}
                style={({ pressed }) => [modalStyles.addBtn, pressed && { opacity: 0.75 }]}
                onPress={() => { setErr(null); mutation.mutate(); }}
              >
                <Text style={modalStyles.addBtnText}>
                  {mutation.isPending ? "Saving…" : "Add to vault"}
                </Text>
              </Pressable>

              <Pressable style={modalStyles.cancelBtn} onPress={onClose}>
                <Text style={modalStyles.cancelText}>Cancel</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end"
  },
  sheet: {
    backgroundColor: vaultLoreTheme.colors.panel,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 14,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: vaultLoreTheme.colors.border
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    marginBottom: 4
  },
  sheetTitle: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "800"
  },
  conditionRow: { flexDirection: "row", gap: 10 },
  condBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: vaultLoreTheme.radii.pill,
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    alignItems: "center"
  },
  condBtnActive: {
    backgroundColor: "rgba(214,170,82,0.15)",
    borderColor: vaultLoreTheme.colors.accentGold
  },
  condBtnText: { color: vaultLoreTheme.colors.textSecondary, fontWeight: "700" },
  condBtnTextActive: { color: vaultLoreTheme.colors.accentGold },
  gradeRow: { flexDirection: "row", gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: vaultLoreTheme.colors.textPrimary,
    backgroundColor: "rgba(255,255,255,0.04)",
    fontSize: 15
  },
  errText: { color: "#f4a0b0", fontSize: 13 },
  addBtn: {
    backgroundColor: vaultLoreTheme.colors.accentGold,
    borderRadius: vaultLoreTheme.radii.pill,
    paddingVertical: 14,
    alignItems: "center"
  },
  addBtnText: { color: "#111", fontWeight: "800", fontSize: 15 },
  cancelBtn: { paddingVertical: 6, alignItems: "center" },
  cancelText: { color: vaultLoreTheme.colors.textSecondary, fontSize: 14 },
  savedState: { alignItems: "center", gap: 10, paddingVertical: 20 },
  savedGlyph: { color: vaultLoreTheme.colors.accentGold, fontSize: 44 },
  savedText: { color: vaultLoreTheme.colors.textPrimary, fontSize: 18, fontWeight: "700" }
});

export default function CardDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [showAddModal, setShowAddModal] = useState(false);

  const cardQuery = useQuery({
    queryKey: ["card", id],
    queryFn: () => apiClient.getCard(id ?? ""),
    enabled: Boolean(id)
  });

  const compsQuery = useQuery({
    queryKey: ["comps", id],
    queryFn: () => apiClient.getComps(id ?? ""),
    enabled: Boolean(id)
  });

  const card = cardQuery.data;
  const comps = compsQuery.data?.comps ?? [];

  if (cardQuery.isLoading) {
    return (
      <LinearGradient colors={["#07090d", "#111624", "#261d16"]} style={styles.gradient}>
        <SafeAreaView style={[styles.safeArea, styles.center]}>
          <ActivityIndicator size="large" color={vaultLoreTheme.colors.accentGold} />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (cardQuery.isError || !card) {
    return (
      <LinearGradient colors={["#07090d", "#111624", "#261d16"]} style={styles.gradient}>
        <SafeAreaView style={[styles.safeArea, styles.center]}>
          <Text style={styles.errorText}>Card not found.</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={styles.backLink}>← Go back</Text>
          </Pressable>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const tierColor = card.collectorTier ? (TIER_COLOR[card.collectorTier] ?? vaultLoreTheme.colors.textSecondary) : vaultLoreTheme.colors.textSecondary;

  return (
    <>
      <LinearGradient colors={["#07090d", "#111624", "#261d16"]} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.content}>
            {/* Hero */}
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>← Back</Text>
            </Pressable>

            <View style={styles.heroSection}>
              <View style={styles.cardImageArea}>
                <View style={[styles.cardImagePlaceholder, { width: CARD_W, height: CARD_H }]}>
                  <Text style={styles.cardGlyph}>◈</Text>
                  {card.collectorTier && (
                    <View style={[styles.tierTag, { backgroundColor: tierColor + "22", borderColor: tierColor }]}>
                      <Text style={[styles.tierTagText, { color: tierColor }]}>{card.collectorTier}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.heroMeta}>
                <Text style={styles.heroCategory}>{card.category}</Text>
                <Text style={styles.heroTitle}>{card.title}</Text>
                <Text style={styles.heroSubject}>{card.subjectName}</Text>
                {card.year && card.setName ? (
                  <Text style={styles.heroSet}>{card.year} · {card.setName}</Text>
                ) : null}
                {card.team ? <Text style={styles.heroTeam}>{card.team}</Text> : null}
                {card.rarity ? <Text style={styles.heroRarity}>{card.rarity}</Text> : null}
              </View>
            </View>

            {/* Value panel */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Estimated value</Text>
              <View style={styles.valueRow}>
                <ValueCell label="Raw" value={`$${card.rawEstimatedValue.toLocaleString()}`} />
                <ValueCell label="PSA 8 Graded" value={`$${card.gradedEstimatedValue.toLocaleString()}`} accent />
                <ValueCell label="30d movement" value={card.marketMovement} />
              </View>
            </View>

            {/* Market comps */}
            {comps.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent comps</Text>
                <View style={styles.compsTable}>
                  <View style={styles.compsHeader}>
                    <Text style={[styles.compCell, styles.compHeaderText]}>Date</Text>
                    <Text style={[styles.compCell, styles.compHeaderText]}>Venue</Text>
                    <Text style={[styles.compCell, styles.compHeaderText]}>Grade</Text>
                    <Text style={[styles.compCell, styles.compHeaderText, styles.compRight]}>Price</Text>
                  </View>
                  {comps.map((comp, idx) => (
                    <View key={idx} style={[styles.compRow, idx % 2 === 0 && styles.compRowAlt]}>
                      <Text style={styles.compCell}>{comp.saleDate}</Text>
                      <Text style={styles.compCell}>{comp.venue}</Text>
                      <Text style={styles.compCell}>{comp.grade}</Text>
                      <Text style={[styles.compCell, styles.compRight, styles.compPrice]}>
                        ${comp.price.toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Grading insight */}
            {card.gradingPotential ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Grading potential</Text>
                <Text style={styles.gradingText}>{card.gradingPotential}</Text>
              </View>
            ) : null}

            {/* Lore / notable facts */}
            {(card.moments?.length > 0 || card.notableFacts?.length > 0) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Collector lore</Text>
                {[...card.notableFacts, ...card.moments].map((fact, idx) => (
                  <View key={idx} style={styles.loreRow}>
                    <Text style={styles.loreDot}>◈</Text>
                    <Text style={styles.loreText}>{fact}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Related cards */}
            {card.relatedCards?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Related cards</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.relatedRow}>
                    {card.relatedCards.map((rc) => (
                      <Pressable
                        key={rc.id}
                        style={({ pressed }) => [styles.relatedCard, pressed && { opacity: 0.7 }]}
                        onPress={() => router.push(`/card/${rc.id}` as never)}
                      >
                        <View style={styles.relatedImgSlot}>
                          <Text style={styles.relatedGlyph}>◈</Text>
                        </View>
                        <Text style={styles.relatedTitle} numberOfLines={2}>{rc.title}</Text>
                        <Text style={styles.relatedCategory}>{rc.category}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Action bar */}
            <View style={styles.actionBar}>
              <Pressable
                style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, pressed && { opacity: 0.75 }]}
                onPress={() => {
                  if (!accessToken) { router.push("/sign-in"); return; }
                  setShowAddModal(true);
                }}
              >
                <Text style={styles.actionBtnPrimaryText}>+ Add to vault</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.actionBtn, styles.actionBtnSecondary, pressed && { opacity: 0.7 }]}
                onPress={() => {
                  if (!accessToken) { router.push("/sign-in"); return; }
                  void apiClient.addToWatchlist({ cardId: id ?? undefined });
                }}
              >
                <Text style={styles.actionBtnSecondaryText}>Watch</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.actionBtn, styles.actionBtnSecondary, pressed && { opacity: 0.7 }]}
                onPress={() => router.push("/grading-assistant")}
              >
                <Text style={styles.actionBtnSecondaryText}>Grade</Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {id ? (
        <AddToCollectionModal
          cardId={id}
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center" },
  content: { padding: 20, gap: 20, paddingBottom: 48 },
  backBtn: { paddingVertical: 4 },
  backBtnText: { color: vaultLoreTheme.colors.accentPlatinum, fontSize: 14, fontWeight: "600" },
  heroSection: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start"
  },
  cardImageArea: { alignItems: "center" },
  cardImagePlaceholder: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: vaultLoreTheme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 8,
    overflow: "hidden"
  },
  cardGlyph: {
    color: vaultLoreTheme.colors.accentGold,
    fontSize: 36,
    opacity: 0.35
  },
  tierTag: {
    borderWidth: 1,
    borderRadius: vaultLoreTheme.radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  tierTagText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  heroMeta: { flex: 1, gap: 5, paddingTop: 4 },
  heroCategory: {
    color: vaultLoreTheme.colors.accentGold,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  heroTitle: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26
  },
  heroSubject: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "600"
  },
  heroSet: { color: vaultLoreTheme.colors.textSecondary, fontSize: 13 },
  heroTeam: { color: vaultLoreTheme.colors.textSecondary, fontSize: 12 },
  heroRarity: { color: vaultLoreTheme.colors.textSecondary, fontSize: 12, fontStyle: "italic" },
  section: {
    backgroundColor: "rgba(18,21,29,0.84)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.lg,
    padding: 16,
    gap: 12
  },
  sectionTitle: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5
  },
  valueRow: { flexDirection: "row", gap: 8 },
  compsTable: { gap: 2 },
  compsHeader: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: vaultLoreTheme.colors.border
  },
  compHeaderText: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  compRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8
  },
  compRowAlt: { backgroundColor: "rgba(255,255,255,0.02)" },
  compCell: {
    flex: 1,
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 13,
    lineHeight: 18
  },
  compRight: { textAlign: "right" },
  compPrice: { color: vaultLoreTheme.colors.accentGold, fontWeight: "700" },
  gradingText: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21
  },
  loreRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  loreDot: {
    color: vaultLoreTheme.colors.accentGold,
    fontSize: 11,
    opacity: 0.6,
    marginTop: 3
  },
  loreText: {
    flex: 1,
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21
  },
  relatedRow: { flexDirection: "row", gap: 10, paddingBottom: 4 },
  relatedCard: {
    width: 100,
    gap: 6
  },
  relatedImgSlot: {
    width: 100,
    height: 140,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  relatedGlyph: {
    color: vaultLoreTheme.colors.accentGold,
    fontSize: 22,
    opacity: 0.35
  },
  relatedTitle: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16
  },
  relatedCategory: {
    color: vaultLoreTheme.colors.accentGold,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  actionBar: {
    flexDirection: "row",
    gap: 10
  },
  actionBtn: {
    borderRadius: vaultLoreTheme.radii.pill,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  actionBtnPrimary: {
    flex: 2,
    backgroundColor: vaultLoreTheme.colors.accentGold
  },
  actionBtnPrimaryText: { color: "#111", fontWeight: "800", fontSize: 14 },
  actionBtnSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    backgroundColor: "rgba(255,255,255,0.04)"
  },
  actionBtnSecondaryText: {
    color: vaultLoreTheme.colors.textPrimary,
    fontWeight: "700",
    fontSize: 13
  },
  errorText: { color: "#f4a0b0", fontSize: 16 },
  backLink: { color: vaultLoreTheme.colors.accentPlatinum, fontSize: 14 }
});

