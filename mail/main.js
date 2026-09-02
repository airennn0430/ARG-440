// =========================================
// main.js (ハッシュ化版)
// =========================================

// 答えは平文で持たず、SHA-256ハッシュのみを保持する
const puzzles = {

  1: {
    hashes: ['795d9959543ee4a98ed3256cf02e10788b20fb2998e31813242ab8f89da87bb3']
  },

  2: {
    combo: true,
    hash: {
      a: 'f06b7e80902e2a5ce6f94a9ed357bd3497d845c5370e569ac766e4fb7ef6b02e',
      b: '86aaae061536321b69e226cfdbda5ba34421858d6ef430fc09b6b6ec2ac1d49c',
      c: 'a1986be50da13a8f6a81eb500ced953c1b5bd8cd32113d184453a2be89be4e82'
    }
  },

  3: {
    combo: true,
    hash: {
      a: '2f66779862f408a9aa9f5ea7380b983f10e6cf7358dad6a2b861f34d277f217c',
      b: '3360a52193c91011e3bb0ba9290f399726634a887fe3d35df7f3875f710f9654',
      c: 'e4bc95fe5e2185610f2d0241192399dec6b815778c3368ff78cf8a224589fe5d'
    }
  },

  final: {
    // final は「正解」ではなく分岐選択なのでハッシュ化不要
    answers: ['a', 'b']
  }

};

// =========================================
// SHA-256ハッシュ化ユーティリティ
// =========================================

async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// =========================================
// 初期化
// =========================================

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.mail-card').forEach(setMailDate);
  updateUnreadCount();
});

function setMailDate(cardEl) {
  const dateEl = cardEl.querySelector('.mail-date');
  if (!dateEl) return;

  const d = new Date();
  dateEl.textContent =
    d.getFullYear() + '/' +
    String(d.getMonth() + 1).padStart(2, '0') + '/' +
    String(d.getDate()).padStart(2, '0') + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0');
}

// =========================================
// 次のメールを同じページに読み込む
// =========================================

async function loadNextMail(url) {
  if (!url) return;

  let nextArticle;
  try {
    const res = await fetch(url);
    const html = await res.text();
    const nextDoc = new DOMParser().parseFromString(html, 'text/html');
    nextArticle = nextDoc.querySelector('#puzzle-container .mail-card');
    if (!nextArticle) return;

    const nextBody = nextDoc.body;
    document.body.dataset.next  = nextBody.dataset.next  || '';
    document.body.dataset.nextA = nextBody.dataset.nextA || '';
    document.body.dataset.nextB = nextBody.dataset.nextB || '';
  } catch (err) {
    console.error('次のメールの読み込みに失敗しました。', err);
    return;
  }

  const container = document.getElementById('puzzle-container');
  container.appendChild(nextArticle);

  setMailDate(nextArticle);
  updateUnreadCount();
  playMailEffect();
  nextArticle.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// =========================================
// 回答チェック（ハッシュ比較版）
// =========================================

async function checkAnswer(num, buttonEl) {

  const cardEl  = buttonEl.closest('.mail-card');
  const msgEl   = cardEl.querySelector('.mail-message');
  const puzzle  = puzzles[num];

  let isCorrect = false;
  let allInputs = [];

  if (puzzle.combo) {

    const aEl = document.getElementById('input-' + num + 'a');
    const bEl = document.getElementById('input-' + num + 'b');
    const cEl = document.getElementById('input-' + num + 'c');

    if (!aEl.value || !bEl.value || !cEl.value) {
      msgEl.textContent = 'すべての項目を選択してください。';
      msgEl.style.color = '#d46b6b';
      return;
    }

    const [aHash, bHash, cHash] = await Promise.all([
      sha256Hex(aEl.value),
      sha256Hex(bEl.value),
      sha256Hex(cEl.value)
    ]);

    isCorrect =
      aHash === puzzle.hash.a &&
      bHash === puzzle.hash.b &&
      cHash === puzzle.hash.c;

    allInputs = [aEl, bEl, cEl];

  } else {

    const inputEl = document.getElementById('input-' + num);
    const userInput = inputEl.value.trim().toLowerCase();
    const userHash = await sha256Hex(userInput);
    isCorrect = puzzle.hashes.includes(userHash);
    allInputs = [inputEl];

  }

  if (isCorrect) {

    cardEl.classList.remove('unread');
    cardEl.classList.add('solved');
    cardEl.style.borderColor = '#1e8c4a';

    msgEl.textContent = '新しいメールを受信しました。';
    msgEl.style.color = '#1e8c4a';

    allInputs.forEach(el => el.disabled = true);
    updateUnreadCount();
    buttonEl.disabled = true;

    loadNextMail(document.body.dataset.next);

  } else {

    cardEl.style.borderColor = '#c0392b';

    msgEl.textContent = '送信に失敗しました。';
    msgEl.style.color = '#c0392b';

    shakeElement(cardEl);

  }

}

// =========================================
// エンド分岐
// =========================================

function submitFinalDecision(btnEl) {

  const cardEl   = btnEl.closest('.mail-card');
  const selectEl = cardEl.querySelector('.answer-select');
  const decision = selectEl.value;

  if (!decision) {
    alert('決断を選択してください。');
    return;
  }

  selectEl.disabled = true;
  btnEl.disabled    = true;
  cardEl.classList.remove('unread');
  cardEl.classList.add('solved');

  const url = decision === 'a'
    ? document.body.dataset.nextA
    : document.body.dataset.nextB;

  loadNextMail(url);

}

// =========================================
// アコーディオン
// =========================================

function toggleAccordion(id) {
  const el = document.getElementById(id);
  el.classList.toggle('open');
}

// =========================================
// メール受信演出
// =========================================

function playMailEffect() {
  document.body.classList.add('mail-arrived');
  setTimeout(() => {
    document.body.classList.remove('mail-arrived');
  }, 500);
}

// =========================================
// シェイク演出
// =========================================

function shakeElement(el) {
  el.animate(
    [
      { transform: 'translateX(0)'  },
      { transform: 'translateX(-4px)' },
      { transform: 'translateX(4px)'  },
      { transform: 'translateX(-4px)' },
      { transform: 'translateX(0)'  }
    ],
    { duration: 300 }
  );
}

// =========================================
// アンリード件数更新
// =========================================

function updateUnreadCount() {
  const badge = document.getElementById('unread-count');
  if (!badge) return;
  const count = document.querySelectorAll('.mail-card.unread').length;
  badge.textContent = count > 0 ? count : '';
}