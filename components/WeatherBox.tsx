import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";
import { useEffect, useState } from "react";
import {
  searchCities,
  fetchForecast,
} from "../services/weatherService";

/**
 * Map weather condition to emoji icon
 */
function getWeatherIcon(condition: string) {
  switch (condition) {
    case "Clear":
      return "☀️";
    case "Clouds":
      return "☁️";
    case "Rain":
      return "🌧️";
    case "Snow":
      return "❄️";
    default:
      return "🌡️";
  }
}

/**
 * WeatherBox with:
 * - Autocomplete
 * - 3-day forecast
 * - Dark mode support
 */
export default function WeatherBox({
  weather,
  coords,
  onCitySelect,
  colors,
}: any) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);

  /**
   * Load forecast when coordinates change
   */
  useEffect(() => {
    if (coords) {
      fetchForecast(coords.lat, coords.lon).then(setForecast);
    }
  }, [coords]);

  /**
   * Debounced city autocomplete
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        searchCities(query).then(setResults);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  function selectCity(city: string) {
    onCitySelect(city);
    setQuery("");
    setResults([]);
    setExpanded(false);
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* Header */}
      <Pressable
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Weather in {weather.city}
          </Text>
          <Text style={[styles.value, { color: colors.secondaryText }]}>
            {weather.temperature}°C • {weather.description}
          </Text>
        </View>

        <Text style={styles.icon}>
          {getWeatherIcon(weather.condition)}
        </Text>
      </Pressable>

      {/* Expanded content */}
      {expanded && (
        <View style={styles.dropdown}>
          {/* City search */}
          <TextInput
            placeholder="Search city..."
            placeholderTextColor={colors.secondaryText}
            value={query}
            onChangeText={setQuery}
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
          />

          {results.map((item) => (
            <Pressable
              key={`${item.name}-${item.lat}-${item.lon}`}
              onPress={() =>
                selectCity(`${item.name}, ${item.country}`)
              }
              style={styles.result}
            >
              <Text style={{ color: colors.text }}>
                {item.name}, {item.country}
              </Text>
            </Pressable>
          ))}

          {/* 3-Day Forecast */}
          <View style={styles.forecastRow}>
            {forecast.map((day, index) => (
              <View key={index} style={styles.forecastItem}>
                <Text style={{ color: colors.text }}>
                  {new Date(day.dt * 1000).toLocaleDateString(
                    undefined,
                    { weekday: "short" }
                  )}
                </Text>
                <Text style={styles.forecastIcon}>
                  {getWeatherIcon(day.weather[0].main)}
                </Text>
                <Text style={{ color: colors.text }}>
                  {Math.round(day.main.temp)}°C
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
  },
  value: {
    marginTop: 4,
    fontSize: 13,
  },
  icon: {
    fontSize: 28,
  },
  dropdown: {
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  result: {
    paddingVertical: 10,
  },
  forecastRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  forecastItem: {
    alignItems: "center",
    flex: 1,
  },
  forecastIcon: {
    fontSize: 20,
    marginVertical: 4,
  },
});
