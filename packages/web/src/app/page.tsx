// Server component — fetches /health at render time (no client JS needed).

type HealthResponse = {
  status: string;
  service: string;
  ts: string;
};

async function getHealth(): Promise<{ data: HealthResponse | null; error: string | null }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${apiUrl}/health`, { cache: "no-store" });
    if (!res.ok) return { data: null, error: `HTTP ${res.status}` };
    const data: HealthResponse = await res.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

export default async function HomePage() {
  const { data, error } = await getHealth();

  const isOk = data?.status === "ok";

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: "1.5rem",
        padding: "2rem",
      }}
    >
      {/* Wordmark */}
      <div style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#6366f1" }}>
        Sentinel
      </div>

      <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0 }}>AI Risk — System of Record</h1>

      <p style={{ color: "#8b8ba8", margin: 0, fontSize: "0.95rem" }}>
        Continuous, independent AI risk monitoring for regulated enterprises.
      </p>

      {/* Health badge */}
      <div
        style={{
          marginTop: "1rem",
          padding: "1rem 2rem",
          borderRadius: "0.75rem",
          border: `1px solid ${isOk ? "#22c55e44" : "#ef444444"}`,
          background: isOk ? "#052e1644" : "#450a0a44",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.4rem",
          minWidth: "260px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: isOk ? "#22c55e" : "#ef4444",
              display: "inline-block",
            }}
          />
          <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
            API status:&nbsp;
            <span style={{ color: isOk ? "#22c55e" : "#ef4444" }}>{isOk ? "ok" : "unreachable"}</span>
          </span>
        </div>

        {error && (
          <span style={{ fontSize: "0.75rem", color: "#8b8ba8" }}>{error}</span>
        )}
        {data && (
          <span style={{ fontSize: "0.75rem", color: "#8b8ba8" }}>
            {data.service} &middot; {data.ts}
          </span>
        )}
      </div>

      <p style={{ fontSize: "0.75rem", color: "#5b5b70", margin: 0, marginTop: "0.5rem" }}>
        Phase 0 — scaffolding checkpoint
      </p>
    </main>
  );
}
