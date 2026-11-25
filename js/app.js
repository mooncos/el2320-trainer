"use strict";
// Shared app for every exam part. The URL hash is "#<part>/<tab>" (e.g. #p3/entreno); the selected part's
// generators.js + content.js are loaded on demand and define window.Gens / window.CONTENT.
const PARTS = { p2: "Parte II · KF / EKF", p3: "Parte III · Particle Filter" };
const DEFAULT_PART = "p3";
const parseHash = () => { const [p, t] = location.hash.slice(1).split("/"); return PARTS[p] ? { part: p, tab: t } : { part: null, tab: p }; };
const PART = parseHash().part || localStorage.getItem("el2320:part") || DEFAULT_PART;
localStorage.setItem("el2320:part", PART);
const loadScript = src => new Promise((ok, fail) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => fail(new Error("no se pudo cargar " + src)); document.head.append(s); });
window.addEventListener("DOMContentLoaded", () =>
  loadScript(`parts/${PART}/generators.js`).then(() => loadScript(`parts/${PART}/content.js`)).then(start)
    .catch(e => { document.querySelector("main").textContent = e.message; }));

function start() {
const { parseNum, close } = window.Eng;
const C = window.CONTENT;
const $ = (s, el = document) => el.querySelector(s);
const h = (tag, attrs = {}, html = "") => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); } if (html) e.innerHTML = html; return e; };
const tex = el => { if (window.renderMathInElement) renderMathInElement(el, { delimiters: [{ left: "$$", right: "$$", display: true }, { left: "$", right: "$", display: false }], throwOnError: false }); return el; };
// per-part prefix ("el2320p2:", "el2320p3:") keeps the progress saved by the old single-part sites
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(`el2320${PART}:` + k)) ?? d; } catch { return d; } },
  set(k, v) { localStorage.setItem(`el2320${PART}:` + k, JSON.stringify(v)); updateProgress(); },
};

const TABS = [
  ["inicio", "🏁 Plan"], ["receta", "🧭 Receta"], ["dicc", "📖 Palabras→Mates"], ["examenes", "📝 Exámenes"],
  ["entreno", "🎯 Entrenador"], ["teoria", "🃏 Flashcards"], ["quiz", "❓ Quiz"], ["check", "✅ Checklist"],
];
const main = $("main");
let current = null;
function header() {
  document.title = `EL2320 · ${C.ui.title} · trainer`;
  const sel = $("#part"); sel.innerHTML = "";
  for (const [p, label] of Object.entries(PARTS)) sel.append(h("option", { value: p }, label));
  sel.value = PART;
  sel.onchange = () => { location.hash = `${sel.value}/${current || "inicio"}`; };   // hashchange handler reloads into the new part
  const n = $("nav"); n.innerHTML = "";
  for (const [id, label] of TABS) n.append(h("button", { "data-tab": id, onclick: () => go(id) }, label));
}
function go(id) {
  if (!VIEWS[id]) id = "inicio";
  current = id;
  history.replaceState(null, "", `#${PART}/${id}`);
  document.querySelectorAll("nav button").forEach(b => b.classList.toggle("active", b.dataset.tab === id));
  main.innerHTML = ""; VIEWS[id](); tex(main); window.scrollTo(0, 0);
}
function updateProgress() {
  const fc = store.get("fc", {}); const known = Object.values(fc).filter(b => b >= 3).length;
  const tr = store.get("train", { ok: 0, tot: 0 }); const ex = store.get("exdone", {});
  const qz = store.get("quiz", {});
  $("#progress").textContent = `Flashcards dominadas ${known}/${C.flash.length} · Exámenes ${Object.keys(ex).length}/${C.exams.length} · Entreno ${tr.ok}/${tr.tot} pasos · Quiz ${Object.values(qz).filter(Boolean).length}/${C.quiz.length}`;
}

// ------------------------------------------------------------------ static views
const VIEWS = {
  inicio() { main.innerHTML = C.home; },
  receta() { main.innerHTML = C.recipe; },
  dicc() { main.innerHTML = C.dict; },
  check() {
    main.innerHTML = `<h2>✅ Checklist para el examen</h2><p class="muted">Repásala justo antes de entrar y úsala para revisar cada respuesta (marca para practicar el hábito).</p>`;
    const done = store.get("check", {});
    for (const [sec, items] of C.checklist) {
      const card = h("div", { class: "card" }, `<h3 style="margin-top:0">${sec}</h3>`);
      items.forEach((it, i) => {
        const k = sec + i; const lab = h("label", { style: "display:block;margin:5px 0;cursor:pointer" });
        const cb = h("input", { type: "checkbox" }); cb.checked = !!done[k];
        cb.onchange = () => { done[k] = cb.checked; store.set("check", done); };
        lab.append(cb, h("span", {}, " " + it)); card.append(lab);
      });
      main.append(card);
    }
  },

  // ---------------------------------------------------------------- past exams: step reveal
  examenes() {
    main.innerHTML = `<h2>${C.ui.examTitle}</h2>
      <p class="muted">Método: lee el enunciado, <b>resuélvelo en papel</b> y luego revela un paso cada vez, comparándolo con lo tuyo. Los pasos marcados con ⚠ son donde se pierden puntos (o erratas de la solución oficial). Marca "Hecha" cuando la hayas resuelto sin mirar.</p>`;
    const filt = h("div", { class: "card tight" });
    const sel = h("select"); C.ui.filters.forEach(([v, l]) => sel.append(h("option", { value: v }, l)));
    filt.append(h("span", {}, "Filtro: "), sel); main.append(filt);
    const list = h("div"); main.append(list);
    const done = store.get("exdone", {});
    const render = () => {
      list.innerHTML = "";
      for (const ex of C.exams) {
        if (sel.value === "featured" ? !ex.featured : sel.value !== "all" && ex.type !== sel.value) continue;
        const d = h("details", { class: "card exq" });
        d.append(h("summary", {}, `${done[ex.id] ? "✅ " : ""}<span class="pill ${ex.type}">${C.ui.pill[ex.type] || ex.type.toUpperCase()}</span> ${ex.id} — ${ex.title} <span class="muted small">(${ex.pts})</span>`));
        const body = h("div");
        body.append(h("div", {}, ex.statement));
        if (ex.tags) body.append(h("p", { class: "small muted" }, "Patrón: " + ex.tags));
        const stepsBox = h("div"); body.append(stepsBox);
        let shown = 0;
        const nextBtn = h("button", { class: "btn" }, "Mostrar siguiente paso ▸");
        const allBtn = h("button", { class: "btn ghost" }, "Mostrar todo");
        const doneBtn = h("button", { class: "btn ok" }, done[ex.id] ? "Hecha ✓" : "Marcar como hecha");
        const show = n => {
          while (shown < Math.min(n, ex.steps.length)) {
            const [t, c] = ex.steps[shown++];
            stepsBox.append(tex(h("div", { class: "step" + (t.includes("⚠") ? " trapstep" : "") }, `<b>${t}</b><div>${c}</div>`)));
          }
          if (shown >= ex.steps.length) { nextBtn.disabled = allBtn.disabled = true; if (ex.traps) stepsBox.append(tex(h("div", { class: "trap" }, "<b>Trampas:</b> " + ex.traps))); }
        };
        nextBtn.onclick = () => show(shown + 1); allBtn.onclick = () => show(1e9);
        doneBtn.onclick = () => { done[ex.id] = 1; store.set("exdone", done); doneBtn.textContent = "Hecha ✓"; };
        body.append(nextBtn, allBtn, doneBtn);
        d.append(body); list.append(d);
        d.addEventListener("toggle", () => d.open && tex(body), { once: true });
      }
      tex(list);
    };
    sel.onchange = render; render();
  },

  // ---------------------------------------------------------------- generator
  entreno() {
    main.innerHTML = `<h2>🎯 Entrenador infinito</h2>
      <p class="muted">${C.ui.trainerIntro} Si fallas: <b>Pista</b> te da la regla de la receta, <b>Solución</b> el desarrollo completo. Objetivo: 2 problemas seguidos de cada tipo sin pistas.</p>`;
    const bar = h("div", { class: "card tight" });
    const sel = h("select"); for (const [k, g] of Object.entries(window.Gens)) if (!k.startsWith("_")) sel.append(h("option", { value: k }, g.name));
    sel.append(h("option", { value: "mix" }, "🎲 Mezcla aleatoria"));
    const newBtn = h("button", { class: "btn" }, "Nuevo problema");
    bar.append(h("span", {}, "Tipo: "), sel, " ", newBtn);
    const showModel = h("label", { class: "small", style: "margin-left:10px" }); const cbm = h("input", { type: "checkbox" }); showModel.append(cbm, " " + C.ui.modelLabel);
    bar.append(showModel); main.append(bar);
    const area = h("div"); main.append(area);
    const stats = store.get("train", { ok: 0, tot: 0 });
    const gen = () => {
      const keys = Object.keys(window.Gens).filter(k => !k.startsWith("_"));
      const key = sel.value === "mix" ? keys[Math.floor(Math.random() * keys.length)] : sel.value;
      const P = window.Gens[key].fn();
      area.innerHTML = "";
      area.append(h("div", { class: "card" }, `<h3 style="margin-top:0">${P.title}</h3><div>${P.statement}</div>`));
      const model = h("div", { class: "key", style: cbm.checked ? "" : "display:none" }, "<b>Modelo:</b> " + P.model);
      area.append(model); cbm.onchange = () => { model.style.display = cbm.checked ? "" : "none"; };
      const before = h("div", { class: "small muted" }, C.ui.before);
      area.append(before);
      P.steps.forEach((s, i) => {
        const st = h("div", { class: "step" });
        st.append(h("div", {}, `<b>Paso ${i + 1}.</b> ${s.q}`));
        const fs = h("div", { class: "fields" }); const inputs = [];
        for (const fd of s.fields) {
          const w = h("span", { class: "field" }, `$${fd.label}=$`); const inp = h("input", { inputmode: "decimal", autocomplete: "off" });
          inp.addEventListener("keydown", e => { if (e.key === "Enter") check(); });
          w.append(inp); fs.append(w); inputs.push([inp, fd]);
        }
        st.append(fs);
        const msg = h("div", { class: "small" });
        const check = () => {
          let ok = 0;
          for (const [inp, fd] of inputs) { const good = close(parseNum(inp.value), fd.truth); inp.classList.toggle("ok", good); inp.classList.toggle("bad", !good); ok += good; }
          stats.tot += inputs.length; stats.ok += ok; store.set("train", stats);
          msg.innerHTML = ok === inputs.length ? `<span style="color:var(--ok)">✔ Todo correcto</span>` : `<span style="color:var(--bad)">${inputs.length - ok} mal</span> — revisa los rojos (${C.ui.errHint})`;
          tex(msg);
        };
        const hintBox = h("div", { class: "hint", style: "display:none" }, s.hint);
        const solBox = h("div", { class: "sol", style: "display:none" }, s.sol + `<div class="small muted">Valores: ${s.fields.map(fd => `$${fd.label}=${fd.truth.tex()}$${fd.truth.d !== 1 ? ` (${fd.truth.dec(4)})` : ""}`).join(", ")}</div>`);
        st.append(h("button", { class: "btn", onclick: check }, "Comprobar"),
          h("button", { class: "btn ghost", onclick: () => { hintBox.style.display = ""; } }, "Pista"),
          h("button", { class: "btn ghost", onclick: () => { solBox.style.display = ""; } }, "Solución"),
          h("button", { class: "btn ghost", onclick: () => { inputs.forEach(([inp, fd]) => { inp.value = fd.truth.str(); }); check(); } }, "Rellenar"), msg, hintBox, solBox);
        area.append(st);
      });
      tex(area);
    };
    newBtn.onclick = gen; sel.onchange = gen; gen();
  },

  // ---------------------------------------------------------------- flashcards (Leitner)
  teoria() {
    main.innerHTML = `<h2>🃏 Flashcards (repetición espaciada)</h2>
      <p class="muted">Piensa la respuesta <b>en voz alta</b> antes de girar (clic o <kbd>espacio</kbd>). "Otra vez" la devuelve a la caja 1; "Lo sé" la sube. Dominada = caja 3. Salen primero las de caja baja.</p>`;
    const fc = store.get("fc", {});
    const cats = [...new Set(C.flash.map(c => c.cat))];
    const bar = h("div", { class: "card tight" }); const sel = h("select"); sel.append(h("option", { value: "all" }, "Todas las categorías")); cats.forEach(c => sel.append(h("option", { value: c }, c)));
    const reset = h("button", { class: "btn ghost" }, "Reiniciar progreso"); bar.append(sel, " ", reset); main.append(bar);
    const boxInfo = h("div", { class: "small muted" }); main.append(boxInfo);
    const cardEl = h("div", { class: "card flash" }); main.append(cardEl);
    const ctr = h("div"); main.append(ctr);
    let cur = null, flipped = false;
    const pool = () => C.flash.map((c, i) => ({ ...c, i })).filter(c => sel.value === "all" || c.cat === sel.value);
    const nextCard = () => {
      const p = pool(); const minBox = Math.min(...p.map(c => fc[c.i] || 0));
      const cand = p.filter(c => (fc[c.i] || 0) === minBox && c !== cur);
      cur = (cand.length ? cand : p)[Math.floor(Math.random() * (cand.length || p.length))];
      flipped = false; draw();
    };
    const draw = () => {
      const p = pool(); const b = [0, 1, 2, 3].map(k => p.filter(c => Math.min(3, fc[c.i] || 0) === k).length);
      boxInfo.innerHTML = `Nuevas ${b[0]} · Caja1 ${b[1]} · Caja2 ${b[2]} · Dominadas ${b[3]} <div class="bar"><div style="width:${(100 * b[3]) / p.length}%"></div></div>`;
      cardEl.innerHTML = `<div class="small muted">${cur.cat}</div><div>${cur.front}</div>` + (flipped ? `<div class="back">${cur.back}</div>` : `<div class="small muted" style="margin-top:12px">(clic para girar)</div>`);
      ctr.innerHTML = ""; if (flipped) ctr.append(h("button", { class: "btn bad", onclick: () => grade(false) }, "Otra vez"), h("button", { class: "btn ok", onclick: () => grade(true) }, "Lo sé"));
      tex(cardEl);
    };
    const grade = ok => { fc[cur.i] = ok ? Math.min(3, (fc[cur.i] || 0) + 1) : 1; store.set("fc", fc); nextCard(); };
    cardEl.onclick = () => { flipped = true; draw(); };
    const key = e => { if (current !== "teoria") return document.removeEventListener("keydown", key); if (e.code === "Space") { e.preventDefault(); flipped = true; draw(); } else if (flipped && e.key === "1") grade(false); else if (flipped && e.key === "2") grade(true); };
    document.addEventListener("keydown", key);
    sel.onchange = nextCard; reset.onclick = () => { for (const k in fc) delete fc[k]; store.set("fc", fc); nextCard(); };
    nextCard();
  },

  // ---------------------------------------------------------------- quiz
  quiz() {
    main.innerHTML = `<h2>❓ Quiz conceptual</h2><p class="muted">Preguntas tipo "explica en 2 frases" convertidas a test, con la frase que debes escribir en el examen.</p>`;
    const res = store.get("quiz", {});
    C.quiz.forEach((q, qi) => {
      const card = h("div", { class: "card" }, `<b>${qi + 1}.</b> ${q.q}`);
      const order = q.opts.map((_, i) => i).sort(() => Math.random() - 0.5);
      const why = h("div", { class: "good", style: "display:none" }, q.why);
      for (const oi of order) {
        const b = h("button", { class: "opt" }, q.opts[oi]);
        b.onclick = () => { card.querySelectorAll(".opt").forEach(x => (x.disabled = true)); b.classList.add(oi === q.a ? "ok" : "bad"); card.querySelectorAll(".opt")[order.indexOf(q.a)].classList.add("ok"); why.style.display = ""; res[qi] = oi === q.a; store.set("quiz", res); };
        card.append(b);
      }
      card.append(why); main.append(card);
    });
  },
};

header();
updateProgress();
go(parseHash().tab || "inicio");
window.addEventListener("hashchange", () => {
  const { part, tab } = parseHash();
  if (part && part !== PART) { localStorage.setItem("el2320:part", part); location.reload(); return; }
  if (tab !== current) go(tab);
});
}
