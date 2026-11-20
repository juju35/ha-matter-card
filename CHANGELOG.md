# Changelog

## 1.2.0 - 2026-11-20

### Features
- `show_title` and `show_subtitle` (both cards, in the visual editor, every language), as in the other ha-* cards: hide the header's title or its stats line; the status pill stays.

### Performance
- The Matter Server version is read from the update entities only (listed once per entity registry change), instead of walking every state of the home on each render.
- The Matter devices are found once per device registry change (and `exclude`), instead of on every state change of Home Assistant.
- The visual editor no longer redraws its form on every state change while it is open: its data and fields are set again only when they change.

## 1.1.1 - 2026-11-18

### Fixes
- Illustrated header: `auto` now follows the Home Assistant theme alone — a light theme keeps the day picture after sunset, a dark theme still shows the night one.

## 1.1.0 - 2026-11-17

### Features
- Illustrated header, the same on both cards (90 px): a house section with the Matter hub at its centre linked to six devices, packets travelling along the links and a pulsing ping around the hub, on a 10 px purple Matter network ground strip edge to edge (day and night). An unreachable node turns its device and link red, the device blinking.
- The Matter badge's colour follows the network's status (healthy purple, low battery amber, unreachable node red, no node grey), day and night, on the full and mini cards and in the classic header.
- The mini card gets the full card's banner (title and status pill on the sky, the scene at the right, its detail button in the corner), with its chips below; `illustration: false` keeps its compact layout.
- A status pill after the title on both cards and both headers (*Healthy*, *2 issues*, *No devices*): a dot and its label in the badge's colour; beside the title only when the whole title and its whole label fit there (measured, in every language), else on a line of its own under the subtitle (the subtitle then on one line); its dot alone when its label does not fit in the banner above the strip, and on cards of 200 px or less. The mini card's expand / collapse button is a 24 px frosted round in the banner's top-right corner, the scene standing left of it.
- Night banner when the sun is below the horizon (`sun.sun`) or with the dark theme; still forced with `illustration_theme: day | night`.
- Night picture with the dark theme even while the sun is up.

### Fixes
- **Whole device names**: the transport tag (Thread, Wi-Fi, Ethernet) moves to the state line, after the state or under it when both do not fit, so the name has the tile's width and goes on to a second line rather than be cut (« Kids room se… »); the tiles stay two per row down to a 390 px card.

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
