// Random exam-style Particle Filter generators. Each returns
// { title, statement (html with $tex$), model, steps:[{q, hint, fields:[{label, truth}], sol}] }
// truth is an exact fraction F (or Fl for answers with sqrt/log). Loaded only when Parte III is selected.
"use strict";
(() => {
const { F, f } = window.Eng;
F.maxTexDen = 1000;   // PF products (cubes of 2-decimal numbers) are unreadable as fractions: print decimals
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const U = () => f(ri(1, 99), 100);                         // uniform number with 2 decimals, as in the exams
const sum = arr => arr.reduce((a, b) => a.add(b), f(0));
const cums = w => { let c = f(0); return w.map(x => (c = c.add(x))); };
const dec = (x, p = 4) => x.dec(p);
const lst = arr => arr.map(x => dec(x, 6)).join(",\\ ");
// float answer with the same interface as F (used only where the truth is irrational)
class Fl {
  constructor(v) { this.v = v; this.d = 2; }
  val() { return this.v; }
  dec(p = 4) { return (+this.v.toFixed(p)).toString(); }
  str() { return (+this.v.toFixed(6)).toString(); }
  tex() { return this.dec(4); }
}
// index (1-based) of the first cumulative weight >= p ; null if p hits a boundary exactly (avoid ambiguous problems)
const pickIdx = (cum, p) => {
  if (cum.some(c => c.eq(p))) return null;
  return cum.findIndex(c => c.val() > p.val()) + 1;
};
const uList = us => `$\\{${us.map(u => u.dec(2)).join(",\\ ")}\\}$`;
const idxFields = (idx, name = "i") => idx.map((v, m) => ({ label: `${name}_{${m + 1}}`, truth: f(v) }));
const cumTable = (w, cum, vals) => `<table><tr><th>$i$</th>${vals ? "<th>partícula</th>" : ""}<th>$\\tilde w^{(i)}$</th><th>acumulada $c_i$</th><th>intervalo</th></tr>${
  w.map((x, i) => `<tr><td>${i + 1}</td>${vals ? `<td>$${vals[i]}$</td>` : ""}<td>$${dec(x)}$</td><td>$${dec(cum[i])}$</td><td>$(${i ? dec(cum[i - 1]) : 0},\\ ${dec(cum[i])}]$</td></tr>`).join("")}</table>`;

// ============ Type A: two-variable PF with uniform noises (Nov-2024 wind farm style) ============
function genPF_Uniform() {
  for (let tries = 0; tries < 500; tries++) {
    const N = 3;
    const a = pick([f(1, 10), f(2, 10), f(1, 2)]);      // measurement half-width
    const b = pick([f(1), f(1, 2), f(2)]);                // dynamics half-width
    const d = pick([f(5), f(10), f(20)]);                 // power noise half-width
    const k = pick([2, 3]);
    const z0 = f(ri(40, 120), 10);
    const us = Array.from({ length: 3 * N + 1 }, () => f(ri(1, 9), 10));   // one decimal, like the exam
    const w0 = us.slice(0, N).map(u => z0.sub(a).add(a.mul(2).mul(u)));
    const w1 = us.slice(N, 2 * N).map((u, i) => w0[i].sub(b).add(b.mul(2).mul(u)));
    const x1 = us.slice(2 * N, 3 * N).map((u, i) => w1[i].pow(k).sub(d).add(d.mul(2).mul(u)));
    const j = ri(0, N - 1);
    const z1 = w1[j].add(a.mul(f(ri(-8, 8), 10))).mul(100).val();
    const Z1 = f(Math.round(z1), 100);
    const dist = w1.map(w => Z1.sub(w));
    if (dist.some(x => Math.abs(x.val()) === a.val())) continue;
    const dens = f(1).div(a.mul(2));
    const lik = dist.map(x => (Math.abs(x.val()) < a.val() ? dens : f(0)));
    const nz = lik.filter(x => !x.isZero()).length;
    if (nz === 0 || (nz === N && Math.random() < 0.7)) continue;  // usually make at least one weight 0, like the exam
    const W = lik.map(x => x.div(sum(lik)));
    const E = sum(W.map((w, i) => w.mul(x1[i])));
    const r = us[3 * N];
    const cum = cums(W);
    const ptr = Array.from({ length: N }, (_, m) => r.add(m).div(N));
    const idx = ptr.map(p => pickIdx(cum, p));
    if (idx.includes(null)) continue;
    const kw = k === 2 ? "square" : "cube";
    const statement = `For your sampling steps use this list of numbers drawn from $U(0,1)$, <b>in the order that samples are asked for</b>: ${uList(us)}.<br>
      You monitor the output power $X_t$ of a wind farm and the wind speed $W_t$, and estimate $p(X_t,W_t)$ with a particle filter with <b>three particles</b>.
      The wind speed is measured, $Z_t$, with an unbiased instrument whose reading is <b>uniformly distributed around the true wind speed $\\pm${a.dec()}</b> m/s.
      Between measurements the wind speed is uniformly distributed around the previous wind speed $\\pm${b.dec()}$ m/s.
      The output power is the ${kw} of the wind speed, $W_t^${k}$, with uniformly distributed noise over a range $\\pm${d.dec()}$ (no inertia: independent of $X_{t-1}$).
      <br>(a) Write the measurement and dynamic models for $W_t$. (b) At $t=0$ you measure $Z_0=${z0.dec()}$; draw 3 samples $w_0^{(i)}$ assuming an uninformed prior.
      (c) $w_1^{(i)}=?$ (d) Draw $x_1^{(i)}$ for each particle. (e) Second measurement $Z_1=${Z1.dec(2)}$: normalized weights? (f) $E[X_1]$ after this measurement? (g) Systematic (low variance) resampling?`;
    return {
      title: "PF · ruido uniforme · 3 partículas (estilo Nov-2024)",
      statement,
      model: `$p(z_t\\mid w_t)=${dens.dec()}$ en $(w_t\\mp${a.dec()})$; $p(w_t\\mid w_{t-1})=${f(1).div(b.mul(2)).dec()}$ en $(w_{t-1}\\mp${b.dec()})$; $p(x_t\\mid w_t)=${f(1).div(d.mul(2)).dec()}$ en $(w_t^${k}\\mp${d.dec()})$. Números: $u_1..u_3$→(b), $u_4..u_6$→(c), $u_7..u_9$→(d), $u_{10}$→(g).`,
      steps: [
        { q: "(a) Altura de las densidades uniformes de los modelos (medida y dinámica).",
          hint: "Uniforme en un intervalo de anchura $2a$ ⇒ densidad $1/(2a)$ dentro, 0 fuera. Escribe también la CDF: $P(Z_t<z\\mid w)=\\frac{z-(w-a)}{2a}$.",
          fields: [{ label: "p(z_t\\mid w_t)", truth: dens }, { label: "p(w_t\\mid w_{t-1})", truth: f(1).div(b.mul(2)) }],
          sol: `$$p(z_t\\mid w_t)=\\begin{cases}\\frac{1}{2\\cdot${a.dec()}}=${dens.dec()} & z_t\\in(w_t-${a.dec()},\\,w_t+${a.dec()})\\\\0&\\text{else}\\end{cases}\\qquad P(Z_t<z\\mid w_t)=${dens.dec()}\\,(z-w_t+${a.dec()})$$
                $$p(w_t\\mid w_{t-1})=${f(1).div(b.mul(2)).dec()}\\ \\text{en } (w_{t-1}-${b.dec()},\\,w_{t-1}+${b.dec()}),\\qquad P(W_t<w\\mid w_{t-1})=${f(1).div(b.mul(2)).dec()}\\,(w-w_{t-1}+${b.dec()})$$` },
        { q: `(b) $w_0^{(i)}$ desde $Z_0=${z0.dec()}$ con prior no informativo (usa $u_1,u_2,u_3$).`,
          hint: "Prior plano ⇒ $p(w_0\\mid z_0)\\propto p(z_0\\mid w_0)$ = uniforme en $(z_0-a,\\,z_0+a)$. CDF inversa: $w=z_0-a+2a\\,u$.",
          fields: w0.map((v, i) => ({ label: `w_0^{(${i + 1})}`, truth: v })),
          sol: `$$w_0^{(i)}=${z0.dec()}-${a.dec()}+${a.mul(2).dec()}\\,u_i$$` + w0.map((v, i) => `$u_${i + 1}=${us[i].dec(2)}\\Rightarrow w_0^{(${i + 1})}=${dec(v)}$`).join("<br>") },
        { q: "(c) Propaga: $w_1^{(i)}$ (usa $u_4,u_5,u_6$).",
          hint: `Muestrea $p(w_1\\mid w_0^{(i)})$: $w_1=w_0^{(i)}-${b.dec()}+${b.mul(2).dec()}\\,u$. Cada partícula usa SU $w_0^{(i)}$.`,
          fields: w1.map((v, i) => ({ label: `w_1^{(${i + 1})}`, truth: v })),
          sol: w1.map((v, i) => `$u_${i + 4}=${us[i + 3].dec(2)}=${f(1).div(b.mul(2)).dec()}(w_1^{(${i + 1})}-${dec(w0[i].sub(b))})\\Rightarrow w_1^{(${i + 1})}=${dec(v)}$`).join("<br>") },
        { q: `(d) Potencia $x_1^{(i)}$ para cada partícula (usa $u_7,u_8,u_9$). Puedes dejarla como $(w)^${k}\\pm c$; aquí escribe el número.`,
          hint: `$x=(w_1^{(i)})^${k}-${d.dec()}+${d.mul(2).dec()}\\,u$. En el examen basta con "$(10.20)^3-6$".`,
          fields: x1.map((v, i) => ({ label: `x_1^{(${i + 1})}`, truth: v })),
          sol: x1.map((v, i) => { const off = d.mul(2).mul(us[i + 6]).sub(d); return `$u_${i + 7}=${us[i + 6].dec(2)}\\Rightarrow x_1^{(${i + 1})}=(${dec(w1[i])})^${k}${off.val() >= 0 ? "+" : ""}${off.dec()}=${dec(v, 6)}$`; }).join("<br>") },
        { q: `(e) $Z_1=${Z1.dec(2)}$: pesos normalizados $\\tilde w^{(i)}$.`,
          hint: `Peso = verosimilitud $p(z_1\\mid w_1^{(i)})$: vale ${dens.dec()} si $|z_1-w_1^{(i)}|<${a.dec()}$, si no 0. Después divide por la suma. (¡$x$ no entra porque $z$ sólo depende de $w$!)`,
          fields: W.map((v, i) => ({ label: `\\tilde w^{(${i + 1})}`, truth: v })),
          sol: `Ventana compatible: $w_1\\in(${dec(Z1.sub(a))},\\ ${dec(Z1.add(a))})$.<br>` + w1.map((v, i) => `$w_1^{(${i + 1})}=${dec(v)}$: $|z_1-w|=${dec(dist[i].val() < 0 ? dist[i].neg() : dist[i])}$ ⇒ $p=${lik[i].dec()}$`).join("<br>") + `<br>Suma $=${dec(sum(lik))}$ ⇒ $\\tilde w=(${W.map(x => x.tex()).join(",\\ ")})$` },
        { q: "(f) $E[X_1]$ después de la medida.",
          hint: "$E[X_1]\\approx\\sum_i \\tilde w^{(i)}x_1^{(i)}$ (con los pesos de (e), antes de remuestrear).",
          fields: [{ label: "E[X_1]", truth: E }],
          sol: `$$E[X_1]=${W.map((w, i) => `${w.tex()}\\cdot ${dec(x1[i], 6)}`).join(" + ")}=${dec(E, 4)}$$` },
        { q: `(g) Remuestreo sistemático con $r=u_{10}=${r.dec(2)}$: índice de la partícula elegida en cada posición.`,
          hint: "Punteros $p_m=\\frac{r+(m-1)}{M}$ ($m=1..M$). Elige la primera partícula cuya acumulada $c_i\\ge p_m$.",
          fields: idxFields(idx),
          sol: cumTable(W, cum) + ptr.map((p, m) => `$p_${m + 1}=\\frac{${r.dec(2)}+${m}}{3}=${dec(p)}$ ⇒ partícula ${idx[m]}`).join("<br>") +
            `<br>Conjunto: $\\{${idx.map(i => `(${dec(w1[i - 1])},\\,${dec(x1[i - 1], 3)})`).join(",\\ ")}\\}$, pesos $1/3$.` },
      ],
    };
  }
}

// ============ Type B: scalar X in [0,1], binary measurement, 5 particles (Nov-2025 style) ============
function genPF_Binary() {
  for (let tries = 0; tries < 500; tries++) {
    const N = 5;
    const us = Array.from({ length: 3 * N + 1 }, U);
    const x0 = us.slice(0, N);
    const y = pick([0, 1]);
    const likeOf = x => (y === 0 ? x : f(1).sub(x));              // P(Y=0|x)=x
    const L = x0.map(likeOf);
    const W = L.map(x => x.div(sum(L)));
    const cum = cums(W);
    const um = us.slice(N, 2 * N);
    const mIdx = um.map(u => pickIdx(cum, u));
    const r = us[2 * N];
    const ptr = Array.from({ length: N }, (_, m) => r.add(m).div(N));
    const sIdx = ptr.map(p => pickIdx(cum, p));
    if (mIdx.includes(null) || sIdx.includes(null)) continue;
    const xc = mIdx.map(i => x0[i - 1]);
    const up = us.slice(2 * N + 1, 3 * N + 1);
    const prop = (xp, u) => (u.val() < 0.5 ? u.mul(2).mul(xp) : xp.add(u.sub(f(1, 2)).mul(2).mul(f(1).sub(xp))));
    const x1 = xc.map((xp, i) => prop(xp, up[i]));
    const statement = `For your sampling steps use this list of numbers drawn from $U(0,1)$, in the order that samples are asked for: ${uList(us)}.<br>
      A discrete r.v. $Y_t\\in\\{0,1\\}$ given $X_t\\in[0,1]$: $P(Y_t=0\\mid X_t=x)=x$. The transition pdf is
      $$p(x_t\\mid x_{t-1})=\\begin{cases}\\dfrac{0.5}{x_{t-1}} & x_t\\in[0,x_{t-1}]\\\\[12pt] \\dfrac{0.5}{1-x_{t-1}} & x_t\\in(x_{t-1},1]\\end{cases}$$ and 0 outside.
      (a) At $t=0$ draw 5 samples $x_0^{(i)}$ assuming an uninformed prior. (b) You measure $Y_0=${y}$: normalized weights? (c) Multinomial ('vanilla') resampling of 5 particles?
      (d) Instead systematic (low variance) resampling (using new random numbers)? (e) The 5 particles at $t=1$ resulting from the particles of (c)?`;
    return {
      title: "PF · X∈[0,1] · medida binaria · 5 partículas (estilo Nov-2025)",
      statement,
      model: `Prior $U[0,1]$ ⇒ $x_0=u$. Peso $\\propto P(Y_0=${y}\\mid x)=${y === 0 ? "x" : "1-x"}$. Números: $u_1..u_5$→(a), $u_6..u_{10}$→(c), $u_{11}$→(d), $u_{12}..u_{16}$→(e). Transición: $u<0.5\\Rightarrow x_t=2u\\,x_{t-1}$; $u\\ge0.5\\Rightarrow x_t=x_{t-1}+(2u-1)(1-x_{t-1})$.`,
      steps: [
        { q: "(a) $x_0^{(i)}$ con prior no informativo (usa $u_1..u_5$).",
          hint: "Prior no informativo en $[0,1]$ = $U[0,1]$, CDF $F(x)=x$ ⇒ $x_0^{(i)}=u_i$.",
          fields: x0.map((v, i) => ({ label: `x_0^{(${i + 1})}`, truth: v })),
          sol: `$F(x)=x\\Rightarrow x_0^{(i)}=F^{-1}(u_i)=u_i$: $\\{${lst(x0)}\\}$` },
        { q: `(b) $Y_0=${y}$: pesos normalizados.`,
          hint: `$w^{(i)}\\propto P(Y_0=${y}\\mid x_0^{(i)})=${y === 0 ? "x_0^{(i)}" : "1-x_0^{(i)}"}$; normaliza dividiendo por la suma.`,
          fields: W.map((v, i) => ({ label: `\\tilde w^{(${i + 1})}`, truth: v })),
          sol: `No normalizados: $(${lst(L)})$, suma $=${dec(sum(L))}$.<br>Normalizados: $(${W.map(x => dec(x)).join(",\\ ")})$` },
        { q: "(c) Remuestreo multinomial con $u_6..u_{10}$: valor de cada partícula remuestreada.",
          hint: "Un número por partícula: la partícula $i$ se elige si $c_{i-1}<u\\le c_i$ (acumuladas de los pesos). ¡Cuidado con los $u$ que caen cerca de un límite!",
          fields: xc.map((v, m) => ({ label: `\\bar x^{(${m + 1})}`, truth: v })),
          sol: cumTable(W, cum, x0.map(x => dec(x))) + um.map((u, m) => `$u=${u.dec(2)}$ ⇒ partícula ${mIdx[m]} ($${dec(x0[mIdx[m] - 1])}$)`).join("<br>") },
        { q: `(d) Remuestreo sistemático con $r=u_{11}=${r.dec(2)}$: valor de cada partícula.`,
          hint: "UN solo número: punteros $p_m=(r+m-1)/5$, $m=1..5$, sobre las mismas acumuladas.",
          fields: sIdx.map((i, m) => ({ label: `\\bar x^{(${m + 1})}`, truth: x0[i - 1] })),
          sol: ptr.map((p, m) => `$p_${m + 1}=${dec(p)}$ ⇒ partícula ${sIdx[m]} ($${dec(x0[sIdx[m] - 1])}$)`).join("<br>") },
        { q: "(e) Propaga las partículas de (c) a $t=1$ con $u_{12}..u_{16}$.",
          hint: "CDF de la transición: $F(x)=\\frac{0.5x}{x_{t-1}}$ en $[0,x_{t-1}]$ y $F=0.5+\\frac{0.5(x-x_{t-1})}{1-x_{t-1}}$ después. Invierte: si $u<0.5$, $x=2u\\,x_{t-1}$; si $u\\ge0.5$, $x=x_{t-1}+(2u-1)(1-x_{t-1})$.",
          fields: x1.map((v, i) => ({ label: `x_1^{(${i + 1})}`, truth: v })),
          sol: x1.map((v, i) => up[i].val() < 0.5
            ? `$x_{t-1}=${dec(xc[i])},\\ u=${up[i].dec(2)}<0.5\\Rightarrow x_1=2(${up[i].dec(2)})(${dec(xc[i])})=${dec(v)}$`
            : `$x_{t-1}=${dec(xc[i])},\\ u=${up[i].dec(2)}\\ge0.5\\Rightarrow x_1=${dec(xc[i])}+(${up[i].mul(2).sub(1).dec(2)})(${dec(f(1).sub(xc[i]))})=${dec(v)}$`).join("<br>") },
      ],
    };
  }
}

// ============ Type C: resampling drill (weights given) ============
function genResample() {
  for (let tries = 0; tries < 500; tries++) {
    const N = ri(3, 6);
    const L = Array.from({ length: N }, () => f(ri(0, 9), pick([1, 10])));
    if (sum(L).isZero()) continue;
    const W = L.map(x => x.div(sum(L)));
    const cum = cums(W);
    const um = Array.from({ length: N }, U);
    const mIdx = um.map(u => pickIdx(cum, u));
    const r = U();
    const ptr = Array.from({ length: N }, (_, m) => r.add(m).div(N));
    const sIdx = ptr.map(p => pickIdx(cum, p));
    if (mIdx.includes(null) || sIdx.includes(null)) continue;
    const ess = f(1).div(sum(W.map(w => w.mul(w))));
    return {
      title: `Remuestreo · ${N} partículas · multinomial vs sistemático + ESS`,
      statement: `$${N}$ particles have unnormalized weights $(${L.map(x => x.dec()).join(",\\ ")})$.
        (a) Normalized weights? (b) Multinomial resampling using $\\{${um.map(u => u.dec(2)).join(",\\ ")}\\}$? (c) Systematic resampling with $r=${r.dec(2)}$? (d) Effective sample size $N_{\\text{eff}}$?`,
      model: "Acumuladas $c_i=\\sum_{j\\le i}\\tilde w^{(j)}$. Multinomial: $N$ números. Sistemático: punteros $(r+m-1)/N$. $N_{\\text{eff}}=1/\\sum\\tilde w_i^2$.",
      steps: [
        { q: "(a) Pesos normalizados.", hint: "Divide cada peso por la suma.",
          fields: W.map((v, i) => ({ label: `\\tilde w^{(${i + 1})}`, truth: v })),
          sol: `Suma $=${sum(L).dec()}$ ⇒ $(${W.map(x => x.tex()).join(",\\ ")})$` },
        { q: "(b) Multinomial: índice elegido por cada número.", hint: "Partícula $i$ si $c_{i-1}<u\\le c_i$. Peso 0 ⇒ nunca se elige.",
          fields: idxFields(mIdx), sol: cumTable(W, cum) + um.map((u, m) => `$u=${u.dec(2)}$ ⇒ ${mIdx[m]}`).join(", ") },
        { q: `(c) Sistemático con $r=${r.dec(2)}$: índice en cada posición.`, hint: `Punteros $p_m=(r+m-1)/${N}$, separados exactamente $1/${N}$.`,
          fields: idxFields(sIdx), sol: ptr.map((p, m) => `$p_${m + 1}=${dec(p)}$ ⇒ ${sIdx[m]}`).join("<br>") },
        { q: "(d) Tamaño efectivo de muestra.", hint: "$N_{\\text{eff}}=1/\\sum_i(\\tilde w^{(i)})^2$; vale $N$ con pesos iguales y 1 si una partícula tiene todo el peso.",
          fields: [{ label: "N_{\\text{eff}}", truth: ess }], sol: `$$N_{\\text{eff}}=\\frac{1}{${W.map(w => `(${w.tex()})^2`).join("+")}}=${ess.tex()}\\approx${ess.dec(3)}$$` },
      ],
    };
  }
}

// ============ Type D: inverse-CDF sampling drill ============
function genInvCDF() {
  const kinds = [
    () => { const lo = f(ri(-5, 5)), w = f(ri(1, 8), pick([1, 2, 10])); const u = U();
      return { pdf: `p(x)=${f(1).div(w).dec()}\\ \\text{for } x\\in[${lo.dec()},${lo.add(w).dec()}]`, cdf: `F(x)=\\frac{x-(${lo.dec()})}{${w.dec()}}`, inv: `x=${lo.dec()}+${w.dec()}\\,u`, u, x: lo.add(w.mul(u)) }; },
    () => { const m = f(ri(10, 200), 10), a = pick([f(1, 10), f(1, 2), f(1), f(2)]); const u = U();
      return { pdf: `\\text{uniform around } ${m.dec()}\\pm${a.dec()}`, cdf: `F(x)=\\frac{x-${m.sub(a).dec()}}{${a.mul(2).dec()}}`, inv: `x=${m.sub(a).dec()}+${a.mul(2).dec()}\\,u`, u, x: m.sub(a).add(a.mul(2).mul(u)) }; },
    () => { const c = f(ri(1, 9), 10), q = pick([f(1, 2), f(1, 4), f(3, 4)]); const u = U();
      const x = u.val() < q.val() ? u.mul(c).div(q) : c.add(u.sub(q).mul(f(1).sub(c)).div(f(1).sub(q)));
      return { pdf: `p(x)=\\begin{cases}${q.dec()}/${c.dec()} & x\\in[0,${c.dec()}]\\\\ ${f(1).sub(q).dec()}/${f(1).sub(c).dec()} & x\\in(${c.dec()},1]\\end{cases}`,
        cdf: `F(x)=\\frac{${q.dec()}\\,x}{${c.dec()}}\\ (x\\le${c.dec()}),\\quad F(x)=${q.dec()}+\\frac{${f(1).sub(q).dec()}(x-${c.dec()})}{${f(1).sub(c).dec()}}\\ (x>${c.dec()})`,
        inv: `u${u.val() < q.val() ? "<" : "\\ge"}${q.dec()}\\Rightarrow x=${u.val() < q.val() ? `\\frac{u\\cdot${c.dec()}}{${q.dec()}}` : `${c.dec()}+\\frac{(u-${q.dec()})(${f(1).sub(c).dec()})}{${f(1).sub(q).dec()}}`}`, u, x }; },
    () => { const u = U(); return { pdf: "p(x)=2x\\ \\text{for } x\\in[0,1]", cdf: "F(x)=x^2", inv: "x=\\sqrt{u}", u, x: new Fl(Math.sqrt(u.val())) }; },
    () => { const u = U(); return { pdf: "p(x)=2(1-x)\\ \\text{for } x\\in[0,1]", cdf: "F(x)=2x-x^2", inv: "x=1-\\sqrt{1-u}", u, x: new Fl(1 - Math.sqrt(1 - u.val())) }; },
    () => { const l = pick([1, 2, 3]), u = U(); return { pdf: `p(x)=${l}e^{-${l}x}\\ (x\\ge0)`, cdf: `F(x)=1-e^{-${l}x}`, inv: `x=-\\ln(1-u)/${l}`, u, x: new Fl(-Math.log(1 - u.val()) / l) }; },
    () => { const n = ri(3, 5); const P0 = Array.from({ length: n }, () => f(ri(1, 6))); const P = P0.map(x => x.div(sum(P0)));
      const cum = cums(P); let u, i; do { u = U(); i = pickIdx(cum, u); } while (i === null);
      return { pdf: `P(X=k)=(${P.map(x => x.tex()).join(",\\ ")})\\ \\text{for } k=1..${n}`, cdf: `F=(${cum.map(c => c.tex()).join(",\\ ")})`, inv: "k=\\min\\{k: F(k)\\ge u\\}", u, x: f(i) }; },
    () => { const u = f(ri(1, 9), 10); return { pdf: "p(x)=1/x^2\\ \\text{for } x\\in[1,\\infty)", cdf: "F(x)=1-1/x", inv: "x=1/(1-u)", u, x: f(1).div(f(1).sub(u)) }; },
    () => { const a = ri(0, 5), hw = pick([1, 2]), u = U(); const x = u.val() <= 0.5 ? a + hw * Math.sqrt(2 * u.val()) : a + 2 * hw - hw * Math.sqrt(2 * (1 - u.val()));
      return { pdf: `\\text{triangular: } p(x)=k(x-${a})\\ \\text{on } [${a},${a + hw}],\\ k(${a + 2 * hw}-x)\\ \\text{on } [${a + hw},${a + 2 * hw}]`,
        cdf: `k=${f(1, hw * hw).tex()},\\ F(${a + hw})=0.5,\\ F(x)=\\tfrac{(x-${a})^2}{${2 * hw * hw}}\\ \\text{(izq.)},\\ 1-\\tfrac{(${a + 2 * hw}-x)^2}{${2 * hw * hw}}\\ \\text{(der.)}`,
        inv: u.val() <= 0.5 ? `u\\le0.5\\Rightarrow x=${a}+\\sqrt{${2 * hw * hw}u}` : `u>0.5\\Rightarrow x=${a + 2 * hw}-\\sqrt{${2 * hw * hw}(1-u)}`, u, x: new Fl(x) }; },
  ];
  const items = [0, 1, 2].map(() => pick(kinds)());
  return {
    title: "Muestreo por CDF inversa (3 distribuciones)",
    statement: "Draw one sample from each distribution using the given uniform number $u$:<ol>" + items.map(it => `<li>$${it.pdf}$, with $u=${it.u.dec(2)}$</li>`).join("") + "</ol>",
    model: "Receta: $F(x)=\\int_{-\\infty}^x p$, resuelve $F(x)=u$.",
    steps: items.map((it, k) => ({
      q: `(${k + 1}) $${it.pdf}$, $u=${it.u.dec(2)}$.`,
      hint: "Integra la pdf para tener la CDF $F$, iguala $F(x)=u$ y despeja $x$. Las piezas de una pdf definida a trozos se acumulan.",
      fields: [{ label: `x_${k + 1}`, truth: it.x }],
      sol: `$$${it.cdf}\\quad\\Rightarrow\\quad ${it.inv}=${it.x.tex()}$$`,
    })),
  };
}

// ============ Type E: 5 particles, prior by inverse CDF, prediction, E/Var, likelihood, both resamplings (re-exam / 2023-24 style) ============
function genPF_Five() {
  const U1 = () => f(ri(1, 9), 10);   // one-decimal uniforms like 2023-2025
  for (let tries = 0; tries < 2000; tries++) {
    const M = 5;
    const pk = pick(["pareto", "unif", "given", "known"]);
    const dk = pick(["pm1", "unifnoise"]);
    const mk = pick(["unif", "unif", "mix"]);
    const us = Array.from({ length: 4 * M + 1 }, U1);
    let k = 0; const take = () => us[k++];
    let x0, priorTxt, priorSol, priorHint;
    if (pk === "pareto") {
      x0 = Array.from({ length: M }, () => f(1).div(f(1).sub(take())));
      priorTxt = "The initial pdf is $p(x)=1/x^2$ for $x\\in[1,\\infty)$ and 0 elsewhere. (a) Draw the initial particle set.";
      priorHint = "$\\int_1^\\infty x^{-2}dx=1$ (ya normalizada). $F(x)=1-1/x$ ⇒ $x=1/(1-u)$.";
      priorSol = `$F(x)=\\int_1^x s^{-2}ds=1-\\frac1x=u\\Rightarrow x=\\frac{1}{1-u}$: ` + x0.map((x, i) => `$u=${us[i].dec(1)}\\to ${x.tex()}$`).join(", ");
    } else if (pk === "unif") {
      const lo = f(ri(0, 10)), w = f(pick([2, 4, 10]));
      x0 = Array.from({ length: M }, () => lo.add(w.mul(take())));
      priorTxt = `The initial state is uniformly distributed on $[${lo.dec()},${lo.add(w).dec()}]$. (a) Draw the initial particle set.`;
      priorHint = `Uniforme ⇒ $x=${lo.dec()}+${w.dec()}\\,u$.`;
      priorSol = `$x=${lo.dec()}+${w.dec()}u$: $\\{${lst(x0)}\\}$`;
    } else if (pk === "given") {
      x0 = Array.from({ length: M }, () => f(ri(90, 110), 10));
      priorTxt = `The initial particle set is given: $\\{${lst(x0)}\\}$. (a) Write it down (no sampling).`;
      priorHint = "Conjunto dado ⇒ no consume números.";
      priorSol = "No se muestrea: se copian.";
    } else {
      const c = f(ri(0, 5));
      x0 = Array.from({ length: M }, () => c);
      priorTxt = `The initial state is known exactly: $x_0=${c.dec()}$. (a) Initial particle set?`;
      priorHint = "Estado conocido ⇒ todas las partículas iguales, sin consumir números.";
      priorSol = `$\\{${lst(x0)}\\}$ (no se gastan números)`;
    }
    const k0 = k;
    let x1, dynTxt, dynHint, dynSol;
    if (dk === "pm1") {
      const s = f(pick([1, 1, 2]));
      const ud = x0.map(() => take());
      x1 = x0.map((x, i) => (ud[i].val() < 0.5 ? x.sub(s) : x.add(s)));
      dynTxt = `Each second $x_t=x_{t-1}+\\Delta x$ with $\\Delta x\\in\\{-${s.dec()},+${s.dec()}\\}$ with equal probability.`;
      dynHint = `CDF discreta: $P(\\Delta=-${s.dec()})=0.5$ ⇒ $u<0.5\\Rightarrow -${s.dec()}$, si no $+${s.dec()}$.`;
      dynSol = x1.map((x, i) => `$u=${ud[i].dec(1)}\\Rightarrow ${dec(x0[i])}${ud[i].val() < 0.5 ? "-" : "+"}${s.dec()}=${dec(x)}$`).join("<br>");
    } else {
      const drift = f(pick([0, 0, 1, 10, 100])), h = f(pick([1, 2, 5, 16]));
      const ud = x0.map(() => take());
      x1 = x0.map((x, i) => x.add(drift).sub(h).add(h.mul(2).mul(ud[i])));
      dynTxt = `Between steps $x_t=x_{t-1}${drift.isZero() ? "" : `+${drift.dec()}`}+\\varepsilon$, $\\varepsilon\\sim U(-${h.dec()},${h.dec()})$.`;
      dynHint = `$x_t=x_{t-1}${drift.isZero() ? "" : `+${drift.dec()}`}-${h.dec()}+${h.mul(2).dec()}\\,u$.`;
      dynSol = x1.map((x, i) => `$u=${ud[i].dec(1)}\\Rightarrow ${dec(x)}$`).join("<br>");
    }
    const mean = sum(x1).div(M);
    const vr = sum(x1.map(x => x.sub(mean).pow(2))).div(M);
    let lik, measTxt, measHint, measSol;
    const j = ri(0, M - 1);
    const y = x1[j].add(f(pick([-1, 0, 1]), 2));
    const absr = x1.map(x => Math.abs(y.sub(x).val()));
    if (mk === "unif") {
      const b = f(pick([1, 2, 3]));
      if (absr.some(r => r === b.val())) continue;
      lik = absr.map(r => (r < b.val() ? f(1).div(b.mul(2)) : f(0)));
      measTxt = `A measurement $y=${y.dec()}$ is taken, $y=x+v$, $v\\sim U[-${b.dec()},${b.dec()}]$.`;
      measHint = `$p(y\\mid x)=\\frac1{${b.mul(2).dec()}}$ si $|y-x|<${b.dec()}$, si no 0.`;
    } else {
      const a = f(1), a2 = f(pick([3, 4]));
      if (absr.some(r => r === a.val() || r === a2.val())) continue;
      const hin = f(9, 10).div(a.mul(2)), hout = f(1, 10).div(a2.sub(a).mul(2));
      lik = absr.map(r => (r < a.val() ? hin : r < a2.val() ? hout : f(0)));
      measTxt = `A measurement $y=${y.dec()}$ is taken, $y=x+v$. With probability 0.9 $v\\sim U(-${a.dec()},${a.dec()})$; with probability 0.1 it is spurious, uniform on $${a.dec()}<|v|<${a2.dec()}$.`;
      measHint = `Mezcla: altura = probabilidad / anchura. Inlier $0.9/${a.mul(2).dec()}=${hin.tex()}$; outlier $0.1/${a2.sub(a).mul(2).dec()}=${hout.tex()}$ (¡dos intervalos!); fuera 0.`;
    }
    measSol = x1.map((x, i) => `$|y-x^{(${i + 1})}|=${+absr[i].toFixed(6)}\\Rightarrow ${lik[i].tex()}$`).join("<br>");
    if (sum(lik).isZero()) continue;
    const W = lik.map(l => l.div(sum(lik)));
    const Epost = sum(W.map((w, i) => w.mul(x1[i])));
    const cum = cums(W);
    const um = x1.map(() => take());
    const mIdx = um.map(u => pickIdx(cum, u));
    const r = take();
    const ptr = Array.from({ length: M }, (_, m) => r.add(m).div(M));
    const sIdx = ptr.map(p => pickIdx(cum, p));
    if (mIdx.includes(null) || sIdx.includes(null)) continue;
    const statement = `Use these numbers from $U(0,1)$, in the order samples are asked for: ${uList(us.slice(0, k))}. Use $M=5$ particles.<br>
      ${priorTxt} ${dynTxt} (b) Particle set after one step? (c) Mean and variance (use $1/M$) of that set? ${measTxt}
      (d) Normalised weights? (e) $E[x]$ after the measurement? (f) Multinomial resampling? (g) Systematic resampling (do not re-use numbers)?`;
    return {
      title: "PF · 5 partículas · prior → predicción → pesos → 2 remuestreos (estilo re-exam/2023-24)",
      statement,
      model: `Números: ${k0 ? "$u_1..u_5$→(a), " : "(a) no gasta, "}siguientes 5→(b), siguientes 5→(f), el siguiente→(g).`,
      steps: [
        { q: "(a) Conjunto inicial.", hint: priorHint, fields: x0.map((v, i) => ({ label: `x_0^{(${i + 1})}`, truth: v })), sol: priorSol },
        { q: "(b) Predicción: conjunto tras un paso.", hint: dynHint, fields: x1.map((v, i) => ({ label: `x_1^{(${i + 1})}`, truth: v })), sol: dynSol },
        { q: "(c) Media y varianza del conjunto predicho (pesos iguales).", hint: "Antes de la medida todos pesan $1/M$: $\\bar x=\\frac1M\\sum x_i$, $\\mathrm{Var}=\\frac1M\\sum(x_i-\\bar x)^2$.",
          fields: [{ label: "\\bar x", truth: mean }, { label: "\\mathrm{Var}", truth: vr }],
          sol: `$\\bar x=${mean.tex()}=${dec(mean)}$, $\\mathrm{Var}=${dec(vr)}$` },
        { q: "(d) Pesos normalizados.", hint: measHint + " Luego divide por la suma.", fields: W.map((v, i) => ({ label: `\\tilde w^{(${i + 1})}`, truth: v })),
          sol: measSol + `<br>Suma $=${sum(lik).tex()}$ ⇒ $(${W.map(x => x.tex()).join(",\\ ")})$` },
        { q: "(e) $E[x]$ tras la medida.", hint: "Ahora con pesos: $\\sum_i\\tilde w^{(i)}x^{(i)}$.", fields: [{ label: "E[x]", truth: Epost }],
          sol: `$E[x]=${W.map((w, i) => `${w.tex()}\\cdot${dec(x1[i])}`).join("+")}=${Epost.tex()}\\approx${dec(Epost)}$` },
        { q: `(f) Multinomial con $\\{${um.map(u => u.dec(1)).join(",")}\\}$: valor de cada partícula.`, hint: "Partícula $i$ si $c_{i-1}<u\\le c_i$. Las de peso 0 tienen intervalo vacío.",
          fields: mIdx.map((i, m) => ({ label: `\\bar x^{(${m + 1})}`, truth: x1[i - 1] })),
          sol: cumTable(W, cum, x1.map(x => dec(x))) + um.map((u, m) => `$${u.dec(1)}\\to${mIdx[m]}$`).join(", ") },
        { q: `(g) Sistemático con $r=${r.dec(1)}$ (siguiente número, sin reutilizar).`, hint: "Punteros $(r+m-1)/5$: $r/5,\\ r/5+0.2,\\dots$",
          fields: sIdx.map((i, m) => ({ label: `\\bar x^{(${m + 1})}`, truth: x1[i - 1] })),
          sol: ptr.map((p, m) => `$${dec(p)}\\to${sIdx[m]}$`).join(", ") + `<br>Resultado $\\{${sIdx.map(i => dec(x1[i - 1])).join(",\\ ")}\\}$` },
      ],
    };
  }
}

// ============ Type F: discrete-state PF (laptop in 3 rooms, Jan-2020 style) ============
function genPF_Rooms() {
  for (let tries = 0; tries < 2000; tries++) {
    const c = pick([4, 6, 8]);
    const T = [1, 2, 3].map(i => { const row = [1, 2, 3].map(j => (i === j ? null : f(1, c * Math.abs(i - j)))); const st = f(1).sub(sum(row.filter(Boolean))); return row.map(x => x || st); });
    const PD = pick([f(9, 10), f(8, 10)]), PFA = pick([f(5, 100), f(1, 10)]);
    const room = ri(1, 3), det = Math.random() < 0.4;
    const us = Array.from({ length: 7 }, () => f(ri(1, 9), 10));
    const x1 = [1, 2, 3].map((xi, i) => pickIdx(cums(T[xi - 1]), us[i]));
    if (x1.includes(null)) continue;
    const lik = x1.map(x => (x === room ? (det ? PD : f(1).sub(PD)) : (det ? PFA : f(1).sub(PFA))));
    const W = lik.map(l => l.div(sum(lik))); const cum = cums(W);
    const um = us.slice(3, 6); const mIdx = um.map(u => pickIdx(cum, u));
    const r = us[6]; const ptr = [0, 1, 2].map(m => r.add(m).div(3)); const sIdx = ptr.map(p => pickIdx(cum, p));
    if (mIdx.includes(null) || sIdx.includes(null)) continue;
    const Tt = `\\begin{pmatrix}${T.map(rw => rw.map(x => x.tex()).join("&")).join("\\\\")}\\end{pmatrix}`;
    return {
      title: "PF discreto · portátil en 3 habitaciones (estilo Ene-2020)",
      statement: `Use these numbers from $U(0,1)$ in order: ${uList(us)}. $X_t\\in\\{1,2,3\\}$ is the room where a laptop is. A robot detects the laptop with probability ${PD.dec()} if it is in the robot's room, and falsely detects it with probability ${PFA.dec()} if it is not.
        Someone moves the laptop: $p(x_t\\mid x_{t-1})=\\frac{1}{${c}|x_t-x_{t-1}|}$ for $x_t\\neq x_{t-1}$; otherwise it stays. Three particles, $x_0^{(i)}=i$.
        (a) Particle set at $t=1$ (sample rooms in the order 1,2,3)? (b) The robot is in room ${room} and <b>${det ? "detects" : "does not detect"}</b> the laptop: normalized weights? (c) Multinomial resampling? (d) Systematic resampling (next number)?`,
      model: `$T=${Tt}$ (fila = habitación anterior). Números: $u_1..u_3$→(a), $u_4..u_6$→(c), $u_7$→(d).`,
      steps: [
        { q: "(a) Probabilidad de quedarse en cada habitación.", hint: "Las filas suman 1: quedarse = 1 − suma de las de moverse.", fields: [0, 1, 2].map(i => ({ label: `P(${i + 1}\\to${i + 1})`, truth: T[i][i] })),
          sol: `$$T=${Tt}$$` },
        { q: "(a') Habitación de cada partícula en $t=1$ ($u_1,u_2,u_3$).", hint: "Cada partícula usa la FILA de su habitación anterior; acumula en el orden 1,2,3 y elige el primer $c_j\\ge u$.",
          fields: x1.map((v, i) => ({ label: `x_1^{(${i + 1})}`, truth: f(v) })),
          sol: x1.map((v, i) => `partícula ${i + 1} (hab. ${i + 1}): acumuladas $(${cums(T[i]).map(c2 => c2.tex()).join(",")})$, $u=${us[i].dec(1)}\\Rightarrow ${v}$`).join("<br>") },
        { q: "(b) Pesos normalizados.", hint: `${det ? "Detecta" : "No detecta"}: si $x=${room}$ ⇒ ${det ? "$P_D$" : "$1-P_D$"}; si no ⇒ ${det ? "$P_{FA}$" : "$1-P_{FA}$"}.`,
          fields: W.map((v, i) => ({ label: `\\tilde w^{(${i + 1})}`, truth: v })),
          sol: `Verosimilitudes $(${lik.map(l => l.dec()).join(",\\ ")})$, suma $${sum(lik).dec()}$ ⇒ $(${W.map(w => w.tex()).join(",\\ ")})$` },
        { q: `(c) Multinomial con $\\{${um.map(u => u.dec(1)).join(",")}\\}$: habitación de cada partícula.`, hint: "Primer $i$ con $u\\le c_i$.",
          fields: mIdx.map((i, m) => ({ label: `\\bar x^{(${m + 1})}`, truth: f(x1[i - 1]) })), sol: cumTable(W, cum, x1) + um.map((u, m) => `$${u.dec(1)}\\to$ partícula ${mIdx[m]}`).join(", ") },
        { q: `(d) Sistemático con $r=${r.dec(1)}$.`, hint: "Punteros $(r+m-1)/3$.",
          fields: sIdx.map((i, m) => ({ label: `\\bar x^{(${m + 1})}`, truth: f(x1[i - 1]) })), sol: ptr.map((p, m) => `$${dec(p)}\\to$ partícula ${sIdx[m]}`).join(", ") },
      ],
    };
  }
}

window.Gens = {
  pf_uniform: { name: "PF ruido uniforme (estilo Nov-2024, 11p)", fn: genPF_Uniform },
  pf_binary: { name: "PF X∈[0,1] binario (estilo Nov-2025, 11p)", fn: genPF_Binary },
  pf_five: { name: "PF 5 partículas, prior por CDF (re-exams / 2023-24)", fn: genPF_Five },
  pf_rooms: { name: "PF discreto, habitaciones (2020)", fn: genPF_Rooms },
  resample: { name: "Remuestreo multinomial/sistemático + ESS", fn: genResample },
  invcdf: { name: "Muestreo por CDF inversa", fn: genInvCDF },
  _util: { ri, pick, Fl },
};
})();
