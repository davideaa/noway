/*
 * Footer del sito (UX 8 «Footer», COPY 11). Tono sera (`data-tono="sera"`), Server Component.
 *
 * Quattro colonne ≥ 1024, due ≥ 600, impilato sotto. Solo link a pagine che esistono (UX 2.1):
 * niente «Dintorni» né «Domande frequenti» finché non ci sono.
 *   1. Hotel      nome, qualifica, indirizzo
 *   2. Contatti   per reparto: telefono e email (WCAG 3.2.6: stesso aiuto nello stesso posto del menu)
 *   3. Esplora    le pagine + «Cerca disponibilità» (apre la prenotazione; verde/chiaro, non miele)
 *   4. Seguici    Instagram, Facebook (nuova scheda dichiarata nel nome accessibile), hashtag
 * Riga legale: CIN · Privacy · © · «Torna su». Sotto: la nota sulle ricostruzioni illustrative.
 * Nessun credito del sito (DA CONFERMARE chi lo firma). Nessun banner cookie (UX 8).
 *
 * `data-site-footer`: barra e pillola di prenotazione si nascondono quando il footer è in vista.
 * Il footer arriva fino al bordo del documento anche quando il body riserva spazio alla pillola
 * (--reserve-bottom): il margine negativo copre quello spazio, così sotto non resta una fascia chiara.
 */
import Link from "next/link"
import { Icon } from "@/components/art/Icons"
import { Button } from "@/components/ui/button"
import { IconArrowRight } from "@/components/ui/icons"
import { cin, indirizzo, reparti, social } from "@/content/contacts"
import { copy, fmt } from "@/content/copy"
import { copyShell } from "@/content/copy-shell"
import { BookLink } from "./BookLink"
import { footerItems } from "./nav-items"

const linkClass =
  "inline-flex min-h-(--tap) items-center text-(--text) underline decoration-(--link-underline) underline-offset-4 hover:decoration-2"

/** Reparti con gli stessi numeri e la stessa email (Prenotazioni e Ristorante) in una sola riga. */
function repartiRaggruppati() {
  const gruppi: { nomi: string[]; telefono: string; telHref: string; email: string }[] = []
  for (const r of reparti) {
    const g = gruppi.find((x) => x.telHref === r.telHref && x.email === r.email)
    if (g) g.nomi.push(r.nome)
    else gruppi.push({ nomi: [r.nome], telefono: r.telefono, telHref: r.telHref, email: r.email })
  }
  const lf = new Intl.ListFormat("it", { style: "long", type: "conjunction" })
  return gruppi.map((g) => ({ ...g, nome: lf.format(g.nomi) }))
}

const socials = [social.instagram, social.facebook] as const

export function Footer() {
  const f = copy.footer
  const gruppi = repartiRaggruppati()

  return (
    <footer
      data-site-footer=""
      data-tono="sera"
      className="mb-[calc(-1*var(--reserve-bottom))] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="wrap py-(--s-8) sm:py-(--s-9)">
        <div className="grid gap-x-(--gutter) gap-y-(--s-7) sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Hotel */}
          <div>
            <h2 className="t-label text-(--text-muted)">{f.hotel.titolo}</h2>
            <p className="t-h3 mt-(--s-3)">{f.hotel.riga1}</p>
            <p className="mt-1 text-(--text-muted)">{f.hotel.riga2}</p>
            <address className="mt-(--s-4) not-italic">
              <span className="block">{indirizzo.via}</span>
              <span className="block">
                {indirizzo.cap} {indirizzo.comune} ({indirizzo.provincia})
              </span>
            </address>
          </div>

          {/* 2. Contatti per reparto */}
          <div>
            <h2 className="t-label text-(--text-muted)">{f.contatti.titolo}</h2>
            <ul aria-label={copyShell.ariaFooterContatti} className="m-0 mt-(--s-3) flex list-none flex-col gap-(--s-4) p-0">
              {gruppi.map((g) => (
                <li key={g.telHref + g.email}>
                  <p className="t-small text-(--text-muted)">{g.nome}</p>
                  <a
                    href={`tel:${g.telHref}`}
                    aria-label={fmt(copy.contatti.ariaChiama, { reparto: g.nome, numero: g.telefono })}
                    className={`${linkClass} gap-2`}
                  >
                    <Icon nome="telefono" size={20} />
                    {g.telefono}
                  </a>
                  <a
                    href={`mailto:${g.email}`}
                    aria-label={fmt(copy.contatti.ariaScrivi, { reparto: g.nome, email: g.email })}
                    className={`${linkClass} gap-2`}
                  >
                    <Icon nome="email" size={20} />
                    <span className="break-all">{g.email}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Esplora */}
          <div>
            <h2 className="t-label text-(--text-muted)">{f.esplora.titolo}</h2>
            <nav aria-label={copyShell.ariaNavEsplora} className="mt-(--s-3)">
              <ul className="m-0 flex list-none flex-col p-0">
                {footerItems.map((it) => (
                  <li key={it.href}>
                    <Link href={it.href} className={`${linkClass}`}>
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-(--s-4)">
              <BookLink variant="brand" size="md">
                {f.cta}
              </BookLink>
            </div>
          </div>

          {/* 4. Seguici */}
          <div>
            <h2 className="t-label text-(--text-muted)">{f.seguici.titolo}</h2>
            <ul aria-label={copyShell.ariaFooterSocial} className="m-0 mt-(--s-3) flex list-none flex-col p-0">
              {socials.map((s) => (
                <li key={s.nome}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener"
                    aria-label={fmt(copy.contatti.ariaSocial, { social: s.nome })}
                    className={`${linkClass} gap-2`}
                  >
                    {s.nome}
                    <Icon nome="esterno" size={18} />
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-(--s-3) text-(--text-muted)">{social.hashtag}</p>
          </div>
        </div>

        {/* Riga legale */}
        <div className="mt-(--s-8) flex flex-col gap-(--s-4) border-t border-(--border) pt-(--s-5)">
          <div className="flex flex-wrap items-center justify-between gap-x-(--s-5) gap-y-(--s-2)">
            <ul aria-label={copyShell.ariaFooterLegale} className="m-0 flex list-none flex-wrap items-center gap-x-(--s-5) p-0 t-small">
              <li>{fmt(f.legale.cin, { cin })}</li>
              <li>
                <Link href="/privacy/" className={`${linkClass} t-small`}>
                  {f.legale.privacy}
                </Link>
              </li>
              <li>{f.legale.copyright}</li>
            </ul>
            <Button asChild variant="outline" size="icon-sm" aria-label={f.ariaTornaSu}>
              <a href="#top">
                <IconArrowRight size={20} className="-rotate-90" />
              </a>
            </Button>
          </div>
          <p className="t-small max-w-prose text-(--text-muted)">{copyShell.ricostruzioni}</p>
        </div>
      </div>
    </footer>
  )
}
