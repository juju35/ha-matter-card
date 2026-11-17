// Mock Matter network for the screenshots and the tests: fictional nodes in a fictional home, on a fixed clock (NOW),
// with the Matter integration's websocket answers (node diagnostics) and the Thread integration's (dataset, border
// routers).
export const NOW = Date.parse("2026-06-12T09:41:00+02:00");
const iso = (minAgo) => new Date(NOW - minAgo * 60000).toISOString();

const FABRIC = "8E2F31A4C0B6D795";
const HA_FABRIC = { fabric_id: 1, vendor_id: 0x134b, fabric_index: 1, fabric_label: "HA", vendor_name: "Nabu Casa" };
const APPLE_FABRIC = { fabric_id: 2, vendor_id: 0x1349, fabric_index: 2, fabric_label: "Apple Home", vendor_name: "Apple" };

// Each node: its device, its entities ([entity id, state, attributes, registry extras]) and its diagnostics.
const NODES = [
  {
    id: "dev_lamp", node: 3, name: "Living room lamp", maker: "Lumen Labs", model: "Ceiling Bulb E27", fw: "1.4.2", net: "thread", type: "routing_end_device",
    entities: [
      ["light.living_room_lamp", "on", { friendly_name: "Living room lamp", brightness: 180 }],
      ["sensor.living_room_lamp_routing_role", "router", { friendly_name: "Living room lamp Routing role" }, { translation_key: "thread_routing_role", entity_category: "diagnostic" }],
    ],
    fabrics: [HA_FABRIC, APPLE_FABRIC],
  },
  {
    id: "dev_plug", node: 4, name: "Desk plug", maker: "Northgate", model: "Smart Plug Mini", fw: "2.0.7", net: "thread", type: "routing_end_device",
    entities: [
      ["switch.desk_plug", "on", { friendly_name: "Desk plug", device_class: "outlet" }],
      ["sensor.desk_plug_power", "12.4", { friendly_name: "Desk plug Power", device_class: "power", unit_of_measurement: "W" }],
    ],
    fabrics: [HA_FABRIC],
  },
  {
    id: "dev_door", node: 5, name: "Patio door", maker: "Northgate", model: "Contact Sensor", fw: "1.1.0", net: "thread", type: "sleepy_end_device",
    entities: [
      ["binary_sensor.patio_door", "off", { friendly_name: "Patio door", device_class: "door" }],
      ["sensor.patio_door_battery", "88", { friendly_name: "Patio door Battery", device_class: "battery", unit_of_measurement: "%" }, { entity_category: "diagnostic" }],
    ],
    fabrics: [HA_FABRIC],
  },
  {
    id: "dev_blind", node: 6, name: "Bedroom blind", maker: "Shadeworks", model: "Roller Blind", fw: "3.2.1", net: "thread", type: "sleepy_end_device",
    entities: [
      ["cover.bedroom_blind", "open", { friendly_name: "Bedroom blind", device_class: "blind", current_position: 100 }],
      ["sensor.bedroom_blind_battery", "18", { friendly_name: "Bedroom blind Battery", device_class: "battery", unit_of_measurement: "%" }, { entity_category: "diagnostic" }],
    ],
    fabrics: [HA_FABRIC, APPLE_FABRIC],
  },
  {
    id: "dev_lock", node: 7, name: "Entrance lock", maker: "Keystone", model: "Deadbolt Pro", fw: "5.0.3", net: "wifi", type: "end_device", ips: ["192.168.1.42", "fe80::1a2b:3cff:fe4d:5e6f"],
    entities: [
      ["lock.entrance_lock", "locked", { friendly_name: "Entrance lock" }],
      ["sensor.entrance_lock_rssi", "-58", { friendly_name: "Entrance lock RSSI", device_class: "signal_strength", unit_of_measurement: "dBm" }, { translation_key: "wifi_rssi", entity_category: "diagnostic" }],
    ],
    fabrics: [HA_FABRIC, APPLE_FABRIC],
  },
  {
    id: "dev_kids", node: 8, name: "Kids room sensor", maker: "Lumen Labs", model: "Climate Sensor", fw: "1.0.9", net: "thread", type: "sleepy_end_device", down: 60,
    entities: [
      ["sensor.kids_room_temperature", "21.4", { friendly_name: "Kids room sensor Temperature", device_class: "temperature", unit_of_measurement: "°C" }],
      ["sensor.kids_room_battery", "64", { friendly_name: "Kids room sensor Battery", device_class: "battery", unit_of_measurement: "%" }, { entity_category: "diagnostic" }],
    ],
    fabrics: [HA_FABRIC],
  },
  {
    id: "dev_strip", node: 9, name: "Kitchen strip", maker: "Lumen Labs", model: "LED Strip", fw: "1.4.0", net: "wifi", type: "end_device", ips: ["192.168.1.57"],
    entities: [
      ["light.kitchen_strip", "on", { friendly_name: "Kitchen strip" }],
      ["sensor.kitchen_strip_rssi", "-71", { friendly_name: "Kitchen strip RSSI", device_class: "signal_strength", unit_of_measurement: "dBm" }, { translation_key: "wifi_rssi", entity_category: "diagnostic" }],
    ],
    fabrics: [HA_FABRIC],
  },
  {
    id: "dev_bridge", node: 10, name: "Bridge", maker: "Lumen Labs", model: "Matter Bridge", fw: "4.6.0", net: "ethernet", type: "bridge", ips: ["192.168.1.20"],
    entities: [],
    fabrics: [HA_FABRIC, APPLE_FABRIC],
    bridged: ["Hall light", "Porch light", "Stairs light", "Garden light"],
  },
];

const hex16 = (n) => n.toString(16).toUpperCase().padStart(16, "0");

// The hass object of the cards: `healthy` brings the unavailable node back and changes the low battery.
export const mockHass = ({ dark = false, healthy = false, admin = true } = {}) => {
  const states = {};
  const entities = {};
  const devices = {};
  const diags = {};
  for (const n of NODES) {
    const down = !healthy && n.down;
    devices[n.id] = {
      id: n.id, name: n.name, name_by_user: null, manufacturer: n.maker, model: n.model, model_id: null, sw_version: n.fw, hw_version: "1.0",
      identifiers: [["matter", `deviceid_${FABRIC}-${hex16(n.node)}-MatterNodeDevice`], ["matter", `serial_${n.id.toUpperCase()}`]],
      config_entries: ["matter_entry"], via_device_id: null, area_id: null, disabled_by: null, entry_type: null,
    };
    for (const [id, state, attributes, extra = {}] of n.entities) {
      let value = down ? "unavailable" : state;
      if (healthy && id === "sensor.bedroom_blind_battery") value = "64";
      states[id] = { entity_id: id, state: value, attributes, last_changed: iso(down ? n.down : 180), last_updated: iso(down ? n.down : 2) };
      entities[id] = { entity_id: id, device_id: n.id, platform: "matter", labels: [], ...extra };
    }
    (n.bridged || []).forEach((name, i) => {
      const id = `${n.id}_${i + 1}`;
      devices[id] = {
        id, name, name_by_user: null, manufacturer: n.maker, model: "Bridged light", sw_version: null,
        identifiers: [["matter", `deviceid_${FABRIC}-${hex16(n.node)}-${i + 11}`]], config_entries: ["matter_entry"], via_device_id: n.id,
        area_id: null, disabled_by: null, entry_type: null,
      };
      const eid = `light.${name.toLowerCase().replace(/ /g, "_")}`;
      states[eid] = { entity_id: eid, state: i === 1 ? "on" : "off", attributes: { friendly_name: name }, last_changed: iso(240), last_updated: iso(240) };
      entities[eid] = { entity_id: eid, device_id: id, platform: "matter", labels: [] };
    });
    diags[n.id] = {
      node_id: n.node, network_type: n.net, node_type: n.type, network_name: n.net === "thread" ? "Home-Thread" : null,
      ip_adresses: n.ips || [`fd11:22::3a4b:5c6d:7e8f:${n.node}`], mac_address: n.net === "thread" ? null : `3C:61:05:12:${String(n.node).padStart(2, "0")}:AF`,
      available: !down, active_fabrics: n.fabrics, active_fabric_index: 1,
    };
  }
  // A device of another integration, left out of the cards.
  devices.dev_other = { id: "dev_other", name: "Router", identifiers: [["zha", "00:11"]], config_entries: ["zha"], via_device_id: null };
  // The Matter Server, through its update entity.
  states["update.matter_server_update"] = {
    entity_id: "update.matter_server_update", state: "off", attributes: { title: "Matter Server", installed_version: "8.1", latest_version: "8.1", friendly_name: "Matter Server Update" },
    last_changed: iso(600), last_updated: iso(600),
  };
  const DATASET = {
    channel: 25, created: "2026-01-10T10:00:00Z", dataset_id: "ds1", extended_pan_id: "1a2b3c4d5e6f7a8b", network_name: "Home-Thread", pan_id: "1A2B",
    preferred: true, preferred_border_agent_id: null, preferred_extended_address: null, source: "Matter",
  };
  const ROUTERS = [
    { key: "br1", type: "router_discovered", data: { instance_name: "Living room speaker", extended_address: "aa01", extended_pan_id: "1a2b3c4d5e6f7a8b", network_name: "Home-Thread" } },
    { key: "br2", type: "router_discovered", data: { instance_name: "Kitchen display", extended_address: "aa02", extended_pan_id: "1a2b3c4d5e6f7a8b", network_name: "Home-Thread" } },
  ];
  const LABELS = { on: "On", off: "Off", open: "Open", closed: "Closed", locked: "Locked", unlocked: "Unlocked", unavailable: "Unavailable" };
  return {
    language: "en",
    locale: { language: "en", number_format: "language", time_format: "24" },
    themes: { darkMode: dark },
    user: { is_admin: admin, name: "Admin" },
    config: { components: ["matter", "thread"], time_zone: "Europe/Paris" },
    states,
    entities,
    devices,
    // Home Assistant's own formatting, reduced to what the mock entities need.
    formatEntityState: (st) => {
      const unit = st.attributes?.unit_of_measurement;
      if (st.entity_id.startsWith("binary_sensor.") && st.attributes?.device_class === "door") return st.state === "on" ? "Open" : "Closed";
      if (unit) return `${st.state} ${unit}`;
      return LABELS[st.state] ?? st.state;
    },
    callWS: async (msg) => {
      if (msg.type === "matter/node_diagnostics") {
        if (!diags[msg.device_id]) throw { code: "not_found", message: "Node not found" };
        return diags[msg.device_id];
      }
      if (msg.type === "thread/list_datasets") return { datasets: [DATASET] };
      throw { code: "not_supported", message: `${msg.type} not supported` };
    },
    connection: {
      subscribeMessage: async (cb, msg) => {
        if (msg.type === "thread/discover_routers") for (const r of ROUTERS) cb(r);
        return () => {};
      },
    },
  };
};
