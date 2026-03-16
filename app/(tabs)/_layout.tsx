import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const TAB_HEIGHT = 60 + insets.bottom;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: TAB_HEIGHT,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            index: "home-outline",
            community: "compass-outline",
            profile: "person-outline",
            // Hidden tabs (still accessible via router.push)
            "time-manager": "calendar-outline",
            opportunities: "search-outline",
          };
          return <Ionicons name={iconMap[route.name] ?? "ellipse-outline"} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="community" options={{ title: "community" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      {/* These screens remain accessible via router.push but are not shown in the tab bar */}
      <Tabs.Screen name="time-manager" options={{ href: null }} />
      <Tabs.Screen name="opportunities" options={{ href: null }} />
    </Tabs>
  );
}
