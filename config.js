// Настройки сборки игры. После правки выполнить `npm run apply` — он обновит
// index.html, manifest.json и sw.js (заголовки, иконки, версию, список файлов для офлайна).
window.CONFIG = {
  theme: 'kunka',                                   // папка в themes/
  version: '1.31.1',                                // поднимать при каждом выпуске
  author: 'Admiral8Dota',                           // подпись в настройках и строка авторских прав
  year: '2026',                                     // год для строки авторских прав
  storageKey: 'kunkka',                             // префикс сохранений в браузере (рекорд, статистика, настройки);
                                                    // при смене прогресс игроков начнётся с нуля
  siteUrl: 'https://yotsug8.github.io/Kunkka/',     // адрес игры: «Поделиться» и превью ссылки
  quest: false,                                     // режим «Поход» (этапы с целью): пока скрыт, переделывается
  // таблица рекордов (Supabase): адрес проекта и публичный ключ; схема — supabase/leaderboard.sql
  supabase: {
    url: 'https://fjhqekpgeiucfszmaylv.supabase.co',
    key: 'sb_publishable_5G8k1X2brW7fMvhaX4aIVw_WiEWGLgA'
  },
  // пуш-уведомления о приглашениях: публичный ключ VAPID (подписка браузера);
  // отправляет push/ (Vercel), игра зовёт её через базу — push_invite в supabase/leaderboard.sql
  push: {
    key: 'BMiEnZPinzcWidIE4pD5d29o2JWW03OAS3Eorg1Te4OacNbhjjlkSSWMjODrU3NiQW7lZxVav93VF9cNQlZxZ7E'
  }
};
