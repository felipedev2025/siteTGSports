export function InstitutionalPage({ title, content, fallback }: { title: string; content?: string | null; fallback: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-navy-900">{title}</h1>
      <div className="whitespace-pre-line text-sm leading-relaxed text-tggray-700">
        {content?.trim() ? content : fallback}
      </div>
    </div>
  );
}
