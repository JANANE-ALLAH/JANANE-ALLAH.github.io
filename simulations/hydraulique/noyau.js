// noyau.js : modeles des quatre simulations 3D du module Hydraulique (Licence Pro IMPI, ENSAM Casablanca).
//  1) distributeur a tiroir : chambres du corps, portees du tiroir, liaisons entre orifices ;
//  2) verins : sections, efforts, vitesses (chapitre 3, partie 7) ;
//  3) pompes : cylindree, debit, fuites, puissances, couple (partie 5) ;
//  4) accumulateur a gaz : loi de Boyle-Mariotte, isotherme ou adiabatique (partie 4).
// Unites du cours : p en bar, Q en L/min, cylindree en cm3/tr, P en kW, volumes en L.
(function (racine) {
  "use strict";

  /* ================= 1) Distributeur a tiroir ================= */
  // Corps : cinq chambres le long de l'alesage (abscisse x, unite arbitraire), du gauche vers la droite.
  const CHAMBRES = { T1: [-1.35, -1.05], A: [-0.75, -0.45], P: [-0.15, 0.15], B: [0.45, 0.75], T2: [1.05, 1.35] };
  const ORDRE = ["T1", "A", "P", "B", "T2"];
  const COURSE = 0.3;                                   // deplacement du tiroir pour s = +-1
  // Portees du tiroir (position s = 0). Une portee qui coupe la partie d'alesage entre deux chambres les isole.
  const PORTEES = {
    ferme: [[-0.78, -0.42], [0.42, 0.78]],              // recouvrement positif : A et B fermes au centre
    ouvert: [[-0.72, -0.48], [0.48, 0.72]],             // portees plus etroites que les chambres : tout communique
    flottant: [[-0.6, -0.3], [0.3, 0.6]],               // portees decalees vers P : P isole, A et B vers T
  };
  // Types : orifices (chambre -> nom), portees, percage P -> T au centre (tandem), positions, cases du symbole (gauche -> droite),
  // commande et rappel. La case de droite est obtenue tiroir a s = -1 (pousse vers la gauche par l'organe de droite).
  const TYPES = {
    "43f": { nom: "4/3 centre fermé", court: "4/3 fermé", orifices: { T1: "T", A: "A", P: "P", B: "B", T2: "T" }, portees: "ferme", positions: [1, 0, -1], repos: 0,
      cases: [[["P", "B"], ["A", "T"]], [], [["P", "A"], ["B", "T"]]], commande: "levier · 2 ressorts de centrage" },
    "43t": { nom: "4/3 centre tandem", court: "4/3 tandem", orifices: { T1: "T", A: "A", P: "P", B: "B", T2: "T" }, portees: "ferme", percage: true, positions: [1, 0, -1], repos: 0,
      cases: [[["P", "B"], ["A", "T"]], [["P", "T"]], [["P", "A"], ["B", "T"]]], commande: "2 électro-aimants · 2 ressorts" },
    "43o": { nom: "4/3 centre ouvert (en H)", court: "4/3 ouvert", orifices: { T1: "T", A: "A", P: "P", B: "B", T2: "T" }, portees: "ouvert", positions: [1, 0, -1], repos: 0,
      cases: [[["P", "B"], ["A", "T"]], [["P", "A", "B", "T"]], [["P", "A"], ["B", "T"]]], commande: "levier · 2 ressorts de centrage" },
    "43y": { nom: "4/3 centre flottant (en Y)", court: "4/3 flottant", orifices: { T1: "T", A: "A", P: "P", B: "B", T2: "T" }, portees: "flottant", positions: [1, 0, -1], repos: 0,
      cases: [[["P", "B"], ["A", "T"]], [["A", "B", "T"]], [["P", "A"], ["B", "T"]]], commande: "levier · 2 ressorts de centrage" },
    "42": { nom: "4/2", court: "4/2", orifices: { T1: "T", A: "B", P: "P", B: "A", T2: "T" }, portees: "ferme", positions: [1, -1], repos: -1,
      cases: [[["P", "A"], ["B", "T"]], [["P", "B"], ["A", "T"]]], commande: "électro-aimant · ressort" },
    "32": { nom: "3/2 normalement fermé", court: "3/2 NF", orifices: { P: "P", B: "A", T2: "T" }, portees: "ferme", positions: [1, -1], repos: -1,
      cases: [[["P", "A"]], [["A", "T"]]], commande: "bouton-poussoir · ressort" },
    "22": { nom: "2/2 normalement fermé", court: "2/2 NF", orifices: { P: "P", B: "A" }, portees: "ferme", positions: [1, -1], repos: -1,
      cases: [[["P", "A"]], []], commande: "électro-aimant · ressort" },
  };
  // portees deplacees du tiroir a la position s
  const porteesA = (type, s) => PORTEES[TYPES[type].portees].map(([a, b]) => [a + COURSE * s, b + COURSE * s]);
  // liaisons entre orifices a la position s (continue) : groupes d'orifices relies, ex. [["P","A"],["B","T"]]
  function liaisons(type, s) {
    const t = TYPES[type], L = porteesA(type, s), pere = {};
    const chef = c => pere[c] === c ? c : (pere[c] = chef(pere[c]));
    const unir = (a, b) => { pere[chef(a)] = chef(b); };
    ORDRE.forEach(c => pere[c] = c);
    for (let i = 0; i < ORDRE.length - 1; i++) {
      const g = CHAMBRES[ORDRE[i]][1], d = CHAMBRES[ORDRE[i + 1]][0];          // partie d'alesage ]g, d[
      if (!L.some(([a, b]) => a < d - 1e-9 && b > g + 1e-9)) unir(ORDRE[i], ORDRE[i + 1]);
    }
    if (t.percage && Math.abs(s) < 0.2) unir("P", "T1");                          // percage du tiroir tandem
    unir("T1", "T2");                                                              // les deux chambres T sont reliees par le corps
    const groupes = {};
    Object.keys(t.orifices).forEach(c => { const k = chef(c), n = t.orifices[c]; (groupes[k] = groupes[k] || new Set()).add(n); });
    return Object.values(groupes).map(g => [...g].sort(ordreOrifices)).filter(g => g.length > 1).sort((a, b) => ordreOrifices(a[0], b[0]));
  }
  const ordreOrifices = (a, b) => "PABT".indexOf(a) - "PABT".indexOf(b);
  const relies = (groupes, a, b) => groupes.some(g => g.includes(a) && g.includes(b));
  // case du symbole correspondant a la position s (indice), ou -1 entre deux cases
  function caseActive(type, s) { const P = TYPES[type].positions, q = P.findIndex(v => Math.abs(v - s) < 0.08); return q; }

  /* ================= 2) Verins ================= */
  const ETA_VE = 0.9;                                                              // rendement du verin (0,85 a 0,95)
  const aire = d_mm => Math.PI * (d_mm / 1000) ** 2 / 4;                           // m2
  // F en N (p en bar), v en m/s (Q en L/min)
  const force = (p, S, eta) => (eta === undefined ? ETA_VE : eta) * p * 1e5 * S;
  const vitesse = (Q, S) => Q / 60000 / S;
  const pressionPour = (F, S, eta) => F / ((eta === undefined ? ETA_VE : eta) * S) / 1e5;   // bar
  function verinDE(D, d) { const S = aire(D), s = aire(d); return { S, s, S2: S - s, phi: S / (S - s) }; }
  // Euler : diametre mini de tige (mm) pour un effort F (N), longueur libre Lf (m), securite k
  const dTigeMin = (F, Lf, k, E) => 1000 * Math.pow(64 * k * F * Lf * Lf / (Math.PI ** 3 * (E || 210e9)), 0.25);

  /* ================= 3) Pompes ================= */
  // Engrenages exterieurs (formule du cours) : Q = b w m2 (z + 1 - cos2(alpha)/12)
  const ENGR = { b: 20, m: 2, z: 12, alpha: 20 };                                  // mm, mm, -, degres
  function cylEngrenages(g) { g = g || ENGR; const c = Math.cos(g.alpha * Math.PI / 180); return 2 * Math.PI * (g.b / 10) * (g.m / 10) ** 2 * (g.z + 1 - c * c / 12); }
  // Palettes : Cyl = 2 b n e D sin(pi/n)  (cm3/tr avec les longueurs en cm)
  const PAL = { b: 20, n: 5, D: 120 };                                             // mm
  const cylPalettes = (e_mm, g) => { g = g || PAL; return 2 * (g.b / 10) * g.n * (e_mm / 10) * (g.D / 10) * Math.sin(Math.PI / g.n); };
  // Pistons axiaux : Cyl = 2 n S R tan(alpha)  (Q = n S R w tan(alpha) / pi)
  const PIST = { n: 9, S: 2, R: 3 };                                               // -, cm2, cm
  const cylPistons = (alpha_deg, g) => { g = g || PIST; return 2 * g.n * g.S * g.R * Math.tan(alpha_deg * Math.PI / 180); };
  // fuites internes proportionnelles a la pression (L/min par bar) et rendement mecanique, d'apres les exercices 4 et 5
  const POMPES = {
    engrenages: { nom: "à engrenages extérieurs", fuite: 0.008, etaM: 0.85, Nmax: 3500, pmax: 200 },
    palettes: { nom: "à palettes", fuite: 0.041, etaM: 0.899, Nmax: 3000, pmax: 280 },
    pistons: { nom: "à pistons axiaux", fuite: 0.0161, etaM: 0.913, Nmax: 3000, pmax: 350 },
  };
  // bilan d'une pompe : Cyl (cm3/tr), N (tr/min), p (bar)
  function bilanPompe(sorte, Cyl, N, p) {
    const K = POMPES[sorte], Qth = Math.abs(Cyl) * N / 1000, Qf = Qth > 0 ? Math.min(Qth, K.fuite * p) : 0, Qr = Qth - Qf;
    const etaV = Qth > 0 ? Qr / Qth : 0, Ph = p * Qr / 600, C = Math.abs(Cyl) * p / (62.8 * K.etaM), Pm = C * 2 * Math.PI * N / 60 / 1000;
    return { Qth, Qf, Qr, etaV, Ph, C, Pm, etaM: K.etaM, etaG: Pm > 0 ? Ph / Pm : 0 };
  }

  /* ================= 4) Accumulateur a gaz ================= */
  // p V^n = p0 V0^n (n = 1 isotherme, 1,4 adiabatique) ; pressions du cours (bar), volumes en L
  const volumeGaz = (V0, p0, p, n) => p <= p0 ? V0 : V0 * Math.pow(p0 / p, 1 / n);
  const pressionGaz = (V0, p0, Vg, n) => p0 * Math.pow(V0 / Vg, n);
  const volumeUtile = (V0, p0, p1, p2, n) => volumeGaz(V0, p0, p1, n) - volumeGaz(V0, p0, p2, n);
  // V0 necessaire pour restituer dV entre p2 et p1
  const V0pour = (dV, p0, p1, p2, n) => dV / (Math.pow(p0 / p1, 1 / n) - Math.pow(p0 / p2, 1 / n));
  const ACCUS = {
    vessie: { nom: "à vessie", V0: 20, rapport: 4, emploi: "le plus utilisé : grands volumes, réponse rapide" },
    piston: { nom: "à piston", V0: 20, rapport: 10, emploi: "grands rapports de pression, mais frottement et inertie du piston" },
    membrane: { nom: "à membrane", V0: 4, rapport: 8, emploi: "petits volumes : amortir les pulsations, compenser les fuites" },
  };

  /* ================= 5) Filtres ================= */
  // rapport beta (ISO 16889) : beta_x = N_amont(>= x um) / N_aval(>= x um) ; efficacite relative eta_x = 1 - 1/beta_x
  const efficacite = b => 1 - 1 / b;
  const betaPour = eta => 1 / (1 - eta);
  // elements filtrants. Modele (hors cours) : log10 beta(x) = log10(beta_r) (x / x_r)^1,6 ; Dp propre a 60 L/min (bar) ; capacite de retention relative
  const ELEMENTS = {
    crepine: { nom: "Crépine (toile 125 µm)", court: "Crépine 125 µm", xr: 125, br: 2, dp60: 0.02, capa: 4, teinte: 0xB8BEC6 },
    cellulose: { nom: "Cellulose 25 µm", court: "Cellulose 25 µm", xr: 25, br: 2, dp60: 0.25, capa: 0.6, teinte: 0xE8D9B5 },
    fv10: { nom: "Fibre de verre 10 µm", court: "Fibre de verre 10 µm", xr: 10, br: 200, dp60: 0.5, capa: 1, teinte: 0xF1D36B },
    fv3: { nom: "Fibre de verre 3 µm", court: "Fibre de verre 3 µm", xr: 3, br: 200, dp60: 0.9, capa: 0.8, teinte: 0xF4E3A0 },
  };
  const K_BETA = 1.6, BETA_MAX = 1e6;
  // beta cumule a la taille x ; deg < 1 : beta degrade (le cours : beta varie avec la pression d'utilisation, diminue au colmatage)
  const betaElement = (cle, x, deg) => { const e = ELEMENTS[cle]; return Math.min(BETA_MAX, Math.pow(10, Math.log10(e.br) * Math.pow(x / e.xr, K_BETA) * (deg === undefined ? 1 : deg))); };
  // pollution de reference (huile neuve d'un circuit pollue) : N(>= x) dans 100 mL = 100 000 (10 / x)^2,69 -> code ISO 4406 21/19/16
  const N_REF = (x) => 1e5 * Math.pow(10 / x, 2.69);
  // tailles des compteurs (um(c)) et classes fines entre elles
  const TAILLES = [4, 6, 10, 14, 21, 38, 70];
  const BORDS = (() => { const b = [], T = TAILLES.concat([100]); for (let i = 0; i < T.length - 1; i++) for (let k = 0; k < 8; k++) b.push(T[i] * Math.pow(T[i + 1] / T[i], k / 8)); b.push(100); return b; })();
  const CLASSES = BORDS.slice(0, -1).map((a, i) => ({ a, b: BORDS[i + 1], s: Math.sqrt(a * BORDS[i + 1]) })).concat([{ a: 100, b: Infinity, s: 120 }]);
  const pollutionRef = () => CLASSES.map(c => N_REF(c.a) - (isFinite(c.b) ? N_REF(c.b) : 0));
  // fraction qui traverse l'element, classe par classe, calee pour que beta cumule = beta du modele sur la pollution de reference
  function passages(cle, deg) {
    const U = CLASSES.map(c => N_REF(c.a)), D = CLASSES.map(c => N_REF(c.a) / betaElement(cle, c.a, deg));
    return CLASSES.map((c, i) => { const n = U[i] - (U[i + 1] || 0), d = D[i] - (D[i + 1] || 0); return n > 0 ? Math.max(0, Math.min(1, d / n)) : 0; });
  }
  // comptages cumules (>= chaque taille de compteur) d'une repartition par classes
  const cumul = n => TAILLES.map(x => CLASSES.reduce((s, c, i) => s + (c.a >= x - 1e-9 ? n[i] : 0), 0));
  // ISO 4406 : nombre de particules par mL -> code (bornes superieures de chaque code)
  const ISO_MAX = [0.01, 0.02, 0.04, 0.08, 0.16, 0.32, 0.64, 1.3, 2.5, 5, 10, 20, 40, 80, 160, 320, 640, 1300, 2500, 5000, 10000, 20000, 40000, 80000, 160000, 320000, 640000, 1300000, 2500000];
  const codeISO = parML => { for (let r = 0; r < ISO_MAX.length; r++) if (parML <= ISO_MAX[r]) return r; return ISO_MAX.length; };
  const codeISO4406 = N100 => [4, 6, 14].map(x => codeISO(N100[TAILLES.indexOf(x)] / 100)).join("/");     // N100 : cumuls dans 100 mL
  // perte de charge de l'element (bar) : proportionnelle au debit, croit avec le colmatage c (0 a 1)
  const dpElement = (cle, Q, c) => ELEMENTS[cle].dp60 * Q / 60 / Math.pow(1 - Math.min(c, 0.97), 2);
  const DP_INDIC = 2.5, DP_BYPASS = 3.5;                                            // indicateur de colmatage et tarage du by-pass (bar)
  // by-pass : il limite la perte de charge a son tarage ; la part du debit qui le traverse n'est pas filtree
  const partBypass = dpEl => dpEl > DP_BYPASS ? 1 - DP_BYPASS / dpEl : 0;
  // degradation de beta avec la perte de charge (au-dela de 1 bar)
  const degradation = dp => 1 - 0.3 * Math.pow(Math.max(0, Math.min(1, (dp - 1) / (DP_BYPASS - 1))), 2);
  // nettoyage hors-ligne d'un reservoir bien melange (exercice 2) : C(t) = C0 exp(-eta Q t / V)
  const concentration = (C0, eta, Q, V, t) => C0 * Math.exp(-eta * Q * t / V);
  const tempsPour = (frac, eta, Q, V) => -Math.log(frac) * V / (eta * Q);

  function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  const api = { CHAMBRES, ORDRE, COURSE, PORTEES, TYPES, porteesA, liaisons, relies, caseActive,
    ETA_VE, aire, force, vitesse, pressionPour, verinDE, dTigeMin,
    ENGR, PAL, PIST, POMPES, cylEngrenages, cylPalettes, cylPistons, bilanPompe,
    volumeGaz, pressionGaz, volumeUtile, V0pour, ACCUS, gauss,
    efficacite, betaPour, ELEMENTS, betaElement, N_REF, TAILLES, CLASSES, pollutionRef, passages, cumul, codeISO, codeISO4406, dpElement, DP_INDIC, DP_BYPASS, partBypass, degradation, concentration, tempsPour };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else racine.HYD = api;
})(this);
