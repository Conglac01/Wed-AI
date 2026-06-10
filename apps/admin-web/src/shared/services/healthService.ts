import { config } from "@/app/config";

export type HealthStatus = "healthy" | "unavailable";

const HEALTH_TIMEOUT_MS = 5000;

export async function getBackendHealth(): Promise<HealthStatus> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

    const response = await fetch(`${config.apiBaseUrl}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (response.ok) {
      return "healthy";
    }
    return "unavailable";
  } catch {
    return "unavailable";
  }
}
