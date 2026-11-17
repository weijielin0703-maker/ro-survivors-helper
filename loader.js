// RO Survivors 輔助器 by WJ —— 程式內容已加密，第一次使用要輸入密碼（只限作者與朋友使用）。
(function () {
  'use strict';
  var VER = '__VERSION__', ITER = __ITER__;
  var PAYLOAD = '__PAYLOAD__';
  var CK = 'roHelperCode', PK = 'roHelperPass';
  var tag = VER + ':' + PAYLOAD.length + ':' + PAYLOAD.slice(0, 24);

  function inject(code) {
    var s = document.createElement('script');
    s.textContent = code;
    (document.head || document.documentElement).appendChild(s);
    s.remove();
  }
  // 解過一次就存起來，之後同步直接執行（才趕得上遊戲載入）
  try {
    var c = JSON.parse(localStorage.getItem(CK) || 'null');
    if (c && c.tag === tag && c.code) { inject(c.code); return; }
  } catch (e) {}

  function b64(s) { var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
  function decrypt(pass) {
    var raw = b64(PAYLOAD), salt = raw.slice(0, 16), iv = raw.slice(16, 28), ct = raw.slice(28);
    return crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey'])
      .then(function (base) { return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']); })
      .then(function (key) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ct); })
      .then(function (pt) { return new TextDecoder().decode(pt); });
  }
  // 存解開的程式，下次同步執行。v7.2：瀏覽器空間不夠時（遊戲存檔＋紀錄很大）會存失敗，
  // 存失敗的話每次都要重新解密 → 一定比遊戲晚。先刪舊版快取、把紀錄砍半再試；還是不行就記下來給面板顯示。
  function save(code, pass) {
    var v = JSON.stringify({ tag: tag, code: code });
    try { localStorage.setItem(PK, pass); } catch (e) {}
    try { localStorage.setItem(CK, v); return true; } catch (e) {}
    try { localStorage.removeItem(CK); localStorage.setItem(CK, v); return true; } catch (e) {}
    try {
      var lg = JSON.parse(localStorage.getItem('roHelperLogV1') || '[]');
      if (lg.length) localStorage.setItem('roHelperLogV1', JSON.stringify(lg.slice(-Math.floor(lg.length / 4))));
      localStorage.setItem(CK, v); return true;
    } catch (e) {}
    try { localStorage.removeItem('roHelperLogV1'); localStorage.setItem(CK, v); return true; } catch (e) {}
    return false;
  }
  function ok(code, pass) {
    var stored = save(code, pass);
    try { sessionStorage.setItem('roHelperCacheFail', stored ? '' : '1'); } catch (e) {}
    inject(code);
  }
  function ask(msg) {
    var show = function () {
      if (document.getElementById('rh-lock')) return;
      var d = document.createElement('div');
      d.id = 'rh-lock';
      d.style.cssText = 'position:fixed;top:12px;right:12px;z-index:2147483647;background:#1a1a2e;color:#fff;padding:12px 14px;border-radius:6px;font:14px sans-serif;box-shadow:0 2px 12px rgba(0,0,0,.5);width:240px;';
      d.innerHTML = '<b>RO Survivors 輔助器 v' + VER + '</b> <small style="color:#f3d9e2">by WJ</small>' +
        '<div style="margin:6px 0;font-size:13px;color:#ccc;">' + (msg || '請輸入密碼才能使用') + '</div>' +
        '<input id="rh-lock-in" type="password" style="width:100%;box-sizing:border-box;padding:4px;font-size:14px;" autocomplete="off">' +
        '<button id="rh-lock-go" style="margin-top:6px;width:100%;padding:5px;background:#f3d9e2;border:0;cursor:pointer;font-size:14px;">解鎖</button>';
      (document.body || document.documentElement).appendChild(d);
      var go = function () {
        var pw = d.querySelector('#rh-lock-in').value.trim();
        if (!pw) return;
        d.querySelector('#rh-lock-go').textContent = '解鎖中…';
        decrypt(pw).then(function (code) {
          d.remove(); ok(code, pw);
          // 解鎖時遊戲多半已經載入，重新整理一次才攔得到遊戲資料
          setTimeout(function () { location.reload(); }, 300);
        }, function () { d.remove(); ask('密碼錯誤，請再試一次'); });
      };
      d.querySelector('#rh-lock-go').onclick = go;
      d.querySelector('#rh-lock-in').onkeydown = function (e) { e.stopPropagation(); if (e.key === 'Enter') go(); };
      d.querySelector('#rh-lock-in').onkeyup = function (e) { e.stopPropagation(); };
    };
    if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
  }
  // 改版後（加密內容換了）用存著的密碼自動解開
  var saved = null;
  try { saved = localStorage.getItem(PK); } catch (e) {}
  if (saved) decrypt(saved).then(function (code) { ok(code, saved); }, function () { ask('密碼已更換，請輸入新密碼'); });
  else ask();
})();
