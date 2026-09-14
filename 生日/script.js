/* =========================================================
   生日祝福页面 · 公共脚本

   每个页面先用 <script> 定义好 PAGE 配置，再引入本文件：
   PAGE = {
     image:           这一步要显示的照片
     next:            下一步要跳转的页面
     alertText:       打开页面就先弹出的 alert（不写就跳过）
     alertAfterClick: 看完照片、点击屏幕后弹出的 alert（不写就点了直接翻页）
     final:           true 表示这是最后一页（放生日歌，不再跳转）
   }
   ========================================================= */
(function () {
  var card  = document.getElementById('card');
  var photo = document.getElementById('photo');

  /* ---------- 第一步：有 alert 的页面先互动（页面只有白底 + 弹窗） ---------- */
  window.addEventListener('load', function () {
    /* 没有写 alertText 的页面 = 没有 alert 互动，直接显示图片 */
    if (!PAGE.alertText) {
      if (PAGE.final) { showFinal(); } else { showPhoto(); }
      return;
    }

    setTimeout(function () {
      alert(PAGE.alertText);                /* alert 互动 */
      if (PAGE.final) { showFinal(); }      /* 互动结束 → 生日歌 + 7.jpg */
      else { showPhoto(); }                 /* 互动结束 → 出现这一张照片 */
    }, 150);
  });

  /* ---------- 第二步：出现照片。再点击一次页面，才进入下一个 alert 互动 ---------- */
  function showPhoto() {
    if (PAGE.image && photo) { photo.src = PAGE.image; }

    card.classList.remove('hidden');
    card.classList.add('pop');

    /* 刚关闭弹窗的那一下不算，稍等一下才开始接收点击 */
    var ready = false;
    setTimeout(function () { ready = true; }, 300);

    function goNextPage() {
      if (!ready || !PAGE.next) { return; }
      document.removeEventListener('click', goNextPage);
      document.removeEventListener('keydown', onKey);

      /* 这张照片看完后要先弹一次 alert 互动，互动结束再出现下一张图片 */
      if (PAGE.alertAfterClick) { alert(PAGE.alertAfterClick); }

      location.href = PAGE.next;            /* 进入下一张图片 */
    }

    function onKey(e) {
      if (e.key === 'Enter' || e.key === ' ') { goNextPage(); }
    }

    document.addEventListener('click', goNextPage);
    document.addEventListener('keydown', onKey);
  }

  /* ---------- 最后一页：7.jpg + 生日祝福 + 播放生日歌 ---------- */
  function showFinal() {
    card.classList.remove('hidden');
    card.classList.add('pop');

    /* 散落在背景上的 4 张表情包 */
    var scatter = document.getElementById('scatter');
    if (scatter) { scatter.classList.remove('hidden'); }

    confetti();
    tryLoadSong(0);

    /* 浏览器拦截自动播放时：用户第一次点页面就补放一次 */
    document.addEventListener('click', function retry() {
      if (songAudio && songAudio.paused) { playSong(); }
      document.removeEventListener('click', retry);
    });
  }

  /* =========================================================
     生日歌：从「今天你生日，送上我祝福」这句开始循环播放
     ========================================================= */
  var SONG_START = 51.9;    /* 起始播放位置（秒） */

  var SONG_FILES = [
    '海底捞生日歌.mp3',
    '海底捞生日歌.m4a',
    '海底捞生日歌.wav',
    '生日歌.mp3',
    '生日快乐.mp3',
    'birthday.mp3'
  ];

  var musicTip = document.getElementById('musicTip');
  var songAudio = null;    /* 真实音频文件 */
  var actx = null;         /* Web Audio 上下文 */
  var loopTimer = null;    /* 内置旋律的循环定时器 */

  /* 尝试加载真实的音乐文件 */
  function tryLoadSong(index) {
    if (index >= SONG_FILES.length) { startSynthMelody(); return; }

    var audio = new Audio();
    var settled = false;

    function fail() {
      if (settled) return;
      settled = true;
      tryLoadSong(index + 1);
    }

    audio.addEventListener('error', fail, { once: true });
    audio.addEventListener('canplaythrough', function () {
      if (settled) return;
      settled = true;
      songAudio = audio;
      songAudio.volume = 0.9;

      /* 从「今天你生日，送上我祝福」开始播 */
      try { songAudio.currentTime = SONG_START; } catch (e) {}

      /* 播到结尾后回到这一句继续循环 */
      songAudio.addEventListener('ended', function () {
        try { songAudio.currentTime = SONG_START; } catch (e) {}
        songAudio.play();
      });

      playSong();
    }, { once: true });

    audio.src = SONG_FILES[index];
    audio.load();
    setTimeout(fail, 1500);
  }

  function playSong() {
    if (!songAudio) return;
    songAudio.play().then(function () {
      if (musicTip) { musicTip.classList.add('hidden'); }
    }).catch(function () {
      if (musicTip) {
        musicTip.textContent = '浏览器拦截了自动播放，点一下页面任意位置就能听到生日歌啦～';
        musicTip.classList.remove('hidden');
      }
    });
  }

  /* 内置生日旋律（找不到音频文件时才会用到） */
  var TONE_BASE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  function noteFreq(name) {
    var m = /^([A-G])(#?)(-?\d)$/.exec(name);
    var midi = 12 * (parseInt(m[3], 10) + 1) + TONE_BASE[m[1]] + (m[2] ? 1 : 0);
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /* 生日快乐歌旋律：[音名, 拍数] */
  var MELODY = [
    ['G4', 0.5], ['G4', 0.5], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
    ['G4', 0.5], ['G4', 0.5], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
    ['G4', 0.5], ['G4', 0.5], ['G5', 1], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 2],
    ['F5', 0.5], ['F5', 0.5], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 2]
  ];

  function tone(ctx, freq, start, dur, gain, type) {
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = type || 'triangle';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + Math.max(dur, 0.08));
    osc.connect(g).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.06);
  }

  function startSynthMelody() {
    if (songAudio) return;
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    playOnce();
  }

  function playOnce() {
    if (!actx || songAudio) return;
    var beat = 60 / 112;                   /* 每分钟 112 拍 */
    var t = actx.currentTime + 0.15;

    MELODY.forEach(function (n) {
      var dur = n[1] * beat;
      tone(actx, noteFreq(n[0]), t, dur * 0.92, 0.20, 'triangle');
      tone(actx, noteFreq(n[0]) * 2, t, dur * 0.45, 0.04, 'sine');
      t += dur;
    });

    var total = t - actx.currentTime;
    loopTimer = setTimeout(playOnce, (total + 1.3) * 1000);
  }

  /* =========================================================
     结尾：蛋糕、蜡烛、彩带为主从天上飘落（爱心很少）
     ========================================================= */
  var PARTY_EMOJI = [
    '🎂', '🎂',        /* 蛋糕 */
    '🕯️', '🕯️',        /* 蜡烛 */
    '🎀', '🎀',        /* 彩带 */
    '🎉', '🎊',        /* 礼花 */
    '🎈',              /* 气球 */
    '🎁',              /* 礼物 */
    '✨', '⭐',         /* 闪光 */
    '💙'               /* 爱心：只留一点点 */
  ];

  function dropDecor(count) {
    for (var i = 0; i < count; i++) {
      var c = document.createElement('div');
      c.className = 'confetti';
      c.textContent = PARTY_EMOJI[Math.floor(Math.random() * PARTY_EMOJI.length)];
      c.style.left = (Math.random() * 100) + 'vw';
      c.style.fontSize = (18 + Math.random() * 18) + 'px';
      c.style.setProperty('--drift', (Math.random() * 180 - 90) + 'px');   /* 左右飘一点 */
      c.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');  /* 旋转 */
      c.style.animationDuration = (4 + Math.random() * 3.5) + 's';
      c.style.animationDelay = (Math.random() * 0.8) + 's';
      c.addEventListener('animationend', function () { this.remove(); });
      document.body.appendChild(c);
    }
  }

  function confetti() {
    dropDecor(26);                                          /* 开场先撒一大把 */
    setInterval(function () { dropDecor(2); }, 1000);        /* 之后持续往下飘 */
  }
})();
