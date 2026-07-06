import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import {
  BG_BASE,
  BG_CARD,
  ACCENT_TEAL,
  ACCENT_TEAL_LIGHT,
  ACCENT_TEAL_WASH,
  TEXT_SECONDARY,
  TEXT_DISABLED,
  BORDER_SUBTLE,
  SCREEN_H_PAD,
} from '@/constants/theme';

const { width } = Dimensions.get('window');

interface Slide {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgLight: string;
}

const ONBOARDING_SLIDES: Slide[] = [
  {
    id: 1,
    title: "DevVault",
    description: "A local, offline-first code vault. Save, organize, and revisit reusable code blocks — fast and private.",
    icon: "code-slash-outline",
    color: ACCENT_TEAL,
    bgLight: ACCENT_TEAL_WASH,
  },
  {
    id: 2,
    title: "Offline Storage",
    description: "All snippets, languages, and tags live in a local SQLite database. No internet required — ever.",
    icon: "server-outline",
    color: '#378ADD',
    bgLight: 'rgba(55,138,221,0.10)',
  },
  {
    id: 3,
    title: "AI Explanations",
    description: "Add your OpenAI key in Settings to unlock code analysis, summaries, and improvement suggestions.",
    icon: "sparkles-outline",
    color: '#7F77DD',
    bgLight: 'rgba(127,119,221,0.10)',
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };

  const handleNext = async () => {
    if (activeIndex < ONBOARDING_SLIDES.length - 1) {
      scrollRef.current?.scrollTo({
        x: (activeIndex + 1) * width,
        animated: true,
      });
    } else {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      router.replace('/(tabs)/home');
    } catch (e) {
      console.error("Failed to complete onboarding:", e);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Skip button header */}
        <View style={styles.header}>
          {activeIndex < ONBOARDING_SLIDES.length - 1 ? (
            <Pressable
              onPress={handleComplete}
              style={styles.skipBtn}
              hitSlop={12}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Skip intro"
            >
              <ThemedText type="caption" themeColor="textSecondary">
                Skip
              </ThemedText>
            </Pressable>
          ) : (
            <View style={{ height: 20 }} />
          )}
        </View>

        {/* Swipe pages */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContainer}
        >
          {ONBOARDING_SLIDES.map((slide) => (
            <View key={slide.id} style={styles.slide}>
              {/* Icon wrapper — bg-card per Design.md */}
              <View style={[styles.iconWrapper, { backgroundColor: slide.bgLight }]}>
                <Ionicons name={slide.icon} size={72} color={slide.color} />
              </View>
              <View style={styles.textWrapper}>
                <ThemedText type="screenTitle" style={styles.slideTitle}>
                  {slide.title}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary" style={styles.slideDesc}>
                  {slide.description}
                </ThemedText>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Navigation row */}
        <View style={styles.footer}>
          {/* Dot Indicators — teal active */}
          <View style={styles.dotsRow}>
            {ONBOARDING_SLIDES.map((_, index) => (
              <View
                key={`dot-${index}`}
                style={[
                  styles.dot,
                  { backgroundColor: activeIndex === index ? ACCENT_TEAL : BG_CARD },
                  activeIndex === index && { width: 16 },
                ]}
              />
            ))}
          </View>

          {/* Action button — accent-teal-wash bg + teal-light text, radius-8 per Design.md §4 */}
          <Pressable
            onPress={handleNext}
            style={[
              styles.actionBtn,
              { backgroundColor: activeIndex === ONBOARDING_SLIDES.length - 1 ? ACCENT_TEAL : ACCENT_TEAL_WASH },
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={activeIndex === ONBOARDING_SLIDES.length - 1 ? "Enter the app" : "Next"}
          >
            <ThemedText style={[
              styles.actionBtnText,
              { color: activeIndex === ONBOARDING_SLIDES.length - 1 ? '#fff' : ACCENT_TEAL_LIGHT },
            ]}>
              {activeIndex === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </ThemedText>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={activeIndex === ONBOARDING_SLIDES.length - 1 ? '#fff' : ACCENT_TEAL_LIGHT}
            />
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SCREEN_H_PAD,
    paddingTop: 8,
  },
  skipBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  scrollContainer: {
    alignItems: 'center',
  },
  slide: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 32,
  },
  // Icon wrapper — bg-card per Design.md §4
  iconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: BORDER_SUBTLE,
  },
  textWrapper: {
    alignItems: 'center',
    gap: 12,
  },
  slideTitle: {
    textAlign: 'center',
  },
  slideDesc: {
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  footer: {
    paddingHorizontal: SCREEN_H_PAD,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Action button — radius-8 per Design.md §4
  actionBtn: {
    width: '100%',
    height: 44,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
