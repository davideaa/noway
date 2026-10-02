/* ==========================================================================
   CONFRONTO prima/dopo (agente confronto)

   API
     Confronto.apri(id, elementoDiPartenza)  apre il lavoro (animazione dal riquadro)
     Confronto.chiudi()                      torna alla vetrina (focus sull'elemento + evento 'confronto:chiuso')
     Confronto.misure()                      fps misurati durante lo scorrimento e ms dei cambi pagina

   Modi
     Affiancati  (predefinito su computer) fotografie a pagina intera di prima e di dopo, metà schermo
                 ciascuna, che scorrono insieme in proporzione. Un solo scorrimento nativo (rotella, dito,
                 tastiera) muove entrambe: dove il browser lo sa fare (ScrollTimeline) le muove il
                 compositore, senza passare dal JavaScript; altrimenti un aggiornamento per fotogramma.
     Telefono    da computer: due telefoni, a sinistra la foto di prima, a destra il sito nuovo VIVO a 390 px.
                 Su schermo stretto: le due versioni da telefono affiancate (foto), che scorrono insieme.
     Solo prima  la fotografia del sito di oggi a tutto schermo.
     Solo dopo   il sito nuovo vero, a grandezza naturale (predefinito su telefono).
   Fra un modo e l'altro si resta sulla stessa pagina e allo stesso punto (in proporzione).

   Come resta leggero: foto e font del sito vivo diventano blob: URL una volta sola; ogni pagina è un srcdoc
   di pochi kB; fino a 4 pagine vive restano in memoria; le fotografie sono a fette decodificate in anticipo.
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
  var slot = [$("cf-col-0"), $("cf-col-1")];
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
  function pronti() { return (V.progetti || []).filter(function (p) { return p.pronto && p.pagine && p.sito; }); }

  /* ---------------------------------------------------------------- stato */
  var S = { aperto: false, chiusura: false, prog: null, i: 0, el: null, modo: "affiancati", p: 0, ultima: {}, visitate: {} };
  var scenaW = 0, scenaH = 0, geo = { telH: 700 };

  /* ---------------------------------------------------------------- misure */
  var M = { affiancati: [], telefono: [], prima: [], dopo: [], cambi: [] };
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
    if (fT && M[fT] && fN > 8 && durata > 150) M[fT].push({ fps: Math.round((fN - 1) / durata * 10000) / 10, peggiore_ms: Math.round(fPeggio * 10) / 10, durata_ms: Math.round(durata) });
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
      r.stile = "<style>" + fc + "\n" + prog.sito.css + "</style>";
    }
    var testa = r.stile + "<script>var CF_PERCORSO=" + JSON.stringify(pg.path) + ";(" + ponte + ")();<\/script>";
    r.docs[i] = pg.html
      .replace("@@CF:TESTA@@", function () { return testa; })
      .replace("@@CF:CODA@@", function () { return "<script>" + prog.sito.js + "<\/script>"; })
      .replace(/@@I:([\w-]+)@@/g, function (m, k) { return urlImg(prog, k); });
    return r.docs[i];
  }

  /* ---------------------------------------------------------------- il ponte (gira DENTRO ogni pagina del sito vivo) */
  function ponte() {
    var P = window.CF_PERCORSO || "", d = document, su = window.parent;
    var ridotto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    function manda(m) { try { su.postMessage(m, "*"); } catch (e) {} }
    function corsa() { var se = d.scrollingElement || d.documentElement; return Math.max(0, se.scrollHeight - window.innerHeight); }
    function stato() { var se = d.scrollingElement || d.documentElement; manda({ cf: "s", y: se.scrollTop, max: corsa() }); }
    function vaiHash(h, subito) {
      var id = decodeURIComponent((h || "").slice(1)), t = id && d.getElementById(id);
      if (!t) { window.scrollTo({ top: 0, behavior: "instant" }); return; }
      t.scrollIntoView({ behavior: ridotto || subito ? "instant" : "smooth", block: "start" });
      if (!t.matches("a,button,input,select,textarea,[tabindex]")) t.setAttribute("tabindex", "-1");
      try { t.focus({ preventScroll: true }); } catch (e) {}
    }
    d.addEventListener("click", function (e) {
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
    d.addEventListener("pointerdown", function () { manda({ cf: "giu" }); }, { passive: true });
    window.addEventListener("scroll", stato, { passive: true });
    window.addEventListener("resize", stato);
    if (window.ResizeObserver) new ResizeObserver(stato).observe(d.documentElement);
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !d.querySelector("dialog[open], [role=dialog]:not(dialog):not([hidden])")) manda({ cf: "tasto", k: "Escape" });
    }, true);
    window.addEventListener("message", function (e) {
      if (e.source !== su || !e.data) return;
      var m = e.data;
      if (m.cf === "vai-a") { if (m.hash) vaiHash(m.hash, true); else window.scrollTo({ top: Math.round((m.p || 0) * corsa()), behavior: "instant" }); stato(); }
      else if (m.cf === "scorri") window.scrollBy({ top: m.dy, behavior: "instant" });
      else if (m.cf === "scorri-a") { window.scrollTo({ top: Math.round(m.p * corsa()), behavior: "instant" }); stato(); }
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

  /* ---------------------------------------------------------------- fotografie a pagina intera, a fette */
  function pila(prog, i, lato, tipo) {
    var r = ris(prog), k = i + lato + tipo;
    if (r.pile[k]) return r.pile[k];
    var dati = prog.pagine[i][lato][tipo], el = D.createElement("div"), imgs = [], y = 0;
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
      p.decodificata = true;
      var resto = p.imgs.slice(2);
      (function prossima() { var im = resto.shift(); if (im) dec(im).then(prossima); })();
    });
    return p.pronta;
  }

  /* ---------------------------------------------------------------- modi */
  function fotoModo(m) { return m === "affiancati" || m === "prima" || (m === "telefono" && stretto()); }
  function colonneDi(m) {
    if (m === "affiancati") return [["prima", "pc"], ["dopo", "pc"]];
    if (m === "prima") return [["prima", stretto() ? "tel" : "pc"]];
    if (m === "telefono" && stretto()) return [["prima", "tel"], ["dopo", "tel"]];
    return [];
  }
  function modoPossibile(m) {
    if (m === "affiancati") return !stretto();
    if (m === "telefono") return stretto() || geo.possibile;
    return m === "prima" || m === "dopo";
  }
  function modoIniziale() { return stretto() ? "dopo" : "affiancati"; }

  /* dove sono adesso, da 0 (inizio pagina) a 1 (fondo) */
  function progresso() {
    if (fotoModo(S.modo)) return foto.R > 0 ? limita(scorre.scrollTop / foto.R, 0, 1) : 0;
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
    radice.classList.toggle("cf-foto-su", fotoModo(m));
    modi.forEach(function (b) {
      b.setAttribute("aria-checked", b.dataset.modo === m ? "true" : "false");
      b.tabIndex = b.dataset.modo === m ? 0 : -1;
      b.hidden = !modoPossibile(b.dataset.modo);
    });
    if (!S.aperto || !S.prog) return;
    if (fotoModo(m)) montaFoto();
    else {
      annullaAnim();
      montaTelefono();
      if (attivo) {
        manda(attivo, { cf: "scorri-a", p: S.p });
        if (!attivo.pronto) { radice.classList.add("cf-carica-su"); quandoPronto(attivo).then(function () { radice.classList.remove("cf-carica-su"); if (attivo) manda(attivo, { cf: "scorri-a", p: S.p }); }); }
      }
    }
    if (prima !== m && !ridotto() && da !== "avvio" && scena.animate) {
      scena.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 240, easing: "ease-out" });
    }
    if (m === "dopo" && attivo && da === "vivo") { try { attivo.ifr.focus(); } catch (e) {} }
    else if (fotoModo(m) && da !== "avvio" && da !== "tastiera") { try { scorre.focus({ preventScroll: true }); } catch (e) {} }
    annuncio.textContent = { affiancati: "Prima e dopo affiancati", telefono: "Versione da telefono", prima: "Solo il sito di prima", dopo: "Solo il sito nuovo, dal vivo" }[m];
    segna();
  }

  /* ---------------------------------------------------------------- foto che scorrono insieme */
  var TL = typeof W.ScrollTimeline === "function" && !!Element.prototype.animate;
  var foto = { pile: [], V: 0, R: 0, anim: [], guidaH: 0 };
  function annullaAnim() { foto.anim.forEach(function (a) { try { a.cancel(); } catch (e) {} }); foto.anim = []; }
  function montaFoto() {
    annullaAnim();
    var cols = colonneDi(S.modo);
    radice.classList.toggle("cf-una", cols.length === 1);
    var Wc = colonne.clientWidth, Vc = colonne.clientHeight;
    var cw = cols.length === 2 ? Math.floor((Wc - 2) / 2) : Wc;
    foto.V = Vc; foto.pile = [];
    slot.forEach(function (sl, k) {
      var c = cols[k], p = c && pila(S.prog, S.i, c[0], c[1]);
      [].slice.call(sl.children).forEach(function (x) { if (!p || x !== p.el) sl.removeChild(x); });
      if (!p) return;
      disponi(p, cw); decodifica(p);
      if (p.el.parentNode !== sl) sl.appendChild(p.el);
      foto.pile.push(p);
    });
    var maxH = Math.max.apply(null, foto.pile.map(function (p) { return p.alto; }).concat([Vc]));
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
        foto.pile.forEach(function (p) { p.el.style.transform = ""; muovi(p.el, "translate3d(0,0,0)", "translate3d(0," + (-Math.max(0, p.alto - Vc)) + "px,0)"); });
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
    if (!S.aperto || !fotoModo(S.modo)) return;
    if (!TL || !foto.anim.length) segna();
    fps(S.modo);
    nascondiSugg();
  }, { passive: true });

  /* trascinare col mouse: il contenuto sotto il puntatore segue la mano, poi un po' d'inerzia (niente rimbalzi) */
  var trasc = null, inerzia = 0;
  function fermaInerzia() { cancelAnimationFrame(inerzia); inerzia = 0; }
  scorre.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    fermaInerzia();
    var r = scorre.getBoundingClientRect(), k = foto.pile.length === 2 && e.clientX - r.left > r.width / 2 ? 1 : 0;
    var pl = foto.pile[k], c = pl ? Math.max(1, pl.alto - foto.V) : 1;
    trasc = { id: e.pointerId, y0: e.clientY, top0: scorre.scrollTop, f: foto.R > 0 ? foto.R / c : 1, v: 0, t: ora(), y: e.clientY };
    try { scorre.setPointerCapture(e.pointerId); } catch (x) {}
    radice.classList.add("cf-trascina");
    e.preventDefault();
    try { scorre.focus({ preventScroll: true }); } catch (x) {}
  });
  scorre.addEventListener("pointermove", function (e) {
    if (!trasc || e.pointerId !== trasc.id) return;
    var t = ora(), dt = Math.max(1, t - trasc.t);
    trasc.v = 0.75 * ((e.clientY - trasc.y) / dt) + 0.25 * trasc.v;
    trasc.y = e.clientY; trasc.t = t;
    scorre.scrollTop = trasc.top0 - (e.clientY - trasc.y0) * trasc.f;
  });
  function fineTrascina(e) {
    if (!trasc || e.pointerId !== trasc.id) return;
    var v = trasc.v * trasc.f, recente = ora() - trasc.t < 60;
    trasc = null; radice.classList.remove("cf-trascina");
    if (!recente || Math.abs(v) < 0.15 || ridotto()) return;
    var prec = ora();
    (function giro() {
      var t = ora(), dt = Math.min(40, t - prec); prec = t;
      scorre.scrollTop -= v * dt;
      v *= Math.pow(0.94, dt / 16.7);
      if (Math.abs(v) > 0.02) inerzia = requestAnimationFrame(giro); else inerzia = 0;
    })();
  }
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (t) { scorre.addEventListener(t, fineTrascina); });
  scorre.addEventListener("wheel", fermaInerzia, { passive: true });

  /* ---------------------------------------------------------------- telefono da computer: foto di prima legata al sito vivo */
  var telPila = null;
  function montaTelefono() {
    if (S.modo !== "telefono" || stretto() || !S.prog) return;
    var p = pila(S.prog, S.i, "prima", "tel");
    disponi(p, 390); decodifica(p);
    [].slice.call(telPrima.children).forEach(function (x) { if (x !== p.el) telPrima.removeChild(x); });
    if (p.el.parentNode !== telPrima) telPrima.appendChild(p.el);
    telPila = p;
  }
  telPrima.addEventListener("wheel", function (e) {
    if (!attivo) return;
    e.preventDefault();
    manda(attivo, { cf: "scorri", dy: e.deltaY * (e.deltaMode === 1 ? 18 : e.deltaMode === 2 ? geo.telH : 1) });
  }, { passive: false });

  /* ---------------------------------------------------------------- disegno: un aggiornamento per fotogramma */
  var sporco = false;
  function segna() { if (!sporco) { sporco = true; requestAnimationFrame(disegna); } }
  function disegna() {
    sporco = false;
    if (!S.aperto) return;
    if (fotoModo(S.modo)) { if (!foto.anim.length) disegnaFoto(); return; }
    var s = attivo, p = s && s.max > 0 ? limita(s.y / s.max, 0, 1) : 0;
    avanz.style.transform = "scaleX(" + p.toFixed(4) + ")";
    if (S.modo === "telefono" && telPila && telPila.el.parentNode === telPrima) {
      telPila.el.style.transform = "translate3d(0," + (-Math.round(p * Math.max(0, telPila.alto - geo.telH))) + "px,0)";
    }
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
    var mio = ++richiesta, t0 = ora(), m = S.modo;
    S.i = i; S.ultima[prog.id] = i;
    (S.visitate[prog.id] = S.visitate[prog.id] || {})[i] = true;
    aggiornaBarra();
    var s = slotPer(prog, i, true), giaPronta;
    s.inArrivo = true; s.usato = t0;
    var attese;
    if (fotoModo(m)) {
      attese = colonneDi(m).map(function (c) { return decodifica(pila(prog, i, c[0], c[1])); });
      giaPronta = attese.length && colonneDi(m).every(function (c) { var p = ris(prog).pile[i + c[0] + c[1]]; return p && p.decodificata; });
    } else {
      giaPronta = s.pronto;
      attese = [quandoPronto(s)];
      if (m === "telefono") attese.push(Promise.race([decodifica(pila(prog, i, "prima", "tel")), attendi(400)]));
    }
    var lento = setTimeout(function () { if (mio === richiesta) radice.classList.add("cf-carica-su"); }, 140);
    return Promise.race([Promise.all(attese), attendi(fotoModo(m) ? 1500 : 8000)]).then(function () {
      clearTimeout(lento);
      if (mio !== richiesta || !S.aperto || s.prog !== prog || s.i !== i) { s.inArrivo = false; return; }
      radice.classList.remove("cf-carica-su");
      mostra(s, hash);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { M.cambi.push({ pagina: prog.pagine[i].nome, modo: m, ms: Math.round(ora() - t0), gia_pronta: !!giaPronta }); });
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
    s.ifr.tabIndex = fotoModo(S.modo) ? -1 : 0;
    s.ifr.classList.remove("cf-uscente");
    s.ifr.classList.add("cf-attivo");
    if (vecchio && vecchio !== s) {
      vecchio.ifr.tabIndex = -1;
      vecchio.ifr.classList.remove("cf-attivo", "cf-entra");
      var vivo = !fotoModo(S.modo) && !ridotto();
      if (vivo) {
        vecchio.ifr.classList.add("cf-uscente");
        s.ifr.classList.remove("cf-entra"); void s.ifr.offsetWidth; s.ifr.classList.add("cf-entra");
      }
      var v = vecchio;
      setTimeout(function () { if (v !== attivo) { v.ifr.classList.remove("cf-uscente"); manda(v, { cf: "reset" }); } }, vivo ? 240 : 0);
    }
    if (focusDentro) { try { s.ifr.focus(); } catch (e) {} }
    if (fotoModo(S.modo)) {
      montaFoto();
      if (!ridotto() && colonne.animate) colonne.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: "ease-out" });
    } else montaTelefono();
    segna();
  }
  function precarica() {
    clearTimeout(tPre);
    tPre = setTimeout(function () {
      if (!S.aperto) return;
      var n = S.prog.pagine.length, j = S.i + 1 < n ? S.i + 1 : S.i - 1;
      if (j < 0) return;
      colonneDi(S.modo).forEach(function (c) { decodifica(pila(S.prog, j, c[0], c[1])); });
      if (!slotPer(S.prog, j, false)) slotPer(S.prog, j, true);
    }, 450);
  }
  function punta(path) {
    var j = indiceDi(path);
    if (j < 0 || slotPer(S.prog, j, false)) return;
    clearTimeout(tPre);
    tPre = setTimeout(function () { if (S.aperto && !slotPer(S.prog, j, false)) slotPer(S.prog, j, true); }, 90);
  }

  /* ---------------------------------------------------------------- barra e mappa del sito */
  function due(n) { return (n < 10 ? "0" : "") + n; }
  function costruisciMappa() {
    var pg = S.prog.pagine;
    mappaLista.innerHTML = "";
    pg.forEach(function (p, j) {
      var figlia = pg.some(function (q) { return q.path && q.path !== p.path && p.path.indexOf(q.path) === 0; });
      var li = D.createElement("li"), b = D.createElement("button");
      if (figlia) li.className = "cf-mappa-sotto";
      b.type = "button"; b.className = "cf-mappa-voce"; b.dataset.i = j;
      b.innerHTML = '<span class="cf-mappa-num" aria-hidden="true">' + due(j + 1) + '</span><span class="cf-mappa-testo"></span><span class="cf-mappa-vista" aria-hidden="true"></span>';
      b.querySelector(".cf-mappa-testo").textContent = p.nome;
      li.appendChild(b); mappaLista.appendChild(li);
    });
    $("cf-mappa-conta").textContent = pg.length + " pagine";
    var altri = pronti(), boxL = $("cf-mappa-lavori"), tasti = $("cf-mappa-lavori-tasti");
    $("cf-lavori").hidden = altri.length < 2;
    boxL.hidden = altri.length < 2 || !stretto();
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
    $("cf-prec").disabled = $("cf-mappa-prec").disabled = S.i === 0;
    $("cf-succ").disabled = $("cf-mappa-succ").disabled = S.i === pg.length - 1;
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
    if (memo("cf-suggerito-2")) return;
    memo("cf-suggerito-2", "1");
    var t = stretto()
      ? "Questo è il sito nuovo, <b>vero</b>: provalo. In alto <em>prima</em> mostra il sito di oggi, e i due telefoni li mettono uno accanto all'altro."
      : "<b>Scorri</b> con la rotella o trascina: il sito di <em>prima</em> e la proposta scorrono insieme. <b>Prova dal vivo</b> apre il sito nuovo vero.";
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
    Promise.all([sonda(), Promise.race([im.decode && im.src ? im.decode().catch(function () {}) : 0, attendi(150)])]).then(function () { avvia(prog, r); });
    return true;
  }

  function avvia(prog, r) {
    if (!S.aperto) return;
    radice.hidden = false;
    radice.classList.add("cf-nascosta");
    if (r) radice.classList.add("cf-apertura");
    staccaPagina(true);
    misuraScena();
    S.i = S.ultima[prog.id] || 0; S.p = 0;
    costruisciMappa();
    modo(modoIniziale(), "avvio");
    var pagina = vaiA(S.i);
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
    Promise.all([pagina, entrata]).then(function () {
      if (!S.aperto) return;
      velaPagina();
      radice.classList.remove("cf-nascosta");
      requestAnimationFrame(function () { radice.classList.remove("cf-apertura"); });
      if (fotoModo(S.modo)) { try { scorre.focus({ preventScroll: true }); } catch (e) {} }
      else { try { finestra.focus({ preventScroll: true }); } catch (e) {} }
      if (r) {
        var q = fantasma.querySelector(".cf-fantasma-quadro");
        q.style.transition = "opacity .3s ease-out"; q.style.opacity = "0";
        fantasma.querySelector(".cf-fantasma-fondo").style.opacity = "0";
        setTimeout(function () { fantasma.classList.remove("cf-su"); }, 380);
      }
      if (!ridotto() && fotoModo(S.modo) && slot[0].animate) {   // le due colonne arrivano dai lati
        slot.forEach(function (sl, k) { sl.animate([{ transform: "translate3d(" + (k ? 28 : -28) + "px,0,0)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 520, delay: 80, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" }); });
      }
      suggerisci();
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
    var vai = function () {
      svuotaPool(); annullaAnim(); telPila = null;
      slot.concat([telPrima]).forEach(function (c) { c.innerHTML = ""; });
      S.prog = prog; S.p = 0;
      costruisciMappa();
      return vaiA(S.ultima[prog.id] || 0);
    };
    if (ridotto() || !scena.animate) { vai(); return; }
    var a = scena.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" });
    a.onfinish = function () {
      vai().then(function () {
        scena.animate([{ opacity: 0, transform: "translate3d(0,12px,0)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "cubic-bezier(.16,1,.3,1)" });
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
        if (s === attivo && !fotoModo(S.modo)) { segna(); fps(S.modo); }
        break;
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
      var voci = [].slice.call(mappaLista.querySelectorAll(".cf-mappa-voce")), k = voci.indexOf(D.activeElement);
      e.preventDefault();
      k = e.key === "Home" ? 0 : e.key === "End" ? voci.length - 1 : limita(k + (e.key === "ArrowDown" ? 1 : -1), 0, voci.length - 1);
      voci[k].focus();
      return;
    }
    if (t && t.getAttribute && t.getAttribute("role") === "radio") return;
    if (e.key === "ArrowRight" && S.i < S.prog.pagine.length - 1) { e.preventDefault(); e.stopPropagation(); vaiA(S.i + 1); }
    else if (e.key === "ArrowLeft" && S.i > 0) { e.preventDefault(); e.stopPropagation(); vaiA(S.i - 1); }
  }, true);

  $("cf-chiudi").addEventListener("click", chiudi);
  function pagPrec() { if (S.i > 0) vaiA(S.i - 1); }
  function pagSucc() { if (S.i < S.prog.pagine.length - 1) vaiA(S.i + 1); }
  $("cf-prec").addEventListener("click", pagPrec);
  $("cf-succ").addEventListener("click", pagSucc);
  $("cf-mappa-prec").addEventListener("click", function () { chiudiMappa(); pagPrec(); });
  $("cf-mappa-succ").addEventListener("click", function () { chiudiMappa(); pagSucc(); });
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
      if (indietro) { if (fotoModo(S.modo)) scorre.focus(); else if (attivo) attivo.ifr.focus(); else $("cf-chiudi").focus(); }
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
      if (fotoModo(S.modo)) { S.p = p; montaFoto(); } else { montaTelefono(); segna(); }
    });
  });

  /* quando la vetrina è ferma: sonda dei blob, prima pagina del primo lavoro e le sue foto già pronte */
  function quandoFermo(f, t) { (W.requestIdleCallback || function (g) { setTimeout(g, 1200); })(f, { timeout: t }); }
  function presto() {
    quandoFermo(function () {
      sonda().then(function () {
        setTimeout(function () {
          quandoFermo(function () {
            var p = pronti()[0];
            if (!p || S.aperto || pool.length) return;
            var i = S.ultima[p.id] || 0;
            if (stretto()) slotPer(p, i, true);
            else { decodifica(pila(p, i, "prima", "pc")); decodifica(pila(p, i, "dopo", "pc")); slotPer(p, i, true); }
          }, 6000);
        }, 1500);
      });
    }, 4000);
  }
  if (D.readyState === "complete") presto(); else W.addEventListener("load", presto);

  W.Confronto = {
    apri: apri,
    chiudi: chiudi,
    misure: function () {
      var c = M.cambi.map(function (x) { return x.ms; }).sort(function (a, b) { return a - b; });
      return {
        blob: BLOB, scorrimento_dal_compositore: TL,
        affiancati: riassunto(M.affiancati), telefono: riassunto(M.telefono), solo_prima: riassunto(M.prima), solo_dopo: riassunto(M.dopo),
        cambio_pagina_ms: { mediana: c.length ? c[c.length >> 1] : null, massimo: c.length ? c[c.length - 1] : null, tutti: M.cambi.slice() }
      };
    }
  };
})();
