# Google Analytics et Search Console

Le frontend envoie les pages vues et événements uniquement après le consentement « Mesure d’audience ». Le backend n'expose jamais les secrets OAuth : il les utilise seulement pour alimenter le tableau d'administration.

Ajoutez ces valeurs dans le fichier `.env` du serveur, puis reconstruisez les conteneurs :

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
GA4_PROPERTY_ID=123456789
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
# Facultatif, pour la partie Search Console du dashboard
GSC_SITE_URL=https://www.afroflix-tv.com/
```

Activez **Google Analytics Data API** dans le projet Google Cloud. Pour Search Console, activez également **Google Search Console API** et vérifiez que le compte ayant délivré le refresh token a accès à la propriété.

Après une modification des variables frontend ou AdSense, reconstruisez le frontend afin que les valeurs publiques soient intégrées :

```bash
docker compose up -d --build frontend backend
```

`GA4_MEASUREMENT_ID` et l'identifiant AdSense sont publics. Ne placez jamais `GOOGLE_CLIENT_SECRET` ou `GOOGLE_REFRESH_TOKEN` dans une variable `VITE_*`, dans le dépôt ou dans le navigateur.

L'application mesure notamment `page_view`, `view_item` (fiche film), `video_start`, `search`, `select_content`, `login`, `sign_up`, `add_to_wishlist`, `remove_from_wishlist` et les clics vers une vidéo officielle. Déclarez les événements dont vous voulez faire des conversions dans l'interface GA4.

## ads.txt

Le build remplace automatiquement l'identifiant d'exemple dans `ads.txt` par `VITE_GOOGLE_ADSENSE_CLIENT_ID`. Après déploiement, contrôlez `https://www.afroflix-tv.com/ads.txt` : il doit contenir une ligne `google.com, ca-pub-..., DIRECT, f08c47fec0942fa0`.
