# Siti web

Cartella separata dalla ricerca sull'oro. Ogni sito sta in `sites/<nome-progetto>/`.

## Il team (in `.claude/agents/`)

| Agente | Quando |
|---|---|
| `art-director` | all'inizio (identità visiva) e alla fine (giudizio estetico) |
| `ux-designer` | struttura, percorsi, wireframe, accessibilità |
| `copywriter` | testi in italiano, SEO di base |
| `graphic-designer` | logo, icone, illustrazioni, immagini |
| `motion-designer` | animazioni e interazioni |
| `frontend-developer` | costruisce il sito |
| `qa-performance` | prove su schermi diversi, accessibilità, velocità |

## Ordine di lavoro

1. `art-director` → `DESIGN.md`
2. `ux-designer` → `UX.md` · `copywriter` → `COPY.md`
3. `graphic-designer` → `assets/` · `motion-designer` → `MOTION.md`
4. `frontend-developer` → il sito
5. `qa-performance` → rapporto con prove; correzioni; `art-director` approva

Nessun agente dichiara di aver usato uno strumento (Figma, Adobe, Canva…) se non è collegato.
