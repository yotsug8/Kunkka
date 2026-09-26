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
  function themeImg(p){ var i=new Image(); i.src=themeFile(p); return i; }
  var COL=T.colors, FONT=T.fonts;
  var KEY=CFG.storageKey+'_';   // префикс сохранений в браузере
  var heroImg=themeImg(T.images.portrait);
  var heroOpenImg=themeImg(T.images.portraitOpen);
  var purpleImg=themeImg(T.images.good);
  var greenImg=themeImg(T.images.bad);
  var goldImg=themeImg(T.images.gold);
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
    // экран сузился (поворот, панель браузера) — виноград не должен остаться за краем, где его не достать
    var gs=(S&&S.grapes)||[];
    for(var i=0;i<gs.length;i++){ var g=gs[i]; g.x=Math.max(g.r,Math.min(W-g.r,g.x)); g.y=Math.max(g.r,Math.min(H-g.r,g.y)); }
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
    if(t) t.textContent = (difficulty==='hard') ? 'Рекорды: хардкор' : 'Рекорды: обычная';
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
    if(arr===null){ box.innerHTML='<div class="bload">нет связи с сервером</div>'; return false; }
    if(!arr.length){ box.innerHTML='<div class="bload">пока пусто, будь первым</div>'; return false; }
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
  var _voices=0;   // счётчик активных звуков
  var MAX_VOICES=12;
  // пока аудио приостановлено, звуки не заканчиваются и счётчик голосов не освобождается —
  // такие звуки пропускаем, иначе после прерывания эффекты замолкли бы навсегда
  function tone(freq,dur,type,vol,slideTo,delay){
    if(!sfxOn)return;
    var a=ac(); if(!a)return;
    if(a.state!=='running'){ acResume(); return; }
    if(_voices>=MAX_VOICES) return;   // не плодим звуки при спаме
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
    if(a.state!=='running'){ acResume(); return; }
    if(_voices>=MAX_VOICES) return;
    var n=Math.floor(a.sampleRate*dur), buf=a.createBuffer(1,n,a.sampleRate), d=buf.getChannelData(0);
    for(var i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
    var s=a.createBufferSource();s.buffer=buf;
    var g=a.createGain();g.gain.value=vol||0.3;
    s.connect(g);g.connect(MASTER);s.start();
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

  var SFX={
    eat:function(){tone(300,0.14,'sine',0.5,650);}, // мягкий «блуп» вверх — заметный, не резкий
    squash:function(){noiseBurst(0.07,0.11);tone(150,0.08,'sine',0.18,70);}, // мягкий хлоп, выровнен по громкости
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
    click:function(){ tone(520,0.05,'sine',0.22,420); } // мягкий клик интерфейса
  };
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
    el.classList.add('show');
    setTimeout(function(){
      el.classList.remove('show');
      setTimeout(nextToast, 550);   // дать уехать предыдущему (transition .5s)
    }, 2600);
  }

  var gameNo=0;   // номер партии — чтобы запоздавшие ответы сервера не трогали следующую
  function reset(){
    gameNo++;
    _ending=false;
    activeTouches={}; mouseDrag=null;    // пальцы/мышь, зажатые в прошлой партии, к новой не относятся
    _smokeSprite=null;
    document.getElementById('lives').style.color=sourMode?COL.good:COL.counter;
    SESSION={purple:0,gold:0,green:0,rum:0,score:0,level:1};
    S={mode:difficulty,score:0,level:1,grapes:[],spawnT:0,spawnGap:950*dk().spawn,
       drag:null,last:0,shake:0,flash:0,wasFull:false,mouthOpen:0,face:'idle',faceT:0,running:true,floaters:[],
       particles:[],distress:0,goldT:0,rumT:0,goldPity:0,rumPity:0,rumGrace:0,rumCD:0,greenDry:0,kurazh:0,banner:null,bubble:null,_sayT:0,
       weather:null,weatherT:0,combo:0,comboT:0,loot:null,lootT:0};
    document.body.removeAttribute('data-weather'); document.body.removeAttribute('data-event');
    warnSndT=0;
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
    if(S.running && !sourMode && best>0 && S.score>best && !S.recordSaid){ S.recordSaid=true; say('record',true); }
    if(S.score>_lastScore){
      var sp=document.querySelector('.hud .score');
      if(sp){ sp.classList.remove('pulse'); void sp.offsetWidth; sp.classList.add('pulse'); }
    }
    _lastScore=S.score;
  }

  // заставка-баннер по центру (уровень / шторм)
  function banner(text,color,ms){
    S.banner={t:text,c:color||'#e8c061',life:ms||1300,max:ms||1300};
    // очки, только что всплывшие в том же кадре (съел — и сразу уровень или кураж), уводим из-под баннера
    for(var i=0;i<S.floaters.length;i++){ var f=S.floaters[i]; if(f.life>=59) f.y=clearOfBanner(f.y); }
  }

  function levelUp(nl){
    S.level=nl;
    S.spawnGap=Math.max(280,950-nl*62)*dk().spawn;
    banner('Уровень '+nl,'#e8c061',1400);
    if(Math.random()<0.35) say('level');
  }

  // уровень — каждые 120 очков
  function checkLevel(){
    var nl=1+Math.floor(S.score/120);
    if(nl!==S.level) levelUp(nl);
  }

  // геометрия портрета персонажа
  function heroBox(){
    var ratio=(heroImg.naturalWidth?heroImg.naturalHeight/heroImg.naturalWidth:2.0);   // пока не загрузилась (или не загрузится) — пропорции по умолчанию
    var kw=Math.min(W*0.78,344);
    var kh=kw*ratio;
    var maxH=H*0.62;
    if(kh>maxH){ kh=maxH; kw=kh/ratio; }
    var kx=W/2-kw/2, ky=16;
    var f=T.face;   // рот и прочие точки лица — в долях портрета, из темы
    return {x:kx,y:ky,w:kw,h:kh,
      mouthX:kx+kw*f.mouthX, mouthY:ky+kh*f.mouthY, mouthR:kw*f.mouthR};
  }

  // рамка вокруг портрета персонажа
  function drawPortraitFrame(x,y,w,h,c){
    c=c||ctx;
    var fw=Math.max(10, w*0.05);   // толщина багета
    // внешняя тёмная деревянная окантовка
    c.lineJoin='miter';
    // тёмное дерево (внешний кант)
    c.strokeStyle='#241407';
    c.lineWidth=fw*1.6;
    c.strokeRect(x-fw*0.3, y-fw*0.3, w+fw*0.6, h+fw*0.6);
    // основной латунный багет с градиентом
    var fg=c.createLinearGradient(x,y,x,y+h);
    fg.addColorStop(0,'#e8c061');
    fg.addColorStop(0.25,'#b5882f');
    fg.addColorStop(0.5,'#8a6420');
    fg.addColorStop(0.75,'#b5882f');
    fg.addColorStop(1,'#7a561c');
    c.strokeStyle=fg;
    c.lineWidth=fw;
    c.strokeRect(x-fw*0.3, y-fw*0.3, w+fw*0.6, h+fw*0.6);
    // тонкая тёмная линия по внутреннему краю багета (отделяет от фото)
    c.strokeStyle='rgba(30,18,6,0.9)';
    c.lineWidth=2;
    c.strokeRect(x+1, y+1, w-2, h-2);
    // блик по верхней кромке багета
    c.strokeStyle='rgba(255,235,180,0.4)';
    c.lineWidth=1.5;
    c.beginPath();
    c.moveTo(x-fw*0.7, y-fw*0.7); c.lineTo(x+w+fw*0.7, y-fw*0.7);
    c.stroke();
    // угловые заклёпки-болты
    var bolts=[[x-fw*0.3,y-fw*0.3],[x+w+fw*0.3,y-fw*0.3],[x-fw*0.3,y+h+fw*0.3],[x+w+fw*0.3,y+h+fw*0.3]];
    for(var i=0;i<bolts.length;i++){
      var bx=bolts[i][0], by=bolts[i][1];
      var bg2=c.createRadialGradient(bx-2,by-2,1,bx,by,fw*0.42);
      bg2.addColorStop(0,'#f0d488'); bg2.addColorStop(1,'#6e4e1a');
      c.fillStyle=bg2;
      c.beginPath(); c.arc(bx,by,fw*0.42,0,6.28); c.fill();
      c.strokeStyle='#3a2710'; c.lineWidth=1.5; c.stroke();
    }
  }

  // ---- портрет с рамкой: не меняется от кадра к кадру, поэтому готовится один раз на кадр лица и размер ----
  var _portraitCache={};
  // холст с портретом в рамке; _m — поле вокруг портрета под багет и заклёпки
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
        c.drawImage(img,m,m,b.w,b.h);
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
  function sprite(img,w,h){
    var bw=Math.ceil(w*SPRITE_ROOM/8)*8, bh=Math.ceil(h*SPRITE_ROOM/8)*8;
    var key=img.src+'|'+bw+'x'+bh+'@'+DPR;
    var c=_spriteCache[key];
    if(!c){
      c=document.createElement('canvas');
      c.width=Math.ceil(bw*DPR); c.height=Math.ceil(bh*DPR);
      var x=c.getContext('2d'); x.imageSmoothingQuality='high';
      x.drawImage(img,0,0,c.width,c.height);
      _spriteCache[key]=c;
    }
    return c;
  }
  // мягкое свечение: круг, прозрачный к краю; яркость задаётся globalAlpha при рисовании
  function glowSprite(rgb,inner){
    var c=document.createElement('canvas'); c.width=c.height=256;
    var x=c.getContext('2d'), g=x.createRadialGradient(128,128,128*inner,128,128,128);
    g.addColorStop(0,'rgba('+rgb+',1)'); g.addColorStop(1,'rgba('+rgb+',0)');
    x.fillStyle=g; x.fillRect(0,0,256,256);
    return c;
  }
  var _goldGlow=null;
  // надпись с обводкой и тенью, нарисованная один раз: рисовать текст каждый кадр телефону дорого,
  // а готовую картинку он только масштабирует. st: {px, font, lw, sw, sx, sy, max} — размер, шрифт,
  // толщина обводки и тени, сдвиг тени, наибольший масштаб при показе (для чёткости)
  var _textCache={}, _textCount=0;
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ _textCache={}; _textCount=0; });   // шрифт догрузился — перерисовать
  function textSprite(t,fill,st){
    var key=t+'|'+fill+'|'+st.px+'|'+st.font+'@'+DPR;
    var sp=_textCache[key];
    if(sp) return sp;
    if(++_textCount>80){ _textCache={}; _textCount=1; }   // не копим бесконечно
    var font='900 '+st.px+'px '+st.font;
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
    return (_textCache[key]={c:c,w:w,h:h});
  }
  // пузырь реплики целиком (рамка, хвостик, текст) — тоже один раз на фразу
  function bubbleSprite(t,bh){
    var key='bubble|'+t+'@'+DPR;
    var sp=_textCache[key];
    if(sp) return sp;
    ctx.font='700 17px '+FONT.text;
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
    x.font='700 17px '+FONT.text; x.textAlign='center'; x.textBaseline='middle';
    x.fillStyle='#3a2710'; x.fillText(t,bx,ry+bh/2);
    _textCount++;
    return (_textCache[key]={c:c,w:w,h:h});
  }
  // нарисовать готовую надпись: центр в (x, y), масштаб sc
  function drawText(sp,x,y,sc){ ctx.drawImage(sp.c, x-sp.w*sc/2, y-sp.h*sc/2, sp.w*sc, sp.h*sc); }
  var FLOAT_TEXT={px:30, lw:6, sw:7, sx:1.5, sy:2.5, max:1.25}, BANNER_TEXT={lw:7, sw:8, sx:2, sy:3, max:1};
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
    var sea=el('div','seaLayer',cv);
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
  function dk(){return DIFF[difficulty]||DIFF.normal;}
  var sourMode=false, diffBeforeSour=null;
  // выход из пасхалки (роли винограда меняются местами): вернуть сложность, выбранную в меню
  function leaveSourMode(){
    if(!sourMode) return;
    sourMode=false;
    if(diffBeforeSour){ difficulty=diffBeforeSour; diffBeforeSour=null; }
  }

  // сколько нажатий нужно на зелёный — растёт с уровнем
  function greenHitsNeeded(){return Math.min(7, 2+Math.floor((S.level-1)/4)+dk().hits);}
  // окно до удушения (мс) — сокращается с уровнем
  function chokeWindow(){
    var base=(4200-(S.level-1)*200)*dk().choke;
    // нижняя граница с 13 уровня опускается на 30 мс за уровень, но не больше чем на 400:
    // обычная 1300 → 900 мс, хардкор 900 → 700 мс
    var doom=S.level>12?Math.min(400,(S.level-12)*30):0;
    var floor=(difficulty==='hard') ? Math.max(700, 900-doom) : 1300-doom;
    return Math.max(floor, base);
  }


  // ---- погода: с 4 уровня изредка шторм — волны качают виноград ----
  var WEATHER={
    storm:{dur:7000, color:'#9fc3dc'}
  };
  var WEATHER_FROM=4;                     // с какого уровня
  function weatherPause(){ return 22000+Math.random()*10000; }   // затишье между событиями
  function setWeather(type){
    S.weather=type?{type:type, t:0, dur:WEATHER[type].dur}:null;
    if(type){ banner(T.text.weather[type],WEATHER[type].color,1600); say('storm',true); }
    S.weatherT=type?0:weatherPause();
    if(type) document.body.setAttribute('data-weather',type); else document.body.removeAttribute('data-weather');
  }
  function updateWeather(dt,gc){
    if(sourMode || S.level<WEATHER_FROM) return;
    if(S.weather){
      S.weather.t+=dt;
      if(S.weather.t>=S.weather.dur) setWeather(null);
      return;
    }
    if(!S.weatherT) S.weatherT=9000;      // первое событие — вскоре после 4 уровня
    S.weatherT-=dt;
    // не начинаем, пока Кунке и так тяжело
    if(S.weatherT<=0 && gc<3 && S.kurazh<=0 && !S.loot){
      setWeather('storm');
    }
  }

  // ---- добыча: с 3 уровня изредка на поле высыпается 5 фиолетовых, и пару секунд нет зелёных ----
  var LOOT_FROM=3, LOOT_COUNT=5, LOOT_DUR=3000;
  function lootPause(){ return 34000+Math.random()*12000; }
  function updateLoot(dt,gc){
    if(sourMode || S.level<LOOT_FROM) return;
    var L=S.loot;
    if(L){
      L.t+=dt; L.next-=dt;
      // высыпаем по одной, чтобы было видно, как они появляются
      if(L.left>0 && L.next<=0 && S.grapes.length<11){ spawn('sour'); L.left--; L.next=110; }
      if(L.t>=LOOT_DUR){ S.loot=null; S.lootT=lootPause(); document.body.removeAttribute('data-event'); }
      return;
    }
    if(!S.lootT) S.lootT=12000;           // первая добыча — вскоре после 3 уровня
    S.lootT-=dt;
    if(S.lootT<=0 && gc<3 && !S.weather && S.kurazh<=0){
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

  function spawn(forceType){
    var sour = forceType ? (forceType==='sour') : false;
    var gr=40+Math.random()*8;
    var zoneTop=H*0.67, zoneBot=H*0.86;
    var pos=freeX(gr,zoneTop,zoneBot);
    S.grapes.push({
      x:pos[0], y:pos[1],
      r:gr, sour:sour, gold:false, held:false,
      hits:0, squashT:0, life:0,
      bob:Math.random()*6.28, vb:0.03+Math.random()*0.025, age:0
    });
  }
  // поиск позиции: пробуем с убывающим зазором, в крайнем случае любое место
  function freeX(gr, zoneTop, zoneBot){
    var spacings=[1.35, 1.15, 0.95, 0.7];
    for(var s=0;s<spacings.length;s++){
      for(var attempt=0; attempt<14; attempt++){
        var x=gr+Math.random()*(W-gr*2);
        var y=zoneTop+Math.random()*(zoneBot-zoneTop);
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
    return [gr+Math.random()*(W-gr*2), zoneTop+Math.random()*(zoneBot-zoneTop)];
  }
  function spawnGold(){
    var gr=44+Math.random()*6;
    var pos=freeX(gr,H*0.67,H*0.86);
    S.grapes.push({
      x:pos[0], y:pos[1], r:gr, sour:true, gold:true, held:false,
      hits:0, squashT:0, life:2600,
      bob:Math.random()*6.28, vb:0.04+Math.random()*0.02, age:0
    });
  }
  function spawnRum(){
    var gr=46+Math.random()*4;
    var pos=freeX(gr,H*0.67,H*0.86);
    S.grapes.push({
      x:pos[0], y:pos[1], r:gr, sour:true, gold:false, rum:true, held:false,
      hits:0, squashT:0, life:4200,
      bob:Math.random()*6.28, vb:0.035+Math.random()*0.02, age:0
    });
  }
  function hasRum(){for(var i=0;i<S.grapes.length;i++)if(S.grapes[i].rum)return true;return false;}
  function sourCount(){var n=0;for(var i=0;i<S.grapes.length;i++){var g=S.grapes[i];if(g.sour&&!g.gold&&!g.rum)n++;}return n;}
  function greenCount(){var n=0;for(var i=0;i<S.grapes.length;i++){var g=S.grapes[i];if(!g.sour&&!g.gold&&!g.rum)n++;}return n;}
  function chokableCount(){if(sourMode){var n=0;for(var i=0;i<S.grapes.length;i++){var g=S.grapes[i];if(g.sour&&!g.gold&&!g.rum)n++;}return n;}return greenCount();}
  // большая гроздь: редкая крупная фиолетовая, +30; как золото, пропадает через 5 с
  function spawnBig(){
    var gr=62+Math.random()*4;
    var pos=freeX(gr,H*0.67,H*0.86);
    S.grapes.push({
      x:pos[0], y:pos[1], r:gr, sour:true, gold:false, big:true, held:false,
      hits:0, squashT:0, life:5000,
      bob:Math.random()*6.28, vb:0.025+Math.random()*0.015, age:0
    });
  }
  function hasBig(){for(var i=0;i<S.grapes.length;i++)if(S.grapes[i].big)return true;return false;}
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
  function clampX(x,r){ return Math.max(r, Math.min(W-r, x)); }
  function clampY(y,r){ return Math.max(r, Math.min(H-r, y)); }

  // обработка одного «начала касания» в точке (общая для тача и мыши)
  function beginAt(px,py){
    if(!S.running)return;
    var g=pointAt(px,py);
    if(!g){
      var kb=heroBox();
      var inFace = px>kb.x && px<kb.x+kb.w && py>kb.y && py<kb.y+kb.h*T.face.tapZone;
      if(inFace){
        var now=Date.now();
        if(now-heroTapT>1500) heroTaps=0;
        heroTapT=now; heroTaps++;
        if(heroTaps>=15){ heroTaps=0; S._sayT=0; S.bubble={t:EASTER_LINE, life:1600, max:1600}; playTouchSound(); }
      }
      return null;
    }
    var isDraggable=sourMode?(!g.sour&&!g.rum):g.sour;
    if(isDraggable){
      g.held=true; g.x=clampX(px,g.r); g.y=clampY(py,g.r); g._vx=g._vy=0; g._t=performance.now();
      return g;   // объект тащится пальцем
    } else {
      g.hits++; g.squashT=120; SFX.squash(); buzz(8);
      burst(g.x,g.y,sourMode?COL.good:COL.badHit,5);
      if(g.hits>=greenHitsNeeded()){
        burst(g.x,g.y,sourMode?COL.good:COL.bad,10);
        if(!sourMode){ STATS.green++; SESSION.green++; S.greenKillCD=700; }
        buzz(22);
        if(Math.random()<0.2) say('squash');
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
    if(Math.random()<0.6) say('combo',true);
  }

  // завершение перетаскивания объекта g в точке
  function endDrag(g){
    if(!g)return;
    if(S.grapes.indexOf(g)<0) return;     // уже съедена, исчезла или осталась от прошлой партии
    if(!S.running){ g.held=false; return; }
    var b=heroBox();
    var d=Math.hypot(g.x-b.mouthX,g.y-b.mouthY);
    if(d < b.mouthR+g.r){
      S.face='happy'; S.faceT=600; S.mouthOpen=1;
      if(sourMode){
        if(!g.sour){
          S.score+=10; SESSION.purple++;   // пасхалка в общую статистику не идёт
          SFX.eat(); buzz(14); burst(g.x,g.y,COL.bad,8);
          if(Math.random()<0.15)say('eat');
          floater(g.x,g.y,'+10',COL.bad);
          checkLevel();
          removeGrape(g);upd();
        }
        g.held=false;return;
      }
      if(g.rum){
        for(var ri=S.grapes.length-1;ri>=0;ri--){
          if(!S.grapes[ri].sour){ burst(S.grapes[ri].x,S.grapes[ri].y,COL.bad,8); S.grapes.splice(ri,1); }
        }
        S.score+=20; STATS.rum++; SESSION.rum++;
        SFX.rum(); buzz([30,50,60]); burst(g.x,g.y,COL.bonus,24); say('bonus');
        S.flash=0; S.wasFull=false; S.greenFull=0;
        S.rumGrace=2000;
        S.kurazh=6000;   // 6 секунд КУРАЖА — очки x2
        banner(T.text.bonusBanner,COL.gold,1600);
        floater(g.x,g.y,'+20',COL.gold);
        comboEat();
        checkLevel();
        removeGrape(g); upd(); g.held=false; return;
      }
      var gain=g.gold?50:(g.big?30:10);
      if(S.kurazh>0) gain*=2;   // во время куража очки удваиваются
      S.score+=gain;
      if(g.gold){ STATS.gold++; SESSION.gold++; SFX.gold(); buzz([20,40,20,40,20]); burst(g.x,g.y,COL.gold,16); say('gold'); }
      else { STATS.purple++; SESSION.purple++; SFX.eat(); buzz(g.big?[20,30,20]:14); burst(g.x,g.y,COL.good,g.big?16:8); if(g.big||Math.random()<0.3) say('eat'); }
      floater(g.x,g.y,'+'+gain, g.gold?COL.gold:COL.goodText);
      comboEat();   // после очков: надпись серии встанет строкой ниже них
      checkLevel();
      removeGrape(g); upd();
    } else if(g.held && throwAt(g,b)) return;
    g.held=false;
  }

  // ---- бросок: быстрый взмах в сторону рта — виноград сам долетает до Кунки ----
  var THROW_SPEED=0.45, THROW_AIM=0.85;   // px/мс; косинус угла между взмахом и направлением на рот
  // перетаскивание пальцем/мышью; заодно скорость взмаха (сглаженная)
  function dragTo(g,x,y){
    var now=performance.now(), dt=Math.max(1,now-(g._t||now));
    var nx=clampX(x,g.r), ny=clampY(y,g.r);
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
  // полёт брошенного к рту; долетел — съеден как обычно
  function flyStep(g,dt){
    var f=g.fly, b=heroBox();
    f.t+=dt;
    var p=Math.min(1,f.t/f.dur), e=p*p*(3-2*p);
    g.x=f.x0+(b.mouthX-f.x0)*e;
    g.y=f.y0+(b.mouthY-f.y0)*e-Math.sin(p*Math.PI)*f.arc;
    if(p<1) return;
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
    e.preventDefault();
    for(var i=0;i<e.changedTouches.length;i++){
      var t=e.changedTouches[i];
      var g=activeTouches[t.identifier];
      if(g){ endDrag(g); delete activeTouches[t.identifier]; }
    }
  }

  // ---- МЫШЬ (ПК) ----
  var mouseDrag=null;
  function onMouseDown(e){ if(e.button!==0) return; var g=beginAt(e.clientX,e.clientY); if(g) mouseDrag=g; }
  function onMouseMove(e){ if(!S.running||!mouseDrag)return; dragTo(mouseDrag,e.clientX,e.clientY); }
  function onMouseUp(e){ if(mouseDrag){ endDrag(mouseDrag); mouseDrag=null; } }

  function removeGrape(g){var i=S.grapes.indexOf(g);if(i>=0)S.grapes.splice(i,1);}
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
    ctx.font='900 30px '+FONT.text;
    var w=ctx.measureText(t).width;
    for(var n=0;n<S.floaters.length;n++){
      for(var i=0;i<S.floaters.length;i++){
        var o=S.floaters[i];
        if(o.life<40) continue;   // уже поднялись выше — не мешают
        if(Math.abs(o.y-y)<FLOATER_GAP && Math.abs(o.x-x)<(o.w+w)/2){ y=o.y+FLOATER_GAP; break; }
      }
      if(i===S.floaters.length) break;
    }
    y=Math.min(y,H-20);
    S.floaters.push({x:x,y:y,t:t,c:c,w:w,life:60});
  }

  // ---- реплики персонажа (тексты — из темы) ----
  var LINES=T.lines;
  // force — важный момент (шторм, добыча, рекорд): говорит, даже если только что что-то сказал
  function say(kind,force){
    var arr=LINES[kind]; if(!arr||!arr.length)return;
    if(!force && S._sayT && Date.now()-S._sayT<2200) return;
    S._sayT=Date.now();
    S.bubble={t:arr[Math.floor(Math.random()*arr.length)], life:1600, max:1600};
  }
  function burst(x,y,color,n){
    n=n||8;
    for(var i=0;i<n;i++){
      if(S.particles.length>=MAX_PARTICLES) S.particles.shift();
      var a=Math.random()*6.28,sp=1.5+Math.random()*4;
      S.particles.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1,r:2+Math.random()*3,c:color,life:26+Math.random()*16});
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
    death={t:0, dur:2800, puffs:[]};
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
  function finishDeath(){
    death=null; deathLast=0; _deathAlive=false;
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
    document.getElementById('overtitle').textContent=T.text.lose;
    document.getElementById('finsc').parentElement.style.display='';
    document.getElementById('overbest').style.display='';
    document.getElementById('again').style.display='';
    document.getElementById('finsc').textContent=S.score;
    _shareData={score:S.score,level:SESSION.level||S.level,rank:rank(S.score),purple:SESSION.purple||0,gold:SESSION.gold||0,mode:S.mode};
    prepareShare();
    // личный рекорд (обновлён в end())
    var be=document.getElementById('overbest');
    be.textContent = (newBest?('НОВЫЙ РЕКОРД! '+best):('Рекорд: '+best))+'  •  '+rank(best);
    be.classList.toggle('isnew',newBest);
    lastSubmitted=false;
    showSubmitNote('');
    document.getElementById('submitBox').style.display='flex';
    document.getElementById('submitScore').disabled=false;
    document.getElementById('submitScore').textContent='Записать рекорд';
    document.getElementById('board').style.display='';
    document.getElementById('shareBtn').style.display='';
    document.getElementById('boardRows').innerHTML='<div class="bload">загрузка…</div>';
    setBoardTitle();
    showBoard(savedName());
    over.style.display='flex';
    game.style.display='none';
  }

  // показ таблицы лидеров из меню (без формы записи и счёта)
  function showLeaderboardOnly(){
    resultShown=false;
    document.getElementById('overtitle').textContent='Таблица рекордов';
    document.querySelector('#over .fin').style.display='none';
    document.getElementById('overbest').style.display='none';
    document.getElementById('submitBox').style.display='none';
    showSubmitNote('');
    document.getElementById('again').style.display='none';
    document.getElementById('shareBtn').style.display='none';
    document.getElementById('board').style.display='';
    document.getElementById('boardRows').innerHTML='<div class="bload">загрузка…</div>';
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
    S.running=false;
    _loopAlive=false;
    document.body.classList.remove('ingame');
    document.body.removeAttribute('data-weather'); document.body.removeAttribute('data-event');
    // статистика Каюты — только за настоящие партии, пасхалка не считается
    if(!sourMode){
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
      if(S.spawnT>S.spawnGap && S.grapes.length-((hasRum()?1:0)+(hasGold()?1:0))<8){
        S.spawnT=0;
        // «опасный» виноград душит персонажа, «съедобный» он ест. В обычной игре опасный — зелёный,
        // в пасхалке роли меняются (иначе съедобный заполнял поле и игра зависала)
        var badType=sourMode?'sour':'green', goodType=sourMode?'green':'sour';
        var goodCap=4;
        var goodCount=sourMode?greenCount():sourCount();
        var greenChance=Math.min(0.64,0.45+S.level*0.012);
        if(gc<=1) greenChance=Math.min(0.78,greenChance+0.2);
        greenChance=Math.min(0.82, greenChance + (S.greenDry||0)*0.12);
        var grace=(S.rumGrace||0)>0 || !!S.loot;   // после рома и во время добычи зелёных нет
        var greenKillGrace=(S.greenKillCD||0)>0;
        var rollBad=Math.random()<greenChance && !grace && !greenKillGrace;
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
    updateWeather(dt,gc);
    updateLoot(dt,gc);
    if(S.greenKillCD>0) S.greenKillCD-=dt;
    if(S.rumGrace>0) S.rumGrace-=dt;   // тает передышка после рома
    if(S.kurazh>0) S.kurazh-=dt;       // тает кураж (x2 очки)
    if(S.comboT>0){ S.comboT-=dt; if(S.comboT<=0) S.combo=0; }   // пауза дольше окна — серия сброшена

    // distress: нарастает когда зелёных 4 (персонажу плохо), плавно спадает иначе
    var target=(gc>=4)?1:0;
    S.distress += (target - S.distress) * Math.min(1, dt/220);
    if(gc>=4){
      warnSndT-=dt; if(warnSndT<=0){SFX.warn(); warnSndT=620;}
    }else{ warnSndT=0; }

    // золото — редкое. Не появляется в горячий момент (зелёных 3+), чтобы не мешать
    S.goldT=(S.goldT||0)+dt;
    S.goldPity=(S.goldPity||0)+dt;
    if(!sourMode && !hasGold() && gc<3){
      if(S.goldPity>=35000){ spawnGold(); S.goldT=0; S.goldPity=0; }
      else if(S.goldT>3000){ S.goldT=0; if(Math.random()<0.16){ spawnGold(); S.goldPity=0; } }
    } else if(hasGold()){ S.goldPity=0; }

    // большая гроздь — со 2 уровня, в спокойный момент, примерно раз в полминуты
    S.bigT=(S.bigT||0)+dt;
    if(S.bigT>4000){
      S.bigT=0;
      if(!sourMode && S.level>=2 && gc<3 && !S.loot && !hasBig() && Math.random()<0.12) spawnBig();
    }

    // ром — бонус КУРАЖ (x2 очки). Появляется периодически, за ним охотишься.
    if(!sourMode){
    if(S.rumCD>0) S.rumCD-=dt;
    if(hasRum()){
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
    }

    var storm=weatherPower('storm');
    var wave=storm>0 ? Math.sin(S.weather.t/650)*W*0.0042*storm : 0;   // общая волна, пикселей за кадр
    for(var i=S.grapes.length-1;i>=0;i--){
      var g=S.grapes[i];
      g.age=(g.age||0)+dt;
      if(g.fly){ flyStep(g,dt); continue; }
      if(wave && !g.held) g.x=clampX(g.x+wave*k*(0.8+0.4*Math.sin(g.bob*0.5)),g.r);
      if(!g.held){
        g.bob+=g.vb*k;
        // золото и ром исчезают по таймеру (пока их держат пальцем — нет)
        if(g.life>0){ g.life-=dt; if(g.life<=0){ S.grapes.splice(i,1); continue; } }
      }
      if(g.squashT>0)g.squashT-=dt;
    }
    if(S.faceT>0){S.faceT-=dt;if(S.faceT<=0)S.face='idle';}
    if(S.mouthOpen>0)S.mouthOpen-=dt/600;if(S.mouthOpen<0)S.mouthOpen=0;
    for(var pp=S.particles.length-1;pp>=0;pp--){
      var pt=S.particles[pp];
      pt.x+=pt.vx*k; pt.y+=pt.vy*k; pt.vy+=0.22*k; pt.vx*=Math.pow(0.98,k);
      pt.life-=k; if(pt.life<=0)S.particles.splice(pp,1);
    }
    for(var j=S.floaters.length-1;j>=0;j--){
      var f=S.floaters[j];
      f.life-=k;if(f.life<=0)S.floaters.splice(j,1);
    }
    if(S.shake>0){ S.shake*=Math.pow(0.731,k); if(S.shake<.5)S.shake=0; }
    if(S.flash>0) S.flash-=dt/400;
    if(S.banner){ S.banner.life-=dt; if(S.banner.life<=0)S.banner=null; }
    if(S.bubble){ S.bubble.life-=dt; if(S.bubble.life<=0)S.bubble=null; }
  }

  function draw(){
    ctx.clearRect(0,0,W,H);   // море — отдельный слой под холстом
    var sx=0,sy=0;
    if(S.shake>0){sx=(Math.random()-.5)*S.shake;sy=(Math.random()-.5)*S.shake;}
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
      var img=g.gold?goldImg:(g.sour?purpleImg:greenImg);
      var s=g.r*2.2;
      // зелёный уменьшается пропорционально нужным тычкам: от 1.0 до 0.45
      var shrink=1;
      if(!g.sour){
        var need=greenHitsNeeded();
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
      if((g.gold||g.big) && g.life>0 && g.life<800 && Math.floor(Date.now()/120)%2===0){ continue; }
      // мягкая тень под виноградом — добавляет объём
      ctx.save();
      ctx.globalAlpha=0.28;
      ctx.fillStyle='#000';
      ctx.beginPath();
      ctx.ellipse(g.x, g.y+bobY+sh*0.42, sw*0.34, sh*0.12, 0, 0, 6.28);
      ctx.fill();
      ctx.restore();
      if(ready(img)){
        if(g.gold){
          // дешёвое свечение без shadowBlur: полупрозрачный жёлтый круг
          var gp=0.5+0.3*Math.sin(g.bob*2);
          if(!_goldGlow) _goldGlow=glowSprite('255,215,90',0.2/0.75);
          ctx.globalAlpha=0.45*gp;
          ctx.drawImage(_goldGlow,g.x-sw*0.75,g.y+bobY-sw*0.75,sw*1.5,sw*1.5);
          ctx.globalAlpha=1;
        }
        ctx.drawImage(sprite(img,s,s),g.x-sw/2,g.y-sh/2+bobY,sw,sh);
      }else{
        ctx.beginPath();ctx.arc(g.x,g.y+bobY,g.r*shrink,0,6.28);
        ctx.fillStyle=g.gold?COL.gold:(g.sour?COL.goodDark:COL.badHit);ctx.fill();
      }
    }

    // брызги-частицы
    for(var pc=0;pc<S.particles.length;pc++){
      var ptc=S.particles[pc];
      ctx.globalAlpha=Math.max(0,ptc.life/42);
      ctx.fillStyle=ptc.c;
      ctx.beginPath();ctx.arc(ptc.x,ptc.y,ptc.r,0,6.28);ctx.fill();
    }
    ctx.globalAlpha=1;

    // всплывающий текст
    // плавно: размер меняется масштабом (а не целыми пикселями шрифта), подъём и исчезание — по кривой
    // крупный жирный шрифт, тёмная обводка и тень под ней — читается на любом фоне
    FLOAT_TEXT.font=FONT.text;
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
      var bx=kb.mouthX, by=kb.y + kb.h*T.face.bubbleY;  // зона лба / над бровями
      // не давать пузырю налезать на верхний интерфейс (пауза/счёт): держим ниже HUD
      var minCenter=72 + bh/2;
      if(by<minCenter) by=minCenter;
      var bs=bubbleSprite(bb.t,bh);
      ctx.globalAlpha=Math.max(0,Math.min(1,bAl));
      ctx.drawImage(bs.c, bx-bs.w/2, by-bh/2-2, bs.w, bs.h);
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
      // КУРАЖ-бар: золотая полоска снизу, убывает с таймером
      var barFrac=Math.min(1,S.kurazh/6000);
      var barW=W*barFrac;
      ctx.save();
      ctx.globalAlpha=0.82+0.18*kpulse;
      var bg2=ctx.createLinearGradient(0,0,barW,0);
      bg2.addColorStop(0,COL.gold);
      bg2.addColorStop(0.7,'#e8a820');
      bg2.addColorStop(1,'rgba(255,200,60,0.3)');
      ctx.fillStyle=bg2;
      ctx.fillRect(0,H-5,barW,5);
      ctx.restore();
    }

    if(!(S.kurazh>0)) setEdge('kurazh',0);

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
        ctx.font='900 42px '+FONT.title;
        var bnTw=ctx.measureText(bl.t).width, maxW=W*0.86;
        bl.px=bnTw>maxW ? Math.max(20, Math.floor(42*maxW/bnTw)) : 42;
      }
      BANNER_TEXT.px=bl.px; BANNER_TEXT.font=FONT.title;
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
    if(fpsT/fpsN>22){ DPR_MAX=1; resize(); _portraitCache={}; }
    fpsT=0; fpsN=0;
  }
  function loop(ts){
    if(!S.last)S.last=ts;
    var dt=ts-S.last;S.last=ts;
    if(S.running) watchFps(dt);
    if(dt>100)dt=16;            // защита от скачка после паузы/сворачивания
    try{
      if(countdown){
        countdown.t+=dt;
        draw();
        drawCountdown();
        if(countdown.t>=900){ countdown.n--; countdown.t=0;
          if(countdown.n<=0){
            countdown=null; S.running=true;
            if(landscapeMQ.matches) togglePause();   // телефон повернули во время отсчёта — поле закрыто заставкой
          }
        }
        requestAnimationFrame(loop);
        return;
      }
      update(dt);draw();
    }catch(err){
      if(window.console&&console.error) console.error('loop error:',err);
      resize();   // сбрасывает незакрытые save()/translate упавшего кадра
    }
    if(S.running && game.style.display!=='none'){ requestAnimationFrame(loop); }
    else { _loopAlive=false; }
  }
  // картинки цифр отсчёта
  var cdImg={'1':themeImg(T.images.countdown[0]),'2':themeImg(T.images.countdown[1]),'3':themeImg(T.images.countdown[2])};

  // ---- загрузка картинок: на медленном интернете партия не начинается с пустым полем ----
  // «Играть» ждёт, пока картинки загрузятся (или не загрузятся — тогда есть запасная отрисовка);
  // из кеша это мгновенно, надпись «Загрузка…» появляется, только если ждать заметно, а при зависшей сети — не дольше 15 с
  var gameImgs=[heroImg,heroOpenImg,chokeImg,purpleImg,greenImg,goldImg,rumImg,seaBg,cdImg['1'],cdImg['2'],cdImg['3']];
  var assetsLoaded=false, onAssets=[];
  function whenLoaded(cb){ if(assetsLoaded) cb(); else onAssets.push(cb); }
  (function(){
    var btn=document.getElementById('play'), label=btn.textContent, t0=Date.now();
    (function check(){
      if(gameImgs.every(function(i){ return i.complete; }) || Date.now()-t0>15000){
        assetsLoaded=true; btn.textContent=label; btn.classList.remove('loading');
        onAssets.splice(0).forEach(function(cb){ cb(); });
        return;
      }
      if(Date.now()-t0>300){ btn.textContent='Загрузка…'; btn.classList.add('loading'); }
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
    if(el) el.textContent = best>0 ? ('Рекорд: '+best+'  •  '+rank(best)) : '';
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
        setTimeout(function(){ whenLoaded(function(){ et.style.display='none'; starting=false; start(); }); },2000); }
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
    var btn=this; btn.disabled=true; btn.textContent='отправка…';
    // режим берём из партии: пока ответ в пути, игрок может уйти в меню и переключить сложность
    lbSubmit(name,myScore,S.mode,function(ok,why,nickBest){
      if(myGame!==gameNo || !resultShown) return;   // игрок уже ушёл с экрана результата — другие экраны не трогаем
      if(why==='nosession'){ btn.textContent='Партия была без связи'; return; }   // повтор не поможет
      if(why==='rejected'){ btn.textContent='Результат не принят'; return; }
      if(!ok){ btn.disabled=false; btn.textContent='Не отправилось, ещё раз'; return; }
      lastSubmitted=true;
      try{ localStorage.setItem(KEY+'name',name); }catch(e){}
      document.getElementById('submitBox').style.display='none';
      // у имени в таблице одна запись — лучший результат; если он выше этой партии, говорим об этом
      if(nickBest!=null && nickBest>myScore) showSubmitNote('Под этим именем уже есть рекорд выше: '+nickBest);
      document.getElementById('boardRows').innerHTML='<div class="bload">обновляем…</div>';
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
      cx.font='bold 34px Georgia,serif';
      cx.fillText(T.title.toUpperCase(), W/2, 58);
      cx.fillStyle='#7a5520';
      cx.font='13px Georgia,serif';
      cx.fillText(T.subtitle+(data.mode==='hard'?' · ХАРДКОР':''), W/2, 78);
      // top divider
      cx.strokeStyle='rgba(199,155,66,0.6)'; cx.lineWidth=1;
      cx.beginPath(); cx.moveTo(50,94); cx.lineTo(W-50,94); cx.stroke();
      // score
      cx.fillStyle='#ffffff';
      cx.font='bold 76px Georgia,serif';
      cx.fillText(String(data.score), W/2, 186);
      cx.fillStyle='#6a4a10';
      cx.font='bold 12px Georgia,serif';
      cx.fillText('ОЧКОВ', W/2, 206);
      // rank
      cx.fillStyle=COL.gold;
      cx.font='bold 26px Georgia,serif';
      cx.fillText(data.rank, W/2, 244);
      // stats
      cx.fillStyle='#9a7030';
      cx.font='15px Georgia,serif';
      var st='Уровень '+data.level+'  ·  '+T.text.shareGood+' '+data.purple;
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
    var mode=data.mode==='hard'?', хардкор':'';
    return T.fullTitle+mode+'\n'+data.score+' очков, '+data.rank+', уровень '+data.level+'\n\n'+CFG.siteUrl;
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
        btn.textContent=ok?'Скопировано':'Не удалось скопировать';
        setTimeout(function(){btn.textContent='Поделиться результатом';},2200);
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
  function paintToggle(btn,on){ btn.textContent=on?'ВКЛ':'ВЫКЛ'; btn.classList.toggle('on',on); btn.classList.toggle('off',!on); }
  function paintDiff(){
    var bs=document.querySelectorAll('.diff');
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
  function medalSVG(on){
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
      rp.next ? ('до звания '+rp.next+': '+rp.need+' очков') : 'высшее звание достигнуто';
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

  // ползунок громкости музыки
  var musicVolEl=document.getElementById('musicVol');
  var volValEl=document.getElementById('volVal');
  function paintVol(){
    if(musicVolEl) musicVolEl.value=Math.round(musicVol*100);
    if(volValEl) volValEl.textContent=Math.round(musicVol*100)+'%';
  }
  paintVol();
  if(musicVolEl){
    musicVolEl.addEventListener('input',function(){
      musicVol=Math.max(0,Math.min(1,(parseInt(this.value,10)||0)/100));
      if(volValEl) volValEl.textContent=Math.round(musicVol*100)+'%';
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
    var touched=false;
    // подавляем нативную подсветку касания (чёрный квадрат на Android-Chrome)
    pb.addEventListener('touchstart',function(e){
      e.preventDefault();           // не даём браузеру нарисовать highlight и сгенерить click
      touched=true;
      togglePause(); pb.blur();
    }, {passive:false});
    pb.addEventListener('click',function(e){
      e.stopPropagation();
      if(touched){ touched=false; return; }  // тач уже обработан — пропускаем дубль
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
  function onOrientation(){
    if(landscapeMQ.matches && game.style.display!=='none' && !paused && !countdown && S.running) togglePause();
  }
  if(landscapeMQ.addEventListener) landscapeMQ.addEventListener('change',onOrientation);
  else if(landscapeMQ.addListener) landscapeMQ.addListener(onOrientation);

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
