import type { Metadata } from "next";
import Link from "next/link";
import { getUseCases } from "@/lib/api";
import { Card } from "@/components/Card";
import { ConfidenceBadge, SourceBadge } from "@/components/Badge";

export const metadata: Metadata = { title: "Use Cases" };

export default async function UseCasesPage() {
  const { data: useCases } = await getUseCases();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e4e4f0]">Use Cases</h1>
        <p className="text-[#8b8ba8] text-sm mt-1">
          AI use-cases inferred from connectors — click to explore the dependency graph
        </p>
      </div>

      {useCases.length === 0 ? (
        <Card>
          <p className="text-sm text-[#5b5b70] text-center py-8">
            No use-cases yet. Run a sync from the Dashboard.
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {useCases.map((uc) => (
            <Link
              key={uc.id}
              href={`/use-cases/${encodeURIComponent(uc.id)}`}
              className="block bg-[#111118] border border-[#2a2a38] rounded-xl p-5 hover:border-[#6366f144] hover:bg-[#111120] transition-all group"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h2 className="font-semibold text-[#e4e4f0] group-hover:text-[#a5b4fc] transition-colors">
                  {uc.label}
                </h2>
                <ConfidenceBadge confidence={uc.confidence} />
              </div>
              <div className="flex items-center gap-2">
                <SourceBadge source={uc.source} />
                <span className="text-xs text-[#5b5b70]">
                  {new Date(uc.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-[#6366f1] mt-3">View dependency graph →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
