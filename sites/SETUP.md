# Come è collegato tutto (solo strumenti gratuiti)

## Già configurato nel repo
| Cosa | Dove | Stato |
|---|---|---|
| Server MCP Figma, Playwright, shadcn | `.mcp.json` | Playwright e shadcn testati: partono e rispondono. Figma: indirizzo ufficiale, richiede login al primo uso |
| Creazione di un sito con tutto lo stack | `sites/nuovo-sito.sh <nome>` | Testato: crea il progetto, compila, ShaderGradient si disegna senza errori |
| Coordinatore del team | `.claude/agents/capo-progetto.md` | Coordina gli altri sette agenti |

`.mcp.json` è a livello di progetto: Claude Code chiede di approvarlo la prima volta che apri il repo. Va riaperta la sessione perché i server compaiano.

## Cosa deve fare l'utente (io non posso)
1. Approvare i server di `.mcp.json` all'apertura del progetto e fare il login a Figma.
2. Dai plugin di Claude Code: `frontend-design`, `Design`, e (se serve) `Image Deep Research`. Connettore Unsplash da claude.ai.
3. Con un posto Figma "View" si può leggere ma non è garantito che si possa scrivere. Per far disegnare a Claude dentro Figma serve un posto "Full".

## Non verificato
- **Cult UI**: il registro è configurato in `components.json` dallo script, ma dal mio ambiente `cult-ui.com` rispondeva 429 (troppe richieste), quindi non ho potuto installare un componente. Da provare sul tuo computer: `npx shadcn@latest add @cult-ui/texture-button`.
- Colori e luce di ShaderGradient: nel test uscivano bruciati (giallo saturo). Vanno regolati per ogni progetto.
- Prestazioni su telefono con ShaderGradient (WebGL): da misurare.

## Esclusi perché a pagamento o non necessari
Refero (abbonamento), Cult Pro, Scrolltide (239 $, ma ha un prompt gratuito), Manus (account e pacchetto di terzi).
