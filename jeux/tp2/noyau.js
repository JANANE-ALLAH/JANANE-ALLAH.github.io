// noyau.js : le code MATLAB du TP2 (tp2_jacobi, tp2_gauss_seidel, tp2_sor, laplacien de la paroi)
// porte en JavaScript, ligne pour ligne. A est tridiagonale (2 sur la diagonale, -1 a cote) : on la
// stocke par ses trois diagonales, mais les boucles sont celles du corrige.
(function (racine) {
  "use strict";

  // A_n = 2*eye(n) - diag(ones(n-1,1),1) - diag(ones(n-1,1),-1) ;  b = (100, 0, ..., 0)
  // options.bug : "sans_sous_diag" (oubli de -diag(...,-1)), "bord_droit" (b(n) = 100 au lieu de b(1))
  function paroi(n, options) {
    const bug = options && options.bug, inf = new Float64Array(n), dia = new Float64Array(n).fill(2), sup = new Float64Array(n), b = new Float64Array(n);
    for (let i = 0; i < n; i++) { if (i > 0 && bug !== "sans_sous_diag") inf[i] = -1; if (i < n - 1) sup[i] = -1; }
    b[bug === "bord_droit" ? n - 1 : 0] = 100;
    return { n, inf, dia, sup, b };
  }
  // somme_{j ~= i} a_ij x_j pour la ligne i
  const horsDiag = (S, x, i) => (i > 0 ? S.inf[i] * x[i - 1] : 0) + (i < S.n - 1 ? S.sup[i] * x[i + 1] : 0);

  // Solution directe A \ b (algorithme de Thomas, tridiagonal)
  function direct(S) {
    const n = S.n, c = new Float64Array(n), d = new Float64Array(n), x = new Float64Array(n);
    c[0] = S.sup[0] / S.dia[0]; d[0] = S.b[0] / S.dia[0];
    for (let i = 1; i < n; i++) { const m = S.dia[i] - S.inf[i] * c[i - 1]; c[i] = S.sup[i] / m; d[i] = (S.b[i] - S.inf[i] * d[i - 1]) / m; }
    x[n - 1] = d[n - 1]; for (let i = n - 2; i >= 0; i--) x[i] = d[i] - c[i] * x[i + 1];
    return x;
  }

  const norme = v => { let s = 0; for (let i = 0; i < v.length; i++) s += v[i] * v[i]; return Math.sqrt(s); };
  const ecart = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) * (a[i] - b[i]); return Math.sqrt(s); };

  // [x, k, incr, err] = tp2_jacobi / tp2_gauss_seidel / tp2_sor (methode, omega)
  //   depart x = 0, arret quand ||x(k) - x(k-1)|| < tol ou apres nmax ; xex facultatif (analyse seulement).
  //   options.suivi(x, k) : appele apres chaque iteration ; options.critere = "erreur" : arret sur l'erreur (bug).
  //   options.bug = "jacobi_en_place" (Jacobi qui lit x lui-meme), "gs_copie" (Gauss-Seidel qui lit xold).
  function iterer(S, methode, omega, tol, nmax, xex, options) {
    const o = options || {}, n = S.n, x = new Float64Array(n), ancien = new Float64Array(n), incr = [], err = [];
    let k;
    for (k = 1; k <= nmax; k++) {
      ancien.set(x);
      const lit = (methode === "jacobi" && o.bug !== "jacobi_en_place") || (methode !== "jacobi" && o.bug === "gs_copie") ? ancien : x;
      for (let i = 0; i < n; i++) {
        const s = S.b[i] - horsDiag(S, lit, i), v = s / S.dia[i];
        x[i] = methode === "sor" ? (1 - omega) * x[i] + omega * v : v;
      }
      incr.push(ecart(x, ancien));
      if (xex) err.push(ecart(x, xex));
      if (o.suivi) o.suivi(x, k);
      if (!(incr[k - 1] < Infinity)) break;
      if (o.critere === "erreur" ? err[k - 1] < tol : incr[k - 1] < tol) break;
    }
    return { x, k: Math.min(k, nmax), incr, err, converge: (o.critere === "erreur" ? err[err.length - 1] : incr[incr.length - 1]) < tol };
  }

  const rhoJ = n => Math.cos(Math.PI / (n + 1));
  const omegaOpt = n => 2 / (1 + Math.sin(Math.PI / (n + 1)));
  // rayon spectral de la matrice SOR (rho_J connu) : formule de Young pour une matrice tridiagonale coherente
  function rhoSOR(n, w) {
    const r = rhoJ(n), wo = omegaOpt(n);
    if (w >= wo) return w - 1;
    const d = w * w * r * r - 4 * (w - 1), l = (w * r + Math.sqrt(Math.max(0, d))) / 2;
    return l * l;
  }

  const api = { paroi, direct, iterer, rhoJ, omegaOpt, rhoSOR, norme, ecart };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else racine.TP2 = api;
})(this);
