# Taller 5 — Càrrega cognitiva

Aplicació web en català basada en `Plantilla Taller 5.xlsx`.

## Funcionalitat

- Cada grup escull fins a deu estratègies per categoria, en dos blocs: observades i propostes de millora.
- Tres desplaçadors de 0 a 100, sense puntuació automàtica de les estratègies.
- Triangle individual del grup i triangle global amb la **mitjana aritmètica** de les puntuacions de cada grup.
- Un registre per grup i cas (els reenviaments substitueixen la resposta anterior).
- Vista del professorat, creació de casos, consulta d'estratègies i exportació CSV.

## Publicació a GitHub Pages

1. Entra al teu compte de GitHub i crea un repositori nou, per exemple `taller-carrega-cognitiva` (públic).
2. A **Add file > Upload files**, puja `index.html`, `app.js`, `strategies.json` i `firebase-config.js` a l'arrel. Fes **Commit changes**.
3. A **Settings > Pages**, selecciona **Deploy from a branch**, branca **main**, carpeta **/(root)** i desa.
4. Espera la publicació i obre `https://EL_TEU_USUARI.github.io/taller-carrega-cognitiva/`.
5. Sense Firebase, funciona només com a demostració local; les respostes no es comparteixen entre dispositius.

## Configuració de Firebase (per compartir respostes en temps real)

1. A https://console.firebase.google.com/ crea un projecte Firebase.
2. A **Build > Firestore Database**, crea una base de dades. Tria una regió i configura les regles abans de compartir l'enllaç.
3. A **Project settings > Your apps**, afegeix una aplicació **Web**. Copia l'objecte `firebaseConfig` (apiKey, authDomain, projectId, appId, etc.).
4. Edita `firebase-config.js` a GitHub i substitueix `null` per l'objecte de configuració. Desa amb **Commit changes**.
5. A Firestore, a la pestanya **Rules**, per a una prova curta de classe pots utilitzar aquestes regles temporals (substitueix `AAAA-MM-DD` per una data futura pròxima, per exemple l'endemà del taller):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /taller5/{document=**} {
      allow read, write: if request.time < timestamp.date(AAAA, MM, DD);
    }
  }
}
```

**IMPORTANT:** aquestes regles són obertes i només adequades per a una demostració controlada i temporal, sense dades personals. Qualsevol persona amb la configuració del projecte pot llegir, alterar o esborrar respostes mentre estiguin actives. No les utilitzis per a una publicació permanent. Per a ús recurrent cal implementar autenticació anònima i regles per rols (professorat/grups), o una capa de servidor. No hi ha control d'accés real al panell del professorat en aquesta versió.

6. Torna a carregar la web en dos dispositius diferents i comprova que una valoració enviada apareix al panell global.

## Edició posterior

- Canvia els textos de les estratègies a `strategies.json`.
- Canvia la presentació a `index.html`.
- Canvia els càlculs i el gràfic a `app.js`.
- El triangle és un perfil descriptiu de tres dimensions, **no** una mesura validada de saturació de memòria de treball.

## Limitacions de la primera versió

- No hi ha login, ni contrasenya del professorat ni protecció contra un altre grup que suplanti el seu identificador.
- Els casos nous creats simultàniament des de diversos dispositius poden sobreescriure la llista; crea els casos des d'un únic dispositiu.
- L'exportació CSV només inclou les dades dels casos carregats en la sessió; per exportar tots els casos en mode Firebase, caldria ampliar la consulta.
- No s'han incorporat els valors fixos d'exemple 86, 8 i 65 de l'Excel, perquè els controls són editables.
