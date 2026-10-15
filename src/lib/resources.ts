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
            title: "Čačky-hračky",
            by: "Krista Bendová, 1949",
            url: "https://www.martinus.sk/95539-cacky-hracky/kniha",
            note: {
              en: "Nursery rhymes written for children who can't read yet: very short and repetitive.",
              uk: "Віршики для дітей, які ще не вміють читати: дуже короткі й з повторами.",
              ru: "Стишки для детей, которые ещё не умеют читать: очень короткие и с повторами.",
              uz: "Hali oʻqishni bilmaydigan bolalar uchun yozilgan sheʼrchalar: juda qisqa, koʻp takrorlar bilan.",
              ka: "ლექსები ბავშვებისთვის, რომლებმაც ჯერ კითხვა არ იციან: ძალიან მოკლე და ბევრი გამეორებით.",
            },
          },
          {
            title: "Zajko Bojko",
            by: "Ľudmila Podjavorinská, 1930",
            url: "https://www.martinus.sk/34243-zajko-bojko/kniha",
            note: {
              en: "A fairy tale in verse: rhymes and repeated lines make it easy to follow aloud.",
              uk: "Казка у віршах: рими й повтори легко сприймати на слух.",
              ru: "Сказка в стихах: рифмы и повторы легко воспринимать на слух.",
              uz: "Sheʼriy ertak: qofiyalar va takrorlanuvchi satrlar tufayli ovoz chiqarib oʻqilganda oson tushuniladi.",
              ka: "ლექსად დაწერილი ზღაპარი: რითმებისა და განმეორებადი სტრიქონების წყალობით ხმამაღლა კითხვისას ადვილად აღიქმება.",
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
              uz: "Hayvonlar haqida juda qisqa hikoya: voqealarni asosan rasmlar soʻzlab beradi.",
              ka: "ძალიან მოკლე მოთხრობა ცხოველებზე: ამბავს ძირითადად სურათები გადმოსცემს.",
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
              uz: "Egizak qizlar haqida aniq, kundalik nasrda yozilgan hikoyalar; har birini bir yoʻla oʻqib chiqish mumkin.",
              ka: "მოთხრობები ტყუპ გოგონებზე, მკაფიო, ყოველდღიური პროზით; თითოეული ერთ ჯერზე იკითხება.",
            },
          },
        ],
      },
      {
        level: "A2",
        items: [
          {
            title: "Maťko a Kubko",
            by: "Marianna Grznárová, 1977",
            url: "https://www.martinus.sk/106351-matko-a-kubko/kniha",
            note: {
              en: "Tiny episodes about two shepherd boys, from the cartoon Pásli ovce valasi. Expect old-fashioned shepherd words.",
              uk: "Крихітні епізоди про двох хлопчиків-пастушків, за мультфільмом Pásli ovce valasi. Тут багато старовинних пастуших слів.",
              ru: "Крошечные эпизоды о двух мальчиках-пастушках, по мультфильму Pásli ovce valasi. Здесь много старинных пастушьих слов.",
              uz: "Ikki choʻpon bola haqida kichik epizodlar, Pásli ovce valasi multfilmi asosida. Eskicha choʻponlik soʻzlari koʻp uchraydi.",
              ka: "პატარა ეპიზოდები ორ მწყემს ბიჭზე, მულტფილმის Pásli ovce valasi მიხედვით. აქ ბევრი ძველებური მწყემსური სიტყვაა.",
            },
          },
          {
            title: "Osmijankove rozprávky",
            by: "Krista Bendová, 1967–1969",
            url: "https://www.martinus.sk/53729-osmijankove-rozpravky/kniha",
            note: {
              en: "Very short fairy tales, full of playful wordplay.",
              uk: "Дуже короткі казки, сповнені гри слів.",
              ru: "Очень короткие сказки, полные игры слов.",
              uz: "Juda qisqa ertaklar, quvnoq soʻz oʻyinlariga boy.",
              ka: "ძალიან მოკლე ზღაპრები, სავსე მხიარული სიტყვათა თამაშით.",
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
              uz: "Bratislavalik oiladagi uch aka-uka haqida kulgili qissa: kundalik uy-roʻzgʻorga oid soʻzlar.",
              ka: "სახალისო რომანი ბრატისლაველი ოჯახის სამ ძმაზე: ყოველდღიური საოჯახო ლექსიკა.",
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
              uz: "Slovakiyaning mumtoz xalq ertaklari zamonaviy tilda. Asl matnlar eskirgan tilda yozilgan, shuning uchun qayta bayon qilinganidan boshlang.",
              ka: "სლოვაკეთის კლასიკური ხალხური ზღაპრები თანამედროვე ენაზე. ორიგინალები არქაულია, ამიტომ დაიწყეთ გადმოთხრობილი ვერსიით.",
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
              uz: "Voqealari shaharda kechadigan zamonaviy rasmli kitob, shu nomli multfilmga qoʻshimcha sifatida.",
              ka: "თანამედროვე სურათებიანი წიგნი, რომლის მოქმედება ქალაქში ხდება; ამავე სახელწოდების მულტფილმის თანმხლები.",
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
              uz: "14 yoshli qiz tilidan hikoya qilingan oʻsmirlar qissasi, yoshlarning kundalik tilida.",
              ka: "საყმაწვილო რომანი, მოთხრობილი 14 წლის გოგონას სახელით, მოზარდების ყოველდღიური ენით.",
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
              uz: "Togʻ kulbasida boʻlib oʻtadigan sarguzasht qissa, syujeti oddiy.",
              ka: "სათავგადასავლო რომანი მთის ქოხში, მარტივი სიუჟეტით.",
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
              uz: "Oson syujet va koʻplab soʻz oʻyinlari: soʻz boyligingizni kengaytirish uchun yaxshi.",
              ka: "მარტივი სიუჟეტი და ბევრი სიტყვათა თამაში: კარგად გაგიმდიდრებთ ლექსიკას.",
            },
          },
          {
            title: "Websterovci",
            by: "Katarína Kerekesová, Vanda Rozenbergová, 2017",
            url: "https://www.martinus.sk/909241-websterovci/kniha",
            note: {
              en: "The illustrated book of the spider-family cartoon, for ages 8 and up.",
              uk: "Ілюстрована книжка за мультфільмом про родину павучків, для дітей від 8 років.",
              ru: "Иллюстрированная книга по мультфильму о семье паучков, для детей от 8 лет.",
              uz: "Oʻrgimchaklar oilasi haqidagi multfilm asosidagi rasmli kitob, 8 yoshdan boshlab.",
              ka: "ილუსტრირებული წიგნი ობობების ოჯახზე შექმნილი მულტფილმის მიხედვით, 8 წლიდან.",
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
              uz: "Klassiklar orasida eng oson oʻqiladigan yozuvchining hikoyalari, garchi leksikasi XIX asrga oid boʻlsa ham.",
              ka: "კლასიკოსთა შორის ყველაზე ადვილად საკითხავი ავტორის მოთხრობები, თუმცა ლექსიკა XIX საუკუნისაა.",
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
              uz: "Sodda nasrda yozilgan zamonaviy roman; Yevropa Ittifoqi adabiyot mukofoti laureati.",
              ka: "თანამედროვე რომანი მარტივი პროზით; ევროკავშირის ლიტერატურული პრემიის ლაურეატი.",
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
              uz: "Qoʻldan qoʻymay oʻqiladigan mistik triller, zamonaviy soʻzlashuv slovak tilida.",
              ka: "დაძაბული მისტიკური თრილერი თანამედროვე სასაუბრო სლოვაკურ ენაზე.",
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
              uz: "Qisqa satirik roman; hikoyachining chalkash nutqi hazilning bir qismi.",
              ka: "მოკლე სატირული რომანი; მთხრობელის არეული მეტყველება ხუმრობის ნაწილია.",
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
            by: "Mária Podhradská and Richard Čanaky, since 2002",
            url: "https://www.youtube.com/@Spievankovo",
            note: {
              en: "Children's songs with lots of repetition and clear pronunciation.",
              uk: "Дитячі пісні з багатьма повторами й чіткою вимовою.",
              ru: "Детские песни с множеством повторов и чётким произношением.",
              uz: "Koʻp takrorli va aniq talaffuzli bolalar qoʻshiqlari.",
              ka: "საბავშვო სიმღერები ბევრი გამეორებით და მკაფიო გამოთქმით.",
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
              uz: "Tabiat haqida yetti daqiqalik sokin multfilmlar, uxlashdan oldin koʻrish uchun.",
              ka: "მშვიდი შვიდწუთიანი მულტფილმები ბუნებაზე, ძილის წინ საყურებლად.",
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
              uz: "Maktabgacha yoshdagi bolalar uchun koʻrsatuv: gnom «nega?» degan savollarga sekin va sodda javob beradi.",
              ka: "გადაცემა სკოლამდელი ასაკის ბავშვებისთვის: გნომი ნელა და მარტივად პასუხობს კითხვებს „რატომ?“.",
            },
          },
        ],
      },
      {
        level: "A2",
        items: [
          {
            title: "Pásli ovce valasi",
            by: "Ladislav Čapek, 1972",
            url: "https://www.martinus.sk/521023-pasli-ovce-valasi/film",
            note: {
              en: "The cartoon of Maťko a Kubko: one slow narrator, with some folk vocabulary.",
              uk: "Мультфільм про Maťko a Kubko: один неквапливий оповідач, трохи народної лексики.",
              ru: "Мультфильм о Maťko a Kubko: один неторопливый рассказчик, немного народной лексики.",
              uz: "Maťko a Kubko haqidagi multfilm: bitta shoshilmay soʻzlaydigan hikoyachi, biroz xalq soʻzlari.",
              ka: "Maťko a Kubko მულტფილმის სახით: ერთი აუჩქარებელი მთხრობელი და ცოტაოდენი ხალხური ლექსიკა.",
            },
          },
          {
            title: "Mimi a Líza",
            by: "Katarína Kerekesová, 2013",
            url: "https://www.martinus.sk/610971-mimi-a-liza-kolekcia-kniha-dvd/kniha",
            note: {
              en: "Modern everyday Slovak in ten-minute episodes. Check the audio: Czech-dubbed versions exist.",
              uk: "Сучасна повсякденна словацька в десятихвилинних серіях. Перевірте звук: існує чеський дубляж.",
              ru: "Современный повседневный словацкий в десятиминутных сериях. Проверьте звук: есть чешский дубляж.",
              uz: "Oʻn daqiqalik qismlarda zamonaviy kundalik slovak tili. Ovozni tekshiring: chex tilidagi dublyaji ham bor.",
              ka: "თანამედროვე ყოველდღიური სლოვაკური ათწუთიან ეპიზოდებში. შეამოწმეთ ხმა: არსებობს ჩეხურად გახმოვანებული ვერსიებიც.",
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
              uz: "Kundalik vaziyatlardagi ikki kichkina aka-uka, qogʻozdan qirqilgan shakllar animatsiyasida.",
              ka: "ორი პატარა ძმა ყოველდღიურ სიტუაციებში; ანიმაცია ქაღალდიდან ამოჭრილი ფიგურებით.",
            },
          },
          {
            title: "Websterovci",
            by: "Katarína Kerekesová, 2017",
            url: "https://www.justwatch.com/sk/film/websterovci-vo-filme",
            note: {
              en: "A family of spiders in short episodes full of family dialogue. The film is on HBO Max in Slovakia, or to buy on Apple TV.",
              uk: "Родина павучків у коротких серіях із сімейними діалогами. Фільм є на HBO Max у Словаччині, або його можна купити на Apple TV.",
              ru: "Семья паучков в коротких сериях с семейными диалогами. Фильм есть на HBO Max в Словакии, или его можно купить на Apple TV.",
              uz: "Qisqa qismlarda oʻrgimchaklar oilasi, oilaviy dialoglarga boy. Film Slovakiyada HBO Max xizmatida bor yoki uni Apple TV orqali sotib olish mumkin.",
              ka: "ობობების ოჯახი მოკლე ეპიზოდებში, სავსე ოჯახური დიალოგებით. ფილმი სლოვაკეთში HBO Max-ზეა, ან შეგიძლიათ იყიდოთ Apple TV-ზე.",
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
              uz: "Tanish syujetli ertak-film; Slovakiya televideniyesi uni har yili Rojdestvoda koʻrsatadi.",
              ka: "ფილმი-ზღაპარი ნაცნობი სიუჟეტით, რომელსაც სლოვაკური ტელევიზია ყოველ შობას აჩვენებს.",
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
              uz: "Nega tuz oltindan qimmatroq ekani haqida ertak, aniq va bir maromli nutq bilan.",
              ka: "ზღაპარი იმაზე, თუ რატომ ღირს მარილი ოქროზე მეტი; მკაფიო, აუჩქარებელი მეტყველებით.",
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
              uz: "Dobšinský ertagi ekranda, sodda dialoglar bilan; institutning ertaklar DVD toʻplamiga kiradi.",
              ka: "დობშინსკის ზღაპრის ეკრანიზაცია მარტივი დიალოგებით; შედის ინსტიტუტის ზღაპრების DVD-კრებულში.",
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
              uz: "Qishloqda boʻlib oʻtadigan bolalar ilmiy-fantastik seriali, bolalar dialoglari koʻp.",
              ka: "საბავშვო სამეცნიერო-ფანტასტიკური სერიალი, რომლის მოქმედება სოფელში ხდება, ბევრი ბავშვური დიალოგით.",
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
              uz: "«Oskar» mukofotini olgan urush davri dramasi; dialoglarning bir qismi idish tilida.",
              ka: "„ოსკარით“ დაჯილდოებული ომის დროინდელი დრამა; დიალოგების ნაწილი იდიშზეა.",
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
              uz: "Slovak «yangi toʻlqin» kinosining muhim asari: sheʼriy, ishoralarga boy dialoglar.",
              ka: "სლოვაკური „ახალი ტალღის“ საეტაპო ფილმი პოეტური, ბოლომდე უთქმელი დიალოგებით.",
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
              uz: "Ota-onalar majlisi atrofida qurilgan drama: kattalarning zich va hayotiy suhbati.",
              ka: "დრამა მშობელთა კრების ირგვლივ: ინტენსიური, რეალისტური საუბრები ზრდასრულებს შორის.",
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
              uz: "Slovakiya–Ukraina chegarasidagi kontrabanda haqida triller, slovak va ukrain tillarida.",
              ka: "თრილერი კონტრაბანდაზე სლოვაკეთ-უკრაინის საზღვარზე, სლოვაკურ და უკრაინულ ენებზე.",
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
          uz: "Slovak tili bilan ingliz, rus, nemis, fransuz, venger, ispan va italyan tillari oʻrtasidagi tarjima lugʻatlari.",
          ka: "ორენოვანი ლექსიკონები: სლოვაკურიდან ინგლისურ, რუსულ, გერმანულ, ფრანგულ, უნგრულ, ესპანურ და იტალიურ ენებზე და პირიქით.",
        },
      },
      {
        name: "Slovenské slovníky (JULS SAV)",
        url: "https://slovnik.juls.savba.sk/",
        description: {
          en: "The Slovak Academy of Sciences' dictionary portal: meanings, spelling and forms of Slovak words, explained in Slovak.",
          uk: "Словниковий портал Словацької академії наук: значення, правопис і форми словацьких слів, пояснення словацькою.",
          ru: "Словарный портал Словацкой академии наук: значения, правописание и формы словацких слов, объяснения на словацком.",
          uz: "Slovakiya Fanlar akademiyasining lugʻat portali: slovakcha soʻzlarning maʼnosi, imlosi va shakllari, slovak tilida izohlangan.",
          ka: "სლოვაკეთის მეცნიერებათა აკადემიის ლექსიკონების პორტალი: სლოვაკური სიტყვების მნიშვნელობა, მართლწერა და ფორმები, ახსნილი სლოვაკურად.",
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
          uz: "Slovakiya jamoat radiosi jonli efirda: kundalik slovak tilidagi yangiliklar va suhbatlar.",
          ka: "სლოვაკეთის საზოგადოებრივი რადიო პირდაპირ ეთერში: ახალი ამბები და საუბრები ყოველდღიურ სლოვაკურ ენაზე.",
        },
      },
      {
        name: "Forvo",
        url: "https://forvo.com/languages/sk/",
        description: {
          en: "Slovak words and names pronounced by native speakers.",
          uk: "Словацькі слова й імена у вимові носіїв мови.",
          ru: "Словацкие слова и имена в произношении носителей языка.",
          uz: "Ona tili egalari talaffuz qilgan slovakcha soʻzlar va ismlar.",
          ka: "სლოვაკური სიტყვები და სახელები მშობლიური ენის მატარებლების გამოთქმით.",
        },
      },
    ],
  },
];
