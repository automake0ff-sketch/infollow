import Link from "next/link";
import QuickTask from "./QuickTask";

export type PriorityItem = {
  lead_id: string;
  score: number;
  level: "alta" | "media" | "baja";
  reasons: { rule: string; weight: number; reason: string }[];
};

const BADGE = {
  alta: "bg-red-100 text-red-800",
  media: "bg-amber-100 text-amber-800",
  baja: "bg-neutral-100 text-neutral-700",
} as const;

export default function PriorityList({
  items,
  names,
  back,
}: {
  items: PriorityItem[];
  names: Record<string, { full_name: string; stage: string }>;
  back: string;
}) {
  return (
    <ul className="divide-y rounded-xl border bg-white">
      {items.map((it) => {
        const lead = names[it.lead_id];
        const hasNoStep = it.reasons.some((r) => r.rule === "no_next_step");
        return (
          <li key={it.lead_id} className="space-y-2 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <Link href={`/leads/${it.lead_id}`} className="font-medium underline">{lead?.full_name ?? "Lead"}</Link>
                <span className="ml-2 text-xs text-neutral-500">{lead?.stage}</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${BADGE[it.level]}`} title="Puntuación de prioridad de atención, no probabilidad de cierre">
                Prioridad {it.level} · {it.score}
              </span>
            </div>
            <ul className="list-disc space-y-0.5 pl-5 text-xs text-neutral-600">
              {it.reasons.map((r) => <li key={r.rule}>{r.reason}</li>)}
            </ul>
            {hasNoStep && <QuickTask leadId={it.lead_id} back={back} />}
          </li>
        );
      })}
    </ul>
  );
}
