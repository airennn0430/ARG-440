const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', '..', 'Downloads', 'chat.html');
const dest = path.join(__dirname, 'chat.html');
const raw = fs.readFileSync(src, 'utf8');
const authBlock = `/* 簡易ログインチェック（sessionStorage）。未ログイン時はログイン画面へ。Vercelデプロイ時もクライアント側で動作 */
(function(){ try { if (!sessionStorage.getItem('rientachat_logged_in')) { window.location.replace('chat_login.html'); return; } } catch(e) { window.location.replace('chat_login.html'); return; } })();

`;
const out = raw.replace(/<script>\r?\n\/\* ━━━+/, (m) => '<script>\n' + authBlock + m.match(/\/\* ━━━+/)[0]);
fs.writeFileSync(dest, out);
console.log('chat.html created');
