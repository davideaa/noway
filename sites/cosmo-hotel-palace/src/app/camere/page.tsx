/*
 * /camere/ — hub senza canvas (UX 5.1). Ordine: h1 «Camere e suite» + sottotitolo + corpo →
 * «Chi viaggia?» → le tre schede ad arco → «Le tre camere a confronto» → i comuni.
 * Server component: i pezzi che hanno stato (consigliere, schede, confronto) sono componenti client.
 */
import { Icon, type IconName } from "@/components/art/Icons";
import { Advisor, AdvisorProvider } from "@/components/rooms/Advisor";
import { Compare } from "@/components/rooms/Compare";
import { RoomCards } from "@/components/rooms/RoomCard";
import { copy } from "@/content/copy";
import { dotazioniComuni } from "@/content/rooms";
import { JsonLdBreadcrumb } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import s from "@/components/rooms/rooms.module.css";

export const metadata = pageMetadata("camere");

/** Un'icona per ogni dotazione comune (stesso ordine di `dotazioniComuni`). */
const ICONE: readonly IconName[] = ["wifi", "tv", "clima", "bagno", "cassaforte", "calice"];

export default function CamerePage() {
  const k = copy.camere;
  return (
    <div className={`wrap ${s.hub}`}>
      <JsonLdBreadcrumb chiave="camere" />

      <header className={s.hubTesta}>
        <h1>{k.h1}</h1>
        <p className={`t-lead ${s.hubLead}`}>{k.sottotitolo}</p>
        <p className={s.hubCorpo}>{k.corpo}</p>
      </header>

      <AdvisorProvider>
        <Advisor />
        <RoomCards />
      </AdvisorProvider>

      <Compare />

      <section className={s.comuni} aria-labelledby="comuni-titolo">
        <h2 id="comuni-titolo" className="t-h3">
          {k.comuniTitolo}
        </h2>
        <ul className={s.comuniLista}>
          {dotazioniComuni.map((d, i) => (
            <li key={d}>
              <Icon nome={ICONE[i] ?? "spunta"} size={24} aria-hidden="true" />
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
