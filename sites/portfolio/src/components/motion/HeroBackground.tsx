/**
 * Sfondo dell'hero: solo livelli CSS (bagliore, velo, reticolo, sfumatura).
 * Lo ShaderGradient animato che stava qui e' stato tolto: su /dettagli ora il
 * movimento e' il fluido al mouse (FluidCursor, dietro a tutta la pagina), e
 * due WebGL insieme sarebbero stati doppi. Toglierlo evita anche ~290 kB di
 * three.js e un contesto WebGL su telefono, dove Safari chiudeva la pagina.
 * I livelli sono semitrasparenti: il fluido passa sotto e si vede.
 */
export function HeroBackground() {
  return (
    <div className="hero__bg" aria-hidden="true">
      <div className="hero__fallback" />
      <div className="hero__veil" />
      <div className="hero__reticle" />
      <div className="hero__fade" />
    </div>
  );
}
