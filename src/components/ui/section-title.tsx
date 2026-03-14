interface SectionTitleProps {
  overline?: string;
  title: string;
  subtitle?: string;
}

export function SectionTitle({ overline, title, subtitle }: SectionTitleProps) {
  return (
    <div className="section-title" data-reveal="up">
      {overline ? <span className="overline">{overline}</span> : null}
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}
