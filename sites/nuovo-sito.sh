#!/usr/bin/env bash
# Crea un nuovo sito in sites/<nome> con tutto lo stack gratuito già collegato:
# Next.js + Tailwind + shadcn/ui + registro Cult UI + Framer Motion + ShaderGradient.
# Uso: sites/nuovo-sito.sh <nome-progetto>
set -euo pipefail

NOME="${1:-}"
if [[ -z "$NOME" || ! "$NOME" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
  echo "Uso: $0 <nome-progetto>   (solo minuscole, numeri e trattini)" >&2
  exit 1
fi

QUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="$QUI/$NOME"
if [[ -e "$DEST" ]]; then
  echo "Esiste già: $DEST" >&2
  exit 1
fi

echo "==> Next.js + Tailwind"
cd "$QUI"
npx --yes create-next-app@latest "$NOME" \
  --ts --tailwind --eslint --app --src-dir --import-alias "@/*" \
  --use-npm --no-turbopack --yes

cd "$DEST"

echo "==> shadcn/ui"
npx --yes shadcn@latest init --defaults --yes

echo "==> Registro Cult UI in components.json"
node -e '
  const fs = require("fs");
  const c = JSON.parse(fs.readFileSync("components.json", "utf8"));
  c.registries = Object.assign({}, c.registries, {
    "@cult-ui": "https://cult-ui.com/r/{name}.json"
  });
  fs.writeFileSync("components.json", JSON.stringify(c, null, 2) + "\n");
'

echo "==> Animazioni e sfondi (Framer Motion, ShaderGradient + Three.js)"
npm install --no-fund --no-audit \
  framer-motion \
  @shadergradient/react three @react-three/fiber three-stdlib camera-controls
npm install --no-fund --no-audit --save-dev @types/three

mkdir -p docs assets
for f in DESIGN UX COPY MOTION; do
  [[ -e "$f.md" ]] || printf '# %s\n\n_Da compilare dall'"'"'agente competente (vedi sites/README.md)._\n' "$f" > "$f.md"
done

echo
echo "Pronto: $DEST"
echo "Avvio:  cd sites/$NOME && npm run dev"
echo "Cult UI: npx shadcn@latest add @cult-ui/<componente>"
