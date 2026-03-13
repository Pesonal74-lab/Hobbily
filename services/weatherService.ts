/**
 * weatherService
 * Wrapper functions around the OpenWeatherMap API.
 *
 * API key is read from the EXPO_PUBLIC_WEATHER_API_KEY environment variable
 * (set in .env). The hardcoded fallback is intentionally left for local
 * development so the app works straight after cloning without a .env file.
 * Do not commit real API keys to source control.
 *
 * Endpoints used:
 *   /data/2.5/weather  — current conditions for a city name
 *   /data/2.5/forecast — 5-day / 3-hour forecast (filtered to 3 days)
 *   /geo/1.0/direct    — city name autocomplete (up to 5 results)
 */
const API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY ?? "148c03093249a703dc32357520ece4a7";

/**
 * Fetches current weather conditions for a given city name.
 * Returns the raw OpenWeatherMap response object.
 */
export async function fetchWeather(city: string) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
  );
  return res.json();
}

/**
 * Fetches a 3-day forecast using geographic coordinates.
 * OpenWeather returns data points every 3 hours (8 per day), so we sample
 * one point per day (index % 8 === 0) to get a daily representative reading.
 */
export async function fetchForecast(lat: number, lon: number) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
  );

  const data = await res.json();

  // Take one sample per day (every 8th data point ≈ same time each day)
  const daily = data.list.filter((_: any, index: number) => index % 8 === 0);

  return daily.slice(0, 3);
}

/**
 * Returns up to 5 city name suggestions matching the given search query.
 * Used to power the autocomplete dropdown in WeatherBox.
 */
export async function searchCities(query: string) {
  const res = await fetch(
    `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`
  );
  return res.json();
}
