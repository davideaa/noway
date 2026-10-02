/* ==========================================================================
   CONFRONTO prima/dopo (agente confronto)

   API
     Confronto.apri(id, elementoDiPartenza)  apre il lavoro (animazione dal riquadro)
     Confronto.chiudi()                      torna alla vetrina (focus sull'elemento + evento 'confronto:chiuso')
     Confronto.misure()                      fps misurati durante lo scorrimento e ms dei cambi pagina

   Modi
     Affiancati  (predefinito su computer) a sinistra la fotografia del sito di oggi, a destra il sito nuovo VIVO
                 a larghezza da computer dentro metà schermo (proprietà CSS zoom sull'iframe: niente transform:scale,
                 il sito si disegna nitido e scorre col compositore). La foto segue il sito vivo in proporzione,
                 nello stesso fotogramma (il ponte chiama direttamente il visore quando può).
     Telefono    da computer: due telefoni, a sinistra la foto di prima, a destra il sito nuovo vivo a 390 px.
                 Su schermo stretto: le due versioni da telefono affiancate (foto + sito vivo a metà).
     Solo prima  la fotografia del sito di oggi a tutto schermo (scorrimento nativo, foto mossa dal compositore).
     Solo dopo   il sito nuovo vero, a grandezza naturale (predefinito su telefono).
   Fra un modo e l'altro si resta sulla stessa pagina e allo stesso punto (in proporzione).

   Lavori: multipagina (tendina = pagine del sito) o a pagina unica (tendina = sezioni del sito).
   Dati pesanti di ogni lavoro: letti solo quando servono (blocco JSON nel file offline, file dati-<id>.js nell'artifact).
   ========================================================================== */
(function () {
  "use strict";
  var D = document, W = window;
  var radice = D.getElementById("cf-confronto");
  if (!radice) return;
  if (radice.parentNode !== D.body) D.body.appendChild(radice);

  var V = W.VETRINA || { progetti: [] };
  var $ = function (id) { return D.getElementById(id); };
  var finestra = $("cf-finestra"), scena = $("cf-scena"), schermo = $("cf-schermo");
  var telPrima = $("cf-tel-prima"), btnPagina = $("cf-pagina");
  var mappa = $("cf-mappa"), mappaLista = $("cf-mappa-lista"), sugg = $("cf-suggerimento");
  var avanz = $("cf-avanzamento"), annuncio = $("cf-annuncio"), fantasma = $("cf-fantasma");
  var colonne = $("cf-colonne"), scorre = $("cf-scorre"), spazio = $("cf-spazio"), guida = $("cf-guida");
  var slot = $("cf-col-0"), etPrima = $("cf-et-prima-sotto");
  var modi = [].slice.call(radice.querySelectorAll("[data-modo]"));

  function mq(q) { return W.matchMedia ? W.matchMedia(q) : { matches: false }; }
  var mqRidotto = mq("(prefers-reduced-motion: reduce)");
  var mqStretto = mq("(max-width: 699px)");
  function ridotto() { return mqRidotto.matches; }
  function stretto() { return mqStretto.matches; }
  function ora() { return W.performance ? performance.now() : Date.now(); }
  function limita(v, a, b) { return v < a ? a : v > b ? b : v; }
  var memoria = {};                                   // se localStorage non c'è (sandbox, privata) vale per la visita
  function memo(k, v) {
    try { if (v === undefined) return W.localStorage.getItem(k) || memoria[k] || null; W.localStorage.setItem(k, v); } catch (e) { if (v === undefined) return memoria[k] || null; }
    memoria[k] = v;
    return null;
  }
  function attendi(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function pronti() { return (V.progetti || []).filter(function (p) { return p.pronto; }); }
  function unica(prog) { return !!(prog && prog.sezioni && prog.sezioni.length); }

  /* ---------------------------------------------------------------- stato */
  var S = { aperto: false, chiusura: false, prog: null, i: 0, sez: 0, fermaSez: 0, el: null, modo: "affiancati", p: 0, ultima: {}, visitate: {} };
  var scenaW = 0, scenaH = 0, geo = { telH: 700 }, ZOOM = true;

  /* ---------------------------------------------------------------- misure */
  var M = { affiancati: [], telefono: [], prima: [], dopo: [], cambi: [], dati: [] };
  var fT = null, fUlt = 0, fT0 = 0, fPrec = 0, fN = 0, fPeggio = 0, fRaf = 0;
  function fps(tipo) {
    fUlt = ora();
    if (fT === tipo) return;
    if (fT) fpsChiudi();
    fT = tipo; fT0 = fPrec = 0; fN = 0; fPeggio = 0;
    fRaf = requestAnimationFrame(fpsGiro);
  }
  function fpsGiro(t) {
    if (!fT0) fT0 = t; else { var dt = t - fPrec; if (dt > fPeggio) fPeggio = dt; }
    fPrec = t; fN++;
    if (ora() - fUlt > 250) { fpsChiudi(); return; }
    fRaf = requestAnimationFrame(fpsGiro);
  }
  function fpsChiudi() {
    cancelAnimationFrame(fRaf);
    var durata = fPrec - fT0;
    if (fT && M[fT] && fN > 8 && durata > 150) M[fT].push({ fps: Math.round((fN - 1) / durata * 10000) / 10, peggiore_ms: Math.round(fPeggio * 10) / 10, durata_ms: Math.round(durata), lavoro: S.prog && S.prog.id });
    fT = null;
  }
  function riassunto(lista) {
    if (!lista.length) return null;
    var tot = 0, n = 0, min = 1e9, pegg = 0;
    lista.forEach(function (c) { tot += c.fps * c.durata_ms; n += c.durata_ms; min = Math.min(min, c.fps); pegg = Math.max(pegg, c.peggiore_ms); });
    return { campioni: lista.length, fps_medio: Math.round(tot / n * 10) / 10, fps_minimo: min, fotogramma_peggiore_ms: pegg };
  }

  /* ---------------------------------------------------------------- dati pesanti di un lavoro: solo quando servono */
  function datiDi(prog) {
    if (prog.sito) return Promise.resolve(prog);
    if (prog._carica) return prog._carica;
    var t0 = ora();
    prog._carica = new Promise(function (ok, ko) {
      function unisci(d) { for (var k in d) if (d.hasOwnProperty(k)) prog[k] = d[k]; M.dati.push({ lavoro: prog.id, ms: Math.round(ora() - t0) }); ok(prog); }
      var el = D.getElementById("cf-dati-" + prog.id);
      if (el) {
        try { var d = JSON.parse(el.textContent); el.textContent = ""; unisci(d); } catch (e) { ko(e); }
        return;
      }
      var C = W.CF_DATI || {};
      if (C[prog.id]) { unisci(C[prog.id]); delete C[prog.id]; return; }
      if (!prog.dati) { ko(new Error("dati mancanti: " + prog.id)); return; }
      var s = D.createElement("script");
      s.src = prog.dati; s.async = true;
      s.onload = function () { var C2 = W.CF_DATI || {}; if (C2[prog.id]) { unisci(C2[prog.id]); delete C2[prog.id]; } else ko(new Error("dati vuoti")); };
      s.onerror = function () { prog._carica = null; ko(new Error("non riesco a leggere " + prog.dati)); };
      D.head.appendChild(s);
    });
    return prog._carica;
  }

  /* ---------------------------------------------------------------- risorse: blob una volta sola */
  var BLOB = null, sondaP = null;
  function aBlob(uri) {
    var v = uri.indexOf(","), mime = uri.slice(5, uri.indexOf(";")), bin = atob(uri.slice(v + 1));
    var n = bin.length, u8 = new Uint8Array(n);
    for (var j = 0; j < n; j++) u8[j] = bin.charCodeAt(j);
    return URL.createObjectURL(new Blob([u8], { type: mime }));
  }
  function url(uri) {
    if (!uri) return "";
    if (!BLOB) return uri;
    try { return aBlob(uri); } catch (e) { return uri; }
  }
  /* Un srcdoc riesce a leggere un blob: creato qui? (file://, anteprime in sandbox, CSP...) */
  function sonda() {
    if (sondaP) return sondaP;
    sondaP = new Promise(function (fatto) {
      // pagina in sandbox senza origine (anteprime ospitate): i blob non passano ai figli, inutile provare
      if (W.origin === "null" && location.protocol !== "file:") { fatto(false); return; }
      var ifr = null, finito = false, u;
      try { u = aBlob("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="); }
      catch (e) { fatto(false); return; }
      function fine(ok) {
        if (finito) return; finito = true;
        W.removeEventListener("message", ascolta);
        if (ifr && ifr.parentNode) ifr.parentNode.removeChild(ifr);
        fatto(ok);
      }
      function ascolta(e) { if (ifr && e.source === ifr.contentWindow && e.data && e.data.cfSonda) fine(e.data.ok === true); }
      W.addEventListener("message", ascolta);
      ifr = D.createElement("iframe");
      ifr.setAttribute("aria-hidden", "true");
      ifr.setAttribute("title", "prova");
      ifr.tabIndex = -1;
      ifr.className = "cf-sonda";
      ifr.srcdoc = '<img src="' + u + '" alt=""><script>var i=document.images[0];function r(o){parent.postMessage({cfSonda:1,ok:o},"*")}' +
        'if(i.complete&&i.naturalWidth)r(true);else{i.onload=function(){r(i.naturalWidth>0)};i.onerror=function(){r(false)}}<\/script>';
      D.body.appendChild(ifr);
      setTimeout(function () { fine(false); }, 3000);
    }).then(function (ok) { BLOB = ok; return ok; });
    return sondaP;
  }

  function ris(prog) { return prog._cf || (prog._cf = { url: {}, docs: {}, pile: {}, stile: null }); }
  function urlImg(prog, k) {
    var r = ris(prog);
    if (r.url[k] == null) r.url[k] = url(prog.sito.img[k]);
    return r.url[k];
  }
  function documento(prog, i) {
    var r = ris(prog);
    if (r.docs[i]) return r.docs[i];
    var pg = prog.pagine[i];
    if (r.stile == null) {
      var fc = (prog.sito.font_css || "").replace(/@@F:(\d+)@@/g, function (m, n) { return url(prog.sito.font[+n]); });
      r.stile = fc || prog.sito.css ? "<style>" + fc + "\n" + prog.sito.css + "</style>" : "";
    }
    var sez = (prog.sezioni || []).map(function (x) { return x.id; });
    var testa = "<script>var CF_PERCORSO=" + JSON.stringify(pg.path) + ",CF_SEZIONI=" + JSON.stringify(sez) + ";(" + ponte + ")();<\/script>" + r.stile;
    r.docs[i] = pg.html
      .replace("@@CF:TESTA@@", function () { return testa; })
      .replace("@@CF:CODA@@", function () { return prog.sito.js ? "<script>" + prog.sito.js + "<\/script>" : ""; })
      .replace(/@@I:([\w-]+)@@/g, function (m, k) { return urlImg(prog, k); });
    return r.docs[i];
  }

  /* ---------------------------------------------------------------- il ponte (gira DENTRO ogni pagina del sito vivo) */
  function ponte() {
    var P = window.CF_PERCORSO || "", SEZ = window.CF_SEZIONI || [], d = document, su = window.parent;
    var ridotto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    function manda(m) { try { su.postMessage(m, "*"); } catch (e) {} }
    function se() { return d.scrollingElement || d.documentElement; }
    function corsa() { return Math.max(0, se().scrollHeight - window.innerHeight); }
    var diretto = null;                         // stessa origine: avviso il visore subito, nello stesso fotogramma
    try { if (typeof su.__cfScorri === "function") diretto = su.__cfScorri; } catch (e) {}
    function stato() {
      var y = se().scrollTop, m = corsa(), w = window.innerWidth;
      if (diretto) { try { diretto(window, y, m, w); return; } catch (e) { diretto = null; } }
      manda({ cf: "s", y: y, max: m, w: w });
    }
    function posizioni() {
      if (!SEZ.length) return;
      var m = corsa(), pad = parseFloat(getComputedStyle(d.documentElement).scrollPaddingTop) || 0, y0 = se().scrollTop;
      manda({ cf: "sez", pos: SEZ.map(function (id) {
        var el = d.getElementById(id); if (!el) return -1;
        var top = el.getBoundingClientRect().top + y0 - pad - (parseFloat(getComputedStyle(el).scrollMarginTop) || 0);
        return m > 0 ? Math.max(0, Math.min(1, top / m)) : 0;
      }) });
    }
    var tPos = 0;
    function misura() { stato(); clearTimeout(tPos); tPos = setTimeout(posizioni, 120); }
    function vaiHash(h, subito) {
      var id = decodeURIComponent((h || "").slice(1)), t = id && d.getElementById(id);
      if (!t) { window.scrollTo({ top: 0, behavior: subito || ridotto ? "instant" : "smooth" }); return; }
      t.scrollIntoView({ behavior: ridotto || subito ? "instant" : "smooth", block: "start" });
      if (!t.matches("a,button,input,select,textarea,[tabindex]")) t.setAttribute("tabindex", "-1");
      try { t.focus({ preventScroll: true }); } catch (e) {}
    }
    d.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      var h = a.getAttribute("href") || "";
      if (/^(mailto:|tel:|javascript:|sms:)/i.test(h)) return;
      if (/^https?:/i.test(h)) { a.target = "_blank"; a.rel = "noopener"; return; }
      e.preventDefault();
      if (h.charAt(0) === "#") { vaiHash(h); return; }
      var u = new URL(h, "https://sito.invalid/" + P);
      manda({ cf: "vai", path: u.pathname.slice(1).replace(/index\.html$/, ""), hash: u.hash });
    }, true);
    var ultimoPunto = "";
    d.addEventListener("mouseover", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      var h = a.getAttribute("href") || "";
      if (!h || /^(#|mailto:|tel:|https?:|javascript:|sms:)/i.test(h) || h === ultimoPunto) return;
      ultimoPunto = h;
      var u = new URL(h, "https://sito.invalid/" + P);
      manda({ cf: "punta", path: u.pathname.slice(1).replace(/index\.html$/, "") });
    }, { passive: true });
    d.addEventListener("pointerdown", function () { manda({ cf: "giu" }); }, { passive: true });
    window.addEventListener("scroll", stato, { passive: true });
    window.addEventListener("resize", misura);
    if (window.ResizeObserver) new ResizeObserver(misura).observe(d.documentElement);
    /* una finestra del sito è aperta? (dialog vero o div role=dialog visibile: allora Esc la chiude lei, non il visore) */
    function finestreAperte() {
      return [].filter.call(d.querySelectorAll("dialog[open], [role=dialog]:not(dialog)"), function (el) {
        if (el.tagName === "DIALOG") return true;
        if (el.hidden) return false;
        var cs = getComputedStyle(el), r = el.getBoundingClientRect();
        return cs.display !== "none" && cs.visibility !== "hidden" && +cs.opacity > 0.05 && cs.pointerEvents !== "none" && r.width > 0 && r.height > 0;
      });
    }
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !finestreAperte().length) manda({ cf: "tasto", k: "Escape" });
    }, true);
    window.addEventListener("message", function (e) {
      if (e.source !== su || !e.data) return;
      var m = e.data;
      if (m.cf === "vai-a") { if (m.hash) vaiHash(m.hash, true); else window.scrollTo({ top: Math.round((m.p || 0) * corsa()), behavior: "instant" }); stato(); }
      else if (m.cf === "scorri") window.scrollBy({ top: m.dy, behavior: m.dolce && !ridotto ? "smooth" : "instant" });
      else if (m.cf === "scorri-a") { window.scrollTo({ top: Math.round(m.p * corsa()), behavior: "instant" }); stato(); }
      else if (m.cf === "reset") {          // pagina messa da parte: chiudo le finestre e i menu rimasti aperti
        finestreAperte().forEach(function (x) {
          if (x.tagName === "DIALOG") { x.close(); return; }
          var c = x.querySelector(".chiudi, button[aria-label*='hiudi'], [data-chiudi]"); if (c) c.click();
        });
        [].forEach.call(d.querySelectorAll("[aria-expanded=true]"), function (b) {
          var p = b.parentElement;
          if (p && p.classList.contains("aperto")) { p.classList.remove("aperto"); b.setAttribute("aria-expanded", "false"); }
        });
        if (d.body && !finestreAperte().length) d.body.style.overflow = "";
        if (d.activeElement && d.activeElement.blur) d.activeElement.blur();
      }
      else if (m.cf === "stato") { stato(); posizioni(); }
    });
    /* pronto quando caratteri e foto in vista sono decodificati (al massimo 350 ms) */
    d.addEventListener("DOMContentLoaded", function () {
      stato();
      var vh = window.innerHeight, attese = [d.fonts && d.fonts.ready ? d.fonts.ready : 0];
      [].slice.call(d.images, 0, 12).forEach(function (im) {
        if (im.loading === "lazy" || !im.decode) return;
        var r = im.getBoundingClientRect();
        if (r.bottom > 0 && r.top < vh && r.width > 0) attese.push(im.decode().catch(function () {}));
      });
      Promise.race([Promise.all(attese), new Promise(function (r) { setTimeout(r, 350); })]).then(function () { manda({ cf: "pronto" }); stato(); posizioni(); });
    });
    window.addEventListener("load", function () { setTimeout(posizioni, 300); });
  }

  /* ---------------------------------------------------------------- sito vivo: gruppo di iframe */
  var pool = [], attivo = null, richiesta = 0, tPre = 0;
  function maxPool() { return stretto() ? 3 : 4; }
  function slotDi(win) { for (var j = 0; j < pool.length; j++) if (pool[j].ifr.contentWindow === win) return pool[j]; return null; }
  function manda(s, m) { try { s.ifr.contentWindow.postMessage(m, "*"); } catch (e) {} }
  function carica(s, prog, i) {
    var vecchio = s.ifr;
    var ifr = D.createElement("iframe");     // iframe nuovo: niente voci nella cronologia del browser
    ifr.className = "cf-sito";
    ifr.setAttribute("referrerpolicy", "no-referrer");
    ifr.title = "Sito nuovo: " + (unica(prog) ? prog.nome : prog.pagine[i].nome);
    ifr.tabIndex = -1;
    s.prog = prog; s.i = i; s.pronto = false; s.y = 0; s.max = 0; s.w = 0; s.pos = null; s.ifr = ifr;
    ifr.srcdoc = documento(prog, i);
    ifr.addEventListener("load", function () {
      if (s.ifr === ifr && !s.pronto) setTimeout(function () { if (s.ifr === ifr && !s.pronto) segnaPronto(s); }, 60);
    });
    schermo.appendChild(ifr);
    if (vecchio && vecchio.parentNode) vecchio.parentNode.removeChild(vecchio);
  }
  function slotPer(prog, i, crea) {
    var j, s;
    for (j = 0; j < pool.length; j++) if (pool[j].prog === prog && pool[j].i === i) return pool[j];
    if (!crea) return null;
    if (pool.length < maxPool()) { s = { ifr: null, attese: [], usato: 0 }; pool.push(s); }
    else {
      for (j = 0; j < pool.length; j++) {
        var c = pool[j];
        if (c === attivo || c.inArrivo) continue;
        if (!s || c.usato < s.usato) s = c;
      }
      for (j = 0; !s && j < pool.length; j++) if (pool[j] !== attivo) s = pool[j];
    }
    s.attese.forEach(function (f) { f(); });    // chi aspettava la pagina vecchia non resta appeso
    s.attese = []; s.usato = ora(); s.inArrivo = false;
    carica(s, prog, i);
    return s;
  }
  function quandoPronto(s) { return new Promise(function (r) { if (s.pronto) r(); else s.attese.push(r); }); }
  function segnaPronto(s) {
    s.pronto = true;
    var a = s.attese; s.attese = [];
    a.forEach(function (f) { f(); });
  }
  function svuotaPool() {
    pool.forEach(function (s) { if (s.ifr && s.ifr.parentNode) s.ifr.parentNode.removeChild(s.ifr); });
    pool = []; attivo = null;
  }

  /* ---------------------------------------------------------------- fotografie del "prima" a pagina intera, a fette */
  function haPc(prog, i) { return !!prog.pagine[i].prima.pc; }
  function pila(prog, i, tipo) {
    if (!prog.pagine[i].prima[tipo]) tipo = "tel";
    var r = ris(prog), k = i + tipo;
    if (r.pile[k]) return r.pile[k];
    var dati = prog.pagine[i].prima[tipo], el = D.createElement("div"), imgs = [], y = 0;
    el.className = "cf-pila";
    dati.fette.forEach(function (f) {
      var im = new Image();
      im.alt = ""; im.decoding = "async"; im.draggable = false;
      im.src = url(f[0]);
      im.cfY = y; im.cfH = f[1]; y += f[1];
      el.appendChild(im); imgs.push(im);
    });
    return (r.pile[k] = { el: el, imgs: imgs, w: dati.w, h: dati.h, tipo: tipo, largo: 0, alto: 0, pronta: null });
  }
  function disponi(p, largo) {
    if (p.largo === largo) return;
    var sc = largo / p.w;
    p.largo = largo; p.alto = Math.round(p.h * sc);
    p.el.style.width = largo + "px"; p.el.style.height = p.alto + "px";
    p.imgs.forEach(function (im) {
      var a = Math.round(im.cfY * sc), b = Math.round((im.cfY + im.cfH) * sc);
      im.style.top = a + "px"; im.style.height = (b - a + 1) + "px";    // 1 px di sovrapposizione: niente righe fra le fette
    });
  }
  function decodifica(p) {
    if (p.pronta) return p.pronta;
    var dec = function (im) { return im.decode ? im.decode().catch(function () {}) : Promise.resolve(); };
    p.pronta = Promise.all(p.imgs.slice(0, 2).map(dec));
    p.pronta.then(function () {                      // le altre fette una alla volta, senza fretta
      p.decodificata = true;
      var resto = p.imgs.slice(2);
      (function prossima() { var im = resto.shift(); if (im) dec(im).then(prossima); })();
    });
    return p.pronta;
  }

  /* ---------------------------------------------------------------- modi */
  function soloPrima(m) { return m === "prima"; }
  function affianca(m) { return m === "affiancati" || (m === "telefono" && stretto()); }
  function tipoPrima(m) { return m === "telefono" || stretto() ? "tel" : "pc"; }
  function modoPossibile(m) {
    if (m === "affiancati") return !stretto();
    if (m === "telefono") return stretto() || geo.possibile;
    return m === "prima" || m === "dopo";
  }
  function modoIniziale() { return stretto() ? "dopo" : "affiancati"; }

  /* dove sono adesso, da 0 (inizio pagina) a 1 (fondo) */
  function progressoVivo() { var s = attivo; return s && s.max > 0 ? limita(s.y / s.max, 0, 1) : 0; }
  function progresso() {
    if (soloPrima(S.modo)) return foto.R > 0 ? limita(scorre.scrollTop / foto.R, 0, 1) : 0;
    var s = attivo;
    return s && s.pronto && s.max > 0 ? limita(s.y / s.max, 0, 1) : S.p;
  }

  function modo(m, da) {
    if (!modoPossibile(m)) m = modoIniziale();
    if (S.aperto && m !== S.modo) S.p = progresso();
    var prima = S.modo;
    S.modo = m;
    ["affiancati", "telefono", "prima", "dopo"].forEach(function (k) { radice.classList.toggle("cf-modo-" + k, k === m); });
    radice.classList.toggle("cf-stretto", stretto());
    radice.classList.toggle("cf-foto-su", soloPrima(m));
    radice.classList.toggle("cf-affianca", affianca(m));
    modi.forEach(function (b) {
      b.setAttribute("aria-checked", b.dataset.modo === m ? "true" : "false");
      b.tabIndex = b.dataset.modo === m ? 0 : -1;
      b.hidden = !modoPossibile(b.dataset.modo);
    });
    if (!S.aperto || !S.prog) return;
    impostaZoom();
    if (soloPrima(m)) montaFoto();
    else {
      annullaAnim();
      montaSeguace();
      if (attivo) {
        var p = S.p, s = attivo;
        // dopo che l'iframe ha preso la misura nuova, lo riporto allo stesso punto
        requestAnimationFrame(function () { requestAnimationFrame(function () { if (attivo === s) manda(s, { cf: "scorri-a", p: p }); }); });
        if (!s.pronto) { radice.classList.add("cf-carica-su"); quandoPronto(s).then(function () { radice.classList.remove("cf-carica-su"); if (attivo === s) manda(s, { cf: "scorri-a", p: p }); }); }
      }
    }
    if (prima !== m && !ridotto() && da !== "avvio" && scena.animate) {
      scena.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 260, easing: "ease-out" });
    }
    if (m === "dopo" && attivo && da === "vivo") { try { attivo.ifr.focus(); } catch (e) {} }
    else if (soloPrima(m) && da !== "avvio" && da !== "tastiera") { try { scorre.focus({ preventScroll: true }); } catch (e) {} }
    annuncio.textContent = { affiancati: "Prima e dopo affiancati", telefono: "Versione da telefono", prima: "Solo il sito di prima", dopo: "Solo il sito nuovo, dal vivo" }[m];
    segna();
  }

  /* il sito vivo dentro una colonna: zoom sull'iframe, così dentro ha la larghezza da computer (o da telefono) */
  function impostaZoom() {
    var z = 1;
    if (affianca(S.modo) && ZOOM) {
      var col = Math.floor((scenaW - 2) / 2), voluta = stretto() ? 390 : Math.max(1100, scenaW);
      z = limita(col / voluta, 0.3, 1);
    }
    schermo.style.setProperty("--cf-zoom", z.toFixed(4));
    S.zoom = z;
  }
  function controllaZoom(s) {
    // se il browser non passa lo zoom al documento interno (larghezza rimasta quella della colonna) si torna a 1
    if (!ZOOM || !affianca(S.modo) || S.zoom >= 0.99 || !s.w) return;
    var col = Math.floor((scenaW - 2) / 2);
    if (s.w < col * 1.25) { ZOOM = false; impostaZoom(); annuncio.textContent = "Il sito nuovo nella colonna è in versione ridotta."; }
  }

  /* ---------------------------------------------------------------- Solo prima: la foto scorre da sola (compositore) */
  var TL = typeof W.ScrollTimeline === "function" && !!Element.prototype.animate;
  var foto = { pile: [], V: 0, R: 0, anim: [], guidaH: 0 };
  function annullaAnim() { foto.anim.forEach(function (a) { try { a.cancel(); } catch (e) {} }); foto.anim = []; }
  function montaPilaColonna(tipo, Wc) {
    var p = pila(S.prog, S.i, tipo), stretta = p.tipo === "tel" && !stretto() && Wc > 480;
    var largo = stretta ? Math.min(Wc, 430) : Wc;
    disponi(p, largo); decodifica(p);
    [].slice.call(slot.children).forEach(function (x) { if (x !== p.el) slot.removeChild(x); });
    if (p.el.parentNode !== slot) slot.appendChild(p.el);
    slot.style.left = stretta ? Math.round((Wc - largo) / 2) + "px" : "0";
    radice.classList.toggle("cf-prima-stretta", stretta);
    etPrima.textContent = p.tipo === "tel" && !stretto() ? "il sito di oggi, da telefono (manca la versione da computer)" : "il sito di oggi";
    return p;
  }
  function montaFoto() {
    annullaAnim();
    var Wc = colonne.clientWidth, Vc = colonne.clientHeight;
    var p = montaPilaColonna(tipoPrima("prima"), Wc);
    foto.V = Vc; foto.pile = [p];
    var maxH = Math.max(p.alto, Vc);
    foto.R = maxH - Vc;
    spazio.style.height = maxH + "px";
    foto.guidaH = Math.round(limita(Vc * Vc / maxH, 36, Vc));
    guida.style.setProperty("--cf-guida", foto.guidaH + "px");
    guida.style.opacity = foto.R > 0 ? "" : "0";
    scorre.scrollTop = Math.round(S.p * foto.R);
    if (TL && foto.R > 0) {
      try {
        var tl = new W.ScrollTimeline({ source: scorre, axis: "block" });
        var muovi = function (el, da, a) { foto.anim.push(el.animate([{ transform: da }, { transform: a }], { timeline: tl, fill: "both", easing: "linear" })); };
        p.el.style.transform = ""; muovi(p.el, "translate3d(0,0,0)", "translate3d(0," + (-foto.R) + "px,0)");
        guida.style.transform = ""; muovi(guida, "translate3d(0,0,0)", "translate3d(0," + (Vc - foto.guidaH) + "px,0)");
        avanz.style.transform = ""; muovi(avanz, "scaleX(0)", "scaleX(1)");
        return;
      } catch (e) { annullaAnim(); TL = false; }
    }
    disegnaFoto();
  }
  function disegnaFoto() {
    var p = foto.R > 0 ? limita(scorre.scrollTop / foto.R, 0, 1) : 0;
    foto.pile.forEach(function (pl) { pl.el.style.transform = "translate3d(0," + (-Math.round(p * Math.max(0, pl.alto - foto.V))) + "px,0)"; });
    guida.style.transform = "translate3d(0," + Math.round(p * (foto.V - foto.guidaH)) + "px,0)";
    avanz.style.transform = "scaleX(" + p.toFixed(4) + ")";
  }
  scorre.addEventListener("scroll", function () {
    if (!S.aperto || !soloPrima(S.modo)) return;
    if (!TL || !foto.anim.length) segna();
    fps("prima");
    nascondiSugg();
    sezioneDa(limita(foto.R > 0 ? scorre.scrollTop / foto.R : 0, 0, 1));
  }, { passive: true });

  /* ---------------------------------------------------------------- foto che segue il sito vivo (Affiancati, Telefono) */
  var seguace = null;             // { p: pila, V: altezza visibile }
  function montaSeguace() {
    seguace = null;
    if (S.modo === "telefono" && !stretto()) {
      var p = pila(S.prog, S.i, "tel");
      disponi(p, 390); decodifica(p);
      [].slice.call(telPrima.children).forEach(function (x) { if (x !== p.el) telPrima.removeChild(x); });
      if (p.el.parentNode !== telPrima) telPrima.appendChild(p.el);
      seguace = { p: p, V: geo.telH };
    } else if (affianca(S.modo)) {
      var Wc = colonne.clientWidth, Vc = colonne.clientHeight;
      var pc = montaPilaColonna(tipoPrima(S.modo), Wc);
      foto.V = Vc; foto.pile = [pc];
      foto.guidaH = Math.round(limita(Vc * Vc / Math.max(pc.alto, Vc), 36, Vc));
      guida.style.setProperty("--cf-guida", foto.guidaH + "px");
      guida.style.opacity = pc.alto > Vc ? "" : "0";
      seguace = { p: pc, V: Vc };
    }
    segui();
  }
  function segui() {
    var p = progressoVivo();
    avanz.style.transform = "scaleX(" + p.toFixed(4) + ")";
    if (!seguace) return;
    var c = Math.max(0, seguace.p.alto - seguace.V);
    seguace.p.el.style.transform = "translate3d(0," + (-Math.round(p * c)) + "px,0)";
    if (affianca(S.modo)) guida.style.transform = "translate3d(0," + Math.round(p * (seguace.V - foto.guidaH)) + "px,0)";
  }
  /* il ponte chiama questa funzione direttamente quando l'iframe è della stessa origine: niente ritardo di un fotogramma */
  W.__cfScorri = function (win, y, max, w) {
    var s = slotDi(win);
    if (!s) return;
    aggiornaVivo(s, y, max, w);
  };
  function aggiornaVivo(s, y, max, w) {
    s.y = +y || 0; s.max = +max || 0; if (w) s.w = +w;
    if (!S.aperto || s !== attivo || soloPrima(S.modo)) return;
    segui();
    fps(S.modo);
    controllaZoom(s);
    sezioneDa(progressoVivo());
  }
  /* rotella e trascinamento sulla foto di sinistra: muovono il sito vivo (e quindi tutte e due le colonne) */
  function spingiVivo(dyFoto, dolce) {
    if (!attivo || !seguace) return;
    var c = Math.max(1, seguace.p.alto - seguace.V);
    manda(attivo, { cf: "scorri", dy: dyFoto * (attivo.max || c) / c, dolce: dolce });
  }
  telPrima.addEventListener("wheel", function (e) {
    if (!attivo) return;
    e.preventDefault();
    spingiVivo(e.deltaY * (e.deltaMode === 1 ? 18 : e.deltaMode === 2 ? geo.telH : 1), Math.abs(e.deltaY) >= 50);
  }, { passive: false });
  scorre.addEventListener("wheel", function (e) {
    fermaInerzia();
    if (!affianca(S.modo)) return;            // in Solo prima scorre da sé
    e.preventDefault();
    spingiVivo(e.deltaY * (e.deltaMode === 1 ? 18 : e.deltaMode === 2 ? foto.V : 1), Math.abs(e.deltaY) >= 50);
  }, { passive: false });

  /* trascinare (mouse; dito sulla colonna di sinistra quando è affiancata): il contenuto segue la mano, poi un po' d'inerzia */
  var trasc = null, inerzia = 0;
  function fermaInerzia() { cancelAnimationFrame(inerzia); inerzia = 0; }
  function sposta(dy) {           // dy = di quanto deve muoversi la foto sotto il dito
    if (affianca(S.modo)) spingiVivo(-dy, false);
    else scorre.scrollTop -= dy;
  }
  scorre.addEventListener("pointerdown", function (e) {
    var dito = e.pointerType !== "mouse";
    if ((!dito && e.button !== 0) || (dito && !affianca(S.modo))) return;
    fermaInerzia();
    trasc = { id: e.pointerId, v: 0, t: ora(), y: e.clientY };
    try { scorre.setPointerCapture(e.pointerId); } catch (x) {}
    radice.classList.add("cf-trascina");
    if (!dito) { e.preventDefault(); try { scorre.focus({ preventScroll: true }); } catch (x) {} }
  });
  scorre.addEventListener("pointermove", function (e) {
    if (!trasc || e.pointerId !== trasc.id) return;
    var t = ora(), dt = Math.max(1, t - trasc.t), dy = e.clientY - trasc.y;
    trasc.v = 0.75 * (dy / dt) + 0.25 * trasc.v;
    trasc.y = e.clientY; trasc.t = t;
    sposta(dy);
  });
  function fineTrascina(e) {
    if (!trasc || e.pointerId !== trasc.id) return;
    var v = trasc.v, recente = ora() - trasc.t < 60;
    trasc = null; radice.classList.remove("cf-trascina");
    if (!recente || Math.abs(v) < 0.15 || ridotto()) return;
    var prec = ora();
    (function giro() {
      var t = ora(), dt = Math.min(40, t - prec); prec = t;
      sposta(v * dt);
      v *= Math.pow(0.94, dt / 16.7);
      if (Math.abs(v) > 0.02) inerzia = requestAnimationFrame(giro); else inerzia = 0;
    })();
  }
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (t) { scorre.addEventListener(t, fineTrascina); });

  /* ---------------------------------------------------------------- disegno: un aggiornamento per fotogramma */
  var sporco = false;
  function segna() { if (!sporco) { sporco = true; requestAnimationFrame(disegna); } }
  function disegna() {
    sporco = false;
    if (!S.aperto) return;
    if (soloPrima(S.modo)) { if (!foto.anim.length) disegnaFoto(); return; }
    segui();
  }

  /* ---------------------------------------------------------------- scena e geometria */
  function misuraScena() {
    var r = scena.getBoundingClientRect();
    scenaW = Math.round(r.width); scenaH = Math.round(r.height);
    var bT = 36, bB = 22, bL = 11, sopra = 64, sotto = 22;
    var telH = Math.round(limita(scenaH - sopra - sotto - bT - bB, 420, 800));
    var fW = 390 + 2 * bL, fH = telH + bT + bB, gap = Math.round(limita(scenaW * 0.08, 48, 150));
    geo = {
      telH: telH, possibile: scenaW >= 2 * fW + 96 && scenaH >= 560,
      x1: Math.round((scenaW - 2 * fW - gap) / 2), y: Math.round(sopra + Math.max(0, (scenaH - sopra - sotto - fH) / 2))
    };
    geo.x2 = geo.x1 + fW + gap;
    var st = scena.style;
    st.setProperty("--cf-tel-h", telH + "px"); st.setProperty("--cf-tel-fw", fW + "px"); st.setProperty("--cf-tel-fh", fH + "px");
    st.setProperty("--cf-tel-x1", geo.x1 + "px"); st.setProperty("--cf-tel-x2", geo.x2 + "px"); st.setProperty("--cf-tel-y", geo.y + "px");
    st.setProperty("--cf-tel-bt", bT + "px"); st.setProperty("--cf-tel-bl", bL + "px");
  }

  /* ---------------------------------------------------------------- navigazione fra le pagine (multipagina) */
  function indiceDi(path) {
    var pg = S.prog.pagine;
    path = (path || "").replace(/^\/+/, "");
    if (path && !/\/$/.test(path)) path += "/";
    for (var j = 0; j < pg.length; j++) if (pg[j].path === path) return j;
    return -1;
  }
  function vaiA(i, hash) {
    var prog = S.prog;
    if (!prog || i < 0 || i >= prog.pagine.length) return Promise.resolve();
    var mio = ++richiesta, t0 = ora(), m = S.modo;
    S.i = i; S.ultima[prog.id] = i; S.sez = 0;
    (S.visitate[prog.id] = S.visitate[prog.id] || {})[i] = true;
    aggiornaBarra();
    var s = slotPer(prog, i, true), giaPronta;
    s.inArrivo = true; s.usato = t0;
    var attese;
    if (soloPrima(m)) {
      var pp = pila(prog, i, tipoPrima(m));
      giaPronta = !!pp.decodificata;
      attese = [decodifica(pp)];
    } else {
      giaPronta = s.pronto;
      attese = [quandoPronto(s)];
      if (m !== "dopo") attese.push(Promise.race([decodifica(pila(prog, i, tipoPrima(m))), attendi(400)]));
    }
    var lento = setTimeout(function () { if (mio === richiesta) radice.classList.add("cf-carica-su"); }, 140);
    return Promise.race([Promise.all(attese), attendi(soloPrima(m) ? 1500 : 10000)]).then(function () {
      clearTimeout(lento);
      if (mio !== richiesta || !S.aperto || s.prog !== prog || s.i !== i) { s.inArrivo = false; return; }
      radice.classList.remove("cf-carica-su");
      mostra(s, hash);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { M.cambi.push({ pagina: prog.pagine[i].nome, lavoro: prog.id, modo: m, ms: Math.round(ora() - t0), gia_pronta: !!giaPronta }); });
      });
      precarica();
    });
  }
  function mostra(s, hash) {
    var vecchio = attivo, focusDentro = vecchio && D.activeElement === vecchio.ifr;
    s.inArrivo = false;
    S.p = 0;
    if (s.pronto) manda(s, { cf: "vai-a", hash: hash || "", p: 0 });
    attivo = s;
    pool.forEach(function (c) { if (c !== s && c !== vecchio) c.ifr.classList.remove("cf-attivo", "cf-uscente", "cf-entra"); });
    s.ifr.tabIndex = soloPrima(S.modo) ? -1 : 0;
    s.ifr.classList.remove("cf-uscente");
    s.ifr.classList.add("cf-attivo");
    if (vecchio && vecchio !== s) {
      vecchio.ifr.tabIndex = -1;
      vecchio.ifr.classList.remove("cf-attivo", "cf-entra");
      var vivo = !soloPrima(S.modo) && !ridotto();
      if (vivo) {
        vecchio.ifr.classList.add("cf-uscente");
        s.ifr.classList.remove("cf-entra"); void s.ifr.offsetWidth; s.ifr.classList.add("cf-entra");
      }
      var v = vecchio;
      setTimeout(function () { if (v !== attivo) { v.ifr.classList.remove("cf-uscente"); manda(v, { cf: "reset" }); } }, vivo ? 240 : 0);
    }
    if (focusDentro) { try { s.ifr.focus(); } catch (e) {} }
    if (soloPrima(S.modo)) {
      montaFoto();
      if (!ridotto() && colonne.animate) colonne.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: "ease-out" });
    } else {
      montaSeguace();
      if (affianca(S.modo) && !ridotto() && colonne.animate) colonne.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: "ease-out" });
    }
    if (s.pronto) manda(s, { cf: "stato" });
    segna();
  }
  function precarica() {
    clearTimeout(tPre);
    if (S.prog.pagine.length < 2) return;
    tPre = setTimeout(function () {
      if (!S.aperto) return;
      var n = S.prog.pagine.length, j = S.i + 1 < n ? S.i + 1 : S.i - 1;
      if (j < 0) return;
      if (S.modo !== "dopo") decodifica(pila(S.prog, j, tipoPrima(S.modo)));
      if (!slotPer(S.prog, j, false)) slotPer(S.prog, j, true);
    }, 450);
  }
  function punta(path) {
    var j = indiceDi(path);
    if (j < 0 || slotPer(S.prog, j, false)) return;
    clearTimeout(tPre);
    tPre = setTimeout(function () { if (S.aperto && !slotPer(S.prog, j, false)) slotPer(S.prog, j, true); }, 90);
  }

  /* ---------------------------------------------------------------- sezioni (siti a pagina unica) */
  function posSezioni() { return attivo && attivo.pos; }
  function sezioneDa(p) {
    if (!unica(S.prog)) return;
    var pos = posSezioni(); if (!pos || ora() < S.fermaSez) return;   // subito dopo un salto vale la sezione scelta
    var k = 0;
    for (var j = 0; j < pos.length; j++) if (pos[j] >= 0 && pos[j] <= p + 0.004) k = j;
    if (k !== S.sez) { S.sez = k; aggiornaBarra(true); }
  }
  function vaiSezione(j) {
    var sez = S.prog.sezioni;
    if (j < 0 || j >= sez.length) return;
    S.sez = j; aggiornaBarra(); S.fermaSez = ora() + 1200;
    var s = attivo;
    if (soloPrima(S.modo)) {
      var dove = function () {
        var pos = posSezioni(), p = pos && pos[j] >= 0 ? pos[j] : j / Math.max(1, sez.length - 1);
        scorre.scrollTo({ top: Math.round(p * foto.R), behavior: ridotto() ? "auto" : "smooth" });
      };
      if (s && !s.pos && !s.pronto) quandoPronto(s).then(function () { setTimeout(dove, 150); }); else dove();
    } else if (s) {
      if (s.pronto) manda(s, { cf: "vai-a", hash: "#" + sez[j].id });
      else quandoPronto(s).then(function () { manda(s, { cf: "vai-a", hash: "#" + sez[j].id }); });
    }
  }
  function passo(d) {
    if (unica(S.prog)) vaiSezione(S.sez + d);
    else { var j = S.i + d; if (j >= 0 && j < S.prog.pagine.length) vaiA(j); }
  }

  /* ---------------------------------------------------------------- barra e mappa (pagine o sezioni) */
  function due(n) { return (n < 10 ? "0" : "") + n; }
  function voci() {
    if (unica(S.prog)) return S.prog.sezioni.map(function (x) { return { nome: x.nome, figlia: false }; });
    var pg = S.prog.pagine;
    return pg.map(function (p) { return { nome: p.nome, figlia: pg.some(function (q) { return q.path && q.path !== p.path && p.path.indexOf(q.path) === 0; }) }; });
  }
  function corrente() { return unica(S.prog) ? S.sez : S.i; }
  function costruisciMappa() {
    var vv = voci();
    mappaLista.innerHTML = "";
    vv.forEach(function (x, j) {
      var li = D.createElement("li"), b = D.createElement("button");
      if (x.figlia) li.className = "cf-mappa-sotto";
      b.type = "button"; b.className = "cf-mappa-voce"; b.dataset.i = j;
      b.innerHTML = '<span class="cf-mappa-num" aria-hidden="true">' + due(j + 1) + '</span><span class="cf-mappa-testo"></span><span class="cf-mappa-vista" aria-hidden="true"></span>';
      b.querySelector(".cf-mappa-testo").textContent = x.nome;
      li.appendChild(b); mappaLista.appendChild(li);
    });
    $("cf-mappa-nome").textContent = unica(S.prog) ? "Sezioni del sito" : "Mappa del sito";
    $("cf-mappa-conta").textContent = vv.length + (unica(S.prog) ? " sezioni · pagina unica" : " pagine");
    $("cf-mappa-prec").textContent = unica(S.prog) ? "‹ Sezione prima" : "‹ Precedente";
    $("cf-mappa-succ").textContent = unica(S.prog) ? "Sezione dopo ›" : "Successiva ›";
    $("cf-prec").setAttribute("aria-label", unica(S.prog) ? "Sezione precedente" : "Pagina precedente");
    $("cf-succ").setAttribute("aria-label", unica(S.prog) ? "Sezione successiva" : "Pagina successiva");
    var altri = pronti(), boxL = $("cf-mappa-lavori"), tasti = $("cf-mappa-lavori-tasti");
    $("cf-lavori").hidden = altri.length < 2;
    boxL.hidden = altri.length < 2 || !stretto();
    tasti.innerHTML = "";
    if (altri.length > 1) {
      var k = altri.indexOf(S.prog), pr = altri[(k - 1 + altri.length) % altri.length], su = altri[(k + 1) % altri.length];
      $("cf-lavoro-prec").setAttribute("aria-label", "Lavoro precedente: " + pr.nome);
      $("cf-lavoro-prec").title = "Lavoro precedente: " + pr.nome;
      $("cf-lavoro-succ").setAttribute("aria-label", "Lavoro successivo: " + su.nome);
      $("cf-lavoro-succ").title = "Lavoro successivo: " + su.nome;
      [[pr, "‹ "], [su, " ›"]].forEach(function (c, j) {
        var b = D.createElement("button");
        b.type = "button"; b.className = "cf-tasto"; b.textContent = j ? c[0].nome + c[1] : c[1] + c[0].nome;
        b.addEventListener("click", function () { chiudiMappa(); cambiaLavoro(c[0]); });
        tasti.appendChild(b);
      });
    }
  }
  function aggiornaBarra(zitto) {
    var vv = voci(), j = corrente(), x = vv[j] || vv[0], vis = S.visitate[S.prog.id] || {}, u = unica(S.prog);
    $("cf-titolo").textContent = S.prog.nome;
    $("cf-descrizione").textContent = [S.prog.categoria, S.prog.luogo].filter(Boolean).join(" · ") + " · proposta di restyling";
    $("cf-pagina-n").innerHTML = due(j + 1) + "<small>/" + due(vv.length) + "</small>";
    $("cf-pagina-nome").textContent = x.nome;
    btnPagina.setAttribute("aria-label", (u ? "Sezione " : "Pagina ") + (j + 1) + " di " + vv.length + ": " + x.nome + (u ? ". Apri l'elenco delle sezioni" : ". Apri la mappa del sito"));
    $("cf-prec").disabled = $("cf-mappa-prec").disabled = j === 0;
    $("cf-succ").disabled = $("cf-mappa-succ").disabled = j === vv.length - 1;
    [].forEach.call(mappaLista.querySelectorAll(".cf-mappa-voce"), function (b) {
      var k = +b.dataset.i;
      if (k === j) b.setAttribute("aria-current", u ? "location" : "page"); else b.removeAttribute("aria-current");
      b.classList.toggle("cf-vista", !u && !!vis[k] && k !== j);
    });
    if (!zitto) annuncio.textContent = (u ? "Sezione " : "Pagina ") + (j + 1) + " di " + vv.length + ": " + x.nome;
  }
  function apriMappa() {
    mappa.hidden = false; btnPagina.setAttribute("aria-expanded", "true");
    var cur = mappaLista.querySelector("[aria-current]");
    if (cur) { cur.focus({ preventScroll: true }); cur.scrollIntoView({ block: "nearest" }); }
  }
  function chiudiMappa(rimettiFocus) {
    if (mappa.hidden) return;
    mappa.hidden = true; btnPagina.setAttribute("aria-expanded", "false");
    if (rimettiFocus) btnPagina.focus();
  }

  /* ---------------------------------------------------------------- suggerimento alla prima apertura */
  var tSugg = 0, suggDa = 0;
  function suggerisci() {
    if (memo("cf-suggerito-3")) return;
    memo("cf-suggerito-3", "1");
    var t = stretto()
      ? "Questo è il sito nuovo, <b>vero</b>: provalo. In alto <em>prima</em> mostra il sito di oggi, e i due telefoni li mettono uno accanto all'altro."
      : "A destra il sito nuovo <b>vero</b>, a sinistra quello di <em>prima</em>: scorri e si muovono insieme. <b>Prova dal vivo</b> lo apre a tutto schermo.";
    sugg.innerHTML = (stretto() ? "" : '<span class="cf-sugg-icona" aria-hidden="true"></span>') + "<span>" + t + "</span>";
    sugg.classList.add("cf-su");
    suggDa = ora();
    clearTimeout(tSugg);
    tSugg = setTimeout(nascondiSugg, 7000, true);
  }
  function nascondiSugg(subito) {
    if (!sugg.classList.contains("cf-su")) return;
    if (!subito && ora() - suggDa < 1800) return;
    sugg.classList.remove("cf-su");
  }

  /* ---------------------------------------------------------------- apertura e chiusura */
  var nascosti = [];
  function staccaPagina(si) {
    if (si) {
      D.documentElement.classList.add("cf-aperto");
      [].forEach.call(D.body.children, function (n) {
        if (n === radice || n.tagName === "SCRIPT" || n.tagName === "STYLE" || n.classList.contains("cf-sonda")) return;
        nascosti.push([n, n.inert, n.getAttribute("aria-hidden")]);
        n.inert = true; n.setAttribute("aria-hidden", "true");
      });
    } else {
      nascosti.forEach(function (x) {
        x[0].inert = x[1];
        if (x[2] == null) x[0].removeAttribute("aria-hidden"); else x[0].setAttribute("aria-hidden", x[2]);
        if (x.length > 3) x[0].style.visibility = x[3];
      });
      nascosti = [];
      D.documentElement.classList.remove("cf-aperto");
    }
  }
  function velaPagina() {                       // sotto il visore la vetrina non deve disegnare nulla
    nascosti.forEach(function (x) { x[3] = x[0].style.visibility; x[0].style.visibility = "hidden"; });
  }
  function rettangolo(el) {
    if (!el || !el.getBoundingClientRect) return null;
    var img = el.querySelector && el.querySelector("img"), r = (img || el).getBoundingClientRect();
    if (r.width < 20 || r.height < 20 || r.bottom < 0 || r.top > innerHeight) return null;
    return r;
  }
  function anteprima(prog) {
    var a = prog.anteprima || {}, q = fantasma.querySelector(".cf-fantasma-quadro");
    q.querySelector("img").src = a.dopo || a.prima || "";
    return q;
  }
  function trasformaDa(r) {
    var top = parseFloat(getComputedStyle(radice).getPropertyValue("--cf-barra")) || 56;
    return "translate3d(" + r.left + "px," + (r.top - top) + "px,0) scale(" + (r.width / innerWidth) + ")";
  }

  function apri(id, el) {
    var prog = pronti().filter(function (p) { return p.id === id; })[0];
    if (!prog) return false;
    if (S.aperto) { if (prog !== S.prog) cambiaLavoro(prog); return true; }
    S.aperto = true; S.chiusura = false; S.el = el || D.activeElement; S.prog = prog;
    var r = ridotto() ? null : rettangolo(el), q = anteprima(prog), im = q.querySelector("img");
    D.documentElement.classList.add("cf-aperto");
    var dati = datiDi(prog);
    Promise.all([sonda(), Promise.race([im.decode && im.src ? im.decode().catch(function () {}) : 0, attendi(150)])]).then(function () { avvia(prog, r, dati); });
    return true;
  }

  function avvia(prog, r, dati) {
    if (!S.aperto) return;
    radice.hidden = false;
    radice.classList.add("cf-nascosta");
    if (r) radice.classList.add("cf-apertura");
    staccaPagina(true);
    misuraScena();
    var entrata = Promise.resolve();
    if (r) {
      var q = fantasma.querySelector(".cf-fantasma-quadro"), fondo = fantasma.querySelector(".cf-fantasma-fondo");
      fantasma.classList.add("cf-su");
      q.style.transition = "none"; q.style.opacity = "1"; q.style.transform = trasformaDa(r);
      fondo.style.opacity = "0";
      void q.offsetWidth;
      entrata = new Promise(function (fatto) {
        requestAnimationFrame(function () {
          q.style.transition = "transform .5s cubic-bezier(.2,.9,.25,1)";
          q.style.transform = "translate3d(0,0,0) scale(1)";
          fondo.style.opacity = "1";
          setTimeout(fatto, 460);
        });
      });
    }
    var lento = setTimeout(function () { radice.classList.add("cf-carica-su"); }, 700);
    var pagina = dati.then(function () {
      if (!S.aperto) return;
      S.i = S.ultima[prog.id] || 0; S.p = 0; S.sez = 0;
      costruisciMappa();
      modo(modoIniziale(), "avvio");
      return vaiA(S.i);
    });
    Promise.all([pagina, entrata]).then(function () {
      clearTimeout(lento); radice.classList.remove("cf-carica-su");
      if (!S.aperto) return;
      velaPagina();
      radice.classList.remove("cf-nascosta");
      requestAnimationFrame(function () { radice.classList.remove("cf-apertura"); });
      if (soloPrima(S.modo)) { try { scorre.focus({ preventScroll: true }); } catch (e) {} }
      else { try { finestra.focus({ preventScroll: true }); } catch (e) {} }
      if (r) {
        var q = fantasma.querySelector(".cf-fantasma-quadro");
        q.style.transition = "opacity .3s ease-out"; q.style.opacity = "0";
        fantasma.querySelector(".cf-fantasma-fondo").style.opacity = "0";
        setTimeout(function () { fantasma.classList.remove("cf-su"); }, 380);
      }
      if (!ridotto() && affianca(S.modo) && slot.animate) {   // le due colonne arrivano dai lati
        slot.animate([{ transform: "translate3d(-28px,0,0)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 520, delay: 80, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
        schermo.animate([{ transform: "translate3d(28px,0,0)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 520, delay: 80, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
      }
      suggerisci();
    }, function (err) {
      clearTimeout(lento);
      annuncio.textContent = "Non sono riuscito ad aprire questo lavoro.";
      if (W.console) console.warn("[confronto]", err && err.message);
      chiudi();
    });
  }

  function chiudi() {
    if (!S.aperto || S.chiusura) return;
    S.chiusura = true;
    chiudiMappa(); nascondiSugg(true); fpsChiudi(); fermaInerzia();
    var el = S.el;
    staccaPagina(false);
    var r = ridotto() ? null : rettangolo(el);
    var finito = false;
    function fine() {
      if (finito) return; finito = true;
      fantasma.classList.remove("cf-su");
      fantasma.querySelector(".cf-fantasma-fondo").style.transition = "";
      radice.hidden = true;
      finestra.style.transition = "";
      radice.classList.remove("cf-nascosta", "cf-carica-su", "cf-chiude");
      S.aperto = false; S.chiusura = false;
      if (attivo) manda(attivo, { cf: "reset" });
      var id = S.prog.id;
      if (el && el.focus && D.contains(el)) { try { el.focus({ preventScroll: true }); } catch (e) {} }
      D.dispatchEvent(new CustomEvent("confronto:chiuso", { detail: { id: id } }));
    }
    if (!r) { radice.classList.add("cf-nascosta"); setTimeout(fine, ridotto() ? 0 : 200); return; }
    var q = anteprima(S.prog), fondo = fantasma.querySelector(".cf-fantasma-fondo");
    q.style.transition = "none"; q.style.transform = "translate3d(0,0,0) scale(1)"; q.style.opacity = "1";
    fondo.style.transition = "none"; fondo.style.opacity = "1";
    radice.classList.add("cf-chiude");               // il fantasma sta SOTTO la finestra che sfuma
    finestra.style.transition = "opacity .14s ease-out";
    fantasma.classList.add("cf-su");
    radice.classList.add("cf-nascosta");
    void q.offsetWidth;
    requestAnimationFrame(function () {
      q.style.transition = "transform .52s cubic-bezier(.65,0,.35,1) .06s, opacity .18s ease-in .44s";
      q.style.transform = trasformaDa(r);
      q.style.opacity = "0";
      fondo.style.transition = "opacity .4s ease-out .16s";
      fondo.style.opacity = "0";
      setTimeout(fine, 660);
    });
  }

  function cambiaLavoro(prog) {
    if (!prog || prog === S.prog) return;
    chiudiMappa();
    var dati = datiDi(prog);
    var vai = function () {
      return dati.then(function () {
        svuotaPool(); annullaAnim(); seguace = null;
        [slot, telPrima].forEach(function (c) { c.innerHTML = ""; });
        S.prog = prog; S.p = 0; S.sez = 0;
        costruisciMappa();
        modo(S.modo, "avvio");
        return vaiA(S.ultima[prog.id] || 0);
      });
    };
    var lento = setTimeout(function () { radice.classList.add("cf-carica-su"); }, 300);
    if (ridotto() || !scena.animate) { vai().then(function () { clearTimeout(lento); radice.classList.remove("cf-carica-su"); }); return; }
    var a = scena.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" });
    a.onfinish = function () {
      vai().then(function () {
        clearTimeout(lento); radice.classList.remove("cf-carica-su");
        scena.animate([{ opacity: 0, transform: "translate3d(0,12px,0)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "cubic-bezier(.16,1,.3,1)" });
        a.cancel();
      }, function () { clearTimeout(lento); a.cancel(); annuncio.textContent = "Non sono riuscito ad aprire questo lavoro."; });
    };
  }

  /* ---------------------------------------------------------------- messaggi dal ponte */
  W.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || typeof d.cf !== "string") return;
    var s = slotDi(e.source);
    if (!s) return;
    if (d.cf === "pronto") { segnaPronto(s); return; }
    if (d.cf === "sez") { s.pos = d.pos; if (s === attivo) sezioneDa(progresso()); return; }
    if (!S.aperto) return;
    switch (d.cf) {
      case "s": aggiornaVivo(s, d.y, d.max, d.w); break;
      case "vai":
        if (s !== attivo) break;
        var j = indiceDi(d.path);
        if (j >= 0) vaiA(j, d.hash);
        else annuncio.textContent = "Questa pagina non fa parte della proposta.";
        break;
      case "punta": if (s === attivo) punta(d.path); break;
      case "giu": chiudiMappa(); break;
      case "tasto": if (d.k === "Escape") esc(); break;
    }
  });

  /* ---------------------------------------------------------------- comandi */
  function esc() {
    if (!mappa.hidden) { chiudiMappa(true); return; }
    chiudi();
  }
  D.addEventListener("keydown", function (e) {
    if (!S.aperto) return;
    var t = e.target;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); esc(); return; }
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (!mappa.hidden && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End")) {
      var vv = [].slice.call(mappaLista.querySelectorAll(".cf-mappa-voce")), k = vv.indexOf(D.activeElement);
      e.preventDefault();
      k = e.key === "Home" ? 0 : e.key === "End" ? vv.length - 1 : limita(k + (e.key === "ArrowDown" ? 1 : -1), 0, vv.length - 1);
      vv[k].focus();
      return;
    }
    if (t && t.getAttribute && t.getAttribute("role") === "radio") return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); e.stopPropagation(); passo(e.key === "ArrowRight" ? 1 : -1); }
  }, true);

  $("cf-chiudi").addEventListener("click", chiudi);
  $("cf-prec").addEventListener("click", function () { passo(-1); });
  $("cf-succ").addEventListener("click", function () { passo(1); });
  $("cf-mappa-prec").addEventListener("click", function () { chiudiMappa(); passo(-1); });
  $("cf-mappa-succ").addEventListener("click", function () { chiudiMappa(); passo(1); });
  btnPagina.addEventListener("click", function () { if (mappa.hidden) apriMappa(); else chiudiMappa(true); });
  mappaLista.addEventListener("click", function (e) {
    var b = e.target.closest(".cf-mappa-voce");
    if (!b) return;
    chiudiMappa(true);
    if (unica(S.prog)) vaiSezione(+b.dataset.i); else vaiA(+b.dataset.i);
  });
  function lavoroVicino(d) {
    var a = pronti(), k = a.indexOf(S.prog);
    if (a.length > 1) cambiaLavoro(a[(k + d + a.length) % a.length]);
  }
  $("cf-lavoro-prec").addEventListener("click", function () { lavoroVicino(-1); });
  $("cf-lavoro-succ").addEventListener("click", function () { lavoroVicino(1); });
  $("cf-vivo").addEventListener("click", function () { modo("dopo", "vivo"); nascondiSugg(true); });
  D.addEventListener("pointerdown", function (e) {
    if (S.aperto && !mappa.hidden && !mappa.contains(e.target) && !btnPagina.contains(e.target)) chiudiMappa();
  }, true);

  modi.forEach(function (b) {
    b.addEventListener("click", function (e) { modo(b.dataset.modo, e.detail > 0 ? "mouse" : "tastiera"); nascondiSugg(true); });
    b.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      var vis = modi.filter(function (x) { return !x.hidden; }), k = vis.indexOf(b);
      var n = vis[(k + (e.key === "ArrowRight" ? 1 : -1) + vis.length) % vis.length];
      modo(n.dataset.modo, "tastiera"); n.focus();
    });
  });

  /* trappola del fuoco */
  [].forEach.call(radice.querySelectorAll(".cf-sentinella"), function (s) {
    s.addEventListener("focus", function (e) {
      var indietro = s.dataset.cfVerso === "fine" && e.relatedTarget === $("cf-chiudi");   // Maiusc+Tab dal primo tasto
      if (indietro) { if (soloPrima(S.modo)) scorre.focus(); else if (attivo) attivo.ifr.focus(); else $("cf-chiudi").focus(); }
      else $("cf-chiudi").focus();
    });
  });

  /* ridimensionamenti, rotazione del telefono */
  var tRid = 0, eraStretto = stretto();
  W.addEventListener("resize", function () {
    if (!S.aperto) return;
    cancelAnimationFrame(tRid);
    tRid = requestAnimationFrame(function () {
      var p = progresso();
      misuraScena();
      $("cf-mappa-lavori").hidden = pronti().length < 2 || !stretto();
      if (eraStretto !== stretto()) { eraStretto = stretto(); S.p = p; modo(modoIniziale(), "avvio"); return; }
      if (!modoPossibile(S.modo)) { S.p = p; modo(modoIniziale(), "avvio"); return; }
      modi.forEach(function (b) { b.hidden = !modoPossibile(b.dataset.modo); });
      impostaZoom();
      if (soloPrima(S.modo)) { S.p = p; montaFoto(); } else montaSeguace();
    });
  });

  /* quando la vetrina è ferma: sonda dei blob, dati e prima pagina del primo lavoro già pronti, poi i dati degli altri */
  function quandoFermo(f, t) { (W.requestIdleCallback || function (g) { setTimeout(g, 1200); })(f, { timeout: t }); }
  function presto() {
    quandoFermo(function () {
      sonda().then(function () {
        setTimeout(function () {
          var tutti = pronti(), primo = tutti[0];
          if (!primo) return;
          quandoFermo(function () {
            if (S.aperto || pool.length) return;
            datiDi(primo).then(function () {
              if (S.aperto || pool.length) return;
              var i = S.ultima[primo.id] || 0;
              slotPer(primo, i, true);
              if (!stretto()) decodifica(pila(primo, i, "pc"));
              // gli altri lavori: se sono già dentro la pagina (file offline) si leggono uno alla volta quando è ferma;
              // se sono file a parte (artifact) si scaricano solo quando ci si avvicina al loro riquadro
              (function prossimo(k) {
                if (k >= tutti.length) return;
                if (tutti[k].dati && !D.getElementById("cf-dati-" + tutti[k].id)) { prossimo(k + 1); return; }
                quandoFermo(function () { datiDi(tutti[k]).then(function () { prossimo(k + 1); }, function () { prossimo(k + 1); }); }, 8000);
              })(1);
            }, function () {});
          }, 6000);
        }, 1500);
      });
    }, 4000);
  }
  if (D.readyState === "complete") presto(); else W.addEventListener("load", presto);
  function avvicina(e) {
    var c = e.target && e.target.closest && e.target.closest("[data-id]");
    if (!c || S.aperto) return;
    var p = pronti().filter(function (x) { return x.id === c.getAttribute("data-id"); })[0];
    if (p && p.dati && !p.sito && !p._carica) datiDi(p).catch(function () {});   // solo file a parte: si scarica in anticipo
  }
  D.addEventListener("pointerover", avvicina, { passive: true });
  D.addEventListener("focusin", avvicina);

  W.Confronto = {
    apri: apri,
    chiudi: chiudi,
    misure: function () {
      var c = M.cambi.map(function (x) { return x.ms; }).sort(function (a, b) { return a - b; });
      return {
        blob: BLOB, scorrimento_dal_compositore: TL, zoom_colonna: ZOOM ? S.zoom : "spento",
        affiancati: riassunto(M.affiancati), telefono: riassunto(M.telefono), solo_prima: riassunto(M.prima), solo_dopo: riassunto(M.dopo),
        campioni: { affiancati: M.affiancati.slice(), dopo: M.dopo.slice() },
        cambio_pagina_ms: { mediana: c.length ? c[c.length >> 1] : null, massimo: c.length ? c[c.length - 1] : null, tutti: M.cambi.slice() },
        lettura_dati_ms: M.dati.slice()
      };
    }
  };
})();
