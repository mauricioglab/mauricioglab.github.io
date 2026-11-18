import type { Lang } from '../../data/case-model';
import type { getAnalystOverview } from '../../data/analyst-overview';
import { sampleCrops } from '../../data/analyst-sample';
import '../../styles/analyst-overview.css';

interface Props {
  overview: NonNullable<ReturnType<typeof getAnalystOverview>>;
  lang: Lang;
}

export default function AnalystCaseOverview({ overview, lang }: Props) {
  const en = lang === 'en';
  const newTab = en ? ' (opens in a new tab)' : ' (nueva pestaña)';
  const original = en ? 'View full diagram' : 'Ver diagrama completo';
  return (
    <div class="mgd-overview" data-case-overview>
      {overview.summary.length > 0 && (
        <section class="mgd-summary" data-case-anchor="resumen" aria-label={en ? 'Summary' : 'Resumen'}>
          <dl>
            {overview.summary.map(({ title, text }, i) => <div key={i}><dt>{title}</dt><dd>{text}</dd></div>)}
          </dl>
        </section>
      )}

      {overview.analysis.length > 0 && (
        <section class="mgd-panel">
          <h3>{en ? 'Project analysis' : 'La historia del proyecto'}</h3>
          <ol class="mgd-analysis" role="list">
            {overview.analysis.map(({ title, diagram }, i) => {
              const crop = sampleCrops[diagram.url];
              return (
                <li key={i}>
                  <h4>{title}</h4>
                  <figure>
                    <a class="mgd-preview" href={diagram.url} target="_blank" rel="noopener" aria-label={original + ' · ' + title + newTab}>
                      {crop ? (
                        <svg viewBox={crop.viewBox} role="img" aria-label={diagram.alt || title}>
                          <image href={diagram.url} width={crop.width} height={crop.height} />
                        </svg>
                      ) : <img src={diagram.url} alt={diagram.alt || title} />}
                    </a>
                    {diagram.caption && <figcaption>{diagram.caption}</figcaption>}
                  </figure>
                  <a class="pt-link-gold mgd-original" href={diagram.url} target="_blank" rel="noopener">{original}<span class="sr-only"> · {title}{newTab}</span></a>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {overview.deliverables.length > 0 && (
        <section class="mgd-panel" data-case-anchor="evidencias">
          <h3>{overview.deliverablesTitle}</h3>
          <ul class="mgd-evidence">
            {overview.deliverables.map(({ label, url }, i) => (
              <li key={i}><a class="pt-link-gold" href={url} target="_blank" rel="noopener">{label || url}<span class="sr-only">{newTab}</span></a></li>
            ))}
          </ul>
        </section>
      )}

      {(overview.documents.length > 0 || overview.downloads.length > 0) && (
        <section class="mgd-panel" data-case-anchor="documentacion">
          <h3>{overview.documentsTitle}</h3>
          {overview.documents.map(({ title, links }, i) => (
            <details key={i}>
              <summary>{title}</summary>
              <ul>{links.map(({ label, url }, j) => <li key={j}><a class="pt-link-gold" href={url}>{label || url}</a></li>)}</ul>
            </details>
          ))}
          {overview.downloads.length > 0 && (
            <ul class="mgd-archive">{overview.downloads.map(({ label, url }, i) => <li key={i}><a class="pt-link-gold" href={url}>{label || url}</a></li>)}</ul>
          )}
        </section>
      )}
    </div>
  );
}