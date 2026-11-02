// noyau.js : le code MATLAB du TP6 (modele_lorenz, rk4_systeme, euler_systeme, distance_trajectoires)
// porte en JavaScript, ligne pour ligne. Une trajectoire est un tableau plat : Y[3n], Y[3n+1], Y[3n+2] = x, y, z au pas n.
(function (racine) {
  "use strict";

  // F = modele_lorenz(sigma, rho, beta) ; valeurs classiques par defaut
  function lorenz(sigma, rho, beta) {
    if (beta === undefined) { sigma = 10; rho = 28; beta = 8 / 3; }
    return function (t, y, out) {
      out[0] = sigma * (y[1] - y[0]); out[1] = y[0] * (rho - y[2]) - y[1]; out[2] = y[0] * y[1] - beta * y[2];
      return out;
    };
  }

  function grille(tf, h) {
    var N = Math.round(tf / h), t = new Float64Array(N + 1);
    for (var n = 0; n <= N; n++) t[n] = n * h;
    return { N: N, h: h, t: t, Y: new Float64Array(3 * (N + 1)) };
  }

  // [t, Y] = rk4_systeme(F, Y0, tf, h)
  function rk4Systeme(F, Y0, tf, h) {
    var g = grille(tf, h), y = new Float64Array(3), z = new Float64Array(3);
    var k1 = new Float64Array(3), k2 = new Float64Array(3), k3 = new Float64Array(3), k4 = new Float64Array(3), c;
    for (c = 0; c < 3; c++) g.Y[c] = Y0[c];
    for (var n = 0; n < g.N; n++) {
      for (c = 0; c < 3; c++) y[c] = g.Y[3 * n + c];
      F(g.t[n], y, k1);
      for (c = 0; c < 3; c++) z[c] = y[c] + h / 2 * k1[c]; F(g.t[n] + h / 2, z, k2);
      for (c = 0; c < 3; c++) z[c] = y[c] + h / 2 * k2[c]; F(g.t[n] + h / 2, z, k3);
      for (c = 0; c < 3; c++) z[c] = y[c] + h * k3[c]; F(g.t[n] + h, z, k4);
      for (c = 0; c < 3; c++) g.Y[3 * (n + 1) + c] = y[c] + h / 6 * (k1[c] + 2 * k2[c] + 2 * k3[c] + k4[c]);
    }
    return g;
  }

  // [t, Y] = euler_systeme(F, Y0, tf, h)
  function eulerSysteme(F, Y0, tf, h) {
    var g = grille(tf, h), y = new Float64Array(3), k = new Float64Array(3), c;
    for (c = 0; c < 3; c++) g.Y[c] = Y0[c];
    for (var n = 0; n < g.N; n++) {
      for (c = 0; c < 3; c++) y[c] = g.Y[3 * n + c];
      F(g.t[n], y, k);
      for (c = 0; c < 3; c++) g.Y[3 * (n + 1) + c] = y[c] + h * k[c];
    }
    return g;
  }

  // d = distance_trajectoires(Y1, Y2) ; pas2 = sous-echantillonnage de Y2 (Yr(1:10:end, :) du TP)
  function distance(A, B, pas2) {
    pas2 = pas2 || 1;
    var N = Math.min(A.N, Math.floor(B.N / pas2)), d = new Float64Array(N + 1);
    for (var n = 0; n <= N; n++) {
      var s = 0;
      for (var c = 0; c < 3; c++) { var e = A.Y[3 * n + c] - B.Y[3 * n * pas2 + c]; s += e * e; }
      d[n] = Math.sqrt(s);
    }
    return d;
  }

  // sum(diff(sign(Y(:, 1))) ~= 0) : nombre de changements d'aile
  function changementsSigne(g) {
    var k = 0;
    for (var n = 1; n <= g.N; n++) if (Math.sign(g.Y[3 * n]) !== Math.sign(g.Y[3 * (n - 1)])) k++;
    return k;
  }

  // max(abs(Y)) colonne par colonne
  function maxAbs(g) {
    var m = [0, 0, 0];
    for (var n = 0; n <= g.N; n++) for (var c = 0; c < 3; c++) m[c] = Math.max(m[c], Math.abs(g.Y[3 * n + c]));
    return m;
  }

  function etat(g, n) { if (n === undefined) n = g.N; return [g.Y[3 * n], g.Y[3 * n + 1], g.Y[3 * n + 2]]; }

  // premier indice ou la condition est vraie (find(..., 1) - 1), -1 sinon
  function premier(tab, test) { for (var n = 0; n < tab.length; n++) if (test(tab[n], n)) return n; return -1; }

  var api = { lorenz: lorenz, rk4Systeme: rk4Systeme, eulerSysteme: eulerSysteme, distance: distance,
              changementsSigne: changementsSigne, maxAbs: maxAbs, etat: etat, premier: premier };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else racine.TP6 = api;
})(this);
