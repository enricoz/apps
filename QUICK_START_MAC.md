# 🚀 Quick Start su Mac

Guida rapida per far girare Famiglia sul tuo Mac in 5 minuti.

## Prerequisiti

1. **Node.js** (verifica: `node --version`)
   ```bash
   # Se non ce l'hai, installa con Homebrew
   brew install node
   ```

2. **PostgreSQL** (scegli una opzione)

### Opzione 1: Neon (Cloud) - PIÙ VELOCE ✅

1. Vai su https://neon.tech
2. Crea account gratuito
3. Crea nuovo progetto
4. Copia la connection string (tipo: `postgresql://user:pass@ep-xxx.neon.tech/dbname`)

### Opzione 2: PostgreSQL Locale

```bash
# Installa
brew install postgresql@15

# Avvia
brew services start postgresql@15

# Crea database
createdb famiglia_db
```

## Setup Veloce

```bash
# 1. Vai nella cartella del progetto
cd /path/to/apps

# 2. Installa dipendenze
npm install

# 3. Crea file .env
cp .env.example .env

# 4. Modifica .env con il tuo editor preferito
nano .env
```

Configurazione minima `.env`:

```env
# Con Neon (incolla la tua connection string)
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/dbname

# OPPURE con PostgreSQL locale
DATABASE_URL=postgresql://localhost/famiglia_db

# Genera una stringa random (o usa questa)
SESSION_SECRET=famiglia_secret_molto_lungo_e_sicuro_almeno_32_caratteri
```

```bash
# 5. Crea le tabelle nel database
npm run db:push
# Rispondi 'yes' se chiede conferma

# 6. Avvia l'app!
npm run dev
```

## ✅ Pronto!

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

## Primo Accesso

1. Vai su http://localhost:5173
2. Clicca "Non hai un account? Registrati"
3. Inserisci:
   - Nome completo (opzionale)
   - Email (usa qualsiasi email, non serve verifica)
   - Password (minimo 6 caratteri)
4. Clicca "Registrati"
5. Crea la tua famiglia
6. Inizia ad aggiungere spese!

## Troubleshooting

### Porta già in uso

```bash
# Trova e termina processo sulla porta 3000
kill -9 $(lsof -ti:3000)

# Porta 5173
kill -9 $(lsof -ti:5173)
```

### Database connection failed

```bash
# Verifica che PostgreSQL sia avviato
brew services list | grep postgresql

# Riavvia se necessario
brew services restart postgresql@15
```

### bcrypt build failed

```bash
# Reinstalla bcrypt (problemi comuni su Mac M1/M2)
npm rebuild bcrypt
```

### Tabelle non create

```bash
# Forza sync schema
npm run db:push -- --force
```

## Comandi Utili

```bash
# Fermare il server: Ctrl+C

# Vedere lo schema database
npm run db:studio
# Apre Drizzle Studio su http://localhost:4983

# Reinstallare dipendenze
rm -rf node_modules package-lock.json
npm install

# Reset completo database
npm run db:push -- --force
```

## Video Demo

https://github.com/user-attachments/assets/xxx (TODO)

## Supporto

Hai problemi? Apri un issue su GitHub!
