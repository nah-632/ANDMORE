/**
 * ContentPage: renders a published bilingual content page from the database
 * (§12 content_pages, versioned, legal pages flagged for review).
 *
 * STATIC-BUILD SAFE: legal/about content is bilingual, rarely changing text —
 * it is NOT read from the DB at build time (no Supabase env on CI runners).
 * Instead the copy lives in typed content modules (single source of truth,
 * mirroring migration 0007 seed) and is rendered directly. The DB table
 * remains the CMS path for admin edits (P7) — pages will switch to DB
 * reads with `dynamic = 'force-dynamic'` once an admin editor exists.
 */
import { marked } from 'marked';
import { getTranslations } from 'next-intl/server';
import { LEGAL_CONTENT, type ContentEntry } from '@/lib/content/legal';

export async function ContentPage({ slug, locale }: { slug: string; locale: string }) {
  const t = await getTranslations({ locale, namespace: 'content' });
  const entry: ContentEntry | undefined = LEGAL_CONTENT[slug]?.[locale as 'ar' | 'en'];

  if (!entry) {
    return (
      <div className="rounded border hairline bg-white p-8 text-center">
        <p className="text-ink/70">{t('missing')}</p>
      </div>
    );
  }

  return (
    <article>
      <h1 className="text-4xl font-bold">{entry.title}</h1>
      {entry.requiresLegalReview && (
        <p className="mt-3 rounded border border-line bg-paper px-4 py-3 text-sm text-ink/70">
          ⚖ {t('legal_review')}
        </p>
      )}
      <div
        className="prose-andmore mt-8"
        dangerouslySetInnerHTML={{ __html: marked.parse(entry.body, { async: false }) }}
      />
    </article>
  );
}
