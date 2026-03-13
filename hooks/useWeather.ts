import { useEffect, useState } from "react";
import { fetchWeatherByCity, fetchWeatherByIP } from "../services/weatherService";

/**
 * Weather hook
 * Handles IP weather + user-selected city
 */
export function useWeather() {
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    fetchWeatherByIP().then(setWeather);
  }, []);

  async function selectCity(city: string) {
    const result = await fetchWeatherByCity(city);
    setWeather(result);
  }

  return { weather, selectCity };
}
