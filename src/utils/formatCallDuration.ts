/**
 * Human-readable duration for call logs — mirrors web `formatTime(seconds)`.
 */
export const formatCallDuration = (seconds: number | null | undefined): string => {
  const s = Math.floor(Number(seconds) || 0);
  if (s <= 0) {
    return "0 seconds";
  }
  const minutes = Math.floor(s / 60);
  const remainingSeconds = Math.floor(s % 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.floor(minutes % 60);

  let timeString = "";

  if (hours > 0) {
    timeString += `${hours} hour${hours > 1 ? "s" : ""} `;
  }

  if (remainingMinutes > 0) {
    timeString += `${remainingMinutes} minute${
      remainingMinutes > 1 ? "s" : ""
    } `;
  }

  if (remainingSeconds > 0 && hours === 0) {
    timeString += `${remainingSeconds} second${remainingSeconds > 1 ? "s" : ""}`;
  }

  return timeString.trim() || "0 seconds";
};
