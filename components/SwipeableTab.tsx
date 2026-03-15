/**
 * SwipeableTab
 * Wraps a tab screen and adds horizontal swipe-to-navigate between tabs.
 *
 * Swipe left  → next tab  (higher index)
 * Swipe right → previous tab (lower index)
 *
 * The gesture is only captured when clearly horizontal (dx dominant over dy),
 * so vertical scrolls in child ScrollViews are unaffected.
 * useFocusEffect resets translateX to 0 each time the tab comes into focus,
 * preventing stale transforms after back-navigation.
 */
import { View, Animated, PanResponder, Dimensions } from "react-native";
import { useRef, useCallback } from "react";
import { router, useFocusEffect } from "expo-router";

const TABS = [
  "/(tabs)/",
  "/(tabs)/time-manager",
  "/(tabs)/community",
  "/(tabs)/opportunities",
  "/(tabs)/profile",
] as const;

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = 60;

type Props = {
  /** Index of this tab in the TABS array (0 = Feed … 4 = Profile) */
  tabIndex: number;
  /** Background colour of this screen — keeps the sliding view opaque */
  backgroundColor: string;
  children: React.ReactNode;
};

export default function SwipeableTab({ tabIndex, backgroundColor, children }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const hasPrev = tabIndex > 0;
  const hasNext = tabIndex < TABS.length - 1;

  // Reset position every time this tab gains focus
  useFocusEffect(
    useCallback(() => {
      translateX.setValue(0);
    }, [translateX])
  );

  function snapBack() {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 8,
    }).start();
  }

  const pan = useRef(
    PanResponder.create({
      // Only capture clearly horizontal gestures (dx strictly dominant over dy)
      onMoveShouldSetPanResponderCapture: (_, g) =>
        Math.abs(g.dx) > 20 && Math.abs(g.dy) < Math.abs(g.dx) * 0.4,

      onPanResponderMove: (_, g) => {
        // Extra guard: only translate when horizontal movement is strictly dominant
        if (Math.abs(g.dx) <= Math.abs(g.dy)) return;
        if (g.dx < 0 && hasNext) translateX.setValue(g.dx);
        if (g.dx > 0 && hasPrev) translateX.setValue(g.dx);
      },

      onPanResponderRelease: (_, g) => {
        if (g.dx < -SWIPE_THRESHOLD && hasNext && Math.abs(g.dy) < 120) {
          // Swipe left → next tab
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            router.navigate(TABS[tabIndex + 1]);
            translateX.setValue(0);
          });
        } else if (g.dx > SWIPE_THRESHOLD && hasPrev && Math.abs(g.dy) < 120) {
          // Swipe right → previous tab
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            router.navigate(TABS[tabIndex - 1]);
            translateX.setValue(0);
          });
        } else {
          snapBack();
        }
      },

      onPanResponderTerminate: () => snapBack(),
    })
  ).current;

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <Animated.View
        style={{ flex: 1, backgroundColor, transform: [{ translateX }] }}
        {...pan.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}
