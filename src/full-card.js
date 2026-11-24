// ---------------------------------------------------------------------------
// The full card
// ---------------------------------------------------------------------------
import { ICONS } from "./core.js";
import { esc, fmtLang, matterLogo, navigate, num, plural, svgIcon, t } from "./helpers.js";
import { TRANSPORTS, entitiesByDevice, fabricsOf, isAdmin, isMatterDevice, matterDevices, nodeInfo, preferredDataset, refreshDiagnostics, refreshThread, refreshTopology, serverVersion, store, subscribeRouters, summaryOf, threadOf, unsubscribeRouters } from "./matter-nodes.js";
import { inDialog, morph, sceneSvg, watchOutside } from "./shadow-dom-patching.js";
import { BANNER_STYLE, COMMON_STYLE, FULL_STYLE, textWidth } from "./styles.js";

export class MatterCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this._detail = null;
    this.shadowRoot.addEventListener("click", (ev) => this._click(ev));
    this.shadowRoot.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" || ev.key === " ") && ev.target.getAttribute?.("role") === "button") {
        ev.preventDefault();
        ev.target.click();
      }
    });
    this._onKey = (ev) => {
      if (this._detail && ev.key === "Escape") {
        ev.stopPropagation();
        this._closeDetail(true);
      }
    };
    // A click elsewhere on the page closes the node popup (and only that: a zoomed mini card stays zoomed).
    this._onOutside = (ev) => {
      if (this._detail && !inDialog(ev)) {
        this._detailClosedBy = ev;
        this._closeDetail(false);
      }
    };
  }

  static getConfigElement() {
    return document.createElement("matter-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  getCardSize() {
    const n = this._infos?.length ?? 4;
    return 3 + Math.ceil(n / this._cols());
  }

  // 8 columns: 208 px on a phone.
  getGridOptions() {
    return { columns: 12, min_columns: 8 };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = { ...config };
    // show_title / show_subtitle: the header's title and its stats line, hidden by the stylesheet (the pill stays).
    this.toggleAttribute?.("hide-title", config.show_title === false);
    this.toggleAttribute?.("hide-subtitle", config.show_subtitle === false);
    this._html = "";
    this._update();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    const sig = this._signature();
    if (this._sig && sig.length === this._sig.length && sig.every((v, i) => v === this._sig[i])) return;
    this._update(sig);
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    store.cards.add(this);
    (this._outsideWatch ??= watchOutside(this, (ev) => this._onOutside(ev))).on();
    if (this._hass && !this._routers) {
      this._routers = true;
      subscribeRouters(this._hass);
    }
    // The durations ("Unavailable · 12 min") follow the clock: checked every minute.
    clearInterval(this._timer);
    this._timer = setInterval(() => this._hass && this._config && (this.hass = this._hass), 60000);
    if (!this._fitObserver && typeof ResizeObserver === "function") this._fitObserver = new ResizeObserver(() => this._fitPill());
    this._fitObserver?.observe(this);
    document.fonts?.ready?.then(() => this._fitPill());
    this._update();
  }

  disconnectedCallback() {
    store.cards.delete(this);
    this._outsideWatch?.off();
    this._fitObserver?.disconnect();
    clearInterval(this._timer);
    if (this._routers) {
      this._routers = false;
      unsubscribeRouters();
    }
    // Left (another view, a conditional card hidden): the popup closes without anything else.
    this._detail = null;
    window.removeEventListener("keydown", this._onKey);
  }

  // New websocket data (diagnostics, Thread): drawn again.
  _dataChanged() {
    if (this._hass && this._config) this._update();
  }

  _t(key, vars) {
    return t(this._hass, this._config, key, vars);
  }

  _p(key, n) {
    return plural(this._hass, this._config, key, this._num(n));
  }

  _loc() {
    return fmtLang(this._hass, this._config);
  }

  _num(n) {
    try {
      return new Intl.NumberFormat(this._loc()).format(n);
    } catch (_e) {
      return String(n);
    }
  }

  _now() {
    return Date.now();
  }

  _cols() {
    return Math.max(1, Math.min(4, Math.round(num(this._config?.columns) ?? 2)));
  }

  // What the render depends on: language, dark mode, the registries, the states of the Matter entities, the
  // websocket data and the minute.
  _signature() {
    const h = this._hass;
    const { nodes, bridged } = matterDevices(h, this._config);
    const byDev = entitiesByDevice(h);
    const ids = [];
    for (const d of [...nodes, ...[...bridged.values()].flat()]) for (const e of byDev.get(d.id) || []) ids.push(e.entity_id);
    return [
      h.language,
      h.locale,
      h.themes?.darkMode,
      h.devices,
      h.entities,
      h.user?.is_admin,
      store.rev,
      ...ids.map((id) => h.states?.[id]),
      Math.floor(this._now() / 60000),
    ];
  }

  _update(sig) {
    if (!this._hass || !this._config) return;
    this._sig = sig ?? this._signature();
    if (this.isConnected && !this._routers) {
      this._routers = true;
      subscribeRouters(this._hass);
    }
    this._collect();
    refreshDiagnostics(this._hass, this._infos);
    if (this._config.show_thread !== false) refreshThread(this._hass);
    refreshTopology(this._hass);
    const html = this._render();
    if (html !== this._html) {
      this._html = html;
      morph(this.shadowRoot, html);
    }
    this._fitPill();
  }

  // The nodes, sorted (by name, or issues first), their summary, fabrics and Thread network.
  _collect() {
    const h = this._hass;
    const c = this._config;
    const { nodes, bridged } = matterDevices(h, c);
    const threshold = num(c.battery_threshold) ?? 20;
    const make = (d, kids = []) =>
      nodeInfo(h, d, { diag: store.diag.get(d.id)?.data ?? null, bridged: kids, threshold, lastSeen: store.topo.seen.get(d.id) ?? null });
    let infos = nodes.map((d) => make(d, bridged.get(d.id) || []));
    if (c.show_bridged === true) {
      const kids = [];
      for (const [via, list] of bridged) {
        const parent = infos.find((i) => i.id === via);
        for (const d of list) {
          const i = make(d);
          if (parent && i.transport === "unknown") i.transport = parent.transport;
          kids.push(i);
        }
      }
      infos = infos.concat(kids);
    }
    const rank = { alert: 0, warn: 1, ok: 2 };
    const byName = (a, b) => a.name.localeCompare(b.name, this._loc(), { sensitivity: "base" });
    infos.sort(c.sort === "status" ? (a, b) => rank[a.level] - rank[b.level] || byName(a, b) : byName);
    this._infos = infos;
    this._summary = summaryOf(infos);
    this._fabrics = fabricsOf(nodes.map((d) => store.diag.get(d.id)?.data));
    this._thread = threadOf(infos, preferredDataset(), store.routers.seen ? [...store.routers.map.values()] : null, h);
  }

  // Night banner: forced by illustration_theme, else Home Assistant's dark theme alone (a light theme keeps the day
  // banner after sunset).
  _night() {
    const mode = this._config.illustration_theme;
    if (mode === "night") return true;
    if (mode === "day") return false;
    return !!this._hass?.themes?.darkMode;
  }

  // "12 min", "3 h", "2 d".
  _duration(ms) {
    const m = Math.max(1, Math.round(ms / 60000));
    if (m < 60) return this._t("dur_min", { n: this._num(m) });
    const h = Math.round(m / 60);
    if (h < 48) return this._t("dur_h", { n: this._num(h) });
    return this._t("dur_d", { n: this._num(Math.round(h / 24)) });
  }

  // "5 minutes ago", "now".
  _ago(ms) {
    const s = Math.round((ms - this._now()) / 1000);
    const units = [
      ["day", 86400],
      ["hour", 3600],
      ["minute", 60],
    ];
    try {
      const rtf = new Intl.RelativeTimeFormat(this._loc(), { numeric: "auto" });
      for (const [u, size] of units) if (Math.abs(s) >= size) return rtf.format(Math.round(s / size), u);
      return rtf.format(0, "second");
    } catch (_e) {
      return new Date(ms).toISOString();
    }
  }

  _fmtState(st) {
    if (!st) return "";
    let out;
    try {
      out = typeof this._hass?.formatEntityState === "function" ? this._hass.formatEntityState(st) : null;
    } catch (_e) {
      out = null;
    }
    if (!out) {
      const unit = st.attributes?.unit_of_measurement;
      out = `${st.state}${unit ? ` ${unit}` : ""}`;
    }
    // A true minus sign for a negative reading ("−58 dBm").
    return String(out).replace(/^-(?=\d)/, "−");
  }

  _dbm(v) {
    return `${this._num(v).replace(/^-/, "−")} dBm`;
  }

  _roleText(role) {
    return role ? this._t(`role_${role}`) : "";
  }

  // The state line of a node: what is wrong, else its main entity's state and one reading (power, Wi-Fi signal,
  // Thread router role, battery).
  _stateLine(i) {
    if (!i.available) return [this._t("unavailable"), i.since ? this._duration(this._now() - i.since) : ""].filter(Boolean).join(" · ");
    if (i.lowBattery) return this._t("battery", { pct: i.battery !== null ? `${this._num(Math.round(i.battery))}%` : "" }).trim();
    const st = i.main ? this._hass.states[i.main] : null;
    const parts = [];
    if (st && !(i.isBridge && i.endpoints)) parts.push(this._fmtState(st));
    if (i.isBridge && i.endpoints) parts.push(this._p("endpoints", i.endpoints));
    else if (i.power) parts.push(this._fmtState(i.power));
    else if (i.transport === "wifi" && i.rssi !== null) parts.push(this._dbm(i.rssi));
    else if (i.transport === "thread" && ["router", "leader", "routing_end_device"].includes(i.role)) parts.push(this._roleText(i.role));
    else if (i.battery !== null) parts.push(`${this._num(Math.round(i.battery))}%`);
    return parts.filter(Boolean).join(" · ") || this._t("online_state");
  }

  _iconHtml(icon) {
    return icon.mdi ? `<ha-icon icon="${esc(icon.mdi)}"></ha-icon>` : svgIcon(icon.path);
  }

  _tag(transport) {
    return TRANSPORTS.includes(transport) ? `<span class="tag ${transport}">${esc(this._t(transport))}</span>` : "";
  }

  _chip(cls, text) {
    return `<span class="chip ${cls}"><span class="dot"></span><span class="txt">${esc(text)}</span></span>`;
  }

  _statsText() {
    const parts = [];
    const v = serverVersion(this._hass);
    if (v) parts.push(this._t("server", { version: v }));
    parts.push(this._p("nodes", this._summary.total));
    if (this._fabrics.length) parts.push(this._p("fabrics", this._fabrics.length));
    return parts;
  }

  // The network's status, the colour of the Matter badge: an unreachable node first, then a low battery.
  _level() {
    const s = this._summary;
    return !s.total ? "na" : s.unavailable ? "alert" : s.lowBattery ? "warn" : "ok";
  }

  // The status pill: the network's state in the badge's colour (a dot and its label) — no node, how many issues
  // (an unreachable node or a low battery), else healthy.
  _pill() {
    const s = this._summary;
    const text = !s.total ? this._t("no_nodes") : s.issues ? this._p("issues", s.issues) : this._t("healthy");
    return `<span class="chip bst s-${this._level()}" role="img" title="${esc(text)}" aria-label="${esc(text)}"><span class="dot"></span><span class="txt">${esc(text)}</span></span>`;
  }

  // The banner's status pill, measured after each render and on a new width (in every language): it sits on the
  // title's row, right after the title, only when the whole title and the pill's whole label fit there; otherwise it
  // takes a line of its own under the subtitle (.below), the title whole on its row (cut only when it does not fit
  // alone) and the subtitle on one line. When the three lines do not fit in the banner above the ground strip, or
  // the label does not fit its line, the pill shows its dot alone (.dot-only): beside the title when the whole title
  // leaves it room, else under the subtitle.
  _fitPill() {
    for (const t of this.shadowRoot?.querySelectorAll?.(".head .titles, .header .titles, .mhead") || []) {
      const row = t.matches(".mhead") ? t : t.querySelector(".trow");
      const chips = row ? [...row.querySelectorAll(":scope > .bst")] : [];
      if (!chips[0]?.getBoundingClientRect) continue;
      t.classList.remove("below", "dot-only");
      const name = row.querySelector(".name, .title");
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const outer = (c) => c.getBoundingClientRect().width + (parseFloat(getComputedStyle(c).marginLeft) || 0) + (parseFloat(getComputedStyle(c).marginRight) || 0);
      const others = [...row.children].filter((c) => c !== name && !chips.includes(c) && c.getClientRects().length);
      const room = row.getBoundingClientRect().width - others.reduce((w, c) => w + outer(c) + gap, 0);
      const title = name && getComputedStyle(name).display !== "none" ? textWidth(name) + gap : 0;
      const pills = () => chips.reduce((w, c) => w + c.getBoundingClientRect().width, gap * (chips.length - 1));
      if (title + pills() <= room) continue;
      t.classList.add("below");
      const banner = t.closest(".banner") || t;
      const ground = banner.querySelector(".strip");
      const floor = ground ? ground.getBoundingClientRect().top : banner.getBoundingClientRect().bottom;
      const box = t.getBoundingClientRect();
      const whole = chips.every((c) => {
        const tx = c.querySelector(".txt");
        return !tx || tx.scrollWidth <= tx.clientWidth + 0.5;
      });
      if (whole && box.bottom <= floor + 0.5 && box.top >= banner.getBoundingClientRect().top - 0.5) continue;
      t.classList.add("dot-only");
      if (title + pills() <= room) t.classList.remove("below");
    }
  }

  _badgeHtml() {
    return `<div class="badge s-${this._level()}">${matterLogo()}</div>`;
  }

  _bannerOpen() {
    const night = this._night();
    return `<div class="banner${night ? " night" : ""}">
      ${sceneSvg(this._summary.unavailable > 0)}
      <div class="strip"></div>`;
  }

  _titleBlock() {
    const stats = this._statsText();
    return `${this._badgeHtml()}
      <div class="titles">
        <div class="trow"><div class="name">${esc(this._config.title || this._t("title"))}</div>${this._pill()}</div>
        <div class="stats" title="${esc(stats.join(" · "))}">${stats.map((s) => `<span>${esc(s)}</span>`).join("")}</div>
      </div>`;
  }

  _header() {
    if (this._config.illustration === false) return `<div class="header">${this._titleBlock()}${this._zoomButton("plain")}</div>`;
    return `${this._bannerOpen()}
      <div class="head">${this._titleBlock()}</div>${this._zoomButton(this._night() ? "on-night" : "")}
    </div>`;
  }

  _statusRow() {
    const s = this._summary;
    const chips = [this._chip("ok", this._t("online", { n: this._num(s.online), total: this._num(s.total) }))];
    if (s.unavailable) chips.push(this._chip("alert", this._p("unavailable", s.unavailable)));
    if (s.lowBattery) chips.push(this._chip("warn", this._p("low_battery", s.lowBattery)));
    const fabrics = this._fabrics.length ? `<span class="fabrics" title="${esc(this._t("fabrics"))}">${esc(this._fabrics.join(" · "))}</span>` : "";
    return `<div class="status">${chips.join("")}${fabrics}</div>`;
  }

  _threadTile() {
    const th = this._thread;
    if (this._config.show_thread === false || !th.known) return "";
    const line = [
      th.channel !== null ? this._t("channel", { n: this._num(th.channel) }) : "",
      th.pan ? this._t("pan", { id: th.pan }) : "",
      th.routers !== null ? this._p("border_routers", th.routers) : "",
    ].filter(Boolean);
    const title = th.name ? this._t("thread_network", { name: th.name }) : this._t("thread");
    const nav = isAdmin(this._hass) ? ` role="button" tabindex="0" data-nav="/config/thread"` : "";
    return `<div class="tile thread-net lvl-${th.level}" data-key="thread"${nav} aria-label="${esc([title, ...line].join(", "))}">
      <span class="ic">${svgIcon(ICONS.thread)}<span class="sdot"></span></span>
      <span class="txt"><span class="tname">${esc(title)}</span>${line.length ? `<span class="tstate">${esc(line.join(" · "))}</span>` : ""}</span>
      ${this._chip(th.level, this._p("nodes", th.nodes))}
    </div>`;
  }

  _tile(i) {
    const state = this._stateLine(i);
    const label = [i.name, state, TRANSPORTS.includes(i.transport) ? this._t(i.transport) : ""].filter(Boolean).join(", ");
    return `<div class="tile lvl-${i.level}" role="button" tabindex="0" data-key="n-${esc(i.id)}" data-node="${esc(i.id)}" aria-label="${esc(label)}">
      <span class="ic">${this._iconHtml(i.icon)}<span class="sdot"></span></span>
      <span class="txt"><span class="tname" title="${esc(i.name)}">${esc(i.name)}</span><span class="tsub"><span class="tstate">${esc(state)}</span>${this._tag(i.transport)}</span></span>
    </div>`;
  }

  _commission() {
    if (this._config.show_commission === false || !isAdmin(this._hass)) return "";
    return `<div class="actions"><button class="btn" data-nav="/config/matter/add">${svgIcon(ICONS.plus)}<span>${esc(this._t("commission"))}</span></button></div>`;
  }

  _noDevices() {
    return `<style>${COMMON_STYLE}</style><ha-card><div class="warning">${esc(this._t("no_devices"))}</div></ha-card>`;
  }

  _render() {
    if (!this._infos.length && !Object.values(this._hass?.devices || {}).some(isMatterDevice)) return this._noDevices();
    return `<style>${COMMON_STYLE}${BANNER_STYLE}${FULL_STYLE}${this._extraStyle()}</style>
      <ha-card style="--cols:${this._cols()}">
        ${this._header()}
        ${this._statusRow()}
        <div class="content">
          ${this._threadTile()}
          ${this._infos.length ? `<div class="grid">${this._infos.map((i) => this._tile(i)).join("")}</div>` : `<div class="empty">${esc(this._t("no_nodes"))}</div>`}
          ${this._commission()}
        </div>
        ${this._detailHtml()}
      </ha-card>`;
  }

  _extraStyle() {
    return "";
  }

  // The full card has no detail button.
  _zoomButton() {
    return "";
  }

  _detailHtml() {
    const id = this._detail;
    if (!id) return "";
    const i = this._infos.find((x) => x.id === id);
    if (!i) return "";
    const d = i.device;
    const diag = i.diag;
    const hex = i.node !== null ? `0x${i.node.toString(16).toUpperCase().padStart(4, "0")}` : null;
    const ips = (diag?.ip_adresses || diag?.ip_addresses || []).filter(Boolean);
    const role = this._roleText(i.role);
    const fabrics = fabricsOf([diag]);
    const facts = [
      [this._t("node_id"), hex !== null ? `${hex} (${i.node})` : null],
      [this._t("vendor"), d.manufacturer],
      [this._t("product"), [d.model, d.model_id && d.model_id !== d.model ? `(${d.model_id})` : ""].filter(Boolean).join(" ")],
      [this._t("firmware"), d.sw_version],
      [this._t("network"), [TRANSPORTS.includes(i.transport) ? this._t(i.transport) : "", i.transport === "thread" ? diag?.network_name : ""].filter(Boolean).join(" · ")],
      [this._t("node_type"), role],
      [this._t("ip"), ips.join(", ")],
      [this._t("mac"), diag?.mac_address],
      [this._t("rssi"), i.rssi !== null ? this._dbm(i.rssi) : null],
      [this._t("last_seen"), i.available && !store.topo.seen.has(i.id) ? this._t("online_state") : i.lastSeen ? this._ago(i.lastSeen) : null],
      [this._t("fabrics"), fabrics.join(", ")],
    ].filter(([, v]) => v);
    const chips = [this._chip(i.level === "ok" ? "ok" : i.level, this._stateLine(i))];
    const sub = [d.manufacturer, d.model].filter(Boolean).join(" · ");
    return `<div class="backdrop" data-action="backdrop">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="mc-dlg-title">
        <div class="mhead">
          <span class="ic lvl-${i.level}">${this._iconHtml(i.icon)}</span>
          <div><h3 id="mc-dlg-title">${esc(i.name)}</h3>${sub ? `<div class="sub">${esc(sub)}</div>` : ""}</div>
          <button class="close" data-action="close" title="${esc(this._t("close"))}" aria-label="${esc(this._t("close"))}">${svgIcon(ICONS.close)}</button>
        </div>
        <div class="mchips">${chips.join("")}${this._tag(i.transport)}</div>
        <dl class="facts">${facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
        <div class="actions"><button class="btn" data-nav="/config/devices/device/${esc(i.id)}">${svgIcon(ICONS.open)}<span>${esc(this._t("open_device"))}</span></button></div>
      </div>
    </div>`;
  }

  // Opens the node popup; from the keyboard (no click count), the focus goes to its close button.
  _openDetail(id, keyboard = false) {
    this._detail = id;
    window.addEventListener("keydown", this._onKey);
    this._update(this._sig);
    if (keyboard) this.shadowRoot.querySelector?.(".modal .close")?.focus({ preventScroll: true });
  }

  _closeDetail(refocus) {
    if (!this._detail) return;
    const id = this._detail;
    this._detail = null;
    window.removeEventListener("keydown", this._onKey);
    this._update(this._sig);
    if (refocus) this.shadowRoot.querySelector?.(`.tile[data-node="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
  }

  _click(ev) {
    const path = ev.composedPath();
    const action = path.find((n) => n.dataset?.action);
    const nav = path.find((n) => n.dataset?.nav);
    if (this._detail) {
      if (nav) {
        this._closeDetail(false);
        navigate(nav.dataset.nav);
        return;
      }
      // While the popup is open, its close button and the backdrop close it; a click in it does nothing else.
      if (action?.dataset.action === "close" || (action?.dataset.action === "backdrop" && path[0] === action)) this._closeDetail(true);
      return;
    }
    if (nav) {
      navigate(nav.dataset.nav);
      return;
    }
    const tile = path.find((n) => n.dataset?.node);
    if (tile) this._openDetail(tile.dataset.node, ev.detail === 0);
  }
}
