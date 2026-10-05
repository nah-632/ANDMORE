/**
 * ContentPage: renders a published bilingual content page from the database
 * (§12 content_pages, versioned, legal pages flagged for review).
 * Falls back to an honest empty state if content is missing.
 */
import { marked } from 'marked';
import { svc } from '@/lib/db/server';
import { getTranslations } from 'next-intl/server';

export async function ContentPage({ slug, locale }: { slug: string; locale: string }) {
  const t = await getTranslations({ locale, namespace: 'content' });
  const db = svc();
  const { data } = await db
    .from('content_pages')
    .select('title, body_md, requires_legal_review, version')
    .eq('slug', slug)
    .eq('locale', locale)
    .eq('published', true)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return (
      <div className="rounded border hairline bg-white p-8 text-center">
        <p className="text-ink/70">{t('missing')}</p>
      </div>
    );
  }

  return (
    <article>
      <h1 className="text-4xl font-bold">{data.title}</h1>
      {data.requires_legal_review && (
        <p className="mt-3 rounded border border-line bg-paper px-4 py-3 text-sm text-ink/70">
          ⚖ {t('legal_review')}
        </p>
      )}
      <div
        className="prose-andmore mt-8"
        dangerouslySetInnerHTML={{ __html: marked.parse(data.body_md, { async: false }) }}
      />
    </article>
  );
}
