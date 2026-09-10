const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', '..', 'Downloads', 'chat.html');
const dest = path.join(__dirname, 'chat.html');
const raw = fs.readFileSync(src, 'utf8');
const authBlock = `/* 簡易ログインチェック（sessionStorage）。未ログイン時はログイン画面へ。Vercelデプロイ時もクライアント側で動作 */
(function(){ try { if (!sessionStorage.getItem('rientachat_logged_in')) { window.location.replace('chat_login.html'); return; } } catch(e) { window.location.replace('chat_login.html'); return; } })();

`;
const insertionPattern = /<script>\r?\n\/\* ━━━+/;
if (!insertionPattern.test(raw)) {
  throw new Error('create_chat_js.js: insertion point not found in ' + src + ' — chat.html was NOT generated (login check would have been missing).');
}
const out = raw.replace(insertionPattern, (m) => '<script>\n' + authBlock + m.match(/\/\* ━━━+/)[0]);
if (!out.includes(authBlock)) {
  throw new Error('create_chat_js.js: authBlock insertion failed — chat.html was NOT generated.');
}
fs.writeFileSync(dest, out);
console.log('chat.html created');
