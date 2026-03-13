# 🚀 Guida Deployment su Replit

## 📋 Prerequisiti

1. Account Replit (gratis o a pagamento)
2. Repository GitHub con il codice dell'app

## 🎯 Step 1: Importa il Progetto

1. Vai su [Replit](https://replit.com)
2. Clicca su **"Create Repl"**
3. Seleziona **"Import from GitHub"**
4. Incolla l'URL del tuo repository GitHub
5. Clicca su **"Import from GitHub"**

## 🗄️ Step 2: Configura il Database PostgreSQL

### Opzione A: PostgreSQL Interno (Consigliato per iniziare)

1. Nel tuo Repl, vai alla sezione **Tools** (pannello laterale)
2. Cerca e abilita **PostgreSQL**
3. Replit creerà automaticamente un database
4. Copia il **Connection String** che appare

### Opzione B: Database Esterno (Neon - Consigliato per produzione)

1. Vai su [Neon](https://neon.tech)
2. Crea un account gratuito
3. Crea un nuovo progetto
4. Copia la connection string (formato: `postgresql://user:password@host/database`)

## 🔐 Step 3: Configura i Secrets (Variabili d'Ambiente)

Nel tuo Repl, vai alla sezione **Secrets** (icona lucchetto) e aggiungi:

### Obbligatori:

```
DATABASE_URL = postgresql://user:password@host:port/database
SESSION_SECRET = [genera una stringa casuale lunga, es. con: openssl rand -base64 32]
```

### Opzionali (OAuth Social Login):

#### Google OAuth (opzionale):
```
GOOGLE_CLIENT_ID = il-tuo-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = GOCSPX-xxxxxxxxxxxxx
```

Configurazione Google:
1. Vai su [Google Cloud Console](https://console.cloud.google.com)
2. Crea un progetto → API & Services → Credentials
3. Create Credentials → OAuth 2.0 Client ID
4. Authorized redirect URIs: `https://[tuo-repl-name].[tuo-username].repl.co/api/auth/google/callback`

#### Facebook OAuth (opzionale):
```
FACEBOOK_APP_ID = 1234567890123456
FACEBOOK_APP_SECRET = abcdef1234567890abcdef1234567890
```

Configurazione Facebook:
1. Vai su [Facebook Developers](https://developers.facebook.com)
2. Create App → OAuth Login
3. Valid OAuth Redirect URIs: `https://[tuo-repl-name].[tuo-username].repl.co/api/auth/facebook/callback`

#### Microsoft OAuth (opzionale):
```
MICROSOFT_CLIENT_ID = xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MICROSOFT_CLIENT_SECRET = xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Configurazione Microsoft:
1. Vai su [Azure Portal](https://portal.azure.com)
2. Azure Active Directory → App registrations → New registration
3. Redirect URIs: `https://[tuo-repl-name].[tuo-username].repl.co/api/auth/microsoft/callback`

#### Apple OAuth (opzionale):
```
APPLE_CLIENT_ID = com.tuodominio.famiglia
APPLE_TEAM_ID = XXXXXXXXXX
APPLE_KEY_ID = XXXXXXXXXX
APPLE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\nMIGT...xxx...\n-----END PRIVATE KEY-----
```

Configurazione Apple:
1. Vai su [Apple Developer](https://developer.apple.com)
2. Certificates, IDs & Profiles → Sign In with Apple
3. Return URLs: `https://[tuo-repl-name].[tuo-username].repl.co/api/auth/apple/callback`

#### Revolut Open Banking (opzionale):
```
REVOLUT_CLIENT_ID = xxxxxxxxxxxxx
REVOLUT_CLIENT_SECRET = xxxxxxxxxxxxx
REVOLUT_REDIRECT_URI = https://[tuo-repl-name].[tuo-username].repl.co/api/revolut/callback
REVOLUT_API_URL = https://sandbox-b2b.revolut.com  # o https://b2b.revolut.com per production
```

#### Stripe Pagamenti (opzionale):
```
STRIPE_SECRET_KEY = sk_test_xxxxxxxxxxxxx  # o sk_live_ per production
STRIPE_WEBHOOK_SECRET = whsec_xxxxxxxxxxxxx
STRIPE_PRICE_ID = price_xxxxxxxxxxxxx
```

## ⚙️ Step 4: Installa le Dipendenze

Nel terminale Replit, esegui:

```bash
npm install
```

## 🗃️ Step 5: Inizializza il Database

Esegui il comando per creare le tabelle:

```bash
npm run db:push
```

## 🏗️ Step 6: Build e Avvio

### Build dell'applicazione:
```bash
npm run build
```

### Avvio in produzione:
```bash
npm start
```

Oppure clicca semplicemente sul pulsante verde **"Run"** in Replit!

## 🌐 Step 7: Accedi all'App

Dopo l'avvio, Replit ti fornirà un URL pubblico tipo:
```
https://[tuo-repl-name].[tuo-username].repl.co
```

Clicca su questo URL per accedere alla tua app!

## 📱 Step 8: First Run - Crea Account

1. Apri l'URL della tua app
2. Clicca su **"Registrati"**
3. Inserisci email, password e nome completo
4. Login completato! 🎉

Oppure usa i social login se hai configurato OAuth.

## 🔧 Troubleshooting

### ❌ "Cannot connect to database"
- Verifica che `DATABASE_URL` nei Secrets sia corretto
- Se usi PostgreSQL interno Replit, assicurati che sia abilitato in Tools
- Prova a riavviare il database o il Repl

### ❌ "Session error"
- Verifica che `SESSION_SECRET` sia configurato nei Secrets
- Deve essere una stringa casuale lunga (almeno 32 caratteri)

### ❌ "Build failed"
- Esegui `npm install` per assicurarti che tutte le dipendenze siano installate
- Controlla che Node.js versione 20 sia configurato (vedi `.replit`)

### ❌ "OAuth not working"
- Verifica che gli URL di callback siano esatti (case-sensitive!)
- Assicurati che le credenziali OAuth siano valide
- I social login sono opzionali: puoi usare solo email/password

### ⚠️ "Port already in use"
- Ferma il processo corrente (Ctrl+C nel terminale)
- Clicca di nuovo su Run

## 🎨 Configurazione Minima (Solo Email/Password)

Se vuoi partire subito senza OAuth, configura solo:

```
DATABASE_URL = postgresql://...
SESSION_SECRET = [stringa casuale lunga]
```

Tutti i provider OAuth sono **opzionali**. L'app funziona perfettamente con solo email e password!

## 📊 Deploy Automatico

Replit supporta il deploy automatico:

1. Vai alla tab **Deployments**
2. Clicca su **"Deploy"**
3. L'app sarà disponibile su un URL stabile e permanente

Per aggiornamenti futuri:
- Ogni push su GitHub può triggerare un re-deploy automatico
- Oppure usa il pulsante "Deploy" manualmente

## 🎯 Pro Tips

- 💾 **Backup Database**: Esporta regolarmente i dati dal database
- 🔒 **Secrets**: Mai committare secrets nel codice, usa sempre Replit Secrets
- 📈 **Monitoring**: Controlla i log nel tab "Console" per errori
- 🚀 **Performance**: Considera Replit Boost o Autoscale per traffico alto

## 🆘 Supporto

Per problemi tecnici:
- Controlla i log nel terminale Replit
- Verifica tutti i Secrets siano configurati correttamente
- Assicurati che il database sia raggiungibile

---

Buon deployment! 🇮🇹 🚀
