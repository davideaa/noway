import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { EMAIL_SHOWN, FILM_H1, FILM_PHRASE_A, FILM_PHRASE_B, MAILTO_LOWER } from "@/lib/site";

/** Senza WebGL: niente film, stessa pagina, stesso testo, stessi bottoni. Sobrio. */
export function FilmFallback() {
  return (
    <div className="film-fallback">
      <div className="wrap film-fallback__in">
        <h1 className="film-h1">{FILM_H1}</h1>
        <p className="film-line film-line--s">{FILM_PHRASE_A}</p>
        <p className="film-line film-line--s film-line--mute">{FILM_PHRASE_B}</p>
        <p className="t-sec film-fallback__note">
          Questo browser non ha la grafica 3D necessaria per il film: i contenuti sono tutti nella pagina dei dettagli.
        </p>
        <div className="film-cta">
          <Link href="/dettagli" className={buttonVariants()}>
            Vedi i dettagli
          </Link>
          <a href={MAILTO_LOWER} className={buttonVariants({ variant: "outline" })} aria-label={`Scrivi via email a ${EMAIL_SHOWN}`}>
            Scrivi via email
          </a>
        </div>
        <p className="film-mail mono">{EMAIL_SHOWN}</p>
      </div>
    </div>
  );
}
