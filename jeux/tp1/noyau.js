// noyau.js : le code MATLAB du TP1 (assemblage de C, gauss_pivot, descente, remontee, gauss_jordan,
// triangularise, descente_gauss, bugs de l'atelier 5) porte en JavaScript, ligne pour ligne.
// Matrices : tableaux de lignes [[...], [...]] ; indices JavaScript a partir de 0.
(function (racine) {
  "use strict";
  const copie = A => A.map(l => l.slice());

  // C(i,i) = c(i) + c(i+1), C(i,i-1) = -c(i), C(i,i+1) = -c(i+1)  (c = [c0 ... cN], N = length(c) - 1)
  // options.bug = "decalage" : sous-diagonale ecrite -c(i+1) (erreur d'indice du jeu du detective)
  function assembler(c, options) {
    const N = c.length - 1, C = Array.from({ length: N }, () => new Array(N).fill(0)), bug = options && options.bug;
    for (let i = 0; i < N; i++) {
      C[i][i] = c[i] + c[i + 1];
      if (i > 0) C[i][i - 1] = bug === "decalage" ? -c[i + 1] : -c[i];
      if (i < N - 1) C[i][i + 1] = -c[i + 1];
    }
    return C;
  }

  // x = gauss_pivot(A, b) ; options.compteur : {op} compte multiplications et divisions ;
  // options.bug : "relatif" (p = idx), "boucle_vide" (for i = n:1), "sans_pivot" ; options.trace : etapes
  function gaussPivot(A, b, options) {
    const o = options || {}, n = b.length, Aug = A.map((l, i) => l.concat([b[i]])), cpt = o.compteur || { op: 0 }, trace = o.trace;
    if (trace) trace.push({ quoi: "depart", Aug: copie(Aug) });
    for (let k = 0; k < n - 1; k++) {
      let p = k;
      if (o.bug !== "sans_pivot") {
        let idx = 0, m = -1;
        for (let i = k; i < n; i++) if (Math.abs(Aug[i][k]) > m) { m = Math.abs(Aug[i][k]); idx = i - k; }   // idx relatif au bloc k:n
        p = o.bug === "relatif" ? idx : idx + k;
        if (o.bug !== "relatif" && Math.abs(Aug[p][k]) < 1e-14) throw new Error("Pivot nul a la colonne " + (k + 1) + " : matrice singuliere.");
        const t = Aug[k]; Aug[k] = Aug[p]; Aug[p] = t;
      }
      const etape = trace ? { quoi: "colonne", k, p, ops: [] } : null;
      for (let i = k + 1; i < n; i++) {
        const f = Aug[i][k] / Aug[k][k]; cpt.op++;
        for (let j = k; j <= n; j++) { Aug[i][j] -= f * Aug[k][j]; cpt.op++; }
        if (etape) etape.ops.push({ i, f });
      }
      if (etape) { etape.Aug = copie(Aug); trace.push(etape); }
    }
    if (!o.bug && Math.abs(Aug[n - 1][n - 1]) < 1e-14) throw new Error("Dernier pivot nul : matrice singuliere.");
    const x = new Array(n).fill(0);
    if (o.bug !== "boucle_vide") for (let i = n - 1; i >= 0; i--) {
      let s = 0;
      for (let j = i + 1; j < n; j++) { s += Aug[i][j] * x[j]; cpt.op++; }
      x[i] = (Aug[i][n] - s) / Aug[i][i]; cpt.op++;
    }
    return { x, Aug };
  }

  // [U, M, p] = triangularise(A) et y = descente_gauss(M, p, b) : l'elimination faite une seule fois
  function triangularise(A, cpt) {
    cpt = cpt || { op: 0 };
    const n = A.length, U = copie(A), M = Array.from({ length: n }, () => new Array(n).fill(0)), p = A.map((_, i) => i);
    for (let k = 0; k < n - 1; k++) {
      let idx = k; for (let i = k; i < n; i++) if (Math.abs(U[i][k]) > Math.abs(U[idx][k])) idx = i;
      [U[k], U[idx]] = [U[idx], U[k]]; [M[k], M[idx]] = [M[idx], M[k]]; [p[k], p[idx]] = [p[idx], p[k]];
      for (let i = k + 1; i < n; i++) { M[i][k] = U[i][k] / U[k][k]; cpt.op++; for (let j = k; j < n; j++) { U[i][j] -= M[i][k] * U[k][j]; cpt.op++; } }
    }
    return { U, M, p };
  }
  function descenteGauss(M, p, b, cpt) {
    cpt = cpt || { op: 0 };
    const n = b.length, y = p.map(i => b[i]);
    for (let k = 0; k < n - 1; k++) for (let i = k + 1; i < n; i++) { y[i] -= M[i][k] * y[k]; cpt.op++; }
    return y;
  }
  function remontee(U, y, cpt) {
    cpt = cpt || { op: 0 };
    const n = y.length, x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) { let s = 0; for (let j = i + 1; j < n; j++) { s += U[i][j] * x[j]; cpt.op++; } x[i] = (y[i] - s) / U[i][i]; cpt.op++; }
    return x;
  }
  function descente(L, b) {
    const n = b.length, y = new Array(n).fill(0);
    for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < i; j++) s += L[i][j] * y[j]; y[i] = (b[i] - s) / L[i][i]; }
    return y;
  }

  // X = gauss_jordan(A, B) ; B : matrice (n x m) ; options.bug = "dessous" : elimination sous le pivot seulement
  function gaussJordan(A, B, options) {
    const n = A.length, m = B[0].length, Aug = A.map((l, i) => l.concat(B[i])), trace = options && options.trace, bug = options && options.bug;
    for (let k = 0; k < n; k++) {
      let p = k; for (let i = k; i < n; i++) if (Math.abs(Aug[i][k]) > Math.abs(Aug[p][k])) p = i;
      [Aug[k], Aug[p]] = [Aug[p], Aug[k]];
      const piv = Aug[k][k]; Aug[k] = Aug[k].map(v => v / piv);
      for (let i = 0; i < n; i++) if (i !== k && (bug !== "dessous" || i > k)) { const f = Aug[i][k]; Aug[i] = Aug[i].map((v, j) => v - f * Aug[k][j]); }
      if (trace) trace.push({ k, p, Aug: copie(Aug) });
    }
    return Aug.map(l => l.slice(n, n + m));
  }

  const mulVec = (A, x) => A.map(l => l.reduce((s, a, j) => s + a * x[j], 0));
  const mulMat = (A, B) => A.map(l => B[0].map((_, j) => l.reduce((s, a, k) => s + a * B[k][j], 0)));
  const norme = v => Math.sqrt(v.reduce((s, a) => s + a * a, 0));
  const residu = (A, x, b) => norme(mulVec(A, x).map((v, i) => v - b[i]));
  const identite = n => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
  function det(A) { const n = A.length, U = copie(A); let d = 1; for (let k = 0; k < n; k++) { let p = k; for (let i = k; i < n; i++) if (Math.abs(U[i][k]) > Math.abs(U[p][k])) p = i; if (Math.abs(U[p][k]) < 1e-14) return 0; if (p !== k) { [U[k], U[p]] = [U[p], U[k]]; d = -d; } d *= U[k][k]; for (let i = k + 1; i < n; i++) { const f = U[i][k] / U[k][k]; for (let j = k; j < n; j++) U[i][j] -= f * U[k][j]; } } return d; }
  // cond(C) en norme 2 pour une matrice symetrique : rapport des valeurs propres extremes (Jacobi cyclique)
  function valeursPropresSym(A) {
    const n = A.length, a = copie(A);
    for (let s = 0; s < 60; s++) for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(a[p][q]) < 1e-15) continue;
      const th = (a[q][q] - a[p][p]) / (2 * a[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), sn = t * c;
      for (let k = 0; k < n; k++) { const akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - sn * akq; a[k][q] = sn * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - sn * aqk; a[q][k] = sn * apk + c * aqk; }
    }
    return a.map((l, i) => l[i]).sort((x, y) => x - y);
  }

  const api = { assembler, gaussPivot, triangularise, descenteGauss, remontee, descente, gaussJordan, mulVec, mulMat, norme, residu, identite, det, valeursPropresSym, copie };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else racine.TP1 = api;
})(this);
