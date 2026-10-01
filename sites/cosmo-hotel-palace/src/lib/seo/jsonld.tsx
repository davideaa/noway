/*
 * Dati strutturati schema.org (COPY 14.3), come <script type="application/ld+json">.
 * Server Component: l'HTML statico li contiene, nessun JavaScript.
 *
 *   <JsonLdHotel />                         solo in home
 *   <JsonLdBreadcrumb chiave="suite" />     su ogni pagina interna (la home non serve)
 *   <JsonLdHotelRoom id="suite" />          nelle tre pagine camera
 *   <JsonLdFaq />                           solo su /domande-frequenti/ (fase 2)
 *
 * SOLO DATI VERI (COPY 14.3). Esclusi di proposito: `petsAllowed` (non confermato), stelle,
 * premi, valutazioni, prezzi, orari di check-in, coordinate. Non aggiungerli senza un dato
 * confermato dal cliente. Il testo è reso sicuro: `<` diventa `<`.
 */
import { cin, centralino, indirizzo, social } from "@/content/contacts"
import { copy } from "@/content/copy"
import { roomById } from "@/content/rooms"
import type { RoomId } from "@/content/types"
import { absoluteUrl, PAGE_LABELS, PAGE_PARENT, PAGE_PATHS, siteUrl, type MetaKey } from "./metadata"

type Json = Record<string, unknown>

function JsonLd({ data }: { data: Json }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  )
}

/** `@id` dell'hotel: lo usano le camere per dire dove sono. */
export function hotelId(): string {
  return `${siteUrl()}/#hotel`
}

/** Servizi veri (COPY 14.3, dal BRIEF). */
const AMENITIES = [
  "Wi-Fi gratuito nelle camere",
  "Parcheggio gratuito (200 posti auto)",
  "Area parcheggio per autobus",
  "Struttura senza barriere architettoniche",
  "Centro Congressi (fino a 900 persone)",
  "Ristorante",
  "Bar",
  "Sauna finlandese",
  "Bagno turco",
  "Sala fitness",
  "Climatizzazione regolabile in camera",
  "TV satellitare in camera",
  "Cassaforte in camera",
] as const

export function hotelData(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Hotel",
    "@id": hotelId(),
    name: copy.sito.nome,
    description: copy.schema.descrizioneHotel,
    url: `${siteUrl()}/`,
    telephone: centralino.telefono,
    email: centralino.email,
    identifier: cin,
    address: {
      "@type": "PostalAddress",
      streetAddress: indirizzo.via,
      postalCode: indirizzo.cap,
      addressLocality: indirizzo.comune,
      addressRegion: "MI",
      addressCountry: "IT",
    },
    numberOfRooms: 201,
    amenityFeature: AMENITIES.map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    })),
    sameAs: [social.instagram.url, social.facebook.url],
  }
}

/** Hotel (home). Niente `petsAllowed`, niente valutazioni, prezzi, coordinate. */
export function JsonLdHotel() {
  return <JsonLd data={hotelData()} />
}

export type BreadcrumbVoce = { nome: string; path: string }

/** Percorso a briciole di una pagina: Home › (madre) › pagina. */
export function breadcrumbVoci(chiave: MetaKey): BreadcrumbVoce[] {
  const voci: BreadcrumbVoce[] = [{ nome: PAGE_LABELS.home, path: PAGE_PATHS.home }]
  const parent = PAGE_PARENT[chiave]
  if (parent) voci.push({ nome: PAGE_LABELS[parent], path: PAGE_PATHS[parent] })
  if (chiave !== "home") voci.push({ nome: PAGE_LABELS[chiave], path: PAGE_PATHS[chiave] })
  return voci
}

/**
 * BreadcrumbList. Con `chiave` il percorso si ricava da solo (le tre camere stanno sotto «Camere»);
 * con `voci` si dà un percorso proprio, e la «Home» in testa si aggiunge sola.
 */
export function JsonLdBreadcrumb(props: { chiave: MetaKey; voci?: never } | { voci: readonly BreadcrumbVoce[]; chiave?: never }) {
  const voci = props.voci
    ? [{ nome: PAGE_LABELS.home, path: PAGE_PATHS.home }, ...props.voci]
    : breadcrumbVoci(props.chiave)
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: voci.map((v, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: v.nome,
          item: absoluteUrl(v.path),
        })),
      }}
    />
  )
}

/** FAQPage con le stesse risposte della pagina (COPY 14.4). Di default tutte e dieci. */
export function JsonLdFaq({ voci = copy.faq }: { voci?: readonly { domanda: string; risposta: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: voci.map((v) => ({
          "@type": "Question",
          name: v.domanda,
          acceptedAnswer: { "@type": "Answer", text: v.risposta },
        })),
      }}
    />
  )
}

const ROOM_KEY: Record<RoomId, "classic" | "family" | "suite"> = { classic: "classic", family: "family", suite: "suite" }

/** HotelRoom di una camera: nome, superficie, ospiti, letti. Solo dati di `content/rooms`. */
export function JsonLdHotelRoom({ id }: { id: RoomId }) {
  const r = roomById(id)
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "HotelRoom",
        name: r.nome,
        description: r.corpo,
        url: absoluteUrl(PAGE_PATHS[ROOM_KEY[id]]),
        floorSize: { "@type": "QuantitativeValue", value: r.mq, unitCode: "MTK" },
        occupancy: { "@type": "QuantitativeValue", maxValue: r.ospiti.adulti + r.ospiti.bambini },
        bed: r.confronto.letti,
        containedInPlace: { "@id": hotelId() },
      }}
    />
  )
}
