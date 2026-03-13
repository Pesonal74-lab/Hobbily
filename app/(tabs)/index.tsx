import { View, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import WeatherBox from "../../components/WeatherBox";
import InfoBox from "../../components/InfoBox";
import { fetchWeather } from "../../services/weatherService";
import { useTheme } from "../../context/ThemeContext";

export default function PostsScreen() {
  const { colors } = useTheme();

  const [weather, setWeather] = useState<any>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [openedAt, setOpenedAt] = useState("");

  /**
   * Runs once when the app opens
   */
  useEffect(() => {
    const now = new Date();
    setOpenedAt(now.toLocaleString());

    // Default city on launch
    loadWeather("London");
  }, []);

  /**
   * Fetch weather and extract coordinates
   */
  async function loadWeather(city: string) {
    const data = await fetchWeather(city);

    setWeather({
      city: data.name,
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description,
      condition: data.weather[0].main,
    });

    setCoords({
      lat: data.coord.lat,
      lon: data.coord.lon,
    });
  }

  if (!weather) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16 }}
    >
      {/* Time app was opened */}
      <InfoBox
        title="App opened at"
        value={openedAt}
        colors={colors}
      />

      {/* Weather with 3-day forecast */}
      <WeatherBox
        weather={weather}
        coords={coords}
        onCitySelect={loadWeather}
        colors={colors}
      />
    </ScrollView>
  );
}
