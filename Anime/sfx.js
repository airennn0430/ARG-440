/**
 * 効果音（SE）— Anime.html からの相対パスで配置
 * Anime/SE/ringtone.mp3, calling.mp3, click.mp3, busy_tone.mp3
 */
(function () {
  const SE = {
    ringtone: 'SE/ringtone.mp3',
    calling: 'SE/calling.mp3',
    click: 'SE/click.mp3',
    busy: 'SE/busy_tone.mp3',
  };

  const VOL = {
    ringtone: 0.55,
    calling: 0.35,
    click: 0.65,
    busy: 0.7,
  };

  let ringAudio = null;
  let callingAudio = null;
  let clickAudio = null;

  function safePlay(audio) {
    if (!audio) return;
    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(function () {});
    }
  }

  function stopLoop(ref) {
    if (!ref) return;
    ref.pause();
    ref.currentTime = 0;
  }

  function startRingtone() {
    stopRingtone();
    ringAudio = new Audio(SE.ringtone);
    ringAudio.loop = true;
    ringAudio.volume = VOL.ringtone;
    const p = ringAudio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(function () {
        // autoplay blocked — retry on first user gesture
        const captured = ringAudio;
        function retryRing() {
          document.removeEventListener('touchstart', retryRing);
          document.removeEventListener('click', retryRing);
          if (captured && captured === ringAudio) {
            captured.play().catch(function () {});
          }
        }
        document.addEventListener('touchstart', retryRing);
        document.addEventListener('click', retryRing);
      });
    }
  }

  function stopRingtone() {
    stopLoop(ringAudio);
    ringAudio = null;
  }

  function startCalling() {
    stopCalling();
    callingAudio = new Audio(SE.calling);
    callingAudio.loop = true;
    callingAudio.volume = VOL.calling;
    safePlay(callingAudio);
  }

  function stopCalling() {
    stopLoop(callingAudio);
    callingAudio = null;
  }

  function playClick() {
    if (!clickAudio) {
      clickAudio = new Audio(SE.click);
      clickAudio.volume = VOL.click;
    }
    clickAudio.pause();
    clickAudio.currentTime = 0;
    safePlay(clickAudio);
  }

  function playBusyTone() {
    const a = new Audio(SE.busy);
    a.volume = VOL.busy;
    safePlay(a);
  }

  /** デバッグ用リセットなど */
  function stopAllLoops() {
    stopRingtone();
    stopCalling();
  }

  window.AnimeSFX = {
    startRingtone,
    stopRingtone,
    startCalling,
    stopCalling,
    playClick,
    playBusyTone,
    stopAllLoops,
  };
})();
