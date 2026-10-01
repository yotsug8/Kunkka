// © 2026 Admiral8Dota. Все права защищены — см. LICENSE.
(function(){   // всё внутри: без глобальных переменных
if('serviceWorker' in navigator){
  window.addEventListener('load',function(){
    navigator.serviceWorker.register('./sw.js').catch(function(){});
  });
  // Перезагружать страницу при смене service worker не нужно: sw.js отдаёт страницу, стили и скрипты
  // сначала из сети, так что открытая страница уже свежая. Перезагрузка могла бы оборвать
  // сцену смерти или экран результатов с несохранённым рекордом.
}
// Android в браузере: вместо установки веб-приложения — ссылка на APK. В самом приложении
// (оно открывает игру с ?app=android и дописывает KunkkaApp к userAgent) и в установленном веб-приложении ссылки нет.
var apkMode=(function(){
  try{ if(/[?&]app=android\b/.test(location.search)) sessionStorage.setItem('kunkka_app','1'); }catch(e){}
  var inApp=false; try{ inApp=sessionStorage.getItem('kunkka_app')==='1'; }catch(e){}
  if(inApp || /KunkkaApp/.test(navigator.userAgent)) return false;
  var standalone=window.matchMedia && matchMedia('(display-mode: standalone)').matches;
  var on=/Android/i.test(navigator.userAgent) && !standalone;
  var a=document.getElementById('apkBtn'); if(a && on) a.style.display='flex';
  return on;
})();
(function(){
  var _prompt=null;
  var btn=document.getElementById('installBtn');
  window.addEventListener('beforeinstallprompt',function(e){
    e.preventDefault();
    _prompt=e;
    if(btn && !apkMode)btn.style.display='flex';
  });
  window.addEventListener('appinstalled',function(){
    _prompt=null;
    if(btn)btn.style.display='none';
  });
  if(btn)btn.addEventListener('click',function(){
    if(!_prompt)return;
    _prompt.prompt();
    _prompt.userChoice.then(function(){_prompt=null;btn.style.display='none';});
  });
})();
})();
