/**
 * Onboarding — shown on first launch and when not authenticated.
 * 6 steps: Welcome → Account (Firebase Auth) → Basic Info → Interests → Free Time → Feature Intro
 *
 * Step 1 creates a real Firebase Auth account (or signs in to existing one).
 * On finish: writes profile to Firestore with hasOnboarded:true, navigates to tabs.
 */
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Dimensions, Animated, Image, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { FreeTimePerDay } from "../types/Profile";

const { width: SCREEN_W } = Dimensions.get("window");
const TOTAL_STEPS = 6;

// ── Hobby grid data ───────────────────────────────────────────────────────────

const HOBBY_OPTIONS: { label: string; icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap }[] = [
  { label: "Music", icon: "musical-notes-outline" },
  { label: "Sports", icon: "football-outline" },
  { label: "Photography", icon: "camera-outline" },
  { label: "Drawing & Art", icon: "color-palette-outline" },
  { label: "Coding", icon: "code-slash-outline" },
  { label: "Cooking", icon: "restaurant-outline" },
  { label: "Gaming", icon: "game-controller-outline" },
  { label: "Reading", icon: "book-outline" },
  { label: "Dance", icon: "body-outline" },
  { label: "Film & Video", icon: "videocam-outline" },
  { label: "Languages", icon: "globe-outline" },
  { label: "Science", icon: "flask-outline" },
  { label: "Writing", icon: "pencil-outline" },
  { label: "Theater", icon: "happy-outline" },
  { label: "Yoga", icon: "accessibility-outline" },
  { label: "Fashion", icon: "shirt-outline" },
];

const FREE_TIME_OPTIONS: { label: string; sub: string; value: FreeTimePerDay }[] = [
  { label: "< 30 min", sub: "Just a little", value: "<30" },
  { label: "30 – 60 min", sub: "About an hour", value: "30-60" },
  { label: "1 – 2 hours", sub: "Pretty free", value: "1-2h" },
  { label: "2+ hours", sub: "Lots of time!", value: "2h+" },
];

const FEATURES = [
  { icon: "calendar-outline" as const, title: "Manage your time", body: "Schedule hobby sessions, track habits, and build daily streaks." },
  { icon: "compass-outline" as const, title: "Discover programs", body: "Find real clubs, workshops, and programs near you." },
  { icon: "chatbubbles-outline" as const, title: "Connect with peers", body: "Chat with others who share your interests in hobby channels." },
];

// ── Translate Firebase auth error codes into readable messages ────────────────

function friendlyAuthError(code: string): string {
  switch (code) {
    case "auth/email-already-in-use": return "An account with this email already exists. Try signing in instead.";
    case "auth/invalid-email": return "Please enter a valid email address.";
    case "auth/weak-password": return "Password must be at least 6 characters.";
    case "auth/user-not-found": return "No account found with this email.";
    case "auth/wrong-password": return "Incorrect password. Please try again.";
    case "auth/invalid-credential": return "Incorrect email or password.";
    case "auth/too-many-requests": return "Too many attempts. Please wait a moment and try again.";
    default: return "Something went wrong. Please try again.";
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { saveProfile, profile } = useProfile();
  const { signUp, signIn, user } = useAuth();

  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signInMode, setSignInMode] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [freeTime, setFreeTime] = useState<FreeTimePerDay | "">("");

  // If user is already authenticated on mount (e.g. returning mid-onboarding),
  // skip the account-creation steps and go straight to basic info
  useEffect(() => {
    if (user && step === 0) {
      setStep(2);
    }
  }, []); // intentionally runs once on mount only

  function animateTo(nextStep: number) {
    const direction = nextStep > step ? -1 : 1;
    Animated.timing(slideAnim, { toValue: direction * SCREEN_W * 0.3, duration: 150, useNativeDriver: true }).start(() => {
      setStep(nextStep);
      slideAnim.setValue(-direction * SCREEN_W * 0.3);
      Animated.timing(slideAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    });
  }

  function goNext() { if (step < TOTAL_STEPS - 1) animateTo(step + 1); }
  function goBack() { if (step > 0) animateTo(step - 1); }

  function toggleHobby(label: string) {
    setSelectedHobbies((prev) =>
      prev.includes(label) ? prev.filter((h) => h !== label) : [...prev, label]
    );
  }

  // Step 1: Create or sign in to Firebase account
  async function handleAccountContinue() {
    setAuthError("");
    setAuthLoading(true);
    try {
      if (signInMode) {
        await signIn(email.trim(), password);
        // Signed in — if already onboarded, _layout.tsx will redirect to tabs
        // Otherwise continue onboarding from step 2
        animateTo(2);
      } else {
        await signUp(email.trim(), password);
        goNext();
      }
    } catch (err: any) {
      setAuthError(friendlyAuthError(err.code ?? ""));
    } finally {
      setAuthLoading(false);
    }
  }

  async function finish() {
    await saveProfile({
      ...profile,
      username: username.trim() || "explorer",
      email: email.trim(),
      age,
      city: city.trim(),
      preferredCity: city.trim() || "London",
      hobbies: selectedHobbies,
      freeTimePerDay: (freeTime as FreeTimePerDay) || "30-60",
      hasOnboarded: true,
    });
    router.replace("/(tabs)/" as any);
  }

  // ── Step canContinue rules ────────────────────────────────────────────────

  const emailValid = email.trim().includes("@") && email.trim().includes(".");
  const passwordValid = password.length >= 6;
  const ageNum = parseInt(age, 10);
  const ageValid = age === "" || (!isNaN(ageNum) && ageNum >= 13 && ageNum <= 150);
  const ageError = age !== "" && !ageValid ? "Age must be between 13 and 150." : "";

  const canContinue: boolean[] = [
    true,                                        // 0: welcome
    emailValid && passwordValid,                 // 1: account
    username.trim().length >= 2 && ageValid,     // 2: basic info
    selectedHobbies.length >= 1,                 // 3: interests
    freeTime !== "",                             // 4: free time
    true,                                        // 5: feature intro
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Progress dots */}
      {step > 0 && (
        <View style={styles.progressRow}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.dots}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: i <= step ? colors.primary : colors.border },
                  i === step && styles.dotActive,
                ]}
              />
            ))}
          </View>
          <View style={{ width: 40 }} />
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Animated.View style={[styles.stepWrap, { transform: [{ translateX: slideAnim }] }]}>
          {step === 0 && (
            <StepWelcome
              colors={colors}
              onStart={goNext}
              onLogin={() => { setSignInMode(true); animateTo(1); }}
            />
          )}
          {step === 1 && (
            <StepAccount
              colors={colors}
              email={email} setEmail={setEmail}
              password={password} setPassword={setPassword}
              signInMode={signInMode} setSignInMode={setSignInMode}
              authError={authError} setAuthError={setAuthError}
              authLoading={authLoading}
              canNext={canContinue[1]}
              onNext={handleAccountContinue}
              onClose={goBack}
            />
          )}
          {step === 2 && (
            <StepBasicInfo
              colors={colors}
              username={username} setUsername={setUsername}
              age={age} setAge={setAge}
              city={city} setCity={setCity}
              ageError={ageError}
              canNext={canContinue[2]} onNext={goNext}
            />
          )}
          {step === 3 && (
            <StepInterests
              colors={colors}
              selected={selectedHobbies}
              onToggle={toggleHobby}
              canNext={canContinue[3]}
              onNext={goNext}
            />
          )}
          {step === 4 && (
            <StepFreeTime
              colors={colors}
              value={freeTime}
              onSelect={setFreeTime}
              canNext={canContinue[4]}
              onNext={goNext}
            />
          )}
          {step === 5 && <StepFeatures colors={colors} onFinish={finish} />}
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Step 0: Welcome ───────────────────────────────────────────────────────────

function StepWelcome({ colors, onStart, onLogin }: { colors: any; onStart: () => void; onLogin: () => void }) {
  return (
    <View style={styles.welcomeContainer}>
      {/* Top section: logo + title + tagline */}
      <View style={styles.welcomeTop}>
        <Image source={require("../assets/images/Hobbily_Logo.png")} style={styles.welcomeLogo} />
        <Text style={[styles.welcomeTitle, { color: colors.primary }]}>
          Welcome to{"\n"}
          <Text style={styles.welcomeTitleBold}>Hobbily</Text>
        </Text>
        <Text style={[styles.welcomeTagline, { color: colors.primary }]}>
          Discover your interests{"\n"}&amp;{"\n"}Build your future
        </Text>
      </View>

      {/* Bottom section: two big buttons */}
      <View style={styles.welcomeButtons}>
        <TouchableOpacity
          style={[styles.welcomeBtn, { backgroundColor: colors.primary }]}
          onPress={onLogin}
        >
          <Text style={styles.welcomeBtnText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.welcomeBtn, { backgroundColor: colors.primary, marginTop: 16 }]}
          onPress={onStart}
        >
          <Text style={styles.welcomeBtnText}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Step 1: Account ───────────────────────────────────────────────────────────

function IconInput({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, colors }: any) {
  return (
    <View style={[styles.iconInputRow, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
      <Ionicons name={icon} size={20} color={colors.secondaryText} style={{ marginRight: 10 }} />
      <TextInput
        style={[styles.iconInputText, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.accent}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "none"}
        autoCorrect={false}
      />
    </View>
  );
}

function StepAccount({
  colors, email, setEmail, password, setPassword,
  signInMode, setSignInMode, authError, setAuthError,
  authLoading, canNext, onNext, onClose,
}: any) {
  return (
    <View style={styles.authSheet}>
      {/* X close button */}
      <TouchableOpacity
        onPress={onClose}
        style={[styles.authCloseBtn, { backgroundColor: colors.primary }]}
      >
        <Ionicons name="close" size={20} color="#fff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.authTitle, { color: colors.text }]}>
          {signInMode ? "Login" : "Sign Up"}
        </Text>
        <TouchableOpacity onPress={() => { setSignInMode(!signInMode); setAuthError(""); }}>
          <Text style={[styles.authSwitch, { color: colors.text }]}>
            {signInMode ? "Don't have account? " : "Already registered? "}
            <Text style={{ fontWeight: "800", textDecorationLine: "underline" }}>
              {signInMode ? "Sign Up" : "Sign in"}
            </Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.authFields}>
          {!signInMode && (
            <IconInput
              icon="person-outline"
              placeholder="Name"
              value=""
              onChangeText={() => {}}
              colors={colors}
            />
          )}
          <IconInput
            icon="mail-outline"
            placeholder="Email"
            value={email}
            onChangeText={(v: string) => { setEmail(v); setAuthError(""); }}
            keyboardType="email-address"
            colors={colors}
          />
          <IconInput
            icon="lock-closed-outline"
            placeholder="Password"
            value={password}
            onChangeText={(v: string) => { setPassword(v); setAuthError(""); }}
            secureTextEntry
            colors={colors}
          />
          {!signInMode && (
            <TouchableOpacity
              style={[styles.iconInputRow, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.secondaryText} style={{ marginRight: 10 }} />
              <Text style={[styles.iconInputText, { color: colors.accent }]}>Date of Birth</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} style={{ marginLeft: "auto" }} />
            </TouchableOpacity>
          )}
        </View>

        {authError ? (
          <View style={[styles.errorBox, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
            <Ionicons name="alert-circle-outline" size={16} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={[styles.errorText, { color: "#DC2626" }]}>{authError}</Text>
          </View>
        ) : null}

        {signInMode && (
          <TouchableOpacity style={{ alignItems: "center", marginTop: 8 }}>
            <Text style={[styles.authSwitch, { color: colors.text }]}>
              <Text style={{ textDecorationLine: "underline" }}>Forgot Password?</Text>
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Arrow submit button */}
      <TouchableOpacity
        style={[styles.authArrowBtn, { backgroundColor: colors.primary, opacity: canNext ? 1 : 0.4 }]}
        onPress={canNext && !authLoading ? onNext : undefined}
      >
        {authLoading
          ? <ActivityIndicator color="#fff" />
          : <Ionicons name="arrow-forward" size={24} color="#fff" />
        }
      </TouchableOpacity>
    </View>
  );
}

// ── Step 2: Basic Info ────────────────────────────────────────────────────────

function StepBasicInfo({ colors, username, setUsername, age, setAge, city, setCity, ageError, canNext, onNext }: any) {
  return (
    <ScrollView contentContainerStyle={styles.infoContent} keyboardShouldPersistTaps="handled">
      {/* Avatar placeholder */}
      <View style={[styles.avatarCircle, { borderColor: colors.primary }]}>
        <Ionicons name="person-outline" size={52} color={colors.primary} />
      </View>

      <View style={styles.infoFields}>
        <View style={[styles.iconInputRow, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <TextInput
            style={[styles.iconInputText, { color: colors.text }]}
            placeholder="Name"
            placeholderTextColor={colors.accent}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="words"
          />
        </View>

        <View style={[styles.iconInputRow, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <TextInput
            style={[styles.iconInputText, { color: colors.text }]}
            placeholder="City"
            placeholderTextColor={colors.accent}
            value={city}
            onChangeText={setCity}
          />
        </View>

        <TouchableOpacity
          style={[styles.iconInputRow, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
        >
          <Text style={[styles.iconInputText, { color: age ? colors.text : colors.accent }]}>
            {age || "Date of Birth"}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} style={{ marginLeft: "auto" }} />
        </TouchableOpacity>
        {ageError ? <Text style={[styles.fieldError, { color: colors.danger }]}>{ageError}</Text> : null}
      </View>

      <TouchableOpacity
        style={[styles.nextBtn, { backgroundColor: colors.primary, opacity: canNext ? 1 : 0.4 }]}
        onPress={canNext ? onNext : undefined}
      >
        <Text style={styles.nextBtnText}>Next</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Step 3: Interests ─────────────────────────────────────────────────────────

const PREDEFINED_LABELS = new Set(HOBBY_OPTIONS.map((h) => h.label));

// Simplified interest grid matching mockup (2-column pill chips)
const INTEREST_OPTIONS = [
  { label: "Music" }, { label: "Gaming" },
  { label: "Art" }, { label: "Sports" },
  { label: "Coding" }, { label: "Language" },
  { label: "Dance" }, { label: "Cooking" },
  { label: "Photography" }, { label: "Reading" },
  { label: "Other.." },
];

function StepInterests({ colors, selected, onToggle, canNext, onNext }: any) {
  const [customInput, setCustomInput] = useState("");

  const customHobbies: string[] = selected.filter(
    (h: string) => !PREDEFINED_LABELS.has(h) && !INTEREST_OPTIONS.some((o) => o.label === h)
  );

  function addCustomHobby() {
    const label = customInput.trim();
    if (!label) return;
    if (!selected.includes(label)) onToggle(label);
    setCustomInput("");
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.stepHeader}>
        <Text style={[styles.interestTitle, { color: colors.primary }]}>Select Interest</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <View style={styles.interestGrid}>
          {INTEREST_OPTIONS.map((h) => {
            const isOther = h.label === "Other..";
            const active = selected.includes(h.label);
            return (
              <TouchableOpacity
                key={h.label}
                onPress={() => {
                  if (!isOther) onToggle(h.label);
                }}
                style={[
                  styles.interestChip,
                  {
                    backgroundColor: active ? colors.accent : colors.primary,
                    borderColor: "transparent",
                  },
                ]}
              >
                <Text style={styles.interestChipText}>{h.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {customHobbies.length > 0 && (
          <View style={[styles.customChipsRow, { paddingHorizontal: 16 }]}>
            {customHobbies.map((h: string) => (
              <TouchableOpacity
                key={h}
                onPress={() => onToggle(h)}
                style={[styles.customChip, { backgroundColor: colors.primary + "18", borderColor: colors.primary }]}
              >
                <Text style={[styles.customChipText, { color: colors.primary }]}>{h}</Text>
                <Ionicons name="close-circle" size={14} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.stepFooter}>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: colors.primary, opacity: canNext ? 1 : 0.4 }]}
          onPress={canNext ? onNext : undefined}
        >
          <Text style={styles.nextBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Step 4: Free Time ─────────────────────────────────────────────────────────

const FREE_TIME_MOCKUP = [
  { label: "Less than 30 min", value: "<30" as const },
  { label: "30 - 60min", value: "30-60" as const },
  { label: "1 - 2 hour", value: "1-2h" as const },
  { label: "Set time", value: "2h+" as const },
];

function StepFreeTime({ colors, value, onSelect, canNext, onNext }: any) {
  return (
    <View style={styles.stepContent}>
      <Text style={[styles.freeTimeQuestion, { color: colors.primary }]}>
        How much free time{"\n"}do you have ?
      </Text>

      <View style={styles.freeTimeOptions}>
        {FREE_TIME_MOCKUP.map((opt) => {
          const active = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              style={[
                styles.freeTimeCard,
                {
                  backgroundColor: active ? colors.primary : colors.inputBackground,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.freeTimeLabel, { color: active ? "#fff" : colors.accent }]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.nextBtn, { backgroundColor: colors.primary, opacity: canNext ? 1 : 0.4 }]}
        onPress={canNext ? onNext : undefined}
      >
        <Text style={styles.nextBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Step 5: Feature Intro ─────────────────────────────────────────────────────

const FEATURE_ROWS = [
  { icon: "search-outline" as const, label: "Discover opportunities" },
  { icon: "time-outline" as const, label: "Manage your time" },
  { icon: "home-outline" as const, label: "Join community" },
];

function StepFeatures({ colors, onFinish }: { colors: any; onFinish: () => void }) {
  return (
    <View style={styles.stepContent}>
      <Text style={[styles.featuresTitleLg, { color: colors.primary }]}>App Features</Text>

      <View style={styles.featureRows}>
        {FEATURE_ROWS.map((f) => (
          <TouchableOpacity
            key={f.label}
            style={[styles.featureRow, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
          >
            <Ionicons name={f.icon} size={26} color={colors.primary} style={{ marginRight: 14 }} />
            <Text style={[styles.featureRowLabel, { color: colors.accent }]}>{f.label}</Text>
            <View style={[styles.featureRowChevron, { backgroundColor: colors.primary }]}>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.nextBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginTop: "auto" }]}
        onPress={onFinish}
      >
        <Text style={[styles.nextBtnText, { color: colors.primary }]}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  dots: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { width: 20, height: 6, borderRadius: 3 },
  stepWrap: { flex: 1 },
  stepContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  stepHeader: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 },
  stepFooter: { paddingHorizontal: 24, paddingBottom: 28 },
  fieldError: { fontSize: 12, marginTop: -8, marginBottom: 10, paddingHorizontal: 4 },
  // Error box
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },

  // ── Welcome screen ──
  welcomeContainer: { flex: 1, paddingHorizontal: 32, justifyContent: "space-between", paddingVertical: 48 },
  welcomeTop: { alignItems: "center", flex: 1, justifyContent: "center", gap: 16 },
  welcomeLogo: { width: 120, height: 120, resizeMode: "contain" },
  welcomeTitle: { fontSize: 28, fontWeight: "700", textAlign: "center", lineHeight: 38 },
  welcomeTitleBold: { fontSize: 36, fontWeight: "900" },
  welcomeTagline: { fontSize: 18, textAlign: "center", lineHeight: 28, fontStyle: "italic" },
  welcomeButtons: { gap: 0 },
  welcomeBtn: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  welcomeBtnText: { color: "#fff", fontWeight: "800", fontSize: 18 },

  // ── Auth screen (sheet) ──
  authSheet: { flex: 1, backgroundColor: "#F0F0F6", borderRadius: 0, position: "relative" },
  authCloseBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  authContent: { paddingHorizontal: 28, paddingTop: 60, paddingBottom: 24 },
  authTitle: { fontSize: 36, fontWeight: "800", marginBottom: 6 },
  authSwitch: { fontSize: 14, marginBottom: 32 },
  authFields: { gap: 12, marginBottom: 16 },
  authArrowBtn: {
    margin: 24,
    marginTop: 0,
    height: 58,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Icon-prefixed input ──
  iconInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  iconInputText: { flex: 1, fontSize: 16 },

  // ── BasicInfo screen ──
  infoContent: { alignItems: "center", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  infoFields: { width: "100%", gap: 12, marginBottom: 32 },
  nextBtn: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  nextBtnText: { color: "#fff", fontWeight: "700", fontSize: 17 },

  // ── Interests screen ──
  interestTitle: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 24 },
  interestGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  interestChip: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: (SCREEN_W - 56) / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  interestChipText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  customChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  customChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  customChipText: { fontSize: 13, fontWeight: "600" },

  // ── Free time screen ──
  freeTimeQuestion: { fontSize: 26, fontWeight: "700", textAlign: "center", marginBottom: 32, lineHeight: 36 },
  freeTimeOptions: { gap: 12, marginBottom: 32 },
  freeTimeCard: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  freeTimeLabel: { fontSize: 16, fontWeight: "600" },

  // ── Features screen ──
  featuresTitleLg: { fontSize: 28, fontWeight: "800", textAlign: "center", marginBottom: 32 },
  featureRows: { gap: 14, marginBottom: 32 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
  },
  featureRowLabel: { flex: 1, fontSize: 16, fontWeight: "600" },
  featureRowChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  // Legacy (kept for compatibility)
  hobbyGrid: { flexDirection: "row", flexWrap: "wrap", padding: 16, gap: 12 },
  customHobbySection: { paddingHorizontal: 16, paddingBottom: 16 },
  customHobbyRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  customHobbyInput: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14 },
  customAddBtn: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  hobbyTile: {
    width: (SCREEN_W - 56) / 3,
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 6,
  },
  hobbyTileText: { fontSize: 13, fontWeight: "600", textAlign: "center", lineHeight: 17 },
  noticeBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  noticeText: { flex: 1, fontSize: 13 },
});
