/**
 * CustomTabBar — Design.md §5
 *
 * • Flat full-width bar (not floating pill)
 * • border-hairline top divider above bar
 * • bg-app (#0b0e10) background
 * • Active: accent-teal-light (#5DCAA5) icon
 * • Inactive: text-disabled (#5f5e5a)
 * • No labels (user preference)
 * • No drop shadows per Design.md §8
 */
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  BG_APP,
  BORDER_HAIRLINE,
  ACCENT_TEAL_LIGHT,
  TEXT_DISABLED,
} from '@/constants/theme';

type IoniconsName = keyof typeof Ionicons.glyphMap;

function getTabIcon(routeName: string, focused: boolean): IoniconsName {
  switch (routeName) {
    case 'home':      return focused ? 'code-slash'      : 'code-slash-outline';
    case 'search':    return focused ? 'search'           : 'search-outline';
    case 'explore':   return focused ? 'albums'           : 'albums-outline';
    case 'favorites': return focused ? 'heart'            : 'heart-outline';
    case 'settings':  return focused ? 'settings'         : 'settings-outline';
    default:          return 'ellipse-outline';
  }
}

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Hairline divider above bar per Design.md §5 */}
      <View style={styles.hairline} />

      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          const iconName = getTabIcon(route.name, isFocused);
          const iconColor = isFocused ? ACCENT_TEAL_LIGHT : TEXT_DISABLED;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.7}
              style={styles.tabItem}
              accessibilityRole="tab"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? route.name}
            >
              {/* Active teal dot indicator above icon */}
              {isFocused && <View style={styles.activeDot} />}

              <Ionicons name={iconName} size={22} color={iconColor} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BG_APP,
  },
  hairline: {
    height: 1,
    backgroundColor: BORDER_HAIRLINE,
  },
  bar: {
    flexDirection: 'row',
    height: 52,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ACCENT_TEAL_LIGHT,
    position: 'absolute',
    top: 6,
  },
});
