// noyau.js : le code MATLAB du TP4 (modele_four, euler_explicite, rk4, euler_implicite, erreur_finale)
// porte en JavaScript, ligne pour ligne. Les jeux calculent tous leurs nombres avec ces fonctions.
(function (racine) {
  "use strict";
  var P = { C: 5000, hA: 8, epsA: 5e-9, Tamb: 293, T0: 1200, tf: 1200 };

  // [f, dfdT] = modele_four(rayonnement) ; options.Tamb permet l'erreur d'unites du jeu du detective.
  function modele(rayonnement, options) {
    if (rayonnement === undefined) rayonnement = true;
    var C = P.C, hA = P.hA, epsA = P.epsA, Tamb = (options && options.Tamb !== undefined) ? options.Tamb : P.Tamb;
    if (rayonnement) return {
      f: function (t, T) { return -(hA * (T - Tamb) + epsA * (Math.pow(T, 4) - Math.pow(Tamb, 4))) / C; },
      dfdT: function (t, T) { return -(hA + 4 * epsA * T * T * T) / C; }
    };
    return { f: function (t, T) { return -(hA * (T - Tamb)) / C; }, dfdT: function () { return -hA / C; } };
  }

  function grille(tf, h) {
    var N = Math.round(tf / h), t = new Float64Array(N + 1);
    for (var n = 0; n <= N; n++) t[n] = n * h;
    return { N: N, t: t, T: new Float64Array(N + 1) };
  }

  // [t, T] = euler_explicite(f, T0, tf, h)
  function eulerExplicite(f, T0, tf, h) {
    var g = grille(tf, h); g.T[0] = T0;
    for (var n = 0; n < g.N; n++) g.T[n + 1] = g.T[n] + h * f(g.t[n], g.T[n]);
    return g;
  }

  // [t, T] = rk4(f, T0, tf, h) ; options.bug : erreurs volontaires du jeu du detective
  //   "t0" : pentes evaluees a t = 0 (invisible ici, f ne depend pas de t) ; "k4" : k4 calcule avec k2 au lieu de k3.
  function rk4(f, T0, tf, h, options) {
    var bug = (options && options.bug) || "", g = grille(tf, h); g.T[0] = T0;
    for (var n = 0; n < g.N; n++) {
      var t = bug === "t0" ? 0 : g.t[n], T = g.T[n];
      var k1 = f(t, T), k2 = f(t + h / 2, T + h / 2 * k1), k3 = f(t + h / 2, T + h / 2 * k2);
      var k4 = f(t + h, T + h * (bug === "k4" ? k2 : k3));
      g.T[n + 1] = T + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4);
    }
    return g;
  }

  // Une resolution de Newton : zero de F(x) = x - Tn - h f(tn1, x), depart x = Tn, arret |delta| < 1e-10 (20 iterations max).
  //   options.signe = -1 : derivee de mauvais signe ; options.deguise : pente evaluee en (tn, Tn) (Euler explicite deguise).
  function newton(f, dfdT, Tn, tn, h, options) {
    var o = options || {}, s = o.signe || 1, x = Tn, etapes = [], k;
    for (k = 1; k <= 20; k++) {
      var F = o.deguise ? x - Tn - h * f(tn, Tn) : x - Tn - h * f(tn + h, x);
      var dF = 1 - h * s * dfdT(tn + h, x), delta = -F / dF;
      etapes.push({ x: x, F: F, dF: dF, delta: delta });
      x = x + delta;
      if (Math.abs(delta) < 1e-10) break;
    }
    return { x: x, nit: Math.min(k, 20), etapes: etapes };
  }

  // [t, T, nit] = euler_implicite(f, dfdT, T0, tf, h)
  function eulerImplicite(f, dfdT, T0, tf, h, options) {
    var g = grille(tf, h); g.T[0] = T0; g.nit = new Float64Array(g.N);
    for (var n = 0; n < g.N; n++) { var r = newton(f, dfdT, g.T[n], g.t[n], h, options); g.T[n + 1] = r.x; g.nit[n] = r.nit; }
    return g;
  }

  // err = erreur_finale(schema, h) : ecart sur T(tf) a une reference RK4 de pas 0,1 s
  var REF = null;
  function erreurFinale(schema, h, options) {
    var m = modele();
    if (REF === null) { var r = rk4(m.f, P.T0, P.tf, 0.1); REF = r.T[r.N]; }
    var s = schema === "euler" ? eulerExplicite(m.f, P.T0, P.tf, h) : schema === "rk4" ? rk4(m.f, P.T0, P.tf, h, options) :
      eulerImplicite(m.f, m.dfdT, P.T0, P.tf, h, options);
    return Math.abs(s.T[s.N] - REF);
  }

  // Temperature ou convection et rayonnement evacuent le meme flux (bissection sur [Tamb + 1, 2000])
  function egaliteFlux() {
    var g = function (T) { return P.hA * (T - P.Tamb) - P.epsA * (Math.pow(T, 4) - Math.pow(P.Tamb, 4)); }, a = P.Tamb + 1, b = 2000;
    for (var q = 0; q < 200; q++) { var c = (a + b) / 2; if (g(a) * g(c) <= 0) b = c; else a = c; }
    return (a + b) / 2;
  }

  // 5*(find(T <= seuil, 1) - 1) : premier instant ou T passe sous le seuil
  function instantSous(sol, seuil) {
    for (var n = 0; n <= sol.N; n++) if (sol.T[n] <= seuil) return sol.t[n];
    return NaN;
  }

  function stats(T) {
    var mn = Infinity, mx = -Infinity, s = 0;
    for (var q = 0; q < T.length; q++) { mn = Math.min(mn, T[q]); mx = Math.max(mx, T[q]); s += T[q]; }
    return { min: mn, max: mx, moy: s / T.length };
  }

  var api = { P: P, modele: modele, eulerExplicite: eulerExplicite, rk4: rk4, newton: newton, eulerImplicite: eulerImplicite,
              erreurFinale: erreurFinale, egaliteFlux: egaliteFlux, instantSous: instantSous, stats: stats };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else racine.TP4 = api;
})(this);
