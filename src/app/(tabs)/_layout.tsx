import { Tabs } from "expo-router";
import React from 'react';
import { useTheme } from "@/hooks/use-theme";
import { CustomTabBar } from "@/components/ui/custom-tab-bar";
import { BG_APP, BORDER_HAIRLINE, TEXT_PRIMARY } from "@/constants/theme";

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: BG_APP,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: BORDER_HAIRLINE,
        },
        headerTintColor: TEXT_PRIMARY,
        headerTitleStyle: {
          fontWeight: '500',
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "DevVault",
          tabBarLabel: "Vault",
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Collections",
          tabBarLabel: "Collections",
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarLabel: "Search",
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorites",
          tabBarLabel: "Favorites",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarLabel: "Settings",
        }}
      />
      <Tabs.Screen
        name="files"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}