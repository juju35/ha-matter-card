// ---------------------------------------------------------------------------
// Matter nodes, from the device and entity registries
// ---------------------------------------------------------------------------
import { ICONS } from "./core.js";
import { num, unavailableState } from "./helpers.js";

export const DOMAIN = "matter";
export const TRANSPORTS = ["thread", "wifi", "ethernet"];

// The node id and endpoint of a Matter device, from its device registry identifier: `deviceid_<compressed fabric
// id>-<node id>-MatterNodeDevice` for a node, `…-<endpoint>` for a device bridged by a node (homeassistant/components/
// matter/helpers.py, get_device_id). Null when the device has no such identifier.
export const matterId = (device) => {
  for (const ident of device?.identifiers || []) {
    if (!Array.isArray(ident) || ident[0] !== DOMAIN) continue;
    const m = /^deviceid_[0-9a-f]+-([0-9a-f]+)-(MatterNodeDevice|\d+)$/i.exec(String(ident[1]));
    if (m) return { node: Number.parseInt(m[1], 16), endpoint: m[2] === "MatterNodeDevice" ? null : Number(m[2]) };
  }
  return null;
};

export const isMatterDevice = (d) => !!d && !d.disabled_by && (d.identifiers || []).some((i) => Array.isArray(i) && i[0] === DOMAIN);

// The entities of each device, memoized on the registry objects (Home Assistant replaces them on every change).
export let _byDevice = { entities: null, map: new Map() };
export const entitiesByDevice = (hass) => {
  if (_byDevice.entities === hass?.entities) return _byDevice.map;
  const map = new Map();
  for (const e of Object.values(hass?.entities || {})) {
    if (!e?.device_id) continue;
    if (!map.has(e.device_id)) map.set(e.device_id, []);
    map.get(e.device_id).push(e);
  }
  _byDevice = { entities: hass?.entities, map };
  return map;
};

// The Matter devices of the registry: the nodes (one device each), and the devices bridged by them, under their bridge.
// `exclude` (device ids or names) leaves devices out.
// Kept per device registry object and `exclude`: the card looks its devices up on every state change of Home
// Assistant, which should not walk the whole registry each time.
export const _matterDevices = new WeakMap();
export const matterDevices = (hass, config = {}) => {
  const reg = hass?.devices;
  const key = JSON.stringify(Array.isArray(config.exclude) ? config.exclude : []);
  const hit = reg && _matterDevices.get(reg);
  if (hit && hit.key === key) return hit.value;
  const value = scanMatterDevices(hass, config);
  if (reg) _matterDevices.set(reg, { key, value });
  return value;
};
export const scanMatterDevices = (hass, config) => {
  const exclude = new Set((Array.isArray(config.exclude) ? config.exclude : []).map((x) => String(x).toLowerCase()));
  const all = Object.values(hass?.devices || {}).filter(isMatterDevice);
  const left = (d) => exclude.has(d.id.toLowerCase()) || exclude.has(String(d.name_by_user || d.name || "").toLowerCase());
  const ids = new Set(all.map((d) => d.id));
  const bridged = new Map();
  const nodes = [];
  for (const d of all) {
    if (left(d)) continue;
    const mid = matterId(d);
    const viaMatter = d.via_device_id && ids.has(d.via_device_id);
    if ((mid && mid.endpoint !== null) || (!mid && viaMatter)) {
      if (!bridged.has(d.via_device_id)) bridged.set(d.via_device_id, []);
      bridged.get(d.via_device_id).push(d);
    } else nodes.push(d);
  }
  return { nodes, bridged };
};

// Domains a device's main entity is taken from, the first first; then the sensors (a battery last).
export const MAIN_DOMAINS = [
  "lock", "light", "cover", "climate", "fan", "valve", "vacuum", "water_heater", "humidifier", "media_player", "switch",
  "binary_sensor", "sensor", "event", "button", "number", "select",
];
export const DIAG_KEYS = new Set(["wifi_rssi", "thread_channel", "thread_routing_role", "thread_network_name"]);

// What the card reads among a device's entities: its main entity, its battery, its power, its Wi-Fi signal and its
// Thread role and network (Matter's diagnostic sensors, found by translation key).
export const deviceEntities = (hass, deviceId) => {
  const list = entitiesByDevice(hass).get(deviceId) || [];
  const states = hass?.states || {};
  const out = { all: list.map((e) => e.entity_id), main: null, battery: null, batteryLow: null, power: null, rssi: null, role: null, channel: null, threadName: null };
  let best = null;
  for (const e of list) {
    const st = states[e.entity_id];
    if (!st) continue;
    const domain = e.entity_id.split(".")[0];
    const dc = st.attributes?.device_class;
    const key = e.platform === DOMAIN || !e.platform ? e.translation_key : undefined;
    if (key === "wifi_rssi" || (!out.rssi && domain === "sensor" && dc === "signal_strength")) out.rssi = e.entity_id;
    if (key === "thread_routing_role") out.role = e.entity_id;
    if (key === "thread_channel") out.channel = e.entity_id;
    if (key === "thread_network_name") out.threadName = e.entity_id;
    if (domain === "sensor" && dc === "battery" && !out.battery) out.battery = e.entity_id;
    if (domain === "binary_sensor" && dc === "battery" && !out.batteryLow) out.batteryLow = e.entity_id;
    if (domain === "sensor" && dc === "power" && !out.power) out.power = e.entity_id;
    if (e.entity_category || e.hidden || DIAG_KEYS.has(key)) continue;
    let rank = MAIN_DOMAINS.indexOf(domain);
    if (rank < 0) rank = MAIN_DOMAINS.length;
    if (domain === "sensor" && ["battery", "signal_strength", "voltage"].includes(dc)) rank += 10;
    if (!best || rank < best.rank) best = { rank, id: e.entity_id };
  }
  out.main = best?.id ?? null;
  return out;
};

// The icon of an entity, as an mdi path of ICONS (or an mdi name, for an entity icon of its own).
export const BINARY_ICONS = { door: "door", garage_door: "garage", window: "window", opening: "door", motion: "motion", occupancy: "motion", presence: "motion", moisture: "moisture", smoke: "smoke", carbon_monoxide: "smoke", battery: "battery" };
export const SENSOR_ICONS = { temperature: "temperature", humidity: "humidity", power: "power", energy: "power", battery: "battery", pm25: "air", pm10: "air", aqi: "air", volatile_organic_compounds: "air", carbon_dioxide: "air" };
export const COVER_ICONS = { blind: "blinds", shade: "blinds", shutter: "shutter", curtain: "curtains", garage: "garage", gate: "garage", door: "door", window: "window" };
export const DOMAIN_ICONS = { light: "light", lock: "lock", climate: "thermostat", fan: "fan", valve: "valve", vacuum: "vacuum", water_heater: "boiler", humidifier: "humidifier", media_player: "speaker", button: "button", event: "button", cover: "blinds" };
export const iconOf = (hass, entityId, isBridge = false) => {
  if (isBridge) return { path: ICONS.bridge };
  const st = entityId && hass?.states?.[entityId];
  if (!st) return { path: ICONS.chip };
  const custom = hass.entities?.[entityId]?.icon || st.attributes?.icon;
  if (custom) return { mdi: custom };
  const domain = entityId.split(".")[0];
  const dc = st.attributes?.device_class;
  let key = DOMAIN_ICONS[domain];
  if (domain === "switch") key = dc === "outlet" ? "outlet" : "plug";
  if (domain === "binary_sensor") key = BINARY_ICONS[dc] || "chip";
  if (domain === "sensor") key = SENSOR_ICONS[dc] || "chip";
  if (domain === "cover") key = COVER_ICONS[dc] || "blinds";
  return { path: ICONS[key] || ICONS.chip };
};

// A node's transport: Matter's network type when the diagnostics are in, else read from its diagnostic sensors.
export const transportOf = (diag, ents) => {
  if (diag && TRANSPORTS.includes(diag.network_type)) return diag.network_type;
  if (ents.role || ents.channel || ents.threadName) return "thread";
  if (ents.rssi) return "wifi";
  return "unknown";
};

// Everything the card shows of a node, worked out from the registries, the states and its diagnostics. `level` is
// ok, warn (low battery) or alert (unavailable).
export const nodeInfo = (hass, device, { diag = null, bridged = [], threshold = 20, lastSeen = null } = {}) => {
  const ents = deviceEntities(hass, device.id);
  const states = hass?.states || {};
  const main = ents.main ? states[ents.main] : null;
  const ownStates = ents.all.map((id) => states[id]).filter(Boolean);
  // Matter marks every entity of a node unavailable when the node is: the main entity tells, else all of them,
  // else the diagnostics.
  const available = main ? !unavailableState(main) : ownStates.length ? ownStates.some((s) => !unavailableState(s)) : diag ? diag.available !== false : true;
  const battery = num(ents.battery ? states[ents.battery]?.state : null);
  const lowFlag = ents.batteryLow && states[ents.batteryLow]?.state === "on";
  const lowBattery = available && (lowFlag || (battery !== null && battery < threshold));
  const isBridge = diag?.node_type === "bridge" || bridged.length > 0;
  const changed = main?.last_changed || ownStates.map((s) => s.last_changed).sort().pop();
  const updated = ownStates.map((s) => s.last_updated || s.last_changed).filter(Boolean).sort().pop();
  const mid = matterId(device);
  return {
    id: device.id,
    device,
    name: device.name_by_user || device.name || device.model || device.id,
    node: diag?.node_id ?? mid?.node ?? null,
    icon: iconOf(hass, ents.main, isBridge && !main),
    main: ents.main,
    ents,
    available,
    battery,
    lowBattery,
    level: !available ? "alert" : lowBattery ? "warn" : "ok",
    transport: transportOf(diag, ents),
    role: (ents.role && states[ents.role]?.state) || diag?.node_type || null,
    rssi: num(ents.rssi ? states[ents.rssi]?.state : null),
    power: ents.power && !unavailableState(states[ents.power]) ? states[ents.power] : null,
    endpoints: bridged.length,
    isBridge,
    since: !available && changed ? Date.parse(changed) : null,
    lastSeen: lastSeen ?? (available ? (updated ? Date.parse(updated) : null) : changed ? Date.parse(changed) : null),
    diag,
  };
};

// The fabrics the nodes belong to, from their diagnostics: one per fabric id and vendor, named by its label, else
// its vendor.
export const fabricsOf = (diags) => {
  const out = new Map();
  for (const d of diags) {
    for (const f of d?.active_fabrics || []) {
      const key = `${f.vendor_id}-${f.fabric_id}`;
      if (!out.has(key)) out.set(key, String(f.fabric_label || f.vendor_name || `0x${Number(f.vendor_id || 0).toString(16).toUpperCase()}`));
    }
  }
  return [...out.values()];
};

// Network-wide counts.
export const summaryOf = (infos) => {
  const count = { thread: 0, wifi: 0, ethernet: 0, unknown: 0 };
  for (const i of infos) count[i.transport] = (count[i.transport] || 0) + 1;
  const unavailable = infos.filter((i) => !i.available).length;
  const lowBattery = infos.filter((i) => i.lowBattery).length;
  return { total: infos.length, online: infos.length - unavailable, unavailable, lowBattery, issues: unavailable + lowBattery, count };
};

// The Thread network: the preferred dataset of the Thread integration (admins only), else what the Thread nodes
// report (network name, channel); its border routers are those discovered on its extended PAN id.
export const threadOf = (infos, dataset, routers, hass) => {
  const nodes = infos.filter((i) => i.transport === "thread");
  const states = hass?.states || {};
  const pick = (fn) => {
    const seen = new Map();
    for (const i of nodes) {
      const v = fn(i);
      if (v !== null && v !== undefined && v !== "" && v !== "unknown" && v !== "unavailable") seen.set(v, (seen.get(v) || 0) + 1);
    }
    return [...seen.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  };
  const name = dataset?.network_name || pick((i) => i.diag?.network_name || (i.ents.threadName ? states[i.ents.threadName]?.state : null));
  const channel = dataset?.channel ?? num(pick((i) => (i.ents.channel ? states[i.ents.channel]?.state : null)));
  let pan = dataset?.pan_id ?? null;
  if (pan !== null && /^[0-9a-f]+$/i.test(String(pan))) pan = `0x${String(pan).toUpperCase().padStart(4, "0")}`;
  const xpan = dataset?.extended_pan_id ? String(dataset.extended_pan_id).toLowerCase() : null;
  const list = Array.isArray(routers) ? routers : null;
  const brs = list ? list.filter((r) => !xpan || String(r.extended_pan_id || "").toLowerCase() === xpan) : null;
  const down = nodes.filter((i) => !i.available).length;
  return {
    known: !!dataset || nodes.length > 0,
    name,
    channel,
    pan,
    routers: brs ? new Set(brs.map((r) => r.extended_address || r.instance_name)).size : null,
    nodes: nodes.length,
    down,
    // The network tile stays neutral while a single node is down (that node shows it): red only when none answers.
    level: nodes.length && down === nodes.length ? "alert" : "ok",
  };
};

// ---------------------------------------------------------------------------
// Websocket data: node diagnostics, Thread datasets and border routers, network topology (last seen)
// Shared by every card of the page, so a mini card and a full card ask once.
// ---------------------------------------------------------------------------

export const DIAG_TTL = 10 * 60 * 1000;
export const RETRY_MS = 60 * 1000;
export const store = {
  rev: 0,
  diag: new Map(), // device id → { at, data, available, pending }
  queue: [],
  running: 0,
  thread: { at: 0, pending: false, datasets: null, failed: false },
  topo: { at: 0, pending: false, seen: new Map(), failed: 0 },
  routers: { subs: 0, unsub: null, map: new Map(), pending: false, failed: false },
  cards: new Set(),
};
export const bump = () => {
  store.rev++;
  for (const c of store.cards) c._dataChanged();
};

export const runQueue = () => {
  while (store.running < 3 && store.queue.length) {
    const { hass, id } = store.queue.shift();
    const entry = store.diag.get(id);
    store.running++;
    Promise.resolve()
      .then(() => hass.callWS({ type: "matter/node_diagnostics", device_id: id }))
      .then(
        (data) => {
          entry.data = data && typeof data === "object" ? data : null;
          entry.at = Date.now();
          entry.failed = false;
        },
        () => {
          // A node the server cannot reach answers with an error: kept as it was, asked again a minute later.
          entry.at = Date.now() - DIAG_TTL + RETRY_MS;
          entry.failed = true;
        },
      )
      .finally(() => {
        entry.pending = false;
        store.running--;
        bump();
        runQueue();
      });
  }
};

// Asks the diagnostics of the nodes that have none, whose diagnostics are old, or whose availability changed.
export const refreshDiagnostics = (hass, infos) => {
  if (typeof hass?.callWS !== "function") return;
  const now = Date.now();
  for (const i of infos) {
    let entry = store.diag.get(i.id);
    if (!entry) store.diag.set(i.id, (entry = { at: 0, data: null, available: i.available, pending: false }));
    if (entry.pending) continue;
    if (now - entry.at < DIAG_TTL && entry.available === i.available) continue;
    entry.available = i.available;
    entry.pending = true;
    store.queue.push({ hass, id: i.id });
  }
  runQueue();
};

export const isAdmin = (hass) => !!hass?.user?.is_admin;
export const hasComponent = (hass, c) => !Array.isArray(hass?.config?.components) || hass.config.components.includes(c);

// A websocket command of an admin, asked every 10 minutes (an hour after a failure, as with an older server), its
// answer kept in `s` by `keep`.
export const refreshEvery = (hass, s, type, keep, ok = true) => {
  if (!ok || s.pending || typeof hass?.callWS !== "function" || !isAdmin(hass)) return;
  if (Date.now() - s.at < (s.failed ? 6 : 1) * DIAG_TTL) return;
  s.pending = true;
  Promise.resolve()
    .then(() => hass.callWS({ type }))
    .then(
      (r) => {
        keep(r);
        s.failed = false;
      },
      () => {
        s.failed = true;
      },
    )
    .finally(() => {
      s.at = Date.now();
      s.pending = false;
      bump();
    });
};

// The Thread integration's datasets.
export const refreshThread = (hass) =>
  refreshEvery(
    hass,
    store.thread,
    "thread/list_datasets",
    (r) => {
      store.thread.datasets = Array.isArray(r?.datasets) ? r.datasets : [];
    },
    hasComponent(hass, "thread"),
  );

export const preferredDataset = () => {
  const ds = store.thread.datasets;
  return ds ? ds.find((d) => d.preferred) || ds[0] || null : null;
};

// The Matter network topology (recent Matter Server): the time each node was last seen.
export const refreshTopology = (hass) =>
  refreshEvery(hass, store.topo, "matter/network_topology", (r) => {
    const seen = new Map();
    for (const n of r?.nodes || []) {
      const v = num(n?.last_seen);
      if (n?.ha_device_id && v !== null) seen.set(n.ha_device_id, v > 1e12 ? v : v * 1000);
    }
    store.topo.seen = seen;
  });

// The border routers seen by the Thread integration's mDNS discovery (admin): one subscription for the page while a
// card is shown.
export const subscribeRouters = (hass) => {
  const r = store.routers;
  r.subs++;
  if (r.unsub || r.pending || r.failed || !isAdmin(hass) || !hasComponent(hass, "thread") || typeof hass?.connection?.subscribeMessage !== "function") return;
  r.pending = true;
  Promise.resolve()
    .then(() =>
      hass.connection.subscribeMessage(
        (msg) => {
          if (msg?.type === "router_discovered") r.map.set(msg.key, msg.data);
          else if (msg?.type === "router_removed") r.map.delete(msg.key);
          r.seen = true;
          bump();
        },
        { type: "thread/discover_routers" },
      ),
    )
    .then(
      (unsub) => {
        r.pending = false;
        r.unsub = unsub;
        if (r.subs <= 0) unsubscribeRouters(true);
      },
      () => {
        r.pending = false;
        r.failed = true;
      },
    );
};
export const unsubscribeRouters = (force = false) => {
  const r = store.routers;
  if (!force) r.subs = Math.max(0, r.subs - 1);
  if (r.subs > 0 || !r.unsub) return;
  const u = r.unsub;
  r.unsub = null;
  r.map.clear();
  r.seen = false;
  Promise.resolve()
    .then(() => u())
    .catch(() => {});
};

// The version of the Matter Server, from its update entity (the add-on or app of the same name), when there is one.
// Only the update entities are read: their ids are listed once per entity registry (a new object on each change of the
// registry), instead of walking every state of the home on each render.
export const _updateIds = new WeakMap();
export const serverVersion = (hass) => {
  const states = hass?.states;
  if (!states) return null;
  const reg = hass.entities;
  let ids = reg ? _updateIds.get(reg) : null;
  if (!ids) {
    ids = Object.keys(reg || states).filter((id) => id.startsWith("update."));
    if (reg) _updateIds.set(reg, ids);
  }
  for (const id of ids) {
    const st = states[id];
    if (!st) continue;
    const title = String(st.attributes?.title || st.attributes?.friendly_name || "");
    if (/matter server/i.test(title) && st.attributes?.installed_version) return String(st.attributes.installed_version);
  }
  return null;
};
