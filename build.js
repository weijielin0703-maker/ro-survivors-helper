// 打包：把原始碼用密碼加密，產生可公開發佈的 ro-survivors-helper.user.js
//   加密：RO_PASS=密碼 node build.js 原始碼.js
//   解密（取回原始碼）：RO_PASS=密碼 node build.js --decrypt > 原始碼.js
// 原始碼不放在這個公開儲存庫裡；沒有密碼看不到程式內容。
const fs = require('fs');
const { webcrypto } = require('crypto');
const subtle = webcrypto.subtle;
const OUT = __dirname + '/ro-survivors-helper.user.js';
const ITER = 150000;

async function keyFrom(pass, salt) {
  const base = await subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function main() {
  const pass = process.env.RO_PASS;
  if (!pass) throw new Error('請設定 RO_PASS');
  if (process.argv[2] === '--decrypt') {
    const txt = fs.readFileSync(OUT, 'utf8');
    const b64 = txt.match(/var PAYLOAD = '([^']+)'/)[1];
    const raw = Buffer.from(b64, 'base64');
    const key = await keyFrom(pass, raw.subarray(0, 16));
    const pt = await subtle.decrypt({ name: 'AES-GCM', iv: raw.subarray(16, 28) }, key, raw.subarray(28));
    process.stdout.write(Buffer.from(pt).toString('utf8'));
    return;
  }
  const src = fs.readFileSync(process.argv[2], 'utf8');
  const header = src.match(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/)[0];
  const version = (header.match(/@version\s+(\S+)/) || [])[1];
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const key = await keyFrom(pass, salt);
  const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(src)));
  const payload = Buffer.concat([Buffer.from(salt), Buffer.from(iv), Buffer.from(ct)]).toString('base64');
  const loader = fs.readFileSync(__dirname + '/loader.js', 'utf8')
    .replace('__VERSION__', version).replace('__ITER__', String(ITER)).replace('__PAYLOAD__', payload);
  fs.writeFileSync(OUT, header + '\n' + loader.replace('__EXT__', 'false'));
  // 擴充功能版（不需要 Tampermonkey）：extension/ 資料夾＋ro-helper-extension.zip
  const ext = __dirname + '/extension';
  fs.mkdirSync(ext, { recursive: true });
  fs.writeFileSync(ext + '/helper.js', loader.replace('__EXT__', 'true'));
  fs.writeFileSync(ext + '/manifest.json', JSON.stringify({
    manifest_version: 3,
    name: 'RO Survivors 輔助器',
    version: version,
    description: 'RO Survivors 掛機輔助（by WJ）。不需要 Tampermonkey。',
    content_scripts: [{ matches: ['https://ro-survivors.com/*'], js: ['helper.js'], run_at: 'document_start', world: 'MAIN', all_frames: false }]
  }, null, 2));
  require('child_process').execSync('rm -f ro-helper-extension.zip && cd extension && zip -q -r ../ro-helper-extension.zip manifest.json helper.js', { cwd: __dirname });
  console.error('built v' + version + ', ' + payload.length + ' bytes payload');
}
main().catch(e => { console.error(e.message); process.exit(1); });
