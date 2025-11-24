# Famiglia - Budget Familiare

Applicazione web full-stack per la gestione collaborativa del budget familiare.

## 🚀 Caratteristiche

- **Gestione Collaborativa**: I membri della famiglia possono tracciare spese insieme
- **Categorie Flessibili**: Categorie condivise e private per spese personali
- **Budget Mensili**: Budget a livello famiglia, per categoria e personale
- **Analytics Dettagliate**: Dashboard con grafici e statistiche di spesa
- **Integrazione Revolut**: Sincronizzazione automatica transazioni (in arrivo)
- **Notifiche**: Avvisi quando si superano le soglie di budget
- **Design Mobile-First**: Interfaccia zen e minimalista ottimizzata per mobile

## 🛠️ Stack Tecnologico

### Frontend
- **React 18** + TypeScript
- **Vite** per build veloce
- **Wouter** per routing client-side
- **TanStack Query v5** per gestione stato server
- **React Hook Form + Zod** per validazione form
- **shadcn/ui + Radix UI** per componenti UI
- **Tailwind CSS** per styling

### Backend
- **Node.js + Express** + TypeScript
- **PostgreSQL** (Neon serverless) con Drizzle ORM
- **Replit Auth** (OpenID Connect) per autenticazione
- **express-session** con PostgreSQL store

## 📋 Prerequisiti

- Node.js 18+
- PostgreSQL database (consigliato: Neon)
- Account Replit per OIDC authentication

## 🔧 Setup

### 1. Installa dipendenze

```bash
npm install
```

### 2. Configura variabili ambiente

Copia `.env.example` in `.env` e configura:

```env
# Database
DATABASE_URL=postgresql://user:password@host/database

# Replit Auth
REPLIT_CLIENT_ID=your_client_id
REPLIT_CLIENT_SECRET=your_client_secret
REPLIT_REDIRECT_URI=http://localhost:5173/api/auth/callback

# Session
SESSION_SECRET=your_random_secret_min_32_chars

# Server
NODE_ENV=development
PORT=3000
```

### 3. Sync database schema

```bash
npm run db:push
```

⚠️ **Importante**: La prima volta, accetta eventuali warning di data-loss.

### 4. Avvia il server

```bash
npm run dev
```

L'app sarà disponibile su `http://localhost:5173`

## 📁 Struttura del Progetto

```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componenti UI riutilizzabili
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   └── layout/     # Layout components (BottomNav, etc.)
│   │   ├── pages/          # Pagine dell'app
│   │   ├── lib/            # Utilities (api, format, utils)
│   │   ├── App.tsx         # App principale con routing
│   │   ├── main.tsx        # Entry point React
│   │   └── index.css       # Global styles + Tailwind
│   └── index.html          # HTML template
├── server/                 # Backend Express
│   ├── routes/             # API routes
│   ├── middleware/         # Auth middleware
│   ├── storage.ts          # Database abstraction layer
│   └── index.ts            # Server entry point
├── db/                     # Database schema
│   └── schema.ts           # Drizzle schema (11 tabelle)
├── package.json
├── vite.config.ts
├── tsconfig.json
└── drizzle.config.ts
```

## 🔐 Sicurezza e Autorizzazione

### ⚠️ **CRITICO**: Filtri per Categorie Private

Le query per categorie e spese **DEVONO** sempre filtrare per `userId` quando si tratta di categorie private:

```typescript
// ✅ CORRETTO
WHERE familyId = ? AND (isPrivate = false OR userId = ?)

// ❌ SBAGLIATO - mostra categorie private altrui!
WHERE familyId = ?
```

### ⚠️ **CRITICO**: Analytics con Filtro User

Le analytics **DEVONO** passare sempre `userId` per filtrare correttamente:

```typescript
// Backend: server/storage.ts
async getFamilySpendingByCategory(
  familyId: string,
  userId: string,  // ← CRITICO!
  month: number,
  year: number
)

// Frontend: client/src/pages/Analytics.tsx
// La query automaticamente filtra per l'utente corrente
const { data } = useQuery({
  queryKey: ['/api/analytics/spending-by-category', month, year],
  queryFn: () => apiRequest(`/api/analytics/spending-by-category?month=${month}&year=${year}`)
});
```

## 📊 Database Schema

11 tabelle principali:

1. **users** - Utenti (da OIDC)
2. **families** - Famiglie
3. **familyMembers** - Membri famiglia (con ruoli admin/member)
4. **categories** - Categorie spese (condivise/private)
5. **budgets** - Budget per categoria mensili
6. **familyBudgets** - Budget totale famiglia mensile
7. **personalBudgets** - Budget personale mensile
8. **expenses** - Spese
9. **invites** - Inviti famiglia
10. **notifications** - Notifiche in-app
11. **revolutConnections** - Connessioni OAuth Revolut

## 🎨 UI/UX

- **Mobile-First**: Container `max-w-md mx-auto` simula mobile
- **Bottom Navigation**: 4 voci (Home, Analisi, Revolut, Profilo)
- **Tema Zen**: Palette colori neutri caldi con accenti verdi/blu
- **Tutto in Italiano**: Stringhe, formati date, valuta (€ X.XXX,XX)

## 🧪 Testing

### Test Critici da Verificare

1. **Autorizzazione Categorie Private**
   - Utente A non deve vedere categorie private di Utente B
   - Verifica: crea categoria privata come UserA, accedi come UserB, non deve comparire

2. **Analytics Filtro User**
   - Analytics devono mostrare solo categorie accessibili all'utente
   - Verifica: crea spese in categorie private altrui, non devono apparire

3. **Cache Invalidation**
   - Dopo ogni mutation, la cache deve aggiornarsi
   - Verifica: crea/modifica/elimina, UI si aggiorna immediatamente

## 🚢 Deployment

### Replit Deployment

1. Push codice su GitHub
2. Importa repository su Replit
3. Configura Secrets (variabili ambiente)
4. Replit rileverà automaticamente `npm run dev`

### Environment Variables Production

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
REPLIT_CLIENT_ID=...
REPLIT_CLIENT_SECRET=...
REPLIT_REDIRECT_URI=https://your-domain.repl.co/api/auth/callback
SESSION_SECRET=...
PORT=3000
```

## 📝 API Endpoints

### Auth
- `GET /api/auth/login` - Redirect to Replit OIDC
- `GET /api/auth/callback` - OAuth callback
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user info

### Families
- `POST /api/families` - Create family
- `GET /api/families/:id` - Get family details
- `PATCH /api/families/:id` - Update family (admin only)
- `DELETE /api/families/:id/members/:memberId` - Remove member (admin only)

### Categories
- `GET /api/categories` - Get categories (filtered by user)
- `POST /api/categories` - Create category
- `PATCH /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Expenses
- `GET /api/expenses` - Get expenses (filtered by user)
- `GET /api/expenses/:id` - Get single expense
- `POST /api/expenses` - Create expense
- `PATCH /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Budgets
- `GET /api/budgets/family?month=X&year=Y` - Get family budget
- `PUT /api/budgets/family` - Set family budget (admin only)
- `GET /api/budgets/categories?month=X&year=Y` - Get category budgets
- `PUT /api/budgets/categories/:categoryId` - Set category budget
- `GET /api/budgets/personal?month=X&year=Y` - Get personal budget
- `PUT /api/budgets/personal` - Set personal budget

### Analytics
- `GET /api/analytics/spending-by-category?month=X&year=Y` - Spending by category (filtered)
- `GET /api/analytics/total-spending?month=X&year=Y` - Total spending (filtered)
- `GET /api/analytics/personal-spending?month=X&year=Y` - Personal spending

### Invites
- `GET /api/invites` - Get family invites (admin only)
- `POST /api/invites` - Create invite (admin only)
- `POST /api/invites/:token/accept` - Accept invite

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread/count` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### Revolut
- `GET /api/revolut/status` - Connection status
- `GET /api/revolut/connect` - OAuth flow (not implemented)
- `POST /api/revolut/disconnect` - Disconnect
- `GET /api/revolut/transactions` - Get transactions (not implemented)
- `GET /api/revolut/spending-stats` - Get stats (not implemented)

## 🐛 Bug Fixes Applicati

### Bug #1: Categorie Private Visibili ad Altri Utenti
**Problema**: Query non filtrava `userId` per categorie private

**Fix**: Modificato `storage.getCategories()`:
```typescript
WHERE familyId = ? AND (isPrivate = false OR userId = ?)
```

### Bug #2: Analytics Mostravano Dati Privati Altrui
**Problema**: Analytics aggregavano tutte le categorie senza filtro user

**Fix**: Aggiunto parametro `userId` a `getFamilySpendingByCategory()`

### Bug #3: Cache Non Si Invalidava
**Problema**: Dopo mutations, UI non si aggiornava

**Fix**: Aggiunto `queryClient.invalidateQueries()` dopo ogni mutation

### Bug #4: Query Key Non Gerarchici
**Problema**: `['/api/expenses/${id}']` impediva invalidazione parziale

**Fix**: Usare sempre `['/api/expenses', id]` per query gerarchici

## 🔮 Roadmap

- [ ] Completa integrazione Revolut OAuth
- [ ] Sistema inviti via email
- [ ] Export Excel analytics
- [ ] Grafici avanzati (recharts)
- [ ] Dark mode toggle
- [ ] Notifications push
- [ ] Multi-currency support
- [ ] Ricerca e filtri avanzati spese
- [ ] Riconciliazione automatica Revolut
- [ ] Mobile app (React Native)

## 📄 Licenza

MIT

## 👥 Autori

Creato con ❤️ per la gestione collaborativa del budget familiare.

---

**Note**: Questo è un progetto di esempio completo che implementa best practices per sicurezza, autorizzazione e UX. Tutti i bug critici menzionati nel prompt originale sono stati risolti nell'implementazione.
