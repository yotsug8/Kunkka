// © 2026 Admiral8Dota. Все права защищены — см. LICENSE.
(function(){
  // попытка заблокировать ориентацию в портрет (срабатывает в установленном PWA/полноэкранном режиме)
  try{ if(screen.orientation&&screen.orientation.lock) screen.orientation.lock('portrait').catch(function(){}); }catch(e){}
  var menu=document.getElementById('menu'),game=document.getElementById('game'),
      over=document.getElementById('over'),bgm=document.getElementById('bgm'),
      cv=document.getElementById('cv'),ctx=cv.getContext('2d');

  // настройки (config.js) и тема (themes/<тема>/theme.js): персонаж, тексты и картинки
  var CFG=window.CONFIG, T=window.THEME;
  function themeFile(p){ return 'themes/'+CFG.theme+'/'+p; }
  // одна картинка на путь: всё грузится под экраном загрузки, режимы берут уже готовые — ничего не проявляется и не скачет
  var _img={};
  function themeImg(p){ if(_img[p]) return _img[p]; var i=new Image(); i.src=themeFile(p); return (_img[p]=i); }
  var COL=T.colors, FONT=T.fonts;
  // надписи на поле могут быть своим шрифтом (FONT.game); у него может быть только одно начертание
  var GAME_FONT=FONT.game||FONT.text, FW=FONT.gameWeight||900;
  var KEY=CFG.storageKey+'_';   // префикс сохранений в браузере

  // ---- язык: русский или английский ----
  // надписи интерфейса — здесь, тексты персонажа — в теме (T.i18n.en поверх русских)
  var UI={
    ru:{ play:'Играть', how:'Как играть', lb:'Рекорды', settings:'Настройки', back:'Назад', install:'Установить', apk:'Скачать для Android',
      normal:'Обычная', hard:'Хардкор', music:'Музыка', volume:'Громкость', sfx:'Звуки', vibro:'Вибрация', lang:'Язык', langBtn:'РУС',
      on:'ВКЛ', off:'ВЫКЛ', pauseBtn:'Пауза', ultBtn:'Ульта', score:'Очки:', level:'Уровень', pause:'ПАУЗА', pauseHint:'нажми, чтобы продолжить', toMenu:'В меню',
      again:'Ещё раз', submit:'Записать рекорд', name:'ТВОЁ ИМЯ', share:'Поделиться результатом', lbTitle:'Таблица рекордов',
      lbNormal:'Рекорды: обычная', lbHard:'Рекорды: хардкор', loading:'загрузка...', loadingBtn:'Загрузка...', noNet:'нет связи с сервером',
      empty:'пока пусто, будь первым', best:'Рекорд:', newBest:'НОВЫЙ РЕКОРД!', sending:'отправка...', noSession:'Партия была без связи',
      rejected:'Результат не принят', retry:'Не отправилось, ещё раз', nickHigher:'Под этим именем уже есть рекорд выше: ',
      updating:'обновляем...', copied:'Скопировано', copyFail:'Не удалось скопировать', trophy:'Трофей получен!',
      toRank:'до звания {r}: {n} очков', topRank:'высшее звание достигнуто', rotate:'Поверни телефон<br>вертикально',
      cardHard:' · ХАРДКОР', cardPoints:'ОЧКОВ',
      shareText:'{t}{m}\n{s} очков, {r}, уровень {l}', shareHard:', хардкор',
      duelMenu:'Онлайн-дуэль', roomCreate:'Создать комнату', roomsTitle:'Открытые комнаты', h2h:'Счёт встреч: {w}-{l}', onlineNow:'в сети: {n}', emoAgain:'Реванш?', roomQuick:'Быстрая игра', oppOutBanner:'{n} выбыл: {s} - обгони!', youLead:'Ты впереди!', roomsEmpty:'Пока пусто - создай свою', roomsWait:'ищем комнаты...',
      roomLabel:'Комната', roomInvite:'Позвать друга', invTitle:'Кто в сети', invNone:'Сейчас никого нет в сети', invSend:'Позвать', invSent:'Позван', invFrom:'{n} зовёт на дуэль', invAccept:'Принять', invDecline:'Отказаться', invDeclined:'{n} отказался', pushLbl:'Уведомления о дуэлях', invOffline:'Играли раньше', noName:'Игрок', roomStart:'Начать', rematch:'Реванш', rematchWait:'Ждём соперника...',
      you:'ты', host:'хозяин', waitOpp:'ждём соперника...', waitHost:'Ждём, когда хозяин начнёт',
      needName:'Введи имя', connecting:'Подключение...', noConn:'Не удалось подключиться',
      lostConn:'Связь с комнатой потеряна', roomFull:'В комнате уже двое', oppLeft:'Соперник вышел', oldVer:'У соперника другая версия игры - обновите страницу',
      duelWin:'Победа! {n} - {s}', oppForfeit:'{n} вышел из дуэли, победа за тобой', duelLose:'Поражение: {n} - {s}', duelDraw:'Ничья! {n} - {s}',
      oppLive:'{n} ещё играет: {s}', oppOut:'выбыл' },
    en:{ play:'Play', how:'How to play', lb:'Leaderboard', settings:'Settings', back:'Back', install:'Install', apk:'Get the Android app',
      normal:'Normal', hard:'Hardcore', music:'Music', volume:'Volume', sfx:'Sounds', vibro:'Vibration', lang:'Language', langBtn:'ENG',
      on:'ON', off:'OFF', pauseBtn:'Pause', ultBtn:'Ultimate', score:'Score:', level:'Level', pause:'PAUSE', pauseHint:'tap to continue', toMenu:'Menu',
      again:'Again', submit:'Save score', name:'YOUR NAME', share:'Share result', lbTitle:'Leaderboard',
      lbNormal:'Top scores: normal', lbHard:'Top scores: hardcore', loading:'loading...', loadingBtn:'Loading...', noNet:'no connection',
      empty:'empty so far, be the first', best:'Best:', newBest:'NEW RECORD!', sending:'sending...', noSession:'This game was offline',
      rejected:'Score not accepted', retry:'Failed, try again', nickHigher:'This name already has a higher score: ',
      updating:'updating...', copied:'Copied', copyFail:'Could not copy', trophy:'Trophy unlocked!',
      toRank:'{n} points to {r}', topRank:'highest rank reached', rotate:'Turn your phone<br>upright',
      cardHard:' · HARDCORE', cardPoints:'POINTS',
      shareText:'{t}{m}\n{s} points, {r}, level {l}', shareHard:', hardcore',
      duelMenu:'Online duel', roomCreate:'Create room', roomsTitle:'Open rooms', h2h:'Head-to-head: {w}-{l}', onlineNow:'online: {n}', emoAgain:'Rematch?', roomQuick:'Quick match', oppOutBanner:'{n} is out: {s} - beat it!', youLead:'You take the lead!', roomsEmpty:'Nothing yet - create your own', roomsWait:'looking for rooms...',
      roomLabel:'Room', roomInvite:'Invite a friend', invTitle:'Online now', invNone:'Nobody online right now', invSend:'Invite', invSent:'Invited', invFrom:'{n} invites you to a duel', invAccept:'Accept', invDecline:'Decline', invDeclined:'{n} declined', pushLbl:'Duel notifications', invOffline:'Played before', noName:'Player', roomStart:'Start', rematch:'Rematch', rematchWait:'Waiting for rival...',
      you:'you', host:'host', waitOpp:'waiting for a rival...', waitHost:'Waiting for the host to start',
      needName:'Enter your name', connecting:'Connecting...', noConn:'Could not connect',
      lostConn:'Lost connection to the room', roomFull:'The room is full', oppLeft:'Your rival left', oldVer:'Your rival has another game version - reload the page',
      duelWin:'Victory! {n} - {s}', oppForfeit:'{n} left the duel, you win', duelLose:'Defeat: {n} - {s}', duelDraw:'Draw! {n} - {s}',
      oppLive:'{n} is still playing: {s}', oppOut:'out' }
  };
  // сохранённый выбор, иначе — язык телефона; тема без английских текстов всегда на русском
  var HAS_EN=!!(T.i18n && T.i18n.en);
  var LANG=(function(){
    if(!HAS_EN) return 'ru';
    try{ var s=localStorage.getItem(KEY+'lang'); if(s==='ru'||s==='en') return s; }catch(e){}
    var ls=navigator.languages||[navigator.language||'ru'];
    for(var i=0;i<ls.length;i++) if(/^(ru|uk|be|kk)/i.test(ls[i]||'')) return 'ru';
    return 'en';
  })();
  function tr(k,v){ var s=(UI[LANG][k]!=null?UI[LANG][k]:UI.ru[k]); if(v) for(var p in v) s=s.split('{'+p+'}').join(v[p]); return s; }
  // английские тексты темы поверх русских (вложенные объекты — по ключам, массивы и строки — целиком)
  (function merge(dst,src){
    if(LANG!=='en') return;
    for(var k in src){ var v=src[k];
      if(v && typeof v==='object' && !Array.isArray(v) && dst[k] && typeof dst[k]==='object' && !Array.isArray(dst[k])) merge(dst[k],v);
      else dst[k]=v; }
  })(T, HAS_EN ? T.i18n.en : {});
  // страница собрана по-русски (tools/apply.js); на английском подставляем надписи при запуске
  (function applyLang(){
    var d=document; d.documentElement.lang=LANG;
    var row=d.getElementById('langRow'); if(row && !HAS_EN) row.style.display='none';
    if(LANG==='ru') return;
    d.title=T.fullTitle;
    var els=d.querySelectorAll('[data-ui]');
    for(var i=0;i<els.length;i++) els[i].innerHTML=tr(els[i].getAttribute('data-ui'));
    var ph=d.querySelectorAll('[data-ui-ph]');
    for(i=0;i<ph.length;i++) ph[i].placeholder=tr(ph[i].getAttribute('data-ui-ph'));
    var ar=d.querySelectorAll('[data-ui-aria]');
    for(i=0;i<ar.length;i++) ar[i].setAttribute('aria-label',tr(ar[i].getAttribute('data-ui-aria')));
    var ts=d.querySelectorAll('[data-t]'), txt={ menuTitle:T.title+'<span class="l2">'+T.subtitle+'</span>', tagline:T.tagline };
    for(i=0;i<ts.length;i++){ var k=ts[i].getAttribute('data-t'), v=txt[k]!=null?txt[k]:T.text[k]; if(typeof v==='string') ts[i].innerHTML=v; }
    var how=d.querySelectorAll('#howtoContent .how-tx');
    for(i=0;i<how.length && i<T.text.howto.length;i++) how[i].innerHTML=T.text.howto[i].html;
  })();
  var heroImg=themeImg(T.images.portrait);
  var heroOpenImg=themeImg(T.images.portraitOpen);
  var purpleImg=themeImg(T.images.good);
  var greenImg=themeImg(T.images.bad);
  var goldImg=themeImg(T.images.gold);
  var volImg=T.images.volatile?themeImg(T.images.volatile):null;
  var chokeImg=themeImg(T.images.portraitChoke);
  var rumImg=themeImg(T.images.bonus);
  var seaBg=themeImg(T.images.background);
  // картинка загрузилась и её можно рисовать: drawImage с незагрузившейся (broken) картинкой бросает исключение
  function ready(img){ return img.complete && img.naturalWidth>0; }

  var W,H;
  // холст рисуется в пикселях экрана (до ×1.5), чтобы на телефонах картинка была чёткой;
  // вся игра считает в CSS-пикселях W×H, масштаб задаёт трансформация контекста
  // ×1.5 заметно чётче обычного и почти не нагружает; если телефон всё же не тянет — см. watchFps
  var DPR=1, DPR_MAX=1.5;
  function resize(){
    DPR=Math.min(DPR_MAX, window.devicePixelRatio||1);
    W=window.innerWidth; H=window.innerHeight;
    cv.width=Math.round(W*DPR); cv.height=Math.round(H*DPR);   // заодно сбрасывает состояние контекста
    ctx.setTransform(DPR,0,0,DPR,0,0);
    layoutDock();
    // экран сузился (поворот, панель браузера) — виноград не должен остаться за краем, где его не достать
    var gs=(S&&S.grapes&&!rotated())?S.grapes:[];   // повёрнут — партия на паузе, после поворота назад поле прежнее
    for(var i=0;i<gs.length;i++){ var g=gs[i]; if(g.fly) continue; var q=clampPos(g.x,g.y,g.r); g.x=q[0]; g.y=q[1]; }
    // на паузе цикл стоит, а смена размера очистила холст — рисуем поле сразу, иначе под заставкой оно пустое
    if(paused) try{ draw(); }catch(e){}
  }
  window.addEventListener('resize',resize);resize();

  // ---- онлайн-таблица рекордов (Supabase) ----
  var SB_URL=CFG.supabase.url;
  var SB_KEY=CFG.supabase.key;
  var SB_HEADERS={
    'apikey':SB_KEY,
    'Authorization':'Bearer '+SB_KEY,
    'Content-Type':'application/json'
  };
  var lastSubmitted=false; // не дать записать один результат дважды

  // ник: буквы (латиница, кириллица с ё), цифры, пробел, _ и -, до 12 символов — так же проверяет сервер
  var NAME_BAD=/[^a-zA-Zа-яА-ЯёЁ0-9 _-]/g;
  function lbClean(s){ return String(s).replace(NAME_BAD,'').trim().slice(0,12); }

  // Результат принимает сервер (supabase/leaderboard.sql): в начале партии игра получает
  // id сессии, в конце отправляет очки вместе с ним, сервер проверяет их правдоподобность.
  var gameSession=null, sessionReq=0, sessionPending=null;
  function lbStartSession(){
    gameSession=null;
    var req=++sessionReq;   // опоздавший ответ на запрос прошлой партии игнорируем
    sessionPending=fetch(SB_URL+'/rest/v1/rpc/start_game',{method:'POST',headers:SB_HEADERS,body:'{}'})
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(id){ if(req===sessionReq && typeof id==='string') gameSession=id; })
      .catch(function(){});
  }
  // cb(ok, why, best): why='nosession' — партия началась без связи, 'rejected' — сервер отклонил результат;
  // в обоих случаях повтор не поможет, повторять имеет смысл только сетевую ошибку.
  // best — лучший результат этого ника в режиме (у ника одна запись, результат хуже её не меняет)
  function lbSubmit(name,score,mode,cb){
    // ответ на старт партии может быть ещё в пути — ждём его, но не дольше 8 секунд
    var wait=Promise.race([sessionPending||Promise.resolve(), new Promise(function(r){ setTimeout(r,8000); })]);
    wait.then(function(){
      if(!gameSession){ cb(false,'nosession'); return; }
      var sid=gameSession;
      fetch(SB_URL+'/rest/v1/rpc/submit_score',{
        method:'POST',
        headers:SB_HEADERS,
        body:JSON.stringify({p_session:sid,p_name:name,p_score:score,p_mode:mode})
      }).then(function(r){
        if(!r.ok){ cb(false, r.status>=400 && r.status<500 ? 'rejected' : null); return; }
        if(gameSession===sid) gameSession=null;   // сессию уже новой партии не трогаем
        r.text().then(function(t){ var b=parseInt(t,10); cb(true,null,isFinite(b)?b:null); },function(){ cb(true); });
      }).catch(function(){ cb(false); });
    });
  }
  // таблицу рисует только последний запрос: ответ или таймаут устаревшего запроса
  // (игрок уже ушёл с экрана или сменил режим) не должен затирать актуальную таблицу
  var boardReq=0;
  function lbLoad(cb){
    var done=false, req=++boardReq;
    var finish=function(v){ if(done)return; done=true; if(req===boardReq) cb(v); };
    // таймаут 8с: при зависшей сети показываем ошибку вместо вечной загрузки
    setTimeout(function(){ finish(null); }, 8000);
    fetch(SB_URL+'/rest/v1/rpc/leaderboard',{method:'POST',headers:SB_HEADERS,body:JSON.stringify({p_mode:difficulty})})
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){ finish(Array.isArray(d) ? d : null); })
      .catch(function(){ finish(null); });
  }
  function setBoardTitle(){
    var t=document.getElementById('boardTitle');
    if(t) t.textContent = (difficulty==='hard') ? tr('lbHard') : tr('lbNormal');
  }
  // имена приходят из базы, куда можно писать в обход игры, — только как текст, не как HTML
  function esc(v){
    return String(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
  }
  function boardRow(place,nm,sc,mine,apart){
    return '<div class="br'+(mine?' me':'')+(apart?' apart':'')+'"><span class="rk">'+esc(place)+'</span>'+
           '<span class="nm">'+esc(nm)+'</span><span class="sc">'+esc(sc)+'</span></div>';
  }
  // myName — имя игрока: его строка подсвечивается (у имени в таблице одна запись)
  function renderBoard(arr,myName){
    var box=document.getElementById('boardRows');
    if(arr===null){ box.innerHTML='<div class="bload">'+tr('noNet')+'</div>'; return false; }
    if(!arr.length){ box.innerHTML='<div class="bload">'+tr('empty')+'</div>'; return false; }
    var html='', found=false;
    for(var i=0;i<arr.length;i++){
      var nm=arr[i].name||'???', sc=(arr[i].score!=null?arr[i].score:0);
      var mine=!!myName && String(nm).toLowerCase()===myName.toLowerCase();
      if(mine) found=true;
      html+=boardRow(i+1,nm,sc,mine);
    }
    box.innerHTML=html;
    return !found;   // игрока нет в топе — можно показать его место
  }
  // таблица режима; если игрок ниже топ-10, под таблицей — его место
  function showBoard(myName){
    lbLoad(function(arr){
      if(!renderBoard(arr,myName) || !myName) return;
      var req=boardReq;
      fetch(SB_URL+'/rest/v1/rpc/player_place',{method:'POST',headers:SB_HEADERS,body:JSON.stringify({p_mode:difficulty,p_name:myName})})
        .then(function(r){ return r.ok ? r.json() : null; })
        .then(function(d){
          if(req!==boardReq || !Array.isArray(d) || !d.length) return;   // таблицу уже перерисовали или имени нет
          var p=d[0];
          document.getElementById('boardRows').insertAdjacentHTML('beforeend',
            boardRow(p.place,p.name,p.score,true,true));
        }).catch(function(){});
    });
  }
  function savedName(){ try{ return lbClean(localStorage.getItem(KEY+'name')||''); }catch(e){ return ''; } }

  // ---- звуки действий (синтез, без файлов) ----
  var AC=null, MASTER=null;
  function ac(){ if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();MASTER=AC.createGain();MASTER.gain.value=1.6;MASTER.connect(AC.destination);}catch(e){}} return AC; }
  // возобновить звук (iOS после звонка или сворачивания ставит 'interrupted'); отказ браузера не ошибка
  function acResume(){ try{ if(AC && AC.state!=='running'){ var r=AC.resume(); if(r&&r.catch) r.catch(function(){}); } }catch(e){} }
  // В приложении для Android музыка идёт через Web Audio: элемент <audio> там через несколько секунд
  // замолкает (плеер WebView), а звуки на Web Audio играют без сбоев. Снаружи — те же play/pause/volume, что у <audio>
  if(/KunkkaApp/.test(navigator.userAgent)) window.__music=bgm=webAudioMusic(bgm.getAttribute('src'));   // __music — для тестов
  function webAudioMusic(src){
    var buf=null, node=null, gain=null, startAt=0, offset=0, vol=1, muted=false, want=false, loading=null;
    function level(){ if(gain) gain.gain.value=muted?0:vol; }
    function load(){
      if(!loading) loading=fetch(src).then(function(r){ return r.arrayBuffer(); })
        .then(function(b){ return new Promise(function(ok,no){ ac().decodeAudioData(b,ok,no); }); })
        .then(function(d){ buf=d; if(want) start(); }, function(){ loading=null; want=false; });   // сторож музыки попробует снова
      return loading;
    }
    function start(){
      var a=ac(); if(!a || !buf || node) return;
      acResume();
      if(!gain){ gain=a.createGain(); gain.connect(a.destination); }
      level();
      node=a.createBufferSource(); node.buffer=buf; node.loop=true; node.connect(gain);
      offset%=buf.duration; startAt=a.currentTime-offset; node.start(0,offset);
    }
    function stop(){
      if(!node) return;
      offset=(AC.currentTime-startAt)%buf.duration;
      try{ node.stop(); }catch(e){} node.disconnect(); node=null;
    }
    return {
      webAudio:true,
      play:function(){ want=true; if(buf) start(); else load(); return Promise.resolve(); },
      pause:function(){ want=false; stop(); },
      get paused(){ return !want; },
      get volume(){ return vol; }, set volume(v){ vol=v; level(); },
      get muted(){ return muted; }, set muted(m){ muted=m; level(); },
      get currentTime(){ return node ? (AC.currentTime-startAt)%buf.duration : offset; },
      set currentTime(t){ var was=!!node; stop(); offset=t; if(was) start(); }
    };
  }
  // вне партии после 10 с тишины движок звука засыпает (иначе он тратит процессор впустую);
  // первый звук будит его и играет, как только тот проснулся — нажатие не остаётся беззвучным
  var _sleeping=false, _lastSnd=0, SLEEP_MS=10000;
  setInterval(function(){
    if(!AC || AC.state!=='running' || document.body.classList.contains('ingame')) return;
    if(bgm.webAudio && !bgm.paused) return;   // музыка приложения идёт через этот же движок — не усыплять
    if(Date.now()-_lastSnd<SLEEP_MS) return;
    try{ AC.suspend(); _sleeping=true; }catch(e){}
  },2000);
  // звук не играет, потому что движок не запущен: спит по нашей воле — будим, а звуки, пришедшие
  // за время пробуждения (у щелчка их два), играем, как только проснулся; иначе просто просим возобновить
  var _wakeQ=null;
  function notRunning(fn,args){
    if(!_sleeping && !_wakeQ){ acResume(); return; }
    if(!_wakeQ){
      _wakeQ=[]; _sleeping=false;
      try{ AC.resume().then(function(){ var q=_wakeQ; _wakeQ=null; for(var i=0;i<q.length;i++) q[i][0].apply(null,q[i][1]); },
                            function(){ _wakeQ=null; }); }catch(e){ _wakeQ=null; return; }
    }
    _wakeQ.push([fn,args]);
  }
  var _voices=0;   // счётчик активных звуков
  var MAX_VOICES=12;
  // пока аудио приостановлено, звуки не заканчиваются и счётчик голосов не освобождается —
  // такие звуки пропускаем, иначе после прерывания эффекты замолкли бы навсегда
  function tone(freq,dur,type,vol,slideTo,delay){
    if(!sfxOn)return;
    var a=ac(); if(!a)return;
    if(a.state!=='running'){ notRunning(tone,arguments); return; }
    if(_voices>=MAX_VOICES) return;   // не плодим звуки при спаме
    _lastSnd=Date.now();
    var t0=a.currentTime+(delay||0);
    var o=a.createOscillator(),g=a.createGain();
    o.type=type||'sine'; o.frequency.setValueAtTime(freq,t0);
    if(slideTo)o.frequency.exponentialRampToValueAtTime(slideTo,t0+dur);
    var v=vol||0.2;
    g.gain.setValueAtTime(0.0001,t0);
    g.gain.exponentialRampToValueAtTime(v,t0+0.008);
    g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
    o.connect(g);g.connect(MASTER); o.start(t0);o.stop(t0+dur+0.02);
    _voices++; o.onended=function(){ _voices--; };
  }
  function noiseBurst(dur,vol){
    if(!sfxOn)return;
    var a=ac(); if(!a)return;
    if(a.state!=='running'){ notRunning(noiseBurst,arguments); return; }
    if(_voices>=MAX_VOICES) return;
    _lastSnd=Date.now();
    var n=Math.floor(a.sampleRate*dur), buf=a.createBuffer(1,n,a.sampleRate), d=buf.getChannelData(0);
    for(var i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
    var s=a.createBufferSource();s.buffer=buf;
    var g=a.createGain();g.gain.value=vol||0.3;
    s.connect(g);g.connect(MASTER);s.start();
    _voices++; s.onended=function(){ _voices--; };
  }
  // короткий стук: шум через полосовой фильтр — звучит как дерево, частота f задаёт «породу»
  function knock(f,q,dur,vol){
    if(!sfxOn)return;
    var a=ac(); if(!a)return;
    if(a.state!=='running'){ notRunning(knock,arguments); return; }
    if(_voices>=MAX_VOICES) return;
    _lastSnd=Date.now();
    var n=Math.floor(a.sampleRate*dur), buf=a.createBuffer(1,n,a.sampleRate), d=buf.getChannelData(0);
    for(var i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.exp(-9.2*i/n);
    var s=a.createBufferSource();s.buffer=buf;
    var bp=a.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f;bp.Q.value=q;
    var g=a.createGain();g.gain.value=vol;
    s.connect(bp);bp.connect(g);g.connect(MASTER);s.start();
    _voices++; s.onended=function(){ _voices--; };
  }
  // низкий гул: шум через фильтр нижних частот — рёв волны под кораблём
  function rumble(dur,vol,freq){
    if(!sfxOn)return;
    var a=ac(); if(!a)return;
    if(a.state!=='running'){ notRunning(rumble,arguments); return; }
    if(_voices>=MAX_VOICES) return;
    _lastSnd=Date.now();
    var n=Math.floor(a.sampleRate*dur), buf=a.createBuffer(1,n,a.sampleRate), d=buf.getChannelData(0);
    for(var i=0;i<n;i++){ var t=i/n; d[i]=(Math.random()*2-1)*Math.min(1,t*6)*Math.pow(1-t,1.5); }   // нарастает и долго стихает
    var s=a.createBufferSource();s.buffer=buf;
    var lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=freq||500;
    var g=a.createGain();g.gain.value=vol;
    s.connect(lp);lp.connect(g);g.connect(MASTER);s.start();
    _voices++; s.onended=function(){ _voices--; };
  }
  // ---- настройки звука ----
  var musicOn=true;
  var musicVol=0.7;   // громкость музыки 0..1
  try{ if(localStorage.getItem(KEY+'music')==='0')musicOn=false; }catch(e){}
  try{ var sv=localStorage.getItem(KEY+'musicvol'); if(sv!==null){ var pv=parseFloat(sv); if(!isNaN(pv)) musicVol=Math.max(0,Math.min(1,pv)); } }catch(e){}
  // звуковые эффекты и вибрация (отдельно от музыки)
  var sfxOn=true, vibroOn=true;
  var canVibrate=!!(navigator.vibrate);
  try{ if(localStorage.getItem(KEY+'sfx')==='0')sfxOn=false; }catch(e){}
  try{ if(localStorage.getItem(KEY+'vibro')==='0')vibroOn=false; }catch(e){}
  function buzz(pattern){
    if(!vibroOn||!canVibrate)return;
    try{ navigator.vibrate(pattern); }catch(e){}
  }
  function applyAudio(){
    try{ if(bgm){ bgm.muted=!musicOn; bgm.volume=musicVol; } }catch(e){}
  }
  applyAudio();   // сохранённые настройки звука действуют сразу, а не с первой партии

  var KNOCK_VOL=2.2;   // полосовой фильтр сильно гасит шум — громкость щелчка поднята, чтобы он был не тише прежнего
  var SFX={
    eat:function(){tone(300,0.14,'sine',0.5,650);}, // мягкий «блуп» вверх — заметный, не резкий
    squash:function(){noiseBurst(0.07,0.11);tone(150,0.08,'sine',0.18,70);}, // мягкий хлоп, выровнен по громкости
    crunch:function(){tone(180,0.12,'sine',0.45,45);noiseBurst(0.04,0.3);tone(90,0.18,'sine',0.25,40,0.02);},   // удар кулака: зелёный в «железную хватку»
    gold:function(){ // яркая золотая трель — запланирована по аудио-часам, громкая
      tone(784,0.10,'triangle',0.55,null,0);     // соль
      tone(1047,0.10,'triangle',0.55,null,0.09);  // до
      tone(1568,0.16,'triangle',0.50,null,0.18);  // соль октавой выше
    },
    warn:function(){tone(170,0.16,'sawtooth',0.14,110);},          // тревога при удушении
    rum:function(){ // довольный «гульп» вниз + звон
      tone(400,0.12,'sine',0.45,180);
      tone(620,0.14,'triangle',0.4,null,0.1);
    },
    combo:function(){ tone(660,0.08,'triangle',0.4,null,0); tone(990,0.12,'triangle',0.4,null,0.07); }, // серия
    ship:function(){   // корабль-призрак: рёв — два низких рога и тяжёлая волна
      tone(55,1.5,'sawtooth',0.24,46); tone(82,1.3,'sawtooth',0.15,68,0.06); tone(110,1.1,'sine',0.3,88,0.1);
      rumble(2.0,2.4,420); rumble(0.5,1.6,1600);
    },
    shipHit:function(){ tone(68,0.28,'sine',0.75,34); noiseBurst(0.09,0.4); knock(700,2.5,0.07,2.4); },   // корабль сносит гроздь — тяжёлый удар
    burst:function(){ noiseBurst(0.09,0.35); tone(120,0.16,'sine',0.5,50); },   // лопнул взрывной зелёный — влажный хлопок
    rush:function(){ tone(95,0.22,'sine',0.5,60); noiseBurst(0.05,0.12); },   // начало натиска — глухой удар барабана
    click:function(){ knock(1400,8,0.03,KNOCK_VOL); tone(380,0.035,'sine',0.2,320); } // сухой щелчок деревянной кнопки
  };
  // ---- звук корабля-призрака: рендерится один раз заранее (OfflineAudioContext) в готовый буфер.
  // В момент залпа ничего не считается на главном потоке, лимит голосов его не глушит,
  // а через свой лимитер он идёт на полную громкость без треска ----
  var _shipSnd=null, _shipHitSnd=null, _shipBus=null;
  function renderSnd(dur,drive,build,done){
    var a=ac(), OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext;
    if(!a || !OAC) return;
    try{
      var o=new OAC(1,Math.ceil(a.sampleRate*dur),a.sampleRate), fired=false;
      build(o);
      o.oncomplete=function(e){
        if(fired) return; fired=true;
        // пик к единице и мягкое «пережатие» (tanh): звук плотный и громкий, а не просто чуть громче
        var d=e.renderedBuffer.getChannelData(0), pk=0, i;
        for(i=0;i<d.length;i++){ var v=d[i]<0?-d[i]:d[i]; if(v>pk) pk=v; }
        var g=drive/(pk||1), n=0.97/Math.tanh(drive);
        for(i=0;i<d.length;i++) d[i]=Math.tanh(d[i]*g)*n;
        done(e.renderedBuffer);
      };
      o.startRendering();
    }catch(e){}
  }
  // генераторы для офлайн-рендера: тон со спадом частоты и шум через фильтр
  function oTone(o,f,dur,type,vol,slide,at,att){
    var t0=at||0, os=o.createOscillator(), g=o.createGain();
    os.type=type; os.frequency.setValueAtTime(f,t0); if(slide) os.frequency.exponentialRampToValueAtTime(slide,t0+dur);
    g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(vol,t0+(att||0.01)); g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
    os.connect(g); g.connect(o.destination); os.start(t0); os.stop(t0+dur+0.02);
  }
  function oNoise(o,dur,vol,ft,freq,q,at,rise,fall){
    var n=Math.floor(o.sampleRate*dur), b=o.createBuffer(1,n,o.sampleRate), d=b.getChannelData(0);
    for(var i=0;i<n;i++){ var t=i/n; d[i]=(Math.random()*2-1)*Math.min(1,t/(rise||0.002))*Math.pow(1-t,fall||1.6); }
    var s=o.createBufferSource(); s.buffer=b;
    var f=o.createBiquadFilter(); f.type=ft; f.frequency.value=freq; if(q) f.Q.value=q;
    var g=o.createGain(); g.gain.value=vol;
    s.connect(f); f.connect(g); g.connect(o.destination); s.start(at||0);
  }
  function prepShipSnd(){
    if(_shipSnd || !shipImg) return;
    _shipSnd='wait';
    renderSnd(2.6,2.6,function(o){
      oTone(o,62,0.9,'sine',1,26);                       // удар-«бум» в момент появления
      oNoise(o,0.35,1.2,'highpass',900,0);               // треск рассекаемого воздуха
      oTone(o,55,1.9,'sawtooth',0.5,44,0.02,0.06);       // два низких рога
      oTone(o,82,1.7,'sawtooth',0.32,66,0.08,0.08);
      oTone(o,110,1.4,'sine',0.5,86,0.1,0.05);
      oNoise(o,2.5,1.6,'lowpass',380,0,0,0.12,0.7);      // рёв волны под килем — держится весь проход
      oNoise(o,0.9,1.0,'lowpass',1500,0,0.05,0.05);      // гребень волны
    },function(b){ _shipSnd=b; });
    renderSnd(0.4,2.2,function(o){
      oTone(o,74,0.34,'sine',1,30);
      oNoise(o,0.12,0.8,'lowpass',2400,0);
      oNoise(o,0.09,1.4,'bandpass',650,2.5);
    },function(b){ _shipHitSnd=b; });
  }
  function playLoud(b,vol,rate){
    if(!sfxOn || !b || b==='wait') return false;
    var a=ac(); if(!a || a.state!=='running') return false;
    _lastSnd=Date.now();
    if(!_shipBus){   // лимитер: наложенные удары не хрипят, а упираются в потолок
      _shipBus=a.createDynamicsCompressor();
      _shipBus.threshold.value=-4; _shipBus.knee.value=4; _shipBus.ratio.value=20;
      _shipBus.attack.value=0.002; _shipBus.release.value=0.12;
      _shipBus.connect(a.destination);
    }
    var s=a.createBufferSource(); s.buffer=b; if(rate) s.playbackRate.value=rate;
    var g=a.createGain(); g.gain.value=vol; s.connect(g); g.connect(_shipBus); s.start();
    return true;
  }
  var warnSndT=0;
  // мягкий клик на всех кнопках интерфейса
  document.addEventListener('click',function(e){
    var t=e.target;
    if(t && t.tagName==='BUTTON'){ try{ ac(); SFX.click(); }catch(err){} }
  },true);

  var S={},best=0,newBest=false;
  var SESSION={purple:0,gold:0,green:0,rum:0,score:0,level:1};   // итоги текущей партии для карточки результата
  try{best=Math.max(0,parseInt(localStorage.getItem(KEY+'best')||'0',10)||0);}catch(e){best=0;}

  // ---- статистика (Каюта) ----
  var STATS={games:0,purple:0,gold:0,green:0,rum:0,bestLevel:1,bestHard:0};
  try{ var ss=localStorage.getItem(KEY+'stats'); if(ss){ var o=JSON.parse(ss); for(var k in STATS){ var v=Number(o&&o[k]); if(isFinite(v)&&v>=0) STATS[k]=Math.floor(v); } } }catch(e){}
  function saveStats(){ try{localStorage.setItem(KEY+'stats',JSON.stringify(STATS));}catch(e){} }


  // отслеживание открытых трофеев для уведомлений
  var unlockedTrophies={};
  try{ var ut=JSON.parse(localStorage.getItem(KEY+'trophies')||'{}'); if(ut && typeof ut==='object' && !Array.isArray(ut)) unlockedTrophies=ut; }catch(e){}
  function checkNewTrophies(){
    var newly=[];
    for(var i=0;i<TROPHIES.length;i++){
      var t=TROPHIES[i], on=t.test();
      if(on && !unlockedTrophies[t.id]){ unlockedTrophies[t.id]=1; newly.push(t.name); }
    }
    if(newly.length){
      try{localStorage.setItem(KEY+'trophies',JSON.stringify(unlockedTrophies));}catch(e){}
      toastQueue=toastQueue.concat(newly);
      if(!toastBusy) nextToast();
    }
  }
  // уведомления о трофеях — строго по одному: каждое показывается целиком, потом следующее
  var toastQueue=[], toastBusy=false;
  function nextToast(){
    var el=document.getElementById('trophyToast');
    if(!toastQueue.length){ toastBusy=false; return; }
    toastBusy=true;
    el.querySelector('.tt-name').textContent=toastQueue.shift();
    if(T.images.medal){ var ic=el.querySelector('.tt-medal'); if(ic && ic.tagName!=='IMG'){ var im=document.createElement('img'); im.className='tt-medal'; im.alt=''; im.src=themeFile(T.images.medal); ic.parentNode.replaceChild(im,ic); } }
    el.classList.add('show');
    setTimeout(function(){
      el.classList.remove('show');
      setTimeout(nextToast, 550);   // дать уехать предыдущему (transition .5s)
    }, 2600);
  }

  // ---- случайность партии: у каждой партии своё зерно. Дуэль передаёт его в ссылке, и у соперника
  // выпадают те же виноград и события (эффекты и реплики берут обычный Math.random — им совпадать не нужно) ----
  var gameSeed=0, _rs=0;
  function rnd(){   // mulberry32
    _rs=(_rs+0x6D2B79F5)|0; var t=Math.imul(_rs^(_rs>>>15),1|_rs);
    t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296;
  }
  var duel=null;   // идёт онлайн-дуэль: {seed, mode} (комната — room, ниже)
  // статистика, рекорды и трофеи — только за обычные партии: пасхалка и «Поход» в них не идут
  function statsOn(){ return !sourMode; }
  var gameNo=0;   // номер партии — чтобы запоздавшие ответы сервера не трогали следующую
  // «Кунка ушёл»: очень редко (раз в ~150 партий) капитану надоедает, и он посреди партии уходит
  var LEAVE_CHANCE=1/150, LEAVE_MIN=45000, LEAVE_SPAN=90000, LEAVE_SAY=1500;
  var endKind='';   // чем кончилась партия: '' — задохнулся, 'leave' — ушёл
  function rollLeave(){
    if(sourMode || !T.text.leave) return 0;
    if(CFG.leaveTest) return 1500;   // для тестов: уходит сразу
    if(duel) return 0;      // в дуэли капитан не уходит
    return rnd()<LEAVE_CHANCE ? LEAVE_MIN+rnd()*LEAVE_SPAN : 0;
  }
  function reset(){
    gameNo++;
    gameSeed=duel ? duel.seed : (Math.random()*4294967296)>>>0; _rs=gameSeed|0;
    paintOpp();
    _ending=false; endKind='';
    activeTouches={}; mouseDrag=null;    // пальцы/мышь, зажатые в прошлой партии, к новой не относятся
    _smokeSprite=null;
    document.getElementById('lives').style.color=sourMode?COL.good:COL.counter;
    SESSION={purple:0,gold:0,green:0,rum:0,score:0,level:1};
    S={mode:difficulty,score:0,level:1,grapes:[],spawnT:0,spawnGap:950*dk().spawn,
       last:0,shake:0,flash:0,wasFull:false,mouthOpen:0,running:true,floaters:[],
       particles:[],distress:0,goldT:0,rumT:0,goldPity:0,rumGrace:0,rumCD:0,greenDry:0,kurazh:0,grip:0,banner:null,bubble:null,_sayT:0,_sayHold:0,
       weather:null,weatherT:0,combo:0,comboT:0,loot:null,lootT:0,eaten:[],bannerQ:[],leaveT:rollLeave(),leaving:0,flung:[]};
    document.body.removeAttribute('data-weather'); document.body.removeAttribute('data-event');
    warnSndT=0;
    S.ult=CFG.ultTest?ULT_MAX:0; paintUlt();   // ultTest — для тестов: шкала сразу полная
    hideEdges();
    upd();
  }
  var _lastScore=0;
  function upd(){
    document.getElementById('sc').textContent=S.score;
    document.getElementById('lv').textContent=S.level;
    document.getElementById('gcount').textContent=greenCount();
    S._gcShown=null;   // update() перепишет счётчик на следующем кадре
    SESSION.score=S.score;
    SESSION.level=S.level;
    // побил свой рекорд прямо в партии — Кунка отмечает это один раз
    if(S.running && statsOn() && best>0 && S.score>best && !S.recordSaid){ S.recordSaid=true; say('record',true); }
    if(S.score>_lastScore){
      var sp=document.querySelector('.hud .score');
      if(sp){ sp.classList.remove('pulse'); void sp.offsetWidth; sp.classList.add('pulse'); }
    }
    _lastScore=S.score;
  }

  // заставка-баннер по центру (уровень / шторм)
  // надписи по центру не перебивают друг друга: если одна ещё видна, следующая ждёт своей очереди,
  // а текущая сокращается, чтобы очередь не затягивалась
  function banner(text,color,ms){
    var b={t:text,c:color||'#e8c061',life:ms||1300,max:ms||1300};
    if(S.banner && S.banner.life>250){
      if(S.banner.t===text || S.bannerQ.some(function(q){return q.t===text;})) return;
      if(S.bannerQ.length>=3) S.bannerQ.shift();
      S.bannerQ.push(b);
      S.banner.life=Math.min(S.banner.life,700);
      return;
    }
    showBanner(b);
  }
  function showBanner(b){
    S.banner=b;
    // очки, только что всплывшие в том же кадре (съел — и сразу уровень или кураж), уводим из-под баннера
    for(var i=0;i<S.floaters.length;i++){ var f=S.floaters[i]; if(f.life>=59) f.y=clearOfBanner(f.y); }
  }

  function levelUp(nl){
    S.level=nl;
    S.spawnGap=Math.max(280,950-nl*62)*dk().spawn;
    banner(tr('level')+' '+nl,'#e8c061',1400);
    if(Math.random()<0.35) say('level');
  }

  // уровень — каждые 120 очков
  function checkLevel(){
    var nl=1+Math.floor(S.score/120);
    if(nl!==S.level) levelUp(nl);
  }

  // геометрия портрета персонажа
  function heroBox(){
    var crop=T.face.crop||1;   // тема может показать только верхнюю часть портрета (face.crop), по умолчанию — целиком
    var ratio=(heroImg.naturalWidth?heroImg.naturalHeight/heroImg.naturalWidth:2.0)*crop;   // пока не загрузилась (или не загрузится) — пропорции по умолчанию
    var kw=Math.min(W*0.78,344);
    var kh=kw*ratio;
    var maxH=HS*0.62;   // HS — высота над нижней плашкой
    if(kh>maxH){ kh=maxH; kw=kh/ratio; }
    var kx=W/2-kw/2, ky=16;
    var f=T.face;   // рот и прочие точки лица — в долях портрета, из темы
    return {x:kx,y:ky,w:kw,h:kh,
      mouthX:kx+kw*f.mouthX, mouthY:ky+kh*f.mouthY/crop, mouthR:kw*f.mouthR, crop:crop};
  }

  // рамка вокруг портрета персонажа
  // объёмная полоса багета: 4 трапеции со своим светом (верх светлее, низ темнее), по желанию — волокна дерева
  function bevel(c,x,y,w,h,d0,d1,cols,grain){
    var o=[x-d0,y-d0,x+w+d0,y+h+d0], i=[x-d1,y-d1,x+w+d1,y+h+d1];
    var q=[[o[0],o[1],o[2],o[1],i[2],i[1],i[0],i[1]],[o[2],o[1],o[2],o[3],i[2],i[3],i[2],i[1]],
           [o[2],o[3],o[0],o[3],i[0],i[3],i[2],i[3]],[o[0],o[3],o[0],o[1],i[0],i[1],i[0],i[3]]];
    for(var k=0;k<4;k++){
      var a=q[k]; c.beginPath(); c.moveTo(a[0],a[1]); c.lineTo(a[2],a[3]); c.lineTo(a[4],a[5]); c.lineTo(a[6],a[7]); c.closePath();
      c.fillStyle=cols[k]; c.fill();
      if(!grain) continue;
      c.save(); c.clip(); var r=k*7+3;   // свой детерминированный рисунок волокон на каждой стороне
      for(var n=0;n<40;n++){
        r=(r*9301+49297)%233280; var t=r/233280;
        c.strokeStyle='rgba(0,0,0,'+(0.08+t*0.14)+')'; c.lineWidth=0.5+t*0.9; c.beginPath();
        if(k%2===0){ var yy=(k?i[3]:o[1])+t*(d0-d1); c.moveTo(o[0],yy); c.bezierCurveTo(x+w*0.3,yy+2*(t-.5),x+w*0.7,yy-2*(t-.5),o[2],yy); }
        else { var xx=(k===1?i[2]:o[0])+t*(d0-d1); c.moveTo(xx,o[1]); c.bezierCurveTo(xx+2*(t-.5),y+h*0.3,xx-2*(t-.5),y+h*0.7,xx,o[3]); }
        c.stroke();
      }
      c.restore();
    }
    c.strokeStyle='rgba(0,0,0,.35)'; c.lineWidth=0.8;   // стыки «на ус»
    for(k=0;k<4;k++){ c.beginPath(); c.moveTo(q[k][0],q[k][1]); c.lineTo(q[k][6],q[k][7]); c.stroke(); }
  }
  // рамка портрета — окно каюты: толстое дерево и латунная обкладка у картины
  function drawPortraitFrame(x,y,w,h,c){
    c=c||ctx;
    var f=Math.max(10, w*0.05);   // толщина багета
    bevel(c,x,y,w,h,f*1.25,f*0.3,['#9a6a36','#5a3818','#46290f','#7d5329'],true);
    bevel(c,x,y,w,h,f*0.3,0,['#f3d785','#a97d2c','#7a561c','#d8b25a']);
    c.strokeStyle='rgba(0,0,0,.7)'; c.lineWidth=1.5; c.strokeRect(x-f*1.25,y-f*1.25,w+f*2.5,h+f*2.5);
  }
  // ---- портрет с рамкой: не меняется от кадра к кадру, поэтому готовится один раз на кадр лица и размер ----
  var _portraitCache={};
  // холст с портретом в рамке; _m — поле вокруг портрета под багет
  function portraitLayer(img,b){
    var m=Math.ceil(Math.max(10,b.w*0.05)*1.3)+2;   // поле под багет и заклёпки
    var ok=ready(img);                               // не загрузилась — только рамка
    var q=DPR;   // выше разрешения холста не поднимаем: большой слой тяжело смешивать на слабых телефонах
    var key=(ok?img.src:'-')+'|'+Math.round(b.w)+'x'+Math.round(b.h)+'@'+q+'|'+(sourMode?1:0);
    var layer=_portraitCache[key];
    if(!layer){
      layer=document.createElement('canvas');
      layer.width=Math.ceil((b.w+m*2)*q); layer.height=Math.ceil((b.h+m*2)*q);
      layer._q=q;
      var c=layer.getContext('2d');
      c.setTransform(q,0,0,q,0,0);
      c.imageSmoothingQuality='high';
      if(ok){
        c.fillStyle='#080604'; c.fillRect(m,m,b.w,b.h);
        if(sourMode) c.filter=COL.eggFilter;
        c.drawImage(img,0,0,img.naturalWidth,img.naturalHeight*(b.crop||1),m,m,b.w,b.h);
        c.filter='none';
      }
      drawPortraitFrame(m,m,b.w,b.h,c);
      layer._key=key; layer._m=m;
      _portraitCache[key]=layer;
    }
    return layer;
  }
  window.addEventListener('resize',function(){ _portraitCache={}; _edgeKey=''; });

  // ---- кеши для быстрой отрисовки (телефону дорого каждый кадр сжимать картинки и считать градиенты) ----
  // спрайт, заранее уменьшенный до нужного размера в хорошем качестве; рисуется почти 1:1
  var _spriteCache={}, SPRITE_ROOM=1.15;   // запас на «поп» и сплющивание при тычке
  function sprite(img,w,h,tint){
    var bw=Math.ceil(w*SPRITE_ROOM/8)*8, bh=Math.ceil(h*SPRITE_ROOM/8)*8;
    var key=img.src+'|'+bw+'x'+bh+'@'+DPR+(tint?'|t'+(tint.id||''):'');
    var c=_spriteCache[key];
    if(!c){
      c=document.createElement('canvas');
      c.width=Math.ceil(bw*DPR); c.height=Math.ceil(bh*DPR);
      var x=c.getContext('2d'); x.imageSmoothingQuality='high';
      x.drawImage(img,0,0,c.width,c.height);
      if(tint) tintCanvas(c,tint);
      _spriteCache[key]=c;
    }
    return c;
  }
  // перекраска картинки попиксельно, как CSS hue-rotate → saturate → brightness.
  // Не через ctx.filter: его не поддерживают iPhone до iOS 18. Делается один раз на размер спрайта
  function tintCanvas(c,t){
    var a=(t.hue||0)*Math.PI/180, co=Math.cos(a), si=Math.sin(a), s=t.saturate==null?1:t.saturate, b=t.brightness==null?1:t.brightness;
    var H=[0.213+co*0.787-si*0.213, 0.715-co*0.715-si*0.715, 0.072-co*0.072+si*0.928,
           0.213-co*0.213+si*0.143, 0.715+co*0.285+si*0.140, 0.072-co*0.072-si*0.283,
           0.213-co*0.213-si*0.787, 0.715-co*0.715+si*0.715, 0.072+co*0.928+si*0.072];
    var Sm=[0.213+0.787*s, 0.715-0.715*s, 0.072-0.072*s,
            0.213-0.213*s, 0.715+0.285*s, 0.072-0.072*s,
            0.213-0.213*s, 0.715-0.715*s, 0.072+0.928*s];
    var M=[], i, j;
    for(i=0;i<3;i++) for(j=0;j<3;j++) M[i*3+j]=b*(Sm[i*3]*H[j]+Sm[i*3+1]*H[3+j]+Sm[i*3+2]*H[6+j]);
    var x=c.getContext('2d'), d=x.getImageData(0,0,c.width,c.height), p=d.data;
    for(i=0;i<p.length;i+=4){
      if(!p[i+3]) continue;
      if(t.keepGreen && p[i+1]>p[i] && p[i+1]>p[i+2]) continue;   // листья и черенок оставляем зелёными
      var r=p[i], g=p[i+1], bl=p[i+2];
      p[i]  =M[0]*r+M[1]*g+M[2]*bl;
      p[i+1]=M[3]*r+M[4]*g+M[5]*bl;
      p[i+2]=M[6]*r+M[7]*g+M[8]*bl;
    }
    x.putImageData(d,0,0);
  }
  // мягкое свечение: круг, прозрачный к краю; яркость задаётся globalAlpha при рисовании
  function glowSprite(rgb,inner){
    var c=document.createElement('canvas'); c.width=c.height=256;
    var x=c.getContext('2d'), g=x.createRadialGradient(128,128,128*inner,128,128,128);
    g.addColorStop(0,'rgba('+rgb+',1)'); g.addColorStop(1,'rgba('+rgb+',0)');
    x.fillStyle=g; x.fillRect(0,0,256,256);
    return c;
  }
  var _goldGlow=null, _shadow=null;
  // надпись с обводкой и тенью, нарисованная один раз: рисовать текст каждый кадр телефону дорого,
  // а готовую картинку он только масштабирует. st: {px, font, lw, sw, sx, sy, max} — размер, шрифт,
  // толщина обводки и тени, сдвиг тени, наибольший масштаб при показе (для чёткости)
  var _textCache={}, _textCount=0;
  // шрифт догрузился — перерисовать. Русские буквы и цифры лежат в разных файлах шрифта, и браузер
  // качает файл, только когда он понадобился, — поэтому просим оба сразу
  function _fontsLoaded(){ _textCache={}; _textCount=0; }
  if(document.fonts && document.fonts.load) Promise.all([document.fonts.load(FW+' 30px '+GAME_FONT,'Аа1+×'), document.fonts.load('700 16px '+FONT.text,'Аа1')]).then(_fontsLoaded,function(){});
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(_fontsLoaded);
  function textSprite(t,fill,st){
    var key=t+'|'+fill+'|'+st.px+'|'+st.font+'@'+DPR;
    var sp=_textCache[key];
    if(sp) return sp;
    if(++_textCount>80){ _textCache={}; _textCount=1; }   // не копим бесконечно
    var font=FW+' '+st.px+'px '+st.font;
    ctx.font=font;
    var pad=Math.ceil(st.lw/2+Math.max(st.sx,st.sy)+2);
    var w=Math.ceil(ctx.measureText(t).width)+pad*2, h=Math.ceil(st.px*1.35)+pad*2;
    var q=DPR*st.max, c=document.createElement('canvas');
    c.width=Math.ceil(w*q); c.height=Math.ceil(h*q);
    var x=c.getContext('2d'); x.scale(q,q);
    x.font=font; x.textAlign='center'; x.textBaseline='middle'; x.lineJoin='round';
    var cx=w/2, cy=h/2;
    x.lineWidth=st.sw; x.strokeStyle='rgba(0,0,0,0.45)'; x.strokeText(t,cx+st.sx,cy+st.sy);
    x.lineWidth=st.lw; x.strokeStyle='#1b1006'; x.strokeText(t,cx,cy);
    x.fillStyle=fill; x.fillText(t,cx,cy);
    // тонкие места контрастного шрифта обводка «съедает» — подтягиваем их цветом самой буквы
    if(st.fb){ x.lineWidth=st.fb*st.px/30; x.strokeStyle=fill; x.strokeText(t,cx,cy); }
    return (_textCache[key]={c:c,w:w,h:h});
  }
  // пузырь реплики целиком (рамка, хвостик, текст) — тоже один раз на фразу
  function bubbleSprite(t,bh){
    var key='bubble|'+t+'@'+DPR;
    var sp=_textCache[key];
    if(sp) return sp;
    ctx.font=FW+' 17px '+GAME_FONT;
    var pad=13, bw=Math.ceil(ctx.measureText(t).width)+pad*2, m=2;
    var w=bw+m*2, h=bh+10+m*2;
    var c=document.createElement('canvas'); c.width=Math.ceil(w*DPR); c.height=Math.ceil(h*DPR);
    var x=c.getContext('2d'); x.scale(DPR,DPR);
    var rx=m, ry=m, bx=w/2;
    x.fillStyle='rgba(243,220,170,0.96)'; x.strokeStyle='#6e4e1d'; x.lineWidth=2;
    x.beginPath();
    x.moveTo(rx+6,ry);x.lineTo(rx+bw-6,ry);x.quadraticCurveTo(rx+bw,ry,rx+bw,ry+6);
    x.lineTo(rx+bw,ry+bh-6);x.quadraticCurveTo(rx+bw,ry+bh,rx+bw-6,ry+bh);
    x.lineTo(rx+6,ry+bh);x.quadraticCurveTo(rx,ry+bh,rx,ry+bh-6);
    x.lineTo(rx,ry+6);x.quadraticCurveTo(rx,ry,rx+6,ry);x.closePath();
    x.fill();x.stroke();
    x.beginPath();x.moveTo(bx-7,ry+bh);x.lineTo(bx,ry+bh+10);x.lineTo(bx+7,ry+bh);x.closePath();x.fill();
    x.beginPath();x.moveTo(bx-7,ry+bh);x.lineTo(bx,ry+bh+10);x.lineTo(bx+7,ry+bh);x.stroke();
    x.font=FW+' 17px '+GAME_FONT; x.textAlign='center'; x.textBaseline='middle';
    x.fillStyle='#3a2710'; x.fillText(t,bx,ry+bh/2);
    _textCount++;
    return (_textCache[key]={c:c,w:w,h:h,ty:m+bh/2});
  }
  // нарисовать готовую надпись: центр в (x, y), масштаб sc
  function drawText(sp,x,y,sc){ ctx.drawImage(sp.c, x-sp.w*sc/2, y-sp.h*sc/2, sp.w*sc, sp.h*sc); }
  var FLOAT_TEXT={px:30, lw:5, sw:5.7, sx:1.5, sy:2.5, fb:0.6, max:1.25}, BANNER_TEXT={lw:5.7, sw:6.6, sx:2, sy:3, fb:0.6, max:1};
  // свечение по краям экрана (опасность, вспышка, кураж): считается один раз на размер экрана.
  // Градиент плавный, поэтому хранится в половинном разрешении — на глаз разницы нет
  var _edgeKey='', _edge={};
  function edgeLayer(name){
    var key=W+'x'+H;
    if(_edgeKey!==key){ _edge={}; _edgeKey=key; }
    if(_edge[name]) return _edge[name];
    var c=layerEls[name], q=0.5;
    c.width=Math.max(1,Math.round(W*q)); c.height=Math.max(1,Math.round(H*q));
    var x=c.getContext('2d'); x.scale(q,q);
    var g;
    if(name==='danger'){
      g=x.createRadialGradient(W/2,H*0.45,Math.max(W,H)*0.52,W/2,H*0.45,Math.max(W,H)*0.98);
      g.addColorStop(0,'rgba(0,0,0,0)');
      g.addColorStop(0.6,'rgba(90,12,20,0.4)');
      g.addColorStop(1,'rgba(140,16,26,1)');
    } else {
      var rgb=name==='flash'?'200,30,20':'255,190,60';
      g=x.createRadialGradient(W/2,H/2,Math.min(W,H)*(name==='flash'?0.25:0.30), W/2,H/2,Math.max(W,H)*0.62);
      g.addColorStop(0,'rgba('+rgb+',0)');
      g.addColorStop(1,'rgba('+rgb+',1)');
    }
    x.fillStyle=g; x.fillRect(0,0,W,H);
    return (_edge[name]=c);
  }
  // прозрачность слоя-свечения; меняется только свойство слоя — перерисовки нет
  function setEdge(name,alpha){
    var a=alpha>0.004 ? Math.round(Math.min(1,alpha)*100)/100 : 0;
    var el=layerEls[name];
    if(a>0) edgeLayer(name);
    if(el._a!==a){ el._a=a; el.style.opacity=a; }
  }

  // ---- слои под и над холстом. Крупное и неподвижное (море, портрет, свечения по краям) живёт
  // в отдельных слоях страницы: их смешивает видеокарта, а холст каждый кадр рисует только мелочь ----
  var layerEls={};
  (function(){
    function el(tag,id,before){ var e=document.createElement(tag); e.id=id; e.className='glayer'; game.insertBefore(e,before); return e; }
    var sea=layerEls.sea=el('div','seaLayer',cv);
    sea.style.backgroundImage='url("'+themeFile(T.images.background)+'"), linear-gradient(#0a0805,#0c0905 55%,#161009)';
    layerEls.portrait=el('div','portraitLayer',cv);
    layerEls.danger=el('canvas','edgeDanger',cv);        // опасность — под виноградом, как раньше
    var after=cv.nextSibling;
    layerEls.flash=el('canvas','edgeFlash',after);       // вспышка и кураж — поверх винограда
    layerEls.kurazh=el('canvas','edgeKurazh',after);
    ['danger','flash','kurazh'].forEach(function(n){ layerEls[n].className='glayer gedge'; layerEls[n]._a=0; });
  })();
  var _pl={layer:null, pos:'', tf:''};
  // портрет на своём слое: смена кадра — подмена готового холста, качка и тряска — transform слоя
  function placePortrait(img,b,tilt,sx,sy){
    var layer=portraitLayer(img,b), m=layer._m, host=layerEls.portrait;
    if(_pl.layer!==layer){
      layer.style.width=(layer.width/layer._q)+'px'; layer.style.height=(layer.height/layer._q)+'px';
      if(host.firstChild) host.replaceChild(layer,host.firstChild); else host.appendChild(layer);
      _pl.layer=layer;
    }
    var pos=(b.x-m)+'|'+(b.y-m)+'|'+m+'|'+b.w+'|'+b.h;
    if(_pl.pos!==pos){
      _pl.pos=pos;
      host.style.left=(b.x-m)+'px'; host.style.top=(b.y-m)+'px';
      host.style.transformOrigin=(m+b.w/2)+'px '+(m+b.h/2)+'px';
    }
    var tf=(sx||sy?'translate('+sx.toFixed(1)+'px,'+sy.toFixed(1)+'px) ':'')+(tilt?'rotate('+tilt.toFixed(4)+'rad)':'');
    if(_pl.tf!==tf){ _pl.tf=tf; host.style.transform=tf; }
  }
  function hideEdges(){ setEdge('danger',0); setEdge('flash',0); setEdge('kurazh',0); }

  // ---- сложность ----
  var DIFF={
    normal:{choke:0.85, spawn:0.82, hits:0},
    hard:  {choke:0.42, spawn:0.48, hits:1}     // короткое окно удушья, частый спавн
  };
  var difficulty='normal';
  function dk(){return (DIFF[difficulty]||DIFF.normal);}
  var sourMode=false, diffBeforeSour=null;
  // выход из пасхалки (роли винограда меняются местами): вернуть сложность, выбранную в меню
  function leaveSourMode(){
    if(!sourMode) return;
    sourMode=false;
    if(diffBeforeSour){ difficulty=diffBeforeSour; diffBeforeSour=null; }
  }

  // сколько нажатий нужно на зелёный — растёт с уровнем
  // ---- волны: с 8 уровня натиск зелёного сменяется передышкой, в которой зелёных нет, —
  // в ней успевают фиолетовый, золото, ром и события. Натиск за это чуть плотнее ----
  var WAVE_FROM=8, RUSH_MS=8000, CALM_MS=3500, RUSH_GAP=0.8, RUSH_GREEN=0.1;
  function waveOn(){ return S.level>=WAVE_FROM; }
  function inCalm(){ return waveOn() && !!(S.wave && S.wave.calm); }
  function inRush(){ return waveOn() && !(S.wave && S.wave.calm); }
  function updateWave(dt){
    if(!waveOn()) return;
    var w=S.wave||(S.wave={calm:false,t:0});
    w.t+=dt;
    if(w.t < (w.calm?CALM_MS:RUSH_MS)) return;
    w.t=0; w.calm=!w.calm;
    if(w.calm){ if(Math.random()<0.5) say('calm'); }
    else { SFX.rush(); if(rnd()<VOL_CHANCE) S.volT=1000+rnd()*3500; }
  }
  // ---- взрывной зелёный: изредка в натиске одна гроздь «перезревает» — наливается бурым и пульсирует
  // всё чаще; не раздавил за 3 с — лопается на три маленьких, каждая с одного тычка ----
  var VOL_CHANCE=0.4, VOL_MS=3000, VOL_KIDS=3;
  var VOL_TINT=T.colors.volatile||{hue:-38,saturate:0.7,brightness:0.6};
  VOL_TINT.id='vol';
  // ---- ульта «Корабль-призрак»: съеденное заряжает шкалу; полная — тап по кнопке, и корабль
  // проплывает по морю, давя все зелёные на пути. Картинки — images.ghostShip и images.ultIcon (без них ульты нет) ----
  var ULT_MAX=30, SHIP_MS=2200;
  var shipImg=T.images.ghostShip ? themeImg(T.images.ghostShip) : null;
  var ultBtn=document.getElementById('ultBtn');
  if(ultBtn){
    if(shipImg && T.images.ultIcon){
      var ultSrc=new URL(themeFile(T.images.ultIcon),location.href).href;   // абсолютный: url() в CSS-переменной считался бы от папки css/
      ultBtn.querySelector('img').src=ultSrc; ultBtn.style.setProperty('--ult-img','url("'+ultSrc+'")');
    } else { ultBtn.remove(); ultBtn=null; }
  }
  if(ultBtn) ultBtn.addEventListener('pointerdown',function(e){ e.preventDefault(); e.stopPropagation(); fireUlt(); });
  function ultCharge(n){ if(!ultBtn || S.ship) return; S.ult=Math.min(ULT_MAX,(S.ult||0)+n); paintUlt(); }
  function paintUlt(){
    if(!ultBtn) return;
    var f=Math.min(1,(S.ult||0)/ULT_MAX);
    ultBtn.style.setProperty('--ult',Math.round(f*100)+'%'); ultBtn.classList.toggle('ready',f>=1);
    // шкала на полпути — готовим корабль заранее, по кусочку в остаток кадров (не в отсчёт: там и так тесно).
    // Картинка большая, её распаковка в момент залпа дала бы рывок
    if(f>=0.5 && !S.shipWarm){
      S.shipWarm=true;
      warmQ.push(prepShipSnd, warmShip);
    }
  }
  function fireUlt(){
    if(!S.running || paused || S.leaving || S.ship || (S.ult||0)<ULT_MAX) return;
    S.ult=0; paintUlt(); S.ship={t:0};
    if(!playLoud(_shipSnd,1)) SFX.ship();
    try{ if(bgm && musicOn) bgm.volume=musicVol*0.25; }catch(e){}   // музыка приседает — корабль ревёт в тишине
    buzz([140,40,220,40,320,60,420]); S._sayHold=0; say('ship',true);
    S.shipFlash=1; S.shake=Math.max(S.shake||0,24);
  }
  function shipW(){ return Math.max(W*1.6,520); }
  function warmShip(){ if(ready(shipImg)) sprite(shipImg,shipW(),shipH()); }
  function shipH(){ return shipW()*shipImg.naturalHeight/shipImg.naturalWidth; }
  function shipX(){   // левый край корабля: нос врывается в кадр сразу после тапа и сбавляет ход к выходу за правый край
    var p=Math.min(1,S.ship.t/SHIP_MS), e=1-Math.pow(1-p,1.5), x0=-shipW()*0.93;
    return x0+(W-x0)*e;
  }
  function updateShip(dt){
    var k=dt/16.667;
    if(S.shipFlash>0) S.shipFlash=Math.max(0,S.shipFlash-dt/350);
    for(var f=S.flung.length-1;f>=0;f--){
      var o=S.flung[f]; o.t+=dt; o.x+=o.vx*k; o.y+=o.vy*k; o.vy+=0.55*k; o.rot+=o.vr*k;
      if(o.t>=750) S.flung.splice(f,1);
    }
    var sh=S.ship; if(!sh) return;
    sh.t+=dt;
    var x=shipX(), bow=x+shipW()*0.93;
    if(bow<W+40) S.shake=Math.max(S.shake||0,10);   // пока нос идёт по полю, всё поле трясёт
    // бурун у носа: пена летит вверх и вперёд
    if(bow>0 && bow<W+40) for(var b=0;b<2;b++){
      if(S.particles.length>=MAX_PARTICLES) S.particles.shift();
      var lf=16+Math.random()*14;
      S.particles.push({x:bow-10+Math.random()*20, y:H-DOCK_H-H*(0.03+Math.random()*0.1), vx:2+Math.random()*4, vy:-3-Math.random()*5,
        r:2+Math.random()*3, c:Math.random()<0.5?'#e6fffb':'#8ff0e4', life:lf, max:lf});
    }
    for(var i=S.grapes.length-1;i>=0;i--){
      var g=S.grapes[i];
      if(g.sour||g.gold||g.rum||g.held||g.fly||g.x>bow) continue;
      burst(g.x,g.y,sourMode?COL.good:COL.bad,18); burst(g.x,g.y,'#8ff0e4',10); burst(g.x,g.y,'#e6fffb',6);
      // гроздь не исчезает, а отлетает — кувыркаясь вверх и по ходу корабля
      S.flung.push({img:grapeImg(g), w:g.r*2.2, x:g.x, y:g.y, vx:5+Math.random()*5, vy:-9-Math.random()*6, rot:0, vr:(Math.random()-0.5)*0.5, t:0});
      S.shake=Math.max(S.shake||0,24);
      if(sh.t-(sh.snd||-999)>70){ sh.snd=sh.t; if(!playLoud(_shipHitSnd,0.9,0.9+Math.random()*0.25)) SFX.shipHit(); }   // удары серией, а не кашей из звуков
      if(statsOn()) STATS.green++;
      SESSION.green++; S.grapes.splice(i,1);
    }
    if(sh.t>=SHIP_MS){ S.ship=null; applyAudio(); }
  }
  function drawShip(){
    // вспышка при появлении корабля — бирюзовый свет по всему полю, быстро гаснет
    if(S.shipFlash>0){ ctx.fillStyle='rgba(150,245,235,'+(0.32*S.shipFlash)+')'; ctx.fillRect(0,0,W,H); }
    // сбитые грозди летят поверх корабля
    for(var f=0;f<S.flung.length;f++){
      var o=S.flung[f], al=Math.max(0,1-o.t/750);
      if(!ready(o.img)) continue;
      ctx.save(); ctx.globalAlpha=al; ctx.translate(o.x,o.y); ctx.rotate(o.rot);
      ctx.drawImage(sprite(o.img,o.w,o.w),-o.w/2,-o.w/2,o.w,o.w); ctx.restore();
    }
    if(!S.ship || !ready(shipImg)) return;
    var sw=shipW(), sh=shipH(), x=shipX();
    var y=H-DOCK_H-sh*0.02-sh+Math.sin(S.ship.t/230)*4;   // киль над нижней плашкой, чуть покачивается
    ctx.drawImage(sprite(shipImg,sw,sh),x,y,sw,sh);   // заранее уменьшенный спрайт: без распаковки картинки на лету
  }
  function greenNeed(g){ return g.small ? 1 : greenHitsNeeded(); }
  function updateVolatile(dt,gc){
    if(CFG.volTest && S.volT==null) S.volT=800;   // для тестов: сразу, на любом уровне
    if(!(S.volT>0)) return;
    S.volT-=dt; if(S.volT>0) return;
    if(gc>=3 || S.leaving || S.loot || S.ship || S.rumGrace>0 || inCalm()){ S.volT=inCalm()?0:500; return; }   // Кунке и так тяжело или идёт добыча (там зелёных нет) — чуть позже
    spawn('green'); var g=S.grapes[S.grapes.length-1]; g.vol={t:0};
  }
  function explode(g){
    removeGrape(g);
    burst(g.x,g.y,sourMode?COL.good:COL.bad,14); burst(g.x,g.y,COL.badHit,8);
    S.shake=Math.max(S.shake||0,6); SFX.burst(); buzz([30,40,30]);
    for(var i=0;i<VOL_KIDS;i++){
      var a=-Math.PI/2+i*2*Math.PI/VOL_KIDS+rnd()*0.4, r=g.r*0.62, d=g.r*1.15;
      var q=clampPos(g.x+Math.cos(a)*d,g.y+Math.sin(a)*d,r);
      S.grapes.push({ x:q[0], y:q[1], r:r, sour:false, gold:false, held:false,
        hits:0, squashT:0, life:0, small:true, bob:rnd()*6.28, vb:0.05+rnd()*0.03, age:0 });
    }
  }
  function greenHitsNeeded(){ if(S.grip>0) return 1; return Math.min(5+dk().hits, 2+Math.floor((S.level-1)/4)+dk().hits); }   // в «железную хватку» — с одного тычка; крепость растёт до 5 (хардкор 6), дальше сложность держат волны
  // окно до удушения (мс) — сокращается с уровнем
  function chokeWindow(){
    var base=(4200-(S.level-1)*200)*dk().choke;
    // нижняя граница с 13 уровня опускается на 30 мс за уровень, но не больше чем на 400:
    // обычная 1300 → 900 мс, хардкор 900 → 700 мс
    var doom=S.level>12?Math.min(400,(S.level-12)*30):0;
    var floor=(dk()===DIFF.hard) ? Math.max(700, 900-doom) : 1300-doom;
    return Math.max(floor, base);
  }


  // ---- погода: с 4 уровня изредка шторм — волны качают виноград ----
  var WEATHER={
    storm:{dur:7000, color:'#9fc3dc'}
  };
  var WEATHER_FROM=4;                     // с какого уровня
  function weatherPause(){ return 22000+rnd()*10000; }   // затишье между событиями
  function setWeather(type){
    S.weather=type?{type:type, t:0, dur:WEATHER[type].dur}:null;
    if(type){ banner(T.text.weather[type],WEATHER[type].color,1600); say('storm',true); }
    S.weatherT=type?0:weatherPause();
    if(type) document.body.setAttribute('data-weather',type); else document.body.removeAttribute('data-weather');
  }
  function updateWeather(dt,gc){
    if(S.leaving) return;   // Кунка уходит — шторма и добычи уже не будет
    if(S.level<WEATHER_FROM) return;
    if(S.weather){
      S.weather.t+=dt;
      if(S.weather.t>=S.weather.dur) setWeather(null);
      return;
    }
    if(!S.weatherT) S.weatherT=9000;      // первое событие — вскоре после 4 уровня
    S.weatherT-=dt;
    // не начинаем, пока Кунке и так тяжело
    if(S.weatherT<=0 && gc<3 && S.kurazh<=0 && !S.loot && !inRush()){
      setWeather('storm');
    }
  }

  // ---- добыча: с 3 уровня изредка на поле высыпается 5 фиолетовых, и пару секунд нет зелёных ----
  var LOOT_FROM=3, LOOT_COUNT=5, LOOT_DUR=3000;
  function lootPause(){ return 34000+rnd()*12000; }
  function updateLoot(dt,gc){
    if(S.leaving) return;
    if(S.level<LOOT_FROM) return;
    var L=S.loot;
    if(L){
      L.t+=dt; L.next-=dt;
      // высыпаем по одной, чтобы было видно, как они появляются
      if(L.left>0 && L.next<=0 && S.grapes.length<11){ spawn('sour'); S.grapes[S.grapes.length-1].loot=true; L.left--; L.next=110; }
      if(L.t>=LOOT_DUR){ S.loot=null; S.lootT=lootPause(); document.body.removeAttribute('data-event'); }
      return;
    }
    if(!S.lootT) S.lootT=12000;           // первая добыча — вскоре после 3 уровня
    S.lootT-=dt;
    if(S.lootT<=0 && gc<3 && !S.weather && S.kurazh<=0 && !inRush()){
      S.loot={t:0, left:LOOT_COUNT, next:0};
      banner(T.text.loot, '#e8c061', 1500);
      say('loot',true);
      document.body.setAttribute('data-event','loot');
    }
  }
  // сила события 0..1: плавно нарастает и спадает по 0,6 с
  function weatherPower(type){
    var w=S.weather; if(!w || w.type!==type) return 0;
    return Math.max(0, Math.min(1, w.t/600, (w.dur-w.t)/600));
  }


  // нижняя плашка ровной высоты, кнопка ульты целиком на ней. Чтобы поле винограда не стало теснее,
  // портрет и поле раскладываются по «высоте над плашкой» HS — та же раскладка, что и без плашки, чуть мельче.
  var DOCK_H, ULT_SZ, HS;   // считает layoutDock из resize (он вызывается раньше этой строки)
  function layoutDock(){
    ULT_SZ=W<360?50:56;
    var pad=10;
    DOCK_H=ULT_SZ+pad*2;                 // с кромкой 3px: под кнопкой и над ней поровну
    HS=Math.max(160,Math.min(H,(H-DOCK_H-64)/0.86));   // не меньше 160: иначе на крошечном окне размеры уходят в минус   // низ зоны спавна (0.86·HS) плюс самая крупная гроздь — ровно до плашки
    var st=document.documentElement.style;
    st.setProperty('--dock',DOCK_H+'px'); st.setProperty('--ult-sz',ULT_SZ+'px'); st.setProperty('--ult-off',(pad-1.5)+'px');
  }
  // гроздь целиком над нижней плашкой (картинка чуть шире радиуса, плюс покачивание)
  function clampPos(x,y,r){
    var e=r*1.15+6;
    return [Math.max(r,Math.min(W-r,x)), Math.max(r,Math.min(H-DOCK_H-e,y))];
  }
  // плашка с кнопкой ульты: на отсчёте затемнена вместе с полем, на паузе и в сцене конца партии скрыта
  var _dockSt=null;
  function dockState(){
    var st=countdown?'dim':(paused||death?'hide':'');
    if(st===_dockSt) return;
    _dockSt=st; game.classList.toggle('dock-dim',st==='dim'); game.classList.toggle('dock-hide',st==='hide');
  }
  function fieldZone(){
    var b=heroBox(), top=Math.max(b.y+b.h+40, HS*0.67), bot=HS*0.86;
    if(bot-top<120) top=bot-120;   // низкий экран (ПК, альбомная) — поле не схлопывается
    return [top,bot];
  }
  function spawn(forceType){
    var sour = forceType ? (forceType==='sour') : false;
    var gr=40+rnd()*8;
    var z=fieldZone(), pos=freeX(gr,z[0],z[1]); pos=clampPos(pos[0],pos[1],gr);
    S.grapes.push({
      x:pos[0], y:pos[1],
      r:gr, sour:sour, gold:false, held:false,
      hits:0, squashT:0, life:0,
      bob:rnd()*6.28, vb:0.03+rnd()*0.025, age:0
    });
  }
  // поиск позиции: пробуем с убывающим зазором, в крайнем случае любое место
  function freeX(gr, zoneTop, zoneBot){
    var spacings=[1.35, 1.15, 0.95, 0.7];
    for(var s=0;s<spacings.length;s++){
      for(var attempt=0; attempt<14; attempt++){
        var x=gr+rnd()*(W-gr*2);
        var y=zoneTop+rnd()*(zoneBot-zoneTop);
        var ok=true;
        for(var i=0;i<S.grapes.length;i++){
          var o=S.grapes[i];
          var dx=x-o.x, dy=y-o.y;
          var minD=(gr+o.r)*spacings[s];
          if(dx*dx+dy*dy < minD*minD){ ok=false; break; }
        }
        if(ok) return [x,y];
      }
    }
    // совсем нет места — ставим в случайную точку зоны (спавн не должен застревать)
    return [gr+rnd()*(W-gr*2), zoneTop+rnd()*(zoneBot-zoneTop)];
  }
  function spawnGold(){
    var gr=44+rnd()*6;
    var z=fieldZone(), pos=freeX(gr,z[0],z[1]); pos=clampPos(pos[0],pos[1],gr);
    S.grapes.push({
      x:pos[0], y:pos[1], r:gr, sour:true, gold:true, held:false,
      hits:0, squashT:0, life:2600,
      bob:rnd()*6.28, vb:0.04+rnd()*0.02, age:0
    });
  }
  function spawnRum(){
    var gr=46+rnd()*4;
    var z=fieldZone(), pos=freeX(gr,z[0],z[1]); pos=clampPos(pos[0],pos[1],gr);
    S.grapes.push({
      x:pos[0], y:pos[1], r:gr, sour:true, gold:false, rum:true, held:false,
      hits:0, squashT:0, life:4200,
      bob:rnd()*6.28, vb:0.035+rnd()*0.02, age:0
    });
  }
  function hasRum(){for(var i=0;i<S.grapes.length;i++)if(S.grapes[i].rum)return true;return false;}
  function lootLeft(){var n=0;for(var i=0;i<S.grapes.length;i++)if(S.grapes[i].loot)n++;return n;}
  function sourCount(){var n=0;for(var i=0;i<S.grapes.length;i++){var g=S.grapes[i];if(g.sour&&!g.gold&&!g.rum)n++;}return n;}
  function greenCount(){var n=0;for(var i=0;i<S.grapes.length;i++){var g=S.grapes[i];if(!g.sour&&!g.gold&&!g.rum)n++;}return n;}
  function chokableCount(){return greenCount();}
  // редкая гроздь: крупная, перекрашенная цветом из темы (colors.rare); съел — «железная хватка» (startGrip);
  // как золото, пропадает через 5 с
  function spawnRare(){
    var gr=62+rnd()*4;
    var z=fieldZone(), pos=freeX(gr,z[0],z[1]); pos=clampPos(pos[0],pos[1],gr);
    S.grapes.push({
      x:pos[0], y:pos[1], r:gr, sour:true, gold:false, rare:true, held:false,
      hits:0, squashT:0, life:5000,
      bob:rnd()*6.28, vb:0.025+rnd()*0.015, age:0
    });
  }
  // съели редкую гроздь — «железная хватка»: несколько секунд зелёный лопается с одного тычка
  var GRIP_MS=6000;
  // полоска таймера: тёмная канавка со скруглёнными концами, заливка цвета эффекта с бликом сверху
  function timerBar(row,frac,col){
    var m=14,h=8,y=H-DOCK_H-8-h-row*(h+6),bw=W-2*m;   // над нижней плашкой
    var fw=Math.max(h,bw*Math.max(0,Math.min(1,frac)));
    ctx.save();
    roundPath(m-2,y-2,bw+4,h+4,(h+4)/2);
    ctx.fillStyle='rgba(8,4,1,.72)'; ctx.fill();
    ctx.strokeStyle='rgba(212,168,67,.35)'; ctx.lineWidth=1; ctx.stroke();
    roundPath(m,y,fw,h,h/2);
    ctx.fillStyle=col; ctx.fill();
    var sh=ctx.createLinearGradient(0,y,0,y+h);   // объём: светлее сверху, темнее снизу
    sh.addColorStop(0,'rgba(255,255,255,.28)'); sh.addColorStop(1,'rgba(0,0,0,.35)');
    ctx.fillStyle=sh; ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.35)'; ctx.fillRect(m+h/2,y+1,Math.max(0,fw-h),1.5);
    ctx.restore();
  }
  function roundPath(x,y,w,h,r){
    ctx.beginPath(); ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
  }

  function startGrip(){
    S.grip=GRIP_MS;
    banner(T.text.grip, COL.gripText, 1400);
    S._sayHold=0; say('grip',true); S._sayHold=Date.now()+1600;
  }
  // сила «железной хватки» 0..1: последнюю секунду плавно гаснет — видно, что эффект кончается
  function gripPower(){ return S.grip>0 ? Math.min(1,S.grip/1000) : 0; }
  function hasRare(){for(var i=0;i<S.grapes.length;i++)if(S.grapes[i].rare)return true;return false;}
  function hasGold(){for(var i=0;i<S.grapes.length;i++)if(S.grapes[i].gold)return true;return false;}

  function pointAt(px,py){
    function hit(g){ return !g.held && !g.fly && (px-g.x)*(px-g.x)+(py-g.y)*(py-g.y) < g.r*g.r*0.95; }   // уже взятую другим пальцем не трогаем
    // 1) РОМ — спасение, хватаем первым
    for(var a=S.grapes.length-1;a>=0;a--){ if(S.grapes[a].rum && hit(S.grapes[a])) return S.grapes[a]; }
    // 2) ЗЕЛЁНЫЙ — угроза, тыкаем (важнее золота)
    for(var c=S.grapes.length-1;c>=0;c--){ if(!S.grapes[c].sour && hit(S.grapes[c])) return S.grapes[c]; }
    // 3) ЗОЛОТО — ценное
    for(var b=S.grapes.length-1;b>=0;b--){ if(S.grapes[b].gold && hit(S.grapes[b])) return S.grapes[b]; }
    // 4) ФИОЛЕТОВЫЙ — обычный
    for(var d=S.grapes.length-1;d>=0;d--){ if(S.grapes[d].sour && !S.grapes[d].rum && !S.grapes[d].gold && hit(S.grapes[d])) return S.grapes[d]; }
    return null;
  }
  var MAX_PARTICLES=160, MAX_FLOATERS=12;   // лимиты эффектов
  // капля сока: цветной объём, тёмный край и блик — рисуется один раз на цвет
  var _drops={};
  function dropSprite(col){
    if(_drops[col]) return _drops[col];
    var c=document.createElement('canvas'); c.width=c.height=32;
    var x=c.getContext('2d'), g=x.createRadialGradient(12,11,1,16,16,15);
    g.addColorStop(0,'#fff'); g.addColorStop(0.18,col); g.addColorStop(0.8,col); g.addColorStop(1,'rgba(0,0,0,0.55)');
    x.fillStyle=g; x.beginPath(); x.arc(16,16,15,0,6.28); x.fill();
    return (_drops[col]=c);
  }
  var heroTaps=0, heroTapT=0;
  var EASTER_LINE=T.text.touchLine;
  // звук к этой реплике — если он есть в теме; играет только со включёнными звуками
  var touchSnd=null;
  function playTouchSound(){
    var f=T.sounds && T.sounds.touch;
    if(!f || !sfxOn) return;
    if(!touchSnd){ touchSnd=new Audio(themeFile(f)); touchSnd.preload='auto'; }
    try{ touchSnd.currentTime=0; }catch(e){}
    var p=touchSnd.play(); if(p && p.catch) p.catch(function(){});
  }
  function stopTouchSound(){ if(touchSnd) try{ touchSnd.pause(); }catch(e){} }   // на паузе и в фоне не звучит

  // зажим координат перетаскивания в границы поля

  // обработка одного «начала касания» в точке (общая для тача и мыши)
  function beginAt(px,py){
    if(!S.running || S.leaving>0)return;   // Кунка уходит — поле уже не трогаем
    if(py>H-DOCK_H) return;   // тап по нижней плашке (мимо кнопки) полю не достаётся; в «Походе» — выстрел
    var g=pointAt(px,py);
    if(!g){
      var kb=heroBox();
      var inFace = px>kb.x && px<kb.x+kb.w && py>kb.y && py<kb.y+kb.h*Math.min(1,T.face.tapZone/(kb.crop||1));
      if(inFace){
        var now=Date.now();
        if(now-heroTapT>1500) heroTaps=0;
        heroTapT=now; heroTaps++;
        if(heroTaps>=15){ heroTaps=0; S._sayT=0; S.bubble={t:EASTER_LINE, life:1600, max:1600}; playTouchSound(); }
      }
      return null;
    }
    var isDraggable=g.sour;
    if(isDraggable){
      g.held=true; var q=clampPos(px,py,g.r); g.x=q[0]; g.y=q[1]; g._vx=g._vy=0; g._t=performance.now();
      return g;   // объект тащится пальцем
    } else {
      g.hits++; g.squashT=120; SFX.squash(); buzz(8);
      burst(g.x,g.y,sourMode?COL.good:COL.badHit,5);
      if(g.hits>=greenNeed(g)){
        burst(g.x,g.y,sourMode?COL.good:COL.bad,10);
        if(S.grip>0){   // в хватку зелёный лопается с хрустом, брызг больше, портрет слегка вздрагивает
          burst(g.x,g.y,COL.gripBar,6); S.shake=Math.max(S.shake||0,5); SFX.crunch();
        }
        if(statsOn()) STATS.green++;   // пасхалка в общую статистику не идёт
        SESSION.green++; S.greenKillCD=700;
        buzz(22);
        if(Math.random()<0.1) say('squash');
        removeGrape(g);
      }
      return null;
    }
  }

  // ---- серия: съел следующее не позже чем через 1,6 с — серия растёт; каждые 5 подряд — бонус ----
  var COMBO_WINDOW=1600, COMBO_STEP=5;
  function comboEat(){
    S.combo=S.comboT>0 ? S.combo+1 : 1;
    S.comboT=COMBO_WINDOW;
    if(S.combo%COMBO_STEP) return;
    var bonus=Math.min(50, S.combo/COMBO_STEP*10);   // 5 → +10, 10 → +20 … не больше +50
    S.score+=bonus;
    var last=S.floaters[S.floaters.length-1];   // очки за то, что только что съели
    var b=heroBox();
    floater(b.mouthX, last?last.y+FLOATER_GAP:b.mouthY+b.mouthR*0.65, T.text.combo+' '+S.combo+' +'+bonus, COL.gold);
    SFX.combo();
    if(Math.random()<0.5) say('combo');
  }

  // завершение перетаскивания объекта g в точке
  function endDrag(g){
    if(!g)return;
    if(S.grapes.indexOf(g)<0) return;     // уже съедена, исчезла или осталась от прошлой партии
    if(!S.running){ g.held=false; return; }
    var b=heroBox();
    var d=Math.hypot(g.x-b.mouthX,g.y-b.mouthY);
    if(d < b.mouthR+g.r){
      S.mouthOpen=1;
      if(g.rum){
        for(var ri=S.grapes.length-1;ri>=0;ri--){
          if(!S.grapes[ri].sour){ burst(S.grapes[ri].x,S.grapes[ri].y,COL.bad,8); S.grapes.splice(ri,1); }
        }
        S.score+=20; if(statsOn()) STATS.rum++; SESSION.rum++; ultCharge(1);
        SFX.rum(); buzz([30,50,60]); burst(g.x,g.y,COL.bonus,24); say('bonus');
        S.flash=0; S.wasFull=false; S.greenFull=0;
        S.rumGrace=2000;
        S.kurazh=6000;   // 6 секунд КУРАЖА — очки x2
        banner(T.text.bonusBanner,COL.gold,1600);
        floater(g.x,g.y,'+20',COL.gold);
        comboEat();
        checkLevel();
        slurp(g); removeGrape(g); upd(); g.held=false; return;
      }
      var gain=g.gold?50:10;
      if(S.kurazh>0) gain*=2;   // во время куража очки удваиваются
      S.score+=gain;
      if(g.gold){ if(statsOn()) STATS.gold++; SESSION.gold++; ultCharge(3); SFX.gold(); buzz([20,40,20,40,20]); burst(g.x,g.y,COL.gold,16); say('gold'); }
      else { if(statsOn()) STATS.purple++; SESSION.purple++; ultCharge(1); SFX.eat(); buzz(g.rare?[20,30,20]:14); burst(g.x,g.y,sourMode?COL.bad:COL.good,g.rare?16:8); if(g.rare) startGrip(); else if(Math.random()<0.12) say('eat'); }
      floater(g.x,g.y,'+'+gain, g.gold?COL.gold:(sourMode?COL.counter:COL.goodText));   // в пасхалке очки — светло-зелёные, как съедобное
      comboEat();   // после очков: надпись серии встанет строкой ниже них
      checkLevel();
      slurp(g); removeGrape(g); upd();
    } else if(g.held && throwAt(g,b)) return;
    g.held=false;
  }

  // ---- бросок: быстрый взмах в сторону рта — виноград сам долетает до Кунки ----
  var THROW_SPEED=0.45, THROW_AIM=0.85;   // px/мс; косинус угла между взмахом и направлением на рот
  // перетаскивание пальцем/мышью; заодно скорость взмаха (сглаженная)
  function dragTo(g,x,y){
    var now=performance.now(), dt=Math.max(1,now-(g._t||now));
    var q=clampPos(x,y,g.r), nx=q[0], ny=q[1];
    g._vx=(g._vx||0)*0.5+(nx-g.x)/dt*0.5; g._vy=(g._vy||0)*0.5+(ny-g.y)/dt*0.5;
    g._t=now; g.x=nx; g.y=ny;
  }
  function throwAt(g,b){
    if(performance.now()-(g._t||0)>90) return false;   // палец остановился перед отпусканием — это не бросок
    var vx=g._vx||0, vy=g._vy||0, v=Math.hypot(vx,vy);
    var dx=b.mouthX-g.x, dy=b.mouthY-g.y, d=Math.hypot(dx,dy);
    if(v<THROW_SPEED || !d || (vx*dx+vy*dy)/(v*d)<THROW_AIM) return false;
    g.held=false;
    g.fly={t:0, dur:Math.max(140,Math.min(320,d/1.6)), x0:g.x, y0:g.y, arc:Math.min(60,d*0.15)};
    return true;
  }
  // полёт брошенного к рту; долетевший съедается в land() — уже после прохода по винограду
  function flyStep(g,dt){
    var f=g.fly, b=heroBox();
    f.t+=dt;
    var p=Math.min(1,f.t/f.dur), e=p*p*(3-2*p);
    g.x=f.x0+(b.mouthX-f.x0)*e;
    g.y=f.y0+(b.mouthY-f.y0)*e-Math.sin(p*Math.PI)*f.arc;
  }
  // долетел — съеден как обычно
  function land(g){
    var b=heroBox();
    g.fly=null; g.held=true; g.x=b.mouthX; g.y=b.mouthY;
    endDrag(g);
  }

  // ---- мультитач: каждый палец привязан к своему объекту через identifier ----
  var activeTouches={};   // identifier -> grape (который тащит этот палец)
  function canvasXY(clientX,clientY){
    // canvas на весь экран, но учитываем rect на случай смещения
    var r=cv.getBoundingClientRect();
    return [clientX-r.left, clientY-r.top];
  }

  function onTouchStart(e){
    e.preventDefault();
    for(var i=0;i<e.changedTouches.length;i++){
      var t=e.changedTouches[i];
      var xy=canvasXY(t.clientX,t.clientY);
      // отпускание прошлого пальца с тем же номером потерялось — отпускаем его виноградину, иначе она зависла бы «в руке»
      if(activeTouches[t.identifier]){ endDrag(activeTouches[t.identifier]); delete activeTouches[t.identifier]; }
      var g=beginAt(xy[0],xy[1]);
      if(g) activeTouches[t.identifier]=g;   // палец взял объект
    }
  }
  function onTouchMove(e){
    if(!S.running)return;
    e.preventDefault();
    for(var i=0;i<e.changedTouches.length;i++){
      var t=e.changedTouches[i];
      var g=activeTouches[t.identifier];
      if(g){ var xy=canvasXY(t.clientX,t.clientY); dragTo(g,xy[0],xy[1]); }
    }
  }
  function onTouchEndCancel(e){
    if(e.cancelable) e.preventDefault();   // touchcancel не отменяется — иначе браузер пишет ошибку в консоль
    for(var i=0;i<e.changedTouches.length;i++){
      var t=e.changedTouches[i];
      var g=activeTouches[t.identifier];
      if(g){ endDrag(g); delete activeTouches[t.identifier]; }
    }
  }

  // ---- МЫШЬ (ПК) ----
  var mouseDrag=null;
  function onMouseDown(e){
    if(e.button!==0) return;
    if(mouseDrag){ endDrag(mouseDrag); mouseDrag=null; }   // mouseup потерялся (alt-tab, системное окно) — прошлую отпускаем
    var g=beginAt(e.clientX,e.clientY); if(g) mouseDrag=g;
  }
  function onMouseMove(e){ if(!S.running||!mouseDrag)return; dragTo(mouseDrag,e.clientX,e.clientY); }
  function onMouseUp(e){ if(mouseDrag){ endDrag(mouseDrag); mouseDrag=null; } }

  function removeGrape(g){var i=S.grapes.indexOf(g);if(i>=0)S.grapes.splice(i,1);}
  // в пасхалке съедобный рисуется зелёным, опасный — фиолетовым (красная гроздь остаётся красной)
  function grapeImg(g){ return g.gold?goldImg:((g.sour && !(sourMode && !g.rare)) || (!g.sour && sourMode) ? purpleImg : greenImg); }
  // съеденное не исчезает мгновенно: за ~0,12 с уменьшается и «втягивается» в рот
  var EAT_MS=120;
  // «призрак» объекта, который уходит с поля: летит от (x,y) к (tx,ty), уменьшаясь
  function ghost(g,tx,ty){
    var e={x:g.x, y:g.y, tx:tx, ty:ty, t:0};
    if(g.rum){ e.h=g.r*2.3; e.w=e.h*(ready(rumImg)?rumImg.naturalWidth/rumImg.naturalHeight:0.55); e.img=rumImg; e.tint=null; }
    else { e.w=e.h=g.r*2.2; e.img=grapeImg(g); e.tint=g.rare?COL.rare:null; }
    return e;
  }
  function slurp(g){
    if(S.eaten.length>=6) S.eaten.shift();
    var b=heroBox();
    S.eaten.push(ghost(g,b.mouthX,b.mouthY));
  }
  // уход Кунки: всё с поля тает на месте, пальцы и мышь отпускают то, что держали
  function vanishAll(){
    for(var i=0;i<S.grapes.length;i++){ var e=ghost(S.grapes[i],S.grapes[i].x,S.grapes[i].y-18); e.dur=380; e.fade=true; S.eaten.push(e); }
    S.grapes=[]; activeTouches={}; mouseDrag=null;
  }

  function easeOut(t){ t=1-t; return 1-t*t*t; }   // быстрый старт, мягкая остановка
  // очки не должны всплывать под баннером («КУРАЖ ×2», «Уровень N») — сдвигаем их ниже него
  var BANNER_Y=0.32, BANNER_BELOW=96;
  function clearOfBanner(y){
    var by=H*BANNER_Y;
    return (y>by-50 && y<by+BANNER_BELOW) ? by+BANNER_BELOW : y;
  }
  // надписи, всплывшие почти одновременно и рядом, не должны налезать друг на друга:
  // новая опускается строкой ниже занятого места
  var FLOATER_GAP=40;
  function floater(x,y,t,c){
    if(S.floaters.length>=MAX_FLOATERS) S.floaters.shift();
    if(S.banner) y=clearOfBanner(y);
    ctx.font=FW+' 30px '+GAME_FONT;
    var w=ctx.measureText(t).width;
    for(var n=0;n<S.floaters.length;n++){
      for(var i=0;i<S.floaters.length;i++){
        var o=S.floaters[i];
        if(o.life<40) continue;   // уже поднялись выше — не мешают
        if(Math.abs(o.y-y)<FLOATER_GAP && Math.abs(o.x-x)<(o.w+w)/2){ y=o.y+FLOATER_GAP; break; }
      }
      if(i===S.floaters.length) break;
    }
    y=Math.min(y,H-DOCK_H-20);   // надписи не прячутся под нижнюю плашку
    S.floaters.push({x:x,y:y,t:t,c:c,w:w,life:60});
  }

  // ---- реплики персонажа (тексты — из темы) ----
  var LINES=T.lines;
  // force — важный момент (шторм, добыча, рекорд): говорит, даже если только что что-то сказал
  // обычные реплики — не чаще раза в 5 с; события (шторм, добыча, хватка, рекорд) говорятся всегда
  var SAY_GAP=5000;
  function say(kind,force){
    var arr=LINES[kind]; if(!arr||!arr.length)return;
    var now=Date.now();
    if(now<(S._sayHold||0)) return;   // фраза хватки объясняет механику — её не перебивают даже важные
    if(!force && S._sayT && now-S._sayT<SAY_GAP) return;
    S._sayT=now;
    // та же фраза два раза подряд не звучит
    var i=Math.floor(Math.random()*arr.length);
    if(arr.length>1 && arr[i]===S._sayLast) i=(i+1)%arr.length;
    S._sayLast=arr[i];
    S.bubble={t:arr[i], life:1600, max:1600};
  }
  function burst(x,y,color,n){
    n=n||8;
    for(var i=0;i<n;i++){
      if(S.particles.length>=MAX_PARTICLES) S.particles.shift();
      // капли разлетаются быстро и сразу начинают гаснуть — не зависают в воздухе
      var a=Math.random()*6.28,sp=2.2+Math.random()*4, lf=18+Math.random()*12;
      S.particles.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1.4,r:2+Math.random()*3,c:color,life:lf,max:lf});
    }
  }

  cv.addEventListener('touchstart',onTouchStart,{passive:false});
  cv.addEventListener('touchmove',onTouchMove,{passive:false});
  cv.addEventListener('touchend',onTouchEndCancel,{passive:false});
  cv.addEventListener('touchcancel',onTouchEndCancel,{passive:false});  // отмена касания (потеря фокуса)
  cv.addEventListener('mousedown',onMouseDown);
  cv.addEventListener('contextmenu',function(e){ e.preventDefault(); });
  cv.addEventListener('mousemove',onMouseMove);
  window.addEventListener('mouseup',onMouseUp);   // кнопку могут отпустить над панелью или за окном

  // ---- сцена проигрыша: персонаж задыхается, поднимается дым, потом таблица ----
  var death=null; // {t, puffs:[]}
  var _smokeSprite=null;
  var _ending=false;
  var _deathAlive=false;
  function startDeath(){
    if(_deathAlive) return;    // уже идёт — не плодим второй цикл (проверка ДО создания)
    death={t:0, dur:endKind==='leave'?2600:2800, puffs:[], leave:endKind==='leave'}; dockState();
    hideEdges();   // сцена смерти рисуется на холсте целиком, свечения поверх неё не нужны
    for(var i=0;i<36;i++){
      death.puffs.push({
        x:Math.random()*W,
        baseY:H+Math.random()*60,
        r:70+Math.random()*100,
        rise:0.10+Math.random()*0.10,
        sway:Math.random()*6.28,
        swaySpd:0.6+Math.random()*0.8,
        delay:Math.random()*900,
        seed:Math.random()
      });
    }
    deathLast=0;
    _deathAlive=true;
    buzz([120,80,260]);
    requestAnimationFrame(deathLoop);
  }
  var deathLast=0;
  function deathLoop(ts){
    if(!death){ _deathAlive=false; return; }
    if(!deathLast)deathLast=ts;
    var dt=ts-deathLast; deathLast=ts;
    if(dt>40)dt=40;            // защита от скачка после сворачивания телефона
    death.t+=dt;
    try{
      if(death.leave){
        drawLeave();
        if(death.t>=death.dur){ finishDeath(); return; }
        requestAnimationFrame(deathLoop); return;
      }
      ctx.clearRect(0,0,W,H);   // море и портрет — слои под холстом, здесь только дым
      var b=heroBox();
      var img=(ready(chokeImg)?chokeImg:heroImg);
      // плавное качание из стороны в сторону во время удушения
      var dshake=Math.max(0, 1-death.t/2400);
      placePortrait(img,b,0,Math.sin(death.t/130)*7*dshake,0);

      // тёмный мягкий дым — рисуем кешированный спрайт (красиво как градиент, быстро как картинка)
      var prog=Math.min(1,death.t/1900);
      if(!_smokeSprite){
        _smokeSprite=document.createElement('canvas');
        _smokeSprite.width=_smokeSprite.height=128;
        var sc2=_smokeSprite.getContext('2d');
        var sg=sc2.createRadialGradient(64,64,4,64,64,64);
        var sm=sourMode?COL.smokeEgg:COL.smoke;   // [центр, середина, край] — r,g,b
        sg.addColorStop(0,'rgba('+sm[0]+',0.85)');
        sg.addColorStop(0.5,'rgba('+sm[1]+',0.45)');
        sg.addColorStop(1,'rgba('+sm[2]+',0)');
        sc2.fillStyle=sg; sc2.fillRect(0,0,128,128);
      }
      ctx.save();
      for(var i=0;i<death.puffs.length;i++){
        var p=death.puffs[i];
        var lt=death.t-p.delay; if(lt<0) continue;
        var up=(lt/1000)*p.rise*H*1.6;
        var y=p.baseY - up;
        var x=p.x + Math.sin(p.sway+lt/700*p.swaySpd)*22;
        var alpha=Math.min(0.7, lt/700*0.7) * (0.7+0.3*p.seed);
        var rad=p.r*(1+lt/2600);
        ctx.globalAlpha=alpha;
        ctx.drawImage(_smokeSprite, x-rad, y-rad, rad*2, rad*2);
      }
      ctx.globalAlpha=1;
      ctx.restore();
      // лёгкое общее затемнение к концу (тёмное, в тон фона — края фото не выделяются)
      ctx.fillStyle='rgba(8,7,6,'+(prog*0.30)+')';
      ctx.fillRect(0,0,W,H);
      // затемнение в самом конце — плавный уход в таблицу
      var fadeOut=Math.max(0,(death.t-(death.dur-600))/600);
      if(fadeOut>0){ ctx.fillStyle='rgba(8,5,16,'+fadeOut+')'; ctx.fillRect(0,0,W,H); }
    }catch(err){
      if(window.console&&console.error) console.error('death scene error:',err);
      resize();
      finishDeath(); return;              // сбой отрисовки не должен оставить игрока без таблицы
    }
    if(death.t>=death.dur){ finishDeath(); return; }
    requestAnimationFrame(deathLoop);
  }
  // уход Кунки: портрет вприпрыжку уезжает за правый край, виноград замирает, экран гаснет
  function drawLeave(){
    var b=heroBox(), t=death.t;
    var p=Math.max(0,Math.min(1,(t-250)/1500)), e=p*p;   // трогается не сразу и разгоняется
    var walk=p>0 && p<1 ? 1 : 0;
    placePortrait(heroImg,b,Math.sin(t/110)*0.03*walk,e*(W-b.x+40),-Math.abs(Math.sin(t/110))*7*walk);
    // холст не очищаем — виноград остаётся там, где был; в конце плавный уход в таблицу
    var fadeOut=Math.max(0,(t-(death.dur-600))/600);
    if(fadeOut>0){ ctx.fillStyle='rgba(8,5,16,'+(fadeOut*0.25)+')'; ctx.fillRect(0,0,W,H); }
  }
  function finishDeath(){
    death=null; deathLast=0; _deathAlive=false; dockState();
    if(sourMode){
      leaveSourMode();
      bgm.pause();
      game.style.display='none'; document.body.classList.remove('ingame');
      refreshMenuBest();
      menu.style.display='flex'; setTimeout(function(){ menu.style.opacity='1'; },20);
    } else {
      showOverScreen();
    }
  }

  function showSubmitNote(t){
    var el=document.getElementById('submitNote'); el.textContent=t; el.style.display=t?'block':'none';
  }
  var resultShown=false;   // на экране результат партии (а не таблица из меню)
  function showOverScreen(){
    death=null; _deathAlive=false;
    resultShown=true;
    // вернуть элементы, которые могли быть скрыты режимом «только таблица»
    document.getElementById('overtitle').textContent=(endKind==='leave' && T.text.leave) ? T.text.leave : T.text.lose;
    document.getElementById('finsc').parentElement.style.display='';
    document.getElementById('overbest').style.display='';
    document.getElementById('again').style.display='';
    document.getElementById('finsc').textContent=S.score;
    _shareData={score:S.score,level:SESSION.level||S.level,rank:rank(S.score),purple:SESSION.purple||0,gold:SESSION.gold||0,mode:S.mode};
    prepareShare();
    // личный рекорд (обновлён в end())
    var be=document.getElementById('overbest');
    be.textContent = (newBest?(tr('newBest')+' '+best):(tr('best')+' '+best))+'  •  '+rank(best);
    be.classList.toggle('isnew',newBest);
    lastSubmitted=false;
    showSubmitNote('');
    document.getElementById('submitBox').style.display='flex';
    document.getElementById('submitScore').disabled=false;
    document.getElementById('submitScore').textContent=tr('submit');
    document.getElementById('board').style.display='';
    document.getElementById('shareBtn').style.display='';
    showDuelResult();
    document.getElementById('boardRows').innerHTML='<div class="bload">'+tr('loading')+'</div>';
    setBoardTitle();
    showBoard(savedName());
    over.style.display='flex';
    game.style.display='none';
  }

  // показ таблицы лидеров из меню (без формы записи и счёта)
  function showLeaderboardOnly(){
    resultShown=false;
    document.getElementById('overtitle').textContent=tr('lbTitle');
    document.querySelector('#over .fin').style.display='none';
    document.getElementById('overbest').style.display='none';
    document.getElementById('submitBox').style.display='none';
    showSubmitNote('');
    document.getElementById('again').style.display='none';
    document.getElementById('shareBtn').style.display='none';
    document.getElementById('duelResult').style.display='none';
    document.getElementById('rematch').style.display='none';
    document.getElementById('board').style.display='';
    document.getElementById('boardRows').innerHTML='<div class="bload">'+tr('loading')+'</div>';
    setBoardTitle();
    // спрятать все прочие экраны
    menu.style.display='none';
    document.getElementById('settings').style.display='none';
    document.getElementById('howto').style.display='none';
    document.getElementById('hold').style.display='none';
    game.style.display='none';
    over.style.display='flex';
    showBoard(savedName());
  }

  function end(){
    if(_ending)return;        // защита от повторного вызова
    _ending=true;
    if(S.ship){ S.ship=null; applyAudio(); }   // корабль приглушал музыку — возвращаем громкость
    duelOver();               // сопернику — итоговый счёт
    S.running=false;
    _loopAlive=false;
    document.body.classList.remove('ingame');
    document.body.removeAttribute('data-weather'); document.body.removeAttribute('data-event');
    // статистика Каюты — только за настоящие партии, пасхалка не считается
    if(statsOn()){
      // рекорд обновляем до проверки трофеев, иначе трофеи за очки открывались бы только после следующей партии
      newBest=S.score>best;
      if(newBest){ best=S.score; try{localStorage.setItem(KEY+'best',String(best));}catch(e){} }
      STATS.games++;
      if(S.level>STATS.bestLevel) STATS.bestLevel=S.level;
      if(S.mode==='hard' && S.score>STATS.bestHard) STATS.bestHard=S.score;
      saveStats();
      checkNewTrophies();
    }
    // сначала сцена смерти на игровом поле, потом таблица
    startDeath();
  }

  function update(dt){
    if(!S.running)return;
    var k=dt/16.667;   // анимации привязаны ко времени, а не к числу кадров
    var gc=chokableCount();
    if(gc!==S._gcShown){ document.getElementById('gcount').textContent=gc; S._gcShown=gc; }


    if(gc<4){
      // зелёных меньше 4 — угроза ещё не набралась
      S.greenFull=0;
      S.spawnT+=dt;
      // фиолетовые добычи — сверх поля: иначе несъеденная добыча занимала место зелёных, спавн вставал насовсем
      // и партия без игрока не кончалась никогда
      if(S.spawnT>S.spawnGap*(inRush()?RUSH_GAP:1) && !S.leaving && S.grapes.length-((hasRum()?1:0)+(hasGold()?1:0)+lootLeft())<8){
        S.spawnT=0;
        // «опасный» виноград душит персонажа, «съедобный» он ест. В пасхалке правила те же — меняются только цвета
        var badType='green', goodType='sour';
        var goodCap=4;
        var goodCount=sourCount();
        var greenChance=Math.min(0.64,0.45+S.level*0.012);
        if(gc<=1) greenChance=Math.min(0.78,greenChance+0.2);
        greenChance=Math.min(0.82, greenChance + (S.greenDry||0)*0.12);
        if(inRush()) greenChance=Math.min(0.82,greenChance+RUSH_GREEN);
        var grace=(S.rumGrace||0)>0 || !!S.loot || inCalm() || !!S.ship;   // после рома, во время добычи и в передышку зелёных нет
        var greenKillGrace=(S.greenKillCD||0)>0;
        var rollBad=rnd()<greenChance && !grace && !greenKillGrace;
        if(rollBad){
          spawn(badType); S.greenDry=0;
        } else if(goodCount<goodCap){
          spawn(goodType); S.greenDry=(S.greenDry||0)+1;
        } else if(!grace && !greenKillGrace){
          spawn(badType); S.greenDry=0;
        }
      }
    }else{
      // 4 зелёных накопилось — пошёл таймер до проигрыша
      if(!S.wasFull){ // момент входа в опасность — вспышка, тряска и фиксированное время до удушья
        S.chokeLimit=chokeWindow();
        S.shake=Math.max(S.shake||0,16);
        S.flash=1;
        SFX.warn(); buzz([80,60,80]);
        say('danger');
      }
      S.wasFull=true;
      S.greenFull=(S.greenFull||0)+dt;
      if(S.greenFull>S.chokeLimit){ end(); }
    }
    if(gc<4) S.wasFull=false;
    updateWave(dt);
    updateVolatile(dt,gc);
    updateShip(dt);
    updateWeather(dt,gc);
    updateLoot(dt,gc);
    if(S.greenKillCD>0) S.greenKillCD-=dt;
    if(S.rumGrace>0) S.rumGrace-=dt;   // тает передышка после рома
    if(S.kurazh>0) S.kurazh-=dt;       // тает кураж (x2 очки)
    if(S.grip>0) S.grip-=dt;           // тает «железная хватка»
    if(S.comboT>0){ S.comboT-=dt; if(S.comboT<=0) S.combo=0; }   // пауза дольше окна — серия сброшена
    // «Кунка ушёл»: говорит напоследок, новый виноград больше не появляется, потом уходит
    if(S.leaveT>0 && !S.leaving){
      S.leaveT-=dt;
      if(S.leaveT<=0){
        if(gc<4){ S._sayHold=0; say('leave',true); S._sayHold=Date.now()+LEAVE_SAY; S.leaving=LEAVE_SAY; vanishAll(); }
        else S.leaveT=4000;   // задыхается — не до прогулок, попробует позже
      }
    }
    if(S.leaving>0){ S.leaving-=dt; if(S.leaving<=0){ endKind='leave'; end(); return; } }

    // distress: нарастает когда зелёных 4 (персонажу плохо), плавно спадает иначе
    var target=(gc>=4)?1:0;
    S.distress += (target - S.distress) * Math.min(1, dt/220);
    if(gc>=4){
      warnSndT-=dt; if(warnSndT<=0){SFX.warn(); warnSndT=620;}
    }else{ warnSndT=0; }

    // золото — редкое. Не появляется в горячий момент (зелёных 3+), чтобы не мешать
    S.goldT=(S.goldT||0)+dt;
    S.goldPity=(S.goldPity||0)+dt;
    if(!hasGold() && gc<3 && !S.leaving){   // уходит — новый виноград не появляется
      if(S.goldPity>=35000){ spawnGold(); S.goldT=0; S.goldPity=0; }
      else if(S.goldT>3000){ S.goldT=0; if(rnd()<0.16){ spawnGold(); S.goldPity=0; } }
    } else if(hasGold()){ S.goldPity=0; }

    // редкая гроздь — со 2 уровня, примерно раз в полминуты (кроме момента, когда Кунка уже задыхается)
    S.rareT=(S.rareT||0)+dt;
    if(S.rareT>4000){
      S.rareT=0;
      if(S.level>=2 && gc<4 && !S.loot && !S.leaving && !hasRare() && rnd()<0.12) spawnRare();
    }

    // ром — бонус КУРАЖ (x2 очки). Появляется периодически, за ним охотишься.
    if(S.rumCD>0) S.rumCD-=dt;
    if(hasRum() || S.leaving){
      S.rumT=0;
    } else if(S.rumCD>0){
      // на перезарядке
    } else {
      S.rumT=(S.rumT||0)+dt;
      // появляется каждые ~11с (чуть быстрее если есть зелёная угроза — двойная польза)
      var need = gc>=2 ? 8000 : 11000;
      if(S.rumT>=need){
        spawnRum(); S.rumT=0; S.rumCD=4000;   // короткий кулдаун — ром заметная часть игры
      }
    }

    var storm=weatherPower('storm');
    var wave=storm>0 ? Math.sin(S.weather.t/520)*W*0.0068*storm : 0;   // общая волна, пикселей за кадр
    for(var i=S.grapes.length-1;i>=0;i--){
      var g=S.grapes[i];
      g.age=(g.age||0)+dt;
      if(g.fly){ flyStep(g,dt); continue; }
      if(wave && !g.held){ var q=clampPos(g.x+wave*k*(0.8+0.4*Math.sin(g.bob*0.5)),g.y,g.r); g.x=q[0]; g.y=q[1]; }
      if(!g.held){
        g.bob+=g.vb*k;
        // золото и ром исчезают по таймеру (пока их держат пальцем — нет)
        if(g.life>0){ g.life-=dt; if(g.life<=0){ S.grapes.splice(i,1); continue; } }
      }
      if(g.squashT>0)g.squashT-=dt;
      if(g.vol && !g.held){ g.vol.t+=dt; if(g.vol.t>=VOL_MS){ explode(g); continue; } }
    }
    // долетевшие съедаются отдельным проходом: ром убирает из массива зелёные, и индексы цикла выше съехали бы
    for(var fi=S.grapes.length-1;fi>=0;fi--){ var fg=S.grapes[fi]; if(fg && fg.fly && fg.fly.t>=fg.fly.dur) land(fg); }
    if(S.mouthOpen>0)S.mouthOpen-=dt/600;if(S.mouthOpen<0)S.mouthOpen=0;
    for(var pp=S.particles.length-1;pp>=0;pp--){
      var pt=S.particles[pp];
      pt.x+=pt.vx*k; pt.y+=pt.vy*k; pt.vy+=0.34*k; pt.vx*=Math.pow(0.97,k);
      pt.life-=k; if(pt.life<=0)S.particles.splice(pp,1);
    }
    for(var ei=S.eaten.length-1;ei>=0;ei--){ S.eaten[ei].t+=dt; if(S.eaten[ei].t>=(S.eaten[ei].dur||EAT_MS)) S.eaten.splice(ei,1); }
    for(var j=S.floaters.length-1;j>=0;j--){
      var f=S.floaters[j];
      f.life-=k;if(f.life<=0)S.floaters.splice(j,1);
    }
    if(S.shake>0){ S.shake*=Math.pow(0.731,k); if(S.shake<.5)S.shake=0; }
    if(S.flash>0) S.flash-=dt/400;
    if(S.banner){ S.banner.life-=dt; if(S.banner.life<=0){ S.banner=null; if(S.bannerQ.length) showBanner(S.bannerQ.shift()); } }
    if(S.bubble){ S.bubble.life-=dt; if(S.bubble.life<=0)S.bubble=null; }
  }

  function draw(){
    ctx.clearRect(0,0,W,H);   // море — отдельный слой под холстом
    var sx=0,sy=0;
    if(S.shake>0){sx=(Math.random()-.5)*S.shake;sy=(Math.random()-.5)*S.shake;}
    var st=sx||sy?'translate3d('+sx.toFixed(1)+'px,'+sy.toFixed(1)+'px,0)':'';
    if(layerEls.sea._st!==st){ layerEls.sea._st=st; layerEls.sea.style.transform=st; }   // море трясётся вместе с полем
    ctx.save();ctx.translate(sx,sy);

    var b=heroBox();
    var dis=S.distress||0; // 0..1 уровень страдания

    // лёгкое покачивание/дрожь персонажа, когда ему плохо
    var tilt = dis>0.02 ? Math.sin(Date.now()/90)*0.03*dis : 0;

    // выбор кадра: кричит когда ест ИЛИ когда задыхается (dis высок)
    var screaming = (S.mouthOpen>0) || (dis>0.5);
    var face=(screaming && ready(heroOpenImg))?heroOpenImg:heroImg;

    // портрет в рамке (медальон капитана) — свой слой, качается вокруг центра лица
    placePortrait(face,b,tilt,sx,sy);

    // тёмно-красная пульсирующая виньетка ТОЛЬКО по краям — сигнал опасности, смягчена
    var pulse=0.5+0.5*Math.sin(Date.now()/160);
    setEdge('danger', dis>0.04 && S.running ? 0.34*dis*(0.6+0.4*pulse) : 0);

    // виноградины
    var gripF=gripPower(), nowMs=Date.now();
    for(var i=0;i<S.grapes.length;i++){
      var g=S.grapes[i];
      var bobY=(g.held||g.fly)?0:Math.sin(g.bob)*5;
      // бутылка рома — спрайт
      if(g.rum){
        if(g.life>0 && g.life<900 && Math.floor(Date.now()/120)%2===0){ continue; }
        var rh=g.r*2.3, rw=rh*(ready(rumImg)?rumImg.naturalWidth/rumImg.naturalHeight:0.55);
        ctx.save();
        if(ready(rumImg)){
          ctx.drawImage(sprite(rumImg,rw,rh), g.x-rw/2, g.y-rh/2+bobY, rw, rh);
        }else{
          ctx.fillStyle=COL.bonusDark;ctx.beginPath();ctx.arc(g.x,g.y+bobY,g.r,0,6.28);ctx.fill();
        }
        ctx.restore();
        continue;
      }
      var img=grapeImg(g);
      var s=g.r*2.2;
      // зелёный уменьшается пропорционально нужным тычкам: от 1.0 до 0.45
      var shrink=1;
      if(!g.sour){
        var need=greenNeed(g);
        var prog=Math.min(1, g.hits/need);
        shrink=1 - prog*0.55;   // каждый клик заметно уменьшает, итог ~0.45
      }
      var squashX=1, squashY=1;
      if(g.squashT>0){var q=g.squashT/120; squashX=1+q*0.3; squashY=1-q*0.3;}
      var sw=s*shrink*squashX, sh=s*shrink*squashY;
      if(g.fly){ var fsc=1-0.25*Math.min(1,g.fly.t/g.fly.dur); sw*=fsc; sh*=fsc; }   // в полёте чуть уменьшается — «улетает» в рот
      // «поп» при появлении: рост от 0 с лёгким перелётом за ~220мс
      var pop=1;
      if(g.age!=null && g.age<260){
        var pt=g.age/260;
        pop = pt<0.7 ? (pt/0.7)*1.12 : (1.12-(pt-0.7)/0.3*0.12);
      }
      sw*=pop; sh*=pop;
      // мигание золота перед исчезновением
      if((g.gold||g.rare) && g.life>0 && g.life<800 && Math.floor(Date.now()/120)%2===0){ continue; }
      // мягкая тень под виноградом — добавляет объём
      if(!_shadow) _shadow=glowSprite('0,0,0',0);
      ctx.globalAlpha=0.38;
      ctx.drawImage(_shadow, g.x-sw*0.4, g.y+bobY+sh*0.42-sh*0.13, sw*0.8, sh*0.26);   // размытая, без чёткого края
      ctx.globalAlpha=1;
      if(ready(img)){
        if(g.gold){
          // дешёвое свечение без shadowBlur: полупрозрачный жёлтый круг
          var gp=0.5+0.3*Math.sin(g.bob*2);
          if(!_goldGlow) _goldGlow=glowSprite('255,215,90',0.2/0.75);
          ctx.globalAlpha=0.45*gp;
          ctx.drawImage(_goldGlow,g.x-sw*0.75,g.y+bobY-sw*0.75,sw*1.5,sw*1.5);
          ctx.globalAlpha=1;
        }
        var gx=g.x, vw=sw, vh=sh, vk=g.vol?Math.min(1,g.vol.t/VOL_MS):0;
        if(gripF && !g.sour && !g.fly) gx+=Math.sin(nowMs/38+g.bob*7)*1.6*gripF;   // хватка: зелёные мелко дрожат — видно, что они сейчас хрупкие
        if(vk){
          // взрывной: толчки, как сердцебиение, всё чаще (частота 6 → 22 рад/с); в последнюю секунду дрожит
          var vt=g.vol.t/1000, ph=6*vt+8*vt*vt/(VOL_MS/1000), beat=Math.pow(Math.max(0,Math.sin(ph)),3);
          var sw2=1+beat*(0.05+0.07*vk); vw*=sw2; vh*=sw2;
          if(vk>0.66) gx+=(Math.random()-0.5)*5*(vk-0.66)/0.34;
        }
        ctx.drawImage(sprite(img,s,s,g.rare?COL.rare:null),gx-vw/2,g.y-vh/2+bobY,vw,vh);
        // перезревает: поверх проступает бурый оттенок той же грозди
        if(vk){ ctx.globalAlpha=Math.min(1,vk*1.15); ctx.drawImage(volImg?sprite(volImg,s,s,null):sprite(img,s,s,VOL_TINT),gx-vw/2,g.y-vh/2+bobY,vw,vh); ctx.globalAlpha=1; }
      }else{
        ctx.beginPath();ctx.arc(g.x,g.y+bobY,g.r*shrink,0,6.28);
        ctx.fillStyle=g.gold?COL.gold:(g.sour?COL.goodDark:COL.badHit);ctx.fill();
      }
    }

    // съеденное втягивается в рот
    for(var ea=0;ea<S.eaten.length;ea++){
      var E=S.eaten[ea], ep=Math.min(1,E.t/(E.dur||EAT_MS)), es=E.fade?1-0.4*ep:1-0.8*ep;
      var ex=E.x+(E.tx-E.x)*ep, ey=E.y+(E.ty-E.y)*ep;
      if(!ready(E.img)) continue;
      ctx.globalAlpha=E.fade?1-ep:1-ep*0.6;
      ctx.drawImage(sprite(E.img,E.w,E.h,E.tint), ex-E.w*es/2, ey-E.h*es/2, E.w*es, E.h*es);
    }
    ctx.globalAlpha=1;

    drawShip();   // корабль-призрак идёт поверх винограда, брызги — поверх корабля

    // брызги-частицы
    for(var pc=0;pc<S.particles.length;pc++){
      var ptc=S.particles[pc];
      var pl=Math.max(0,ptc.life/ptc.max), pr=ptc.r*(0.5+0.5*pl);   // капля к концу уменьшается
      ctx.globalAlpha=pl*(2-pl);                                        // гаснет с самого начала, плавно
      ctx.drawImage(dropSprite(ptc.c), ptc.x-pr, ptc.y-pr, pr*2, pr*2);
    }
    ctx.globalAlpha=1;

    // всплывающий текст
    // плавно: размер меняется масштабом (а не целыми пикселями шрифта), подъём и исчезание — по кривой
    // крупный жирный шрифт, тёмная обводка и тень под ней — читается на любом фоне
    FLOAT_TEXT.font=GAME_FONT;
    for(var k=0;k<S.floaters.length;k++){
      var f=S.floaters[k];
      var fp=Math.min(1,Math.max(0,1-f.life/60));          // 0 → 1 за время жизни (~1 с)
      var fin=Math.min(1,fp/0.14);                           // появление
      var fsc=fp<0.14 ? 0.6+0.5*easeOut(fin) : 1.1-0.1*Math.min(1,(fp-0.14)/0.16);
      fsc+=Math.max(0,fp-0.3)*0.2;                           // к концу чуть растёт, как раньше
      var fa=fp<0.14 ? fin : (fp>0.55 ? Math.max(0,1-(fp-0.55)/0.45) : 1);
      ctx.globalAlpha=fa;
      drawText(textSprite(f.t,f.c,FLOAT_TEXT), f.x, f.y-38*easeOut(fp)-10*fsc, fsc);   // -10: центр надписи над базовой линией
    }
    ctx.globalAlpha=1;
    ctx.restore();

    // пузырь реплики персонажа — на груди спрайта, не на лице
    if(S.bubble && S.running){
      var bb=S.bubble;
      var bAl=Math.min(1, (bb.life>bb.max-200)?(bb.max-bb.life)/200:bb.life/300);
      var kb=heroBox();
      var bh=32;
      var bx=kb.mouthX, by=kb.y + kb.h*T.face.bubbleY/(kb.crop||1);  // зона лба / над бровями
      // не давать пузырю налезать на верхний интерфейс (пауза/счёт): держим ниже HUD
      var minCenter=72 + bh/2;
      if(by<minCenter) by=minCenter;
      var bs=bubbleSprite(bb.t,bh);
      ctx.globalAlpha=Math.max(0,Math.min(1,bAl));
      ctx.drawImage(bs.c, bx-bs.w/2, by-bs.ty, bs.w, bs.h);   // строка текста — на высоте by
      ctx.globalAlpha=1;
    }

    // красная вспышка опасности — радиальная (только по краям, центр чист),
    // чтобы не подсвечивать прямоугольные границы портрета
    setEdge('flash', S.flash>0 ? S.flash*0.55 : 0);

    // золотое свечение по краям во время КУРАЖА (x2 очки)
    if(S.kurazh>0){
      var kpulse=0.6+0.4*Math.sin(Date.now()/180);
      var ka=Math.min(1,S.kurazh/6000);
      setEdge('kurazh', S.running ? 0.35*ka*kpulse : 0);
    }

    if(!(S.kurazh>0)) setEdge('kurazh',0);

    // полоски таймеров снизу: кураж (x2 очки) и над ним «железная хватка» — убывают со временем
    if(S.kurazh>0) timerBar(0, S.kurazh/6000, COL.kurazhBar||COL.gold);
    if(S.grip>0) timerBar(S.kurazh>0?1:0, S.grip/GRIP_MS, COL.gripBar);

    // центральный баннер (уровень)
    if(S.banner){
      var bl=S.banner;
      var t=1-(bl.life/bl.max);  // 0..1 от появления к концу
      // прозрачность: быстрый вход (0-0.2), плавный выход (0.6-1.0)
      var al;
      if(t<0.2) al=t/0.2;
      else if(t>0.6) al=Math.max(0,1-(t-0.6)/0.4);
      else al=1;
      // лёгкий подъём вверх по ходу анимации и мягкий «поп» при появлении
      var bnY=H*BANNER_Y - easeOut(t)*22;
      var bnSc=t<0.2 ? 0.86+0.14*easeOut(t/0.2) : 1;
      // размер шрифта подбирается один раз на баннер, чтобы текст влез по ширине экрана
      if(!bl.px){
        ctx.font=FW+' 42px '+GAME_FONT;
        var bnTw=ctx.measureText(bl.t).width, maxW=W*0.86;
        bl.px=bnTw>maxW ? Math.max(20, Math.floor(42*maxW/bnTw)) : 42;
      }
      BANNER_TEXT.px=bl.px; BANNER_TEXT.font=GAME_FONT;
      ctx.globalAlpha=Math.max(0,al);
      drawText(textSprite(bl.t,bl.c,BANNER_TEXT), W/2, bnY, bnSc);
      ctx.globalAlpha=1;
    }
  }

  var _loopAlive=false;
  function startLoop(){ if(_loopAlive)return; _loopAlive=true; S.last=0; requestAnimationFrame(loop); }
  // телефон не держит плавность в повышенном разрешении (в среднем меньше ~45 кадров/с
  // за 2 секунды партии) — до конца сессии рисуем в обычном, как раньше
  var fpsT=0, fpsN=0;
  function watchFps(dt){
    if(DPR<=1 || dt>100) return;   // скачок после паузы или сворачивания не в счёт
    fpsT+=dt; fpsN++;
    if(fpsT<2000) return;
    // спрайты и надписи в прежнем разрешении больше не понадобятся (ключи кеша с DPR) — отпускаем память
    // новое разрешение прогреваем так же, по кусочку за кадр (картинки уже распакованы — это быстро)
    if(fpsT/fpsN>22){ DPR_MAX=1; resize(); _portraitCache={}; _spriteCache={}; _textCache={}; _textCount=0; warmQ=warmList(); }
    fpsT=0; fpsN=0;
  }
  function loop(ts){
    var f0=performance.now();   // начало работы кадра — прогрев берёт только остаток
    dockState();
    if(!S.last)S.last=ts;
    var dt=ts-S.last;S.last=ts;
    if(S.running) watchFps(dt);
    if(dt>100)dt=16;            // защита от скачка после паузы/сворачивания
    try{
      if(countdown){
        countdown.t+=dt;
        draw();
        drawCountdown();
        if(!countdown.warm){ countdown.warm=true; warmQ=warmList(); }
        warmStep(f0,true);
        if(countdown.t>=900){ countdown.n--; countdown.t=0;
          if(countdown.n<=0){
            countdown=null; S.running=true;
            if(rotated()) togglePause();   // телефон повернули во время отсчёта - поле закрыто заставкой
          }
        }
        requestAnimationFrame(loop);
        return;
      }
      update(dt);draw();
      if(warmQ.length) warmStep(f0);
    }catch(err){
      if(window.console&&console.error) console.error('loop error:',err);
      resize();   // сбрасывает незакрытые save()/translate упавшего кадра
    }
    if(S.running && game.style.display!=='none'){ requestAnimationFrame(loop); }
    else { _loopAlive=false; }
  }
  // ---- прогрев кешей во время отсчёта: первая отрисовка картинки — это её распаковка (на слабом телефоне
  // десятки мс), и без прогрева она приходилась на первый съеденный виноград, первое золото, первую опасность.
  // Готовим заранее то же самое, что игра нарисует потом, по кусочку за кадр ----
  function warmList(){
    var q=[], b=heroBox();
    [heroOpenImg,chokeImg].forEach(function(img){ q.push(function(){ portraitLayer(img,b); }); });   // кадр не загрузился — portraitLayer сам рисует только рамку
    function sizes(img,r0,r1,k,tint){   // все размеры, которые даст случайный радиус r0..r1 (спрайт сам откидывает повторы)
      if(!ready(img)) return;
      for(var r=r0;r<=r1;r+=0.5) (function(r){ q.push(function(){ var h=r*k; sprite(img,img===rumImg?h*img.naturalWidth/img.naturalHeight:h,h,tint); }); })(r);
    }
    sizes(purpleImg,40,48,2.2); sizes(greenImg,40,48,2.2);
    sizes(goldImg,44,50,2.2); sizes(rumImg,46,50,2.3); sizes(purpleImg,62,66,2.2,COL.rare);
    q.push(function(){ if(!_shadow) _shadow=glowSprite('0,0,0',0); if(!_goldGlow) _goldGlow=glowSprite('255,215,90',0.2/0.75); });
    [COL.good,COL.bad,COL.badHit,COL.gold,COL.bonus,COL.gripBar].forEach(function(c){ q.push(function(){ dropSprite(c); }); });
    ['danger','flash','kurazh'].forEach(function(n){ q.push(function(){ edgeLayer(n); }); });
    if(S.shipWarm) q.push(prepShipSnd, warmShip);   // очередь пересобрали, а корабль уже был нужен
    // самые частые всплывающие очки: фиолетовый и золото (цвета — как в endDrag)
    [['+10',sourMode?COL.counter:COL.goodText],['+50',COL.gold]].forEach(function(t){ q.push(function(){ textSprite(t[0],t[1],FLOAT_TEXT); }); });
    return q;
  }
  // в остаток кадра: пока с начала кадра f0 прошло меньше 8 мс (одна распаковка может быть и дольше — она одна).
  // На отсчёте хотя бы один кусочек за кадр, иначе на медленном телефоне прогрев не успел бы вовсе
  var warmQ=[];
  function warmStep(f0,one){
    if(one && warmQ.length) warmQ.shift()();
    while(warmQ.length && performance.now()-f0<8) warmQ.shift()();
  }
  // картинки цифр отсчёта
  var cdImg={'1':themeImg(T.images.countdown[0]),'2':themeImg(T.images.countdown[1]),'3':themeImg(T.images.countdown[2])};

  // ---- загрузка картинок: на медленном интернете партия не начинается с пустым полем ----
  // «Играть» ждёт, пока картинки загрузятся (или не загрузятся — тогда есть запасная отрисовка);
  // из кеша это мгновенно, надпись «Загрузка…» появляется, только если ждать заметно, а при зависшей сети — не дольше 15 с
  var gameImgs=[heroImg,heroOpenImg,chokeImg,purpleImg,greenImg,goldImg,rumImg,seaBg,cdImg['1'],cdImg['2'],cdImg['3']];
  // версия внизу настроек: игра и, если открыта в приложении для Android, версия приложения
  (function(){ var v=document.getElementById('verLine'), m=/KunkkaApp(?:\/([\d.]+))?/.exec(navigator.userAgent);
    if(v) v.textContent='v'+CFG.version+(m?' · Android '+(m[1]||'1.0'):''); })();
  var assetsLoaded=false, onAssets=[];
  // экран загрузки: полоса растёт по мере загрузки картинок; меню открывается целиком, когда готовы
  // картинки, фон меню и шрифты (не дольше 4 с — дальше меню с «Загрузка…» на кнопке «Играть»)
  (function(){
    var ld=document.getElementById('loader'); if(!ld) return;
    var bar=ld.querySelector('i'), t0=Date.now(), fontsOk=false, imgs=gameImgs.slice();
    // все картинки темы (и «Залпа», и рамки, и медалей) и всё, что подключает css темы
    (function walk(o){ for(var k in o){ var v=o[k]; if(typeof v==='string'){ if(/\.(png|jpe?g|webp|gif|svg)$/i.test(v)) imgs.push(themeImg(v)); } else if(v && typeof v==='object') walk(v); } })(T.images);
    try{ [].forEach.call(document.styleSheets,function(sh){ var r; try{ r=sh.cssRules; }catch(e){ return; }
      [].forEach.call(r||[],function(ru){ var re=/url\("?([^")]+\.(?:png|jpe?g|webp))"?\)/g, m, tx=ru.cssText||'';
        while((m=re.exec(tx))){ var mi=new Image(); mi.src=new URL(m[1],sh.href||location.href).href; imgs.push(mi); } }); }); }catch(e){}
    try{
      var cs=getComputedStyle(document.documentElement), ft=cs.getPropertyValue('--font-text').trim(), fg=cs.getPropertyValue('--font-game').trim();
      Promise.all([ document.fonts.load('400 16px '+ft,'Аа'), document.fonts.load('700 16px '+ft,'Аа'), document.fonts.load('16px '+fg,'Аа') ])
        .then(function(){ fontsOk=true; },function(){ fontsOk=true; });
    }catch(e){ fontsOk=true; }
    (function tick(){
      var n=0; for(var i=0;i<imgs.length;i++) if(imgs[i].complete) n++;
      bar.style.width=Math.round(100*n/imgs.length)+'%';
      if((fontsOk && n===imgs.length) || Date.now()-t0>12000){
        ld.classList.add('done'); setTimeout(function(){ if(ld.parentNode) ld.parentNode.removeChild(ld); },350);
        return;
      }
      setTimeout(tick,60);
    })();
  })();
  function whenLoaded(cb){ if(assetsLoaded) cb(); else onAssets.push(cb); }
  (function(){
    var btn=document.getElementById('play'), label=btn.textContent, t0=Date.now();
    (function check(){
      if(gameImgs.every(function(i){ return i.complete; }) || Date.now()-t0>15000){
        assetsLoaded=true; btn.textContent=label; btn.classList.remove('loading');
        onAssets.splice(0).forEach(function(cb){ cb(); });
        return;
      }
      if(Date.now()-t0>300){ btn.textContent=tr('loadingBtn'); btn.classList.add('loading'); }
      setTimeout(check,100);
    })();
  })();
  function drawCountdown(){
    ctx.save();
    ctx.fillStyle='rgba(14,8,3,0.7)';ctx.fillRect(0,0,W,H);
    var p=Math.min(1,countdown.t/900);
    var cx=W/2, cy=H*0.42;
    var label=countdown.n>0?String(countdown.n):'';
    if(!label){ ctx.restore(); return; }

    var pop = p<0.16 ? (0.82+0.18*(p/0.16)) : 1;
    var alpha = p>0.86 ? (1-(p-0.86)/0.14) : 1;
    ctx.globalAlpha=Math.max(0,Math.min(1,alpha));

    var img=cdImg[label];
    var size=Math.round(190*pop);   // высота цифры на экране
    if(img && ready(img)){
      ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
      ctx.drawImage(img, cx-size/2, cy-size/2, size, size);
    } else {
      // запасной вариант, пока картинка грузится
      ctx.font='bold '+Math.round(150*pop)+'px Georgia,serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle='#e0b03f'; ctx.fillText(label, cx, cy);
    }
    ctx.globalAlpha=1;
    ctx.restore();
  }

  // звание по личному рекорду
  // пороги званий; названия — из темы
  var RANKS=[0,30,80,160,280,450,680,1000,1500,2200,3200].map(function(s,i){ return {n:T.ranks[i],s:s}; });
  function rank(score){
    var r=RANKS[0].n;
    for(var i=0;i<RANKS.length;i++) if(score>=RANKS[i].s) r=RANKS[i].n;
    return r;
  }
  function rankProgress(score){
    var cur=RANKS[0], nxt=null;
    for(var i=0;i<RANKS.length;i++){
      if(score>=RANKS[i].s){ cur=RANKS[i]; nxt=RANKS[i+1]||null; }
    }
    if(!nxt) return {name:cur.n, pct:100, next:null, need:0};
    var pct=Math.round((score-cur.s)/(nxt.s-cur.s)*100);
    return {name:cur.n, pct:Math.max(0,Math.min(100,pct)), next:nxt.n, need:nxt.s};
  }
  // ---- трофеи ---- (пороги под текущую сложность; названия — из темы)
  // cur — текущее значение, goal — порог; прогресс показывается на закрытых трофеях
  var TROPHIES=[
    {id:'first', name:T.trophies.first, goal:1, cur:function(){return STATS.games;}},
    {id:'games25', name:T.trophies.games25, goal:25, cur:function(){return STATS.games;}},
    {id:'games100', name:T.trophies.games100, goal:100, cur:function(){return STATS.games;}},
    {id:'p500',  name:T.trophies.p500, goal:500, cur:function(){return STATS.purple;}},
    {id:'p2500', name:T.trophies.p2500, goal:2500, cur:function(){return STATS.purple;}},
    {id:'g30',   name:T.trophies.g30, goal:30, cur:function(){return STATS.gold;}},
    {id:'g150',  name:T.trophies.g150, goal:150, cur:function(){return STATS.gold;}},
    {id:'green500',name:T.trophies.green500, goal:500, cur:function(){return STATS.green;}},
    {id:'rum30', name:T.trophies.rum30, goal:30, cur:function(){return STATS.rum;}},
    {id:'score500',  name:T.trophies.score500, goal:500, cur:function(){return best;}},
    {id:'score1000', name:T.trophies.score1000, goal:1000, cur:function(){return best;}},
    {id:'score2000', name:T.trophies.score2000, goal:2000, cur:function(){return best;}},
    {id:'hard500', name:T.trophies.hard500, goal:500, cur:function(){return STATS.bestHard;}},
    {id:'hard1200',name:T.trophies.hard1200, goal:1200, cur:function(){return STATS.bestHard;}},
    {id:'seawolf', name:T.trophies.seawolf, goal:3200, cur:function(){return best;}}
  ];
  TROPHIES.forEach(function(t){ t.test=function(){ return t.cur()>=t.goal; }; });
  function refreshMenuBest(){
    var el=document.getElementById('menuBest');
    if(el) el.textContent = best>0 ? (tr('best')+' '+best+'  •  '+rank(best)) : '';
  }
  refreshMenuBest();

  // обратный отсчёт перед стартом
  var countdown=null, starting=false;
  function start(){
    if(starting) return;        // двойное нажатие «Играть» не запускает партию дважды
    starting=true;
    ac(); acResume();
    menu.style.opacity='0';
    menu.style.pointerEvents='none';   // гаснущее меню не нажимается — иначе игра запустится под другим экраном
    reset();
    lbStartSession();
    S.running=false;            // пауза на время отсчёта
    // плавное нарастание музыки до выбранной громкости
    bgm.volume=0; bgm.currentTime=0; applyAudio(); bgm.play().catch(function(){});
    bgm.volume=0;   // фейд начнём с нуля
    var tv=0; var fadeMus=setInterval(function(){
      tv+=0.06; if(tv>=musicVol){ tv=musicVol; clearInterval(fadeMus); }
      try{ bgm.volume=musicOn?tv:0; }catch(e){}
    },60);
    countdown=null;             // отсчёт стартует после ухода меню
    // ждём, пока меню плавно угаснет, и только потом показываем поле и отсчёт
    setTimeout(function(){
      starting=false;
      menu.style.display='none'; menu.style.opacity='1'; menu.style.pointerEvents='';
      over.style.display='none';
      game.style.display='block';
      document.body.classList.add('ingame');
      paused=false; var po=document.getElementById('pauseOverlay'); if(po)po.style.display='none';
      document.getElementById('pause').textContent='II';
      countdown={n:3,t:0};
      _loopAlive=false;
      startLoop();
    }, 560);
  }
  document.getElementById('play').onclick=function(){ if(starting || !assetsLoaded) return; leaveSourMode(); start(); };

  // ---- онлайн-дуэль: комната на двоих через Supabase Realtime (broadcast + presence, без таблиц в базе).
  // Хозяин (кто зашёл первым) выбирает режим и жмёт «Начать» — обоим приходит одно зерно, и партия у обоих
  // одинаковая; счёт соперника идёт в HUD вживую, в конце — победа или поражение и реванш.
  // Протокол Phoenix тот же, что у supabase-js, только без библиотеки ----
  var duelScr=document.getElementById('duelScr');
  var ROOM_ABC='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var myId=Math.random().toString(36).slice(2,10);   // на эту вкладку: две вкладки одного игрока — разные участники комнаты
  // постоянный ID игрока (невидимая учётка на устройстве): по нему, а не по нику, считается счёт встреч
  function devHash(s,k){ var h=2166136261^k; for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
  var myPid=(function(){
    var v=''; try{ v=localStorage.getItem(KEY+'pid')||''; }catch(e){}
    if(!/^[a-z0-9]{12}$/.test(v)){
      // приложение для Android: ID от постоянного ID устройства, тот же после переустановки
      // (иначе друзья зовут пушем прежний ID, у которого нет подписки)
      var dev=''; try{ dev=window.KunkkaPush && KunkkaPush.deviceId ? String(KunkkaPush.deviceId()||'') : ''; }catch(e){}
      v=''; for(var i=0;i<12;i++) v+='abcdefghijklmnopqrstuvwxyz0123456789'[dev ? devHash(dev,i)%36 : Math.floor(Math.random()*36)];
      try{ localStorage.setItem(KEY+'pid',v); }catch(e){}
    }
    return v;
  })();
  var room=null;   // {code, ws, ref, players:{id:meta}, t, mode, opp:{score,level,done,playing}, meReady, oppReady}
  function rtUrl(){ return CFG.supabase.url.replace(/^http/,'ws')+'/realtime/v1/websocket?apikey='+encodeURIComponent(CFG.supabase.key)+'&vsn=1.0.0'; }
  function rtSend(event,payload,topic){
    if(!room || !room.ws || room.ws.readyState!==1) return;
    room.ws.send(JSON.stringify({topic:topic||room.topic,event:event,payload:payload,ref:String(++room.ref)}));
  }
  function bcast(ev,data){ data.id=myId; rtSend('broadcast',{type:'broadcast',event:ev,payload:data}); }
  function duelNote(k){ document.getElementById('duelNote').textContent=k?tr(k):''; }
  function myName(){ return lbClean(document.getElementById('dname').value)||savedName(); }
  // игроки комнаты по времени входа: первые двое играют, первый — хозяин
  function roster(){
    var a=[]; for(var id in room.players) a.push(room.players[id]);
    return a.sort(function(x,y){ return (y.c-x.c)||(x.t-y.t)||(x.id<y.id?-1:1); }).slice(0,2);
  }
  function oppMeta(){ var r=roster(); for(var i=0;i<r.length;i++) if(r[i].id!==myId) return r[i]; return null; }
  function isHost(){ var r=roster(); return !r.length || r[0].id===myId; }
  function oppName(){ var o=oppMeta(); return (o && o.name) || (room && room.oppName) || '?'; }
  // presence у Supabase доходит с задержкой в пару секунд, поэтому о себе ещё и сразу сообщаем broadcast'ом «hi»:
  // список игроков собирается из обоих источников, а presence нужен, чтобы узнать об обрыве связи
  function myMeta(){ return {id:myId,pid:myPid,name:myName(),t:room.t,v:CFG.version,mode:room.mode,c:room.creator?1:0}; }
  function track(){
    room.players[myId]=myMeta();
    rtSend('presence',{type:'presence',event:'track',payload:myMeta()});
  }
  function hello(reply){ var m=myMeta(); m.reply=reply?1:0; bcast('hi',m); }

  function joinRoom(code){
    code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4);
    if(!myName()){ duelNote('needName'); return; }
    try{ localStorage.setItem(KEY+'name',myName()); }catch(e){}
    leaveRoom();
    room={code:code, topic:'realtime:'+KEY+'-room-'+code, ref:0, players:{}, t:Date.now(), mode:difficulty,
          opp:{score:0,level:1,done:false,playing:false}, meReady:false, oppReady:false};
    var r=room;
    duelNote('connecting');
    try{ r.ws=new WebSocket(rtUrl()); }catch(e){ room=null; duelNote('noConn'); return; }
    r.timer=setTimeout(function(){ if(room===r && !r.joined){ leaveRoom(); duelNote('noConn'); } },8000);
    r.ws.onopen=function(){
      if(room!==r) return;
      rtSend('phx_join',{config:{broadcast:{self:false,ack:false},presence:{key:myId,enabled:true},private:false}});
      r.joinRef=String(r.ref);
      r.hb=setInterval(function(){ rtSend('heartbeat',{},'phoenix'); },25000);
    };
    r.ws.onmessage=function(e){ if(room===r) onRt(JSON.parse(e.data)); };
    r.ws.onclose=function(){
      if(room!==r) return;
      leaveRoom(); duelNote(r.joined?'lostConn':'noConn'); paintRoom(); paintOpp();
    };
    showDuelScr('lobby');
  }
  function leaveRoom(){
    var r=room; if(!r) return;
    if(r.joined){ forfeit(); bcast('bye',{}); }
    room=null; duel=null;
    clearTimeout(r.timer); clearInterval(r.hb);
    try{ r.ws.onclose=null; r.ws.close(); }catch(e){}
    syncListing();
  }
  function onRt(m){
    var p=m.payload||{};
    if(m.event==='phx_reply' && m.ref===room.joinRef){
      if(p.status!=='ok'){ leaveRoom(); duelNote('noConn'); paintRoom(); return; }
      room.joined=true; clearTimeout(room.timer); duelNote(''); track(); hello(false); onRoster(); return;
    }
    if(m.event==='presence_state'){ addPres(p); }   // не сбрасываем: снимок бывает запоздалым и пустым
    else if(m.event==='presence_diff'){ for(var k in (p.leaves||{})) delete room.players[k]; addPres(p.joins||{}); }   // перетрек приходит как уход+вход: сначала уходы
    else if(m.event==='broadcast'){ onMsg(p.event,p.payload||{}); }
  }
  function addPres(obj){
    for(var k in obj){ var ms=obj[k].metas||[]; if(ms.length) room.players[k]=ms[ms.length-1]; }
    onRoster();
  }
  function onRoster(){
    var r=roster(), inRoom=r.some(function(x){ return x.id===myId; });
    if(room.players[myId] && !inRoom){ leaveRoom(); duelNote('roomFull'); paintRoom(); return; }   // опоздал: уже двое
    var o=oppMeta();
    if(o){ room.oppName=o.name; if(o.v!==CFG.version) duelNote('oldVer'); }
    else if(room.hadOpp){
      if(room.duelOpp && !room.opp.done) room.opp.left=true;   // ушёл посреди партии
      room.opp.done=true; room.opp.playing=false; room.oppReady=false; duelNote('oppLeft'); settle();
    }
    room.hadOpp=!!o;
    // режим задаёт хозяин
    var h=r[0]; if(h && h.id!==myId && h.mode) room.mode=h.mode;
    paintRoom(); paintOpp(); showDuelResult(); syncListing();
    if(o && isHost()) maybeStart();
  }
  function onMsg(ev,d){
    if(d.id===myId) return;
    if(ev==='hi'){
      room.players[d.id]={id:d.id,pid:/^[a-z0-9]{12}$/.test(d.pid||'')?d.pid:'',name:lbClean(d.name||''),t:+d.t||0,v:d.v,mode:d.mode==='hard'?'hard':'normal',c:d.c?1:0};
      if(!d.reply) hello(true);   // вошедший ждёт ответа всегда: presence мог уже рассказать о нём нам, но не о нас — ему
      onRoster(); return;
    }
    if(ev==='bye'){ delete room.players[d.id]; onRoster(); return; }
    var o=oppMeta(); if(!o || d.id!==o.id) return;
    if(ev==='start'){ startDuel(d.seed>>>0, d.mode==='hard'?'hard':'normal'); }
    else if(ev==='tick'){ room.opp.score=d.s|0; room.opp.level=d.l|0; room.opp.playing=true; paintOpp(); showDuelResult(); }
    else if(ev==='over'){
      room.opp.score=d.s|0; room.opp.done=true; room.opp.playing=false; if(d.q && !room.counted) room.opp.left=true;
      settle(); paintOpp(); showDuelResult(); paintRoom();
      if(duel && S.running && !_ending){
        if(S.score>room.opp.score){ room.leadShown=true; banner(tr('youLead'),COL.gold,1600); }
        else banner(tr('oppOutBanner',{n:oppName(),s:room.opp.score}),COL.gold,1800);
      }
    }
    else if(ev==='ready'){ room.oppReady=true; maybeStart(); }
    else if(ev==='emo'){ var t=emoText(d.k|0); if(t && !S.running) duelToast(oppName()+': '+t); }   // в партии не отвлекаем
  }
  // реванш: оба нажали — хозяин запускает
  function maybeStart(){ if(room && isHost() && room.meReady && room.oppReady) hostStart(); }
  function hostStart(){
    if(!room || !oppMeta() || room.opp.playing) return;
    var seed=(Math.random()*4294967296)>>>0;
    bcast('start',{seed:seed,mode:room.mode});
    startDuel(seed,room.mode);
  }
  function startDuel(seed,mode){
    if(!room) return;
    if(starting){ setTimeout(function(){ startDuel(seed,mode); },200); return; }   // меню ещё гаснет
    duel={seed:seed,mode:mode};
    syncListing();
    difficulty=mode; paintDiff();
    room.opp={score:0,level:1,done:false,playing:true}; room.meReady=room.oppReady=false; room.leadShown=false; room.counted=false;
    room.duelOpp=oppMeta(); room.meDone=false; h2hName(room.duelOpp);   // с кем идёт встреча: счёт пишется, даже если он уйдёт
    duelNote('');
    // из любого экрана — в партию
    duelScr.style.display='none'; over.style.display='none';
    death=null; _deathAlive=false; resultShown=false; dockState();
    if(game.style.display!=='none'){ S.running=false; countdown=null; _loopAlive=false; game.style.display='none'; }
    menu.style.display='flex'; leaveSourMode(); whenLoaded(start);
  }
  // счёт — сопернику, пока идёт партия
  setInterval(function(){
    if(!(room && duel && S.running && !_ending)) return;
    bcast('tick',{s:S.score,l:S.level});
    // соперник уже выбыл, а ты его обошёл — победа в кармане
    if(room.opp.done && !room.leadShown && S.score>room.opp.score){ room.leadShown=true; banner(tr('youLead'),COL.gold,1600); }
  },400);
  function duelOver(){ if(room && duel){ bcast('over',{s:S.score}); room.meDone=true; room.myScore=S.score; settle(); } }
  // итог встречи в счёт: оба доиграли — по очкам (ничья итог, но не в счёт), соперник бросил — победа
  function settle(){
    var r=room; if(!r || !r.duelOpp || r.counted) return;
    if(r.opp.left){ r.counted=true; h2hAdd(r.duelOpp,true); return; }
    if(!r.meDone || !r.opp.done) return;
    var d=r.myScore-r.opp.score; r.counted=true;
    if(d!==0) h2hAdd(r.duelOpp,d>0);
  }
  // ушёл посреди своей партии (вышел из комнаты, бросил партию, закрыл игру) — поражение, соперник получает победу
  function forfeit(){
    var r=room; if(!r || !r.duelOpp || r.counted || r.meDone) return;
    bcast('over',{s:S.score,q:1}); r.counted=true; h2hAdd(r.duelOpp,false);
  }
  window.addEventListener('pagehide',function(){ forfeit(); });

  // ---- счёт встреч с каждым соперником: хранится на телефоне по его постоянному ID — ник можно менять ----
  function h2hKey(p){ return p ? (p.pid || (p.name?'@'+String(p.name).toLowerCase():'')) : ''; }
  function h2hAll(){ try{ return JSON.parse(localStorage.getItem(KEY+'h2h')||'{}')||{}; }catch(e){ return {}; } }
  function h2h(p){ var r=h2hAll()[h2hKey(p)]; return r&&r.length===2?r:[0,0]; }
  function h2hAdd(p,win){
    var all=h2hAll(), k=h2hKey(p); if(!k) return;
    var r=all[k]||[0,0]; r[win?0:1]++; all[k]=r;
    try{ localStorage.setItem(KEY+'h2h',JSON.stringify(all)); }catch(e){}
    h2hName(p);
  }
  // имя соперника для списка "Играли раньше" (зовём его пушем, когда его нет в сети)
  function h2hName(p){
    if(!p || !p.pid || !p.name) return;
    var nm=h2hNames(); nm[p.pid]=String(p.name).slice(0,12);
    var ts=h2hTimes(); ts[p.pid]=Date.now();
    try{ localStorage.setItem(KEY+'h2hn',JSON.stringify(nm)); localStorage.setItem(KEY+'h2ht',JSON.stringify(ts)); }catch(e){}
  }
  function h2hTimes(){ try{ return JSON.parse(localStorage.getItem(KEY+'h2ht')||'{}')||{}; }catch(e){ return {}; } }
  function h2hNames(){ try{ return JSON.parse(localStorage.getItem(KEY+'h2hn')||'{}')||{}; }catch(e){ return {}; } }
  function paintOpp(){
    var el=document.getElementById('oppPlate');
    var on=!!(room && duel);
    el.classList.toggle('on',on); if(!on) return;
    el.classList.toggle('done',room.opp.done);
    el.textContent=oppName()+': '+room.opp.score+(room.opp.done?' · '+tr('oppOut'):'');
  }
  function paintRoom(){
    if(!room){ duelScr.classList.remove('lobby'); duelScr.classList.add('home'); return; }   // связь пропала — назад к входу
    document.getElementById('roomCodeBig').textContent=room.code;
    var r=roster(), html='';
    for(var i=0;i<2;i++){
      var p=r[i];
      if(!p){ html+='<div class="rp wait">'+tr('waitOpp')+'</div>'; continue; }
      var tag=(p.id===myId?tr('you'):'')+(i===0?(p.id===myId?' · ':'')+tr('host'):'');
      if(p.id!==myId){ var hh=h2h(p); if(hh[0]+hh[1]) tag=hh[0]+'-'+hh[1]+(tag?' · '+tag:''); }
      html+='<div class="rp"><span></span><small>'+tag+'</small></div>';
    }
    var box=document.getElementById('roomPlayers'); box.innerHTML=html;
    var spans=box.querySelectorAll('.rp span');   // имена — только текстом
    for(var j=0;j<spans.length;j++) spans[j].textContent=r[j].name||'?';
    var host=isHost(), bs=document.querySelectorAll('#roomDiff .diff');
    for(var k=0;k<bs.length;k++){ bs[k].classList.toggle('sel',bs[k].getAttribute('data-diff')===room.mode); bs[k].disabled=!host; }
    var st=document.getElementById('roomStart');
    st.style.display=host?'':'none';
    st.disabled=!(room.joined && oppMeta() && !room.opp.playing && oppMeta().v===CFG.version);
    if(!host && room.joined && oppMeta() && !document.getElementById('duelNote').textContent) duelNote('waitHost');
  }
  function showDuelScr(mode){
    duelScr.className='wood-bg '+mode;
    duelScr.style.display='block'; menu.style.display='none'; over.style.display='none';
    lobbyOpen(); syncListing();
    if(mode==='home'){ var n=document.getElementById('dname'); if(!n.value) n.value=savedName(); }
    paintRoom();
  }
  function showDuelResult(){
    var el=document.getElementById('duelResult'), again=document.getElementById('again'), rm=document.getElementById('rematch');
    if(!resultShown || !room || !duel || sourMode){ el.style.display='none'; rm.style.display='none'; document.getElementById('emoOver').style.display='none'; if(resultShown) again.style.display=''; return; }
    again.style.display='none'; rm.style.display='';
    document.getElementById('emoOver').style.display='';
    var o=room.opp, v={n:oppName(),s:o.score};
    if(!o.done){ el.textContent=tr('oppLive',v); el.className=''; }
    else {
      var d=o.left?1:S.score-o.score, hh=h2h(room.duelOpp||oppMeta());
      el.textContent=(o.left?tr('oppForfeit',v):d>0?tr('duelWin',v):d<0?tr('duelLose',v):tr('duelDraw',v))+(hh[0]+hh[1]?'\n'+tr('h2h',{w:hh[0],l:hh[1]}):'');
      el.className=d>0?'win':'';
    }
    el.style.display='block';
    var gone=!oppMeta();
    rm.disabled=gone || room.meReady;
    rm.textContent=room.meReady?tr('rematchWait'):tr('rematch');
  }

  document.getElementById('showDuel').onclick=function(){ if(starting) return; duelNote(''); showDuelScr(room?'lobby':'home'); };
  document.getElementById('duelBack').onclick=function(){
    if(room){ leaveRoom(); duelNote(''); showDuelScr('home'); return; }   // из комнаты — к списку комнат
    duelNote('');
    duelScr.style.display='none'; menu.style.display='flex'; menu.style.opacity='1';
  };
  document.getElementById('roomCreate').onclick=function(){
    var c=''; for(var i=0;i<4;i++) c+=ROOM_ABC[Math.floor(Math.random()*ROOM_ABC.length)];
    var was=room; joinRoom(c); if(room && room!==was) room.creator=true;
  };

  // ---- список открытых комнат: общий канал «лобби». Хозяин, пока ждёт соперника, виден в нём
  // (presence: код, имя, режим); кто смотрит список — входит нажатием. Зашёл второй или партия началась — строка пропадает ----
  var lobby=null;   // {ws, ref, topic, list:{id:meta}, joined, sent, meta}
  var lobbyRetry=0, lobbyRetryT=0;
  function lobbySend(event,payload,topic){
    if(!lobby || !lobby.ws || lobby.ws.readyState!==1) return;
    lobby.ws.send(JSON.stringify({topic:topic||lobby.topic,event:event,payload:payload,ref:String(++lobby.ref)}));
  }
  // лобби нужно, пока игру видно: вкладка на экране и приложение не свёрнуто
  function wantLobby(){ return !document.hidden && !appPaused; }
  function lobbyOpen(){
    if(lobby || !CFG.supabase) return;
    var l=lobby={topic:'realtime:'+KEY+'-lobby', ref:0, list:{}, sent:'', joined:false};
    try{ l.ws=new WebSocket(rtUrl()); }catch(e){ lobby=null; return; }
    l.ws.onopen=function(){
      if(lobby!==l) return;
      lobbySend('phx_join',{config:{broadcast:{self:false,ack:false},presence:{key:myId,enabled:true},private:false}});
      l.joinRef=String(l.ref);
      l.hb=setInterval(function(){ lobbySend('heartbeat',{},'phoenix'); },25000);
      // снимок presence у новичков бывает пустым — раз в 20 с отмечаемся заново, и нас (и нашу комнату) видно всем
      l.re=setInterval(function(){ if(l.joined && l.sent){ l.sent=''; syncListing(); } },20000);
    };
    l.ws.onmessage=function(e){
      if(lobby!==l) return;
      var m=JSON.parse(e.data), p=m.payload||{}, k;
      if(m.event==='phx_reply' && m.ref===l.joinRef){
        if(p.status!=='ok'){ lobbyClose(); return; }
        l.joined=true; l.sent=''; lobbyRetry=0; syncListing(); lobbySay('who',{id:myId});
      }
      else if(m.event==='presence_state'){ for(k in p){ var ms=p[k].metas||[]; if(ms.length) l.list[k]=ms[ms.length-1]; } }   // снимок бывает запоздалым — не сбрасываем
      else if(m.event==='presence_diff'){
        for(k in (p.leaves||{})) delete l.list[k];
        for(k in (p.joins||{})){ var mj=p.joins[k].metas||[]; if(mj.length) l.list[k]=mj[mj.length-1]; }
      }
      else if(m.event==='broadcast' && p.payload && p.payload.to===myId){ onInvite(p.event,p.payload); return; }
      // снимок presence у вошедшего бывает пустым: кто в лобби, отвечает ему сам, не дожидаясь переотметки раз в 20 с
      else if(m.event==='broadcast' && p.event==='who'){ if(l.meta) lobbySay('me',l.meta); return; }
      else if(m.event==='broadcast' && p.event==='me'){ var mm=p.payload||{}; if(/^[a-z0-9]{1,12}$/.test(mm.id||'') && mm.id!==myId) l.list[mm.id]=mm; }
      else return;
      paintRooms(); paintOnline(); paintInvites();
    };
    // связь оборвалась, а игру видно — переподключаемся (1, 2, 4... до 30 с)
    l.ws.onclose=function(){
      if(lobby!==l) return;
      lobbyClose(); paintRooms(); paintOnline();
      clearTimeout(lobbyRetryT);
      lobbyRetryT=setTimeout(function(){ if(wantLobby()) lobbyOpen(); },Math.min(30000,1000*Math.pow(2,lobbyRetry++)));
    };
    paintRooms();
  }
  function lobbyClose(){
    var l=lobby; if(!l) return;
    lobby=null; clearInterval(l.hb); clearInterval(l.re);
    try{ l.ws.onclose=null; l.ws.close(); }catch(e){}
  }
  // в лобби отмечаются все, у кого открыта игра (так считается «в сети»); хозяин без соперника — ещё и с комнатой
  function syncListing(){
    if(!lobby || !lobby.joined) return;
    var want=!!(room && room.joined && room.creator && !oppMeta() && !duel);
    var meta=want ? {id:myId,pid:myPid,code:room.code,name:myName(),mode:room.mode,v:CFG.version} : {id:myId,pid:myPid,name:myName(),v:CFG.version};
    var key=JSON.stringify(meta); if(key===lobby.sent) return;
    lobby.sent=key; lobby.list[myId]=meta; lobby.meta=meta;
    lobbySend('presence',{type:'presence',event:'track',payload:meta});
    paintOnline();
  }
  function paintOnline(){
    // считаем игроков, а не соединения: после перезагрузки (смена языка) старое соединение
    // ещё висит в presence, пока сервер не заметит обрыв, а игрок тот же (pid)
    var el=document.getElementById('onlineNow'), n=0, seen={};
    if(lobby && lobby.joined) for(var k in lobby.list){ var who=lobby.list[k].pid||k; if(!seen[who]){ seen[who]=1; n++; } }
    el.textContent=n?tr('onlineNow',{n:n}):'';
  }
  // связь держим, пока игру видно: свернули — отключаемся, вернулись — снова в сети
  if(CFG.supabase && window.WebSocket){
    lobbyOpen();
    document.addEventListener('visibilitychange',function(){ if(wantLobby()) lobbyOpen(); else lobbyClose(); paintOnline(); });
    // уходим со страницы (перезагрузка, закрытие) — закрываем соединение сразу, чтобы нас не считали дважды
    window.addEventListener('pagehide',lobbyClose);
  }
  function openRooms(){
    var a=[]; for(var k in lobby.list){ var r=lobby.list[k]; if(r && r.code && r.id!==myId && r.v===CFG.version) a.push(r); }
    return a.sort(function(x,y){ return x.name<y.name?-1:1; });
  }
  function paintRooms(){
    var box=document.getElementById('roomList'); if(!box) return;
    if(!lobby || !lobby.joined){ box.innerHTML='<div class="rl-empty">'+tr(lobby?'roomsWait':'noConn')+'</div>'; return; }
    var a=openRooms();
    if(!a.length){ box.innerHTML='<div class="rl-empty">'+tr('roomsEmpty')+'</div>'; return; }
    box.innerHTML='';
    a.forEach(function(r){
      var b=document.createElement('button'); b.className='rl';
      var n=document.createElement('span'); n.textContent=r.name||'?';
      var m=document.createElement('small'); m.textContent=r.mode==='hard'?tr('hard'):tr('normal');
      b.appendChild(n); b.appendChild(m);
      b.onclick=function(){ joinRoom(r.code); };
      box.appendChild(b);
    });
  }
  // быстрая игра: первая открытая комната из списка, а если их нет — своя
  document.getElementById('roomQuick').onclick=function(){
    var r=lobby && lobby.joined ? openRooms()[0] : null;
    if(r) joinRoom(r.code); else document.getElementById('roomCreate').onclick();
  };
  document.getElementById('roomStart').onclick=function(){ if(room && isHost()) hostStart(); };
  (function(){ var bs=document.querySelectorAll('#roomDiff .diff');
    for(var i=0;i<bs.length;i++) bs[i].onclick=function(){
      if(!room || !isHost()) return; room.mode=this.getAttribute('data-diff'); track(); hello(true); paintRoom(); syncListing();
    };
  })();
  // ---- приглашения: хозяин комнаты зовёт любого, у кого открыта игра (он в лобби), по имени.
  // У приглашённого всплывает окно "Принять / Отказаться"; если он в партии — окно ждёт её конца ----
  var invSent={}, invPending=null, INV_MS=60000;
  document.getElementById('roomInvite').onclick=function(){
    var box=document.getElementById('invPanel');
    box.style.display=box.style.display==='block'?'none':'block';
    paintInvites();
  };
  function lobbySay(ev,data){ lobbySend('broadcast',{type:'broadcast',event:ev,payload:data}); }
  function onlinePlayers(){
    var a=[]; if(!lobby || !lobby.joined) return a;
    var byPid={};   // один игрок — одна строка, даже если у него висит старое соединение
    for(var k in lobby.list){ var p=lobby.list[k]; if(p && p.id!==myId && p.pid!==myPid && !p.code) byPid[p.pid||p.id]=p; }   // версия не важна: по приглашению игра обновится
    for(k in byPid) a.push(byPid[k]);
    // сначала те, с кем уже играли (счёт встреч), потом по имени
    return a.sort(function(x,y){ var hx=h2h(x), hy=h2h(y), gx=hx[0]+hx[1], gy=hy[0]+hy[1];
      return (gy>0)-(gx>0) || String(x.name||'').localeCompare(String(y.name||'')); });
  }
  function paintInvites(){
    var box=document.getElementById('invList'); if(!box || document.getElementById('invPanel').style.display!=='block') return;
    var a=onlinePlayers(); box.innerHTML='';
    if(!a.length){ box.innerHTML='<div class="rl-empty">'+tr('invNone')+'</div>'; }
    a.forEach(function(p){
      var row=document.createElement('div'); row.className='rp inv';
      var n=document.createElement('span'); n.textContent=p.name||tr('noName');
      var hh=h2h(p); if(hh[0]+hh[1]){ var sc=document.createElement('small'); sc.textContent=' '+hh[0]+'-'+hh[1]; n.appendChild(sc); }
      var b=document.createElement('button'); b.className='emo';
      var sent=invSent[p.id] && Date.now()-invSent[p.id]<INV_MS;
      b.textContent=tr(sent?'invSent':'invSend'); b.disabled=!!sent;
      b.onclick=function(){
        if(!room || !room.joined) return;
        invSent[p.id]=Date.now();
        lobbySay('inv',{to:p.id,from:myId,name:myName()||tr('noName'),code:room.code,mode:room.mode,v:CFG.version});
        // "в сети" бывает и свёрнутое приложение: не подтвердил, что видит окно, за 4 с — зовём ещё и пушем
        var to=p.id, pid=p.pid, code=room.code; delete invAck[to];
        setTimeout(function(){ if(!invAck[to] && pid && room && room.code===code && !oppMeta()) pushInvite(pid); },4000);
        paintInvites(); setTimeout(paintInvites,INV_MS+50);
      };
      row.appendChild(n); row.appendChild(b); box.appendChild(row);
    });
    paintOffline(box,a);
  }
  // кто не в сети, но играл с нами раньше: зовём пуш-уведомлением (если он их включил)
  function paintOffline(box,online){
    if(!CFG.push) return;
    var on={}, nm=h2hNames(), ts=h2hTimes(), all=h2hAll(), by={}, a=[];
    var live=lobby && lobby.joined ? Object.keys(lobby.list).map(function(k){ return lobby.list[k]; }) : online;
    live.forEach(function(p){ if(!p) return; if(p.pid) on[p.pid]=1; if(p.name) on['@'+String(p.name).toLowerCase()]=1; });
    // после переустановки у игрока новый ID, а в списке остаётся прежний: сводим по имени, зовём на все
    for(var pid in nm) if(pid!==myPid && /^[a-z0-9]{12}$/.test(pid)){
      var k='@'+String(nm[pid]).toLowerCase(); if(on[pid] || on[k]) continue;
      var e=by[k]||(by[k]={pid:pid,pids:[],name:nm[pid],t:-1});
      e.pids.push(pid); if((ts[pid]||0)>e.t){ e.t=ts[pid]||0; e.pid=pid; e.name=nm[pid]; }
    }
    for(var k2 in by){
      var w=0, l=0; by[k2].pids.forEach(function(x){ var r=all[x]||[0,0]; w+=r[0]; l+=r[1]; });
      by[k2].h=[w,l]; by[k2].g=w+l; a.push(by[k2]);
    }
    if(!a.length) return;
    a.sort(function(x,y){ return y.g-x.g; }); a=a.slice(0,8);
    var h=document.createElement('div'); h.className='room-or'; h.textContent=tr('invOffline');
    var list=document.createElement('div');
    a.forEach(function(p){
      var row=document.createElement('div'); row.className='rp inv';
      var n=document.createElement('span'); n.textContent=p.name||tr('noName');
      var hh=p.h; if(hh[0]+hh[1]){ var sc=document.createElement('small'); sc.textContent=' '+hh[0]+'-'+hh[1]; n.appendChild(sc); }
      var b=document.createElement('button'); b.className='emo';
      var sent=invSent[p.pid] && Date.now()-invSent[p.pid]<INV_MS;
      b.textContent=tr(sent?'invSent':'invSend'); b.disabled=!!sent;
      b.onclick=function(){
        if(!room || !room.joined) return;
        invSent[p.pid]=Date.now();
        p.pids.forEach(function(x){ pushInvite(x); });
        paintInvites(); setTimeout(paintInvites,INV_MS+50);
      };
      row.appendChild(n); row.appendChild(b); list.appendChild(row);
    });
    box.appendChild(h); box.appendChild(list);
  }
  var invAck={}, appPaused=false;
  function pushInvite(pid){
    if(!CFG.push || !room || !room.joined || !/^[a-z0-9]{12}$/.test(pid||'')) return;
    // через базу, а не напрямую: *.vercel.app из России у многих недоступен, база передаст запрос сама
    fetch(SB_URL+'/rest/v1/rpc/push_invite',{method:'POST',headers:SB_HEADERS,
      body:JSON.stringify({p_to:pid,p_name:myName()||tr('noName'),p_code:room.code,p_mode:room.mode})})
      .catch(function(){});
  }
  // приложение для Android сообщает, что его свернули или развернули (свёрнутое не "в сети")
  window.__appPause=function(v){ appPaused=!!v; if(wantLobby()) lobbyOpen(); else lobbyClose(); paintOnline(); };
  function onInvite(ev,d){
    if(ev==='invack'){ invAck[d.from]=true; return; }
    if(ev==='inv'){
      // игру видно: подтверждаем, иначе приглашающий позовёт ещё и пушем
      if(wantLobby()) lobbySay('invack',{to:d.from,from:myId});
      invPending={from:d.from,name:String(d.name||'').slice(0,12),code:String(d.code||''),mode:d.mode,v:d.v,at:Date.now()}; showInvite();
    }
    else if(ev==='invno'){ delete invSent[d.from]; duelToast(tr('invDeclined',{n:String(d.name||'?').slice(0,12)})); paintInvites(); }
  }
  // во время партии окно не мешает: ждёт, пока она кончится
  function showInvite(){
    var pop=document.getElementById('invPop');
    if(!invPending || Date.now()-invPending.at>INV_MS){ invPending=null; pop.classList.remove('on'); return; }
    if(document.body.classList.contains('ingame') || (room && room.code===invPending.code)){ pop.classList.remove('on'); return; }
    document.getElementById('invText').textContent=tr('invFrom',{n:invPending.name||tr('noName')});
    document.getElementById('invMode').textContent=invPending.mode==='hard'?tr('hard'):tr('normal');
    pop.classList.add('on');
  }
  setInterval(showInvite,1000);
  document.getElementById('invYes').onclick=function(){
    var inv=invPending; invPending=null; document.getElementById('invPop').classList.remove('on');
    if(!inv) return;
    var n=document.getElementById('dname'); if(!myName()) n.value=tr('noName');
    if(inv.v && inv.v!==CFG.version && /^[A-Z0-9]{4}$/.test(inv.code)){ location.href=location.pathname+'?room='+inv.code; return; }
    joinRoom(inv.code);
  };
  document.getElementById('invNo').onclick=function(){
    var inv=invPending; invPending=null; document.getElementById('invPop').classList.remove('on');
    if(inv && inv.from) lobbySay('invno',{to:inv.from,from:myId,name:myName()||tr('noName')});
  };
  document.getElementById('dname').addEventListener('change',syncListing);
  // ---- быстрые реакции в комнате и после партии: у соперника всплывают табличкой «Имя: GG» ----
  var EMO=['GG','emoAgain','👍','😂','😤'], _emoT=0, _toastT=0;
  function emoText(i){ var e=EMO[i]; return e && e.indexOf('emo')===0 ? tr(e) : (e||''); }
  function duelToast(t){
    var el=document.getElementById('duelToast'); el.textContent=t; el.classList.add('on');
    clearTimeout(_toastT); _toastT=setTimeout(function(){ el.classList.remove('on'); },2600);
  }
  ['emoLobby','emoOver'].forEach(function(id){
    var box=document.getElementById(id);
    EMO.forEach(function(e,i){
      var b=document.createElement('button'); b.className='emo'; b.textContent=emoText(i);
      b.onclick=function(){
        if(!room || !oppMeta() || Date.now()-_emoT<1200) return;   // не чаще раза в 1,2 с
        _emoT=Date.now(); bcast('emo',{k:i}); duelToast(tr('you')+': '+emoText(i));
      };
      box.appendChild(b);
    });
  });
  document.getElementById('rematch').onclick=function(){
    if(!room || !oppMeta()) return;
    room.meReady=true; bcast('ready',{}); showDuelResult(); maybeStart();
  };
  // пришли по приглашению ?room=КОД: сразу в комнату (или на экран дуэли, если нет имени)
  (function(){
    var m=/[?&]room=([A-Za-z0-9]{4})/.exec(location.search); if(!m) return;
    try{ history.replaceState(null,'',location.pathname+location.hash); }catch(e){}
    joinByCode(m[1]);
  })();
  function joinByCode(code){
    code=String(code||'').toUpperCase(); if(!/^[A-Z0-9]{4}$/.test(code)) return;
    if(room && room.code===code) return;
    // партию не прерываем: приглашение покажется окном после неё
    if(document.body.classList.contains('ingame')){ invPending={from:'',name:'',code:code,mode:'',at:Date.now()}; return; }
    if(room) leaveRoom();
    showDuelScr('home');
    if(!myName()) document.getElementById('dname').value=tr('noName');
    joinRoom(code);
  }

  // ---- пуш-уведомления о приглашениях: подписка через service worker, адрес хранится в Supabase ----
  // в приложении для Android пуши браузера не работают: там свои, через Firebase (мост KunkkaPush из приложения)
  var appPush=window.KunkkaPush||null;
  var pushOk=!!(CFG.push && (appPush || ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && !/KunkkaApp/.test(navigator.userAgent))));
  var pushOn=false; try{ pushOn=localStorage.getItem(KEY+'push')==='1'; }catch(e){}
  function b64u(s){
    s=s.replace(/-/g,'+').replace(/_/g,'/'); var r=atob(s+'==='.slice((s.length+3)%4)), a=new Uint8Array(r.length);
    for(var i=0;i<r.length;i++) a[i]=r.charCodeAt(i); return a;
  }
  // ошибка сервера — это ошибка, а не успех: иначе переключатель остался бы включённым без подписки
  function pushRpc(fn,args){
    return fetch(SB_URL+'/rest/v1/rpc/'+fn,{method:'POST',headers:SB_HEADERS,body:JSON.stringify(args)})
      .then(function(r){ if(!r.ok) throw new Error(fn+' '+r.status); return r; });
  }
  function pushSave(endpoint,p256dh,auth){
    try{ localStorage.setItem(KEY+'pushEp',endpoint); }catch(e){}
    return pushRpc('push_subscribe',{p_pid:myPid,p_endpoint:endpoint,p_p256dh:p256dh,p_auth:auth,p_lang:LANG});
  }
  // приложение: спрашивает разрешение (Android 13+) и отвечает токеном Firebase в window.__appPush
  // один запрос за раз: второй вызов, пока ждём ответа приложения, получает тот же
  var appSubP=null;
  function appSubscribe(){
    if(appSubP) return appSubP;
    appSubP=new Promise(function(ok,no){
      window.__appPush=function(tok){ window.__appPush=null; appSubP=null; if(tok) ok(pushSave('fcm:'+tok,'-','-')); else no(); };
      appPush.request();
    });
    return appSubP;
  }
  function pushSubscribe(){
    if(appPush) return appSubscribe();
    return navigator.serviceWorker.ready.then(function(reg){
      return reg.pushManager.getSubscription().then(function(s){
        return s || reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(CFG.push.key)});
      });
    }).then(function(sub){
      var j=sub.toJSON();
      return pushSave(j.endpoint,j.keys.p256dh,j.keys.auth);
    });
  }
  function pushSet(on){
    pushOn=on; try{ localStorage.setItem(KEY+'push',on?'1':'0'); }catch(e){}
    paintPush();
  }
  function paintPush(){
    var bs=document.querySelectorAll('.tg-push');
    for(var i=0;i<bs.length;i++) paintToggle(bs[i],pushOn);
  }
  (function(){
    // нажали на уведомление, а игра уже открыта: код комнаты от приложения или от service worker
    window.__appRoom=joinByCode;
    if('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message',function(e){
      var d=e.data||{}; if(d.t==='room') joinByCode(d.code);
    });
    var rows=document.querySelectorAll('.push-row');
    for(var i=0;i<rows.length;i++) rows[i].style.display=pushOk?'':'none';
    if(!pushOk) return;
    var bs=document.querySelectorAll('.tg-push');
    for(i=0;i<bs.length;i++) bs[i].onclick=function(){
      if(pushOn){
        pushSet(false);
        if(appPush){
          var ep=''; try{ ep=localStorage.getItem(KEY+'pushEp')||''; }catch(e){}
          if(ep) pushRpc('push_unsubscribe',{p_endpoint:ep}).catch(function(){});
          appPush.disable(); return;
        }
        navigator.serviceWorker.ready.then(function(reg){ return reg.pushManager.getSubscription(); }).then(function(s){
          if(!s) return; pushRpc('push_unsubscribe',{p_endpoint:s.endpoint}).catch(function(){}); return s.unsubscribe();
        }).catch(function(){});
        return;
      }
      if(appPush){ pushSet(true); pushSubscribe().catch(function(){ pushSet(false); }); return; }
      Notification.requestPermission().then(function(p){
        if(p!=='granted') return;
        pushSet(true);
        pushSubscribe().catch(function(){ pushSet(false); });
      });
    };
    // включены и разрешены: обновляем подписку (язык, ID); разрешение отозвали — выключаем
    if(pushOn){
      if(appPush) pushSubscribe().catch(function(){ pushSet(false); });
      else if(Notification.permission==='granted') pushSubscribe().catch(function(){});
      else pushSet(false);
    }
    paintPush();
  })();
  function whenVisible(fn){
    if(!document.hidden){ fn(); return; }
    document.addEventListener('visibilitychange',function once(){
      if(document.hidden) return;
      document.removeEventListener('visibilitychange',once); fn();
    });
  }
  // пасхалка: 7 тапов по заголовку (заставка — из темы)
  (function(){
    var taps=0,tapT=0;
    document.querySelector('#menu .title').addEventListener('click',function(){
      var now=Date.now();
      if(now-tapT>1400)taps=0;
      tapT=now; taps++;
      if(taps>=7 && !starting){ taps=0; sourMode=true; diffBeforeSour=difficulty; difficulty='normal';
        starting=true;          // пока показывается заставка, «Играть» не запускает вторую партию
        var et=document.getElementById('eggToast'); et.style.display='flex';
        // игру свернули, пока висит заставка, — партия (и музыка) начнётся, когда её снова откроют
        setTimeout(function(){ whenLoaded(function(){ whenVisible(function(){ et.style.display='none'; starting=false; start(); }); }); },2000); }
    });
  })();
  // запрещённые символы не попадают в поле при вводе и вставке — игрок видит ник таким, каким он запишется
  document.getElementById('pname').addEventListener('input',function(){
    var v=this.value, clean=v.replace(NAME_BAD,'').replace(/^ +/,'').slice(0,12);
    if(clean===v) return;
    var pos=Math.max(0,(this.selectionStart||0)-(v.length-clean.length));
    this.value=clean;
    try{ this.setSelectionRange(pos,pos); }catch(e){}
  });
  document.getElementById('pname').value=savedName();   // имя с прошлого раза
  document.getElementById('pname').addEventListener('keydown',function(e){
    if(e.key==='Enter'){ e.preventDefault(); document.getElementById('submitScore').click(); }
  });
  document.getElementById('submitScore').onclick=function(){
    if(lastSubmitted)return;
    var name=lbClean(document.getElementById('pname').value);
    if(!name){ document.getElementById('pname').focus(); return; }
    var myScore=S.score, myGame=gameNo;
    var btn=this; btn.disabled=true; btn.textContent=tr('sending');
    // режим берём из партии: пока ответ в пути, игрок может уйти в меню и переключить сложность
    lbSubmit(name,myScore,S.mode,function(ok,why,nickBest){
      if(myGame!==gameNo || !resultShown) return;   // игрок уже ушёл с экрана результата — другие экраны не трогаем
      if(why==='nosession'){ btn.textContent=tr('noSession'); return; }   // повтор не поможет
      if(why==='rejected'){ btn.textContent=tr('rejected'); return; }
      if(!ok){ btn.disabled=false; btn.textContent=tr('retry'); return; }
      lastSubmitted=true;
      try{ localStorage.setItem(KEY+'name',name); }catch(e){}
      document.getElementById('submitBox').style.display='none';
      // у имени в таблице одна запись — лучший результат; если он выше этой партии, говорим об этом
      if(nickBest!=null && nickBest>myScore) showSubmitNote(tr('nickHigher')+nickBest);
      document.getElementById('boardRows').innerHTML='<div class="bload">'+tr('updating')+'</div>';
      showBoard(name);
    });
  };
  var _shareData=null;
  function _buildShareCanvas(data,cb){
    var W=540,H=340,dpr=2;
    var cv2=document.createElement('canvas');
    cv2.width=W*dpr; cv2.height=H*dpr;
    var cx=cv2.getContext('2d');
    cx.scale(dpr,dpr);
    function drawCard(gi){
      cx.fillStyle='#160c04'; cx.fillRect(0,0,W,H);
      // grape watermark behind score
      if(gi){
        cx.save(); cx.globalAlpha=0.09;
        cx.drawImage(gi, W/2-110, H/2-110, 220, 220);
        cx.restore();
      }
      // borders
      cx.strokeStyle='#c79b42'; cx.lineWidth=3;
      cx.strokeRect(10,10,W-20,H-20);
      cx.strokeStyle='rgba(199,155,66,0.22)'; cx.lineWidth=1;
      cx.strokeRect(16,16,W-32,H-32);
      // title
      cx.textAlign='center';
      cx.fillStyle='#c79b42';
      cx.font='700 34px '+FONT.text;
      cx.fillText(T.title.toUpperCase(), W/2, 58);
      cx.fillStyle='#7a5520';
      cx.font='13px '+FONT.text;
      cx.fillText(T.subtitle+(data.mode==='hard'?tr('cardHard'):''), W/2, 78);
      // top divider
      cx.strokeStyle='rgba(199,155,66,0.6)'; cx.lineWidth=1;
      cx.beginPath(); cx.moveTo(50,94); cx.lineTo(W-50,94); cx.stroke();
      // score
      cx.fillStyle='#ffffff';
      cx.font='700 76px '+FONT.text;
      cx.fillText(String(data.score), W/2, 186);
      cx.fillStyle='#6a4a10';
      cx.font='700 12px '+FONT.text;
      cx.fillText(tr('cardPoints'), W/2, 206);
      // rank
      cx.fillStyle=COL.gold;
      cx.font='700 26px '+FONT.text;
      cx.fillText(data.rank, W/2, 244);
      // stats
      cx.fillStyle='#9a7030';
      cx.font='15px '+FONT.text;
      var st=tr('level')+' '+data.level+'  ·  '+T.text.shareGood+' '+data.purple;
      if(data.gold) st+='  ·  '+T.text.shareGold+' '+data.gold;
      cx.fillText(st, W/2, 272);
      // bottom divider
      cx.strokeStyle='rgba(199,155,66,0.35)'; cx.lineWidth=1;
      cx.beginPath(); cx.moveTo(60,290); cx.lineTo(W-60,290); cx.stroke();
      // url
      cx.fillStyle='#6a5520';
      cx.font='12px monospace';
      cx.fillText(CFG.siteUrl.replace(/^https?:\/\//,'').replace(/\/$/,''), W/2, 314);
      cv2.toBlob(cb,'image/png');
    }
    var img=new Image();
    img.onload=function(){ drawCard(img); };
    img.onerror=function(){ drawCard(null); };
    img.src=themeFile(T.images.good);
  }
  function _shareTextFallback(data){
    var mode=data.mode==='hard'?tr('shareHard'):'';
    return tr('shareText',{t:T.fullTitle,m:mode,s:data.score,r:data.rank,l:data.level})+'\n\n'+CFG.siteUrl;
  }
  // картинку результата готовим заранее: системное меню «Поделиться» открывается только
  // сразу в ответ на нажатие, а сборка картинки асинхронная (на iOS меню иначе не появлялось)
  var _shareFile=null;
  function prepareShare(){
    var data=_shareData; _shareFile=null;
    _buildShareCanvas(data,function(blob){
      if(!blob || data!==_shareData) return;
      try{ _shareFile=new File([blob],'result.png',{type:'image/png'}); }catch(e){}
    });
  }
  document.getElementById('shareBtn').onclick=function(){
    if(!_shareData)return;
    var btn=this, text=_shareTextFallback(_shareData);
    var url=CFG.siteUrl;
    // меню закрыли — ничего не делаем, любая другая ошибка — копируем текст
    function onFail(e){ if(!e || e.name!=='AbortError') copyText(); }
    if(_shareFile && navigator.canShare && navigator.canShare({files:[_shareFile]})){
      navigator.share({files:[_shareFile],url:url,title:T.fullTitle}).catch(onFail);
    } else if(navigator.share){
      navigator.share({text:text,url:url}).catch(onFail);
    } else {
      copyText();
    }
    function copyText(){
      function done(ok){
        btn.textContent=ok?tr('copied'):tr('copyFail');
        setTimeout(function(){btn.textContent=tr('share');},2200);
      }
      // запасной способ для браузеров без Clipboard API
      function legacy(){
        var ta=document.createElement('textarea'); ta.value=text;
        ta.style.cssText='position:fixed;left:-9999px;top:0;';
        document.body.appendChild(ta); ta.select();
        var ok=false; try{ ok=document.execCommand('copy'); }catch(e){}
        document.body.removeChild(ta); done(ok);
      }
      if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function(){ done(true); },legacy);
      else legacy();
    }
  };
  document.getElementById('again').onclick=function(){
    death=null;_deathAlive=false;resultShown=false;over.style.display='none';
    game.style.display='block';
    document.body.classList.add('ingame');
    paused=false; var po=document.getElementById('pauseOverlay'); if(po)po.style.display='none';
    document.getElementById('pause').textContent='II';
    reset();S.running=false;
    lbStartSession();
    countdown={n:3,t:0};
    bgm.currentTime=0;applyAudio();bgm.play().catch(function(){});
    _loopAlive=false;
    startLoop();
  };
  document.getElementById('tomenu').onclick=function(){
    death=null;_deathAlive=false;resultShown=false;
    if(room){ duel=null; over.style.display='none'; game.style.display='none'; bgm.pause(); document.body.classList.remove('ingame'); showDuelScr('lobby'); return; }
    over.style.display='none';game.style.display='none';bgm.pause();
    document.body.classList.remove('ingame');
    leaveSourMode();
    refreshMenuBest();
    menu.style.display='flex';setTimeout(function(){menu.style.opacity='1';},20);
  };
  document.getElementById('showLb').onclick=function(){ if(starting) return; showLeaderboardOnly(); };

  // ---- настройки: музыка, звуки, вибрация ----
  var settings=document.getElementById('settings');
  var tgMusic=document.getElementById('tgMusic');
  var tgSfx=document.getElementById('tgSfx');
  var tgVibro=document.getElementById('tgVibro');
  // вибрации нет (iOS Safari, ПК) — строку не показываем
  if(!canVibrate) document.getElementById('vibroRow').style.display='none';
  function paintToggle(btn,on){ btn.textContent=on?tr('on'):tr('off'); btn.classList.toggle('on',on); btn.classList.toggle('off',!on); }
  function paintDiff(){
    var bs=document.querySelectorAll('#menuDiff .diff');
    for(var i=0;i<bs.length;i++) bs[i].classList.toggle('sel', bs[i].getAttribute('data-diff')===difficulty);
  }
  document.getElementById('showSettings').onclick=function(){
    if(starting) return;              // партия уже запускается
    paintToggle(tgMusic,musicOn);
    paintToggle(tgSfx,sfxOn);
    paintToggle(tgVibro,vibroOn);
    paintVol();
    menu.style.display='none'; settings.style.display='block';
  };
  document.getElementById('settingsBack').onclick=function(){
    settings.style.display='none'; menu.style.display='flex';
  };
  var howto=document.getElementById('howto');
  document.getElementById('showHow').onclick=function(){
    if(starting) return;
    menu.style.display='none'; howto.style.display='block';
  };
  document.getElementById('howBack').onclick=function(){
    howto.style.display='none'; menu.style.display='flex';
  };
  var hold=document.getElementById('hold');
  // медаль трофея: картинка темы (получен / ещё нет) или рисунок
  function medalSVG(on){
    var mi=on?T.images.medal:(T.images.medalOff||T.images.medal);
    if(mi) return '<img class="tmedal" src="'+themeFile(mi)+'" alt="">';
    var c1=on?'#e8c061':'#5a4a30', c2=on?'#9c6f28':'#3a3020';
    return '<svg class="tmedal" viewBox="0 0 40 40">'+
      '<circle cx="20" cy="17" r="12" fill="'+c1+'" stroke="'+c2+'" stroke-width="2"/>'+
      '<circle cx="20" cy="17" r="6" fill="none" stroke="'+c2+'" stroke-width="1.5"/>'+
      '<path d="M14 26 L11 38 L20 33 L29 38 L26 26 Z" fill="'+c1+'" stroke="'+c2+'" stroke-width="1.5"/>'+
      '</svg>';
  }
  function fillHold(){
    var rp=rankProgress(best);
    document.getElementById('rankName').textContent=rp.name;
    document.getElementById('rankBar').style.width=rp.pct+'%';
    document.getElementById('rankNext').textContent =
      rp.next ? tr('toRank',{r:rp.next,n:rp.need}) : tr('topRank');
    var html='', got=0;
    for(var i=0;i<TROPHIES.length;i++){
      var t=TROPHIES[i], on=t.test();
      if(on) got++;
      var prog='';
      if(!on){
        var c=Math.max(0,Math.min(t.goal,t.cur()||0));
        prog='<span class="tprog">'+c+'/'+t.goal+'</span>'+
             '<span class="tbar"><span style="width:'+Math.round(c/t.goal*100)+'%"></span></span>';
      }
      html+='<div class="trophy '+(on?'unlocked':'locked')+'">'+medalSVG(on)+
            '<span class="tname">'+t.name+'</span>'+prog+'</div>';
    }
    document.getElementById('trophyGrid').innerHTML=html;
    document.getElementById('trophyTitle').textContent=T.text.trophiesTitle+' '+got+'/'+TROPHIES.length;
    fillLog();
  }
  // судовой журнал: накопленная статистика за все партии
  function fillLog(){
    var rows=[
      [T.log.games,STATS.games],
      [T.log.bestLevel,STATS.bestLevel],
      [T.log.good,STATS.purple],
      [T.log.gold,STATS.gold],
      [T.log.bad,STATS.green],
      [T.log.bonus,STATS.rum],
      [T.log.best,best],
      [T.log.bestHard,STATS.bestHard]
    ];
    var html='';
    for(var i=0;i<rows.length;i++)
      html+='<div class="log-cell"><span class="lk">'+rows[i][0]+'</span><span class="lv">'+rows[i][1]+'</span></div>';
    document.getElementById('logGrid').innerHTML=html;
  }
  document.getElementById('showHold').onclick=function(){
    if(starting) return;
    fillHold(); menu.style.display='none'; hold.style.display='block';
  };
  document.getElementById('holdBack').onclick=function(){
    hold.style.display='none'; menu.style.display='flex';
  };
  tgMusic.onclick=function(){ musicOn=!musicOn; paintToggle(tgMusic,musicOn);
    try{localStorage.setItem(KEY+'music',musicOn?'1':'0');}catch(e){} applyAudio(); };
  tgSfx.onclick=function(){ sfxOn=!sfxOn; paintToggle(tgSfx,sfxOn);
    try{localStorage.setItem(KEY+'sfx',sfxOn?'1':'0');}catch(e){}
    if(sfxOn) SFX.click(); };   // клик-подтверждение при включении
  tgVibro.onclick=function(){ vibroOn=!vibroOn; paintToggle(tgVibro,vibroOn);
    try{localStorage.setItem(KEY+'vibro',vibroOn?'1':'0');}catch(e){}
    buzz(40); };                // короткий импульс-проверка при включении
  // язык: сохраняем выбор и перезагружаем — все надписи и реплики собираются заново
  document.getElementById('tgLang').onclick=function(){
    try{ localStorage.setItem(KEY+'lang',LANG==='ru'?'en':'ru'); }catch(e){}
    location.reload();
  };

  // ползунок громкости музыки
  var musicVolEl=document.getElementById('musicVol');
  var volValEl=document.getElementById('volVal');
  function paintVol(){
    if(musicVolEl) musicVolEl.value=Math.round(musicVol*100);
    if(volValEl) volValEl.textContent=Math.round(musicVol*100)+'%';
    if(musicVolEl) musicVolEl.style.setProperty('--vol',Math.round(musicVol*100)+'%');   // золотая заливка до ручки
  }
  paintVol();
  if(musicVolEl){
    musicVolEl.addEventListener('input',function(){
      musicVol=Math.max(0,Math.min(1,(parseInt(this.value,10)||0)/100));
      paintVol();
      applyAudio();
      try{localStorage.setItem(KEY+'musicvol',String(musicVol));}catch(e){}
    });
  }
  // выбор сложности в главном меню
  (function(){ var bs=document.querySelectorAll('#menuDiff .diff');
    for(var i=0;i<bs.length;i++){ bs[i].onclick=function(){
      difficulty=this.getAttribute('data-diff'); paintDiff();
    }; }
    paintDiff();
  })();

  var paused=false;
  function togglePause(){
    if(countdown)return;        // во время отсчёта пауза недоступна
    if(death)return;            // во время катсцены смерти пауза недоступна
    if(!S.running && !paused)return; // игра не идёт (меню/таблица) — игнор
    paused=!paused;S.running=!paused;
    document.getElementById('pause').textContent=paused?'▶':'II';
    document.getElementById('pauseOverlay').style.display=paused?'flex':'none';
    dockState();
    if(paused){
      bgm.pause(); stopTouchSound();
      try{ if(AC && AC.state==='running') AC.suspend(); }catch(e){}
    } else {
      bgm.play().catch(function(){});
      acResume();   // вернуть звук
      startLoop();
    }
  }
  (function(){
    var pb=document.getElementById('pause');
    var touchedAt=0;
    // подавляем нативную подсветку касания (чёрный квадрат на Android-Chrome)
    pb.addEventListener('touchstart',function(e){
      e.preventDefault();           // не даём браузеру нарисовать highlight и сгенерить click
      touchedAt=Date.now();
      togglePause(); pb.blur();
    }, {passive:false});
    pb.addEventListener('touchend',function(){ touchedAt=Date.now(); });   // дубль-click, если придёт, — сразу за отпусканием
    pb.addEventListener('click',function(e){
      e.stopPropagation();
      // дубль только что обработанного тача пропускаем; флаг без срока (click после тача обычно не приходит)
      // глотал бы следующий клик мышью — на ноутбуке с сенсорным экраном пауза не ставилась
      if(Date.now()-touchedAt<700){ touchedAt=0; return; }
      togglePause(); pb.blur();              // настоящий клик мышью (ПК)
    });
  })();
  document.getElementById('pauseOverlay').onclick=function(){ togglePause(); };
  // выход из партии с паузы: партия бросается и в статистику не идёт
  document.getElementById('quitGame').onclick=function(e){
    e.stopPropagation();                  // иначе клик по заставке паузы снимет паузу
    if(!paused) return;
    paused=false; S.running=false; countdown=null; _loopAlive=false;
    gameNo++;                             // запоздавшие ответы сервера к брошенной партии не относятся
    activeTouches={}; mouseDrag=null;
    document.getElementById('pauseOverlay').style.display='none';
    document.getElementById('pause').textContent='II';
    game.style.display='none'; document.body.classList.remove('ingame'); document.body.removeAttribute('data-weather'); document.body.removeAttribute('data-event');
    bgm.pause(); acResume();              // звуки меню снова слышны (на паузе аудио приостановлено)
    leaveSourMode();
    if(room && duel){ forfeit(); duel=null; showDuelScr('lobby'); return; }   // бросил дуэль: ему поражение, сопернику победа
    refreshMenuBest();
    menu.style.display='flex'; setTimeout(function(){ menu.style.opacity='1'; },20);
  };
  // на ПК пауза и с клавиатуры: Esc, P или пробел
  document.addEventListener('keydown',function(e){
    if(game.style.display==='none' || e.repeat) return;
    if(e.key==='Escape' || e.key==='p' || e.key==='P' || e.key==='з' || e.key==='З' || e.key===' '){
      e.preventDefault(); togglePause();
    }
  });

  // телефон повернули горизонтально — игру закрывает заставка «поверни телефон», ставим паузу
  var landscapeMQ=window.matchMedia('(orientation:landscape) and (max-height:520px)');
  // "Поверни телефон" - только когда повёрнут сам телефон. Окно шире своей высоты бывает и на разделённом
  // экране при вертикальном телефоне: там играем как обычно
  var coarseMQ=window.matchMedia('(pointer:coarse)');
  function rotated(){
    if(!landscapeMQ.matches || !coarseMQ.matches) return false;   // на ПК низкое окно — не повод просить повернуть телефон
    var so=screen.orientation && screen.orientation.type;
    if(so) return so.indexOf('landscape')===0;
    if(typeof window.orientation==='number') return Math.abs(window.orientation)===90;
    return screen.width>screen.height;
  }
  function onOrientation(){
    document.body.classList.toggle('rotated',rotated());
    if(rotated() && game.style.display!=='none' && !paused && !countdown && S.running) togglePause();
  }
  if(landscapeMQ.addEventListener) landscapeMQ.addEventListener('change',onOrientation);
  else if(landscapeMQ.addListener) landscapeMQ.addListener(onOrientation);
  if(screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change',onOrientation);
  window.addEventListener('resize',onOrientation);
  onOrientation();

  // страховка во время партии: если музыку или звуки остановила система (фокус звука, уведомление,
  // окно приложения на Android), а игра не на паузе — возвращаем их
  setInterval(function(){
    if(document.hidden || paused || death || game.style.display==='none' || !document.body.classList.contains('ingame')) return;
    if(musicOn && bgm.paused) bgm.play().catch(function(){});
    if(AC && AC.state!=='running' && !_wakeQ){ _sleeping=false; acResume(); }
  },1500);

  // авто-пауза при сворачивании вкладки / блокировке телефона
  var bgmBeforeHide=false, wentHidden=false;   // играла ли музыка перед сворачиванием (на экране результата она тоже играет)
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){
      if(!wentHidden){ wentHidden=true; bgmBeforeHide=!bgm.paused; }
      if(game.style.display!=='none' && !paused && !countdown && S.running){
        togglePause();   // ставит паузу и сам приостанавливает звук
      } else {
        try{bgm.pause();}catch(e){}
        stopTouchSound();
        try{ if(AC && AC.state==='running') AC.suspend(); }catch(e){}
      }
    } else {
      if(!wentHidden) return;
      wentHidden=false;
      if(paused) return;   // на паузе звук вернётся, когда игрок её снимет
      // меню, отсчёт, сцена смерти, результат — возвращаем звук как был
      acResume();
      if(bgmBeforeHide) bgm.play().catch(function(){});
    }
  });

})();
