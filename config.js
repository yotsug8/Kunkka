// Настройки сборки игры. После правки выполнить `npm run apply` — он обновит
// index.html, manifest.json и sw.js (заголовки, иконки, версию, список файлов для офлайна).
window.CONFIG = {
  theme: 'kunka',                                   // папка в themes/
  version: '1.14.0',                                // поднимать при каждом выпуске
  author: 'Admiral8Dota',                           // подпись в настройках и строка авторских прав
  year: '2026',                                     // год для строки авторских прав
  storageKey: 'kunkka',                             // префикс сохранений в браузере (рекорд, статистика, настройки);
                                                    // при смене прогресс игроков начнётся с нуля
  siteUrl: 'https://yotsug8.github.io/Kunkka/',     // адрес игры: «Поделиться» и превью ссылки
  // таблица рекордов (Supabase): адрес проекта и публичный ключ; схема — supabase/leaderboard.sql
  supabase: {
    url: 'https://fjhqekpgeiucfszmaylv.supabase.co',
    key: 'sb_publishable_5G8k1X2brW7fMvhaX4aIVw_WiEWGLgA'
  }
};
