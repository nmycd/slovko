// Recommended resources on /learn/resources. Every link was checked live in
// October 2026; descriptions are in each interface language.
import type { Locale, MessageKey } from "@/lib/i18n";

export type Resource = { name: string; url: string; description: Record<Locale, string> };
export type ResourceGroup = { title: MessageKey; items: Resource[] };

export const resourceGroups: ResourceGroup[] = [
  {
    title: "resources.courses",
    items: [
      {
        name: "Slovake.eu",
        url: "https://slovake.eu/",
        description: {
          en: "A free online course from beginner to advanced, with a dictionary and exercises, in many languages.",
          uk: "Безкоштовний онлайн-курс від початкового до просунутого рівня, зі словником і вправами, багатьма мовами.",
          ru: "Бесплатный онлайн-курс от начального до продвинутого уровня, со словарём и упражнениями, на многих языках.",
        },
      },
      {
        name: "Studia Academica Slovaca",
        url: "https://fphil.uniba.sk/en/departments-and-research-centres/studia-academica-slovaca/",
        description: {
          en: "Comenius University's summer school of Slovak language and culture in Bratislava (paid), and the home of the Krížom-krážom textbooks our A1 course follows.",
          uk: "Літня школа словацької мови й культури Університету Коменського в Братиславі (платна), а також автори підручників Krížom-krážom, на яких побудовано наш курс A1.",
          ru: "Летняя школа словацкого языка и культуры Университета Коменского в Братиславе (платная), а также авторы учебников Krížom-krážom, на которых построен наш курс A1.",
        },
      },
    ],
  },
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
