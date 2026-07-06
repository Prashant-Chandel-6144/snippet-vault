import React from 'react';
import { ScrollView, StyleSheet, View, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, BG_APP, BORDER_HAIRLINE, TEXT_PRIMARY, ACCENT_TEAL, ACCENT_TEAL_WASH } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const EFFECTIVE_DATE = 'July 6, 2025';
const APP_NAME = 'DevVault';
const CONTACT_EMAIL = 'prashant2011@outlook.com';

interface PolicySectionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
  accentColor?: string;
}

function PolicySection({ icon, title, children, accentColor = ACCENT_TEAL }: PolicySectionProps) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconBadge, { backgroundColor: accentColor + '18' }]}>
          <Ionicons name={icon} size={18} color={accentColor} />
        </View>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </ThemedView>
  );
}

function BulletItem({ children }: { children: React.ReactNode }) {
  const theme = useTheme();

  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletDot, { backgroundColor: theme.accent }]} />
      <ThemedText style={styles.bulletText} themeColor="textSecondary">
        {children}
      </ThemedText>
    </View>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.infoChip, { backgroundColor: theme.backgroundDeep, borderColor: theme.borderSubtle }]}>
      <ThemedText style={styles.chipLabel} themeColor="textTertiary">
        {label}
      </ThemedText>
      <ThemedText style={styles.chipValue}>{value}</ThemedText>
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      {/* Custom Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: BG_APP,
            borderBottomColor: BORDER_HAIRLINE,
            paddingTop: Platform.OS === 'android' ? insets.top + Spacing.two : Spacing.two,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color={TEXT_PRIMARY} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Privacy Policy</ThemedText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.six },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.shieldIcon, { backgroundColor: ACCENT_TEAL_WASH }]}>
            <Ionicons name="shield-checkmark" size={36} color={ACCENT_TEAL} />
          </View>
          <ThemedText style={styles.heroTitle}>Your Privacy Matters</ThemedText>
          <ThemedText style={styles.heroSubtitle} themeColor="textSecondary">
            {APP_NAME} is built with an offline-first architecture. Your data stays on your device — always.
          </ThemedText>
        </View>

        {/* Quick Info Chips */}
        <View style={styles.chipRow}>
          <InfoChip label="Effective" value={EFFECTIVE_DATE} />
          <InfoChip label="Architecture" value="Offline-First" />
        </View>

        {/* Section 1: Overview */}
        <PolicySection icon="information-circle-outline" title="Overview">
          <ThemedText style={styles.bodyText} themeColor="textSecondary">
            {APP_NAME} ("the App") is a developer-focused mobile application that allows you to save,
            organize, manage, and understand code snippets directly on your device. This Privacy Policy
            explains what data the App handles, how it is stored, and your rights regarding that data.
          </ThemedText>
          <ThemedText style={[styles.bodyText, { marginTop: Spacing.two }]} themeColor="textSecondary">
            By using {APP_NAME}, you agree to the practices described in this policy. If you do not agree,
            please discontinue use of the App.
          </ThemedText>
        </PolicySection>

        {/* Section 2: Data We Collect */}
        <PolicySection icon="layers-outline" title="Data We Collect">
          <ThemedText style={styles.subsectionTitle}>Snippet Data</ThemedText>
          <ThemedText style={styles.bodyText} themeColor="textSecondary">
            All code snippets you create — including titles, code content, programming language,
            tags, and favorite status — are stored exclusively in a local SQLite database on your device.
          </ThemedText>

          <ThemedText style={[styles.subsectionTitle, { marginTop: Spacing.three }]}>
            Application Preferences
          </ThemedText>
          <ThemedText style={styles.bodyText} themeColor="textSecondary">
            Theme preferences and application settings are stored locally using AsyncStorage.
            These preferences never leave your device.
          </ThemedText>

          <ThemedText style={[styles.subsectionTitle, { marginTop: Spacing.three }]}>
            API Keys
          </ThemedText>
          <ThemedText style={styles.bodyText} themeColor="textSecondary">
            If you choose to use AI-powered features, your API key is stored securely on your
            device using Expo SecureStore, which leverages the platform's native keychain
            (iOS Keychain / Android Keystore). The App never transmits your API key to any
            server other than the AI provider you have configured.
          </ThemedText>

          <ThemedText style={[styles.subsectionTitle, { marginTop: Spacing.three }]}>
            Files &amp; Attachments
          </ThemedText>
          <ThemedText style={styles.bodyText} themeColor="textSecondary">
            Screenshots, code files, templates, and other resources attached to snippets are
            stored locally on your device's filesystem using Expo FileSystem. These files remain
            entirely on-device and are not uploaded to any cloud service.
          </ThemedText>
        </PolicySection>

        {/* Section 3: How Data Is Stored */}
        <PolicySection icon="server-outline" title="How Data Is Stored">
          <ThemedText style={styles.bodyText} themeColor="textSecondary">
            {APP_NAME} uses the following storage technologies, each for a specific purpose:
          </ThemedText>

          <View style={styles.storageTable}>
            <View style={[styles.tableRow, { backgroundColor: theme.backgroundDeep }]}>
              <ThemedText style={styles.tableHeader}>Technology</ThemedText>
              <ThemedText style={styles.tableHeader}>Purpose</ThemedText>
            </View>
            {[
              ['SQLite', 'Snippet database, tags, languages, AI explanations'],
              ['AsyncStorage', 'Theme & app preferences, onboarding state'],
              ['SecureStore', 'API keys & sensitive credentials'],
              ['Expo FileSystem', 'Attached files, screenshots, exported snippets'],
            ].map(([tech, purpose], idx) => (
              <View
                key={tech}
                style={[
                  styles.tableRow,
                  idx % 2 === 1 && { backgroundColor: theme.backgroundDeep + '60' },
                ]}
              >
                <ThemedText style={styles.tableCell}>{tech}</ThemedText>
                <ThemedText style={styles.tableCellWide} themeColor="textSecondary">
                  {purpose}
                </ThemedText>
              </View>
            ))}
          </View>

          <ThemedText style={[styles.bodyText, { marginTop: Spacing.three }]} themeColor="textSecondary">
            All storage is local to your device. No data is synced to external servers or
            cloud storage as part of the App's core functionality.
          </ThemedText>
        </PolicySection>

        {/* Section 4: AI Integration */}
        <PolicySection icon="sparkles-outline" title="AI Code Explanation" accentColor="#7F77DD">
          <ThemedText style={styles.bodyText} themeColor="textSecondary">
            {APP_NAME} offers an optional AI-powered feature that generates code explanations,
            summaries, and improvement suggestions for your snippets.
          </ThemedText>

          <ThemedText style={[styles.subsectionTitle, { marginTop: Spacing.three }]}>
            How It Works
          </ThemedText>
          <BulletItem>
            When you request an AI explanation, the selected snippet's code content is sent to
            the AI provider's API (e.g., OpenAI) using the API key you have provided.
          </BulletItem>
          <BulletItem>
            The request is made directly from your device to the AI provider — no intermediary
            servers are involved.
          </BulletItem>
          <BulletItem>
            AI-generated responses are cached locally in your SQLite database for offline access.
          </BulletItem>
          <BulletItem>
            We do not store, log, or have access to any data sent to or received from the AI provider.
          </BulletItem>

          <View style={[styles.warningBox, { borderColor: '#EF9F27' + '40', backgroundColor: '#EF9F27' + '0A' }]}>
            <Ionicons name="alert-circle-outline" size={16} color="#EF9F27" />
            <ThemedText style={styles.warningText} themeColor="textSecondary">
              Please review your AI provider's own privacy policy to understand how they handle
              data sent via API requests. {APP_NAME} has no control over third-party data processing.
            </ThemedText>
          </View>
        </PolicySection>

        {/* Section 5: Export & Sharing */}
        <PolicySection icon="share-outline" title="Export &amp; Sharing">
          <ThemedText style={styles.bodyText} themeColor="textSecondary">
            {APP_NAME} allows you to export and share your snippets through the following mechanisms:
          </ThemedText>
          <BulletItem>
            Export snippets as .txt, .js, or .json files saved locally on your device.
          </BulletItem>
          <BulletItem>
            Share snippets with other applications using your device's native share sheet.
          </BulletItem>
          <BulletItem>
            Exported files are saved to your device's local storage and are not uploaded automatically.
          </BulletItem>
          <ThemedText style={[styles.bodyText, { marginTop: Spacing.two }]} themeColor="textSecondary">
            When you use the share functionality, the destination app's privacy policy governs
            how the shared data is handled. {APP_NAME} does not track or log sharing activity.
          </ThemedText>
        </PolicySection>

        {/* Section 6: Data We Do NOT Collect */}
        <PolicySection icon="eye-off-outline" title="Data We Do NOT Collect" accentColor="#1D9E75">
          <ThemedText style={styles.bodyText} themeColor="textSecondary">
            {APP_NAME} is designed with privacy at its core. We do not:
          </ThemedText>
          <BulletItem>Collect personal information (name, email, phone number)</BulletItem>
          <BulletItem>Track your location or device identifiers</BulletItem>
          <BulletItem>Use analytics or crash-reporting SDKs</BulletItem>
          <BulletItem>Display advertisements or use ad-tracking</BulletItem>
          <BulletItem>Require user accounts or authentication</BulletItem>
          <BulletItem>Sync, upload, or back up your data to any server</BulletItem>
          <BulletItem>Share any data with third parties (except as described in the AI section)</BulletItem>
        </PolicySection>

        {/* Section 7: Permissions */}
        <PolicySection icon="lock-open-outline" title="Device Permissions">
          <ThemedText style={styles.bodyText} themeColor="textSecondary">
            {APP_NAME} may request the following device permissions:
          </ThemedText>

          <View style={styles.permissionList}>
            {[
              {
                icon: 'camera-outline' as const,
                perm: 'Camera',
                reason: 'To capture screenshots for snippet attachments',
              },
              {
                icon: 'images-outline' as const,
                perm: 'Photo Library',
                reason: 'To select images to attach to snippets',
              },
              {
                icon: 'document-outline' as const,
                perm: 'File Access',
                reason: 'To import, export, and manage local files',
              },
              {
                icon: 'finger-print-outline' as const,
                perm: 'Biometric Auth',
                reason: 'To protect access to sensitive stored credentials',
              },
            ].map((item) => (
              <View key={item.perm} style={[styles.permRow, { borderColor: theme.borderSubtle }]}>
                <View style={[styles.permIcon, { backgroundColor: theme.backgroundDeep }]}>
                  <Ionicons name={item.icon} size={16} color={theme.textSecondary} />
                </View>
                <View style={styles.permInfo}>
                  <ThemedText style={styles.permName}>{item.perm}</ThemedText>
                  <ThemedText style={styles.permReason} themeColor="textTertiary">
                    {item.reason}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>

          <ThemedText style={[styles.bodyText, { marginTop: Spacing.three }]} themeColor="textSecondary">
            All permissions are optional and requested only when you initiate the relevant action.
            Denying a permission will not affect other App functionality.
          </ThemedText>
        </PolicySection>

        {/* Section 8: Data Retention & Deletion */}
        <PolicySection icon="trash-outline" title="Data Retention &amp; Deletion" accentColor="#D85A30">
          <ThemedText style={styles.bodyText} themeColor="textSecondary">
            Since all data is stored locally on your device, you have full control over its lifecycle:
          </ThemedText>
          <BulletItem>
            Delete individual snippets, files, or tags at any time through the App's interface.
          </BulletItem>
          <BulletItem>
            Use the "Reset Local Database" option in Settings to erase all snippet data,
            tags, and file records at once.
          </BulletItem>
          <BulletItem>
            Uninstalling the App will remove all locally stored data permanently.
          </BulletItem>
          <BulletItem>
            Stored API keys can be cleared from Settings or will be removed on uninstall.
          </BulletItem>
        </PolicySection>

        {/* Section 9: Children's Privacy */}
        <PolicySection icon="people-outline" title="Children's Privacy">
          <ThemedText style={styles.bodyText} themeColor="textSecondary">
            {APP_NAME} is a general-purpose developer tool and is not directed at children
            under 13. We do not knowingly collect any personal information from children. Since
            the App does not collect personal data from any user, no special provisions for
            children's data apply.
          </ThemedText>
        </PolicySection>

        {/* Section 10: Changes to this Policy */}
        <PolicySection icon="document-text-outline" title="Changes to This Policy">
          <ThemedText style={styles.bodyText} themeColor="textSecondary">
            We may update this Privacy Policy from time to time to reflect changes in the App's
            functionality or for legal compliance. Any updates will be published within the App
            with a revised effective date. Continued use of the App after changes constitutes
            acceptance of the updated policy.
          </ThemedText>
        </PolicySection>

        {/* Section 11: Contact */}
        <PolicySection icon="mail-outline" title="Contact Us">
          <ThemedText style={styles.bodyText} themeColor="textSecondary">
            If you have questions, concerns, or feedback regarding this Privacy Policy or the
            App's data practices, please reach out:
          </ThemedText>
          <View style={[styles.contactBox, { backgroundColor: theme.backgroundDeep, borderColor: theme.borderSubtle }]}>
            <View style={styles.contactRow}>
              <Ionicons name="mail" size={14} color={ACCENT_TEAL} />
              <ThemedText style={styles.contactValue}>{CONTACT_EMAIL}</ThemedText>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="cube" size={14} color={ACCENT_TEAL} />
              <ThemedText style={styles.contactValue}>{APP_NAME} v1.0.0</ThemedText>
            </View>
          </View>
        </PolicySection>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={14} color={theme.textTertiary} />
          <ThemedText style={styles.footerText} themeColor="textTertiary">
            {APP_NAME} — Privacy-first, offline-first.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    gap: Spacing.four,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  shieldIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },

  // Info Chips
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  infoChip: {
    flex: 1,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    alignItems: 'center',
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.one,
  },
  chipValue: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Section Cards
  sectionCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  sectionBody: {},
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.one,
  },

  // Body text
  bodyText: {
    fontSize: 13,
    lineHeight: 20,
  },

  // Bullets
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },

  // Storage Table
  storageTable: {
    marginTop: Spacing.three,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  tableHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    flex: 1,
  },
  tableCell: {
    fontSize: 12,
    fontWeight: '600',
    width: 100,
  },
  tableCellWide: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },

  // Warning box
  warningBox: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    marginTop: Spacing.three,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },

  // Permissions
  permissionList: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.two,
  },
  permIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permInfo: {
    flex: 1,
  },
  permName: {
    fontSize: 13,
    fontWeight: '600',
  },
  permReason: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },

  // Contact box
  contactBox: {
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    gap: Spacing.two,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  contactValue: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
