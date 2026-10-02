(function () {
  "use strict";
  var D = window.VETRINA;
  var ridotto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var stretto = function () { return window.innerWidth <= 860; };
  var LARGHEZZA = { pc: 1440, tel: 390 };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var ov = $("#progetto"), framePrima = $("#vista-prima"), frameDopo = $("#vista-dopo");
  var stato = { id: null, pagina: 0, device: "pc", lato: "dopo", sincro: true, canale: null };
  var iframe = null, guardia = 0, timerNota = null;

  function pronti() { return D.progetti.filter(function (p) { return p.pagine; }); }
  function progetto() { return D.progetti.filter(function (p) { return p.id === stato.id; })[0]; }

  function nota(t) {
    var n = $("#nota-progetto"); n.textContent = t; n.hidden = false;
    clearTimeout(timerNota); timerNota = setTimeout(function () { n.hidden = true; }, 2600);
  }

  /* ---------- prima: le fotografie del sito originale ---------- */
  function disegnaPrima() {
    var p = progetto(), pg = p.pagine[stato.pagina];
    var pezzi = pg.prima[stato.device] || [];
    framePrima.innerHTML = '<div class="pila">' + pezzi.map(function (src, i) {
      return '<img src="' + src + '" alt="' + (i === 0 ? "Il sito attuale: " + pg.nome : "") + '"' + (i ? ' aria-hidden="true"' : "") + ">";
    }).join("") + "</div>";
    framePrima.scrollTop = 0;
    $("#url-prima").textContent = p.dominio + "/" + pg.path;
  }

  /* ---------- dopo: il sito nuovo, vivo, dentro un iframe ---------- */
  function htmlDopo(pg, p) {
    return pg.dopo.replace("@@FONT@@", function () { return D.fontDopo[p.id] || ""; })
      .replace(/@@([\w-]+)@@/g, function (m, k) { return p.img[k] || m; });
  }
  function disegnaDopo() {
    var p = progetto(), pg = p.pagine[stato.pagina];
    frameDopo.innerHTML = '<div class="attesa">Carico il sito…</div>';
    iframe = document.createElement("iframe");
    iframe.title = "La nuova versione: " + pg.nome;
    iframe.setAttribute("loading", "eager");
    frameDopo.appendChild(iframe);
    iframe.addEventListener("load", function () {
      var a = frameDopo.querySelector(".attesa"); if (a) a.remove();
      try { iframe.contentWindow.addEventListener("scroll", daDopo, { passive: true }); } catch (e) {}
    });
    iframe.srcdoc = htmlDopo(pg, p);
    $("#url-dopo").textContent = p.dominio + "/" + pg.path + "  ·  nuova versione";
    misura();
  }
  function misura() {
    if (!iframe) return;
    var W = LARGHEZZA[stato.device];
    var w = frameDopo.clientWidth, h = frameDopo.clientHeight;
    if (!w || !h) return;
    var s = w / W;
    iframe.style.width = W + "px";
    iframe.style.height = Math.ceil(h / s) + "px";
    iframe.style.transform = "scale(" + s + ")";
  }

  /* ---------- scorrimento insieme ---------- */
  function daPrima() {
    if (!stato.sincro || Date.now() < guardia || !iframe) return;
    var r = framePrima.scrollTop / Math.max(1, framePrima.scrollHeight - framePrima.clientHeight);
    try {
      var w = iframe.contentWindow, d = w.document.documentElement;
      guardia = Date.now() + 80; w.scrollTo(0, r * (d.scrollHeight - w.innerHeight));
    } catch (e) {}
  }
  function daDopo() {
    if (!stato.sincro || Date.now() < guardia) return;
    try {
      var w = iframe.contentWindow, d = w.document.documentElement;
      var r = w.scrollY / Math.max(1, d.scrollHeight - w.innerHeight);
      guardia = Date.now() + 80; framePrima.scrollTop = r * (framePrima.scrollHeight - framePrima.clientHeight);
    } catch (e) {}
  }
  framePrima.addEventListener("scroll", daPrima, { passive: true });

  /* ---------- comandi ---------- */
  function premi(gruppo, valore, attr) {
    gruppo.querySelectorAll("button").forEach(function (b) { b.setAttribute(attr || "aria-pressed", b.dataset.v === String(valore) ? "true" : "false"); });
  }
  function disegnaComandi() {
    var p = progetto();
    $("#pagine").innerHTML = p.pagine.map(function (pg, i) {
      return '<button type="button" role="tab" data-v="' + i + '" aria-selected="' + (i === stato.pagina) + '">' + pg.nome + "</button>";
    }).join("");
    premi($("#device"), stato.device);
    premi($("#scelta-lato"), stato.lato);
    $("#titolo-progetto").textContent = p.nome;
    $("#sotto-progetto").textContent = p.categoria + " · " + p.luogo;
    $("#cambi").innerHTML = p.cambi.map(function (c) { return "<li>" + c + "</li>"; }).join("");
    var lista = pronti(), i = lista.indexOf(p);
    $("#precedente").disabled = lista.length < 2; $("#successivo").disabled = lista.length < 2;
    $("#precedente").dataset.id = lista[(i - 1 + lista.length) % lista.length].id;
    $("#successivo").dataset.id = lista[(i + 1) % lista.length].id;
    ov.classList.toggle("telefono", stato.device === "tel");
    document.querySelectorAll(".confronto .lato").forEach(function (l) {
      if (stretto() && !l.classList.contains(stato.lato)) l.setAttribute("data-nascosto", ""); else l.removeAttribute("data-nascosto");
    });
  }
  function disegna() { disegnaComandi(); disegnaPrima(); disegnaDopo(); }

  $("#pagine").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    stato.pagina = +b.dataset.v; disegna();
  });
  $("#device").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b || b.dataset.v === stato.device) return;
    stato.device = b.dataset.v; disegna();
  });
  $("#scelta-lato").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    stato.lato = b.dataset.v; disegnaComandi(); requestAnimationFrame(misura);
  });
  $("#sincro").addEventListener("change", function (e) { stato.sincro = e.target.checked; });
  window.addEventListener("resize", function () { if (!ov.hidden) { disegnaComandi(); misura(); } });

  /* il sito nuovo chiede di aprire un'altra sua pagina */
  window.addEventListener("message", function (e) {
    var m = e.data; if (!m || m.vetrina !== "pagina" || ov.hidden) return;
    var p = progetto(), i = -1;
    p.pagine.forEach(function (pg, n) { if (pg.path === m.path) i = n; });
    if (i >= 0) { stato.pagina = i; disegna(); }
    else nota("In questa vetrina ci sono solo alcune pagine del sito: " + p.pagine.map(function (x) { return x.nome; }).join(", ") + ".");
  });

  /* ---------- apertura e chiusura del canale ---------- */
  function rettangolo(el) {
    var r = el.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight;
    return "inset(" + r.top + "px " + (W - r.right) + "px " + (H - r.bottom) + "px " + r.left + "px round 28px)";
  }
  function apri(id, canale) {
    stato.id = id; stato.pagina = 0; stato.canale = canale || null;
    stato.device = stretto() ? "tel" : "pc"; stato.lato = "dopo";
    ov.hidden = false; document.body.style.overflow = "hidden";
    disegna();
    if (canale && !ridotto && ov.animate) {
      ov.animate([{ clipPath: rettangolo(canale) }, { clipPath: "inset(0 0 0 0 round 0px)" }], { duration: 560, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
    $("#indietro").focus();
    try { history.replaceState(null, "", "#" + id); } catch (e) {}
  }
  function chiudi() {
    var fine = function () {
      ov.hidden = true; document.body.style.overflow = ""; frameDopo.innerHTML = ""; iframe = null;
      var c = document.querySelector('.canale[data-id="' + stato.id + '"]'); if (c) c.focus();
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    };
    var c = document.querySelector('.canale[data-id="' + stato.id + '"]');
    if (c && !ridotto && ov.animate) {
      var a = ov.animate([{ clipPath: "inset(0 0 0 0 round 0px)" }, { clipPath: rettangolo(c) }], { duration: 420, easing: "cubic-bezier(.4,0,.2,1)" });
      a.onfinish = fine;
    } else fine();
  }
  document.querySelectorAll(".canale[data-id]").forEach(function (c) {
    if (c.hasAttribute("aria-disabled")) return;
    c.addEventListener("click", function () { apri(c.dataset.id, c); });
  });
  $("#indietro").addEventListener("click", chiudi);
  $("#precedente").addEventListener("click", function (e) { apri(e.currentTarget.dataset.id, null); });
  $("#successivo").addEventListener("click", function (e) { apri(e.currentTarget.dataset.id, null); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !ov.hidden) chiudi(); });

  /* copia l'indirizzo email */
  var copia = $("#copia-mail");
  if (copia) copia.addEventListener("click", function () {
    var t = copia.dataset.mail, ok = function () { copia.textContent = "Copiato"; setTimeout(function () { copia.textContent = "Copia l'indirizzo"; }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(ok, function () {});
  });

  /* confronto in cima: trascina per vedere prima e dopo */
  var conf = $("#confronta"), cur = $("#cursore-confronto");
  if (conf && cur) {
    var poni = function (v) { conf.style.setProperty("--x", v + "%"); };
    cur.addEventListener("input", function () { poni(cur.value); });
    if (!ridotto) {
      var t0 = null, mosso = false;
      cur.addEventListener("pointerdown", function () { mosso = true; });
      var giro = function (t) {
        if (mosso) return; if (t0 === null) t0 = t;
        var k = (t - t0) / 2600; if (k > 1) { poni(50); cur.value = 50; return; }
        var v = 50 + 30 * Math.sin(k * Math.PI * 2) * (1 - k); poni(v.toFixed(1)); cur.value = v; requestAnimationFrame(giro);
      };
      setTimeout(function () { requestAnimationFrame(giro); }, 900);
    }
  }

  /* collegamento diretto a un lavoro (#cosmo) */
  var h = (location.hash || "").slice(1);
  if (h && pronti().some(function (p) { return p.id === h; })) apri(h, null);
})();
