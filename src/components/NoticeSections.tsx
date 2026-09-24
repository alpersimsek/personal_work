import React from 'react';
import type { KvkkSection } from '../legal/kvkk';

interface NoticeSectionsProps {
  intro: string;
  sections: KvkkSection[];
  /** Heading size: the full page uses larger headings than the modal. */
  compact?: boolean;
}

/** Renders a privacy notice: an introduction followed by numbered sections. */
export const NoticeSections: React.FC<NoticeSectionsProps> = ({ intro, sections, compact = false }) => (
  <>
    <p className={`text-white/80 leading-relaxed font-light ${compact ? 'text-sm sm:text-base mb-6' : 'text-base sm:text-lg mb-10'}`}>
      {intro}
    </p>

    <div className={compact ? 'space-y-6' : 'space-y-10'}>
      {sections.map((section, index) => (
        <section key={section.title}>
          <h2 className={`serif-font text-white tracking-tight mb-2 ${compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl mb-3'}`}>
            {index + 1}. {section.title}
          </h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="text-white/75 text-sm sm:text-base leading-relaxed font-light mb-3">
              {paragraph}
            </p>
          ))}
          {section.items && (
            <ul className="list-disc pl-5 space-y-1.5 text-white/75 text-sm sm:text-base leading-relaxed font-light">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  </>
);
