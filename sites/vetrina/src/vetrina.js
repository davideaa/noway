/* Vetrina di Davide: la pagina. Il confronto prima/dopo e' un altro file (confronto.js) e si apre con Confronto.apri(id, elemento).
   Regole: i contenuti nascono visibili; GSAP li anima "da" uno stato nascosto solo quando e' sicuro che parta.
   Ogni blocco e' isolato in prova(): se uno si rompe, gli altri funzionano. */
(function () {
  "use strict";
  var html = document.documentElement;
  if (window.__vtFs) { clearTimeout(window.__vtFs); window.__vtFs = 0; }

  var D = window.VETRINA || { progetti: [] };
  var G = window.gsap, ST = window.ScrollTrigger, SP = window.SplitText;
  var ridotto = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var fine = !!(window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches);
  var haG = !!(G && ST);
  var anim = haG && !ridotto;
  if (haG) { G.registerPlugin(ST); if (SP) G.registerPlugin(SP); ST.config({ ignoreMobileResize: true }); }

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function prova(nome, fn) { try { fn(); } catch (e) { if (window.console) console.warn("[vetrina] " + nome + ": " + (e && e.message)); } }
  function memoria(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} return null; }

  var timerAvviso = 0;
  function avvisa(t) {
    var a = $("#avviso"); if (!a) return;
    a.textContent = t; a.hidden = false;
    clearTimeout(timerAvviso); timerAvviso = setTimeout(function () { a.hidden = true; }, 3600);
  }

  /* ---------- aprire un lavoro (il confronto lo fa un altro pezzo) ---------- */
  function apriLavoro(id, el) {
    html.classList.add("vt-fuori");
    if (window.Confronto && typeof window.Confronto.apri === "function") {
      try {
        window.Confronto.apri(id, el);
        /* se per qualche motivo non si e' aperto, il cursore torna normale */
        setTimeout(function () { if (!html.classList.contains("cf-aperto")) html.classList.remove("vt-fuori"); }, 1500);
        return;
      } catch (e) { /* cade nel messaggio */ }
    }
    html.classList.remove("vt-fuori");
    avvisa("Il confronto non si è ancora caricato. Riprova tra un momento.");
  }
  document.addEventListener("confronto:chiuso", function () { html.classList.remove("vt-fuori"); });

  /* ---------- posizione di un "prima/dopo": una sola regola per tutti ---------- */
  function dividi(pr, prImg, man, p) {
    var f = (1 - p) * 100;
    pr.style.transform = "translate3d(" + (-f) + "%,0,0)";
    prImg.style.transform = "translate3d(" + f + "%,0,0)";
    man.style.transform = "translate3d(" + (p * 100) + "%,0,0)";
  }

  /* ---------- il progetto pronto, se c'e' ---------- */
  var pronto = null;
  (D.progetti || []).some(function (p) { if (p.pronto && p.anteprima && p.anteprima.prima && p.anteprima.dopo) { pronto = p; return true; } return false; });

  /* =====================================================================
     1. Confronto di copertina (trascinabile, anche da tastiera)
     ===================================================================== */
  var conf = null;
  prova("confronto di copertina", function () {
    var fig = $("#conf-hero"); if (!fig || !pronto) return;
    var sch = $("#conf-schermo"), pr = $("#conf-pr"), prImg = $("#conf-prima"), dopo = $("#conf-dopo");
    var man = $("#conf-manico"), pomo = $("#conf-pomo"), chipP = $("#chip-p"), chipD = $("#chip-d");
    prImg.src = pronto.anteprima.prima; dopo.src = pronto.anteprima.dopo;
    $("#conf-nome").textContent = pronto.nome || "";
    fig.hidden = false;
    var st = { p: .5 }, tgt = .5, raf = 0, preso = false, demo = null, rect = null, usato = false;

    function disegna() {
      dividi(pr, prImg, man, st.p);
      chipP.style.opacity = clamp(st.p * 6, 0, 1);
      chipD.style.opacity = clamp((1 - st.p) * 6, 0, 1);
      pomo.setAttribute("aria-valuenow", Math.round(st.p * 100));
    }
    function tick() {
      raf = 0;
      var d = tgt - st.p;
      if (Math.abs(d) < .0008) { st.p = tgt; disegna(); return; }
      st.p += d * .26; disegna(); raf = requestAnimationFrame(tick);
    }
    function vai(p) { tgt = clamp(p, 0, 1); if (!raf) raf = requestAnimationFrame(tick); }
    function ferma() { if (demo) { demo.kill(); demo = null; } usato = true; }
    function dalPuntatore(e) { var r = rect || sch.getBoundingClientRect(); return (e.clientX - r.left) / r.width; }

    sch.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      ferma(); preso = true; rect = sch.getBoundingClientRect(); sch.classList.add("preso");
      try { sch.setPointerCapture(e.pointerId); } catch (x) {}
      vai(dalPuntatore(e));
    });
    sch.addEventListener("pointermove", function (e) { if (preso) vai(dalPuntatore(e)); });
    function lascia() { preso = false; rect = null; sch.classList.remove("preso"); }
    sch.addEventListener("pointerup", lascia);
    sch.addEventListener("pointercancel", lascia);
    pomo.addEventListener("keydown", function (e) {
      var k = e.key, passo = e.shiftKey ? .15 : .05, n = null;
      if (k === "ArrowLeft" || k === "ArrowDown") n = tgt - passo;
      else if (k === "ArrowRight" || k === "ArrowUp") n = tgt + passo;
      else if (k === "PageDown") n = tgt - .2;
      else if (k === "PageUp") n = tgt + .2;
      else if (k === "Home") n = 0;
      else if (k === "End") n = 1;
      if (n === null) return;
      e.preventDefault(); ferma(); vai(n);
    });
    $("#conf-apri").addEventListener("click", function () { apriLavoro(pronto.id, fig); });

    disegna();
    conf = {
      /* un giro di prova che mostra che si puo' trascinare */
      demo: function () {
        if (!anim || usato) return;
        demo = G.timeline({ onUpdate: function () { disegna(); tgt = st.p; } })
          .to(st, { p: .8, duration: 1.1, ease: "power2.inOut" })
          .to(st, { p: .22, duration: 1.5, ease: "power2.inOut" })
          .to(st, { p: .5, duration: 1.1, ease: "power2.inOut" });
      }
    };
  });

  /* =====================================================================
     2. I lavori come canali
     ===================================================================== */
  prova("canali", function () {
    var ul = $("#canali"); if (!ul) return;
    var freccia = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    (D.progetti || []).forEach(function (p) {
      var li = document.createElement("li");
      li.className = "canale-li";
      if (p.pronto && p.anteprima) {
        var sub = esc(p.categoria || "") + (p.luogo ? " a " + esc(p.luogo) : "");
        var cambi = '<span class="c-tag">Proposta di restyling</span>' + (p.cambi || []).slice(0, 3).map(function (c) { return "<span>" + esc(c) + "</span>"; }).join("");
        li.innerHTML =
          '<button type="button" class="canale" data-id="' + esc(p.id) + '" data-cursore="Apri" aria-label="Apri il prima e dopo: ' + esc(p.nome) + '">' +
          '<span class="c-inner"><span class="c-schermo">' +
          '<img class="c-dopo" alt="" width="1100" height="688" decoding="async">' +
          '<span class="c-pr"><img alt="" width="1100" height="688" decoding="async"></span>' +
          '<span class="c-manico"><i></i><b></b></span>' +
          '<span class="c-chip c-chip-p">Prima</span><span class="c-chip c-chip-d">Dopo</span>' +
          '<span class="c-lucido"></span></span>' +
          '<span class="c-testo"><span class="c-riga"><strong>' + esc(p.nome) + '</strong><span class="c-entra">Entra' + freccia + '</span></span>' +
          '<span class="c-sub">' + sub + '</span>' +
          '<span class="c-cambi">' + cambi + "</span></span></span></button>";
        var b = $(".canale", li);
        $(".c-dopo", li).src = p.anteprima.dopo;
        $(".c-pr img", li).src = p.anteprima.prima;
        canale(b, p);
      } else {
        li.classList.add("soon");
        li.innerHTML = '<div class="attesa"><span class="attesa-t">In arrivo</span><span class="attesa-c">' + esc(p.categoria || "Prossimo lavoro") + '</span><span class="sr">Non ancora disponibile.</span></div>';
      }
      ul.appendChild(li);
    });
  });

  function canale(b, p) {
    var pr = $(".c-pr", b), prImg = $(".c-pr img", b), man = $(".c-manico", b), inner = $(".c-inner", b), luc = $(".c-lucido", b);
    var st = { p: .5 }, tw = null;
    function app() { dividi(pr, prImg, man, st.p); }
    app();
    b.addEventListener("click", function () { apriLavoro(p.id, b); });
    if (!anim) return;

    /* sopra il riquadro: la linea scorre da una parte all'altra, mostrando prima e dopo */
    function entra() {
      if (tw) tw.kill();
      tw = G.timeline({ onUpdate: app })
        .to(st, { p: .14, duration: .55, ease: "power2.out" })
        .to(st, { p: .86, duration: 2.3, ease: "sine.inOut", repeat: -1, yoyo: true });
    }
    function esci() {
      if (tw) tw.kill();
      tw = G.to(st, { p: .5, duration: .8, ease: "power3.out", onUpdate: app });
      if (fine) G.to(inner, { rotationX: 0, rotationY: 0, duration: .8, ease: "power3.out" });
    }
    b.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") entra(); });
    b.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") esci(); });
    b.addEventListener("focus", function () { if (b.matches(":focus-visible")) entra(); });
    b.addEventListener("blur", esci);

    if (fine) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        G.to(inner, { rotationY: (x - .5) * 7, rotationX: -(y - .5) * 5, transformPerspective: 1000, duration: .5, ease: "power3.out", overwrite: "auto" });
        luc.style.setProperty("--mx", (x * 100) + "%"); luc.style.setProperty("--my", (y * 100) + "%");
      });
    }
    /* quando compare, un giro dimostrativo (utile soprattutto sul telefono, dove non c'e' il passaggio del mouse) */
    ST.create({
      trigger: b, start: "top 78%", once: true, onEnter: function () {
        if (tw) return;
        tw = G.timeline({ onUpdate: app, onComplete: function () { tw = null; } })
          .to(st, { p: .2, duration: .8, ease: "power2.inOut" })
          .to(st, { p: .8, duration: 1.2, ease: "power2.inOut" })
          .to(st, { p: .5, duration: .8, ease: "power2.out" });
      }
    });
  }

  /* =====================================================================
     3. Come rifaccio un sito: la sezione fissata
     ===================================================================== */
  prova("come rifaccio un sito", function () {
    var pista = $("#rif-pista"), scena = $("#rif-scena"), box = $("#sc-box"), sc = $("#sc");
    if (!pista || !scena || !sc) return;
    var elenco = $$("#rif-passi li"), punti = $$("#rif-punti button"), barra = $("#rif-barra"), attivo = $("#rif-attivo"), intro = $("#rif-intro");
    var SOGLIE = [0, .12, .30, .48, .66, .84];
    var TESTI = [{ t: "Il punto di partenza", d: intro ? intro.textContent : "" }].concat(elenco.map(function (li) {
      return { t: $("b", li).textContent, d: $(".d", li).textContent };
    }));
    var stato = -1;

    function scala() {
      var w = scena.clientWidth; if (!w) return;
      var s = w / 720;
      scena.style.setProperty("--s", s.toFixed(4));
    }
    scala();
    if (window.ResizeObserver) new ResizeObserver(scala).observe(scena); else window.addEventListener("resize", scala);

    function evidenzia(n) {
      $$("[data-hl]", sc).forEach(function (el) {
        if ((" " + el.getAttribute("data-hl") + " ").indexOf(" " + n + " ") < 0) return;
        el.classList.remove("hl"); void el.offsetWidth; el.classList.add("hl");
      });
    }
    function vai(n) {
      if (n === stato) return;
      var avanti = n > stato; stato = n;
      for (var i = 1; i <= 5; i++) sc.classList.toggle("k" + i, n >= i);
      elenco.forEach(function (li, i) {
        var k = i + 1;
        li.classList.toggle("on", n === k); li.classList.toggle("fatto", n > k);
        $("button", li).setAttribute("aria-current", n === k ? "step" : "false");
      });
      punti.forEach(function (b, i) { b.classList.toggle("on", n === i); b.classList.toggle("fatto", n > i); });
      if (attivo) attivo.innerHTML = "<b>" + esc(TESTI[n].t) + "</b>" + esc(TESTI[n].d);
      if (intro) intro.style.opacity = n === 0 ? 1 : .55;
      if (avanti && n > 0) evidenzia(n);
    }
    vai(0);

    function statoDa(p) { var n = 0; for (var i = SOGLIE.length - 1; i >= 0; i--) { if (p >= SOGLIE[i]) { n = i; break; } } return n; }
    function progresso(p) {
      p = clamp(p, 0, 1);
      if (barra) barra.style.transform = "scaleX(" + p.toFixed(4) + ")";
      if (anim) box.style.transform = "translate3d(0," + ((.5 - p) * 28).toFixed(1) + "px,0)";
      vai(statoDa(p));
    }
    if (!ridotto) {
      if (haG) ST.create({ trigger: pista, start: "top top", end: "bottom bottom", onUpdate: function (s) { progresso(s.progress); }, onRefresh: function (s) { progresso(s.progress); } });
      else {
        var f = 0;
        window.addEventListener("scroll", function () {
          if (f) return; f = requestAnimationFrame(function () {
            f = 0; var r = pista.getBoundingClientRect(); progresso(-r.top / Math.max(1, pista.offsetHeight - window.innerHeight));
          });
        }, { passive: true });
      }
    }
    function vaiA(n) {
      if (ridotto) { vai(n); return; }
      var cima = pista.getBoundingClientRect().top + window.pageYOffset;
      var corsa = pista.offsetHeight - window.innerHeight;
      var y = cima + corsa * (SOGLIE[n] + (n === 0 ? 0 : .025));
      window.scrollTo({ top: y, behavior: "smooth" });
    }
    elenco.forEach(function (li) { $("button", li).addEventListener("click", function () { vaiA(+li.getAttribute("data-passo")); }); });
    punti.forEach(function (b) { b.addEventListener("click", function () { vaiA(+b.getAttribute("data-passo")); }); });
  });

  /* =====================================================================
     4. Cosa faccio, come lavoro, striscia
     ===================================================================== */
  prova("servizi", function () {
    if (!anim) return;
    $$(".serv").forEach(function (li) {
      G.from(li, { y: 34, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: li, start: "top 90%", once: true } });
      ST.create({ trigger: li, start: "top 86%", once: true, onEnter: function () { li.classList.add("vista"); } });
    });
  });

  prova("come lavoro", function () {
    var filo = $("#filo"), box = $("#traccia");
    if (!anim || !filo || !box) return;
    G.fromTo(filo, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: box, start: "top 62%", end: "bottom 62%", scrub: .5 } });
    $$(".passo").forEach(function (el) {
      ST.create({ trigger: el, start: "top 62%", onEnter: function () { el.classList.add("on"); }, onLeaveBack: function () { el.classList.remove("on"); } });
      G.from($(".passo-t", el), { y: 40, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 82%", once: true } });
    });
  });

  var mqTw = [];
  prova("striscia", function () {
    if (!anim) return;
    $$(".mq").forEach(function (m) {
      var pista = $(".mq-pista", m), verso = +m.getAttribute("data-verso") || -1;
      var tw = G.fromTo(pista, { xPercent: verso < 0 ? 0 : -50 }, { xPercent: verso < 0 ? -50 : 0, duration: 42, ease: "none", repeat: -1 });
      mqTw.push(tw);
      ST.create({ trigger: m, start: "top bottom", end: "bottom top", onToggle: function (s) { tw.paused(!s.isActive); } });
    });
    var alvo = 1, corr = 1, ultimo = 1;
    ST.create({
      start: 0, end: "max", onUpdate: function (s) {
        ultimo = s.direction || ultimo;
        alvo = ultimo * Math.min(6, 1 + Math.abs(s.getVelocity()) / 320);
      }
    });
    ST.addEventListener("scrollEnd", function () { alvo = ultimo; });
    G.ticker.add(function () {
      corr += (alvo - corr) * .07;
      for (var i = 0; i < mqTw.length; i++) mqTw[i].timeScale(corr);
    });
  });

  /* =====================================================================
     5. Contatti: copia l'indirizzo (con la strada B se la clipboard dice no)
     ===================================================================== */
  prova("contatti", function () {
    var btn = $("#copia"), t = $("#copia-t"), mail = $("#mail"), stato = $("#copia-stato"), nota = $("#copia-nota");
    if (!btn || !mail) return;
    var testo = mail.textContent.trim(), timer = 0;
    function esito(ok, msg) {
      btn.setAttribute("data-stato", ok ? "ok" : "no");
      t.textContent = ok ? "Copiato" : "Copia l'indirizzo";
      if (stato) stato.textContent = msg;
      clearTimeout(timer);
      timer = setTimeout(function () { btn.removeAttribute("data-stato"); t.textContent = "Copia l'indirizzo"; if (nota) nota.hidden = true; }, 3200);
    }
    function selezionaTesto() {
      try { var r = document.createRange(); r.selectNodeContents(mail); var s = getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {}
    }
    function copiaVecchia() {
      var ta = document.createElement("textarea"), ok = false;
      ta.value = testo; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
    function nonRiuscita() {
      selezionaTesto();
      if (nota) { nota.textContent = "Il browser non mi lascia copiare. Ho selezionato l'indirizzo: premi Ctrl+C (Cmd+C su Mac)."; nota.hidden = false; }
      esito(false, "Copia non riuscita: l'indirizzo è selezionato, premi Ctrl+C.");
    }
    btn.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(testo).then(function () { esito(true, "Indirizzo copiato."); }, function () { if (copiaVecchia()) esito(true, "Indirizzo copiato."); else nonRiuscita(); });
      } else if (copiaVecchia()) esito(true, "Indirizzo copiato.");
      else nonRiuscita();
    });
  });

  /* =====================================================================
     6. Testata, menu, barra di avanzamento
     ===================================================================== */
  prova("testata", function () {
    var th = $("#testata"), mb = $("#menu-btn"), menu = $("#menu"), barra = $("#barra-scroll");
    if (!th) return;
    function chiudi() { th.classList.remove("aperto"); if (mb) mb.setAttribute("aria-expanded", "false"); }
    if (mb) {
      mb.addEventListener("click", function () { var a = th.classList.toggle("aperto"); mb.setAttribute("aria-expanded", a ? "true" : "false"); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && th.classList.contains("aperto")) { chiudi(); mb.focus(); } });
      if (menu) menu.addEventListener("click", function (e) { if (e.target.closest("a")) chiudi(); });
      document.addEventListener("click", function (e) { if (th.classList.contains("aperto") && !e.target.closest("#testata")) chiudi(); });
    }
    function solido() { th.classList.toggle("solido", window.pageYOffset > 24); }
    solido();
    if (!haG) { window.addEventListener("scroll", solido, { passive: true }); return; }
    var ult = 0, nasc = false;
    ST.create({
      start: 0, end: "max", onUpdate: function (s) {
        var y = s.scroll(); solido();
        if (barra) barra.style.transform = "scaleX(" + s.progress.toFixed(4) + ")";
        if (!anim) return;
        var d = y - ult;
        if (Math.abs(d) < 8) return;
        ult = y;
        var giu = d > 0 && y > 360;
        if (giu !== nasc && !th.classList.contains("aperto") && !th.contains(document.activeElement)) {
          nasc = giu; G.to(th, { yPercent: giu ? -120 : 0, duration: .5, ease: "power3.out", overwrite: "auto" });
        }
      }
    });
    th.addEventListener("focusin", function () { if (nasc) { nasc = false; G.to(th, { yPercent: 0, duration: .3, overwrite: "auto" }); } });
  });

  /* =====================================================================
     7. Cursore (solo mouse) e bottoni "magnetici"
     ===================================================================== */
  prova("cursore", function () {
    if (!fine || !anim) return;
    var c = document.createElement("div");
    c.className = "cur"; c.setAttribute("aria-hidden", "true");
    c.innerHTML = '<i class="cur-p"></i><span class="cur-a"><span class="cur-b"></span><span class="cur-t"></span></span>';
    document.body.appendChild(c);
    var p = $(".cur-p", c), a = $(".cur-a", c), lab = $(".cur-t", c);
    var px = G.quickTo(p, "x", { duration: .08, ease: "power3" }), py = G.quickTo(p, "y", { duration: .08, ease: "power3" });
    var ax = G.quickTo(a, "x", { duration: .42, ease: "power3" }), ay = G.quickTo(a, "y", { duration: .42, ease: "power3" });
    var primo = true;
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      if (primo) { primo = false; G.set([p, a], { x: e.clientX, y: e.clientY }); c.classList.add("on"); html.classList.add("cur-on"); }
      px(e.clientX); py(e.clientY); ax(e.clientX); ay(e.clientY);
    }, { passive: true });
    document.addEventListener("pointerover", function (e) {
      var t = e.target.closest ? e.target.closest("[data-cursore],a,button,[role=slider]") : null;
      var testo = t && t.getAttribute("data-cursore");
      if (testo) { lab.textContent = testo; c.classList.add("label"); c.classList.remove("link"); }
      else { c.classList.remove("label"); c.classList.toggle("link", !!t); }
    });
    document.addEventListener("pointerdown", function () { c.classList.add("giu"); });
    document.addEventListener("pointerup", function () { c.classList.remove("giu"); });
    html.addEventListener("mouseleave", function () { c.classList.remove("on"); });
    html.addEventListener("mouseenter", function () { if (!primo) c.classList.add("on"); });
  });

  prova("magneti", function () {
    if (!fine || !anim) return;
    $$("[data-magnete]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        G.to(el, { x: (e.clientX - (r.left + r.width / 2)) * .28, y: (e.clientY - (r.top + r.height / 2)) * .34, duration: .4, ease: "power3.out", overwrite: "auto" });
      });
      el.addEventListener("pointerleave", function () { G.to(el, { x: 0, y: 0, duration: .9, ease: "elastic.out(1,.45)", overwrite: "auto" }); });
    });
  });

  /* =====================================================================
     8. Titoli e testi che entrano
     ===================================================================== */
  prova("rivelazioni", function () {
    if (!anim) return;
    $$("[data-dividi]").forEach(function (el) {
      if (SP) {
        SP.create(el, {
          type: "lines", mask: "lines", linesClass: "riga", autoSplit: true,
          onSplit: function (self) {
            return G.from(self.lines, { yPercent: 115, duration: 1.15, ease: "expo.out", stagger: .09, scrollTrigger: { trigger: el, start: "top 92%", once: true } });
          }
        });
      } else {
        G.from(el, { y: 40, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 92%", once: true } });
      }
    });
    $$(".rv").forEach(function (el) {
      G.from(el, { y: 36, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 97%", once: true } });
    });
    var cl = $(".contatti-linea i");
    if (cl) G.from(cl, { scaleX: 0, duration: 1.8, ease: "expo.out", scrollTrigger: { trigger: ".contatti", start: "top 80%", once: true } });
    /* parallasse leggera nella copertina */
    if (!matchMedia("(max-width: 700px)").matches) {
      var sc = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
      G.to(".hero-alone", { yPercent: 28, ease: "none", scrollTrigger: sc });
      G.to(".hero-testo", { yPercent: -10, ease: "none", scrollTrigger: sc });
      G.to("#conf-hero", { yPercent: 7, ease: "none", scrollTrigger: sc });
    }
    html.classList.add("anim");
  });

  /* =====================================================================
     9. Entrata della copertina e apertura
     ===================================================================== */
  var heroTL = null, heroVia = false, inCorso = false;
  function costruisciHero() {
    html.classList.remove("pre");
    if (!anim) return;
    var tl = G.timeline({ paused: true, defaults: { ease: "expo.out" } });
    var h1 = $(".hero-titolo");
    if (SP && h1) {
      var sp = SP.create(h1, { type: "lines", mask: "lines", linesClass: "riga" });
      tl.from(sp.lines, { yPercent: 118, duration: 1.2, stagger: .1 }, .15);
    } else if (h1) tl.from(h1, { y: 40, opacity: 0, duration: 1 }, .15);
    tl.fromTo("#testata", { yPercent: -120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .9, ease: "power3.out" }, 0)
      .fromTo(".hero-frase", { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, .45)
      .fromTo(".hero-bio", { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, .6)
      .fromTo(".hero-azioni", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .9 }, .75)
      .fromTo("#conf-hero", { y: 70, opacity: 0, scale: .95 }, { y: 0, opacity: 1, scale: 1, duration: 1.3 }, .35)
      .fromTo(".hero-alone", { opacity: 0, scale: .8 }, { opacity: 1, scale: 1, duration: 1.8, ease: "power2.out" }, 0)
      .fromTo(".scorri", { opacity: 0 }, { opacity: 1, duration: 1 }, 1.3);
    tl.eventCallback("onComplete", function () { if (conf) conf.demo(); });
    heroTL = tl;
  }

  function apertura() {
    var ap = $("#apertura"), vec = $("#ap-vecchio"), int = $("#ap-int"), linea = $("#ap-linea"), cont = $("#ap-cont"), stato = $("#ap-stato"), salta = $("#ap-salta");
    if (!anim || !ap || !html.classList.contains("intro")) { html.classList.remove("intro"); avviaHero(); return; }
    inCorso = true;
    memoria("vt-apertura", "1");
    if (salta && window.matchMedia("(pointer: coarse)").matches) salta.textContent = "Tocca per saltare";
    try { history.scrollRestoration = "manual"; } catch (e) {}
    window.scrollTo(0, 0);
    var W = window.innerWidth, o = { x: 0 }, n = { v: 4173 };
    function applica() {
      vec.style.transform = "translate3d(" + o.x + "px,0,0)";
      int.style.transform = "translate3d(" + (-o.x) + "px,0,0)";
      linea.style.transform = "translate3d(" + o.x + "px,0,0)";
    }
    var finito = false;
    function chiudiAp() {
      if (finito) return; finito = true; inCorso = false;
      ap.style.display = "none"; html.classList.remove("intro");
      try { history.scrollRestoration = "auto"; } catch (e) {}
      window.removeEventListener("pointerdown", skip, true); window.removeEventListener("keydown", skip, true);
      if (haG) ST.refresh();
    }
    var tl = G.timeline({ paused: true, onComplete: chiudiAp });
    tl.to(n, { v: 4189, duration: 1.1, ease: "none", onUpdate: function () { cont.textContent = ("00" + Math.round(n.v)).slice(-6); } }, .1)
      .call(function () { stato.textContent = "Trovato un problema: il sito sembra vecchio."; }, null, .55)
      .call(function () { stato.textContent = "Lo rifaccio..."; }, null, 1)
      .to(salta, { opacity: 0, duration: .25 }, 1.0)
      .set(linea, { opacity: 1 }, 1.1)
      .fromTo(o, { x: 0 }, { x: W + 80, duration: 1.05, ease: "power3.inOut", onUpdate: applica }, 1.1)
      .call(avviaHero, null, 1.38)
      .to(linea, { opacity: 0, duration: .25 }, 2.05);
    function skip(e) {
      if (e.type === "keydown" && e.key === "Tab") return;
      tl.timeScale(9);
    }
    window.addEventListener("pointerdown", skip, true); window.addEventListener("keydown", skip, true);
    G.delayedCall(9, chiudiAp);
    applica();
    tl.play();
  }
  function avviaHero() {
    heroVia = true;
    if (heroTL) heroTL.play();
  }

  /* ---------- tutto in fila, a font pronti ---------- */
  function parti() {
    if (!anim) { html.classList.remove("pre", "intro"); if (conf) { /* niente giro di prova */ } return; }
    costruisciHero();
    apertura();
    if (!inCorso) avviaHero();
    window.addEventListener("load", function () { ST.refresh(); });
  }
  var avviato = false;
  function avvia() { if (avviato) return; avviato = true; prova("avvio", parti); }
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(avvia); setTimeout(avvia, 1200); } else avvia();

  /* ---------- rivedere l'apertura ---------- */
  prova("rivedi", function () {
    var b = $("#rivedi"); if (!b) return;
    b.addEventListener("click", function () {
      memoria("vt-apertura", null);
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
      try { history.scrollRestoration = "manual"; } catch (e) {}
      location.reload();
    });
  });
})();
