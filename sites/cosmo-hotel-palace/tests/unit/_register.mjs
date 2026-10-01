// Registra l'hook di risoluzione dei moduli per i test (vedi _resolve.mjs).
import { register } from "node:module";

register("./_resolve.mjs", import.meta.url);
