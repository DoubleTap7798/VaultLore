import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Alert,
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
import type { PatchCollectionItemPayload } from "@vaultlore/api-client";

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function CollectionDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const itemQuery = useQuery({
    queryKey: ["collection-item", id],
    queryFn: () => apiClient.getCollectionItem(id ?? ""),
    enabled: Boolean(id)
  });

  const cardQuery = useQuery({
    queryKey: ["card", itemQuery.data?.cardId],
    queryFn: () => apiClient.getCard(itemQuery.data?.cardId ?? ""),
    enabled: Boolean(itemQuery.data?.cardId)
  });

  const item = itemQuery.data;
  const card = cardQuery.data;
  const isLoading = itemQuery.isLoading || cardQuery.isLoading;

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editPurchasePrice, setEditPurchasePrice] = useState("");
  const [editCondition, setEditCondition] = useState<"raw" | "graded">("raw");
  const [editGradeCompany, setEditGradeCompany] = useState("");
  const [editGradeValue, setEditGradeValue] = useState("");

  const openEdit = () => {
    if (!item) return;
    setEditNotes(item.notes ?? "");
    setEditPurchasePrice(item.purchasePrice ?? "");
    setEditCondition(item.condition as "raw" | "graded");
    setEditGradeCompany(item.gradeCompany ?? "");
    setEditGradeValue(item.gradeValue ?? "");
    setEditOpen(true);
  };

  const patchMutation = useMutation({
    mutationFn: (payload: PatchCollectionItemPayload) =>
      apiClient.patchCollectionItem(id ?? "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-item", id] });
      queryClient.invalidateQueries({ queryKey: ["collection"] });
      setEditOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.deleteCollectionItem(id ?? ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection"] });
      router.replace("/collection");
    }
  });

  const handleSaveEdit = () => {
    const payload: PatchCollectionItemPayload = {
      condition: editCondition,
      notes: editNotes.trim() || undefined,
      purchasePrice: editPurchasePrice ? parseFloat(editPurchasePrice) : undefined,
      gradeCompany: editCondition === "graded" ? editGradeCompany.trim() || undefined : undefined,
      gradeValue: editCondition === "graded" && editGradeValue ? parseFloat(editGradeValue) : undefined
    };
    patchMutation.mutate(payload);
  };

  const handleDelete = () => {
    Alert.alert(
      "Remove from collection",
      "This will permanently remove this entry. The card stays in the catalog.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => deleteMutation.mutate()
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <LinearGradient colors={["#07090d", "#111624", "#261d16"]} style={styles.gradient}>
        <SafeAreaView style={[styles.safeArea, styles.center]}>
          <ActivityIndicator size="large" color={vaultLoreTheme.colors.accentGold} />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!item) {
    return (
      <LinearGradient colors={["#07090d", "#111624", "#261d16"]} style={styles.gradient}>
        <SafeAreaView style={[styles.safeArea, styles.center]}>
          <Text style={styles.errorText}>Collection entry not found.</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={styles.backLink}>← Go back</Text>
          </Pressable>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const purchaseNum = item.purchasePrice ? parseFloat(item.purchasePrice) : null;
  const isGraded = item.condition === "graded";

  return (
    <LinearGradient colors={["#07090d", "#111624", "#261d16"]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Collection</Text>
          </Pressable>

          {/* Hero image + card info */}
          <View style={styles.hero}>
            <View style={styles.heroImgSlot}>
              <Text style={styles.heroGlyph}>{isGraded ? "★" : "◈"}</Text>
              {isGraded && item.gradeCompany && (
                <View style={styles.gradeTag}>
                  <Text style={styles.gradeTagText}>
                    {item.gradeCompany} {item.gradeValue}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.heroRight}>
              {card ? (
                <>
                  <Text style={styles.heroCategory}>{card.category}</Text>
                  <Text style={styles.heroTitle}>{card.title}</Text>
                  <Text style={styles.heroSubject}>{card.subjectName}</Text>
                  {card.setName ? <Text style={styles.heroMeta}>{card.setName}</Text> : null}
                  {card.year ? <Text style={styles.heroMeta}>{card.year}</Text> : null}
                  {card.rarity ? <Text style={styles.heroMeta}>{card.rarity}</Text> : null}
                </>
              ) : (
                <Text style={styles.cardIdText}>{item.cardId}</Text>
              )}
            </View>
          </View>

          {/* Ownership details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ownership details</Text>
            <DetailRow label="Condition" value={item.condition} />
            <DetailRow
              label="Grade"
              value={isGraded && item.gradeCompany ? `${item.gradeCompany} ${item.gradeValue ?? ""}` : null}
            />
            <DetailRow label="Quantity" value={String(item.quantity)} />
            <DetailRow
              label="Purchase price"
              value={purchaseNum != null ? `$${purchaseNum.toLocaleString()}` : null}
            />
            <DetailRow
              label="Purchase date"
              value={item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : null}
            />
            {item.notes ? <DetailRow label="Notes" value={item.notes} /> : null}
            {item.folder ? <DetailRow label="Folder" value={item.folder} /> : null}
            {item.tags?.length > 0 ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tags</Text>
                <View style={styles.tagsRow}>
                  {item.tags.map((t) => (
                    <View key={t} style={styles.tagChip}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          {/* Card market value (if available) */}
          {card && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Market intel</Text>
              <View style={styles.valueRow}>
                <View style={styles.valueCell}>
                  <Text style={styles.valueCellLabel}>Raw est.</Text>
                  <Text style={styles.valueCellValue}>${card.rawEstimatedValue.toLocaleString()}</Text>
                </View>
                <View style={styles.valueCellDivider} />
                <View style={styles.valueCell}>
                  <Text style={styles.valueCellLabel}>Graded est.</Text>
                  <Text style={[styles.valueCellValue, styles.valueCellAccent]}>
                    ${card.gradedEstimatedValue.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.valueCellDivider} />
                <View style={styles.valueCell}>
                  <Text style={styles.valueCellLabel}>30d move</Text>
                  <Text style={styles.valueCellValue}>{card.marketMovement}</Text>
                </View>
              </View>
              {purchaseNum != null && card.rawEstimatedValue > 0 && (
                <Text style={styles.gainLoss}>
                  {card.rawEstimatedValue >= purchaseNum
                    ? `+$${(card.rawEstimatedValue - purchaseNum).toLocaleString()} vs. cost`
                    : `-$${(purchaseNum - card.rawEstimatedValue).toLocaleString()} vs. cost`}
                </Text>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionBar}>
            {card && (
              <Pressable
                style={({ pressed }) => [styles.actionBtn, styles.actionPrimary, pressed && { opacity: 0.75 }]}
                onPress={() => router.push(`/card/${item.cardId}` as never)}
              >
                <Text style={styles.actionPrimaryText}>View full card</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.actionSecondary, pressed && { opacity: 0.7 }]}
              onPress={openEdit}
            >
              <Text style={styles.actionSecondaryText}>Edit</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.actionDanger, pressed && { opacity: 0.7 }]}
              onPress={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? <ActivityIndicator color="#f4a0b0" size="small" />
                : <Text style={styles.actionDangerText}>Remove</Text>}
            </Pressable>
          </View>

          {/* Edit Modal */}
          <Modal
            visible={editOpen}
            animationType="slide"
            transparent
            onRequestClose={() => setEditOpen(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalSheet}>
                <Text style={styles.modalTitle}>Edit entry</Text>

                <Text style={styles.fieldLabel}>Condition</Text>
                <View style={styles.conditionRow}>
                  {(["raw", "graded"] as const).map((c) => (
                    <Pressable
                      key={c}
                      style={[styles.conditionBtn, editCondition === c && styles.conditionBtnActive]}
                      onPress={() => setEditCondition(c)}
                    >
                      <Text style={[styles.conditionBtnText, editCondition === c && styles.conditionBtnTextActive]}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {editCondition === "graded" && (
                  <>
                    <Text style={styles.fieldLabel}>Grading company</Text>
                    <TextInput
                      style={styles.input}
                      value={editGradeCompany}
                      onChangeText={setEditGradeCompany}
                      placeholder="PSA, BGS, SGC…"
                      placeholderTextColor={vaultLoreTheme.colors.textSecondary}
                      autoCapitalize="characters"
                    />
                    <Text style={styles.fieldLabel}>Grade</Text>
                    <TextInput
                      style={styles.input}
                      value={editGradeValue}
                      onChangeText={setEditGradeValue}
                      placeholder="e.g. 9.5"
                      placeholderTextColor={vaultLoreTheme.colors.textSecondary}
                      keyboardType="decimal-pad"
                    />
                  </>
                )}

                <Text style={styles.fieldLabel}>Purchase price</Text>
                <TextInput
                  style={styles.input}
                  value={editPurchasePrice}
                  onChangeText={setEditPurchasePrice}
                  placeholder="0.00"
                  placeholderTextColor={vaultLoreTheme.colors.textSecondary}
                  keyboardType="decimal-pad"
                />

                <Text style={styles.fieldLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="Optional notes…"
                  placeholderTextColor={vaultLoreTheme.colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />

                {patchMutation.isError && (
                  <Text style={styles.mutationError}>Save failed. Please try again.</Text>
                )}

                <View style={styles.modalActions}>
                  <Pressable
                    style={({ pressed }) => [styles.modalCancelBtn, pressed && { opacity: 0.7 }]}
                    onPress={() => setEditOpen(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.modalSaveBtn, patchMutation.isPending && styles.modalSaveBtnDisabled, pressed && { opacity: 0.8 }]}
                    onPress={handleSaveEdit}
                    disabled={patchMutation.isPending}
                  >
                    {patchMutation.isPending
                      ? <ActivityIndicator color="#111" size="small" />
                      : <Text style={styles.modalSaveText}>Save changes</Text>}
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center" },
  content: { padding: 20, gap: 18, paddingBottom: 48 },
  backBtn: { paddingVertical: 4 },
  backBtnText: { color: vaultLoreTheme.colors.accentPlatinum, fontSize: 14, fontWeight: "600" },
  hero: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start"
  },
  heroImgSlot: {
    width: 72,
    height: 100,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: vaultLoreTheme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  heroGlyph: { color: vaultLoreTheme.colors.accentGold, fontSize: 26, opacity: 0.4 },
  gradeTag: {
    backgroundColor: "rgba(214,170,82,0.18)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.accentGold,
    borderRadius: vaultLoreTheme.radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  gradeTagText: {
    color: vaultLoreTheme.colors.accentGold,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5
  },
  heroRight: { flex: 1, gap: 4, paddingTop: 4 },
  heroCategory: {
    color: vaultLoreTheme.colors.accentGold,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  heroTitle: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24
  },
  heroSubject: { color: vaultLoreTheme.colors.textSecondary, fontSize: 14, fontWeight: "600" },
  heroMeta: { color: vaultLoreTheme.colors.textSecondary, fontSize: 12 },
  cardIdText: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 12,
    fontFamily: "monospace"
  },
  section: {
    backgroundColor: "rgba(18,21,29,0.84)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.lg,
    padding: 16,
    gap: 10
  },
  sectionTitle: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 2
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    paddingVertical: 2
  },
  detailLabel: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 13,
    flex: 1
  },
  detailValue: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flex: 2
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, flex: 2, justifyContent: "flex-end" },
  tagChip: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  tagText: { color: vaultLoreTheme.colors.textSecondary, fontSize: 11 },
  valueRow: { flexDirection: "row", alignItems: "center" },
  valueCell: { flex: 1, alignItems: "center", gap: 3 },
  valueCellDivider: {
    width: 1,
    height: 36,
    backgroundColor: vaultLoreTheme.colors.border
  },
  valueCellLabel: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8
  },
  valueCellValue: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: "800"
  },
  valueCellAccent: { color: vaultLoreTheme.colors.accentGold },
  gainLoss: {
    color: vaultLoreTheme.colors.accentEmerald,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center"
  },
  actionBar: { flexDirection: "row", gap: 10 },
  actionBtn: {
    borderRadius: vaultLoreTheme.radii.pill,
    paddingVertical: 14,
    alignItems: "center"
  },
  actionPrimary: {
    flex: 2,
    backgroundColor: vaultLoreTheme.colors.accentGold
  },
  actionPrimaryText: { color: "#111", fontWeight: "800", fontSize: 14 },
  actionSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    backgroundColor: "rgba(255,255,255,0.04)"
  },
  actionSecondaryText: {
    color: vaultLoreTheme.colors.textPrimary,
    fontWeight: "700",
    fontSize: 13
  },
  actionDanger: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(143,48,66,0.5)",
    backgroundColor: "rgba(143,48,66,0.1)"
  },
  actionDangerText: {
    color: "#f4a0b0",
    fontWeight: "700",
    fontSize: 13
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end"
  },
  modalSheet: {
    backgroundColor: "#12151d",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    padding: 24,
    gap: 12,
    paddingBottom: 40
  },
  modalTitle: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4
  },
  fieldLabel: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 4
  },
  conditionRow: { flexDirection: "row", gap: 8 },
  conditionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: vaultLoreTheme.radii.md,
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    alignItems: "center"
  },
  conditionBtnActive: {
    borderColor: vaultLoreTheme.colors.accentGold,
    backgroundColor: "rgba(214,170,82,0.12)"
  },
  conditionBtnText: { color: vaultLoreTheme.colors.textSecondary, fontWeight: "600", fontSize: 14 },
  conditionBtnTextActive: { color: vaultLoreTheme.colors.accentGold },
  input: {
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  textArea: { minHeight: 72, textAlignVertical: "top" },
  mutationError: { color: "#f4a0b0", fontSize: 13 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: vaultLoreTheme.radii.pill,
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    alignItems: "center"
  },
  modalCancelText: { color: vaultLoreTheme.colors.textSecondary, fontWeight: "600", fontSize: 14 },
  modalSaveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: vaultLoreTheme.radii.pill,
    backgroundColor: vaultLoreTheme.colors.accentGold,
    alignItems: "center"
  },
  modalSaveBtnDisabled: { backgroundColor: "rgba(214,170,82,0.25)" },
  modalSaveText: { color: "#111", fontWeight: "800", fontSize: 14 },
  errorText: { color: "#f4a0b0", fontSize: 16 },
  backLink: { color: vaultLoreTheme.colors.accentPlatinum, fontSize: 14 }
});

