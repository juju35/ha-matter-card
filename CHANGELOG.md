# Changelog

## 1.0.0 - 2026-11-16

### Features
- **Matter Card** (`custom:matter-card`): every node of Home Assistant's [Matter integration](https://www.home-assistant.io/integrations/matter/) (Matter Server), found in the device registry, as a 56 px tile: the icon of its main entity, its name, a state line (its state with its power, Wi-Fi signal, Thread router role or battery), a coloured transport tag (Thread, Wi-Fi, Ethernet) and a status dot. Healthy tiles stay neutral; only issues are coloured: a low battery in amber, an unavailable node in red (« Unavailable · 1 h »).
- Animated banner: the Matter hub linked to its devices by flowing dashes, packets pulsing along the strip; when a node is unavailable, a device and its link turn red and blink. Night banner with the dark theme, or forced with `illustration_theme: day | night`; `illustration: false` gives a classic header; `prefers-reduced-motion` is honoured.
- Banner statistics: Matter Server version (from its update entity), node count and fabric count; status chips under the banner (online, unavailable, low battery) with the fabrics' names on the right.
- Thread network tile: network name, channel, PAN ID and border routers of the preferred dataset of the [Thread integration](https://www.home-assistant.io/integrations/thread/) (`thread/list_datasets`, `thread/discover_routers`), else what the Thread nodes report; its node count.
- Node popup at the top of the card, from the Matter integration's `matter/node_diagnostics` command: node ID, vendor and product, firmware, network, role, IP and MAC addresses, Wi-Fi signal, last seen, fabrics, and a button to the device page; closed by a click elsewhere, Escape, or when the card leaves the page.
- « Commission device » button (administrators), opening Home Assistant's Matter add-device dialog.
- **Matter Mini Card** (`custom:matter-mini-card`): the Matter badge, the network status (« Healthy », « 2 issues »), the Thread / Wi-Fi / Ethernet counts and the issues as chips, with a detail button that unfolds the full card and folds back on a click elsewhere.
- Options: `title`, `sort` (by name or issues first), `columns`, `battery_threshold`, `show_thread`, `show_commission`, `show_bridged`, `illustration`, `illustration_theme`, `zoom`, `language`, and `exclude` (YAML only).
- Visual editors for both cards, the mini card's with the full card's options; 22 languages, with only English in the bundle and each other language loaded on demand.
