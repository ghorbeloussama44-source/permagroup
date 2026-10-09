# SEO — préparation et jour du lancement

## Où on en est (pré-lancement)

Le site est **volontairement invisible** des moteurs de recherche tant que le domaine officiel n'est pas branché :

- chaque page porte `<meta name="robots" content="noindex, nofollow">` ;
- `robots.txt` contient `Disallow: /`.

Tout le reste est déjà en place et pointe vers `https://perma.doctor` :

| Élément | Détail |
|---|---|
| URL d'origine conservées | Les 21 noms de fichiers de l'ancien site sont gardés à l'identique (`permaface.html`, `docteurwalidbalti.html`…). Les liens et l'historique de 2020 restent valables. |
| Titres et descriptions | Repris de l'ancien site, page par page. |
| Canonical + hreflang `fr` | Une URL canonique absolue par page. |
| Open Graph / Twitter | Titre, description et image 1200×630 par page (`static/img/og/`). |
| Données structurées (JSON-LD) | `MedicalBusiness` (Permagroup), `WebSite`, `BreadcrumbList`, `MedicalProcedure` (33 procédures), `Person` (8 praticiens + diplômes), `FAQPage` (séjour). |
| Sitemap | `sitemap.xml`, 21 URL, régénéré à chaque build. |
| Structure | Un seul `<h1>` par page, fil d'Ariane, attributs `alt` sur les images, `lang="fr"`. |

## Le jour J (domaine acheté)

1. Dans `tools/build_pages.py` : `SEO_LIVE = True` (et vérifier `DOMAIN`).
2. `python3 tools/build_pages.py` → les `noindex` disparaissent, `robots.txt` s'ouvre et déclare le sitemap.
3. Brancher le domaine sur l'hébergement, forcer **HTTPS** et choisir une seule version (`perma.doctor` **sans** `www`, avec redirection 301 de `www` vers la racine).
4. **Google Search Console** : ajouter la propriété « Domaine » `perma.doctor` (vérification DNS), soumettre `https://perma.doctor/sitemap.xml`, demander l'indexation de l'accueil et des 8 pôles.
5. **Bing Webmaster Tools** : importer depuis Search Console.
6. **Fiche Google Business Profile** « Permagroup » à l'adresse d'Ariana, avec le même nom, téléphone et adresse (NAP) que le site.

## Récupérer l'ancien référencement (2020)

Le domaine a été indexé il y a environ 6 ans. Pour récupérer ce capital :

- **Lister les anciennes URL** : https://web.archive.org/web/*/perma.doctor/* (non accessible depuis notre environnement de travail). Toute URL qui n'existe plus doit recevoir une **redirection 301** vers la page équivalente (par exemple, une ancienne page de procédure vers le pôle correspondant).
- Dans Search Console, au bout de quelques jours : rapport **Pages › Introuvable (404)** → ajouter les 301 manquantes.
- Vérifier les **backlinks** encore actifs (Search Console › Liens, ou Ahrefs Webmaster Tools gratuit) et contacter les sites qui pointent vers d'anciennes pages.
- Le domaine a pu expirer ou être réutilisé entre-temps : vérifier dans Search Console qu'il n'y a **aucune action manuelle** ni problème de sécurité.

## À décider (contenu)

- **Titres trop longs** sur les profils médecins (jusqu'à 86 caractères ; Google en affiche environ 60). Proposition : `Dr Prénom Nom — Spécialité | Perma.doctor`.
- **Descriptions** : plusieurs dépassent 155 caractères (pôles Teeth, Face, Breast) et seront coupées.
- **Mots-clés cibles** à valider, par pôle : « rhinoplastie Tunisie prix », « augmentation mammaire Tunisie », « greffe de cheveux Tunisie », « sleeve gastrectomie Tunisie », « facettes dentaires Tunisie »…
- **Avis patients** : les étoiles dans Google ne peuvent venir que de vrais avis (Google Business Profile, Trustpilot). Aucun avis inventé.
- **Contenu santé (YMYL)** : Google exige une expertise visible. Il faut ajouter, pour chaque page procédure, le nom du chirurgien relecteur et la date de mise à jour.
