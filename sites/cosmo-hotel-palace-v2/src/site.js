(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var ridotto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MOTORE = "https://reservations.verticalbooking.com/premium/index2.html?id_albergo=146&dc=785&lingua_int=ita&id_stile=19500";

  /* testata: piena dopo lo scorrimento */
  var testata = document.querySelector(".testata");
  var suFoto = document.querySelector(".su-foto");
  function aggiornaTestata() {
    if (!testata) return;
    if (!suFoto) { testata.classList.add("piena"); return; }
    testata.classList.toggle("piena", window.scrollY > 40);
  }
  aggiornaTestata();
  window.addEventListener("scroll", aggiornaTestata, { passive: true });

  /* menu "Altro" */
  document.querySelectorAll(".nav .altro > button").forEach(function (b) {
    b.addEventListener("click", function () {
      var p = b.parentElement, aperto = p.classList.toggle("aperto");
      b.setAttribute("aria-expanded", aperto ? "true" : "false");
    });
  });
  document.addEventListener("click", function (e) {
    document.querySelectorAll(".nav .altro.aperto").forEach(function (p) {
      if (!p.contains(e.target)) { p.classList.remove("aperto"); p.querySelector("button").setAttribute("aria-expanded", "false"); }
    });
  });

  /* menu telefono */
  var menu = document.getElementById("menu-mobile");
  var apriMenu = document.querySelector(".btn-menu");
  if (menu && apriMenu) {
    var chiudiMenu = function () { menu.hidden = true; apriMenu.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; apriMenu.focus(); };
    apriMenu.addEventListener("click", function () {
      menu.hidden = false; apriMenu.setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden";
      var primo = menu.querySelector("nav a"); if (primo) primo.focus();
    });
    menu.querySelector(".chiudi").addEventListener("click", chiudiMenu);
    menu.addEventListener("keydown", function (e) { if (e.key === "Escape") chiudiMenu(); });
  }

  /* diapositive della copertina */
  var diapo = Array.prototype.slice.call(document.querySelectorAll(".hero .diapo"));
  var punti = Array.prototype.slice.call(document.querySelectorAll(".punti-diapo button"));
  if (diapo.length > 1) {
    var i = 0, timer = null;
    var mostra = function (n) {
      diapo[i].classList.remove("attiva"); punti[i] && punti[i].setAttribute("aria-current", "false");
      i = (n + diapo.length) % diapo.length;
      var img = diapo[i].querySelector("img"); if (img && img.loading === "lazy") img.loading = "eager";
      diapo[i].classList.add("attiva"); punti[i] && punti[i].setAttribute("aria-current", "true");
    };
    var avvia = function () { if (!ridotto) timer = setInterval(function () { mostra(i + 1); }, 6500); };
    punti.forEach(function (p, n) { p.addEventListener("click", function () { clearInterval(timer); mostra(n); avvia(); }); });
    avvia();
    document.addEventListener("visibilitychange", function () { clearInterval(timer); if (!document.hidden) avvia(); });
  }

  /* prenotazione: costruisce il link verso il motore ufficiale (VerticalBooking) */
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function leggi(s) { var p = (s || "").split("-"); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : null; }
  function due(n) { return String(n).padStart(2, "0"); }
  function collegamento(f) {
    var a = leggi(f.arrivo.value), p = leggi(f.partenza.value);
    var camere = +f.camere.value, adulti = +f.adulti.value, bambini = +f.bambini.value;
    if (!a || !p || p <= a) return MOTORE;
    var notti = Math.round((p - a) / 864e5);
    var q = ["gg=" + due(a.getDate()), "mm=" + due(a.getMonth() + 1), "aa=" + a.getFullYear(),
      "ggf=" + due(p.getDate()), "mmf=" + due(p.getMonth() + 1), "aaf=" + p.getFullYear(),
      "tot_camere=" + camere, "tot_adulti=" + adulti, "tot_bambini=" + bambini];
    for (var c = 0; c < camere; c++) {
      var ad = Math.floor(adulti / camere) + (c < adulti % camere ? 1 : 0);
      var bb = Math.floor(bambini / camere) + (c < bambini % camere ? 1 : 0);
      q.push("adulti" + (c + 1) + "=" + ad, "bambini" + (c + 1) + "=" + bb);
    }
    q.push("notti_1=" + notti);
    return MOTORE + "&" + q.join("&");
  }
  document.querySelectorAll("form.modulo-prenota").forEach(function (f) {
    var oggi = new Date(), domani = new Date(oggi.getTime() + 864e5);
    f.arrivo.min = iso(oggi); f.partenza.min = iso(domani);
    if (!f.arrivo.value) f.arrivo.value = iso(oggi);
    if (!f.partenza.value) f.partenza.value = iso(domani);
    var link = f.querySelector("a.cerca"), errore = f.querySelector(".errore");
    var aggiorna = function () {
      var a = leggi(f.arrivo.value), p = leggi(f.partenza.value);
      if (a && (!p || p <= a)) { var np = new Date(a.getTime() + 864e5); f.partenza.value = iso(np); }
      if (a) f.partenza.min = iso(new Date(a.getTime() + 864e5));
      if (+f.camere.value > +f.adulti.value) f.adulti.value = f.camere.value;
      link.href = collegamento(f);
      if (errore) errore.textContent = "";
    };
    f.addEventListener("change", aggiorna);
    f.addEventListener("submit", function (e) { e.preventDefault(); link.click(); });
    link.addEventListener("click", function (e) {
      if (!f.arrivo.value || !f.partenza.value) { e.preventDefault(); if (errore) errore.textContent = "Scegli le date di arrivo e di partenza."; f.arrivo.focus(); }
    });
    aggiorna();
  });
  var finestra = document.getElementById("finestra-prenota");
  document.querySelectorAll("[data-prenota]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      if (!finestra || typeof finestra.showModal !== "function") return;
      e.preventDefault(); finestra.showModal();
    });
  });
  if (finestra) finestra.querySelector(".chiudi").addEventListener("click", function () { finestra.close(); });

  /* galleria a schermo intero */
  var lb = document.getElementById("lightbox");
  if (lb) {
    var img = lb.querySelector("img"), cap = lb.querySelector("figcaption"), serie = [], pos = 0;
    var vai = function (n) {
      pos = (n + serie.length) % serie.length;
      var b = serie[pos]; img.src = b.dataset.grande; img.alt = b.dataset.alt; cap.textContent = b.dataset.alt + "  ·  " + (pos + 1) + " / " + serie.length;
    };
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-grande]"); if (!b) return;
      var gruppo = b.closest("[data-galleria]");
      serie = Array.prototype.slice.call((gruppo || document).querySelectorAll("[data-grande]")).filter(function (x) { return !x.closest("[hidden]"); });
      vai(serie.indexOf(b)); lb.showModal();
    });
    lb.querySelector(".chiudi").addEventListener("click", function () { lb.close(); });
    lb.querySelector(".prec").addEventListener("click", function () { vai(pos - 1); });
    lb.querySelector(".succ").addEventListener("click", function () { vai(pos + 1); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") vai(pos - 1); if (e.key === "ArrowRight") vai(pos + 1); });
    var x0 = null;
    lb.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) { if (x0 === null) return; var d = e.changedTouches[0].clientX - x0; if (Math.abs(d) > 50) vai(pos + (d < 0 ? 1 : -1)); x0 = null; });
  }

  /* filtri (galleria e dintorni) */
  document.querySelectorAll("[data-filtri]").forEach(function (gruppo) {
    var bersaglio = document.getElementById(gruppo.dataset.filtri);
    gruppo.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        gruppo.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        var k = b.dataset.k;
        bersaglio.querySelectorAll("[data-k]").forEach(function (el) { el.hidden = k !== "tutto" && el.dataset.k !== k; });
      });
    });
  });

  /* frecce dei caroselli */
  document.querySelectorAll("[data-scorri]").forEach(function (b) {
    b.addEventListener("click", function () {
      var t = document.getElementById(b.dataset.scorri);
      t.scrollBy({ left: (+b.dataset.dir) * t.clientWidth * 0.8, behavior: ridotto ? "auto" : "smooth" });
    });
  });

  /* copia indirizzo */
  document.querySelectorAll("[data-copia]").forEach(function (b) {
    b.addEventListener("click", function () {
      var t = b.dataset.copia, ok = function () { var v = b.textContent; b.textContent = "Copiato"; setTimeout(function () { b.textContent = v; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(ok, function () {});
    });
  });

})();
