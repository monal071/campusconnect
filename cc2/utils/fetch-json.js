// A bounded JSON request with cancellation and useful errors (including HTML redirects).
export async function fetchJSON(url, { timeout = 12000, signal, ...options } = {}) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) cancel();
  signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(cancel, timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const type = response.headers.get("content-type") || "";
    if (!type.includes("application/json")) throw new Error("Unexpected server response. Please refresh or sign in again.");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.message || `Request failed (${response.status})`);
    return data;
  } catch (error) {
    if (controller.signal.aborted && !signal?.aborted) throw new Error("The server took too long to respond. Please try again.");
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}
