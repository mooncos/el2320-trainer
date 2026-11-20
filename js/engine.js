// Exact rational arithmetic + small-matrix linear algebra + KF/EKF solvers.
// Everything is exact (fractions) so the solutions look like the official answers (e.g. 25/33).
"use strict";

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }

class F {
  constructor(n, d = 1) {
    if (d === 0) throw new Error("division by zero");
    if (!Number.isInteger(n) || !Number.isInteger(d)) {
      // fall back to a decimal approximation turned into a fraction (should not happen in generators)
      const s = 1e6; n = Math.round((n / d) * s); d = s;
    }
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d);
    this.n = n / g; this.d = d / g;
  }
  static of(x) { return x instanceof F ? x : new F(x, 1); }
  add(o) { o = F.of(o); return new F(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = F.of(o); return new F(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = F.of(o); return new F(this.n * o.n, this.d * o.d); }
  div(o) { o = F.of(o); return new F(this.n * o.d, this.d * o.n); }
  neg() { return new F(-this.n, this.d); }
  pow(k) { let r = new F(1); for (let i = 0; i < k; i++) r = r.mul(this); return r; }
  isZero() { return this.n === 0; }
  val() { return this.n / this.d; }
  eq(o) { o = F.of(o); return this.n === o.n && this.d === o.d; }
  isSquare() { // perfect square rational -> sqrt as F, else null
    if (this.n < 0) return null;
    const a = Math.round(Math.sqrt(this.n)), b = Math.round(Math.sqrt(this.d));
    return a * a === this.n && b * b === this.d ? new F(a, b) : null;
  }
  tex() {
    if (this.d === 1) return String(this.n);
    const s = this.n < 0 ? "-" : "";
    return `${s}\\tfrac{${Math.abs(this.n)}}{${this.d}}`;
  }
  str() { return this.d === 1 ? String(this.n) : `${this.n}/${this.d}`; }
  dec(p = 4) { const v = this.val(); return Number.isInteger(v) ? String(v) : (+v.toFixed(p)).toString(); }
  // tex with decimal hint when the fraction is ugly
  texH() { return this.d === 1 || this.d > 1000 ? this.tex() : `${this.tex()}\\approx ${this.dec(3)}`; }
}
const f = (n, d = 1) => new F(n, d);

// ---------- matrices: arrays of arrays of F ----------
const M = {
  of: rows => rows.map(r => r.map(F.of)),
  col: arr => arr.map(x => [F.of(x)]),
  zeros: (r, c) => Array.from({ length: r }, () => Array.from({ length: c }, () => f(0))),
  eye: n => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => f(i === j ? 1 : 0))),
  diag: arr => arr.map((x, i) => arr.map((_, j) => (i === j ? F.of(x) : f(0)))),
  T: A => A[0].map((_, j) => A.map(r => r[j])),
  add: (A, B) => A.map((r, i) => r.map((x, j) => x.add(B[i][j]))),
  sub: (A, B) => A.map((r, i) => r.map((x, j) => x.sub(B[i][j]))),
  scale: (A, s) => A.map(r => r.map(x => x.mul(s))),
  mul: (A, B) => A.map(r => B[0].map((_, j) => r.reduce((acc, x, k) => acc.add(x.mul(B[k][j])), f(0)))),
  inv: A => {
    const n = A.length;
    if (n === 1) return [[f(1).div(A[0][0])]];
    if (n === 2) {
      const [[a, b], [c, d]] = A; const det = a.mul(d).sub(b.mul(c));
      return [[d.div(det), b.neg().div(det)], [c.neg().div(det), a.div(det)]];
    }
    throw new Error("inv only for 1x1/2x2");
  },
  isZero: A => A.every(r => r.every(x => x.isZero())),
  flat: A => A.flat(),
  tex: (A, mode = "tex") => {
    const body = A.map(r => r.map(x => x[mode]()).join(" & ")).join(" \\\\ ");
    return `\\begin{pmatrix} ${body} \\end{pmatrix}`;
  },
  // pull a common denominator out: (1/d) * integer matrix — matches how the official answers are written
  texFactored: A => {
    const ds = A.flat().map(x => x.d); const L = ds.reduce((a, b) => (a * b) / gcd(a, b), 1);
    if (L === 1) return M.tex(A);
    const ints = A.map(r => r.map(x => x.mul(L)));
    return `\\tfrac{1}{${L}}${M.tex(ints)}`;
  },
};

// ---------- answer parsing / checking ----------
function parseNum(s) {
  if (s == null) return NaN;
  s = String(s).trim().replace(",", ".").replace(/\s+/g, "");
  if (!s) return NaN;
  const m = s.match(/^([-+]?[\d.]+)\/([-+]?[\d.]+)$/);
  if (m) return parseFloat(m[1]) / parseFloat(m[2]);
  if (/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return parseFloat(s);
  return NaN;
}
function close(user, truth) {
  const t = truth instanceof F ? truth.val() : truth;
  if (!isFinite(user)) return false;
  return Math.abs(user - t) <= 2e-3 * Math.max(1, Math.abs(t)) + 1e-9;
}

// ---------- the filter steps, returned as data so the UI can ask for each piece ----------
// predict: mu' = g(mu) (or A mu + B u), Sigma' = G Sigma G^T + R
function kfPredict(mu, Sig, G, R, gmu) {
  const muBar = gmu || M.mul(G, mu);
  const GS = M.mul(G, Sig);
  const GSGt = M.mul(GS, M.T(G));
  const SigBar = M.add(GSGt, R);
  return { muBar, SigBar, GSGt };
}
// update with scalar or vector measurement
function kfUpdate(muBar, SigBar, H, Q, z, zhat) {
  zhat = zhat || M.mul(H, muBar);
  const eta = M.sub(z, zhat);
  const SHt = M.mul(SigBar, M.T(H));
  const S = M.add(M.mul(H, SHt), Q);
  const K = M.mul(SHt, M.inv(S));
  const mu = M.add(muBar, M.mul(K, eta));
  const Sig = M.sub(SigBar, M.mul(M.mul(K, H), SigBar));
  return { zhat, eta, S, K, mu, Sig, SHt };
}

window.Eng = { F, f, M, parseNum, close, kfPredict, kfUpdate, gcd };
