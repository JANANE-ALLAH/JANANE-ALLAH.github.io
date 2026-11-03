// noyau.js : modeles physiques des trois manipulations du TP d'electricite (FSTM, modules P121 / P221).
//  1) transformateur monophase (schema equivalent en T, 50 Hz) ; 2) bobine (L, r) : resonance LC et loi de Faraday ;
//  3) capacite de spheres conductrices et d'un condensateur spherique (amplificateur de charge C_A = 10 nF).
(function (racine) {
  "use strict";
  // ---- petits nombres complexes ----
  const C = (re, im) => ({ re, im: im || 0 });
  const add = (a, b) => C(a.re + b.re, a.im + b.im), sub = (a, b) => C(a.re - b.re, a.im - b.im);
  const mul = (a, b) => C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const div = (a, b) => { const d = b.re * b.re + b.im * b.im; return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
  const mod = a => Math.hypot(a.re, a.im), par = (a, b) => div(mul(a, b), add(a, b));

  /* ================= 1) Transformateur ================= */
  // Valeurs du manuel : N1 = 500, N2 = 1000 spires, r1 = 2,3 ohms, r2 = 9,5 ohms, charge R = 100 ohms, r = 20 ou 50 ohms.
  // Valeurs du modele (non donnees dans le manuel) : fuites X1 = 3 ohms, X2 = 12 ohms, magnetisation Xm = 250 ohms, pertes fer Rf = 1200 ohms.
  const TR = { N1: 500, N2: 1000, r1: 2.3, r2: 9.5, X1: 3, X2: 12, Xm: 250, Rf: 1200, R: 100 };
  // primaire alimente sous V1 (efficace, phase 0) ; charge : null (a vide) ou R en ohms
  function transfo(V1, charge) {
    const a = TR.N2 / TR.N1, Z1 = C(TR.r1, TR.X1), Zm = par(C(TR.Rf), C(0, TR.Xm));
    const Z2p = charge ? div(C(TR.r2 + charge, TR.X2), C(a * a)) : null;            // secondaire ramene au primaire
    const Zin = add(Z1, Z2p ? par(Zm, Z2p) : Zm), I1 = div(C(V1), Zin), E1 = sub(C(V1), mul(Z1, I1));
    const I2p = Z2p ? div(E1, Z2p) : C(0), I2 = mod(I2p) / a, E2 = mod(E1) * a;
    const V2 = charge ? I2 * charge : E2 * 1;                                           // a vide : V2 = E2
    const P1 = V1 * I1.re, P2 = charge ? V2 * I2 : 0, PJ = TR.r1 * mod(I1) ** 2 + TR.r2 * I2 * I2, Pf = mod(E1) ** 2 / TR.Rf;
    return { V1, I1: mod(I1), V2, I2, P1, P2, PJ, Pf, I1c: I1, cosphi: I1.re / mod(I1) };
  }
  // methode des trois voltmetres : generateur V (efficace) en serie avec r ; on cherche V1 tel que |V1 + r I1| = V
  function troisVoltmetres(V, r, charge) {
    const unit = transfo(1, charge), k = mod(add(C(1), mul(C(r), unit.I1c)));            // lineaire : V = k V1
    const V1 = V / k, t = transfo(V1, charge);
    return Object.assign(t, { V, V3: r * t.I1, r, P1formule: (V * V - (r * t.I1) ** 2 - V1 * V1) / (2 * r) });
  }

  /* ================= 2) Bobine : resonance et loi de Faraday ================= */
  // serie (L, r) - C sous tension sinusoidale d'amplitude E (generateur ideal, comme le suppose le manuel)
  function rlc(L, r, Cap, f, E) {
    const w = 2 * Math.PI * f, Z = C(r, L * w - 1 / (Cap * w)), I = E / mod(Z), phi = Math.atan2(Z.im, Z.re);
    return { I, phi, UC: I / (Cap * w), f0: 1 / (2 * Math.PI * Math.sqrt(L * Cap)) };
  }
  // signal triangulaire d'amplitude A (crete) et de frequence f ; circuit serie R - (L, r)
  const triangle = (t, A, f) => { const x = ((t * f) % 1 + 1) % 1; return x < 0.5 ? A * (-1 + 4 * x) : A * (3 - 4 * x); };
  // integration de L di/dt + (R + r) i = u(t) sur plusieurs periodes ; montage "b" : U_AC aux bornes de R, "c" : aux bornes de la bobine
  function faraday(L, r, R, A, f, montage, nPer, nPts) {
    nPer = nPer || 2; nPts = nPts || 800;
    const T = 1 / f, sous = 40, dt = T / (nPts / nPer) / sous, tot = (nPer + 3) * T;
    let i = 0, t = 0; const out = [];
    const d = (tt, ii) => (triangle(tt, A, f) - (R + r) * ii) / L;
    while (t < tot - 1e-15) {
      for (let s = 0; s < sous; s++) {
        const k1 = d(t, i), k2 = d(t + dt / 2, i + dt / 2 * k1), k3 = d(t + dt / 2, i + dt / 2 * k2), k4 = d(t + dt, i + dt * k3);
        i += dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); t += dt;
      }
      if (t >= 3 * T - 1e-12) { const u = triangle(t, A, f); out.push({ t: t - 3 * T, u, uac: montage === "b" ? R * i : u - R * i }); }
    }
    return out;
  }

  /* ================= 3) Spheres et condensateur spherique ================= */
  const EPS0 = 8.86e-12, CA = 10e-9;                                                   // valeur de epsilon_0 du manuel
  const OBJETS = {
    s2: { nom: "sphère 2R = 2 cm", R: 0.01, par: 0.45e-12 }, s4: { nom: "sphère 2R = 4 cm", R: 0.02, par: 0.5e-12 },
    s12: { nom: "sphère 2R = 12 cm", R: 0.06, par: 0.7e-12 }, cs: { nom: "condensateur sphérique (R1 = 2 cm, R2 = 6 cm)", R1: 0.02, R2: 0.06, par: 0.4e-12 },
  };
  const capaTheo = o => o.R1 ? 4 * Math.PI * EPS0 * o.R1 * o.R2 / (o.R2 - o.R1) : 4 * Math.PI * EPS0 * o.R;
  // lecture de l'amplificateur pour une charge sous U (kV) : Q = C U, partagee avec C_A ; capacites parasites incluses
  function lecture(o, UkV, bruit) {
    const Cv = capaTheo(o) + o.par, U = UkV * 1000, Q = Cv * U;
    return Q / (CA + Cv) * (1 + (bruit || 0));
  }
  // pente des moindres carres d'une droite y = m x passant par l'origine : m = somme(x y) / somme(x^2)
  const pente = pts => pts.reduce((s, p) => s + p[0] * p[1], 0) / pts.reduce((s, p) => s + p[0] * p[0], 0);

  // gaussienne (Box-Muller) pour le bruit de mesure
  function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  const api = { TR, transfo, troisVoltmetres, rlc, triangle, faraday, EPS0, CA, OBJETS, capaTheo, lecture, pente, gauss };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else racine.ELEC = api;
})(this);
