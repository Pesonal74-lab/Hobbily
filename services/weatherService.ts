const API_KEY = "148c03093249a703dc32357520ece4a7";

/**
 * Fetch current weather for a city
 */
export async function fetchWeather(city: string) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
  );
  return res.json();
}

/**
 * Fetch 3-day forecast using coordinates
 */
export async function fetchForecast(lat: number, lon: number) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
  );

  const data = await res.json();

  /**
   * OpenWeather returns data every 3 hours.
   * We take one data point per day (around midday).
   */
  const daily = data.list.filter((_: any, index: number) => index % 8 === 0);

  return daily.slice(0, 3);
}

/**
 * City autocomplete search
 */
export async function searchCities(query: string) {
  const res = await fetch(
    `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`
  );
  return res.json();
}
