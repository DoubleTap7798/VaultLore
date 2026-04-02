import { useState } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { vaultLoreTheme } from "@vaultlore/ui";

import { apiClient } from "../lib/api";

const CATEGORY_HINTS = [
  { slug: "basketball", label: "Basketball" },
  { slug: "baseball", label: "Baseball" },
  { slug: "football", label: "Football" },
  { slug: "pokemon", label: "Pokémon" },
  { slug: "marvel", label: "Marvel" },
  { slug: "entertainment", label: "Entertainment" },
  { slug: "tcg", label: "TCG" }
];

export default function ScanScreen() {
  const router = useRouter();
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);
  const [categoryHint, setCategoryHint] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async (side: "front" | "back", source: "camera" | "library") => {
    const setter = side === "front" ? setFrontUri : setBackUri;

    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setError("Camera access is required to scan a card.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [7, 10],
        quality: 0.85
      });
      if (!result.canceled && result.assets[0]) setter(result.assets[0].uri);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setError("Photo library access is required to select a card image.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [7, 10],
        quality: 0.85
      });
      if (!result.canceled && result.assets[0]) setter(result.assets[0].uri);
    }
    setError(null);
  };

  const submitScan = async () => {
    if (!frontUri) {
      setError("A front image is required to scan.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      let result;

      // Build real multipart form data from local image URIs.
      const formData = new FormData();

      // React Native FormData accepts { uri, name, type } objects as file parts.
      formData.append("front", {
        uri: frontUri,
        name: "front.jpg",
        type: "image/jpeg"
      } as unknown as Blob);

      if (backUri) {
        formData.append("back", {
          uri: backUri,
          name: "back.jpg",
          type: "image/jpeg"
        } as unknown as Blob);
      }

      if (categoryHint) {
        formData.append("categoryHint", categoryHint);
      }

      // Upload images and create scan job in one call.
      result = await apiClient.uploadCardScan(formData);

      router.push(`/scan-pending?jobId=${result.jobId}` as never);
    } catch {
      setError("Scan submission failed. Check that the server is running and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={["#07090d", "#111624", "#261d16"]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.badge}>VaultLore</Text>
            <Text style={styles.title}>Scan a card</Text>
            <Text style={styles.subtitle}>
              Capture or select a card image. Our worker will identify it and return value intelligence.
            </Text>
          </View>

          {/* Image capture area */}
          <View style={styles.imageSection}>
            <Text style={styles.imageSectionLabel}>Front image <Text style={styles.required}>Required</Text></Text>
            <View style={styles.imageSlotRow}>
              {frontUri ? (
                <Pressable onPress={() => setFrontUri(null)} style={styles.imagePreview}>
                  <Image source={{ uri: frontUri }} style={styles.previewImg} resizeMode="cover" />
                  <View style={styles.removeOverlay}>
                    <Text style={styles.removeText}>✕</Text>
                  </View>
                </Pressable>
              ) : (
                <View style={styles.imageSlot}>
                  <Text style={styles.imageSlotGlyph}>◈</Text>
                  <Text style={styles.imageSlotCaption}>No image</Text>
                </View>
              )}
              <View style={styles.imageActions}>
                <Pressable
                  style={({ pressed }) => [styles.imgBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => pickImage("front", "camera")}
                >
                  <Text style={styles.imgBtnText}>📷  Take photo</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.imgBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => pickImage("front", "library")}
                >
                  <Text style={styles.imgBtnText}>🖼  Choose from library</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.imageSectionLabel}>Back image <Text style={styles.optional}>Optional</Text></Text>
            <View style={styles.imageSlotRow}>
              {backUri ? (
                <Pressable onPress={() => setBackUri(null)} style={styles.imagePreview}>
                  <Image source={{ uri: backUri }} style={styles.previewImg} resizeMode="cover" />
                  <View style={styles.removeOverlay}>
                    <Text style={styles.removeText}>✕</Text>
                  </View>
                </Pressable>
              ) : (
                <View style={[styles.imageSlot, styles.imageSlotOptional]}>
                  <Text style={styles.imageSlotGlyph}>+</Text>
                  <Text style={styles.imageSlotCaption}>Add back</Text>
                </View>
              )}
              <View style={styles.imageActions}>
                <Pressable
                  style={({ pressed }) => [styles.imgBtn, styles.imgBtnSecondary, pressed && { opacity: 0.7 }]}
                  onPress={() => pickImage("back", "camera")}
                >
                  <Text style={styles.imgBtnText}>📷  Take photo</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.imgBtn, styles.imgBtnSecondary, pressed && { opacity: 0.7 }]}
                  onPress={() => pickImage("back", "library")}
                >
                  <Text style={styles.imgBtnText}>🖼  Choose from library</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Category hint picker */}
          <View style={styles.hintSection}>
            <Text style={styles.hintLabel}>Category hint <Text style={styles.optional}>Improves accuracy</Text></Text>
            <View style={styles.hintChips}>
              {CATEGORY_HINTS.map((c) => (
                <Pressable
                  key={c.slug}
                  style={[styles.hintChip, categoryHint === c.slug && styles.hintChipActive]}
                  onPress={() => setCategoryHint(categoryHint === c.slug ? null : c.slug)}
                >
                  <Text style={[styles.hintChipText, categoryHint === c.slug && styles.hintChipTextActive]}>
                    {c.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            disabled={submitting || !frontUri}
            style={({ pressed }) => [
              styles.cta,
              (!frontUri || submitting) && styles.ctaDisabled,
              pressed && frontUri && !submitting && { opacity: 0.8 }
            ]}
            onPress={submitScan}
          >
            {submitting ? (
              <View style={styles.ctaInner}>
                <ActivityIndicator color="#111" />
                <Text style={styles.ctaText}>Submitting scan…</Text>
              </View>
            ) : (
              <Text style={styles.ctaText}>Submit scan</Text>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 48 },
  hero: { gap: 8, paddingTop: 12 },
  badge: {
    color: vaultLoreTheme.colors.accentGold,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: "700"
  },
  title: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40
  },
  subtitle: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22
  },
  imageSection: {
    backgroundColor: "rgba(18,21,29,0.84)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.lg,
    padding: 16,
    gap: 12
  },
  imageSectionLabel: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "700"
  },
  required: { color: vaultLoreTheme.colors.accentCrimson, fontWeight: "600" },
  optional: { color: vaultLoreTheme.colors.textSecondary, fontWeight: "400", fontSize: 12 },
  imageSlotRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  imageSlot: {
    width: 72,
    height: 100,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: vaultLoreTheme.colors.accentGold,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4
  },
  imageSlotOptional: {
    borderColor: vaultLoreTheme.colors.border,
    borderStyle: "dashed"
  },
  imageSlotGlyph: {
    color: vaultLoreTheme.colors.accentGold,
    fontSize: 24,
    opacity: 0.5
  },
  imageSlotCaption: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 10
  },
  imagePreview: {
    width: 72,
    height: 100,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative"
  },
  previewImg: { width: "100%", height: "100%" },
  removeOverlay: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  removeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  imageActions: { flex: 1, gap: 8 },
  imgBtn: {
    backgroundColor: "rgba(214,170,82,0.12)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.accentGold,
    borderRadius: vaultLoreTheme.radii.pill,
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  imgBtnSecondary: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: vaultLoreTheme.colors.border
  },
  imgBtnText: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "600"
  },
  hintSection: {
    backgroundColor: "rgba(18,21,29,0.84)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.lg,
    padding: 16,
    gap: 12
  },
  hintLabel: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "700"
  },
  hintChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  hintChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: vaultLoreTheme.radii.pill,
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    backgroundColor: "rgba(255,255,255,0.03)"
  },
  hintChipActive: {
    backgroundColor: "rgba(214,170,82,0.15)",
    borderColor: vaultLoreTheme.colors.accentGold
  },
  hintChipText: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "600"
  },
  hintChipTextActive: { color: vaultLoreTheme.colors.accentGold },
  errorBox: {
    backgroundColor: "rgba(143, 48, 66, 0.14)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.accentCrimson,
    borderRadius: vaultLoreTheme.radii.md,
    padding: 13
  },
  errorText: { color: "#f4a0b0", fontSize: 14, lineHeight: 20 },
  cta: {
    backgroundColor: vaultLoreTheme.colors.accentGold,
    borderRadius: vaultLoreTheme.radii.pill,
    alignItems: "center",
    paddingVertical: 16
  },
  ctaDisabled: { backgroundColor: "rgba(214,170,82,0.25)" },
  ctaInner: { flexDirection: "row", gap: 10, alignItems: "center" },
  ctaText: { color: "#111", fontWeight: "800", fontSize: 16 }
});

