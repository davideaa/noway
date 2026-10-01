/*
 * Modulo 15 «SEO e statico»: metadati per pagina, indirizzi, URL del sito.
 * Fonte: COPY 14 (struttura URL, title ≤ 60, description ≤ 155) letta da `copy.meta`.
 *
 * COME SI USA (in ogni pagina, Server Component):
 *
 *   import { pageMetadata } from "@/lib/seo/metadata"
 *   export const metadata = pageMetadata("contatti")
 *
 * Per le pagine dinamiche (camere): `export function generateMetadata({ params }) { return pageMetadata(chiaveDa(slug)) }`
 * (le chiavi delle tre camere sono "classic" | "family" | "suite").
 *
 * Regole
 *  - Il titolo di COPY contiene già «| Cosmo Hotel Palace»: si usa `title.absolute`, così il
 *    modello del layout («%s | Cosmo Hotel Palace») non lo raddoppia.
 *  - Canonical: SOLO se NEXT_PUBLIC_SITE_URL è impostata (es. https://www.cosmohotelpalace.it).
 *    Senza dominio confermato non si dichiara un canonical sbagliato (dominio DA CONFERMARE).
 *  - Nessuna immagine Open Graph: nel sito non ci sono foto (DECISIONI 10); le immagini social
 *    si aggiungono quando il cliente ne fornisce di sue.
 *  - Export statico (`output: 'export'`): tutto qui è calcolato a build, nessuna richiesta a runtime.
 */
import type { Metadata } from "next"
import { copy } from "@/content/copy"

/** Chiavi delle pagine = chiavi di `copy.meta` (home, camere, classic, family, suite, …). */
export type MetaKey = keyof typeof copy.meta

/**
 * Dominio di ripiego: quello del sito attuale, citato in COPY 14.3 (DA CONFERMARE: dominio finale).
 * Serve solo dove un URL assoluto è obbligatorio (sitemap, robots, JSON-LD) quando
 * NEXT_PUBLIC_SITE_URL manca. NON si usa per il canonical.
 */
export const FALLBACK_SITE_URL = "https://www.cosmohotelpalace.it"

/** URL del sito dalla variabile d'ambiente, senza slash finale; `null` se manca o non è http(s). */
export function configuredSiteUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!raw) return null
  try {
    const u = new URL(raw)
    if (u.protocol !== "https:" && u.protocol !== "http:") return null
    return `${u.origin}${u.pathname.replace(/\/+$/, "")}`
  } catch {
    return null
  }
}

/** URL del sito per i punti dove serve un URL assoluto: la variabile, altrimenti il ripiego. */
export function siteUrl(): string {
  return configuredSiteUrl() ?? FALLBACK_SITE_URL
}

/** `metadataBase` del layout: solo se il dominio è configurato (altrimenti `null`). */
export function siteBase(): URL | null {
  const c = configuredSiteUrl()
  return c ? new URL(`${c}/`) : null
}

/** Indirizzo assoluto di un percorso del sito ('/camere/' → 'https://…/camere/'). */
export function absoluteUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`
  return `${siteUrl()}${p}`
}

/* ------------------------------------------------------------------ */
/* Struttura URL (COPY 14.1): tutte con slash finale, minuscole        */
/* ------------------------------------------------------------------ */

export const PAGE_PATHS = {
  home: "/",
  camere: "/camere/",
  classic: "/camere/classic-double-room/",
  family: "/camere/family-room/",
  suite: "/camere/suite/",
  prenota: "/prenota/",
  ristorazione: "/ristorazione/",
  wellness: "/wellness/",
  centroCongressi: "/centro-congressi/",
  // Fase 2 (UX 2.1): la richiesta di proposta è una SEZIONE di /centro-congressi/ (#richiesta);
  // /dintorni/, /domande-frequenti/ e /partner/ non esistono ancora. Gli indirizzi sono quelli di COPY 14.1.
  richiestaProposta: "/centro-congressi/richiesta-di-proposta/",
  comeArrivare: "/come-arrivare/",
  dintorni: "/dintorni/",
  contatti: "/contatti/",
  faq: "/domande-frequenti/",
  partner: "/partner/",
  privacy: "/privacy/",
} as const satisfies Record<MetaKey, string>

/**
 * Le pagine che esistono nella fase 1 (UX 2.1), cioè quelle della sitemap.
 * Quando si costruisce una pagina della fase 2 si aggiunge qui la sua chiave.
 */
export const LIVE_PAGES = [
  "home",
  "camere",
  "classic",
  "family",
  "suite",
  "prenota",
  "ristorazione",
  "wellness",
  "centroCongressi",
  "comeArrivare",
  "contatti",
  "privacy",
] as const satisfies readonly MetaKey[]

export function pagePath(chiave: MetaKey): string {
  return PAGE_PATHS[chiave]
}

/** Etichette per il BreadcrumbList e gli elenchi (nomi delle pagine, non titoli SEO). */
export const PAGE_LABELS: Record<MetaKey, string> = {
  home: "Home",
  camere: "Camere",
  classic: "Classic Double Room",
  family: "Family Room",
  suite: "Suite",
  prenota: "Prenota",
  ristorazione: "Cosmo Grill & Lounge",
  wellness: "Wellness",
  centroCongressi: "Centro Congressi",
  richiestaProposta: "Richiesta di proposta",
  comeArrivare: "Come arrivare",
  dintorni: "Dintorni",
  contatti: "Contatti",
  faq: "Domande frequenti",
  partner: "Partner",
  privacy: "Privacy",
}

/** Pagina madre nel percorso a briciole (le tre camere stanno sotto «Camere»). */
export const PAGE_PARENT: Partial<Record<MetaKey, MetaKey>> = {
  classic: "camere",
  family: "camere",
  suite: "camere",
  richiestaProposta: "centroCongressi",
}

/* ------------------------------------------------------------------ */
/* pageMetadata                                                        */
/* ------------------------------------------------------------------ */

/**
 * Metadati di una pagina: titolo e descrizione di COPY 14.2, canonical (se il dominio è
 * configurato), Open Graph e Twitter senza immagini.
 */
export function pageMetadata(chiave: MetaKey): Metadata {
  const m = copy.meta[chiave]
  const path = PAGE_PATHS[chiave]
  const configured = configuredSiteUrl() !== null
  const url = configured ? absoluteUrl(path) : undefined
  return {
    title: { absolute: m.title },
    description: m.description,
    ...(url ? { alternates: { canonical: url } } : {}),
    openGraph: {
      type: "website",
      locale: "it_IT",
      siteName: copy.sito.nome,
      title: m.title,
      description: m.description,
      ...(url ? { url } : {}),
    },
    twitter: { card: "summary", title: m.title, description: m.description },
  }
}
