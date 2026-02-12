import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface GitaLanguageSelectorProps {
  visible: boolean;
  currentLanguage: "english" | "hindi";
  onSelect: (language: "english" | "hindi") => void;
  onClose: () => void;
}

export default function GitaLanguageSelector({
  visible,
  currentLanguage,
  onSelect,
  onClose,
}: GitaLanguageSelectorProps) {
  const languages = [
    { id: "english" as const, label: "English", icon: "🇬🇧" },
    { id: "hindi" as const, label: "हिंदी (Hindi)", icon: "🇮🇳" },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Language</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.id}
              style={[
                styles.languageOption,
                currentLanguage === lang.id && styles.languageOptionActive,
              ]}
              onPress={() => onSelect(lang.id)}
            >
              <Text style={styles.languageIcon}>{lang.icon}</Text>
              <Text
                style={[
                  styles.languageLabel,
                  currentLanguage === lang.id && styles.languageLabelActive,
                ]}
              >
                {lang.label}
              </Text>
              {currentLanguage === lang.id && (
                <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
              )}
            </TouchableOpacity>
          ))}

          <Text style={styles.helperText}>
            The guidance will be provided in your selected language.
          </Text>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  languageOptionActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
  },
  languageIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  languageLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  languageLabelActive: {
    color: "#4F46E5",
    fontWeight: "600",
  },
  helperText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
});
