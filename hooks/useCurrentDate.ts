import { useEffect, useState } from "react";

/**
 * Custom hook to retrieve current date when app loads
 */
export function useCurrentDate() {
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    const today = new Date().toDateString();
    setDate(today);
  }, []);

  return date;
}
