/**
 * 訪問者ごとの永続トークン(vid)を管理し、ARG関連の別ドメインへのリンクに
 * 自動で ?vid=... を付与して引き継ぐ。クロスドメインでlocalStorageが
 * 共有できないため、リンククリック経由でアイデンティティを伝播させる。
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'arg440_vid';
  var KNOWN_DOMAINS = [
    'hidarling.vercel.app',
    'toraporta.vercel.app',
    'rienta.vercel.app',
    's-lack.vercel.app',
  ];

  var memoryVid = null;

  function genUuid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function readStored() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function writeStored(vid) {
    try {
      localStorage.setItem(STORAGE_KEY, vid);
    } catch (e) {
      memoryVid = vid;
    }
  }

  function getVid() {
    var stored = readStored();
    if (stored) return stored;
    if (memoryVid) return memoryVid;
    var fresh = genUuid();
    writeStored(fresh);
    memoryVid = fresh;
    return fresh;
  }

  function adoptIncomingVid() {
    try {
      var params = new URLSearchParams(window.location.search);
      var incoming = params.get('vid');
      if (!incoming) return;
      writeStored(incoming);
      memoryVid = incoming;
      params.delete('vid');
      var newSearch = params.toString();
      var newUrl =
        window.location.pathname +
        (newSearch ? '?' + newSearch : '') +
        window.location.hash;
      window.history.replaceState(null, '', newUrl);
    } catch (e) {
      /* noop */
    }
  }

  function tagLink(a) {
    if (a.hasAttribute('data-vid-tagged')) return;
    var href = a.getAttribute('href');
    if (!href) return;
    var url;
    try {
      url = new URL(href, window.location.href);
    } catch (e) {
      return;
    }
    if (url.hostname === window.location.hostname) return;
    if (KNOWN_DOMAINS.indexOf(url.hostname) === -1) return;
    if (url.searchParams.has('vid')) {
      a.setAttribute('data-vid-tagged', '1');
      return;
    }
    url.searchParams.set('vid', getVid());
    a.setAttribute('href', url.toString());
    a.setAttribute('data-vid-tagged', '1');
  }

  function tagAllLinks(root) {
    if (!root || !root.querySelectorAll) return;
    var links = root.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) tagLink(links[i]);
  }

  var debounceTimer = null;
  function scheduleTagAll() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      debounceTimer = null;
      tagAllLinks(document.body);
    }, 100);
  }

  function init() {
    adoptIncomingVid();
    tagAllLinks(document.body);

    if (typeof MutationObserver === 'undefined') return;
    var obs = new MutationObserver(function () {
      scheduleTagAll();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ARG440_VID = { get: getVid };
})();
