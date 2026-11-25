// Random exam-style problem generators. Each returns
// { title, statement (html with $tex$), steps:[{q, hint, fields:[{label, truth:F}], sol}] }
"use strict";
(() => {
const { F, f, M, kfPredict, kfUpdate } = window.Eng;
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const T = M.tex, TF = M.texFactored;
const vecFields = (v, names) => names.map((n, i) => ({ label: n, truth: v[i][0] }));
const covFields = (S, a, b) => [
  { label: `\\Sigma_{${a}${a}}`, truth: S[0][0] },
  { label: `\\Sigma_{${a}${b}}`, truth: S[0][1] },
  { label: `\\Sigma_{${b}${b}}`, truth: S[1][1] },
];
const noiseWord = (v) => { // randomly phrase as std or variance -> trains the std/variance trap
  const sq = v.isSquare();
  if (sq && Math.random() < 0.5) return { word: `standard deviation ${sq.dec()}`, note: `std ${sq.dec()} ⇒ varianza ${v.str()}` };
  return { word: `variance ${v.dec()}`, note: `varianza ${v.str()}` };
};
const lin = (c, name) => { // pretty coefficient*name
  if (c.isZero()) return "";
  if (c.eq(1)) return name; if (c.eq(-1)) return `-${name}`;
  return `${c.tex()}${name}`;
};
const linComb = (terms) => {
  let s = ""; for (const [c, n] of terms) { const t = lin(F.of(c), n); if (!t) continue; s += s && !t.startsWith("-") ? ` + ${t}` : (s ? ` ${t.replace(/^-/, "- ")}` : t); }
  return s || "0";
};

// =============== KF, type "two-state constant velocity" (Nov 2025 Q1 style) ===============
function genKF_CV() {
  const dt = pick([1, 1, 1, 2]);
  const A = M.of([[1, dt], [0, 1]]);
  const exact = Math.random() < 0.6;
  const mu0 = M.col([ri(-2, 3), ri(-1, 2)]);
  const Sig0 = exact ? M.zeros(2, 2) : M.diag([ri(1, 3), ri(1, 2)]);
  const R = M.diag([pick([1, 2, 4]), pick([1, 2])]);
  const C = M.of([[pick([1, 2]), pick([0, 1, 1, -1])]]);
  const Q = M.of([[pick([1, 4, 9, 16])]]);
  const P1 = kfPredict(mu0, Sig0, A, R);
  const z1 = M.col([Math.round(M.mul(C, P1.muBar)[0][0].val()) + ri(-2, 2)]);
  const U1 = kfUpdate(P1.muBar, P1.SigBar, C, Q, z1);
  const P2 = kfPredict(U1.mu, U1.Sig, A, R);
  const qn = noiseWord(Q[0][0]);
  const statement = `The continuous random variables $X_t$ and $V_t$ ${exact ? `start <b>exactly</b> with $X_0=${mu0[0][0].str()}$ and $V_0=${mu0[1][0].str()}$` : `start with mean $(${mu0[0][0].str()}, ${mu0[1][0].str()})^T$ and covariance $\\mathrm{diag}(${Sig0[0][0].str()}, ${Sig0[1][1].str()})$`}. They change between $t-1$ and $t$ according to
  $$E[X_t]=x_{t-1}${dt === 1 ? "+v_{t-1}" : `+${dt}v_{t-1}`},\\qquad E[V_t]=v_{t-1}$$
  with process noise variances $\\sigma^2_{xx}=${R[0][0].str()},\\ \\sigma^2_{vv}=${R[1][1].str()},\\ \\sigma^2_{xv}=0$.
  At each timestep $Z_t$ is measured: $p(z_t\\mid x_t,v_t)$ is Gaussian with mean $${linComb([[C[0][0], "x_t"], [C[0][1], "v_t"]])}$ and ${qn.word}.
  <br>(a) Belief at $t=1$? (b) $Z_1=${z1[0][0].str()}$: belief after the measurement? (c) Belief at $t=2$?`;
  return {
    title: "KF · estado (x, v) · predict → update → predict",
    statement,
    model: `$$A=${T(A)},\\ R=${T(R)},\\ C=${T(C)},\\ Q=${Q[0][0].tex()},\\ \\mu_0=${T(mu0)},\\ \\Sigma_0=${T(Sig0)}$$`,
    steps: [
      { q: "(a) Belief at $t=1$ = <b>predicción</b> (todavía no hay medida en $t=1$): $\\bar\\mu_1$ y $\\bar\\Sigma_1$.",
        hint: `Escribe $A$ leyendo los coeficientes de $E[X_t], E[V_t]$. $\\bar\\mu_1=A\\mu_0$, $\\bar\\Sigma_1=A\\Sigma_0A^T+R$. ${exact ? "Estado inicial <b>exacto</b> ⇒ $\\Sigma_0=0$ ⇒ $\\bar\\Sigma_1=R$." : ""}`,
        fields: [...vecFields(P1.muBar, ["\\bar\\mu_x", "\\bar\\mu_v"]), ...covFields(P1.SigBar, "x", "v")],
        sol: `$$\\bar\\mu_1=${T(A)}${T(mu0)}=${T(P1.muBar)}$$ $$\\bar\\Sigma_1=A\\Sigma_0A^T+R=${T(P1.GSGt)}+${T(R)}=${T(P1.SigBar)}$$` },
      { q: `(b) Update con $z_1=${z1[0][0].str()}$: $\\hat z$, innovación $\\eta$, $S$, $K$, $\\mu_1$, $\\Sigma_1$.`,
        hint: `$C=${T(C)}$ (coeficientes de la media de $Z$), $Q=${Q[0][0].str()}$ (${qn.note}). $S=C\\bar\\Sigma C^T+Q$ (escalar), $K=\\bar\\Sigma C^T/S$, $\\mu=\\bar\\mu+K\\eta$, $\\Sigma=\\bar\\Sigma-KC\\bar\\Sigma$.`,
        fields: [{ label: "\\hat z", truth: U1.zhat[0][0] }, { label: "\\eta", truth: U1.eta[0][0] }, { label: "S", truth: U1.S[0][0] },
          ...vecFields(U1.K, ["K_x", "K_v"]), ...vecFields(U1.mu, ["\\mu_x", "\\mu_v"]), ...covFields(U1.Sig, "x", "v")],
        sol: `$$\\hat z=C\\bar\\mu_1=${U1.zhat[0][0].tex()},\\quad \\eta=z_1-\\hat z=${U1.eta[0][0].tex()}$$
          $$\\bar\\Sigma C^T=${T(U1.SHt)},\\quad S=C\\bar\\Sigma C^T+Q=${U1.S[0][0].tex()}$$
          $$K=\\frac{\\bar\\Sigma C^T}{S}=${TF(U1.K)}$$
          $$\\mu_1=\\bar\\mu_1+K\\eta=${T(U1.mu)}=${TF(U1.mu)}$$
          $$\\Sigma_1=\\bar\\Sigma_1-KC\\bar\\Sigma_1=${TF(U1.Sig)}$$` },
      { q: "(c) Belief at $t=2$ (predicción desde el posterior de $t=1$): $\\bar\\mu_2$, $\\bar\\Sigma_2$.",
        hint: "Mismo predict que en (a) pero partiendo de $\\mu_1,\\Sigma_1$ (¡ahora $\\Sigma_1\\neq0$ y con covarianza cruzada!).",
        fields: [...vecFields(P2.muBar, ["\\bar\\mu_x", "\\bar\\mu_v"]), ...covFields(P2.SigBar, "x", "v")],
        sol: `$$\\bar\\mu_2=A\\mu_1=${TF(P2.muBar)}$$ $$\\bar\\Sigma_2=A\\Sigma_1A^T+R=${TF(P2.GSGt)}+${T(R)}=${TF(P2.SigBar)}$$` },
    ],
  };
}

// =============== KF, type "init from measurement + steady state + rho" (Nov 2024 Q1 style) ===============
function genKF_Init() {
  // state (w, x); w_t = w_{t-1} + noise; x_t = a x_{t-1} + b w_{t-1} + noise ; z = w + noise
  const a = pick([-3, -2, -1, 2, 3]);
  const k = pick([1, 1, 2]);           // steady-state ratio x = k w
  const b = k * (1 - a);
  const sz = pick([[1, 10], [2, 10], [1, 2], [1, 1]]); const sz2 = f(sz[0], sz[1]).pow(2);
  const z0 = ri(4, 12);
  const sx = pick([[2, 10], [1, 10], [1, 2]]); const sx2 = f(sx[0], sx[1]).pow(2);
  const rho = pick([f(1, 2), f(0), f(-1, 2), f(1, 4)]);
  const sw = f(sz[0], sz[1]), sxx = f(sx[0], sx[1]);
  const mu0 = M.col([z0, k * z0]);
  const cross = rho.mul(sw).mul(sxx);
  const Sig0 = [[sz2, cross], [cross, sx2]];
  const rw = pick([1, 1, 4]), rx = pick([1, 2]);
  const A = M.of([[1, 0], [b, a]]);
  const R = M.diag([rw, rx]);
  const C = M.of([[1, 0]]); const Q = [[sz2]];
  const P1 = kfPredict(mu0, Sig0, A, R);
  const z1 = M.col([z0 + pick([-2, -1, 1, 2])]);
  const U1 = kfUpdate(P1.muBar, P1.SigBar, C, Q, z1);
  const statement = `You monitor output power $X_t$ and wind speed $W_t$ and want $p(X_t,W_t)$. Wind speed is measured, $Z_t$, with an unbiased instrument of standard deviation ${sw.dec()}.
  Wind dynamics: Gaussian around the previous wind speed with standard deviation ${Math.sqrt(rw)}. Power: linear function of $w_{t-1}$ and $x_{t-1}$ with Gaussian noise of variance ${rx}; the linear factor is ${a} on the $x_{t-1}$ term and ${b} on the other term.
  At $t=0$ you measure $Z_0=${z0}$, which directly gives the initial mean $w_0$.<br>
  (a) Variance of the wind speed at $t=0$? (b) Reasonable $x_0$ (steady-state assumption)? (c) Using ${sx2.dec()} as power variance and correlation coefficient ${rho.dec()}, the full $\\Sigma_0$? (d) Predicted distribution at $t=1$? (e) $Z_1=${z1[0][0].str()}$: updated belief?`;
  return {
    title: "KF · inicializar desde medida + steady state + ρ",
    statement,
    model: `estado $(w,x)^T$: $$A=${T(A)},\\ R=${T(R)},\\ C=${T(C)},\\ Q=${sz2.tex()}$$`,
    steps: [
      { q: "(a) $\\sigma^2_{w,0}$", hint: "La medida da $w$ directamente ($z=w+\\delta$) ⇒ la incertidumbre de $w_0$ es la del sensor: $\\sigma^2_{w,0}=\\sigma_z^2$ (¡elevar al cuadrado la std!).",
        fields: [{ label: "\\sigma^2_{w,0}", truth: sz2 }], sol: `$$\\sigma^2_{w,0}=(${sw.dec()})^2=${sz2.texH()}$$` },
      { q: "(b) $x_0$ por estado estacionario", hint: "Steady state: pon $x_t=x_{t-1}=x$, $w_t=w_{t-1}=w$ en la ecuación de la media y despeja $x$.",
        fields: [{ label: "x_0", truth: mu0[1][0] }], sol: `$$x=${a}x+${b}w\\Rightarrow (1-(${a}))x=${b}w\\Rightarrow x=${k}w=${mu0[1][0].str()}$$` },
      { q: "(c) $\\Sigma_0$ (orden $(w,x)$)", hint: "$\\sigma_{wx}=\\rho\\,\\sigma_w\\sigma_x$ (std, no varianzas). Diagonal = varianzas.",
        fields: covFields(Sig0, "w", "x"), sol: `$$\\sigma_{wx}=${rho.dec()}\\cdot${sw.dec()}\\cdot${sxx.dec()}=${cross.texH()},\\quad \\Sigma_0=${T(Sig0)}$$` },
      { q: "(d) Predicción $t=1$: $\\bar\\mu_1$, $\\bar\\Sigma_1$", hint: "$A$: fila de $w$ = $(1,0)$; fila de $x$ = (factor de $w$, factor de $x$). $R=\\mathrm{diag}(\\sigma^2_{w,proc}, \\sigma^2_{x,proc})$ — ¡la del viento venía como std!",
        fields: [...vecFields(P1.muBar, ["\\bar\\mu_w", "\\bar\\mu_x"]), ...covFields(P1.SigBar, "w", "x")],
        sol: `$$\\bar\\mu_1=A\\mu_0=${T(A)}${T(mu0)}=${T(P1.muBar)}\\ (\\text{steady state ⇒ la media no cambia})$$ $$\\bar\\Sigma_1=A\\Sigma_0A^T+R=${T(P1.GSGt)}+${T(R)}=${T(P1.SigBar)}$$` },
      { q: `(e) Update con $z_1=${z1[0][0].str()}$: $K$, $\\mu_1$, $\\Sigma_1$`, hint: "$C=(1,0)$, $Q=\\sigma_z^2$. $S=\\bar\\Sigma_{ww}+Q$. $K=\\bar\\Sigma C^T/S$ = primera columna de $\\bar\\Sigma$ dividida por $S$.",
        fields: [{ label: "S", truth: U1.S[0][0] }, ...vecFields(U1.K, ["K_w", "K_x"]), ...vecFields(U1.mu, ["\\mu_w", "\\mu_x"]), ...covFields(U1.Sig, "w", "x")],
        sol: `$$\\eta=${z1[0][0].str()}-${U1.zhat[0][0].tex()}=${U1.eta[0][0].tex()},\\ S=${U1.S[0][0].texH()},\\ K=${TF(U1.K)}$$ $$\\mu_1=${T(U1.mu)},\\quad \\Sigma_1=${T(U1.Sig)}$$` },
    ],
  };
}

// =============== EKF, (x,v) with nonlinear g and h (Nov 2025 Q2 style) ===============
const G_TEMPL = [
  { tex: c => `x_{t-1}+v_{t-1}^2${c ? "+" + c : ""}`, g: ([x, v], c) => [x.add(v.mul(v)).add(c), v], J: ([x, v]) => [[f(1), v.mul(2)], [f(0), f(1)]] },
  { tex: c => `x_{t-1}+x_{t-1}v_{t-1}${c ? "+" + c : ""}`, g: ([x, v], c) => [x.add(x.mul(v)).add(c), v], J: ([x, v]) => [[v.add(1), x], [f(0), f(1)]] },
  { tex: c => `x_{t-1}+v_{t-1}^3${c ? "+" + c : ""}`, g: ([x, v], c) => [x.add(v.pow(3)).add(c), v], J: ([x, v]) => [[f(1), v.mul(v).mul(3)], [f(0), f(1)]] },
  { tex: c => `x_{t-1}^2+v_{t-1}${c ? "+" + c : ""}`, g: ([x, v], c) => [x.mul(x).add(v).add(c), v], J: ([x, v]) => [[x.mul(2), f(1)], [f(0), f(1)]] },
];
const H_TEMPL = [
  { tex: "\\dfrac{1}{x_t^2+v_t^2+1}", h: ([x, v]) => f(1).div(x.mul(x).add(v.mul(v)).add(1)),
    J: ([x, v]) => { const D = x.mul(x).add(v.mul(v)).add(1); const D2 = D.mul(D); return [[x.mul(-2).div(D2), v.mul(-2).div(D2)]]; },
    jtex: "H=\\left(\\frac{-2x}{(x^2+v^2+1)^2},\\ \\frac{-2v}{(x^2+v^2+1)^2}\\right)" },
  { tex: "x_t^2+v_t", h: ([x, v]) => x.mul(x).add(v), J: ([x, v]) => [[x.mul(2), f(1)]], jtex: "H=(2x,\\ 1)" },
  { tex: "x_t v_t", h: ([x, v]) => x.mul(v), J: ([x, v]) => [[v, x]], jtex: "H=(v,\\ x)" },
  { tex: "x_t^2+v_t^2", h: ([x, v]) => x.mul(x).add(v.mul(v)), J: ([x, v]) => [[x.mul(2), v.mul(2)]], jtex: "H=(2x,\\ 2v)" },
];
function genEKF_XV() {
  for (let tries = 0; tries < 200; tries++) {
    const gt = pick(G_TEMPL), ht = pick(H_TEMPL); const c = pick([0, 1, 1, 2]);
    const mu0v = [f(ri(-1, 2)), f(ri(-1, 1))];
    const exact = Math.random() < 0.7;
    const Sig0 = exact ? M.zeros(2, 2) : M.diag([1, 1]);
    const R = M.diag([pick([1, 2]), pick([1, 2])]);
    const Q = M.of([[pick([f(1, 2), f(1), f(2), f(4)])]]);
    const mu0 = M.col(mu0v);
    const G0 = M.of(gt.J(mu0v));
    const gmu0 = M.col(gt.g(mu0v, c));
    const P1 = kfPredict(mu0, Sig0, G0, R, gmu0);
    const mb = [P1.muBar[0][0], P1.muBar[1][0]];
    const H = M.of(ht.J(mb));
    if (M.isZero(H)) continue;
    const zhat = M.col([ht.h(mb)]);
    const z1 = M.col([zhat[0][0].add(pick([f(1, 2), f(-1, 2), f(1), f(-1), f(2)]))]);
    const U1 = kfUpdate(P1.muBar, P1.SigBar, H, Q, z1, zhat);
    const m1 = [U1.mu[0][0], U1.mu[1][0]];
    const G1 = M.of(gt.J(m1));
    const P2 = kfPredict(U1.mu, U1.Sig, G1, R, M.col(gt.g(m1, c)));
    if ([...U1.mu.flat(), ...P2.SigBar.flat()].some(x => x.d > 5000)) continue;
    const statement = `Same variables $X_t,V_t$. Initial state ${exact ? `exactly $X_0=${mu0v[0].str()}$, $V_0=${mu0v[1].str()}$` : `mean $(${mu0v[0].str()},${mu0v[1].str()})^T$, covariance $I$`}. Motion model
      $$E[X_t]=${gt.tex(c)},\\qquad E[V_t]=v_{t-1}$$ with process noise variances $\\sigma^2_{xx}=${R[0][0].str()},\\ \\sigma^2_{vv}=${R[1][1].str()},\\ \\sigma^2_{xv}=0$.
      The measurement $Z_t$ has mean $$${ht.tex}$$ and variance ${Q[0][0].dec()}.<br>(a) Belief at $t=1$? (b) $Z_1=${z1[0][0].str()}$: belief after the measurement? (c) Belief at $t=2$?`;
    return {
      title: "EKF · g y h no lineales · predict → update → predict",
      statement,
      model: `$$g(x,v)=\\begin{pmatrix}${gt.tex(c).replace(/_\{t-1\}/g, "")}\\\\ v\\end{pmatrix},\\ h(x,v)=${ht.tex.replace(/_t/g, "")},\\ R=${T(R)},\\ Q=${Q[0][0].tex()}$$`,
      steps: [
        { q: "(a) Predicción: $\\bar\\mu_1=g(\\mu_0)$, $G_1$ (Jacobiano en $\\mu_0$), $\\bar\\Sigma_1$.",
          hint: `Media: evalúa $g$ en $\\mu_0$ (¡la función no lineal, no $G\\mu$!). Jacobiano $G=\\partial g/\\partial(x,v)$ evaluado en $\\mu_{0}$. ${exact ? "Inicio exacto ⇒ $\\Sigma_0=0$ ⇒ $\\bar\\Sigma_1=R$ (G no importa)." : ""}`,
          fields: [...vecFields(P1.muBar, ["\\bar\\mu_x", "\\bar\\mu_v"]), { label: "G_{11}", truth: G0[0][0] }, { label: "G_{12}", truth: G0[0][1] }, ...covFields(P1.SigBar, "x", "v")],
          sol: `$$\\bar\\mu_1=g(\\mu_0)=${T(P1.muBar)},\\quad G=\\frac{\\partial g}{\\partial(x,v)}\\Big|_{\\mu_0}=${T(G0)}$$ $$\\bar\\Sigma_1=G\\Sigma_0G^T+R=${T(P1.GSGt)}+${T(R)}=${T(P1.SigBar)}$$` },
        { q: `(b) Update con $z_1=${z1[0][0].str()}$: $\\hat z=h(\\bar\\mu_1)$, $\\eta$, $H$, $S$, $K$, $\\mu_1$, $\\Sigma_1$.`,
          hint: `$${ht.jtex}$ evaluado en $\\bar\\mu_1$ (¡la predicción, no $\\mu_0$!). $\\hat z=h(\\bar\\mu_1)$ con la función no lineal.`,
          fields: [{ label: "\\hat z", truth: zhat[0][0] }, { label: "\\eta", truth: U1.eta[0][0] }, { label: "H_1", truth: H[0][0] }, { label: "H_2", truth: H[0][1] }, { label: "S", truth: U1.S[0][0] },
            ...vecFields(U1.K, ["K_x", "K_v"]), ...vecFields(U1.mu, ["\\mu_x", "\\mu_v"]), ...covFields(U1.Sig, "x", "v")],
          sol: `$$\\hat z=h(\\bar\\mu_1)=${zhat[0][0].tex()},\\ \\eta=${U1.eta[0][0].tex()},\\ H=${T(H)}$$ $$S=H\\bar\\Sigma H^T+Q=${U1.S[0][0].tex()},\\quad K=\\bar\\Sigma H^T S^{-1}=${T(U1.K)}$$ $$\\mu_1=\\bar\\mu_1+K\\eta=${T(U1.mu)},\\quad \\Sigma_1=(I-KH)\\bar\\Sigma_1=${T(U1.Sig)}$$` },
        { q: "(c) Belief at $t=2$: $\\bar\\mu_2=g(\\mu_1)$, $G$ en $\\mu_1$, $\\bar\\Sigma_2$.",
          hint: "Re-linealiza: el Jacobiano $G$ ahora se evalúa en $\\mu_1$ (puede cambiar respecto a (a)).",
          fields: [...vecFields(P2.muBar, ["\\bar\\mu_x", "\\bar\\mu_v"]), { label: "G_{11}", truth: G1[0][0] }, { label: "G_{12}", truth: G1[0][1] }, ...covFields(P2.SigBar, "x", "v")],
          sol: `$$G\\big|_{\\mu_1}=${T(G1)},\\quad \\bar\\mu_2=g(\\mu_1)=${T(P2.muBar)}$$ $$\\bar\\Sigma_2=G\\Sigma_1G^T+R=${T(P2.GSGt)}+${T(R)}=${T(P2.SigBar)}$$` },
      ],
    };
  }
  return genKF_CV();
}

// =============== EKF, init from nonlinear measurement + steady state (Nov 2024 Q2 style) ===============
function genEKF_Init() {
  for (let tries = 0; tries < 200; tries++) {
    const kp = pick([2, 2, 3]);                 // z = w^kp
    const w0 = pick(kp === 2 ? [2, 3, 4, 5, 10] : [2, 3, 4]);
    const sz = pick([1, 2, 3]);
    const z0 = Math.pow(w0, kp);
    const dh0 = kp * Math.pow(w0, kp - 1);
    const varW = f(sz * sz, dh0 * dh0);
    const bcoef = pick([1, 2]); const acoef = pick([1, 2, -1]); const pp = pick([1, 2, 3, 3]);
    // x_t = x_{t-1} + a (w_{t-1} - b x_{t-1})^p ; steady state: w = b x
    const x0 = f(w0, bcoef);
    const sx2 = pick([f(1, 100), f(1, 4), f(1)]);
    const mu0v = [f(w0), x0];
    const Sig0 = [[varW, f(0)], [f(0), sx2]];
    const g = ([w, x]) => { const d = w.sub(x.mul(bcoef)); return [w, x.add(d.pow(pp).mul(acoef))]; };
    const J = ([w, x]) => { const d = w.sub(x.mul(bcoef)); const dp = pp === 1 ? f(1) : d.pow(pp - 1); const c = dp.mul(acoef * pp); return [[f(1), f(0)], [c, f(1).sub(c.mul(bcoef))]]; };
    const R = M.diag([1, 1]); const Q = M.of([[sz * sz]]);
    const mu0 = M.col(mu0v);
    const G0 = M.of(J(mu0v));
    const P1 = kfPredict(mu0, Sig0, G0, R, M.col(g(mu0v)));
    const mb = [P1.muBar[0][0], P1.muBar[1][0]];
    const H = M.of([[mb[0].pow(kp - 1).mul(kp), f(0)]]);
    const zhat = M.col([mb[0].pow(kp)]);
    const z1v = Math.pow(w0 + pick([-1, 1]), kp);
    const z1 = M.col([z1v]);
    const U1 = kfUpdate(P1.muBar, P1.SigBar, H, Q, z1, zhat);
    if (U1.mu.flat().some(x => x.d > 100000)) continue;
    const ptex = pp === 1 ? `(W_{t-1}-${bcoef === 1 ? "" : bcoef}X_{t-1})` : `(W_{t-1}-${bcoef === 1 ? "" : bcoef}X_{t-1})^${pp}`;
    const statement = `Wind speed $W_t$ and power $X_t$; want $p(X_t,W_t)$. Measurement $Z_t=W_t^${kp}+\\eta_t$ from an unbiased instrument with standard deviation ${sz}.
      Wind: Gaussian around previous wind speed with standard deviation 1. Power:
      $$X_t=X_{t-1}${acoef === 1 ? "+" : acoef === -1 ? "-" : "+" + acoef}${ptex}+\\epsilon_t,\\quad \\mathrm{Var}(\\epsilon)=1.$$
      At $t=0$, $Z_0=${z0}$ gives the initial mean $w_0$.<br>(a) Variance of wind speed at $t=0$? (b) $x_0$ (steady state)? (c) Power variance ${sx2.dec()}, no correlations: $\\Sigma_0$? (d) $g(\\cdot)$, $h(\\cdot)$? (e) Predicted distribution at $t=1$? (f) $Z_1=${z1v}$: innovation, Kalman gain, mean?`;
    return {
      title: "EKF · inicializar desde h no lineal + steady state",
      statement,
      model: `estado $(w,x)^T$: $$g\\begin{pmatrix}w\\\\x\\end{pmatrix}=\\begin{pmatrix}w\\\\ x${acoef === 1 ? "+" : acoef === -1 ? "-" : "+" + acoef}${ptex.replace(/_\{t-1\}/g, "").replace(/W/g, "w").replace(/X/g, "x")}\\end{pmatrix},\\ h=w^${kp},\\ R=I,\\ Q=${sz * sz}$$`,
      steps: [
        { q: "(a) $w_0$ y $\\sigma^2_{w,0}$", hint: `Invierte $h$: $w_0=z_0^{1/${kp}}$. Propaga la varianza linealizando: $\\sigma_z^2\\approx (h'(w_0))^2\\sigma_w^2 \\Rightarrow \\sigma_w^2=\\sigma_z^2/(h'(w_0))^2$, con $h'(w)=${kp}w^{${kp - 1}}$.`,
          fields: [{ label: "w_0", truth: f(w0) }, { label: "\\sigma^2_{w,0}", truth: varW }],
          sol: `$$w_0=${z0}^{1/${kp}}=${w0},\\quad h'(w_0)=${dh0},\\quad \\sigma^2_{w,0}=\\frac{${sz}^2}{${dh0}^2}=${varW.texH()}$$` },
        { q: "(b) $x_0$", hint: "Steady state: $x_t=x_{t-1}$ ⇒ el término no lineal debe ser 0 ⇒ $w=b\\,x$.",
          fields: [{ label: "x_0", truth: x0 }], sol: `$$${acoef}(w-${bcoef}x)^{${pp}}=0\\Rightarrow x_0=w_0/${bcoef}=${x0.tex()}$$` },
        { q: "(c) $\\Sigma_0$ (orden $(w,x)$)", hint: "Sin correlaciones ⇒ diagonal con $(\\sigma^2_{w,0}, \\sigma^2_{x,0})$.",
          fields: covFields(Sig0, "w", "x"), sol: `$$\\Sigma_0=${T(Sig0)}$$` },
        { q: "(e) Predicción: $G_0$, $\\bar\\mu_1$, $\\bar\\Sigma_1$", hint: `$G=\\partial g/\\partial(w,x)$ en $\\mu_0$. ${pp > 1 ? "Truco: en steady state $(w-bx)=0$ ⇒ las derivadas del término no lineal se anulan ⇒ $G_0=I$." : "Con $p=1$ el término es lineal ⇒ su derivada no se anula."}`,
          fields: [{ label: "G_{21}", truth: G0[1][0] }, { label: "G_{22}", truth: G0[1][1] }, ...vecFields(P1.muBar, ["\\bar\\mu_w", "\\bar\\mu_x"]), ...covFields(P1.SigBar, "w", "x")],
          sol: `$$G_0=${T(G0)},\\quad \\bar\\mu_1=g(\\mu_0)=${T(P1.muBar)}$$ $$\\bar\\Sigma_1=G_0\\Sigma_0G_0^T+R=${T(P1.SigBar)}$$` },
        { q: `(f) Update con $z_1=${z1v}$: $\\hat z$, $\\eta$, $H_1$, $S$, $K$, $\\mu_1$`, hint: `$\\hat z=h(\\bar\\mu_1)=\\bar w^${kp}$, $H=(${kp}\\bar w^{${kp - 1}},\\ 0)$ en $\\bar\\mu_1$, $Q=${sz * sz}$ (std² !).`,
          fields: [{ label: "\\hat z", truth: zhat[0][0] }, { label: "\\eta", truth: U1.eta[0][0] }, { label: "H_1", truth: H[0][0] }, { label: "S", truth: U1.S[0][0] },
            ...vecFields(U1.K, ["K_w", "K_x"]), ...vecFields(U1.mu, ["\\mu_w", "\\mu_x"])],
          sol: `$$\\hat z=${zhat[0][0].tex()},\\ \\eta=${U1.eta[0][0].tex()},\\ H=${T(H)}$$ $$S=H\\bar\\Sigma H^T+Q=${U1.S[0][0].texH()},\\quad K=${T(U1.K)}$$ $$\\mu_1=\\bar\\mu_1+K\\eta=${T(U1.mu)}\\approx\\begin{pmatrix}${U1.mu[0][0].dec(4)}\\\\${U1.mu[1][0].dec(4)}\\end{pmatrix}$$` },
      ],
    };
  }
}

window.Gens = {
  kf_cv: { name: "KF (x,v) — estilo Nov-2025", fn: genKF_CV },
  kf_init: { name: "KF init+steady+ρ — estilo Nov-2024", fn: genKF_Init },
  ekf_xv: { name: "EKF (x,v) — estilo Nov-2025", fn: genEKF_XV },
  ekf_init: { name: "EKF init h no lineal — estilo Nov-2024", fn: genEKF_Init },
};
window.Gens._util = { ri, pick };
})();
