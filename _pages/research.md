---
layout: single
title: "Recherche"
permalink: /research/
author_profile: true
toc: true
toc_label: "Thématiques"
toc_icon: "flask"
---

<div class="research-hero">
  <p>
    Mes activités de recherche s'articulent autour de trois axes majeurs : la <strong>simulation numérique avancée des structures composites</strong>, la <strong>modélisation des matériaux à gradients fonctionnels (FGM)</strong>, et l'<strong>intelligence artificielle appliquée à la mécanique des structures</strong>. Ces axes convergent vers le développement de méthodes numériques de pointe pour l'analyse et l'optimisation des structures mécaniques à hautes performances.
  </p>
  <div class="research-metrics">
    <span>📄 5 articles publiés</span>
    <span>🏆 4 revues Q1</span>
    <span>🌍 8 conférences internationales</span>
    <span>🤝 Collaboration Maroc–Turquie</span>
  </div>
</div>

---

## Axe 1 — Matériaux à Gradients Fonctionnels (FGM)

<div class="research-axis">
  <div class="axis-visual">
    <div class="axis-num">01</div>
  </div>
  <div class="axis-content">
    <p>
      Les <strong>matériaux à gradients fonctionnels (FGM)</strong> constituent l'axe central de mes recherches. Ces matériaux innovants présentent une variation continue de composition à travers l'épaisseur, éliminant les concentrations de contraintes aux interfaces présentes dans les matériaux stratifiés conventionnels. Mes travaux couvrent spécifiquement :
    </p>
    <div class="research-topics">
      <div class="topic">
        <h4>🔬 Vibrations libres et forcées des plaques FGM poreuses</h4>
        <p>Développement de formulations éléments finis basées sur la TSDT pour l'analyse des vibrations libres de plaques FGM présentant différentes distributions de porosité (uniforme, linéaire, non linéaire). Étude paramétrique complète : indice de gradient, taux de porosité, conditions aux limites, rapport d'aspect.</p>
        <div class="topic-refs"><span>→ [J2], [J4], [J5]</span></div>
      </div>
      <div class="topic">
        <h4>🧪 Comportement viscoélastique non linéaire</h4>
        <p>Modélisation du comportement viscoélastique non linéaire des plaques FGM poreuses sous chargements dynamiques harmoniques. Caractérisation de l'amortissement hystérétique, analyse de l'influence de la porosité et du gradient fonctionnel sur la réponse en fréquences.</p>
        <div class="topic-refs"><span>→ [J3], [J1]</span></div>
      </div>
      <div class="topic">
        <h4>🏥 Applications biomédicales — Absorption d'énergie</h4>
        <p>Étude de la capacité d'absorption d'énergie lors d'impacts progressifs des plaques FGM poreuses viscoélastiques. Applications à la nouvelle génération de biomatériaux pour les systèmes biomédicaux (implants, prothèses, dispositifs de protection).</p>
        <div class="topic-refs"><span>→ [J6 — en cours], [C1]</span></div>
      </div>
    </div>
    <div class="methods-row">
      <strong>Méthodes :</strong>
      <span class="m-tag">MEF</span><span class="m-tag">TSDT</span><span class="m-tag">MAN</span><span class="m-tag">Newton-Raphson</span><span class="m-tag">Continuation</span><span class="m-tag">Théorie de von Kármán</span>
    </div>
  </div>
</div>

---

## Axe 2 — Dynamique Non Linéaire des Structures Composites Hybrides

<div class="research-axis">
  <div class="axis-visual">
    <div class="axis-num">02</div>
  </div>
  <div class="axis-content">
    <p>
      L'analyse de la <strong>réponse dynamique non linéaire</strong> des structures composites hybrides constitue le cœur de ma thèse de doctorat (ENSAM Casablanca, 2021–2024, mention Très Honorable avec Félicitations). Les non-linéarités géométriques (grandes déformations de von Kármán) et matérielles (viscoélasticité, amortissement non linéaire) sont traitées simultanément pour reproduire fidèlement le comportement réel des structures sous chargements sévères.
    </p>
    <div class="research-topics">
      <div class="topic">
        <h4>📊 Analyse fréquentielle non linéaire</h4>
        <p>Calcul des courbes amplitude-fréquence des structures composites hybrides. Identification des phénomènes de saut, des bifurcations et des comportements de type hardening/softening. Méthode asymptotique numérique (MAN) couplée à la MEF pour une résolution efficace.</p>
        <div class="topic-refs"><span>→ [J3], [J4]</span></div>
      </div>
      <div class="topic">
        <h4>🔗 Couplage flexion-membrane</h4>
        <p>Modélisation du couplage géométrique non linéaire entre les modes de flexion et les modes membranaires dans les plaques minces. Formulation variationelle et discrétisation éléments finis compatibles avec les grandes déformations.</p>
      </div>
      <div class="topic">
        <h4>⚡ Amortissement visqueux non linéaire</h4>
        <p>Développement de modèles d'amortissement non linéaires pour les matériaux FGM viscoélastiques. Identification des paramètres d'amortissement et validation expérimentale.</p>
        <div class="topic-refs"><span>→ [J7 — en cours]</span></div>
      </div>
    </div>
  </div>
</div>

---

## Axe 3 — Intelligence Artificielle Appliquée à la Mécanique

<div class="research-axis">
  <div class="axis-visual">
    <div class="axis-num">03</div>
  </div>
  <div class="axis-content">
    <p>
      Mon axe transversal de recherche porte sur l'intégration de l'<strong>intelligence artificielle</strong> dans les workflows de simulation mécanique. Les modèles de substitution (surrogate models) permettent de créer des équivalents numériques ultra-rapides des simulations éléments finis coûteuses.
    </p>
    <div class="research-topics">
      <div class="topic">
        <h4>🧠 Réseaux LSTM pour la prédiction dynamique</h4>
        <p>Architecture LSTM (Long Short-Term Memory) entraînée sur des bases de données de simulations MEF pour prédire le comportement dynamique non linéaire de plaques FGM en une fraction du temps de calcul. Précision supérieure à 99% comparée aux simulations de référence.</p>
        <div class="topic-refs"><span>→ [J1]</span></div>
      </div>
      <div class="topic">
        <h4>📐 ANN pour l'optimisation structurale</h4>
        <p>Réseaux de neurones artificiels multicouches (MLP) comme surrogate models pour l'optimisation des paramètres structuraux des plaques FGM. Couplage ANN + TSDT : les ANN remplacent le solveur MEF dans la boucle d'optimisation, réduisant le temps de calcul de plusieurs ordres de grandeur.</p>
        <div class="topic-refs"><span>→ [J2]</span></div>
      </div>
      <div class="topic">
        <h4>📊 Clustering et caractérisation des matériaux</h4>
        <p>Application des algorithmes de clustering (k-means, fuzzy c-means, clustering hiérarchique) à la caractérisation et à la classification des comportements mécaniques des matériaux composites. Travaux présentés sur Medium (2021).</p>
        <div class="topic-refs"><span>→ Articles Medium (2021)</span></div>
      </div>
    </div>
    <div class="methods-row">
      <strong>Outils :</strong>
      <span class="m-tag">TensorFlow</span><span class="m-tag">MATLAB DL Toolbox</span><span class="m-tag">Python/scikit-learn</span><span class="m-tag">PyTorch</span><span class="m-tag">NumPy/SciPy</span>
    </div>
  </div>
</div>

---

## Projets de Recherche

<div class="projects-research-grid">

  <div class="proj-card active-proj">
    <div class="proj-status">🟢 En cours</div>
    <div class="proj-period">2023 → En cours</div>
    <h4>Projet MY MDO — TechTransfer</h4>
    <p class="proj-part">Partenariat académique-industriel · Transfert de Technologie</p>
    <p>Membre actif du projet TechTransfer pour la <strong>conception et le développement d'une plateforme dédiée à la conception et à l'optimisation des formes</strong>. Objectif : outils numériques combinant optimisation topologique, simulation MEF et interfaces web modernes accessibles aux ingénieurs.</p>
    <div class="proj-tags"><span>Optimisation topologique</span><span>MEF</span><span>Plateforme web</span><span>TechTransfer</span></div>
  </div>

  <div class="proj-card done-proj">
    <div class="proj-status">✅ Terminé</div>
    <div class="proj-period">2023 — 2024</div>
    <h4>Projet Bilatéral Maroc–Turquie</h4>
    <p class="proj-part">Coopération internationale · Université Hassan II & Partenaire turc</p>
    <p>Collaboration scientifique internationale sur l'<strong>analyse par éléments finis de la dynamique des structures composites hybrides</strong>. Développement de modèles numériques partagés, publications conjointes dans des revues Q1 internationales.</p>
    <div class="proj-tags"><span>Collaboration internationale</span><span>Composites hybrides</span><span>MEF dynamique</span><span>Publications Q1</span></div>
  </div>

  <div class="proj-card done-proj">
    <div class="proj-status">✅ Terminé</div>
    <div class="proj-period">2024 — 2025</div>
    <h4>OpenSolver — Projet CITT12-2024</h4>
    <p class="proj-part">Centre d'Innovation et de Transfert de Technologie</p>
    <p>Développement d'<strong>OpenSolver</strong> : un solveur éléments finis open source clé-en-main, entièrement documenté, destiné aux étudiants en ingénierie et chercheurs. Interface intuitive, exemples guidés, documentation pédagogique complète.</p>
    <div class="proj-tags"><span>Open Source</span><span>MEF</span><span>Python</span><span>MATLAB</span><span>Pédagogie</span></div>
  </div>

</div>

---

## Collaborateurs & Réseaux

<div class="collab-section">
  <p>Je collabore activement avec des chercheurs nationaux et internationaux dans le cadre de mes travaux sur les matériaux composites FGM et les méthodes numériques avancées.</p>

  <div class="collab-grid">
    <div class="collab-item">
      <strong>🇹🇷 Turquie</strong>
      <p>Collaboration bilatérale Maroc–Turquie (2023–2024) sur la dynamique des structures composites hybrides.</p>
    </div>
    <div class="collab-item">
      <strong>🇲🇦 Maroc — ENSAM / FSTM</strong>
      <p>Équipe de recherche en Génie Mécanique, Université Hassan II — Modélisation numérique et matériaux composites.</p>
    </div>
    <div class="collab-item">
      <strong>📚 Réseau académique</strong>
      <p>Co-auteur avec Saad Hassouna (CRC Press, 2022). Partenariats de publication internationale.</p>
    </div>
  </div>
</div>
