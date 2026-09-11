/**
 * Anime 通話終了まで到達したブラウザのみ、指定人名を █ 伏字（.ar-glitch）に置換する。
 * localStorage キーは Anime/Anime.html の showCallEndScreen と共有。
 * Toraporta_LP/truth.html だけは常にスキップ（伏字をかけない）。
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'anime_call_end_reached_v1';

  /** Toraporta_LP/truth.html のみ伏字ギミックを無効化（他ページは従来どおり） */
  function isTruthHtmlPage() {
    try {
      var path = (window.location.pathname || '').replace(/\\/g, '/');
      return /\/truth\.html$/i.test(path);
    } catch (e) {
      return false;
    }
  }

  /* 長い語を先にマッチ（正規表現の | は先勝ちのため、配列は長さ降順） */
  var PHRASES = [
    'ししおう ちあき',
    'ししおうちあき',
    '獅子王 千暁',
    '獅子王千暁',
    '伏見 瀬人',
    '伏見瀬人',
    '九重 灰',
    '黒木 凪',
    'ししおう',
    '九重灰',
    '黒木凪',
    '獅子王',
    '九重',
    '伏見',
    '黒木',
  ];

  function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  var pattern = PHRASES.map(escapeRe).join('|');

  function isActive() {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function shouldSkipTextNode(node) {
    var p = node.parentElement;
    if (!p) return true;
    var tag = p.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'NOSCRIPT') return true;
    if (tag === 'CODE' || tag === 'KBD' || tag === 'SAMP' || tag === 'PRE') return true;
    if (p.closest && p.closest('script, style, textarea, noscript, code, kbd, samp, pre')) return true;
    if (p.closest && (p.closest('.glitch') || p.closest('.glitch-text') || p.closest('.ar-glitch'))) return true;
    return false;
  }

  function blocksFor(match) {
    return '\u2588'.repeat(Array.from(match).length);
  }

  function processTextNode(node) {
    if (shouldSkipTextNode(node)) return;
    var text = node.nodeValue;
    if (!text) return;

    var localRe = new RegExp('(' + pattern + ')', 'g');
    if (!localRe.test(text)) return;
    localRe.lastIndex = 0;

    var frag = document.createDocumentFragment();
    var last = 0;
    var m;
    while ((m = localRe.exec(text)) !== null) {
      if (m.index > last) {
        frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      }
      var raw = m[1];
      var blocks = blocksFor(raw);
      var span = document.createElement('span');
      span.className = 'ar-glitch';
      span.setAttribute('data-text', blocks);
      span.textContent = blocks;
      span.setAttribute('aria-label', '伏字');
      frag.appendChild(span);
      last = m.index + raw.length;
    }
    if (last < text.length) {
      frag.appendChild(document.createTextNode(text.slice(last)));
    }
    node.parentNode.replaceChild(frag, node);
  }

  /* ページごとの画像伏字対象。src に部分一致した <img> をエラーアイコン表示に差し替える。
     pathSuffix はページの pathname（小文字）の末尾一致で判定。 */
  var IMAGE_REDACT_RULES = [
    { pathSuffix: '/rienta_article/article/440.html', matches: ['shishio.jpg', 'img_6091.webp'] },
    { pathSuffix: '/toraporta_lp/toraporta.html', matches: ['shishio.jpg'] },
  ];

  var ERROR_ICON_SVG_MARKUP =
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" ' +
    'fill="none" stroke="#9a95ab" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="2" y="2" width="20" height="20" rx="2"/>' +
    '<circle cx="8.5" cy="8.5" r="1.5"/>' +
    '<path d="m21 15-5-5L5 21"/>' +
    '<line x1="3" y1="3" x2="21" y2="21"/>' +
    '</svg>';
  var ERROR_ICON_SRC = 'data:image/svg+xml,' + encodeURIComponent(ERROR_ICON_SVG_MARKUP);

  function getImageRedactMatches() {
    try {
      var path = (window.location.pathname || '').replace(/\\/g, '/').toLowerCase();
      for (var i = 0; i < IMAGE_REDACT_RULES.length; i++) {
        if (path.indexOf(IMAGE_REDACT_RULES[i].pathSuffix) !== -1) {
          return IMAGE_REDACT_RULES[i].matches;
        }
      }
    } catch (e) {}
    return null;
  }

  function isRedactImageSrc(src, matches) {
    if (!src) return false;
    var lower = src.toLowerCase();
    for (var i = 0; i < matches.length; i++) {
      if (lower.indexOf(matches[i]) !== -1) return true;
    }
    return false;
  }

  function replaceImageWithErrorIcon(img) {
    if (!img || img.getAttribute('data-ar-img-redacted') === '1') return;
    img.setAttribute('data-ar-img-redacted', '1');
    img.src = ERROR_ICON_SRC;
    img.alt = '画像を表示できません';
    img.classList.add('ar-img-error');
  }

  function applyImageRedact(root) {
    var matches = getImageRedactMatches();
    if (!matches || !root || !root.querySelectorAll) return;
    var imgs = root.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      if (isRedactImageSrc(imgs[i].getAttribute('src'), matches)) {
        replaceImageWithErrorIcon(imgs[i]);
      }
    }
  }

  function glitchTextNeedsRedact(text) {
    if (!text) return false;
    for (var i = 0; i < PHRASES.length; i++) {
      if (text.indexOf(PHRASES[i]) !== -1) return true;
    }
    return false;
  }

  /** truth.html 等の .glitch-text（疑似要素が data-text 依存）— 人名を含む場合は要素ごと伏字に差し替え */
  function redactGlitchTextElements(root) {
    if (!root.querySelectorAll) return;
    var list = root.querySelectorAll('.glitch-text');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      var t = el.textContent;
      if (!glitchTextNeedsRedact(t)) continue;
      var blocks = blocksFor(t);
      var span = document.createElement('span');
      span.className = 'ar-glitch';
      span.setAttribute('data-text', blocks);
      span.textContent = blocks;
      span.setAttribute('aria-label', '伏字');
      el.replaceWith(span);
    }
  }

  function applyRedactSubtree(root) {
    if (isTruthHtmlPage() || !isActive() || !root) return;

    redactGlitchTextElements(root);
    applyImageRedact(root);

    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var nodes = [];
    var n;
    while ((n = walker.nextNode())) {
      nodes.push(n);
    }
    for (var i = 0; i < nodes.length; i++) {
      processTextNode(nodes[i]);
    }
  }

  var debounceTimer = null;
  function scheduleApply() {
    if (isTruthHtmlPage() || !isActive()) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      debounceTimer = null;
      applyRedactSubtree(document.body);
    }, 100);
  }

  var observerStarted = false;
  function observeMutations() {
    if (observerStarted || typeof MutationObserver === 'undefined') return;
    observerStarted = true;
    var obs = new MutationObserver(function () {
      scheduleApply();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function recheck() {
    if (isTruthHtmlPage() || !isActive()) return;
    applyRedactSubtree(document.body);
    observeMutations();
  }

  function init() {
    recheck();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* bfcache復元（他ページで通話を完了後、ブラウザの「戻る」で帰ってきた場合）に再チェック */
  window.addEventListener('pageshow', recheck);
  /* 別タブで通話終了フラグが立った場合に再チェック */
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY) recheck();
  });
})();
