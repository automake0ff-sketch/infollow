import Link from "next/link";
import { fmtDateTime } from "@/lib/form";
import { completeTask, snoozeTask } from "./actions";

export type TaskItem = { id: string; lead_id: string; title: string; due_at: string };

export default function TaskRow({ task, leadName, back, showLead = true }: { task: TaskItem; leadName?: string; back: string; showLead?: boolean }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{task.title}</p>
        <p className="truncate text-xs text-neutral-500">
          {fmtDateTime(task.due_at)}
          {showLead && leadName && (
            <> · <Link href={`/leads/${task.lead_id}`} className="underline">{leadName}</Link></>
          )}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <form action={completeTask}>
          <input type="hidden" name="task_id" value={task.id} />
          <input type="hidden" name="back" value={back} />
          <button className="rounded-lg bg-black px-2.5 py-1 text-xs text-white">Completar</button>
        </form>
        {[1, 3, 7].map((d) => (
          <form key={d} action={snoozeTask}>
            <input type="hidden" name="task_id" value={task.id} />
            <input type="hidden" name="days" value={d} />
            <input type="hidden" name="back" value={back} />
            <button className="rounded-lg border px-2 py-1 text-xs" title={`Posponer ${d} día(s)`}>+{d}d</button>
          </form>
        ))}
      </div>
    </li>
  );
}
