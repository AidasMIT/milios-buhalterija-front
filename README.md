# Buhalterija – frontend

React SPA sąskaitoms faktūroms išrašyti. Visi duomenys, prisijungimas ir PDF eina per .NET API
([milios-buhalterija-back](https://github.com/AidasMIT/milios-buhalterija-back)). Supabase ir kitų išorinių
paslaugų nėra.

**Technologijos:** Vite, React 18, TypeScript (strict), Tailwind + shadcn/ui, TanStack Query, React Router.

## Struktūra

```
src/
  api/          client.ts (fetch + ProblemDetails klaidos), endpoints.ts (po funkciją endpoint'ui), types.ts (DTO)
  hooks/        use-auth, use-profiles, use-companies, use-invoices – TanStack Query hook'ai
  context/      ActiveProfile – pasirinktas verslo profilis (IV / MB)
  lib/          formatavimas, būsenų ir vienetų pavadinimai, klaidų tekstai lietuviškai
  pages/        Login, Dashboard, InvoiceList, NewInvoice, EditInvoice, InvoiceDetail, Companies, Statistics, Settings
  components/   layout, sąskaitų forma ir lentelė, ui/ (tik naudojami shadcn komponentai)
```

## Kaip veikia

- **Prisijungimas:** `POST /api/auth/login` uždeda `HttpOnly` slapuką, todėl JavaScript token'o nemato.
  Registracijos nėra: paskyras kuria administratorius (pirmąją – backend'o `Bootstrap` nustatymai).
- **Teisės:** mygtukai rodomi pagal `GET /api/auth/me`, o tikrąsias taisykles tikrina API.
- **Sąskaitos:** juodraštis → **Išrašyti** (numerį suteikia serveris) → **Apmokėta**. Redaguoti ir trinti
  galima tik juodraščius. „Vėluoja“ – išsiųsta sąskaita, kurios terminas praėjo.
- **Sumos** skaičiuojamos serveryje, o formoje rodoma peržiūra su tokiu pačiu apvalinimu.
- **PDF** generuoja serveris (`/api/invoices/{id}/pdf`); keli PDF atsisiunčiami ZIP archyvu.

## Paleidimas

```bash
npm install
cp .env.example .env          # API_PROXY_TARGET – kur veikia .NET API (numatyta http://localhost:5285)
npm run dev                   # http://localhost:8080, /api keliauja į API per Vite proxy
```

API turi veikti (žr. backend'o README). Pirmą kartą prisijunk su `Bootstrap:AdminEmail` paskyra, tada
**Nustatymuose** susikurk verslo profilius (IV, MB) su serija ir paskutiniu išrašytu numeriu.

## Patikra

```bash
npm run lint      # ESLint
npm test          # Vitest
npm run build     # tipų patikra + produkcinis build'as į dist/
```

## Diegimas

Rekomenduojama SPA ir API pateikti viename adrese: reverse proxy (nginx, Caddy) atiduoda `dist/`, o `/api/*`
nukreipia į API. Tada `VITE_API_URL` palik tuščią. Jei API veikia subdomene (`api.domenas.lt`), nustatyk
`VITE_API_URL` prieš build'ą ir įrašyk frontend'o adresą į API `Cors:AllowedOrigins`. Abu turi būti tame pačiame
domene, nes sesijos slapukas yra `SameSite=Strict`.
