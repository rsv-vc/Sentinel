"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RectificationDTO, RectificationEvidenceDTO, RectificationPriority } from "@/lib/api";
import { createRectification, resolveRectification, fileEvidence, updateRectification } from "@/lib/api";

// ---------------------------------------------------------------------------
// Colour maps
// ---------------------------------------------------------------------------

const STATUS_COLOR: Record<string, string> = {
  OPEN:        "text-[#d4a456] bg-[#C4924A18] border-[#C4924A30]",
  IN_PROGRESS: "text-[#9baf9c] bg-[#8A9C8B18] border-[#8A9C8B30]",
  RESOLVED:    "text-[#9baf9c] bg-[#8A9C8B18] border-[#8A9C8B30]",
  WONT_FIX:    "text-[#5c5248] bg-[#2a282518] border-[#2a282530]",
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW:      "text-[#5c5248]",
  MEDIUM:   "text-[#d4a456]",
  HIGH:     "text-[#d4836e]",
  CRITICAL: "text-[#C86F58]",
};

// ---------------------------------------------------------------------------
// New rectification form
// ---------------------------------------------------------------------------

function NewRectificationForm({
  nodeId,
  obligationId,
  dimensionId,
  onCreated,
}: {
  nodeId?: string;
  obligationId?: string;
  dimensionId?: string;
  onCreated: () => void;
}) {
  const [open, setOpen]         = useState(false);
  const [title, setTitle]       = useState("");
  const [desc, setDesc]         = useState("");
  const [priority, setPriority] = useState<RectificationPriority>("MEDIUM");
  const [saving, setSaving]     = useState(false);
  const router                  = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await createRectification({ title: title.trim(), description: desc.trim(), nodeId, obligationId, dimensionId, priority });
      setTitle(""); setDesc(""); setOpen(false);
      onCreated();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1.5 rounded-lg border border-[#8A9C8B44] text-[#9baf9c] hover:bg-[#8A9C8B11] transition-colors"
      >
        + Open rectification
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-[#8A9C8B30] rounded-xl p-4 bg-[#1e2420] space-y-3">
      <p className="text-sm font-semibold text-[#D9C8B4]">New Rectification</p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title — what needs to be fixed?"
        required
        className="w-full bg-[#1a1918] border border-[#2a2825] rounded-lg px-3 py-2 text-sm text-[#D9C8B4] placeholder-[#5c5248] focus:outline-none focus:border-[#8A9C8B]"
      />
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className="w-full bg-[#1a1918] border border-[#2a2825] rounded-lg px-3 py-2 text-sm text-[#D9C8B4] placeholder-[#5c5248] focus:outline-none focus:border-[#8A9C8B] resize-none"
      />
      <div className="flex items-center gap-3">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as RectificationPriority)}
          className="bg-[#1a1918] border border-[#2a2825] rounded-lg px-3 py-2 text-sm text-[#D9C8B4] focus:outline-none focus:border-[#8A9C8B]"
        >
          {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as RectificationPriority[]).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[#8A9C8B] hover:bg-[#7a8c7b] text-[#1a1918] disabled:opacity-40 transition-colors"
        >
          {saving ? "Saving…" : "Open"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-[#5c5248] hover:text-[#9a9078]">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Evidence filing
// ---------------------------------------------------------------------------

function EvidenceFilingForm({
  rectificationId,
  onFiled,
}: {
  rectificationId: string;
  onFiled: () => void;
}) {
  const [content, setContent] = useState("");
  const [saving, setSaving]   = useState(false);
  const router                = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      await fileEvidence(rectificationId, content.trim());
      setContent("");
      onFiled();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
      <input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="File evidence — describe the control implemented…"
        className="flex-1 bg-[#1a1918] border border-[#2a2825] rounded-lg px-3 py-1.5 text-xs text-[#D9C8B4] placeholder-[#5c5248] focus:outline-none focus:border-[#8A9C8B]"
      />
      <button
        type="submit"
        disabled={saving || !content.trim()}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#8A9C8B18] text-[#9baf9c] border border-[#8A9C8B30] hover:bg-[#8A9C8B28] disabled:opacity-40 transition-colors"
      >
        {saving ? "…" : "File"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Single rectification row
// ---------------------------------------------------------------------------

function RectificationRow({
  rect,
  evidence,
  onUpdate,
}: {
  rect: RectificationDTO;
  evidence: RectificationEvidenceDTO[];
  onUpdate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [resolving, setResolving] = useState(false);
  const router = useRouter();

  async function handleResolve() {
    setResolving(true);
    try {
      await resolveRectification(rect.id);
      onUpdate();
      router.refresh();
    } finally {
      setResolving(false);
    }
  }

  async function handleStatusChange(status: string) {
    await updateRectification(rect.id, { status: status as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "WONT_FIX" });
    onUpdate();
    router.refresh();
  }

  return (
    <div className="border border-[#2a2825] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-[#1e1c1a] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold flex-shrink-0 ${STATUS_COLOR[rect.status]}`}>
            {rect.status.replace("_", " ")}
          </span>
          <span className={`text-xs font-semibold flex-shrink-0 ${PRIORITY_COLOR[rect.priority]}`}>
            {rect.priority}
          </span>
          <span className="text-sm text-[#D9C8B4] truncate">{rect.title}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {evidence.length > 0 && (
            <span className="text-xs text-[#9baf9c]">{evidence.length} evidence</span>
          )}
          <span className="text-[#5c5248] text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#2a2825] pt-3">
          {rect.description && (
            <p className="text-xs text-[#9a9078] leading-relaxed">{rect.description}</p>
          )}

          <div className="flex items-center gap-2 flex-wrap text-xs text-[#5c5248]">
            <span>Opened by {rect.actor}</span>
            <span>·</span>
            <span>{new Date(rect.createdAt).toLocaleDateString()}</span>
            {rect.dueDate && <><span>·</span><span>Due {new Date(rect.dueDate).toLocaleDateString()}</span></>}
            {rect.resolvedAt && <><span>·</span><span className="text-[#9baf9c]">Resolved {new Date(rect.resolvedAt).toLocaleDateString()}</span></>}
          </div>

          {/* Status controls */}
          {rect.status !== "RESOLVED" && rect.status !== "WONT_FIX" && (
            <div className="flex gap-2 flex-wrap">
              {rect.status === "OPEN" && (
                <button
                  onClick={() => handleStatusChange("IN_PROGRESS")}
                  className="text-xs px-2 py-1 rounded-lg border border-[#8A9C8B30] text-[#9baf9c] hover:bg-[#8A9C8B11] transition-colors"
                >
                  Mark in progress
                </button>
              )}
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="text-xs px-2 py-1 rounded-lg border border-[#8A9C8B30] text-[#9baf9c] hover:bg-[#8A9C8B11] disabled:opacity-40 transition-colors"
              >
                {resolving ? "Resolving…" : "Mark resolved"}
              </button>
              <button
                onClick={() => handleStatusChange("WONT_FIX")}
                className="text-xs px-2 py-1 rounded-lg border border-[#2a2825] text-[#5c5248] hover:bg-[#1e1c1a] transition-colors"
              >
                Won't fix
              </button>
            </div>
          )}

          {/* Evidence trail */}
          {evidence.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-[#9a9078]">Evidence trail</p>
              {evidence.map((ev) => (
                <div key={ev.id} className="flex gap-2 text-xs">
                  <span className="text-[#5c5248] flex-shrink-0 w-28">
                    {new Date(ev.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                  </span>
                  <span className="text-[#9baf9c] flex-shrink-0">✓</span>
                  <span className="text-[#9a9078]">{ev.content}</span>
                  <span className="text-[#5c5248] ml-auto flex-shrink-0">by {ev.actor}</span>
                </div>
              ))}
            </div>
          )}

          {/* File new evidence */}
          {rect.status !== "WONT_FIX" && (
            <EvidenceFilingForm rectificationId={rect.id} onFiled={onUpdate} />
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export — the panel used on use-case detail and /rectifications page
// ---------------------------------------------------------------------------

export function RectificationPanel({
  rectifications,
  nodeId,
  obligationId,
  dimensionId,
  title = "Rectifications",
}: {
  rectifications: Array<RectificationDTO & { evidence: RectificationEvidenceDTO[] }>;
  nodeId?: string;
  obligationId?: string;
  dimensionId?: string;
  title?: string;
}) {
  const [, forceUpdate] = useState(0);

  const open       = rectifications.filter((r) => r.status === "OPEN" || r.status === "IN_PROGRESS");
  const closed     = rectifications.filter((r) => r.status === "RESOLVED" || r.status === "WONT_FIX");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#9a9078]">{title}</p>
        <div className="flex items-center gap-2 text-xs text-[#5c5248]">
          {open.length > 0 && <span className="text-[#d4a456]">{open.length} open</span>}
          {closed.length > 0 && <span className="text-[#9baf9c]">{closed.length} closed</span>}
        </div>
      </div>

      <NewRectificationForm
        nodeId={nodeId}
        obligationId={obligationId}
        dimensionId={dimensionId}
        onCreated={() => forceUpdate((n) => n + 1)}
      />

      {rectifications.length === 0 && (
        <p className="text-xs text-[#5c5248]">No rectification actions yet.</p>
      )}

      <div className="space-y-2">
        {open.map((r) => (
          <RectificationRow
            key={r.id}
            rect={r}
            evidence={r.evidence}
            onUpdate={() => forceUpdate((n) => n + 1)}
          />
        ))}
        {closed.length > 0 && (
          <details>
            <summary className="text-xs text-[#5c5248] cursor-pointer hover:text-[#9a9078] py-1">
              {closed.length} closed / won't fix
            </summary>
            <div className="space-y-2 mt-2">
              {closed.map((r) => (
                <RectificationRow
                  key={r.id}
                  rect={r}
                  evidence={r.evidence}
                  onUpdate={() => forceUpdate((n) => n + 1)}
                />
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
