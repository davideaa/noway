/* ==========================================================================
   CONFRONTO prima/dopo (agente confronto)

   API
     Confronto.apri(id, elementoDiPartenza)  apre il lavoro (animazione dal riquadro)
     Confronto.chiudi()                      torna alla vetrina (focus sull'elemento + evento 'confronto:chiuso')
     Confronto.misure()                      fps misurati su lente/tenda e ms dei cambi pagina

   Come resta fluido
     - il sito nuovo è VERO e a grandezza naturale (nessun iframe rimpicciolito);
     - foto e font del sito nuovo diventano blob: URL UNA volta sola; ogni pagina è un srcdoc di pochi kB
       che li richiama (se il browser non accetta i blob in un srcdoc si ripiega sui data URI);
     - fino a 4 pagine restano vive (ritorno istantaneo), la successiva è pre-caricata, anche quella
       sotto il mouse quando si punta un link;
     - la fotografia "prima" è a fette, decodificata in anticipo (img.decode);
     - lente, tenda e telefoni si muovono solo con transform, un aggiornamento per fotogramma (rAF).
   Il ponte iniettato in ogni pagina (postMessage) porta al visore mouse, scorrimento, link e tasti.
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
  var tenda = $("cf-tenda"), tendaDentro = $("cf-tenda-dentro");
  var lente = $("cf-lente"), lenteVetro = $("cf-lente-vetro");
  var maniglia = $("cf-maniglia"), presa = $("cf-presa"), scudo = $("cf-scudo");
  var telPrima = $("cf-tel-prima"), btnTieni = $("cf-tieni"), btnPagina = $("cf-pagina");
  var mappa = $("cf-mappa"), mappaLista = $("cf-mappa-lista"), sugg = $("cf-suggerimento");
  var avanz = $("cf-avanzamento"), annuncio = $("cf-annuncio"), fantasma = $("cf-fantasma");
  var modi = [].slice.call(radice.querySelectorAll("[data-modo]"));

  function mq(q) { return W.matchMedia ? W.matchMedia(q) : { matches: false }; }
  var mqRidotto = mq("(prefers-reduced-motion: reduce)");
  var mqTel = mq("(max-width: 699px)");
  var mqMouse = mq("(hover: hover) and (pointer: fine)");
  function ridotto() { return mqRidotto.matches; }
  function ora() { return W.performance ? performance.now() : Date.now(); }
  function limita(v, a, b) { return v < a ? a : v > b ? b : v; }
  function memo(k, v) {
    try { if (v === undefined) return W.localStorage.getItem(k); W.localStorage.setItem(k, v); } catch (e) { /* senza memoria va bene lo stesso */ }
    return null;
  }
  function attendi(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function pronti() { return (V.progetti || []).filter(function (p) { return p.pronto && p.pagine && p.sito; }); }

  /* ---------------------------------------------------------------- stato */
  var S = {
    aperto: false, chiusura: false, prog: null, i: 0, el: null,
    modo: "lente", tenda: 0.5, tieni: false, svela: null,
    mx: -999, my: -999, dentro: false, trascina: false,
    ultima: {}, visitate: {}
  };
  var scenaW = 0, scenaH = 0, scenaL = 0, scenaT = 0, R = 150;
  var geo = { telH: 700 };

  /* ---------------------------------------------------------------- misure */
  var M = { lente: [], tenda: [], telefono: [], cambi: [] };
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
    if (fT && fN > 8 && durata > 150) M[fT].push({ fps: Math.round((fN - 1) / durata * 10000) / 10, peggiore_ms: Math.round(fPeggio * 10) / 10, durata_ms: Math.round(durata) });
    fT = null;
  }
  function riassunto(lista) {
    if (!lista.length) return null;
    var tot = 0, n = 0, min = 1e9, pegg = 0;
    lista.forEach(function (c) { tot += c.fps * c.durata_ms; n += c.durata_ms; min = Math.min(min, c.fps); pegg = Math.max(pegg, c.peggiore_ms); });
    return { campioni: lista.length, fps_medio: Math.round(tot / n * 10) / 10, fps_minimo: min, fotogramma_peggiore_ms: pegg };
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
      r.stile = "<style>" + fc + "\n" + prog.sito.css + "\nhtml{-webkit-touch-callout:none}</style>";
    }
    var testa = r.stile + "<script>var CF_PERCORSO=" + JSON.stringify(pg.path) + ";(" + ponte + ")();<\/script>";
    r.docs[i] = pg.html
      .replace("@@CF:TESTA@@", function () { return testa; })
      .replace("@@CF:CODA@@", function () { return "<script>" + prog.sito.js + "<\/script>"; })
      .replace(/@@I:([\w-]+)@@/g, function (m, k) { return urlImg(prog, k); });
    return r.docs[i];
  }

  /* ---------------------------------------------------------------- il ponte (gira DENTRO ogni pagina del sito nuovo) */
  function ponte() {
    var P = window.CF_PERCORSO || "", d = document, su = window.parent;
    var ridotto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    function manda(m) { try { su.postMessage(m, "*"); } catch (e) {} }
    function stato() {
      var se = d.scrollingElement || d.documentElement;
      manda({ cf: "s", y: se.scrollTop, max: Math.max(0, se.scrollHeight - window.innerHeight) });
    }
    function vaiHash(h) {
      var id = decodeURIComponent((h || "").slice(1)), t = id && d.getElementById(id);
      if (!t) { window.scrollTo({ top: 0, behavior: "instant" }); return; }
      t.scrollIntoView({ behavior: ridotto ? "instant" : "smooth", block: "start" });
      if (!t.matches("a,button,input,select,textarea,[tabindex]")) t.setAttribute("tabindex", "-1");
      try { t.focus({ preventScroll: true }); } catch (e) {}
    }
    var soffoca = false;
    d.addEventListener("click", function (e) {
      if (soffoca) { soffoca = false; e.preventDefault(); e.stopPropagation(); return; }
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      var h = a.getAttribute("href") || "";
      if (/^(mailto:|tel:|javascript:)/i.test(h)) return;
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
      if (!h || /^(#|mailto:|tel:|https?:|javascript:)/i.test(h) || h === ultimoPunto) return;
      ultimoPunto = h;
      var u = new URL(h, "https://sito.invalid/" + P);
      manda({ cf: "punta", path: u.pathname.slice(1).replace(/index\.html$/, "") });
    }, { passive: true });
    d.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      manda({ cf: "p", x: e.clientX, y: e.clientY });
    }, { passive: true });
    d.addEventListener("mouseout", function (e) { if (!e.relatedTarget) manda({ cf: "via" }); });
    d.addEventListener("pointerdown", function () { manda({ cf: "giu" }); }, { passive: true });
    window.addEventListener("scroll", stato, { passive: true });
    window.addEventListener("resize", stato);
    if (window.ResizeObserver) new ResizeObserver(stato).observe(d.documentElement);
    function interattivo(t) { return t && (/^(INPUT|TEXTAREA|SELECT|BUTTON|A|SUMMARY)$/.test(t.tagName) || t.isContentEditable); }
    function apertoQualcosa() { return d.querySelector("dialog[open], [role=dialog]:not(dialog):not([hidden])"); }
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { if (!apertoQualcosa()) manda({ cf: "tasto", k: "Escape" }); return; }
      if ((e.key === " " || e.code === "Space") && !interattivo(e.target) && !apertoQualcosa()) {
        e.preventDefault();
        if (!e.repeat) manda({ cf: "tasto", k: " ", giu: true });
      }
    }, true);
    window.addEventListener("keyup", function (e) {
      if (e.key === " " || e.code === "Space") manda({ cf: "tasto", k: " ", giu: false });
    }, true);
    /* pressione lunga (telefono): mostra il prima finché si tiene il dito */
    var timer = 0, x0 = 0, y0 = 0, tenuto = false;
    function annulla() { clearTimeout(timer); timer = 0; }
    d.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) { annulla(); return; }
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
      annulla();
      timer = setTimeout(function () { tenuto = true; soffoca = true; manda({ cf: "tieni", on: true }); }, 480);
    }, { passive: true });
    d.addEventListener("touchmove", function (e) {
      var t = e.touches[0];
      if (timer && (Math.abs(t.clientX - x0) > 10 || Math.abs(t.clientY - y0) > 10)) annulla();
    }, { passive: true });
    function rilascia() {
      annulla();
      if (tenuto) { tenuto = false; manda({ cf: "tieni", on: false }); setTimeout(function () { soffoca = false; }, 400); }
    }
    d.addEventListener("touchend", rilascia, { passive: true });
    d.addEventListener("touchcancel", rilascia, { passive: true });
    d.addEventListener("contextmenu", function (e) { if (tenuto) e.preventDefault(); });
    /* messaggi dal visore */
    window.addEventListener("message", function (e) {
      if (e.source !== su || !e.data) return;
      var m = e.data;
      if (m.cf === "vai-a") { if (m.hash) vaiHash(m.hash); else window.scrollTo({ top: 0, behavior: "instant" }); stato(); }
      else if (m.cf === "scorri") { window.scrollBy({ top: m.dy, behavior: "instant" }); }
      else if (m.cf === "reset") {
        [].forEach.call(d.querySelectorAll("dialog[open]"), function (x) { x.close(); });
        var mm = d.querySelector("[role=dialog]:not(dialog):not([hidden])");
        if (mm) { var c = mm.querySelector(".chiudi, button[aria-label*='hiudi']"); if (c) c.click(); else mm.hidden = true; }
        [].forEach.call(d.querySelectorAll(".aperto"), function (x) { x.classList.remove("aperto"); });
        if (d.body) d.body.style.overflow = "";
        if (d.activeElement && d.activeElement.blur) d.activeElement.blur();
      }
      else if (m.cf === "stato") stato();
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
      Promise.race([Promise.all(attese), new Promise(function (r) { setTimeout(r, 350); })]).then(function () { manda({ cf: "pronto" }); stato(); });
    });
  }

  /* ---------------------------------------------------------------- pagine del sito nuovo: gruppo di iframe */
  var pool = [], attivo = null, richiesta = 0, tPre = 0;
  function maxPool() { return mqTel.matches ? 3 : 4; }
  function slotDi(win) { for (var j = 0; j < pool.length; j++) if (pool[j].ifr.contentWindow === win) return pool[j]; return null; }
  function manda(s, m) { try { s.ifr.contentWindow.postMessage(m, "*"); } catch (e) {} }
  function carica(s, prog, i) {
    var vecchio = s.ifr;
    var ifr = D.createElement("iframe");     // iframe nuovo: niente voci nella cronologia del browser
    ifr.className = "cf-sito";
    ifr.setAttribute("referrerpolicy", "no-referrer");
    ifr.title = "Sito nuovo: " + prog.pagine[i].nome;
    ifr.tabIndex = -1;
    s.prog = prog; s.i = i; s.pronto = false; s.y = 0; s.max = 0; s.ifr = ifr;
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

  /* ---------------------------------------------------------------- fotografia "prima" a fette */
  var pilaOra = null;
  function tipoPrima() { return (S.modo === "telefono" || scenaW < 700) ? "tel" : "pc"; }
  function pila(prog, i, tipo) {
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
    return (r.pile[k] = { el: el, imgs: imgs, w: dati.w, h: dati.h, largo: 0, alto: 0, pronta: null });
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
      var resto = p.imgs.slice(2);
      (function prossima() { var im = resto.shift(); if (im) dec(im).then(prossima); })();
    });
    return p.pronta;
  }
  function preparaPila(prog, i) { return decodifica(pila(prog, i, tipoPrima())); }
  function contenitore() {
    if (S.modo === "telefono") return telPrima;
    if (S.modo === "lente" && !S.tieni && !S.rilascio && S.svela == null) return lenteVetro;
    return tendaDentro;
  }
  function montaPila() {
    if (!S.prog) return;
    var p = pila(S.prog, S.i, tipoPrima()), dove = contenitore();
    disponi(p, S.modo === "telefono" ? 390 : scenaW);
    decodifica(p);
    if (pilaOra && pilaOra !== p && pilaOra.el.parentNode) pilaOra.el.parentNode.removeChild(pilaOra.el);
    if (p.el.parentNode !== dove) dove.appendChild(p.el);
    pilaOra = p;
    segna();
  }

  /* ---------------------------------------------------------------- disegno: un aggiornamento per fotogramma */
  var sporco = false, senzaPrima = null, senzaDopo = null;
  function segna() { if (!sporco) { sporco = true; requestAnimationFrame(disegna); } }
  function tendaX() {
    if (S.tieni) return scenaW;
    if (S.svela != null) return S.svela * scenaW;
    return S.tenda * scenaW;
  }
  function disegna() {
    sporco = false;
    if (!S.aperto) return;
    var s = attivo, prog = s && s.max > 0 ? limita(s.y / s.max, 0, 1) : 0;
    avanz.style.transform = "scaleX(" + prog.toFixed(4) + ")";
    var p = pilaOra;
    if (!p) return;
    var vista = S.modo === "telefono" ? geo.telH : scenaH;
    var off = Math.round(prog * Math.max(0, p.alto - vista));
    var dove = p.el.parentNode;
    if (dove === lenteVetro) {
      p.el.style.transform = "translate3d(" + Math.round(R - S.mx) + "px," + Math.round(R - S.my - off) + "px,0)";
      lente.style.transform = "translate3d(" + Math.round(S.mx) + "px," + Math.round(S.my) + "px,0)";
    } else if (dove === tendaDentro) {
      var x = Math.round(tendaX());
      tenda.style.transform = "translate3d(" + (x - scenaW) + "px,0,0)";
      tendaDentro.style.transform = "translate3d(" + (scenaW - x) + "px,0,0)";
      p.el.style.transform = "translate3d(0," + (-off) + "px,0)";
      if (S.modo === "tenda") {
        var xs = Math.round(S.tenda * scenaW);
        maniglia.style.transform = "translate3d(" + xs + "px,0,0)";
        presa.style.transform = "translate3d(" + (limita(xs, 30, scenaW - 30) - xs) + "px,0,0)";
        var sp = xs < 96, sd = xs > scenaW - 96;
        if (sp !== senzaPrima) { senzaPrima = sp; maniglia.classList.toggle("cf-senza-prima", sp); }
        if (sd !== senzaDopo) { senzaDopo = sd; maniglia.classList.toggle("cf-senza-dopo", sd); }
      }
    } else {
      p.el.style.transform = "translate3d(0," + (-off) + "px,0)";
    }
  }

  /* ---------------------------------------------------------------- scena e geometria */
  function misuraScena() {
    var r = scena.getBoundingClientRect();
    scenaW = Math.round(r.width); scenaH = Math.round(r.height); scenaL = r.left; scenaT = r.top;
    R = Math.round(limita(Math.min(scenaW, scenaH) * 0.19, 105, 170));
    radice.style.setProperty("--cf-r", R + "px");
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

  /* ---------------------------------------------------------------- modi: lente, tenda, telefono, solo nuovo */
  function modoPossibile(m) {
    if (m === "lente") return mqMouse.matches && !mqTel.matches;
    if (m === "telefono") return !mqTel.matches && geo.possibile;
    if (m === "spento") return !mqTel.matches;
    return true;
  }
  function modo(m, salva) {
    if (!modoPossibile(m)) m = modoPossibile("lente") ? "lente" : "tenda";
    var prima = S.modo;
    S.modo = m;
    ["lente", "tenda", "telefono", "spento"].forEach(function (k) { radice.classList.toggle("cf-modo-" + k, k === m); });
    modi.forEach(function (b) {
      b.setAttribute("aria-checked", b.dataset.modo === m ? "true" : "false");
      b.tabIndex = b.dataset.modo === m ? 0 : -1;
      b.hidden = !modoPossibile(b.dataset.modo);
    });
    btnTieni.hidden = m === "telefono";
    if (m === "telefono") tieni(false);
    if (m !== "lente") lenteSu(false);
    else if (S.dentro) lenteSu(true);
    if (salva && !mqTel.matches) memo("cf-modo", m);
    if ((prima === "telefono") !== (m === "telefono") && S.aperto && !ridotto()) {
      scena.animate && scena.animate([{ opacity: 0.2, transform: "scale(.985)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "cubic-bezier(.16,1,.3,1)" });
    }
    montaPila();
    if (attivo) manda(attivo, { cf: "stato" });
    segna();
  }
  var lenteAccesa = false;
  var tRilascio = 0;
  function lenteSu(on) {
    on = on && S.modo === "lente" && !S.tieni && !S.rilascio && S.svela == null;
    if (on === lenteAccesa) return;
    lenteAccesa = on;
    radice.classList.toggle("cf-lente-su", on);
  }

  /* ---------------------------------------------------------------- tieni premuto */
  function tieni(on) {
    on = !!on && S.modo !== "telefono" && S.aperto;
    if (on === S.tieni) return;
    S.tieni = on;
    radice.classList.toggle("cf-tieni-su", on);
    btnTieni.setAttribute("aria-pressed", on ? "true" : "false");
    if (S.modo === "tenda") anima(on ? 0.22 : 0.26);
    clearTimeout(tRilascio);
    if (!on && S.modo !== "tenda") {           // la foto sfuma prima di tornare nella lente
      S.rilascio = true;
      tRilascio = setTimeout(function () { S.rilascio = false; montaPila(); lenteSu(S.dentro); }, 170);
    } else { S.rilascio = false; lenteSu(!on && S.dentro); }
    montaPila();
    nascondiSugg();
    segna();
  }
  var tAnima = 0;
  function anima(sec) {
    if (ridotto()) return;
    radice.style.setProperty("--cf-durata", sec + "s");
    radice.classList.add("cf-anima");
    clearTimeout(tAnima);
    tAnima = setTimeout(function () { radice.classList.remove("cf-anima"); }, sec * 1000 + 60);
  }

  /* ---------------------------------------------------------------- navigazione fra le pagine */
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
    var mio = ++richiesta, t0 = ora();
    S.i = i; S.ultima[prog.id] = i;
    (S.visitate[prog.id] = S.visitate[prog.id] || {})[i] = true;
    aggiornaBarra();
    var s = slotPer(prog, i, true), giaPronta = s.pronto;
    s.inArrivo = true; s.usato = t0;
    var lento = setTimeout(function () { if (mio === richiesta) radice.classList.add("cf-carica-su"); }, 140);
    return Promise.all([quandoPronto(s), Promise.race([preparaPila(prog, i), attendi(400)])]).then(function () {
      s.inArrivo = false;
      clearTimeout(lento);
      if (mio !== richiesta || !S.aperto || s.prog !== prog || s.i !== i) return;
      radice.classList.remove("cf-carica-su");
      mostra(s, hash);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { M.cambi.push({ pagina: prog.pagine[i].nome, ms: Math.round(ora() - t0), gia_pronta: giaPronta }); });
      });
      precarica();
    });
  }
  function mostra(s, hash) {
    var vecchio = attivo, focusDentro = vecchio && D.activeElement === vecchio.ifr;
    manda(s, { cf: "vai-a", hash: hash || "" });
    attivo = s;
    pool.forEach(function (c) { if (c !== s && c !== vecchio) c.ifr.classList.remove("cf-attivo", "cf-uscente", "cf-entra"); });
    s.ifr.tabIndex = 0;
    s.ifr.classList.remove("cf-uscente");
    s.ifr.classList.add("cf-attivo");
    if (vecchio && vecchio !== s) {
      vecchio.ifr.tabIndex = -1;
      vecchio.ifr.classList.remove("cf-attivo", "cf-entra");
      vecchio.ifr.classList.add("cf-uscente");
      if (!ridotto()) { s.ifr.classList.remove("cf-entra"); void s.ifr.offsetWidth; s.ifr.classList.add("cf-entra"); }
      var v = vecchio;
      setTimeout(function () { if (v !== attivo) { v.ifr.classList.remove("cf-uscente"); manda(v, { cf: "reset" }); } }, 240);
    }
    if (focusDentro) { try { s.ifr.focus(); } catch (e) {} }
    montaPila();
    segna();
  }
  function precarica() {
    clearTimeout(tPre);
    tPre = setTimeout(function () {
      if (!S.aperto) return;
      var n = S.prog.pagine.length, j = S.i + 1 < n ? S.i + 1 : S.i - 1;
      if (j >= 0 && !slotPer(S.prog, j, false)) slotPer(S.prog, j, true);
      if (j >= 0) preparaPila(S.prog, j);
    }, 450);
  }
  function punta(path) {
    var j = indiceDi(path);
    if (j < 0 || slotPer(S.prog, j, false)) return;
    clearTimeout(tPre);
    tPre = setTimeout(function () { if (S.aperto && !slotPer(S.prog, j, false)) { slotPer(S.prog, j, true); preparaPila(S.prog, j); } }, 90);
  }

  /* ---------------------------------------------------------------- barra e mappa del sito */
  function due(n) { return (n < 10 ? "0" : "") + n; }
  function costruisciMappa() {
    var pg = S.prog.pagine;
    mappaLista.innerHTML = "";
    pg.forEach(function (p, j) {
      var genitore = pg.some(function (q) { return q.path && q.path !== p.path && p.path.indexOf(q.path) === 0; });
      var li = D.createElement("li"), b = D.createElement("button");
      if (genitore) li.className = "cf-mappa-sotto";
      b.type = "button"; b.className = "cf-mappa-voce"; b.dataset.i = j;
      b.innerHTML = '<span class="cf-mappa-num" aria-hidden="true">' + due(j + 1) + '</span><span class="cf-mappa-testo"></span><span class="cf-mappa-vista" aria-hidden="true"></span>';
      b.querySelector(".cf-mappa-testo").textContent = p.nome;
      li.appendChild(b); mappaLista.appendChild(li);
    });
    $("cf-mappa-conta").textContent = pg.length + " pagine";
    var altri = pronti(), boxL = $("cf-mappa-lavori"), tasti = $("cf-mappa-lavori-tasti");
    $("cf-lavori").hidden = altri.length < 2;
    boxL.hidden = altri.length < 2 || !mqTel.matches;
    tasti.innerHTML = "";
    if (altri.length > 1) {
      var k = altri.indexOf(S.prog), pr = altri[(k - 1 + altri.length) % altri.length], su = altri[(k + 1) % altri.length];
      $("cf-lavoro-prec").setAttribute("aria-label", "Lavoro precedente: " + pr.nome);
      $("cf-lavoro-succ").setAttribute("aria-label", "Lavoro successivo: " + su.nome);
      [[pr, "‹ "], [su, " ›"]].forEach(function (c, j) {
        var b = D.createElement("button");
        b.type = "button"; b.className = "cf-tasto"; b.textContent = j ? c[0].nome + c[1] : c[1] + c[0].nome;
        b.addEventListener("click", function () { chiudiMappa(); cambiaLavoro(c[0]); });
        tasti.appendChild(b);
      });
    }
  }
  function aggiornaBarra() {
    var pg = S.prog.pagine, p = pg[S.i], vis = S.visitate[S.prog.id] || {};
    $("cf-titolo").textContent = S.prog.nome;
    $("cf-descrizione").textContent = [S.prog.categoria, S.prog.luogo].filter(Boolean).join(" · ") + " · proposta di restyling";
    $("cf-pagina-n").innerHTML = due(S.i + 1) + "<small>/" + due(pg.length) + "</small>";
    $("cf-pagina-nome").textContent = p.nome;
    btnPagina.setAttribute("aria-label", "Pagina " + (S.i + 1) + " di " + pg.length + ": " + p.nome + ". Apri la mappa del sito");
    $("cf-prec").disabled = S.i === 0;
    $("cf-succ").disabled = S.i === pg.length - 1;
    [].forEach.call(mappaLista.querySelectorAll(".cf-mappa-voce"), function (b) {
      var j = +b.dataset.i;
      if (j === S.i) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
      b.classList.toggle("cf-vista", !!vis[j] && j !== S.i);
    });
    annuncio.textContent = "Pagina " + (S.i + 1) + " di " + pg.length + ": " + p.nome;
  }
  function apriMappa() {
    mappa.hidden = false; btnPagina.setAttribute("aria-expanded", "true");
    var cur = mappaLista.querySelector('[aria-current="page"]');
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
    if (memo("cf-suggerito")) return;
    memo("cf-suggerito", "1");
    var t;
    if (S.modo === "lente") t = "<b>Muovi il mouse sul sito:</b> nella lente vedi com'era <em>prima</em>. Tieni premuto <kbd>Spazio</kbd> per vederlo tutto.";
    else if (mqTel.matches) t = "<b>Trascina la linea bianca</b> per vedere com'era <em>prima</em>, oppure tieni premuto il tasto «prima».";
    else t = "<b>Trascina la linea</b>: a sinistra il sito di <em>prima</em>, a destra quello nuovo.";
    sugg.innerHTML = '<span class="cf-sugg-icona" aria-hidden="true"></span><span>' + t + "</span>";
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
  function anteprime(prog) {
    var a = prog.anteprima || {}, q = fantasma.querySelector(".cf-fantasma-quadro");
    q.querySelector(".cf-fantasma-prima").src = a.prima || a.dopo || "";
    q.querySelector(".cf-fantasma-dopo").src = a.dopo || a.prima || "";
    return q;
  }
  function trasformaDa(r) {
    var vw = innerWidth, top = parseFloat(getComputedStyle(radice).getPropertyValue("--cf-barra")) || 56;
    return "translate3d(" + r.left + "px," + (r.top - top) + "px,0) scale(" + (r.width / vw) + ")";
  }

  function apri(id, el) {
    var prog = pronti().filter(function (p) { return p.id === id; })[0];
    if (!prog) return false;
    if (S.aperto) { if (prog !== S.prog) cambiaLavoro(prog); return true; }
    S.aperto = true; S.chiusura = false; S.el = el || D.activeElement; S.prog = prog;
    var r = ridotto() ? null : rettangolo(el), q = anteprime(prog);
    var dec = [].map.call(q.querySelectorAll("img"), function (im) { return im.decode && im.src ? im.decode().catch(function () {}) : 0; });
    Promise.all([sonda(), Promise.race([Promise.all(dec), attendi(150)])]).then(function () { avvia(prog, r); });
    return true;
  }

  function avvia(prog, r) {
    if (!S.aperto) return;
    radice.hidden = false;
    radice.classList.add("cf-nascosta");
    if (r) radice.classList.add("cf-apertura");
    staccaPagina(true);
    misuraScena();
    S.i = S.ultima[prog.id] || 0;
    costruisciMappa();
    S.svela = ridotto() ? null : 1;
    radice.classList.toggle("cf-svela", S.svela != null);
    S.tenda = mqTel.matches ? 0 : (S.tenda > 0.02 && S.tenda < 0.98 ? S.tenda : 0.5);
    ariaTenda();
    modo(memo("cf-modo") || "lente");
    var pagina = vaiA(S.i);
    var entrata = Promise.resolve();
    if (r) {
      var q = anteprime(prog), fondo = fantasma.querySelector(".cf-fantasma-fondo"), dopoImg = q.querySelector(".cf-fantasma-dopo");
      fantasma.classList.add("cf-su");
      q.style.transition = "none"; q.style.opacity = "1"; q.style.transform = trasformaDa(r);
      dopoImg.style.opacity = "1"; fondo.style.opacity = "0";
      void q.offsetWidth;
      entrata = new Promise(function (fatto) {
        requestAnimationFrame(function () {
          q.style.transition = "transform .62s cubic-bezier(.16,1,.3,1)";
          q.style.transform = "translate3d(0,0,0) scale(1)";
          fondo.style.opacity = "1";
          setTimeout(function () { dopoImg.style.opacity = "0"; }, 260);
          setTimeout(fatto, 640);
        });
      });
    }
    Promise.all([pagina, entrata]).then(function () {
      if (!S.aperto) return;
      velaPagina();
      if (r) finestra.style.transition = "none";      // sotto il fantasma la finestra è già piena
      radice.classList.remove("cf-nascosta");
      requestAnimationFrame(function () { radice.classList.remove("cf-apertura"); finestra.style.transition = ""; });
      try { finestra.focus({ preventScroll: true }); } catch (e) {}
      if (r) {
        var q = fantasma.querySelector(".cf-fantasma-quadro");
        q.style.transition = "opacity .24s ease-out"; q.style.opacity = "0";
        fantasma.querySelector(".cf-fantasma-fondo").style.opacity = "0";
        setTimeout(function () { fantasma.classList.remove("cf-su"); }, 380);
      }
      if (S.svela != null) svela(); else suggerisci();
    });
  }
  /* il sito di prima scorre via come una tenda e lascia il nuovo */
  function svela() {
    var fine = S.modo === "tenda" ? S.tenda : 0;
    S.svela = 1; radice.classList.add("cf-svela"); montaPila(); disegna();
    setTimeout(function () {
      if (!S.aperto) return;
      anima(1.05);
      S.svela = fine; segna();
      setTimeout(function () {
        if (!S.aperto) return;
        S.svela = null;
        radice.classList.remove("cf-svela");
        montaPila();
        lenteSu(S.dentro);
        suggerisci();
      }, 1100);
    }, 260);
  }

  function chiudi() {
    if (!S.aperto || S.chiusura) return;
    S.chiusura = true;
    tieni(false); chiudiMappa(); nascondiSugg(true); lenteSu(false); fpsChiudi();
    var el = S.el;
    staccaPagina(false);
    var r = ridotto() ? null : rettangolo(el);
    var finito = false;
    function fine() {
      if (finito) return; finito = true;
      fantasma.classList.remove("cf-su");
      fantasma.querySelector(".cf-fantasma-fondo").style.transition = "";
      radice.hidden = true;
      radice.classList.remove("cf-nascosta", "cf-svela", "cf-tieni-su", "cf-carica-su", "cf-chiude", "cf-lente-su");
      lenteAccesa = false;
      S.aperto = false; S.chiusura = false; S.svela = null;
      if (attivo) manda(attivo, { cf: "reset" });
      var id = S.prog.id;
      if (el && el.focus && D.contains(el)) { try { el.focus({ preventScroll: true }); } catch (e) {} }
      D.dispatchEvent(new CustomEvent("confronto:chiuso", { detail: { id: id } }));
    }
    if (!r) { radice.classList.add("cf-nascosta"); setTimeout(fine, ridotto() ? 0 : 200); return; }
    var q = anteprime(S.prog), fondo = fantasma.querySelector(".cf-fantasma-fondo"), dopoImg = q.querySelector(".cf-fantasma-dopo");
    q.style.transition = "none"; q.style.transform = "translate3d(0,0,0) scale(1)"; q.style.opacity = "1";
    dopoImg.style.opacity = "1"; fondo.style.transition = "none"; fondo.style.opacity = "1";
    radice.classList.add("cf-chiude");               // il fantasma sta SOTTO la finestra che sfuma
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
    tieni(false); chiudiMappa();
    var vai = function () {
      svuotaPool(); pilaOra = null;
      [lenteVetro, tendaDentro, telPrima].forEach(function (c) { c.innerHTML = ""; });
      S.prog = prog;
      costruisciMappa();
      return vaiA(S.ultima[prog.id] || 0);
    };
    if (ridotto() || !scena.animate) { vai(); return; }
    var a = scena.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" });
    a.onfinish = function () {
      vai().then(function () {
        var b = scena.animate([{ opacity: 0, transform: "translate3d(0,12px,0)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "cubic-bezier(.16,1,.3,1)" });
        b.onfinish = function () { a.cancel(); };
        a.cancel();
      });
    };
  }

  /* ---------------------------------------------------------------- messaggi dal ponte */
  W.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || typeof d.cf !== "string") return;
    var s = slotDi(e.source);
    if (!s) return;
    if (d.cf === "pronto") { segnaPronto(s); return; }
    if (!S.aperto) return;
    switch (d.cf) {
      case "s":
        s.y = +d.y || 0; s.max = +d.max || 0;
        if (s === attivo) { segna(); if (S.modo === "telefono") fps("telefono"); }
        break;
      case "p":
        if (s !== attivo || S.modo === "telefono") break;
        S.mx = +d.x; S.my = +d.y; S.dentro = true;
        lenteSu(true); segna();
        if (lenteAccesa) fps("lente");
        nascondiSugg();
        break;
      case "via": S.dentro = false; lenteSu(false); break;
      case "vai":
        if (s !== attivo) break;
        var j = indiceDi(d.path);
        if (j >= 0) vaiA(j, d.hash);
        else annuncio.textContent = "Questa pagina non fa parte della proposta.";
        break;
      case "punta": if (s === attivo) punta(d.path); break;
      case "giu": chiudiMappa(); break;
      case "tasto":
        if (d.k === "Escape") esc();
        else if (d.k === " ") tieni(d.giu);
        break;
      case "tieni": tieni(d.on); break;
    }
  });

  /* ---------------------------------------------------------------- comandi */
  function esc() {
    if (!mappa.hidden) { chiudiMappa(true); return; }
    if (S.tieni) { tieni(false); return; }
    chiudi();
  }
  function interattivo(t) { return t && t !== finestra && /^(BUTTON|INPUT|SELECT|TEXTAREA|A)$/.test(t.tagName); }
  D.addEventListener("keydown", function (e) {
    if (!S.aperto) return;
    var t = e.target;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); esc(); return; }
    if (e.key === " " || e.code === "Space") {
      if (t === btnTieni || !interattivo(t) && t !== presa) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) tieni(true); }
      return;
    }
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (!mappa.hidden && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End")) {
      var voci = [].slice.call(mappaLista.querySelectorAll(".cf-mappa-voce")), k = voci.indexOf(D.activeElement);
      e.preventDefault();
      k = e.key === "Home" ? 0 : e.key === "End" ? voci.length - 1 : limita(k + (e.key === "ArrowDown" ? 1 : -1), 0, voci.length - 1);
      voci[k].focus();
      return;
    }
    if (t === presa || (t && t.getAttribute && t.getAttribute("role") === "radio")) return;
    if (e.key === "ArrowRight" && S.i < S.prog.pagine.length - 1) { e.preventDefault(); e.stopPropagation(); vaiA(S.i + 1); }
    else if (e.key === "ArrowLeft" && S.i > 0) { e.preventDefault(); e.stopPropagation(); vaiA(S.i - 1); }
  }, true);
  D.addEventListener("keyup", function (e) {
    if (S.aperto && (e.key === " " || e.code === "Space")) tieni(false);
  }, true);
  W.addEventListener("blur", function () { if (S.tieni && !S.tieniDito) tieni(false); });

  $("cf-chiudi").addEventListener("click", chiudi);
  $("cf-prec").addEventListener("click", function () { if (S.i > 0) vaiA(S.i - 1); });
  $("cf-succ").addEventListener("click", function () { if (S.i < S.prog.pagine.length - 1) vaiA(S.i + 1); });
  btnPagina.addEventListener("click", function () { if (mappa.hidden) apriMappa(); else chiudiMappa(true); });
  mappaLista.addEventListener("click", function (e) {
    var b = e.target.closest(".cf-mappa-voce");
    if (!b) return;
    chiudiMappa(true);
    vaiA(+b.dataset.i);
  });
  function lavoroVicino(d) {
    var a = pronti(), k = a.indexOf(S.prog);
    if (a.length > 1) cambiaLavoro(a[(k + d + a.length) % a.length]);
  }
  $("cf-lavoro-prec").addEventListener("click", function () { lavoroVicino(-1); });
  $("cf-lavoro-succ").addEventListener("click", function () { lavoroVicino(1); });
  D.addEventListener("pointerdown", function (e) {
    if (S.aperto && !mappa.hidden && !mappa.contains(e.target) && !btnPagina.contains(e.target)) chiudiMappa();
  }, true);

  modi.forEach(function (b) {
    b.addEventListener("click", function () { modo(b.dataset.modo, true); nascondiSugg(true); });
    b.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      var vis = modi.filter(function (x) { return !x.hidden; }), k = vis.indexOf(b);
      var n = vis[(k + (e.key === "ArrowRight" ? 1 : -1) + vis.length) % vis.length];
      modo(n.dataset.modo, true); n.focus();
    });
  });

  /* il tasto "tieni premuto": mouse, dito, tastiera */
  btnTieni.addEventListener("pointerdown", function (e) {
    if (e.button > 0) return;
    e.preventDefault();
    try { btnTieni.setPointerCapture(e.pointerId); } catch (x) {}
    S.tieniDito = true; tieni(true);
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (t) {
    btnTieni.addEventListener(t, function () { if (S.tieniDito) { S.tieniDito = false; tieni(false); } });
  });
  btnTieni.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  btnTieni.addEventListener("click", function (e) { e.preventDefault(); });

  /* la tenda: trascinare la maniglia (scudo sopra l'iframe), oppure frecce da tastiera */
  function ariaTenda() {
    presa.setAttribute("aria-valuenow", Math.round(S.tenda * 100));
    presa.setAttribute("aria-valuetext", Math.round(S.tenda * 100) + "% sito di prima");
  }
  function tendaA(x) {
    S.tenda = limita(x, 0, 1);
    ariaTenda(); segna(); fps("tenda");
  }
  function inizioTrascina(e) {
    if (e.button > 0 || S.modo !== "tenda") return;
    e.preventDefault();
    S.trascina = e.pointerId;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) {}
    radice.classList.add("cf-trascina");
    nascondiSugg(true);
    tendaA((e.clientX - scenaL) / scenaW);
  }
  function muoviTrascina(e) { if (S.trascina === e.pointerId) tendaA((e.clientX - scenaL) / scenaW); }
  function fineTrascina(e) { if (S.trascina === e.pointerId) { S.trascina = false; radice.classList.remove("cf-trascina"); } }
  [presa, maniglia.querySelector(".cf-maniglia-zona"), scudo].forEach(function (el) {
    el.addEventListener("pointerdown", inizioTrascina);
    el.addEventListener("pointermove", muoviTrascina);
    el.addEventListener("pointerup", fineTrascina);
    el.addEventListener("pointercancel", fineTrascina);
    el.addEventListener("lostpointercapture", fineTrascina);
  });
  presa.addEventListener("keydown", function (e) {
    var p = e.shiftKey ? 0.1 : 0.02, m = { ArrowLeft: -p, ArrowDown: -p, ArrowRight: p, ArrowUp: p }[e.key];
    if (m != null) { e.preventDefault(); tendaA(S.tenda + m); }
    else if (e.key === "Home") { e.preventDefault(); tendaA(0); }
    else if (e.key === "End") { e.preventDefault(); tendaA(1); }
  });

  /* telefono di sinistra: la rotella fa scorrere quello di destra (sono legati) */
  telPrima.addEventListener("wheel", function (e) {
    if (!attivo) return;
    e.preventDefault();
    manda(attivo, { cf: "scorri", dy: e.deltaY * (e.deltaMode === 1 ? 18 : e.deltaMode === 2 ? geo.telH : 1) });
  }, { passive: false });

  /* il mouse sulla barra spegne la lente */
  finestra.addEventListener("pointermove", function (e) {
    if (e.target.closest && e.target.closest(".cf-barra")) { if (S.dentro) { S.dentro = false; lenteSu(false); } }
  }, { passive: true });

  /* dopo un clic col mouse sui tasti il fuoco torna alla finestra, così la barra spaziatrice resta "tieni premuto" */
  radice.querySelector(".cf-barra").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (b && e.detail > 0 && S.aperto && !S.chiusura && mappa.hidden) { try { finestra.focus({ preventScroll: true }); } catch (x) {} }
  });

  /* trappola del fuoco */
  [].forEach.call(radice.querySelectorAll(".cf-sentinella"), function (s) {
    s.addEventListener("focus", function () {
      if (s.dataset.cfVerso === "inizio") $("cf-chiudi").focus();
      else if (attivo) attivo.ifr.focus(); else $("cf-chiudi").focus();
    });
  });

  /* ridimensionamenti, rotazione del telefono, preferenze che cambiano */
  var tRid = 0;
  W.addEventListener("resize", function () {
    if (!S.aperto) return;
    cancelAnimationFrame(tRid);
    tRid = requestAnimationFrame(function () {
      misuraScena();
      if (!modoPossibile(S.modo)) modo(S.modo); else { modi.forEach(function (b) { b.hidden = !modoPossibile(b.dataset.modo); }); montaPila(); }
      $("cf-mappa-lavori").hidden = pronti().length < 2 || !mqTel.matches;
      segna();
    });
  });

  /* la sonda parte quando la vetrina è ferma, così al clic è già pronta */
  function presto() { (W.requestIdleCallback || function (f) { setTimeout(f, 1200); })(function () { sonda(); }, { timeout: 4000 }); }
  if (D.readyState === "complete") presto(); else W.addEventListener("load", presto);

  W.Confronto = {
    apri: apri,
    chiudi: chiudi,
    misure: function () {
      var c = M.cambi.map(function (x) { return x.ms; }).sort(function (a, b) { return a - b; });
      return {
        blob: BLOB, lente: riassunto(M.lente), tenda: riassunto(M.tenda), telefono: riassunto(M.telefono),
        cambio_pagina_ms: { mediana: c.length ? c[c.length >> 1] : null, massimo: c.length ? c[c.length - 1] : null, tutti: M.cambi.slice() }
      };
    }
  };
})();
