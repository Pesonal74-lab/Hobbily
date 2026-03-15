/** Represents a single scheduled task or hobby session in the time manager */
export type Task = {
  id: string;
  title: string;
  /** "task" = general to-do; "hobby" = hobby practice session */
  type: "task" | "hobby";
  /** ISO date string YYYY-MM-DD */
  date: string;
  /** 24h time string HH:MM, e.g. "14:30" */
  time: string;
  /** Duration in minutes */
  duration: number;
  completed: boolean;
  createdAt: string;
};
