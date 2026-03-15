/**
 * Opportunities screen
 * Search and browse programs, clubs, and workshops available to teens
 * in Israel and Palestine, categorised by hobby/interest.
 * Data is local/mock for now and can be replaced with an API later.
 */
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Linking,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import SwipeableTab from "../../components/SwipeableTab";

// ── Data ──────────────────────────────────────────────────────────────────────

type Opportunity = {
  id: string;
  name: string;
  organisation: string;
  category: string;
  location: string;
  ageRange: string;
  cost: "Free" | "Subsidised" | "Paid";
  description: string;
  highlights: string[];
  contact?: string;
  website?: string;
};

const OPPORTUNITIES: Opportunity[] = [
  {
    id: "1",
    name: "Youth Photography Workshop",
    organisation: "Tel Aviv Museum of Art",
    category: "Photography",
    location: "Tel Aviv",
    ageRange: "14–18",
    cost: "Subsidised",
    description:
      "A 10-week photography programme covering composition, lighting, and digital editing. Participants display their work in a final group exhibition.",
    highlights: ["Weekly 2h sessions", "Camera equipment provided", "Final exhibition"],
    contact: "education@tamuseum.org.il",
    website: "https://www.tamuseum.org.il",
  },
  {
    id: "2",
    name: "Maktoob Youth Coding Bootcamp",
    organisation: "Maktoob / Google.org",
    category: "Coding",
    location: "Ramallah / Online",
    ageRange: "15–18",
    cost: "Free",
    description:
      "Intensive coding bootcamp teaching web development and entrepreneurship skills to Palestinian youth. Includes mentorship from tech professionals.",
    highlights: ["12-week programme", "Mentorship included", "Certificate on completion"],
    website: "https://www.maktoob.org",
  },
  {
    id: "3",
    name: "Football for Peace Academy",
    organisation: "Peres Center for Peace",
    category: "Sports",
    location: "Various cities (IL/PA)",
    ageRange: "13–17",
    cost: "Free",
    description:
      "Mixed Israeli and Palestinian football teams train together to build teamwork, leadership, and coexistence skills through sport.",
    highlights: ["Co-ed and mixed teams", "Free kit provided", "Regional tournaments"],
    contact: "youth@peres-center.org",
  },
  {
    id: "4",
    name: "Al-Kamandjati Music School",
    organisation: "Al-Kamandjati",
    category: "Music",
    location: "Ramallah / Dheisheh",
    ageRange: "13–18",
    cost: "Free",
    description:
      "Provides classical and Arabic music education to Palestinian youth, offering individual lessons, ensembles, and concerts.",
    highlights: ["Classical & Arabic music", "Instrument loans available", "Annual concerts"],
    website: "https://www.al-kamandjati.com",
  },
  {
    id: "5",
    name: "Young Creators Art Studio",
    organisation: "Jerusalem Open House for Art",
    category: "Drawing & Art",
    location: "Jerusalem",
    ageRange: "14–18",
    cost: "Subsidised",
    description:
      "Bi-weekly studio sessions in painting, drawing, and mixed-media art. Students exhibit work at the end of each semester.",
    highlights: ["Materials provided", "Bi-weekly sessions", "Semester exhibition"],
    contact: "studio@joha.org.il",
  },
  {
    id: "6",
    name: "Teen Film Lab",
    organisation: "Jerusalem Sam Spiegel Film School",
    category: "Film & Video",
    location: "Jerusalem",
    ageRange: "14–18",
    cost: "Subsidised",
    description:
      "A semester-long programme where teens write, direct, and edit their own short films. Equipment and editing suites are provided.",
    highlights: ["Camera & editing suite access", "Mentored by film students", "Showcase screening"],
    website: "https://www.jsfs.co.il",
  },
  {
    id: "7",
    name: "Surf Club Youth Programme",
    organisation: "Israel Surf Association",
    category: "Sports",
    location: "Tel Aviv Beach",
    ageRange: "13–18",
    cost: "Subsidised",
    description:
      "Learn-to-surf and intermediate sessions on Tel Aviv beach every weekend. Board and wetsuit rental included in the registration fee.",
    highlights: ["Weekend morning sessions", "Equipment included", "Safety certification"],
    contact: "youth@israelsurf.org.il",
  },
  {
    id: "8",
    name: "Dance Fusion Workshop",
    organisation: "Vertigo Dance Company",
    category: "Dance",
    location: "Kibbutz Netiv HaLamed Heh",
    ageRange: "15–18",
    cost: "Subsidised",
    description:
      "Explore contemporary, hip-hop, and traditional dance forms with professional dancers. Summer and winter intensive options available.",
    highlights: ["Multi-style training", "Residential option", "Performance showcase"],
    website: "https://www.vertigo.org.il",
  },
  {
    id: "9",
    name: "Kitchen Explorers Cooking Club",
    organisation: "Arab-Jewish Community Centre Jaffa",
    category: "Cooking",
    location: "Jaffa / Tel Aviv",
    ageRange: "13–17",
    cost: "Free",
    description:
      "Bi-weekly cooking sessions exploring Mediterranean, Middle Eastern, and fusion cuisine. All ingredients provided. Teens learn and cook together.",
    highlights: ["All ingredients provided", "Bi-weekly sessions", "Cultural exchange focus"],
    contact: "community@ajccjaffa.org",
  },
  {
    id: "10",
    name: "e-Sports and Game Design Camp",
    organisation: "Mifras Youth Tech Hub",
    category: "Gaming",
    location: "Haifa",
    ageRange: "13–18",
    cost: "Paid",
    description:
      "Multi-day camp covering competitive e-sports, basic game design in Unity, and streaming. Scholarships available for families with financial need.",
    highlights: ["Unity game design", "Streaming & content creation", "Scholarships available"],
    contact: "info@mifras.co.il",
  },
  {
    id: "11",
    name: "Young Writers Circle",
    organisation: "Tamer Institute for Community Education",
    category: "Reading",
    location: "Ramallah / Gaza",
    ageRange: "13–18",
    cost: "Free",
    description:
      "A monthly workshop for youth interested in creative writing, poetry, and storytelling in Arabic. Works are published in the institute's youth magazine.",
    highlights: ["Arabic creative writing", "Monthly sessions", "Published in youth magazine"],
    website: "https://www.tamerinst.org",
  },
  {
    id: "12",
    name: "Robotics & STEM Club",
    organisation: "FIRST Israel / ORT Network",
    category: "Coding",
    location: "Multiple cities (IL)",
    ageRange: "14–18",
    cost: "Subsidised",
    description:
      "Join a FIRST Robotics team to build and compete with a robot at regional and international competitions. Engineering, coding, and teamwork are key.",
    highlights: ["International competitions", "Mentored by engineers", "ORT school network"],
    website: "https://www.firstisrael.org.il",
  },
];

const CATEGORIES = ["All", "Photography", "Coding", "Sports", "Music", "Drawing & Art", "Film & Video", "Dance", "Cooking", "Gaming", "Reading"];

const COST_COLORS: Record<string, string> = {
  Free: "#2e7d32",
  Subsidised: "#1565c0",
  Paid: "#6a1b9a",
};

// ── Opportunity Card ──────────────────────────────────────────────────────────

type CardProps = {
  opp: Opportunity;
  colors: ReturnType<typeof useTheme>["colors"];
  onPress: () => void;
};

function OpportunityCard({ opp, colors, onPress }: CardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.82}
    >
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardName, { color: colors.text }]}>{opp.name}</Text>
          <Text style={[styles.cardOrg, { color: colors.secondaryText }]}>{opp.organisation}</Text>
        </View>
        <View style={[styles.costBadge, { backgroundColor: COST_COLORS[opp.cost] + "18" }]}>
          <Text style={[styles.costText, { color: COST_COLORS[opp.cost] }]}>{opp.cost}</Text>
        </View>
      </View>

      <Text style={[styles.cardDesc, { color: colors.secondaryText }]} numberOfLines={2}>
        {opp.description}
      </Text>

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={13} color={colors.tabBarInactive} />
          <Text style={[styles.metaText, { color: colors.tabBarInactive }]}>{opp.location}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={13} color={colors.tabBarInactive} />
          <Text style={[styles.metaText, { color: colors.tabBarInactive }]}>Ages {opp.ageRange}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="pricetag-outline" size={13} color={colors.tabBarInactive} />
          <Text style={[styles.metaText, { color: colors.tabBarInactive }]}>{opp.category}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={[styles.learnMore, { color: colors.primary }]}>
          View details <Ionicons name="arrow-forward" size={12} color={colors.primary} />
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

type DetailProps = {
  opp: Opportunity | null;
  onClose: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
};

function DetailModal({ opp, onClose, colors }: DetailProps) {
  if (!opp) return null;
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
          <View style={styles.modalHandle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <View style={[styles.costBadge, { backgroundColor: COST_COLORS[opp.cost] + "18", alignSelf: "flex-start", marginBottom: 6 }]}>
                  <Text style={[styles.costText, { color: COST_COLORS[opp.cost] }]}>{opp.cost}</Text>
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{opp.name}</Text>
                <Text style={[styles.modalOrg, { color: colors.primary }]}>{opp.organisation}</Text>
              </View>
            </View>

            <Text style={[styles.modalDesc, { color: colors.text }]}>{opp.description}</Text>

            {/* Highlights */}
            <Text style={[styles.detailSection, { color: colors.text }]}>What you get</Text>
            {opp.highlights.map((h, i) => (
              <View key={i} style={styles.highlightRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.highlightText, { color: colors.text }]}>{h}</Text>
              </View>
            ))}

            {/* Info grid */}
            <Text style={[styles.detailSection, { color: colors.text }]}>Details</Text>
            <View style={[styles.infoGrid, { backgroundColor: colors.background, borderColor: colors.border }]}>
              {[
                { icon: "location-outline", label: "Location", value: opp.location },
                { icon: "people-outline", label: "Age Range", value: opp.ageRange },
                { icon: "pricetag-outline", label: "Category", value: opp.category },
                { icon: "cash-outline", label: "Cost", value: opp.cost },
              ].map((row) => (
                <View key={row.label} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                  <Ionicons name={row.icon as any} size={16} color={colors.secondaryText} style={{ marginRight: 10, width: 20 }} />
                  <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>{row.label}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{row.value}</Text>
                </View>
              ))}
            </View>

            {/* Contact / Website */}
            {(opp.contact || opp.website) && (
              <>
                <Text style={[styles.detailSection, { color: colors.text }]}>Register / Contact</Text>
                {opp.contact && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`mailto:${opp.contact}`)}
                    style={[styles.contactBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary }]}
                  >
                    <Ionicons name="mail-outline" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.contactText, { color: colors.primary }]}>{opp.contact}</Text>
                  </TouchableOpacity>
                )}
                {opp.website && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(opp.website!)}
                    style={[styles.contactBtn, { backgroundColor: colors.secondary + "30", borderColor: colors.border }]}
                  >
                    <Ionicons name="globe-outline" size={16} color={colors.text} style={{ marginRight: 8 }} />
                    <Text style={[styles.contactText, { color: colors.text }]}>Visit Website</Text>
                    <Ionicons name="open-outline" size={13} color={colors.secondaryText} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                )}
              </>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function OpportunitiesScreen() {
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selected, setSelected] = useState<Opportunity | null>(null);

  const filtered = OPPORTUNITIES.filter((o) => {
    const matchCat = activeCategory === "All" || o.category === activeCategory;
    const matchSearch =
      !search ||
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.category.toLowerCase().includes(search.toLowerCase()) ||
      o.location.toLowerCase().includes(search.toLowerCase()) ||
      o.organisation.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <SwipeableTab tabIndex={3} backgroundColor={colors.background}>
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Opportunities</Text>
          <Text style={[styles.headerSub, { color: colors.secondaryText }]}>
            Programs, clubs & workshops near you
          </Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: colors.primary + "18" }]}>
          <Text style={[styles.countText, { color: colors.primary }]}>{filtered.length}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchWrap}>
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={18} color={colors.secondaryText} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by hobby, location, name..."
              placeholderTextColor={colors.secondaryText}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color={colors.secondaryText} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryStrip}
        >
          {CATEGORIES.map((cat) => {
            const isActive = cat === activeCategory;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[
                  styles.categoryChip,
                  { borderColor: colors.border },
                  isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
                  !isActive && { backgroundColor: colors.card },
                ]}
              >
                <Text style={[styles.categoryChipText, { color: isActive ? "#fff" : colors.text }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Results */}
        <View style={styles.resultsList}>
          {filtered.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={40} color={colors.secondaryText} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No results found</Text>
              <Text style={[styles.emptyBody, { color: colors.secondaryText }]}>
                Try a different search term or category.
              </Text>
              <TouchableOpacity
                onPress={() => { setSearch(""); setActiveCategory("All"); }}
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filtered.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opp={opp}
                colors={colors}
                onPress={() => setSelected(opp)}
              />
            ))
          )}
        </View>

        {/* Footer note */}
        <View style={[styles.footerNote, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.secondaryText} style={{ marginRight: 8 }} />
          <Text style={[styles.footerText, { color: colors.secondaryText }]}>
            Know of a programme we're missing? Share it in the Community tab!
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <DetailModal opp={selected} onClose={() => setSelected(null)} colors={colors} />
    </SafeAreaView>
    </SwipeableTab>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  headerSub: { fontSize: 13, marginTop: 2 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countText: { fontWeight: "700", fontSize: 15 },
  searchWrap: { paddingHorizontal: 16, paddingTop: 14 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15 },
  categoryStrip: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: { fontSize: 13, fontWeight: "600" },
  resultsList: { paddingHorizontal: 16, gap: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardTop: { flexDirection: "row", marginBottom: 8 },
  cardName: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  cardOrg: { fontSize: 13 },
  costBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: "flex-start" },
  costText: { fontSize: 11, fontWeight: "700" },
  cardDesc: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 12 },
  cardFooter: {},
  learnMore: { fontSize: 13, fontWeight: "700" },
  emptyCard: {
    alignItems: "center",
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginTop: 12, marginBottom: 6 },
  emptyBody: { textAlign: "center", fontSize: 14, marginBottom: 16, lineHeight: 20 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  footerText: { flex: 1, fontSize: 13, lineHeight: 18 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: "90%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: { marginBottom: 14 },
  modalTitle: { fontSize: 22, fontWeight: "800", marginBottom: 4, letterSpacing: -0.3 },
  modalOrg: { fontSize: 14, fontWeight: "600" },
  modalDesc: { fontSize: 14, lineHeight: 22, marginBottom: 20 },
  detailSection: { fontSize: 15, fontWeight: "700", marginBottom: 10, marginTop: 4 },
  highlightRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  highlightText: { fontSize: 14 },
  infoGrid: { borderRadius: 12, borderWidth: 1, marginBottom: 20, overflow: "hidden" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
  },
  infoLabel: { flex: 1, fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: "600" },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  contactText: { fontSize: 14, fontWeight: "600" },
  closeBtn: {
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
});
