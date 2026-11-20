import assert from "node:assert/strict";
import { test } from "node:test";
import { mockHass, NOW } from "../scripts/screenshots/mock.mjs";
import { load } from "./load.mjs";

const mc = load([
  "matterId",
  "matterDevices",
  "deviceEntities",
  "nodeInfo",
  "summaryOf",
  "fabricsOf",
  "threadOf",
  "refreshDiagnostics",
  "refreshThread",
  "subscribeRouters",
  "unsubscribeRouters",
  "store",
  "plural",
  "serverVersion",
  "STRINGS",
  "MatterCard",
  "MatterMiniCard",
  "MatterCardEditor",
  "MatterMiniCardEditor",
  "document",
  "window",
  "history",
]);

// The websocket answers of the mock, in the shared store, as if the cards had asked them.
const settle = () => new Promise((r) => setTimeout(r, 0));
const withData = async (hass = mockHass()) => {
  mc.store.diag.clear();
  mc.store.thread.at = 0;
  mc.store.thread.datasets = null;
  const { nodes } = mc.matterDevices(hass);
  mc.refreshDiagnostics(hass, nodes.map((d) => mc.nodeInfo(hass, d)));
  mc.refreshThread(hass);
  for (let i = 0; i < 10; i++) await settle();
  return hass;
};
const card = (Cls, config = {}, hass = mockHass()) => {
  const el = new Cls();
  el._now = () => NOW;
  el._config = { type: "custom:x", ...config };
  el._hass = hass;
  el._update = () => {};
  return el;
};
const render = (el) => {
  el._collect();
  return el._render();
};
const text = (html) => html.replace(/<style>[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

test("a Matter device identifier gives its node id, and the endpoint of a bridged device", () => {
  assert.deepEqual({ ...mc.matterId({ identifiers: [["matter", "deviceid_8E2F31A4C0B6D795-000000000000000A-MatterNodeDevice"]] }) }, { node: 10, endpoint: null });
  assert.deepEqual({ ...mc.matterId({ identifiers: [["matter", "serial_X"], ["matter", "deviceid_8E2F31A4C0B6D795-000000000000000A-12"]] }) }, { node: 10, endpoint: 12 });
  assert.equal(mc.matterId({ identifiers: [["zha", "00:11"]] }), null);
});

test("the nodes are the Matter devices of the registry; bridged devices go under their bridge; exclude leaves some out", () => {
  const hass = mockHass();
  const { nodes, bridged } = mc.matterDevices(hass);
  assert.equal(nodes.length, 8);
  assert.ok(!nodes.some((d) => d.id === "dev_other"));
  assert.equal(bridged.get("dev_bridge").length, 4);
  assert.equal(mc.matterDevices(hass, { exclude: ["dev_lamp", "desk plug"] }).nodes.length, 6);
});

test("a node's main entity, battery, power, Wi-Fi signal and Thread role", () => {
  const hass = mockHass();
  const lamp = mc.deviceEntities(hass, "dev_lamp");
  assert.equal(lamp.main, "light.living_room_lamp");
  assert.equal(lamp.role, "sensor.living_room_lamp_routing_role");
  const door = mc.deviceEntities(hass, "dev_door");
  assert.equal(door.main, "binary_sensor.patio_door");
  assert.equal(door.battery, "sensor.patio_door_battery");
  assert.equal(mc.deviceEntities(hass, "dev_plug").power, "sensor.desk_plug_power");
  assert.equal(mc.deviceEntities(hass, "dev_lock").rssi, "sensor.entrance_lock_rssi");
  // The temperature, not the battery, is the main entity of a sensor.
  assert.equal(mc.deviceEntities(hass, "dev_kids").main, "sensor.kids_room_temperature");
});

test("levels: unavailable is an alert, a battery under the threshold a warning; the transport without diagnostics", () => {
  const hass = mockHass();
  const info = (id, opts) => mc.nodeInfo(hass, hass.devices[id], opts);
  assert.equal(info("dev_kids").level, "alert");
  assert.equal(info("dev_kids").since, NOW - 60 * 60000);
  assert.equal(info("dev_blind").level, "warn");
  assert.equal(info("dev_blind", { threshold: 10 }).level, "ok");
  assert.equal(info("dev_lamp").level, "ok");
  // Read from the diagnostic sensors until the diagnostics are in.
  assert.equal(info("dev_lamp").transport, "thread");
  assert.equal(info("dev_lock").transport, "wifi");
  assert.equal(info("dev_bridge").transport, "unknown");
  assert.equal(info("dev_bridge", { diag: { network_type: "ethernet", node_type: "bridge" } }).transport, "ethernet");
  assert.equal(info("dev_bridge", { bridged: [1, 2] }).isBridge, true);
});

test("node diagnostics are asked once per node through matter/node_diagnostics, then kept", async () => {
  const hass = mockHass();
  const asked = [];
  const call = hass.callWS;
  hass.callWS = (msg) => {
    asked.push(msg);
    return call(msg);
  };
  await withData(hass);
  assert.equal(asked.filter((m) => m.type === "matter/node_diagnostics").length, 8);
  assert.ok(asked.every((m) => m.type !== "matter/node_diagnostics" || typeof m.device_id === "string"));
  assert.equal(mc.store.diag.get("dev_lock").data.network_type, "wifi");
  // Asked again: nothing new.
  const { nodes } = mc.matterDevices(hass);
  mc.refreshDiagnostics(hass, nodes.map((d) => mc.nodeInfo(hass, d)));
  await settle();
  assert.equal(asked.filter((m) => m.type === "matter/node_diagnostics").length, 8);
  assert.ok(asked.some((m) => m.type === "thread/list_datasets"));
});

test("a non-admin user gets no Thread dataset and no commission button", async () => {
  const hass = mockHass({ admin: false });
  const asked = [];
  hass.callWS = async (msg) => {
    asked.push(msg.type);
    return {};
  };
  mc.store.thread.at = 0;
  mc.refreshThread(hass);
  await settle();
  assert.ok(!asked.includes("thread/list_datasets"));
  assert.doesNotMatch(render(card(mc.MatterCard, {}, hass)), /Commission device/);
});

test("summary, fabrics and the Thread network", async () => {
  const hass = await withData();
  const el = card(mc.MatterCard, {}, hass);
  el._collect();
  assert.deepEqual({ ...el._summary, count: { ...el._summary.count } }, {
    total: 8, online: 7, unavailable: 1, lowBattery: 1, issues: 2, count: { thread: 5, wifi: 2, ethernet: 1, unknown: 0 },
  });
  assert.deepEqual([...el._fabrics], ["HA", "Apple Home"]);
  const th = el._thread;
  assert.equal(th.name, "Home-Thread");
  assert.equal(th.channel, 25);
  assert.equal(th.pan, "0x1A2B");
  assert.equal(th.nodes, 5);
  // One Thread node down: the network tile stays neutral.
  assert.equal(th.level, "ok");
});

test("border routers: those of the preferred dataset's extended PAN id, from thread/discover_routers", async () => {
  const hass = mockHass();
  mc.store.routers.failed = false;
  mc.subscribeRouters(hass);
  for (let i = 0; i < 5; i++) await settle();
  assert.equal(mc.store.routers.map.size, 2);
  const infos = [];
  const th = mc.threadOf(infos, { extended_pan_id: "1A2B3C4D5E6F7A8B", network_name: "X" }, [...mc.store.routers.map.values(), { extended_pan_id: "ffff", extended_address: "zz" }], hass);
  assert.equal(th.routers, 2);
  mc.unsubscribeRouters();
  assert.equal(mc.store.routers.map.size, 0);
});

test("the Thread network without the dataset (non-admin): name and channel from the nodes", () => {
  const hass = mockHass();
  hass.states["sensor.lamp_channel"] = { entity_id: "sensor.lamp_channel", state: "15", attributes: {} };
  hass.entities["sensor.lamp_channel"] = { entity_id: "sensor.lamp_channel", device_id: "dev_lamp", platform: "matter", translation_key: "thread_channel", entity_category: "diagnostic" };
  hass.entities = { ...hass.entities };
  const infos = [mc.nodeInfo(hass, hass.devices.dev_lamp, { diag: { network_type: "thread", network_name: "Mesh" } })];
  const th = mc.threadOf(infos, null, null, hass);
  assert.equal(th.name, "Mesh");
  assert.equal(th.channel, 15);
  assert.equal(th.pan, null);
  assert.equal(th.routers, null);
});

test("the full card: banner stats, status chips, fabrics, Thread tile, one tile per node and the commission button", async () => {
  const hass = await withData();
  const html = render(card(mc.MatterCard, {}, hass));
  const txt = text(html);
  assert.match(txt, /Matter devices/);
  assert.match(html, /<span>Server 8\.1<\/span><span>8 nodes<\/span><span>2 fabrics<\/span>/);
  assert.match(txt, /7 \/ 8 online 1 unavailable 1 low battery HA · Apple Home/);
  assert.match(txt, /Thread · Home-Thread Channel 25 · PAN 0x1A2B/);
  assert.equal((html.match(/data-node="/g) || []).length, 8);
  assert.match(txt, /Kids room sensor Unavailable · 1 h Thread/);
  assert.match(txt, /Bedroom blind Battery 18% Thread/);
  assert.match(txt, /Desk plug On · 12\.4 W Thread/);
  assert.match(txt, /Entrance lock Locked · −58 dBm Wi-Fi/);
  assert.match(txt, /Living room lamp On · router Thread/);
  assert.match(txt, /Patio door Closed · 88% Thread/);
  assert.match(txt, /Bridge 4 endpoints Ethernet/);
  assert.match(html, /class="tile lvl-alert"[^>]*data-node="dev_kids"/);
  assert.match(html, /class="tile lvl-warn"[^>]*data-node="dev_blind"/);
  assert.match(html, /Commission device/);
  // The unavailable node blinks red in the banner; a healthy network has none.
  assert.match(html, /class="dev down"/);
  assert.doesNotMatch(render(card(mc.MatterCard, {}, await withData(mockHass({ healthy: true })))), /class="dev down"/);
});

test("sort, columns, show_thread, show_commission, show_bridged and illustration", async () => {
  const hass = await withData();
  const order = (html) => [...html.matchAll(/data-node="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(order(render(card(mc.MatterCard, {}, hass))).slice(0, 2), ["dev_blind", "dev_bridge"]);
  assert.deepEqual(order(render(card(mc.MatterCard, { sort: "status" }, hass))).slice(0, 2), ["dev_kids", "dev_blind"]);
  assert.match(render(card(mc.MatterCard, { columns: 3 }, hass)), /--cols:3/);
  assert.doesNotMatch(render(card(mc.MatterCard, { show_thread: false }, hass)), /data-key="thread"/);
  assert.match(render(card(mc.MatterCard, {}, hass)), /data-key="thread"/);
  assert.doesNotMatch(render(card(mc.MatterCard, { show_commission: false }, hass)), /Commission device/);
  assert.equal((render(card(mc.MatterCard, { show_bridged: true }, hass)).match(/data-node="/g) || []).length, 12);
  const classic = render(card(mc.MatterCard, { illustration: false }, hass));
  assert.doesNotMatch(classic, /class="scene"/);
  assert.match(classic, /<div class="header"><div class="badge s-alert">/);
});

test("the Matter badge's colour is the network's status, on both cards", async () => {
  const issues = await withData();
  const healthy = await withData(mockHass({ healthy: true }));
  assert.match(render(card(mc.MatterCard, {}, issues)), /class="badge s-alert"/);
  assert.match(render(card(mc.MatterCard, {}, healthy)), /class="badge s-ok"/);
  assert.match(render(card(mc.MatterMiniCard, {}, issues)), /class="badge s-alert"/);
  assert.match(render(card(mc.MatterMiniCard, {}, healthy)), /class="badge s-ok"/);
});

test("the mini card: the full card's banner, or its classic layout without the illustration", async () => {
  const hass = await withData();
  const html = render(card(mc.MatterMiniCard, {}, hass));
  assert.match(html, /class="banner"/);
  assert.match(html, /class="scene"/);
  assert.match(html, /class="dev down"/);
  const classic = render(card(mc.MatterMiniCard, { illustration: false }, hass));
  assert.doesNotMatch(classic, /class="scene"/);
  assert.match(render(card(mc.MatterMiniCard, { illustration_theme: "night" }, hass)), /class="banner night"/);
});

test("night banner: the dark theme alone, whatever the sun", () => {
  const sun = (state, dark = false) => {
    const h = mockHass({ dark });
    return { ...h, states: { ...h.states, "sun.sun": { entity_id: "sun.sun", state, attributes: {} } } };
  };
  assert.doesNotMatch(render(card(mc.MatterCard, {}, sun("below_horizon"))), /banner night/);
  assert.match(render(card(mc.MatterCard, {}, sun("below_horizon", true))), /class="banner night"/);
  assert.match(render(card(mc.MatterCard, {}, sun("above_horizon", true))), /class="banner night"/);
  assert.doesNotMatch(render(card(mc.MatterCard, {}, sun("above_horizon"))), /banner night/);
  assert.doesNotMatch(render(card(mc.MatterCard, { illustration_theme: "day" }, sun("above_horizon", true))), /banner night/);
  assert.match(render(card(mc.MatterCard, { illustration_theme: "night" }, sun("above_horizon"))), /class="banner night"/);
  assert.doesNotMatch(render(card(mc.MatterCard, { illustration_theme: "day" }, sun("below_horizon"))), /banner night/);
});

test("night banner: forced, else the dark theme", () => {
  assert.match(render(card(mc.MatterCard, { illustration_theme: "night" })), /class="banner night"/);
  assert.match(render(card(mc.MatterCard, {}, mockHass({ dark: true }))), /class="banner night"/);
  assert.doesNotMatch(render(card(mc.MatterCard, { illustration_theme: "day" }, mockHass({ dark: true }))), /banner night/);
});

test("a click on a node opens its popup at the top of the card; a click elsewhere, Escape or leaving the page closes it", async () => {
  const hass = await withData();
  const el = card(mc.MatterCard, {}, hass);
  el._collect();
  const tile = { dataset: { node: "dev_lock" } };
  el._click({ composedPath: () => [tile], detail: 1 });
  const html = el._render();
  assert.match(html, /class="backdrop"/);
  const txt = text(html);
  assert.match(txt, /Node ID 0x0007 \(7\)/);
  assert.match(txt, /Vendor Keystone/);
  assert.match(txt, /Firmware 5\.0\.3/);
  assert.match(txt, /Network Wi-Fi/);
  assert.match(txt, /IP address 192\.168\.1\.42, fe80::1a2b:3cff:fe4d:5e6f/);
  assert.match(txt, /Signal −58 dBm/);
  assert.match(txt, /Fabrics HA, Apple Home/);
  el._onOutside({ composedPath: () => [] });
  assert.equal(el._detail, null);
  el._click({ composedPath: () => [tile], detail: 1 });
  el._onKey({ key: "Escape", stopPropagation() {} });
  assert.equal(el._detail, null);
  el._click({ composedPath: () => [tile], detail: 1 });
  el.disconnectedCallback();
  assert.equal(el._detail, null);
});

test("the popup of an unavailable node says since when; its button opens the device page", async () => {
  const hass = await withData();
  const el = card(mc.MatterCard, {}, hass);
  el._collect();
  el._click({ composedPath: () => [{ dataset: { node: "dev_kids" } }], detail: 1 });
  const txt = text(el._render());
  assert.match(txt, /Unavailable · 1 h/);
  assert.match(txt, /Last seen 1 hour ago/);
  el._click({ composedPath: () => [{ dataset: { nav: "/config/devices/device/dev_kids" } }], detail: 1 });
  assert.equal(mc.history.last, "/config/devices/device/dev_kids");
  assert.equal(el._detail, null);
});

test("the commission button opens Home Assistant's Matter add-device page; the Thread tile its Thread page", () => {
  const el = card(mc.MatterCard);
  el._click({ composedPath: () => [{ dataset: { nav: "/config/matter/add" } }], detail: 1 });
  assert.equal(mc.history.last, "/config/matter/add");
  assert.match(render(el), /data-nav="\/config\/matter\/add"/);
  assert.match(render(el), /data-nav="\/config\/thread"/);
});

test("no Matter device at all", () => {
  const html = render(card(mc.MatterCard, {}, { ...mockHass(), devices: {} }));
  assert.match(html, /No Matter device found/);
});

test("the mini card: the status, the transport chips and the issues", async () => {
  const html = render(card(mc.MatterMiniCard, {}, await withData()));
  const txt = text(html);
  assert.match(txt, /Matter 2 issues/);
  assert.match(txt, /5 Thread 2 Wi-Fi 1 Ethernet 1 unavailable 1 low battery/);
  // The status pill takes the badge's colour: an unreachable node is an alert.
  assert.match(html, /<div class="trow"><div class="name">Matter<\/div><span class="chip bst s-alert" role="img" title="2 issues" aria-label="2 issues">/);
  assert.match(html, /class="r pill alert"/);
  assert.doesNotMatch(html, /data-node=/);
  const ok = render(card(mc.MatterMiniCard, {}, await withData(mockHass({ healthy: true }))));
  assert.match(text(ok), /Matter Healthy/);
  assert.match(ok, /class="chip bst s-ok"/);
});

test("the mini card's detail button unfolds the full card; a click outside folds it back", () => {
  const el = card(mc.MatterMiniCard);
  el._collect();
  const zoom = { classList: { contains: (c) => c === "zoom" }, dataset: {} };
  el._click({ composedPath: () => [zoom], detail: 1, stopPropagation() {} });
  assert.equal(el._zoomed, true);
  assert.match(el._render(), /data-node=/);
  assert.deepEqual({ ...el.getGridOptions() }, { columns: 12, min_columns: 8 });
  // A node popup open: the click outside only closes the popup.
  el._click({ composedPath: () => [{ dataset: { node: "dev_lamp" } }], detail: 1 });
  const out = { composedPath: () => [] };
  el._onOutside(out);
  el._onFold(out);
  assert.equal(el._detail, null);
  assert.equal(el._zoomed, true);
  el._onFold({ composedPath: () => [] });
  assert.equal(el._zoomed, false);
  assert.deepEqual({ ...el.getGridOptions() }, { columns: 6, min_columns: 6 });
  assert.doesNotMatch(render(card(mc.MatterMiniCard, { zoom: false })), /class="zoom/);
  // Leaving the page folds it back.
  el._setZoom(true);
  el.disconnectedCallback();
  assert.equal(el._zoomed, false);
});

test("the editors keep the YAML minimal and the mini card's editor has the full card's options", () => {
  const ed = new mc.MatterCardEditor();
  let form;
  mc.document.createElement = (tag) => {
    form = { tag, listeners: {}, addEventListener(t, f) { this.listeners[t] = f; } };
    return form;
  };
  ed.appendChild = () => {};
  ed.dispatchEvent = (ev) => {
    ed.last = ev.detail.config;
  };
  ed.setConfig({ type: "custom:matter-card" });
  ed.hass = mockHass();
  assert.equal(form.data.columns, 2);
  assert.equal(form.data.show_thread, true);
  assert.equal(form.data.show_bridged, false);
  form.listeners["value-changed"]({
    stopPropagation() {},
    detail: { value: { type: "custom:matter-card", columns: 2, sort: "status", show_thread: true, show_bridged: false, battery_threshold: 20, illustration_theme: "auto", title: "" } },
  });
  assert.deepEqual({ ...ed.last }, { type: "custom:matter-card", sort: "status" });
  const names = (schema) => schema.flatMap((s) => (s.schema ? names(s.schema) : [s.name]));
  const full = names(ed._schema());
  const mini = new mc.MatterMiniCardEditor();
  mini._config = {};
  const miniNames = names(mini._schema());
  for (const n of full) assert.ok(miniNames.includes(n), n);
  assert.ok(miniNames.includes("zoom") && !full.includes("zoom"));
  // Lists stay YAML only.
  assert.ok(!full.includes("exclude"));
});

test("the editor sets its form's data and schema again only when they change", () => {
  const ed = new mc.MatterCardEditor();
  let form;
  let sets = 0;
  mc.document.createElement = (tag) => {
    form = { tag, listeners: {}, addEventListener(t, f) { this.listeners[t] = f; } };
    let data;
    Object.defineProperty(form, "data", { get: () => data, set: (v) => { sets++; data = v; } });
    return form;
  };
  ed.appendChild = () => {};
  ed.setConfig({ type: "custom:matter-card" });
  ed.hass = mockHass();
  const schema = form.schema;
  const before = sets;
  ed.hass = mockHass();
  assert.equal(sets, before);
  assert.equal(form.schema, schema);
  ed.setConfig({ type: "custom:matter-card", columns: 3 });
  assert.equal(sets, before + 1);
});

test("the device scan is kept per registry and exclude", () => {
  const hass = mockHass();
  const a = mc.matterDevices(hass, {});
  assert.equal(mc.matterDevices(hass, {}), a);
  const name = a.nodes[0].name_by_user || a.nodes[0].name;
  const b = mc.matterDevices(hass, { exclude: [name] });
  assert.notEqual(b, a);
  assert.equal(b.nodes.length, a.nodes.length - 1);
  // A new registry object: scanned again.
  assert.notEqual(mc.matterDevices({ ...hass, devices: { ...hass.devices } }, {}), a);
});

const LANGS = ["en", "fr", "de", "es", "sr", "sr-Latn", "it", "nl", "pt", "pl", "ro", "da", "sv", "bg", "ru", "uk", "hu", "sk", "cs", "sl", "lv", "el"];
const vars = (s) => s.match(/\{\w+\}/g)?.sort() ?? [];
const base = (k) => k.replace(/_(zero|one|two|few|many|other)$/, "");

test("every language has every English text, with the same placeholders", () => {
  assert.deepEqual([...Object.keys(mc.STRINGS)], LANGS);
  const en = mc.STRINGS.en;
  for (const l of LANGS) {
    const tr = mc.STRINGS[l];
    for (const k of Object.keys(en)) {
      if (/_(one|other)$/.test(k)) assert.ok(`${base(k)}_other` in tr, `${l}: ${base(k)}_other`);
      else assert.ok(k in tr, `${l}: ${k}`);
    }
    for (const [k, v] of Object.entries(tr)) {
      const ref = en[k] ?? en[`${base(k)}_other`];
      assert.ok(ref !== undefined, `${l}: unknown key ${k}`);
      assert.deepEqual(vars(v), vars(ref), `${l}: ${k}`);
    }
  }
});

test("plural forms: every category a language uses has its text or falls back to the other form", () => {
  const keys = Object.keys(mc.STRINGS.en).filter((k) => k.endsWith("_other")).map(base);
  for (const l of LANGS) {
    for (const key of keys) {
      for (const n of [0, 1, 2, 3, 5, 11, 21, 22, 25, 101, 1.5]) {
        const out = mc.plural({ language: l }, { language: l }, key, n);
        assert.ok(out.includes(String(n)), `${l} ${key} ${n}: ${out}`);
      }
    }
  }
  const p = (l, k, n) => mc.plural({ language: l }, { language: l }, k, n);
  assert.equal(p("en", "nodes", 1), "1 node");
  assert.equal(p("ru", "nodes", 5), "5 узлов");
  assert.equal(p("pl", "nodes", 3), "3 węzły");
  assert.equal(p("sl", "issues", 2), "2 težavi");
  assert.equal(p("sr", "border_routers", 22), "22 гранична рутера");
});

test("Matter Server version: from its update entity, the registry's update ids listed once", () => {
  const hass = mockHass();
  assert.equal(mc.serverVersion(hass), "8.1");
  // Another states object, the same registry: still found, nothing else walked.
  assert.equal(mc.serverVersion({ ...hass, states: { ...hass.states } }), "8.1");
  assert.equal(mc.serverVersion({ ...hass, states: { ...hass.states, "update.matter_server_update": undefined } }), null);
  // No registry (an old frontend): the states are read.
  assert.equal(mc.serverVersion({ states: hass.states }), "8.1");
  assert.equal(mc.serverVersion(null), null);
});

test("show_title / show_subtitle: hide the header's title and its stats line, the pill stays", () => {
  const el = new mc.MatterCard();
  const attrs = new Set();
  el.toggleAttribute = (n, on) => (on ? attrs.add(n) : attrs.delete(n));
  el._update = () => {};
  el.setConfig({ type: "custom:matter-card", show_title: false, show_subtitle: false });
  assert.deepEqual([...attrs].sort(), ["hide-subtitle", "hide-title"]);
  el.setConfig({ type: "custom:matter-card" });
  assert.deepEqual([...attrs], []);
  const html = render(card(mc.MatterCard));
  assert.match(html, /:host\(\[hide-title\]\) \.titles \.name/);
  assert.match(html, /:host\(\[hide-subtitle\]\) \.titles > \.stats/);
  const ed = new mc.MatterMiniCardEditor();
  ed.setConfig({ type: "custom:matter-mini-card" });
  const names = JSON.stringify(ed._schema.call({ _hass: null, _config: {}, constructor: mc.MatterMiniCardEditor }));
  for (const k of ["show_title", "show_subtitle"]) assert.ok(names.includes(`"${k}"`), k);
  for (const l of Object.keys(mc.STRINGS)) for (const k of ["show_title", "show_subtitle"]) assert.ok(mc.STRINGS[l][k], `${l}.${k}`);
});
