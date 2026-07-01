import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock, Droplets, FlaskConical, Gauge } from "lucide-react";

import { CATEGORY_META, SOURCE_LABELS, difficultyLabel, getAllDocs, getDoc } from "@/lib/knowledge";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/knowledge/category-icon";
import { StageBadge } from "@/components/knowledge/stage-badge";
import { StepStrip } from "@/components/knowledge/step-strip";

export function generateStaticParams() {
  return getAllDocs().map((doc) => ({ id: doc.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = getDoc(id);
  return { title: doc ? `${doc.title} · Ferment` : "Recipe · Ferment" };
}

function MetaItem({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-muted" aria-hidden />
      <span className="text-xs text-secondary">
        <span className="font-semibold text-ink">{value}</span> {label}
      </span>
    </div>
  );
}

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = getDoc(id);
  if (!doc) notFound();

  const related = doc.related.map((rid) => getDoc(rid)).filter((d): d is NonNullable<typeof d> => Boolean(d));
  const timeLabel = doc.timeDays
    ? doc.timeDays[0] === doc.timeDays[1]
      ? `${doc.timeDays[0]} day${doc.timeDays[0] === 1 ? "" : "s"}`
      : `${doc.timeDays[0]}–${doc.timeDays[1]} days`
    : null;

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <Link
        href="/knowledge"
        className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-secondary transition-colors hover:text-ink"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Knowledge Base
      </Link>

      {/* Header */}
      <header className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-card)] border-2 border-ink-border bg-subtle-fill">
            <CategoryIcon category={doc.category} className="size-6 text-accent" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h1 className="text-xl font-bold leading-tight text-ink">{doc.title}</h1>
              {doc.abbr ? <span className="text-sm font-semibold uppercase text-muted">{doc.abbr}</span> : null}
            </div>
            <p className="text-xs text-secondary">
              {CATEGORY_META[doc.category].label} · {SOURCE_LABELS[doc.source] ?? doc.source}
            </p>
          </div>
        </div>

        <p className="text-sm text-secondary">{doc.summary}</p>

        <div className="flex flex-wrap gap-1.5">
          {doc.stage.map((s) => (
            <StageBadge key={s} stage={s} />
          ))}
        </div>

        {/* Meta strip */}
        <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-card)] bg-subtle-fill px-4 py-3">
          <MetaItem icon={Gauge} label="to make" value={difficultyLabel(doc.difficulty)} />
          {timeLabel ? <MetaItem icon={Clock} label="ferment" value={timeLabel} /> : null}
          {doc.dilution ? <MetaItem icon={Droplets} label="dilution" value={doc.dilution} /> : null}
          {doc.supplies.length > 0 ? (
            <MetaItem icon={FlaskConical} label="supplied" value={doc.supplies.slice(0, 3).join(", ")} />
          ) : null}
        </div>

        {doc.fermentType ? (
          <Button asChild size="lg" className="w-full">
            <Link href={`/new?type=${doc.fermentType}`}>＋ Start a batch from this recipe</Link>
          </Button>
        ) : null}
      </header>

      {/* Ingredients */}
      {doc.ingredients.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">Ingredients</h2>
          <ul className="flex flex-col gap-1.5 rounded-[var(--radius-card)] border-2 border-hairline bg-white p-4">
            {doc.ingredients.map((ing, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-ink">{ing.item}</span>
                {ing.qty ? (
                  <span className="shrink-0 whitespace-nowrap font-semibold text-secondary">
                    {ing.qty}
                    {ing.unit ? ` ${ing.unit}` : ""}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Diagram */}
      {doc.steps.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">How to make it</h2>
          <div className="rounded-[var(--radius-card)] border-2 border-hairline bg-white p-4">
            <StepStrip steps={doc.steps} />
          </div>
        </section>
      ) : null}

      {/* Article body */}
      <article className="kb-prose" dangerouslySetInnerHTML={{ __html: doc.bodyHtml }} />

      {/* Related */}
      {related.length > 0 ? (
        <section className="flex flex-col gap-2 border-t border-hairline pt-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">Related</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((rel) => (
              <Link
                key={rel.id}
                href={`/knowledge/${rel.id}`}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-chip)] border-2 border-border bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-subtle-fill"
              >
                <CategoryIcon category={rel.category} className="size-4 text-accent" />
                {rel.abbr ?? rel.title}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
