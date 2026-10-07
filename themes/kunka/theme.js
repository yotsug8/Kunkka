// Тема «Кунка: Виноградный Шторм» — всё, что относится к персонажу и сеттингу:
// названия, тексты, реплики, звания, картинки, иконки и музыка.
// Механика игры в js/game.js от темы не зависит. Новая тема — копия этой папки
// со своими файлами и текстами; как переключить — см. README («Своя тема»).
// Пути к файлам — относительно папки темы.
window.THEME = {
  // ---- названия ----
  title: 'Кунка',                          // крупно в меню и на карточке результата
  subtitle: 'Виноградный Шторм',
  fullTitle: 'Кунка: Виноградный Шторм',   // заголовок вкладки, «Поделиться», установленное приложение
  shortName: 'Кунка',                      // подпись под иконкой на телефоне (до 12 символов)
  description: 'Мобильная аркада про адмирала Кунку: корми его фиолетовым виноградом и дави кислый зелёный, пока он не задохнулся.',
  shareDescription: 'Корми Кунку фиолетовым виноградом и дави зелёный.',
  tagline: 'Фиолетовый в рот, зелёный дави',   // под заголовком в меню
  themeColor: '#c79b42',                   // цвет панели браузера
  backgroundColor: '#160c04',              // фон заставки установленного приложения

  // ---- картинки ----
  images: {
    portrait: 'img/kunka.jpg',             // персонаж в обычном состоянии
    portraitOpen: 'img/kunka_open.jpg',    // ест или задыхается
    portraitChoke: 'img/kunka_choke.jpg',  // сцена проигрыша
    good: 'img/grapes.png',                // съедобное — тащить в рот
    bad: 'img/grapes_green.png',           // опасное — давить
    gold: 'img/grapes_gold.png',           // редкое, +50
    volatile: 'img/grapes_volatile.png',   // перезревший (взрывной): проступает поверх опасного; без картинки — перекраска
    bonus: 'img/rum.png',                  // бонус: убирает опасное, включает ×2
    background: 'img/sea_bg.jpg',
    menuBackground: 'img/menu_wood.jpg',   // доски за меню и доска главной кнопки — их подключает theme.css
    menuButton: 'img/button_plank.jpg',
    ghostShip: 'img/ghost_ship.webp',      // ульта: корабль-призрак проплывает по морю (без картинки ульты нет)
    ultIcon: 'img/ult_icon.jpg',           // кнопка ульты
    countdown: ['img/cd_1.png', 'img/cd_2.png', 'img/cd_3.png']   // цифры 1, 2, 3
  },
  icons: {
    ico: 'icons/favicon.ico',
    favicon: 'icons/favicon.png',
    icon192: 'icons/icon-192.png',
    icon512: 'icons/icon-512.png'          // и для превью ссылки в мессенджерах
  },
  music: 'audio/music.mp3',
  sounds: {
    touch: 'audio/touch.mp3'               // вместе с репликой touchLine, если много раз тыкать в персонажа (необязательно)
  },

  // ---- лицо персонажа: доли ширины (x, r) и высоты (y) портрета ----
  face: {
    mouthX: 0.5,     // центр рта по горизонтали
    mouthY: 0.52,    // центр рта по вертикали
    mouthR: 0.30,    // радиус «попадания в рот»
    bubbleY: 0.13,   // где показывать реплики (лоб)
    tapZone: 0.6     // верхняя часть портрета, где считаются тапы по лицу (пасхалка touchLine)
  },

  // ---- цвета эффектов под картинки темы ----
  colors: {
    good: '#c77bf0',       // брызги съедобного
    goodText: '#d9b3f0',   // «+10»
    goodDark: '#7d2bb0',   // запасной кружок, если картинка не загрузилась
    bad: '#7ee84a',        // брызги опасного
    badHit: '#5fd83f',     // брызги от тычка
    counter: '#8fd14a',    // счётчик опасных в углу
    gold: '#ffd24a',
    bonus: '#d8a04a',
    bonusDark: '#9c5f25',
    smoke: ['48,58,40', '30,37,26', '16,18,14'],   // дым при проигрыше: центр, середина, край (r,g,b)
    smokeEgg: ['70,20,90', '45,12,60', '20,8,28'], // то же в пасхалке
    eggFilter: 'hue-rotate(100deg) saturate(2)',   // как перекрашивается портрет в пасхалке (CSS filter)
    eggTitle: '#8fcf4f',   // заставка пасхалки: надпись,
    eggSub: '#5f9a31',     // строка под ней
    eggShade: ['#23400f', '#172b09'],  // и объёмная тень (ближняя, дальняя)
    kurazhBar: '#dcae52',  // полоска куража внизу экрана
    gripBar: '#aeb8c2',    // полоска «железной хватки» внизу экрана, брызги хруста
    gripText: '#e4ebf2',   // надписи «железной хватки»
    volatile: { hue: -38, saturate: 0.7, brightness: 0.6 },     // взрывной зелёный перед тем как лопнуть (перезревший оттенок)
    rare: { hue: 0, saturate: 0.12, brightness: 1.35, keepGreen: true }   // большая гроздь («железная хватка»): как перекрасить съедобное — сдвиг цвета в градусах, насыщенность, яркость; keepGreen — листья не трогать
  },

  // ---- шрифты: ссылка Google Fonts (или '' — без внешних шрифтов) и семейства ----
  fonts: {
    // свои шрифты лежат в теме — одинаковые на всех телефонах и работают без интернета (SIL OFL, fonts/OFL-*.txt).
    // Файлы поделены на русские и латинские буквы: браузер качает только нужные
    files: [
      { family: 'PT Serif', weight: 400, src: 'fonts/pt-serif-400-cyrillic.woff2', range: 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116' },
      { family: 'PT Serif', weight: 400, src: 'fonts/pt-serif-400-latin.woff2', range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
      { family: 'PT Serif', weight: 700, src: 'fonts/pt-serif-700-cyrillic.woff2', range: 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116' },
      { family: 'PT Serif', weight: 700, src: 'fonts/pt-serif-700-latin.woff2', range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
      { family: 'Yeseva One', weight: 400, src: 'fonts/yeseva-one-cyrillic.woff2', range: 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116' },
      { family: 'Yeseva One', weight: 400, src: 'fonts/yeseva-one-latin.woff2', range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' }
    ],
    licenses: ['fonts/OFL-pt-serif.txt', 'fonts/OFL-yeseva-one.txt'],
    title: '"PT Serif",Georgia,serif',            // заголовки меню
    text: '"PT Serif",Georgia,serif',             // кнопки и текст меню
    game: '"Yeseva One",Georgia,serif',           // надписи на поле и табло очков
    gameWeight: 400                               // у Yeseva одно начертание — жирное не подделываем
  },



  // ---- тексты экранов (можно HTML) ----
  text: {
    howto: [   // «Как играть»: картинка (ключ из images) и текст
      { img: 'good', html: '<b>Фиолетовый.</b> Тащи Кунке в рот или кидай взмахом. <span class="how-pt">+10</span>' },
      { img: 'gold', html: '<b>Золотой.</b> Попадается редко и быстро пропадает. <span class="how-pt">+50</span>' },
      { img: 'bad', html: '<b>Зелёный.</b> Кислый, его надо раздавить: тычь пальцем, пока не лопнет. Если на поле соберётся 4 зелёных, Кунка начнёт задыхаться.' },
      { img: 'bonus', html: '<b>Ром.</b> Тащи в рот. Убирает все зелёные и включает кураж: 6 секунд двойных очков. <span class="how-pt">+20</span>' },
      { img: 'portraitChoke', face: true, html: 'Чем дальше, тем быстрее, зелёный крепче, а времени меньше. В <b>хардкоре</b> так с самого начала.' }
    ],
    lose: 'Кунка задохнулся!',             // заголовок экрана результата
    leave: 'Кунка ушёл!',                  // очень редко персонаж сам уходит посреди партии (без этой строки — никогда)
    bonusBanner: 'КУРАЖ ×2',               // надпись при взятии бонуса
    eggTitle: 'Кислый<br>Кунка',           // пасхалка: 7 тапов по заголовку меню
    eggSub: 'найден',
    touchLine: 'А ну не трогай капитана!', // если много раз тыкать в персонажа
    holdButton: 'Каюта',                   // кнопка раздела статистики в меню
    holdTitle: 'Каюта капитана',
    logTitle: 'Судовой журнал',
    trophiesTitle: 'Трофеи',
    shareGood: 'винограда',                // «Уровень 5 · винограда 40» на карточке результата
    shareGold: 'золота',
    weather: { storm: 'Шторм' },  // баннер шторма
    combo: 'Серия',                // «Серия 5 +10» под ртом
    loot: 'Добыча',                // баннер события «добыча»
    grip: 'Железная хватка!',      // баннер при красной грозди
    // режим «Рогатка»: названия глав, отметки этапа, подсказки (без этого блока режима нет)
  },

  // реплики персонажа
  lines: {
    eat: ['Вкуснотища!', 'Ещё!', 'Добыча моя!', 'Отменно!', 'Сочно!', 'Давай ещё!', 'Отличный улов!'],
    gold: ['Золото!', 'Сокровище!', 'Богатеем!', 'В казну!'],
    squash: ['Кислятина!', 'Фу, гадость!', 'За борт его!', 'Прочь с палубы!'],
    miss: ['Мимо!', 'Куда целишься?', 'Руки кривые!', 'Я теряю терпение!', 'Это что было?'],
    bonus: ['РОМ! Наконец-то!', 'Ха-харр!', 'Вот это дело!'],
    danger: ['Душно!', 'Кхэ-кхэ!', 'Воздуха!'],
    storm: ['Качает!', 'Держи курс!', 'Шторм мне не помеха!'],
    loot: ['Налетай!', 'Вот это улов!', 'Всё в трюм!'],
    combo: ['Так держать!', 'Без остановки!', 'Ещё, ещё!'],
    level: ['Полный вперёд!', 'Прибавим ходу!', 'Живее!'],
    record: ['Новый рекорд!', 'Такого ещё не было!'],
    grip: ['Раздавлю!', 'Сила в руках!', 'Держись, кислятина!'],  // съел красную гроздь — «железная хватка»
    ship: ['Корабль-призрак!', 'На абордаж!', 'Полный вперёд, призраки!'],   // ульта
    calm: ['Фух, передохнём!', 'Отбились!', 'Дух перевести...'],   // передышка между волнами (с 8 уровня)
    leave: ['Всё, я на обед!', 'Надоело. Пойду вздремну.', 'Сами тут разбирайтесь!']   // перед тем как уйти
  },

  // звания по личному рекорду: 11 названий по возрастанию (пороги очков задаёт игра)
  ranks: ['Салага', 'Юнга', 'Матрос', 'Старший матрос', 'Боцман', 'Штурман', 'Старпом',
          'Капитан', 'Командор', 'Адмирал', 'Морской Волк'],

  // названия трофеев (условия задаёт игра)
  trophies: {
    first: 'Первый заплыв', games25: '25 заплывов', games100: '100 заплывов',
    p500: '500 фиолетовых', p2500: '2500 фиолетовых',
    g30: '30 золотых', g150: '150 золотых',
    green500: '500 раздавленных', rum30: '30 бутылок рома',
    score500: '500 очков', score1000: '1000 очков', score2000: '2000 очков',
    hard500: 'Хардкор: 500', hard1200: 'Хардкор: 1200', seawolf: 'Морской Волк'
  },

  // подписи судового журнала (статистика в разделе «Каюта»)
  log: {
    games: 'Заплывов', bestLevel: 'Лучший уровень', good: 'Фиолетовых', gold: 'Золотых',
    bad: 'Раздавлено', bonus: 'Выпито рома', best: 'Рекорд', bestHard: 'Хардкор'
  },

  // ---- английская версия: те же ключи, что выше; чего нет — останется по-русски ----
  i18n: {
    en: {
      title: 'Kunka',
      subtitle: 'Grape Storm',
      fullTitle: 'Kunka: Grape Storm',
      tagline: 'Feed him purple, squash the green',
      text: {
        howto: [
          { img: 'good', html: '<b>Purple.</b> Drag it into Kunka\'s mouth or flick it at him. <span class="how-pt">+10</span>' },
          { img: 'gold', html: '<b>Gold.</b> Rare, and vanishes fast. <span class="how-pt">+50</span>' },
          { img: 'bad', html: '<b>Green.</b> Sour - squash it: keep tapping until it pops. If 4 greens pile up, Kunka starts choking.' },
          { img: 'bonus', html: '<b>Rum.</b> Drag it into his mouth. Clears all greens and gives swagger: 6 seconds of double points. <span class="how-pt">+20</span>' },
          { img: 'portraitChoke', face: true, html: 'The further you go, the faster it gets, greens get tougher and time gets shorter. <b>Hardcore</b> is like that from the start.' }
        ],
        lose: 'Kunka choked!',
        leave: 'Kunka left!',
        bonusBanner: 'SWAGGER ×2',
        eggTitle: 'Sour<br>Kunka',
        eggSub: 'found',
        touchLine: 'Hands off the captain!',
        holdButton: 'Cabin',
        holdTitle: 'Captain\'s Cabin',
        logTitle: 'Ship\'s Log',
        trophiesTitle: 'Trophies',
        shareGood: 'grapes',
        shareGold: 'gold',
        weather: { storm: 'Storm' },
        combo: 'Streak',
        loot: 'Plunder',
        grip: 'Iron grip!',
      },
      lines: {
        eat: ['Delicious!', 'More!', 'Mine!', 'Splendid!', 'Juicy!', 'Keep \'em coming!', 'Fine catch!'],
        gold: ['Gold!', 'Treasure!', 'We\'re rich!', 'To the treasury!'],
        squash: ['Sour!', 'Yuck!', 'Overboard!', 'Off my deck!'],
        miss: ['Missed!', 'Aim, sailor!', 'Butterfingers!', 'I\'m losing patience!', 'What was that?'],
        bonus: ['RUM! At last!', 'Yo-ho-ho!', 'Now we\'re talking!'],
        danger: ['Can\'t breathe!', '*Cough, cough*', 'Air!'],
        storm: ['Rough seas!', 'Hold the course!', 'No storm can stop me!'],
        loot: ['Dig in!', 'What a haul!', 'All into the hold!'],
        combo: ['Steady as she goes!', 'Don\'t stop!', 'More, more!'],
        level: ['Full speed ahead!', 'Pick up the pace!', 'Look lively!'],
        record: ['New record!', 'Never been better!'],
        grip: ['I\'ll crush you!', 'Iron fists!', 'Brace yourself, sourpuss!'],
        ship: ['Ghost ship!', 'Board them!', 'Full sail, ghosts!'],
        calm: ['Phew, a breather!', 'We held them off!', 'Catch your breath...'],
        leave: ['I\'m off to lunch!', 'Enough. Time for a nap.', 'Sort it out yourselves!']
      },
      ranks: ['Landlubber', 'Cabin Boy', 'Sailor', 'Able Seaman', 'Boatswain', 'Navigator', 'First Mate',
              'Captain', 'Commodore', 'Admiral', 'Sea Wolf'],
      trophies: {
        first: 'First voyage', games25: '25 voyages', games100: '100 voyages',
        p500: '500 purple', p2500: '2500 purple',
        g30: '30 gold', g150: '150 gold',
        green500: '500 squashed', rum30: '30 bottles of rum',
        score500: '500 points', score1000: '1000 points', score2000: '2000 points',
        hard500: 'Hardcore: 500', hard1200: 'Hardcore: 1200', seawolf: 'Sea Wolf'
      },
      log: {
        games: 'Voyages', bestLevel: 'Best level', good: 'Purple', gold: 'Gold',
        bad: 'Squashed', bonus: 'Rum drunk', best: 'Best', bestHard: 'Hardcore'
      }
    }
  }
};
