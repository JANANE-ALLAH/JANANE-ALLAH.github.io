// noyau.js : le code MATLAB du TP3 (pompage, newton_systeme, newton_signe_faux, descente_gradient,
// jacobienne_fd) porte en JavaScript, ligne pour ligne. Vecteurs : tableaux ; JF(x) : tableau de lignes.
(function (racine) {
  "use strict";

  // [F, JF] = pompage(R, Qtot) : conservation du debit, puis R(1)*Q1^2 = R(i)*Qi^2 (i = 2..n)
  // options.facteur2 = false : jacobienne sans le facteur 2 (JFfaux du corrige)
  function pompage(R, Qtot, options) {
    const n = R.length, f2 = !(options && options.facteur2 === false) ? 2 : 1;
    const F = x => [x.reduce((s, v) => s + v, 0) - Qtot].concat(R.slice(1).map((r, q) => R[0] * x[0] * x[0] - r * x[q + 1] * x[q + 1]));
    const JF = x => { const J = Array.from({ length: n }, () => new Array(n).fill(0)); J[0].fill(1);
      for (let i = 1; i < n; i++) { J[i][0] = f2 * R[0] * x[0]; J[i][i] = -f2 * R[i] * x[i]; } return J; };
    return { F, JF };
  }

  // Resolution de J d = r par elimination de Gauss avec pivot partiel (l'operateur \ de MATLAB) ;
  // une matrice singuliere donne des Inf / NaN, comme MATLAB (avec un avertissement).
  function resoudre(J, r) {
    const n = r.length, A = J.map((l, i) => l.concat([r[i]]));
    let singuliere = false;
    for (let k = 0; k < n; k++) {
      let p = k; for (let i = k; i < n; i++) if (Math.abs(A[i][k]) > Math.abs(A[p][k])) p = i;
      [A[k], A[p]] = [A[p], A[k]];
      if (!(Math.abs(A[k][k]) > 1e-300)) singuliere = true;
      for (let i = k + 1; i < n; i++) { const f = A[i][k] / A[k][k]; for (let j = k; j <= n; j++) A[i][j] -= f * A[k][j]; }
    }
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) { let s = A[i][n]; for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; }
    return { x, singuliere };
  }

  const norme = v => Math.sqrt(v.reduce((s, a) => s + a * a, 0));

  // [x, k, X] = newton_systeme(F, JF, x0, tol, nmax) ; signe = +1 : newton_signe_faux (JF*delta = +F)
  function newton(F, JF, x0, tol, nmax, signe) {
    let x = x0.slice(), k, d = [Infinity], avert = 0;
    const X = [x.slice()];
    for (k = 1; k <= nmax; k++) {
      const r = resoudre(JF(x), F(x)); if (r.singuliere) avert++;
      d = r.x.map(v => (signe === 1 ? 1 : -1) * v);
      x = x.map((v, i) => v + d[i]); X.push(x.slice());
      if (norme(d) < tol) break;
    }
    return { x, k: Math.min(k, nmax), X, converge: norme(d) < tol, singulier: avert };
  }

  // [x, k] = descente_gradient(F, JF, x0, alpha, tol, nmax) : grad G = JF(x)' * F(x) ; suivi(x, k) facultatif
  function gradient(F, JF, x0, alpha, tol, nmax, suivi) {
    let x = x0.slice(), k, g = [Infinity];
    for (k = 1; k <= nmax; k++) {
      const J = JF(x), f = F(x); g = J[0].map((_, j) => J.reduce((s, l, i) => s + l[j] * f[i], 0));
      if (norme(g) < tol) break;
      x = x.map((v, i) => v - alpha * g[i]);
      if (suivi) suivi(x, k);
    }
    return { x, k: Math.min(k, nmax), converge: norme(g) < tol };
  }

  // J = jacobienne_fd(F, x) : differences finies centrees, colonne par colonne
  function jacobienneFD(F, x) {
    const n = x.length, m = F(x).length, J = Array.from({ length: m }, () => new Array(n).fill(0));
    for (let j = 0; j < n; j++) {
      const h = 1e-6 * Math.max(1, Math.abs(x[j])), xp = x.slice(), xm = x.slice(); xp[j] += h; xm[j] -= h;
      const fp = F(xp), fm = F(xm); for (let i = 0; i < m; i++) J[i][j] = (fp[i] - fm[i]) / (2 * h);
    }
    return J;
  }
  // norme 2 d'une matrice (plus grande valeur singuliere, par la puissance iteree sur M' M)
  function norme2(M) {
    const n = M[0].length, MtM = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => M.reduce((s, l) => s + l[i] * l[j], 0)));
    let v = new Array(n).fill(1), l = 0;
    for (let q = 0; q < 200; q++) { const w = MtM.map(r => r.reduce((s, a, j) => s + a * v[j], 0)); l = norme(w); if (!l) return 0; v = w.map(a => a / l); }
    return Math.sqrt(l);
  }

  const api = { pompage, resoudre, newton, gradient, jacobienneFD, norme2, norme };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else racine.TP3 = api;
})(this);
