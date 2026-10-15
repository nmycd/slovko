// Recommended resources on /learn/resources. Every link was checked live in
// October 2026; descriptions are in each interface language.
import type { Locale, MessageKey } from "@/lib/i18n";

export type Resource = { name: string; url: string; description: Record<Locale, string> };
export type ResourceGroup = { title: MessageKey; items: Resource[] };

export const resourceGroups: ResourceGroup[] = [
  {
    title: "resources.dictionaries",
    items: [
      {
        name: "Slovnik.sk",
        url: "https://slovnik.aktuality.sk/",
        description: {
          en: "Translation dictionaries between Slovak and English, Russian, German, French, Hungarian, Spanish and Italian.",
          uk: "Перекладні словники між словацькою та англійською, російською, німецькою, французькою, угорською, іспанською й італійською.",
          ru: "Переводные словари между словацким и английским, русским, немецким, французским, венгерским, испанским и итальянским.",
        },
      },
      {
        name: "Slovenské slovníky (JULS SAV)",
        url: "https://slovnik.juls.savba.sk/",
        description: {
          en: "The Slovak Academy of Sciences' dictionary portal: meanings, spelling and forms of Slovak words, explained in Slovak.",
          uk: "Словниковий портал Словацької академії наук: значення, правопис і форми словацьких слів, пояснення словацькою.",
          ru: "Словарный портал Словацкой академии наук: значения, правописание и формы словацких слов, объяснения на словацком.",
        },
      },
    ],
  },
  {
    title: "resources.listening",
    items: [
      {
        name: "Rádio Slovensko (STVR)",
        url: "https://slovensko.stvr.sk/",
        description: {
          en: "Slovak public radio, live: news and talk in everyday Slovak.",
          uk: "Словацьке громадське радіо в прямому ефірі: новини й розмови повсякденною словацькою.",
          ru: "Словацкое общественное радио в прямом эфире: новости и разговоры на повседневном словацком.",
        },
      },
      {
        name: "Forvo",
        url: "https://forvo.com/languages/sk/",
        description: {
          en: "Slovak words and names pronounced by native speakers.",
          uk: "Словацькі слова й імена у вимові носіїв мови.",
          ru: "Словацкие слова и имена в произношении носителей языка.",
        },
      },
    ],
  },
];
