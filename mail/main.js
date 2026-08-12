// =========================================
// main.js
// =========================================

const puzzles = {

  1: {
    answers: ['幽霊ビル事件']
  },

  2: {
    combo: true,
    answer: { a: '潤田組', b: '金銭', c: '盗まれた' }
  },

  3: {
    combo: true,
    answer: { a: '息子', b: '夫婦', c: '騙した' }
  },

  final: {
    answers: ['a', 'b']
  }

};

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
// 回答チェック
// =========================================

function checkAnswer(num, buttonEl) {

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

    isCorrect =
      aEl.value === puzzle.answer.a &&
      bEl.value === puzzle.answer.b &&
      cEl.value === puzzle.answer.c;

    allInputs = [aEl, bEl, cEl];

  } else {

    const inputEl = document.getElementById('input-' + num);
    const userInput = inputEl.value.trim().toLowerCase();
    isCorrect = puzzle.answers.includes(userInput);
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
