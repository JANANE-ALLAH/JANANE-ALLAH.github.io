// noyau.js : le code MATLAB du TP5 (poisson2d, poisson2d_isole, poisson2d_isole_faux, sor, erreur_manufacturee)
// porte en JavaScript, ligne pour ligne. Les jeux calculent tous leurs nombres avec ces fonctions.
(function (racine) {
  "use strict";

  // Numerotation du TP : k = (j - 1)*nx + i, i et j commencent a 1 (k aussi).
  function numero(i, j, nx) { return (j - 1) * nx + i; }

  // [A, b] = poisson2d(Nx, Ny, hx, hy, bc, g) et ses deux variantes.
  //   mode "dirichlet" : quatre murs imposes, (Nx-1)*(Ny-1) inconnues ;
  //   mode "isole"     : mur du bas isole par noeud fictif, la rangee du mur devient inconnue, (Nx-1)*Ny inconnues ;
  //   mode "faux"      : le piege, doublement sur la premiere rangee interieure, (Nx-1)*(Ny-1) inconnues.
  //   bc = [gauche droite bas haut] ; g(i, j) = second membre (0 par defaut) ;
  //   options.bug = "mur_oublie" | "signe_mur" : erreurs d'assemblage volontaires (jeu du detective).
  // A est rendue ligne par ligne : lignes[k-1] = { c: [colonnes, base 1], v: [valeurs] }.
  function assembler(Nx, Ny, hx, hy, bc, mode, g, options) {
    mode = mode || "dirichlet";
    var bug = (options && options.bug) || "";
    var nx = Nx - 1, ny = mode === "isole" ? Ny : Ny - 1, n = nx * ny;
    var ax = 1 / (hx * hx), ay = 1 / (hy * hy);
    var lignes = [], b = new Float64Array(n);
    for (var j = 1; j <= ny; j++) {
      for (var i = 1; i <= nx; i++) {
        var k = numero(i, j, nx), L = { c: [k], v: [2 * ax + 2 * ay] };
        b[k - 1] = g ? g(i, j) : 0;
        if (i > 1) { L.c.push(numero(i - 1, j, nx)); L.v.push(-ax); }
        else b[k - 1] += (bug === "signe_mur" ? -1 : 1) * bc[0] * ax;
        if (i < nx) { L.c.push(numero(i + 1, j, nx)); L.v.push(-ax); }
        else if (bug !== "mur_oublie") b[k - 1] += bc[1] * ax;
        if (mode === "dirichlet") {
          if (j > 1) { L.c.push(numero(i, j - 1, nx)); L.v.push(-ay); } else b[k - 1] += bc[2] * ay;
          if (j < ny) { L.c.push(numero(i, j + 1, nx)); L.v.push(-ay); } else b[k - 1] += bc[3] * ay;
        } else if (j === 1) {
          L.c.push(numero(i, j + 1, nx)); L.v.push(-2 * ay);
        } else {
          L.c.push(numero(i, j - 1, nx)); L.v.push(-ay);
          if (j < ny) { L.c.push(numero(i, j + 1, nx)); L.v.push(-ay); } else b[k - 1] += bc[3] * ay;
        }
        lignes.push(L);
      }
    }
    return { n: n, nx: nx, ny: ny, lignes: lignes, b: b, mode: mode };
  }

  function nnz(S) { return S.lignes.reduce(function (s, L) { return s + L.c.length; }, 0); }

  // norm(A - A', 1) : plus grande somme, par colonne, des |A(i,j) - A(j,i)|.
  function asymetrie(S) {
    var dict = {}, col = new Float64Array(S.n);
    S.lignes.forEach(function (L, r) { L.c.forEach(function (c, q) { dict[(r + 1) + "," + c] = L.v[q]; }); });
    S.lignes.forEach(function (L, r) {
      L.c.forEach(function (c, q) {
        var t = dict[c + "," + (r + 1)] || 0;
        col[c - 1] += Math.abs(L.v[q] - t);
        if (!((c + "," + (r + 1)) in dict)) col[r] += Math.abs(L.v[q]);
      });
    });
    return Math.max.apply(null, Array.prototype.slice.call(col));
  }

  // T = A \ b : elimination de Gauss dans la bande (demi-largeur nx), sans pivotage :
  // la matrice est a diagonale dominante, aucun pivot ne s'annule.
  function resoudre(S) {
    var n = S.n, p = S.nx, W = 2 * p + 1, a = new Float64Array(n * W), x = Float64Array.from(S.b);
    S.lignes.forEach(function (L, r) { L.c.forEach(function (c, q) { a[r * W + (c - 1 - r + p)] += L.v[q]; }); });
    for (var k = 0; k < n; k++) {
      var piv = a[k * W + p], fin = Math.min(n - 1, k + p);
      for (var i = k + 1; i <= fin; i++) {
        var f = a[i * W + (k - i + p)] / piv;
        if (f === 0) continue;
        for (var j = k; j <= fin; j++) a[i * W + (j - i + p)] -= f * a[k * W + (j - k + p)];
        x[i] -= f * x[k];
      }
    }
    for (var r = n - 1; r >= 0; r--) {
      var s = x[r];
      for (var c = r + 1; c <= Math.min(n - 1, r + p); c++) s -= a[r * W + (c - r + p)] * x[c];
      x[r] = s / a[r * W + p];
    }
    return x;
  }

  // [x, k] = sor(A, b, w, tol, nmax) ; w = 1 : Gauss-Seidel. Depart x = 0, arret quand ||x - xancien|| < tol.
  // suivi(x, k, ecart) est appele apres chaque balayage (animation) ; il peut renvoyer false pour arreter.
  function sor(S, w, tol, nmax, suivi) {
    var n = S.n, x = new Float64Array(n), ancien = new Float64Array(n), k, ecart = Infinity;
    var diag = S.lignes.map(function (L) { return L.v[0]; });
    for (k = 1; k <= nmax; k++) {
      ancien.set(x);
      for (var i = 0; i < n; i++) {
        var L = S.lignes[i], s = S.b[i];
        for (var q = 1; q < L.c.length; q++) s -= L.v[q] * x[L.c[q] - 1];
        x[i] = (1 - w) * x[i] + w * s / diag[i];
      }
      var e = 0;
      for (i = 0; i < n; i++) e += (x[i] - ancien[i]) * (x[i] - ancien[i]);
      ecart = Math.sqrt(e);
      if (suivi && suivi(x, k, ecart) === false) break;
      if (!(ecart < Infinity)) break;  // divergence : inutile de continuer jusqu'a nmax
      if (ecart < tol) break;
    }
    return { x: x, k: Math.min(k, nmax), converge: ecart < tol, ecart: ecart };
  }

  // Rayon spectral de la matrice de Jacobi du probleme de Dirichlet (formule exacte pour hx = hy)
  // et omega optimal de Young.
  function rhoJacobi(Nx, Ny) { return (Math.cos(Math.PI / Nx) + Math.cos(Math.PI / Ny)) / 2; }
  function omegaOptimal(rho) { return 2 / (1 + Math.sqrt(1 - rho * rho)); }

  // err = erreur_manufacturee(N) : u = (x^2-1)^2 (y^2-1)^2 sur [-1, 1]^2.
  // options.decalage = 1 reproduit l'erreur d'indice xg = -1 + (0:N-2)*h (jeu du detective).
  function erreurManufacturee(N, options) {
    var d = (options && options.decalage) || 0;
    var uex = function (x, y) { return Math.pow(x * x - 1, 2) * Math.pow(y * y - 1, 2); };
    var fman = function (x, y) { return (12 * x * x - 4) * Math.pow(y * y - 1, 2) + Math.pow(x * x - 1, 2) * (12 * y * y - 4); };
    var h = 2 / N, xg = [];
    for (var m = 1; m <= N - 1; m++) xg.push(-1 + (m - d) * h);
    var S = assembler(N, N, h, h, [0, 0, 0, 0], "dirichlet", function (i, j) { return -fman(xg[i - 1], xg[j - 1]); });
    var T = resoudre(S), err = 0;
    for (var j = 1; j <= N - 1; j++)
      for (var i = 1; i <= N - 1; i++)
        err = Math.max(err, Math.abs(T[numero(i, j, N - 1) - 1] - uex(-1 + i * h, -1 + j * h)));
    return err;
  }

  // p = polyfit(log(hs), log(err), 1) : pente de la droite des moindres carres.
  function pente(hs, errs) {
    var X = hs.map(Math.log), Y = errs.map(Math.log), n = X.length;
    var mx = X.reduce(function (a, b) { return a + b; }) / n, my = Y.reduce(function (a, b) { return a + b; }) / n;
    var sxy = 0, sxx = 0;
    for (var q = 0; q < n; q++) { sxy += (X[q] - mx) * (Y[q] - my); sxx += (X[q] - mx) * (X[q] - mx); }
    return [sxy / sxx, my - sxy / sxx * mx];
  }

  function stats(T) {
    var mn = Infinity, mx = -Infinity, s = 0;
    for (var q = 0; q < T.length; q++) { mn = Math.min(mn, T[q]); mx = Math.max(mx, T[q]); s += T[q]; }
    return { min: mn, max: mx, moy: s / T.length };
  }

  var api = { numero: numero, assembler: assembler, nnz: nnz, asymetrie: asymetrie, resoudre: resoudre, sor: sor,
              rhoJacobi: rhoJacobi, omegaOptimal: omegaOptimal, erreurManufacturee: erreurManufacturee,
              pente: pente, stats: stats };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else racine.TP5 = api;
})(this);
