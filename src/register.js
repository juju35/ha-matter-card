// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
import { pickerDefine } from "./card-picker.js";
import { VERSION } from "./core.js";
import { MatterCard } from "./full-card.js";
import { MatterMiniCard } from "./mini-card.js";
import { MatterCardEditor, MatterMiniCardEditor } from "./visual-editors.js";

export const define = (name, cls) => {
  if (!customElements.get(name)) pickerDefine(name, cls);
};
define("matter-card", MatterCard);
define("matter-mini-card", MatterMiniCard);
define("matter-card-editor", MatterCardEditor);
define("matter-mini-card-editor", MatterMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "matter-card",
    name: "Matter Card",
    description: "Every node of the Matter integration with its transport (Thread, Wi-Fi, Ethernet) and health, the Thread network, under an animated banner.",
  },
  {
    type: "matter-mini-card",
    name: "Matter Mini Card",
    description: "The health of the Matter network at a glance, with a detail button to the full card.",
  },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-matter-card" });
}

console.info(
  `%c MATTER-CARD %c v${VERSION} `,
  "color: white; background: #5b5bd6; font-weight: 700;",
  "color: #5b5bd6; background: white; font-weight: 700;",
);
