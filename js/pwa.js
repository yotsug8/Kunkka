// © 2026 Admiral8Dota. Все права защищены — см. LICENSE.
if('serviceWorker' in navigator){
  window.addEventListener('load',function(){
    navigator.serviceWorker.register('./sw.js').catch(function(){});
  });
  // Перезагружать страницу при смене service worker не нужно: sw.js отдаёт страницу, стили и скрипты
  // сначала из сети, так что открытая страница уже свежая. Перезагрузка могла бы оборвать
  // сцену смерти или экран результатов с несохранённым рекордом.
}
(function(){
  var _prompt=null;
  var btn=document.getElementById('installBtn');
  window.addEventListener('beforeinstallprompt',function(e){
    e.preventDefault();
    _prompt=e;
    if(btn)btn.style.display='block';
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
