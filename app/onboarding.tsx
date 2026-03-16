/**
 * Onboarding — shown on first launch / when not authenticated.
 *
 * Steps:
 *   0  Welcome          — Create Account / Log In + theme toggle
 *   1  Account          — email + password form (sign-up OR sign-in)
 *   2  Your Profile     — name, city, age + light/dark preference
 *   3  Select Interests — hobby chip grid
 *   4  Free Time        — how much spare time per day
 *   5  App Features     — feature showcase, then finish → tabs
 */
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, Animated, KeyboardAvoidingView,
  Platform, ActivityIndicator, Switch,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { FreeTimePerDay } from "../types/Profile";

const { width: SW } = Dimensions.get("window");
const TOTAL_STEPS = 6;

// ── Data ──────────────────────────────────────────────────────────────────────

const INTEREST_OPTIONS = [
  "Music", "Gaming", "Art", "Sports", "Coding", "Language",
  "Dance", "Cooking", "Photography", "Reading", "Film", "Writing",
];

const FREE_TIME_OPTIONS: { label: string; value: FreeTimePerDay }[] = [
  { label: "Less than 30 min", value: "<30" },
  { label: "30 – 60 min",      value: "30-60" },
  { label: "1 – 2 hours",      value: "1-2h" },
  { label: "2+ hours",         value: "2h+" },
];

const FEATURE_ROWS = [
  { icon: "search-outline"      as const, label: "Discover opportunities" },
  { icon: "time-outline"        as const, label: "Manage your time" },
  { icon: "chatbubbles-outline" as const, label: "Connect with peers" },
];

// ── Auth error → readable string ──────────────────────────────────────────────

function friendlyError(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":  return "An account with this email already exists. Try logging in instead.";
    case "auth/invalid-email":         return "Please enter a valid email address.";
    case "auth/weak-password":         return "Password must be at least 6 characters.";
    case "auth/user-not-found":        return "No account found with this email.";
    case "auth/wrong-password":        return "Incorrect password. Please try again.";
    case "auth/invalid-credential":    return "Incorrect email or password.";
    case "auth/too-many-requests":     return "Too many attempts. Please wait a moment.";
    default:                           return "Something went wrong. Please try again.";
  }
}

// ── Reusable input ─────────────────────────────────────────────────────────────

function Field({
  icon, placeholder, value, onChangeText,
  secureTextEntry, keyboardType, colors, autoCapitalize,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  colors: any;
  autoCapitalize?: any;
}) {
  return (
    <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {icon && (
        <Ionicons name={icon} size={20} color={colors.secondaryText} style={{ marginRight: 10 }} />
      )}
      <TextInput
        style={[styles.fieldText, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.secondaryText}
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

// ── Step 0: Welcome ───────────────────────────────────────────────────────────

function StepWelcome({
  colors, isDark, toggleTheme, onCreateAccount, onLogIn,
}: {
  colors: any; isDark: boolean; toggleTheme: () => void;
  onCreateAccount: () => void; onLogIn: () => void;
}) {
  return (
    <View style={styles.welcomeRoot}>
      {/* Theme toggle — top right */}
      <TouchableOpacity
        onPress={toggleTheme}
        style={[styles.themeToggle, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={20} color={colors.primary} />
      </TouchableOpacity>

      {/* Logo area */}
      <View style={styles.welcomeCenter}>
        <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
          <Ionicons name="compass" size={52} color="#fff" />
        </View>
        <Text style={[styles.appName, { color: colors.primary }]}>HOBBILY</Text>
        <Text style={[styles.tagline, { color: colors.secondaryText }]}>
          Discover your interests{"\n"}&amp; build your future
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.welcomeButtons}>
        <TouchableOpacity
          style={[styles.bigBtn, { backgroundColor: colors.accent }]}
          onPress={onCreateAccount}
        >
          <Text style={styles.bigBtnText}>Create Account</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bigBtnOutline, { borderColor: colors.primary }]}
          onPress={onLogIn}
        >
          <Text style={[styles.bigBtnOutlineText, { color: colors.primary }]}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Step 1: Account ───────────────────────────────────────────────────────────

function StepAccount({
  colors, signInMode, setSignInMode,
  email, setEmail, password, setPassword,
  authError, setAuthError, authLoading, canNext, onNext,
}: any) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.authContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={[styles.authTitle, { color: colors.primary }]}>
          {signInMode ? "Log In" : "Create Account"}
        </Text>

        {/* Toggle between modes */}
        <TouchableOpacity
          onPress={() => { setSignInMode(!signInMode); setAuthError(""); }}
          style={styles.authSwitchRow}
        >
          <Text style={[styles.authSwitchText, { color: colors.secondaryText }]}>
            {signInMode ? "Don't have an account? " : "Already have an account? "}
            <Text style={[styles.authSwitchLink, { color: colors.accent }]}>
              {signInMode ? "Create one" : "Log In"}
            </Text>
          </Text>
        </TouchableOpacity>

        {/* Fields */}
        <View style={styles.authFields}>
          <Field
            icon="mail-outline"
            placeholder="Email address"
            value={email}
            onChangeText={(v) => { setEmail(v); setAuthError(""); }}
            keyboardType="email-address"
            colors={colors}
          />
          <Field
            icon="lock-closed-outline"
            placeholder="Password (min 6 characters)"
            value={password}
            onChangeText={(v) => { setPassword(v); setAuthError(""); }}
            secureTextEntry
            colors={colors}
          />
        </View>

        {/* Error */}
        {authError ? (
          <View style={[styles.errorBox, { backgroundColor: colors.danger + "18", borderColor: colors.danger }]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.danger} style={{ marginRight: 8 }} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{authError}</Text>
          </View>
        ) : null}

        {/* Forgot password (sign-in only) */}
        {signInMode && (
          <TouchableOpacity style={{ marginTop: 4, alignSelf: "flex-end" }}>
            <Text style={[styles.forgotText, { color: colors.secondaryText }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: colors.accent, opacity: canNext && !authLoading ? 1 : 0.45 },
          ]}
          onPress={canNext && !authLoading ? onNext : undefined}
        >
          {authLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>
              {signInMode ? "Log In" : "Create Account"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Step 2: Your Profile ──────────────────────────────────────────────────────

function StepYourProfile({
  colors, isDark, toggleTheme,
  username, setUsername, age, setAge, city, setCity,
  ageError, canNext, onNext,
}: any) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.profileContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar placeholder */}
        <View style={[styles.avatarCircle, { borderColor: colors.primary }]}>
          <Ionicons name="person-outline" size={48} color={colors.primary} />
        </View>

        <Text style={[styles.stepTitle, { color: colors.primary }]}>Your Profile</Text>
        <Text style={[styles.stepSub, { color: colors.secondaryText }]}>
          You can change these later
        </Text>

        <View style={styles.profileFields}>
          <Field
            icon="person-outline"
            placeholder="Display name *"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="words"
            colors={colors}
          />
          <Field
            icon="location-outline"
            placeholder="City (optional)"
            value={city}
            onChangeText={setCity}
            autoCapitalize="words"
            colors={colors}
          />
          <Field
            icon="calendar-outline"
            placeholder="Age (optional, 13–150)"
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            colors={colors}
          />
          {ageError ? (
            <Text style={[styles.fieldError, { color: colors.danger }]}>{ageError}</Text>
          ) : null}
        </View>

        {/* Appearance preference */}
        <View style={[styles.appearanceRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons
            name={isDark ? "moon-outline" : "sunny-outline"}
            size={20}
            color={colors.primary}
            style={{ marginRight: 12 }}
          />
          <Text style={[styles.appearanceLabel, { color: colors.text }]}>
            {isDark ? "Dark mode" : "Light mode"}
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary + "80" }}
            thumbColor={isDark ? colors.primary : colors.secondaryText}
          />
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: colors.accent, opacity: canNext ? 1 : 0.4 }]}
          onPress={canNext ? onNext : undefined}
        >
          <Text style={styles.nextBtnText}>Next</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Step 3: Select Interests ──────────────────────────────────────────────────

function StepInterests({ colors, selected, onToggle, canNext, onNext }: any) {
  const [customInput, setCustomInput] = useState("");

  const customHobbies: string[] = selected.filter(
    (h: string) => !INTEREST_OPTIONS.includes(h)
  );

  function addCustom() {
    const label = customInput.trim();
    if (!label || selected.includes(label)) return;
    onToggle(label);
    setCustomInput("");
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.stepHeaderPad}>
        <Text style={[styles.stepTitle, { color: colors.primary }]}>Select Interests</Text>
        <Text style={[styles.stepSub, { color: colors.secondaryText }]}>
          Pick at least one — you can add more later
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.interestScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Predefined grid */}
        <View style={styles.interestGrid}>
          {INTEREST_OPTIONS.map((label) => {
            const active = selected.includes(label);
            return (
              <TouchableOpacity
                key={label}
                onPress={() => onToggle(label)}
                style={[
                  styles.interestChip,
                  {
                    backgroundColor: active ? colors.accent : colors.secondary,
                    borderColor: active ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text style={[styles.interestChipText, { color: active ? "#fff" : colors.primary }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom hobby input */}
        <View style={styles.customRow}>
          <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}>
            <TextInput
              style={[styles.fieldText, { color: colors.text }]}
              placeholder="Add your own..."
              placeholderTextColor={colors.secondaryText}
              value={customInput}
              onChangeText={setCustomInput}
              onSubmitEditing={addCustom}
              returnKeyType="done"
            />
          </View>
          <TouchableOpacity
            onPress={addCustom}
            style={[styles.customAddBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Custom chips */}
        {customHobbies.length > 0 && (
          <View style={styles.customChipsRow}>
            {customHobbies.map((h: string) => (
              <TouchableOpacity
                key={h}
                onPress={() => onToggle(h)}
                style={[styles.customChip, { backgroundColor: colors.accent + "20", borderColor: colors.accent }]}
              >
                <Text style={[styles.customChipText, { color: colors.accent }]}>{h}</Text>
                <Ionicons name="close-circle" size={14} color={colors.accent} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.stepFooter}>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: colors.accent, opacity: canNext ? 1 : 0.4 }]}
          onPress={canNext ? onNext : undefined}
        >
          <Text style={styles.nextBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Step 4: Free Time ─────────────────────────────────────────────────────────

function StepFreeTime({ colors, value, onSelect, canNext, onNext }: any) {
  return (
    <View style={styles.stepContentPad}>
      <Text style={[styles.freeTimeQ, { color: colors.primary }]}>
        How much free time{"\n"}do you have per day?
      </Text>

      <View style={styles.freeTimeList}>
        {FREE_TIME_OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              style={[
                styles.freeTimeCard,
                {
                  backgroundColor: active ? colors.accent : colors.card,
                  borderColor: active ? colors.accent : colors.border,
                },
              ]}
            >
              <Text style={[styles.freeTimeLabel, { color: active ? "#fff" : colors.text }]}>
                {opt.label}
              </Text>
              {active && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.nextBtn, { backgroundColor: colors.accent, opacity: canNext ? 1 : 0.4 }]}
        onPress={canNext ? onNext : undefined}
      >
        <Text style={styles.nextBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Step 5: App Features ──────────────────────────────────────────────────────

function StepFeatures({ colors, onFinish }: { colors: any; onFinish: () => void }) {
  return (
    <View style={styles.stepContentPad}>
      <Text style={[styles.stepTitle, { color: colors.primary, textAlign: "center", marginBottom: 8 }]}>
        You're all set!
      </Text>
      <Text style={[styles.stepSub, { color: colors.secondaryText, textAlign: "center", marginBottom: 32 }]}>
        Here's what you can do with Hobbily
      </Text>

      <View style={styles.featureList}>
        {FEATURE_ROWS.map((f) => (
          <View
            key={f.label}
            style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.featureIconWrap, { backgroundColor: colors.accent + "20" }]}>
              <Ionicons name={f.icon} size={24} color={colors.accent} />
            </View>
            <Text style={[styles.featureLabel, { color: colors.primary }]}>{f.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.nextBtn, { backgroundColor: colors.accent, marginTop: "auto" as any }]}
        onPress={onFinish}
      >
        <Text style={styles.nextBtnText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { saveProfile, profile } = useProfile();
  const { signUp, signIn, user } = useAuth();

  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Auth state
  const [signInMode, setSignInMode] = useState(false);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError]   = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Profile state
  const [username, setUsername] = useState("");
  const [age, setAge]           = useState("");
  const [city, setCity]         = useState("");
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [freeTime, setFreeTime] = useState<FreeTimePerDay | "">("");

  // If user is already authenticated mid-onboarding, skip auth step
  useEffect(() => {
    if (user && step === 0) setStep(2);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigation ──────────────────────────────────────────────────────────────

  function animateTo(next: number) {
    const dir = next > step ? -1 : 1;
    Animated.timing(slideAnim, { toValue: dir * SW * 0.3, duration: 140, useNativeDriver: true }).start(() => {
      setStep(next);
      slideAnim.setValue(-dir * SW * 0.3);
      Animated.timing(slideAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start();
    });
  }

  function goNext() { if (step < TOTAL_STEPS - 1) animateTo(step + 1); }
  function goBack() { if (step > 0) animateTo(step - 1); }

  function toggleHobby(label: string) {
    setSelectedHobbies((prev) =>
      prev.includes(label) ? prev.filter((h) => h !== label) : [...prev, label]
    );
  }

  // ── Auth submit ─────────────────────────────────────────────────────────────

  async function handleAuthSubmit() {
    setAuthError("");
    setAuthLoading(true);
    try {
      if (signInMode) {
        await signIn(email.trim(), password);
        animateTo(2); // existing user skips profile setup
      } else {
        await signUp(email.trim(), password);
        goNext(); // new user fills out profile
      }
    } catch (err: any) {
      setAuthError(friendlyError(err.code ?? ""));
    } finally {
      setAuthLoading(false);
    }
  }

  // ── Finish ──────────────────────────────────────────────────────────────────

  async function finish() {
    await saveProfile({
      ...profile,
      username: username.trim() || "explorer",
      email: email.trim(),
      age,
      city: city.trim(),
      preferredCity: city.trim() || "",
      hobbies: selectedHobbies,
      freeTimePerDay: (freeTime as FreeTimePerDay) || "30-60",
      hasOnboarded: true,
    });
    router.replace("/(tabs)/" as any);
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  const emailOk    = email.trim().includes("@") && email.trim().includes(".");
  const passwordOk = password.length >= 6;
  const ageNum     = parseInt(age, 10);
  const ageValid   = age === "" || (!isNaN(ageNum) && ageNum >= 13 && ageNum <= 150);
  const ageError   = age !== "" && !ageValid ? "Age must be between 13 and 150." : "";

  const canContinue = [
    true,                                      // 0 welcome
    emailOk && passwordOk,                     // 1 account
    username.trim().length >= 2 && ageValid,   // 2 profile
    selectedHobbies.length >= 1,               // 3 interests
    freeTime !== "",                           // 4 free time
    true,                                      // 5 features
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Back button + progress dots (steps 1-5) */}
      {step > 0 && (
        <View style={styles.topBar}>
          <TouchableOpacity onPress={goBack} style={styles.topBackBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.dots}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: i <= step ? colors.accent : colors.border },
                  i === step && styles.dotActive,
                ]}
              />
            ))}
          </View>
          <View style={{ width: 40 }} />
        </View>
      )}

      <Animated.View style={[styles.stepWrap, { transform: [{ translateX: slideAnim }] }]}>
        {step === 0 && (
          <StepWelcome
            colors={colors}
            isDark={isDark}
            toggleTheme={toggleTheme}
            onCreateAccount={() => { setSignInMode(false); animateTo(1); }}
            onLogIn={() => { setSignInMode(true); animateTo(1); }}
          />
        )}
        {step === 1 && (
          <StepAccount
            colors={colors}
            signInMode={signInMode} setSignInMode={setSignInMode}
            email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
            authError={authError} setAuthError={setAuthError}
            authLoading={authLoading}
            canNext={canContinue[1]}
            onNext={handleAuthSubmit}
          />
        )}
        {step === 2 && (
          <StepYourProfile
            colors={colors}
            isDark={isDark} toggleTheme={toggleTheme}
            username={username} setUsername={setUsername}
            age={age} setAge={setAge}
            city={city} setCity={setCity}
            ageError={ageError}
            canNext={canContinue[2]}
            onNext={goNext}
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
        {step === 5 && (
          <StepFeatures colors={colors} onFinish={finish} />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  topBackBtn: { width: 40, height: 40, justifyContent: "center" },
  dots: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { width: 22, height: 6, borderRadius: 3 },
  stepWrap: { flex: 1 },

  // ── Shared ──
  field: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 15,
  },
  fieldText: { flex: 1, fontSize: 15 },
  fieldError: { fontSize: 12, marginTop: 2, marginLeft: 4 },
  nextBtn: {
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  nextBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  stepTitle: { fontSize: 24, fontWeight: "800", marginBottom: 6 },
  stepSub: { fontSize: 14, lineHeight: 20, marginBottom: 24 },

  // ── Welcome ──
  welcomeRoot: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 40,
  },
  themeToggle: {
    alignSelf: "flex-end",
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  appName: { fontSize: 34, fontWeight: "900", letterSpacing: 4 },
  tagline: { fontSize: 16, textAlign: "center", lineHeight: 24, fontStyle: "italic" },
  welcomeButtons: { gap: 14 },
  bigBtn: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  bigBtnText: { color: "#fff", fontWeight: "800", fontSize: 17 },
  bigBtnOutline: {
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
  },
  bigBtnOutlineText: { fontWeight: "800", fontSize: 17 },

  // ── Auth ──
  authContent: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
  },
  authTitle: { fontSize: 30, fontWeight: "900", marginBottom: 8 },
  authSwitchRow: { marginBottom: 28 },
  authSwitchText: { fontSize: 14, lineHeight: 20 },
  authSwitchLink: { fontWeight: "700" },
  authFields: { gap: 12, marginBottom: 16 },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },
  forgotText: { fontSize: 13, marginBottom: 20 },
  submitBtn: {
    marginTop: 20,
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
  },
  submitBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  // ── Profile setup ──
  profileContent: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 40,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  profileFields: { width: "100%", gap: 12, marginBottom: 20 },
  appearanceRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 28,
  },
  appearanceLabel: { flex: 1, fontSize: 15, fontWeight: "600" },

  // ── Interests ──
  stepHeaderPad: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 4 },
  interestScrollContent: { paddingHorizontal: 24, paddingBottom: 20 },
  interestGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  interestChip: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: (SW - 72) / 2,
    alignItems: "center",
  },
  interestChipText: { fontWeight: "700", fontSize: 15 },
  customRow: { flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 12 },
  customAddBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  customChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  customChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  customChipText: { fontSize: 13, fontWeight: "600" },
  stepFooter: { paddingHorizontal: 24, paddingBottom: 28 },

  // ── Free time ──
  stepContentPad: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
  },
  freeTimeQ: { fontSize: 26, fontWeight: "800", lineHeight: 34, marginBottom: 28 },
  freeTimeList: { gap: 12, marginBottom: 32 },
  freeTimeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
  },
  freeTimeLabel: { fontSize: 16, fontWeight: "600" },

  // ── Features ──
  featureList: { gap: 14, marginBottom: 28 },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: { fontSize: 16, fontWeight: "700", flex: 1 },
});
