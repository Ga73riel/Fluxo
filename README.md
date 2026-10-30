# FLUXO BICT

Planejador acadêmico para BICT e Engenharias da UFMA: organograma, planejamento de créditos e grade semanal.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Dados

As matrizes curriculares ficam em `src/data/curricula.json` (lista de objetos com `slug`, `name`, `shortName`, `totalHours`, `periodCount`, `colors` e `subjects`; veja os tipos em `src/app/PlannerApp.tsx`). Slugs usados: `bict`, `aeroespacial`, `ambiental`, `civil`, `computacao`, `transportes`, `mecanica`.

## Publicação (GitHub Pages)

Em **Settings → Pages**, escolha **Source: GitHub Actions**. Cada push na `main` gera e publica o site automaticamente.
