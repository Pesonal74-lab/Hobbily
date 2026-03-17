/**
 * Onboarding — shown on first launch and when not authenticated.
 * 6 steps: Welcome → Account (Firebase Auth) → Basic Info → Interests → Free Time → Feature Intro
 */
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Dimensions, Animated, Image, KeyboardAvoidingView, Platform,
  ActivityIndicator, Modal, FlatList,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { FreeTimePerDay } from "../types/Profile";

const { width: SCREEN_W } = Dimensions.get("window");
const TOTAL_STEPS = 6;

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const WEEK_DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// ── Hobby/interest data ───────────────────────────────────────────────────────

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

const INTEREST_OPTIONS = [
  { label: "Music" }, { label: "Gaming" },
  { label: "Art" }, { label: "Sports" },
  { label: "Coding" }, { label: "Language" },
  { label: "Dance" }, { label: "Cooking" },
  { label: "Photography" }, { label: "Reading" },
  { label: "Other.." },
];
const PREDEFINED_LABELS = new Set(HOBBY_OPTIONS.map((h) => h.label));

const FREE_TIME_MOCKUP = [
  { label: "Less than 30 min", value: "<30" as const },
  { label: "30 - 60min",       value: "30-60" as const },
  { label: "1 - 2 hour",       value: "1-2h" as const },
  { label: "Set time",         value: "2h+" as const },
];

const FEATURE_ROWS = [
  { icon: "search-outline" as const, label: "Discover opportunities" },
  { icon: "time-outline"   as const, label: "Manage your time" },
  { icon: "home-outline"   as const, label: "Join community" },
];

// ── Auth error helper ─────────────────────────────────────────────────────────

function friendlyAuthError(code: string): string {
  switch (code) {
    case "auth/email-already-in-use": return "An account with this email already exists. Try signing in instead.";
    case "auth/invalid-email":        return "Please enter a valid email address.";
    case "auth/weak-password":        return "Password must be at least 6 characters.";
    case "auth/user-not-found":       return "No account found with this email.";
    case "auth/wrong-password":       return "Incorrect password. Please try again.";
    case "auth/invalid-credential":   return "Incorrect email or password.";
    case "auth/too-many-requests":    return "Too many attempts. Please wait a moment and try again.";
    default:                          return "Something went wrong. Please try again.";
  }
}

// ── Date utilities ────────────────────────────────────────────────────────────

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function firstWeekdayOf(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0 = Sunday
}
function formatDob(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${d}/${m}/${date.getFullYear()}`;
}
function ageFromDob(date: Date): string {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
  return String(age);
}

// ── DatePickerModal ───────────────────────────────────────────────────────────

function DatePickerModal({
  visible, value, onConfirm, onCancel, colors,
}: {
  visible: boolean;
  value: Date | null;
  onConfirm: (d: Date) => void;
  onCancel: () => void;
  colors: any;
}) {
  const today = new Date();
  const MAX_YEAR = today.getFullYear() - 13; // must be ≥ 13
  const MIN_YEAR = 1920;

  const [viewYear,  setViewYear]  = useState(value ? value.getFullYear()  : 2005);
  const [viewMonth, setViewMonth] = useState(value ? value.getMonth()     : 0);
  const [selDay,    setSelDay]    = useState<number | null>(value ? value.getDate() : null);
  const [mode,      setMode]      = useState<"calendar" | "year">("calendar");

  // Year list: MAX_YEAR → MIN_YEAR (descending)
  const yearList = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MAX_YEAR - i);
  const yearListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!visible) return;
    if (value) {
      setViewYear(value.getFullYear());
      setViewMonth(value.getMonth());
      setSelDay(value.getDate());
    } else {
      setViewYear(2005); setViewMonth(0); setSelDay(null);
    }
    setMode("calendar");
  }, [visible]);

  // Scroll year list to selected year when entering year mode
  useEffect(() => {
    if (mode === "year") {
      const idx = yearList.indexOf(viewYear);
      if (idx >= 0) {
        setTimeout(() => yearListRef.current?.scrollToIndex({ index: idx, animated: false }), 50);
      }
    }
  }, [mode]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  // Build grid cells: null = empty padding, number = day
  const totalDays = daysInMonth(viewYear, viewMonth);
  const offset    = firstWeekdayOf(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function handleConfirm() {
    if (selDay == null) return;
    onConfirm(new Date(viewYear, viewMonth, selDay));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={dp.overlay}>
        <View style={[dp.modal, { backgroundColor: colors.card, borderColor: colors.border }]}>

          {/* ── Selected date banner ── */}
          <View style={[dp.selectedBanner, { backgroundColor: colors.primary }]}>
            <Text style={dp.selectedYear}>{viewYear}</Text>
            <Text style={dp.selectedDateText}>
              {selDay
                ? `${MONTHS[viewMonth].slice(0, 3)} ${selDay}`
                : "Select a date"}
            </Text>
          </View>

          {/* ── Month / Year header ── */}
          <View style={dp.header}>
            <TouchableOpacity onPress={prevMonth} style={dp.navBtn} disabled={mode === "year"}>
              <Ionicons name="chevron-back" size={22} color={mode === "year" ? colors.border : colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={dp.monthYearBtn}
              onPress={() => setMode((m) => m === "year" ? "calendar" : "year")}
            >
              <Text style={[dp.monthYearText, { color: colors.primary }]}>
                {MONTHS[viewMonth]} {viewYear}
              </Text>
              <Ionicons
                name={mode === "year" ? "chevron-up" : "chevron-down"}
                size={15}
                color={colors.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={nextMonth} style={dp.navBtn} disabled={mode === "year"}>
              <Ionicons name="chevron-forward" size={22} color={mode === "year" ? colors.border : colors.primary} />
            </TouchableOpacity>
          </View>

          {/* ── Year picker ── */}
          {mode === "year" ? (
            <FlatList
              ref={yearListRef}
              data={yearList}
              keyExtractor={(y) => String(y)}
              style={dp.yearList}
              showsVerticalScrollIndicator={false}
              getItemLayout={(_, index) => ({ length: 44, offset: 44 * index, index })}
              renderItem={({ item: y }) => {
                const active = y === viewYear;
                return (
                  <TouchableOpacity
                    style={[dp.yearItem, active && { backgroundColor: colors.primary }]}
                    onPress={() => { setViewYear(y); setMode("calendar"); }}
                  >
                    <Text style={[dp.yearText, { color: active ? "#fff" : colors.text }]}>{y}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          ) : (
            <>
              {/* ── Weekday headers ── */}
              <View style={dp.weekRow}>
                {WEEK_DAYS.map((d) => (
                  <Text key={d} style={[dp.weekDay, { color: colors.secondaryText }]}>{d}</Text>
                ))}
              </View>

              {/* ── Day grid ── */}
              <View style={dp.grid}>
                {cells.map((d, i) => {
                  const isSelected = d !== null && d === selDay;
                  const isToday =
                    d !== null &&
                    viewYear  === today.getFullYear() &&
                    viewMonth === today.getMonth() &&
                    d === today.getDate();
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        dp.cell,
                        isSelected && { backgroundColor: colors.accent },
                        !isSelected && isToday && { borderWidth: 1.5, borderColor: colors.accent },
                      ]}
                      onPress={() => d && setSelDay(d)}
                      disabled={!d}
                      activeOpacity={d ? 0.7 : 1}
                    >
                      {d != null && (
                        <Text style={[dp.cellText, { color: isSelected ? "#fff" : colors.text }]}>
                          {d}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* ── Actions ── */}
          <View style={dp.actions}>
            <TouchableOpacity
              style={[dp.cancelBtn, { borderColor: colors.border }]}
              onPress={onCancel}
            >
              <Text style={[dp.cancelText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[dp.confirmBtn, { backgroundColor: selDay ? colors.primary : colors.border }]}
              onPress={handleConfirm}
              disabled={selDay == null}
            >
              <Text style={dp.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

// ── Shared icon input ─────────────────────────────────────────────────────────

function IconInput({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, colors }: any) {
  return (
    <View style={[styles.iconInputRow, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
      {icon && <Ionicons name={icon} size={20} color={colors.secondaryText} style={{ marginRight: 10 }} />}
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

// ── Main component ────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { saveProfile, profile } = useProfile();
  const { signUp, signIn, user } = useAuth();

  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Auth state
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [signInMode,  setSignInMode]  = useState(false);
  const [authError,   setAuthError]   = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Profile state
  const [username,         setUsername]         = useState("");
  const [city,             setCity]             = useState("");
  const [dob,              setDob]              = useState<Date | null>(null);
  const [selectedHobbies,  setSelectedHobbies]  = useState<string[]>([]);
  const [freeTime,         setFreeTime]         = useState<FreeTimePerDay | "">("");

  // Date picker visibility
  const [dobPickerVisible, setDobPickerVisible] = useState(false);

  useEffect(() => {
    if (user && step === 0) setStep(2);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function animateTo(nextStep: number) {
    const dir = nextStep > step ? -1 : 1;
    Animated.timing(slideAnim, { toValue: dir * SCREEN_W * 0.3, duration: 150, useNativeDriver: true }).start(() => {
      setStep(nextStep);
      slideAnim.setValue(-dir * SCREEN_W * 0.3);
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

  async function handleAccountContinue() {
    setAuthError(""); setAuthLoading(true);
    try {
      if (signInMode) {
        await signIn(email.trim(), password);
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
    const age = dob ? ageFromDob(dob) : "";
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

  // ── Validation ────────────────────────────────────────────────────────────

  const emailValid    = email.trim().includes("@") && email.trim().includes(".");
  const passwordValid = password.length >= 6;

  const canContinue: boolean[] = [
    true,
    emailValid && passwordValid,
    username.trim().length >= 2,
    selectedHobbies.length >= 1,
    freeTime !== "",
    true,
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
              onCreateAccount={() => { setSignInMode(false); animateTo(1); }}
              onLogIn={() => { setSignInMode(true); animateTo(1); }}
            />
          )}
          {step === 1 && (
            <StepAccount
              colors={colors}
              email={email} setEmail={setEmail}
              password={password} setPassword={setPassword}
              name={username} setName={setUsername}
              signInMode={signInMode} setSignInMode={setSignInMode}
              authError={authError} setAuthError={setAuthError}
              authLoading={authLoading}
              dob={dob}
              onOpenDob={() => setDobPickerVisible(true)}
              canNext={canContinue[1]}
              onNext={handleAccountContinue}
              onClose={goBack}
            />
          )}
          {step === 2 && (
            <StepBasicInfo
              colors={colors}
              username={username} setUsername={setUsername}
              city={city} setCity={setCity}
              dob={dob} onOpenDob={() => setDobPickerVisible(true)}
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

      {/* Single global date picker modal */}
      <DatePickerModal
        visible={dobPickerVisible}
        value={dob}
        onConfirm={(d) => { setDob(d); setDobPickerVisible(false); }}
        onCancel={() => setDobPickerVisible(false)}
        colors={colors}
      />
    </SafeAreaView>
  );
}

// ── Step 0: Welcome ───────────────────────────────────────────────────────────

function StepWelcome({ colors, onCreateAccount, onLogIn }: {
  colors: any; onCreateAccount: () => void; onLogIn: () => void;
}) {
  return (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeTop}>
        <Image source={require("../assets/images/Hobbily_Logo.png")} style={styles.welcomeLogo} />
        <Text style={[styles.welcomeTitle, { color: colors.primary }]}>
          Welcome to{"\n"}
          <Text style={styles.welcomeTitleBold}>Hobbily</Text>
        </Text>
        <Text style={[styles.welcomeTagline, { color: colors.primary }]}>
          Discover your interests{"\n"}&{"\n"}Build your future
        </Text>
      </View>
      <View style={styles.welcomeButtons}>
        <TouchableOpacity
          style={[styles.welcomeBtn, { backgroundColor: colors.primary }]}
          onPress={onCreateAccount}
        >
          <Text style={styles.welcomeBtnText}>Create Account</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.welcomeBtn, { backgroundColor: colors.primary, marginTop: 16 }]}
          onPress={onLogIn}
        >
          <Text style={styles.welcomeBtnText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Step 1: Account ───────────────────────────────────────────────────────────

function StepAccount({
  colors, email, setEmail, password, setPassword,
  name, setName, signInMode, setSignInMode,
  authError, setAuthError, authLoading,
  dob, onOpenDob, canNext, onNext, onClose,
}: any) {
  const [resetState, setResetState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleForgotPassword() {
    const trimmed = email.trim();
    if (!trimmed.includes("@")) {
      setAuthError("Enter your email address above first.");
      return;
    }
    setResetState("sending");
    try {
      await sendPasswordResetEmail(auth, trimmed);
      setResetState("sent");
    } catch {
      setResetState("error");
    }
  }

  return (
    <View style={[styles.authSheet, { backgroundColor: colors.card }]}>
      <TouchableOpacity
        onPress={onClose}
        style={[styles.authCloseBtn, { backgroundColor: colors.primary }]}
      >
        <Ionicons name="close" size={20} color="#fff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.authTitle, { color: colors.text }]}>
          {signInMode ? "Log In" : "Create Account"}
        </Text>
        <TouchableOpacity onPress={() => { setSignInMode(!signInMode); setAuthError(""); }}>
          <Text style={[styles.authSwitch, { color: colors.text }]}>
            {signInMode ? "Don't have an account? " : "Already registered? "}
            <Text style={{ fontWeight: "800", textDecorationLine: "underline" }}>
              {signInMode ? "Create one" : "Log In"}
            </Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.authFields}>
          {!signInMode && (
            <IconInput
              icon="person-outline"
              placeholder="Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
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
              onPress={onOpenDob}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.secondaryText} style={{ marginRight: 10 }} />
              <Text style={[styles.iconInputText, { color: dob ? colors.text : colors.accent }]}>
                {dob ? formatDob(dob) : "Date of Birth"}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} style={{ marginLeft: "auto" }} />
            </TouchableOpacity>
          )}
        </View>

        {authError ? (
          <View style={[styles.errorBox, { backgroundColor: colors.danger + "18", borderColor: colors.danger }]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.danger} style={{ marginRight: 8 }} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{authError}</Text>
          </View>
        ) : null}

        {signInMode && (
          <TouchableOpacity style={{ alignItems: "center", marginTop: 8 }} onPress={handleForgotPassword} disabled={resetState === "sending"}>
            {resetState === "sent" ? (
              <Text style={[styles.authSwitch, { color: "#10B981" }]}>Reset email sent! Check your inbox.</Text>
            ) : resetState === "error" ? (
              <Text style={[styles.authSwitch, { color: colors.danger }]}>Couldn't send reset email. Check address.</Text>
            ) : (
              <Text style={[styles.authSwitch, { color: colors.text }]}>
                {resetState === "sending" ? "Sending..." : <Text style={{ textDecorationLine: "underline" }}>Forgot Password?</Text>}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

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

function StepBasicInfo({ colors, username, setUsername, city, setCity, dob, onOpenDob, canNext, onNext }: any) {
  return (
    <ScrollView contentContainerStyle={styles.infoContent} keyboardShouldPersistTaps="handled">
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
            autoCorrect={false}
          />
        </View>

        <View style={[styles.iconInputRow, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <TextInput
            style={[styles.iconInputText, { color: colors.text }]}
            placeholder="City"
            placeholderTextColor={colors.accent}
            value={city}
            onChangeText={setCity}
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={[styles.iconInputRow, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
          onPress={onOpenDob}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.secondaryText} style={{ marginRight: 10 }} />
          <Text style={[styles.iconInputText, { color: dob ? colors.text : colors.accent }]}>
            {dob ? formatDob(dob) : "Date of Birth"}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} style={{ marginLeft: "auto" }} />
        </TouchableOpacity>
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

function StepInterests({ colors, selected, onToggle, canNext, onNext }: any) {
  const [customInput, setCustomInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const customHobbies: string[] = selected.filter(
    (h: string) => !PREDEFINED_LABELS.has(h) && !INTEREST_OPTIONS.some((o) => o.label === h)
  );

  function addCustomHobby() {
    const label = customInput.trim();
    if (!label) return;
    if (!selected.includes(label)) onToggle(label);
    setCustomInput("");
    setShowCustomInput(false);
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.stepHeader}>
        <Text style={[styles.interestTitle, { color: colors.primary }]}>Select Interest</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
        <View style={styles.interestGrid}>
          {INTEREST_OPTIONS.map((h) => {
            const isOther = h.label === "Other..";
            const active = isOther ? showCustomInput : selected.includes(h.label);
            return (
              <TouchableOpacity
                key={h.label}
                onPress={() => {
                  if (isOther) setShowCustomInput((v) => !v);
                  else onToggle(h.label);
                }}
                style={[
                  styles.interestChip,
                  { backgroundColor: active ? colors.accent : colors.primary },
                ]}
              >
                <Text style={styles.interestChipText}>{h.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom hobby input — shown when "Other.." is tapped */}
        {showCustomInput && (
          <View style={[styles.customInputRow, { paddingHorizontal: 16, marginBottom: 12 }]}>
            <View style={[styles.iconInputRow, { backgroundColor: colors.inputBackground, borderColor: colors.border, flex: 1 }]}>
              <TextInput
                style={[styles.iconInputText, { color: colors.text }]}
                placeholder="Type your hobby..."
                placeholderTextColor={colors.accent}
                value={customInput}
                onChangeText={setCustomInput}
                onSubmitEditing={addCustomHobby}
                returnKeyType="done"
                autoFocus
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            <TouchableOpacity
              style={[styles.customAddBtn, { backgroundColor: colors.primary }]}
              onPress={addCustomHobby}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

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
              <Text style={[styles.freeTimeLabel, { color: active ? "#fff" : colors.accent }]}>
                {opt.label}
              </Text>
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

function StepFeatures({ colors, onFinish }: { colors: any; onFinish: () => void }) {
  return (
    <View style={styles.stepContent}>
      <Text style={[styles.featuresTitleLg, { color: colors.primary }]}>App Features</Text>
      <View style={styles.featureRows}>
        {FEATURE_ROWS.map((f) => (
          <View
            key={f.label}
            style={[styles.featureRow, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
          >
            <Ionicons name={f.icon} size={26} color={colors.primary} style={{ marginRight: 14 }} />
            <Text style={[styles.featureRowLabel, { color: colors.accent }]}>{f.label}</Text>
            <View style={[styles.featureRowChevron, { backgroundColor: colors.primary }]}>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </View>
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.nextBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginTop: "auto" as any }]}
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
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  dots: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { width: 20, height: 6, borderRadius: 3 },
  stepWrap: { flex: 1 },
  stepContent: { flex: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 },
  stepHeader: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 },
  stepFooter: { paddingHorizontal: 24, paddingBottom: 28 },
  fieldError: { fontSize: 12, marginTop: -8, marginBottom: 10, paddingHorizontal: 4 },
  errorBox: { flexDirection: "row", alignItems: "flex-start", padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8, marginHorizontal: 16 },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },

  // Welcome
  welcomeContainer: { flex: 1, paddingHorizontal: 32, justifyContent: "space-between", paddingVertical: 48 },
  welcomeTop: { alignItems: "center", flex: 1, justifyContent: "center", gap: 16 },
  welcomeLogo: { width: 120, height: 120, resizeMode: "contain" },
  welcomeTitle: { fontSize: 28, fontWeight: "700", textAlign: "center", lineHeight: 38 },
  welcomeTitleBold: { fontSize: 36, fontWeight: "900" },
  welcomeTagline: { fontSize: 18, textAlign: "center", lineHeight: 28, fontStyle: "italic" },
  welcomeButtons: { gap: 0 },
  welcomeBtn: { paddingVertical: 18, borderRadius: 16, alignItems: "center" },
  welcomeBtnText: { color: "#fff", fontWeight: "800", fontSize: 18 },

  // Auth sheet
  authSheet: { flex: 1, position: "relative" },
  authCloseBtn: { position: "absolute", top: 20, right: 20, width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", zIndex: 10 },
  authContent: { paddingHorizontal: 28, paddingTop: 60, paddingBottom: 24 },
  authTitle: { fontSize: 36, fontWeight: "800", marginBottom: 6 },
  authSwitch: { fontSize: 14, marginBottom: 32 },
  authFields: { gap: 12, marginBottom: 16 },
  authArrowBtn: { margin: 24, marginTop: 0, height: 58, borderRadius: 16, alignItems: "center", justifyContent: "center" },

  // Icon input
  iconInputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 16 },
  iconInputText: { flex: 1, fontSize: 16 },

  // Basic Info
  infoContent: { alignItems: "center", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  avatarCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, alignItems: "center", justifyContent: "center", marginBottom: 32 },
  infoFields: { width: "100%", gap: 12, marginBottom: 32 },
  nextBtn: { paddingVertical: 18, borderRadius: 16, alignItems: "center", justifyContent: "center", width: "100%" },
  nextBtnText: { color: "#fff", fontWeight: "700", fontSize: 17 },

  // Interests
  interestTitle: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 24 },
  interestGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  interestChip: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, minWidth: (SCREEN_W - 56) / 2, alignItems: "center", justifyContent: "center" },
  interestChipText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  customInputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  customAddBtn: { width: 50, height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  customChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  customChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  customChipText: { fontSize: 13, fontWeight: "600" },

  // Free time
  freeTimeQuestion: { fontSize: 26, fontWeight: "700", textAlign: "center", marginBottom: 32, lineHeight: 36 },
  freeTimeOptions: { gap: 12, marginBottom: 32 },
  freeTimeCard: { padding: 18, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  freeTimeLabel: { fontSize: 16, fontWeight: "600" },

  // Features
  featuresTitleLg: { fontSize: 28, fontWeight: "800", textAlign: "center", marginBottom: 32 },
  featureRows: { gap: 14, marginBottom: 32 },
  featureRow: { flexDirection: "row", alignItems: "center", padding: 18, borderRadius: 14, borderWidth: 1 },
  featureRowLabel: { flex: 1, fontSize: 16, fontWeight: "600" },
  featureRowChevron: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});

// ── Date picker styles ────────────────────────────────────────────────────────

const dp = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 20 },
  modal: { width: "100%", borderRadius: 20, borderWidth: 1, overflow: "hidden", paddingBottom: 16 },

  // Selected date banner
  selectedBanner: { paddingHorizontal: 20, paddingVertical: 16 },
  selectedYear: { color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: "600", letterSpacing: 0.5 },
  selectedDateText: { color: "#fff", fontSize: 26, fontWeight: "800", marginTop: 2 },

  // Header
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8, paddingVertical: 14 },
  navBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  monthYearBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingVertical: 6 },
  monthYearText: { fontSize: 17, fontWeight: "700" },

  // Year picker
  yearList: { height: 260 },
  yearItem: { height: 44, alignItems: "center", justifyContent: "center", borderRadius: 8, marginHorizontal: 16 },
  yearText: { fontSize: 16, fontWeight: "600" },

  // Calendar
  weekRow: { flexDirection: "row", paddingHorizontal: 8, marginBottom: 4 },
  weekDay: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 8 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 999 },
  cellText: { fontSize: 14, fontWeight: "600" },

  // Actions
  actions: { flexDirection: "row", gap: 12, paddingHorizontal: 16, marginTop: 16 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  cancelText: { fontSize: 15, fontWeight: "600" },
  confirmBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  confirmText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
