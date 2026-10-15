// Recommended resources on /learn/resources. Every link was checked live in
// October 2026; descriptions are in each interface language. The books and films
// come from Slovak-for-foreigners teaching materials (University of Prešov), a
// level-by-level reading guide, BFI and Slovak Film Institute lists, with facts
// checked against Wikipedia, the Slovak Literary Centre and the film institute.
import type { Locale, MessageKey } from "@/lib/i18n";

export type Resource = { name: string; url: string; description: Record<Locale, string> };
export type ResourceGroup = { title: MessageKey; items: Resource[] };

/** Books and films to read and watch at each level, from learners' recommendations. */
export type Level = "A1" | "A2" | "B1" | "B2";
export type LevelItem = {
  /** Original Slovak title. */
  title: string;
  /** Author or director, and year. */
  by: string;
  /** Where to find it legally, when there is a good link. */
  url?: string;
  /** Why it suits the level. */
  note: Record<Locale, string>;
};
export type LevelSection = {
  title: MessageKey;
  /** One line under the heading, e.g. about availability. */
  note?: MessageKey;
  levels: { level: Level; items: LevelItem[] }[];
};

export const levelSections: LevelSection[] = [
  {
    title: "resources.books",
    note: "resources.booksNote",
    levels: [
      {
        level: "A1",
        items: [
          {
            title: "Zajko Bojko",
            by: "Ľudmila Podjavorinská, 1930",
            url: "https://www.martinus.sk/34243-zajko-bojko/kniha",
            note: {
              en: "A fairy tale in verse: rhymes and repeated lines make it easy to follow aloud.",
              uk: "Казка у віршах: рими й повтори легко сприймати на слух.",
              ru: "Сказка в стихах: рифмы и повторы легко воспринимать на слух.",
            },
          },
          {
            title: "Smelý zajko",
            by: "Jozef Cíger Hronský, 1930",
            url: "https://www.martinus.sk/51695-smely-zajko/kniha",
            note: {
              en: "A very short animal story, mostly told by the pictures.",
              uk: "Дуже коротка історія про зайчика, яку переважно розповідають малюнки.",
              ru: "Очень короткая история про зайчика, которую в основном рассказывают картинки.",
            },
          },
          {
            title: "Danka a Janka",
            by: "Mária Ďuríčková, 1961",
            url: "https://www.martinus.sk/71487-danka-a-janka/kniha",
            note: {
              en: "Stories about twin girls in clear, everyday prose; each one reads in a sitting.",
              uk: "Оповідання про сестер-близнючок простою сучасною прозою; кожне можна прочитати за раз.",
              ru: "Рассказы о сёстрах-близняшках простой современной прозой; каждый читается за раз.",
            },
          },
          {
            title: "Maťko a Kubko",
            by: "Marianna Grznárová, 1977",
            url: "https://www.martinus.sk/106351-matko-a-kubko/kniha",
            note: {
              en: "Tiny episodes about two shepherd boys, from the cartoon Pásli ovce valasi.",
              uk: "Крихітні епізоди про двох хлопчиків-пастушків, за мультфільмом Pásli ovce valasi.",
              ru: "Крошечные эпизоды о двух мальчиках-пастушках, по мультфильму Pásli ovce valasi.",
            },
          },
        ],
      },
      {
        level: "A2",
        items: [
          {
            title: "Osmijankove rozprávky",
            by: "Krista Bendová, 1967–1969",
            url: "https://www.martinus.sk/53729-osmijankove-rozpravky/kniha",
            note: {
              en: "Very short fairy tales, full of playful wordplay.",
              uk: "Дуже короткі казки, сповнені гри слів.",
              ru: "Очень короткие сказки, полные игры слов.",
            },
          },
          {
            title: "Opice z našej police",
            by: "Krista Bendová, 1967",
            url: "https://www.martinus.sk/37453-opice-z-nasej-police/kniha",
            note: {
              en: "A funny novel about three brothers in a Bratislava family: everyday home vocabulary.",
              uk: "Смішна повість про трьох братів із братиславської родини: побутова лексика.",
              ru: "Смешная повесть о трёх братьях из братиславской семьи: бытовая лексика.",
            },
          },
          {
            title: "Rozprávky Pavla Dobšinského",
            by: "Retold by Elena Slobodová",
            url: "https://www.martinus.sk/2778333-rozpravky-pavla-dobsinskeho/kniha",
            note: {
              en: "Slovakia's classic folk tales in modern language. The originals are archaic, so start with a retelling.",
              uk: "Класичні словацькі народні казки сучасною мовою. Оригінали архаїчні, тож починайте з переказу.",
              ru: "Классические словацкие народные сказки современным языком. Оригиналы архаичны, так что начинайте с пересказа.",
            },
          },
          {
            title: "Mimi a Líza",
            by: "Katarína Kerekesová, Katarína Moláková, Alexandra Salmela, 2013",
            url: "https://www.martinus.sk/560767-mimi-a-liza/kniha",
            note: {
              en: "A modern picture book set in the city, to go with the cartoon.",
              uk: "Сучасна книжка з картинками про місто, до однойменного мультфільму.",
              ru: "Современная книжка с картинками о городе, к одноимённому мультфильму.",
            },
          },
        ],
      },
      {
        level: "B1",
        items: [
          {
            title: "Jediná",
            by: "Klára Jarunková, 1963",
            url: "https://www.martinus.sk/3614331-jedina/kniha",
            note: {
              en: "A young-adult novel told by a 14-year-old girl, in teenage everyday language.",
              uk: "Підліткова повість від імені 14-річної дівчини, повсякденною мовою підлітків.",
              ru: "Подростковая повесть от лица 14-летней девочки, повседневным языком подростков.",
            },
          },
          {
            title: "Brat mlčanlivého Vlka",
            by: "Klára Jarunková, 1967",
            url: "https://www.martinus.sk/672801-brat-mlcanliveho-vlka/kniha",
            note: {
              en: "An adventure novel at a mountain hut, with a straightforward plot.",
              uk: "Пригодницька повість у гірській хатині з простим сюжетом.",
              ru: "Приключенческая повесть в горной хижине с простым сюжетом.",
            },
          },
          {
            title: "Analfabeta Negramotná",
            by: "Ján Uličiansky, 2011",
            url: "https://www.martinus.sk/392199-analfabeta-negramotna/kniha",
            note: {
              en: "An easy plot with lots of wordplay: good for stretching your vocabulary.",
              uk: "Легкий сюжет і багато гри слів: добре розширює словниковий запас.",
              ru: "Лёгкий сюжет и много игры слов: хорошо расширяет словарный запас.",
            },
          },
        ],
      },
      {
        level: "B2",
        items: [
          {
            title: "Neprebudený, Keď báčik z Chochoľova umrie",
            by: "Martin Kukučín, 1886 and 1890",
            url: "https://www.martinus.sk/839767-neprebudeny-ked-bacik-z-chocholova-umrie-vianocne-oblatky/e-kniha",
            note: {
              en: "Short stories by the most approachable of the classics, though the vocabulary is 19th-century.",
              uk: "Оповідання найдоступнішого з класиків, хоча лексика XIX століття.",
              ru: "Рассказы самого доступного из классиков, хотя лексика XIX века.",
            },
          },
          {
            title: "Stalo sa prvého septembra (alebo inokedy)",
            by: "Pavol Rankov, 2008",
            url: "https://www.martinus.sk/186737-stalo-sa-prveho-septembra-alebo-inokedy/kniha",
            note: {
              en: "A modern novel in plain prose; winner of the EU Prize for Literature.",
              uk: "Сучасний роман простою прозою, лауреат Літературної премії ЄС.",
              ru: "Современный роман простой прозой, лауреат Литературной премии ЕС.",
            },
          },
          {
            title: "Trhlina",
            by: "Jozef Karika, 2016",
            url: "https://www.martinus.sk/662837-trhlina/kniha",
            note: {
              en: "A page-turning mystery thriller in modern colloquial Slovak.",
              uk: "Захопливий містичний трилер сучасною розмовною словацькою.",
              ru: "Захватывающий мистический триллер на современном разговорном словацком.",
            },
          },
          {
            title: "Samko Tále: Kniha o cintoríne",
            by: "Daniela Kapitáňová, 2000",
            url: "https://www.martinus.sk/3689977-samko-tale-kniha-o-cintorine-vreckove-vydanie/kniha",
            note: {
              en: "A short satirical novel; the narrator's muddled voice is part of the joke.",
              uk: "Короткий сатиричний роман; плутана мова оповідача — частина жарту.",
              ru: "Короткий сатирический роман; путаная речь рассказчика — часть шутки.",
            },
          },
        ],
      },
    ],
  },
  {
    title: "resources.watching",
    note: "resources.watchingNote",
    levels: [
      {
        level: "A1",
        items: [
          {
            title: "Spievankovo",
            by: "Mária Podhradská and Richard Čanaky, since 2003",
            url: "https://www.youtube.com/@Spievankovo",
            note: {
              en: "Children's songs with lots of repetition and clear pronunciation.",
              uk: "Дитячі пісні з багатьма повторами й чіткою вимовою.",
              ru: "Детские песни с множеством повторов и чётким произношением.",
            },
          },
          {
            title: "Slimák Maťo a škriatok Klinček",
            by: "Jaroslav Cita, 1976–1987",
            url: "https://www.martinus.sk/529937-slimak-mato-a-skriatok-klincek-i/film",
            note: {
              en: "Gentle seven-minute bedtime cartoons about nature.",
              uk: "Спокійні семихвилинні мультфільми на ніч про природу.",
              ru: "Спокойные семиминутные мультфильмы на ночь о природе.",
            },
          },
          {
            title: "Pásli ovce valasi",
            by: "Ladislav Čapek, 1972",
            url: "https://www.martinus.sk/521023-pasli-ovce-valasi/film",
            note: {
              en: "The cartoon of Maťko a Kubko: one slow narrator, with some folk vocabulary.",
              uk: "Мультфільм про Maťko a Kubko: один неквапливий оповідач, трохи народної лексики.",
              ru: "Мультфильм о Maťko a Kubko: один неторопливый рассказчик, немного народной лексики.",
            },
          },
          {
            title: "Fidlibum",
            by: "Slovak Television (STV / RTVS)",
            url: "https://www.stvr.sk/televizia/archiv/13276/374395",
            note: {
              en: "A preschool show where a gnome answers 'why?' questions, slowly and simply.",
              uk: "Передача для дошкільнят: гномик повільно й просто відповідає на запитання «чому?».",
              ru: "Передача для дошкольников: гномик медленно и просто отвечает на вопросы «почему?».",
            },
          },
        ],
      },
      {
        level: "A2",
        items: [
          {
            title: "Mimi a Líza",
            by: "Katarína Kerekesová, 2013",
            url: "https://www.martinus.sk/610971-mimi-a-liza-kolekcia-kniha-dvd/kniha",
            note: {
              en: "Modern everyday Slovak in ten-minute episodes. Check the audio: Czech-dubbed versions exist.",
              uk: "Сучасна повсякденна словацька в десятихвилинних серіях. Перевірте звук: існує чеський дубляж.",
              ru: "Современный повседневный словацкий в десятиминутных сериях. Проверьте звук: есть чешский дубляж.",
            },
          },
          {
            title: "Drobci",
            by: "Vanda Raýmanová and Michal Struss, 2016",
            url: "https://www.martinus.sk/506255-drobci/film",
            note: {
              en: "Two little brothers in everyday situations, in paper-cut animation.",
              uk: "Двоє маленьких братів у буденних ситуаціях, паперова анімація.",
              ru: "Двое маленьких братьев в бытовых ситуациях, бумажная анимация.",
            },
          },
          {
            title: "Websterovci",
            by: "Katarína Kerekesová, 2017",
            url: "https://www.justwatch.com/sk/film/websterovci-vo-filme",
            note: {
              en: "A family of spiders in short episodes full of family dialogue; the film is on Apple TV with Slovak audio.",
              uk: "Родина павучків у коротких серіях із сімейними діалогами; фільм є на Apple TV зі словацьким звуком.",
              ru: "Семья паучков в коротких сериях с семейными диалогами; фильм есть на Apple TV со словацким звуком.",
            },
          },
        ],
      },
      {
        level: "B1",
        items: [
          {
            title: "Perinbaba",
            by: "Juraj Jakubisko, 1985",
            url: "https://sfu.sk/eshop/blu-ray-perinbaba/",
            note: {
              en: "A fairy-tale film with a familiar plot, shown on Slovak TV every Christmas.",
              uk: "Фільм-казка зі знайомим сюжетом, який словацьке ТБ показує щороку на Різдво.",
              ru: "Фильм-сказка со знакомым сюжетом, который словацкое ТВ показывает каждое Рождество.",
            },
          },
          {
            title: "Soľ nad zlato",
            by: "Martin Hollý, 1982",
            url: "https://sfu.sk/eshop/sol-nad-zlato/",
            note: {
              en: "A fairy tale about why salt is worth more than gold, with clear, measured speech.",
              uk: "Казка про те, чому сіль дорожча за золото, з чіткою, розміреною мовою.",
              ru: "Сказка о том, почему соль дороже золота, с чёткой, размеренной речью.",
            },
          },
          {
            title: "Popolvár najväčší na svete",
            by: "Martin Ťapák, 1982",
            url: "https://sfu.sk/eshop/zlata-kolekcia-slovenskych-rozpravok-ii/",
            note: {
              en: "A Dobšinský tale on film, with plain dialogue; part of the institute's fairy-tale DVD set.",
              uk: "Казка Добшинського на екрані, з простими діалогами; входить до DVD-збірки казок інституту.",
              ru: "Сказка Добшинского на экране, с простыми диалогами; входит в DVD-сборник сказок института.",
            },
          },
          {
            title: "Spadla z oblakov",
            by: "Radim Cvrček, 1978–1980",
            url: "https://www.martinus.sk/2689899-spadla-z-oblakov-i/film",
            note: {
              en: "A children's sci-fi series set in a village, with plenty of kids' dialogue.",
              uk: "Дитячий науково-фантастичний серіал у селі, з багатьма дитячими діалогами.",
              ru: "Детский научно-фантастический сериал в деревне, с множеством детских диалогов.",
            },
          },
        ],
      },
      {
        level: "B2",
        items: [
          {
            title: "Obchod na korze",
            by: "Ján Kadár and Elmar Klos, 1965",
            url: "https://sfu.sk/eshop/obchod-na-korze-dvd/",
            note: {
              en: "An Oscar-winning wartime drama; part of the dialogue is in Yiddish.",
              uk: "Воєнна драма, лауреат «Оскара»; частина діалогів — їдишем.",
              ru: "Военная драма, лауреат «Оскара»; часть диалогов на идише.",
            },
          },
          {
            title: "Slnko v sieti",
            by: "Štefan Uher, 1962",
            url: "https://sfu.sk/eshop/blu-ray-slnko-v-sieti/",
            note: {
              en: "A landmark of the Slovak New Wave, with poetic, elliptical dialogue.",
              uk: "Віха словацької «нової хвилі» з поетичними, недомовленими діалогами.",
              ru: "Веха словацкой «новой волны» с поэтичными, недосказанными диалогами.",
            },
          },
          {
            title: "Učiteľka",
            by: "Jan Hřebejk, 2016",
            url: "https://www.justwatch.com/sk/film/ucitelka",
            note: {
              en: "A drama built around a parents' meeting: dense, realistic adult conversation.",
              uk: "Драма навколо батьківських зборів: насичена, реалістична розмова дорослих.",
              ru: "Драма вокруг родительского собрания: насыщенный, реалистичный разговор взрослых.",
            },
          },
          {
            title: "Čiara",
            by: "Peter Bebjak, 2017",
            url: "https://www.justwatch.com/sk/film/ciara",
            note: {
              en: "A smuggling thriller on the Slovak–Ukrainian border, in Slovak and Ukrainian.",
              uk: "Трилер про контрабанду на словацько-українському кордоні, словацькою та українською.",
              ru: "Триллер о контрабанде на словацко-украинской границе, на словацком и украинском.",
            },
          },
        ],
      },
    ],
  },
];

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
