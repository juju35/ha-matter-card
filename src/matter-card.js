/*
 * Matter Card for Home Assistant
 * https://github.com/juju35/ha-matter-card
 *
 * The Matter network of Home Assistant at a glance: every node of the Matter integration (Matter Server), its
 * transport (Thread, Wi-Fi, Ethernet), its health and its details, the Thread network it uses, under an animated
 * banner. The nodes come from the device registry (devices with a `matter` identifier), their network details from
 * the Matter integration's `matter/node_diagnostics` websocket command, the Thread network from the Thread
 * integration (`thread/list_datasets`, `thread/discover_routers`).
 */

const VERSION = "__VERSION__";

// The Matter logo (official mark, 512 × 512, one path): drawn with currentColor.
const MATTER =
  "m152 134.4c21.5 17.5 47.1 29.2 74.4 34.2V22.9l29.7-17.1 29.6 17.1v145.6c27.3-4.9 52.9-16.7 74.5-34.2l53.8 31.1c-87.6 86.6-228.5 86.6-316.1 0zm65.5 371.8C248.7 387 178.1 264.9 59.3 232.5v62.3c25.9 9.9 48.9 26.2 66.8 47.4L0 414.9v34.2l29.7 17 126.1-72.8c9.4 26.1 12 54.2 7.6 81.5zm235.3-273.7C334 265 263.6 387.1 294.8 506.2l54-31.2c-4.4-27.4-1.7-55.4 7.6-81.5l126 72.7 29.6-17.1v-34.2l-126.1-72.8c17.9-21.2 40.9-37.5 66.8-47.4z";

// mdi icon paths: the cards draw their icons themselves (no <ha-icon> unless an entity has an icon of its own).
const ICONS = {
  light: "M12,2A7,7 0 0,0 5,9C5,11.38 6.19,13.47 8,14.74V17A1,1 0 0,0 9,18H15A1,1 0 0,0 16,17V14.74C17.81,13.47 19,11.38 19,9A7,7 0 0,0 12,2M9,21A1,1 0 0,0 10,22H14A1,1 0 0,0 15,21V20H9V21Z",
  plug: "M16,7V3H14V7H10V3H8V7H8C7,7 6,8 6,9V14.5L9.5,18V21H14.5V18L18,14.5V9C18,8 17,7 16,7Z",
  outlet: "M7.5,10.5A1.5,1.5 0 0,1 9,12A1.5,1.5 0 0,1 7.5,13.5C6.66,13.5 6,12.83 6,12A1.5,1.5 0 0,1 7.5,10.5M16.5,10.5A1.5,1.5 0 0,1 18,12A1.5,1.5 0 0,1 16.5,13.5A1.5,1.5 0 0,1 15,12A1.5,1.5 0 0,1 16.5,10.5M4.22,2H19.78C21,2 22,3 22,4.22V19.78A2.22,2.22 0 0,1 19.78,22H4.22C3,22 2,21 2,19.78V4.22A2.22,2.22 0 0,1 4.22,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z",
  switch: "M18.4 1.6C18 1.2 17.5 1 17 1H7C6.5 1 6 1.2 5.6 1.6C5.2 2 5 2.5 5 3V21C5 21.5 5.2 22 5.6 22.4C6 22.8 6.5 23 7 23H17C17.5 23 18 22.8 18.4 22.4C18.8 22 19 21.5 19 21V3C19 2.5 18.8 2 18.4 1.6M16 7C16 7.6 15.6 8 15 8H9C8.4 8 8 7.6 8 7V5C8 4.4 8.4 4 9 4H15C15.6 4 16 4.4 16 5V7Z",
  lock: "M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z",
  door: "M16,11H18V13H16V11M12,3H19C20.11,3 21,3.89 21,5V19H22V21H2V19H10V5C10,3.89 10.89,3 12,3M12,5V19H19V5H12Z",
  window: "M21 20V2H3V20H1V23H23V20M19 4V11H13V4M5 4H11V11H5M5 20V13H11V20M13 20V13H19V20Z",
  motion: "M10,0.2C9,0.2 8.2,1 8.2,2C8.2,3 9,3.8 10,3.8C11,3.8 11.8,3 11.8,2C11.8,1 11,0.2 10,0.2M15.67,1A7.33,7.33 0 0,0 23,8.33V7A6,6 0 0,1 17,1H15.67M18.33,1C18.33,3.58 20.42,5.67 23,5.67V4.33C21.16,4.33 19.67,2.84 19.67,1H18.33M21,1A2,2 0 0,0 23,3V1H21M7.92,4.03C7.75,4.03 7.58,4.06 7.42,4.11L2,5.8V11H3.8V7.33L5.91,6.67L2,22H3.8L6.67,13.89L9,17V22H10.8V15.59L8.31,11.05L9.04,8.18L10.12,10H15V8.2H11.38L9.38,4.87C9.08,4.37 8.54,4.03 7.92,4.03Z",
  moisture: "M10 3.25C10 3.25 16 10 16 14C16 17.31 13.31 20 10 20S4 17.31 4 14C4 10 10 3.25 10 3.25M20 7V13H18V7H20M18 17H20V15H18V17Z",
  temperature: "M15 13V5A3 3 0 0 0 9 5V13A5 5 0 1 0 15 13M12 4A1 1 0 0 1 13 5V8H11V5A1 1 0 0 1 12 4Z",
  humidity: "M12,3.25C12,3.25 6,10 6,14C6,17.32 8.69,20 12,20A6,6 0 0,0 18,14C18,10 12,3.25 12,3.25M14.47,9.97L15.53,11.03L9.53,17.03L8.47,15.97M9.75,10A1.25,1.25 0 0,1 11,11.25A1.25,1.25 0 0,1 9.75,12.5A1.25,1.25 0 0,1 8.5,11.25A1.25,1.25 0 0,1 9.75,10M14.25,14.5A1.25,1.25 0 0,1 15.5,15.75A1.25,1.25 0 0,1 14.25,17A1.25,1.25 0 0,1 13,15.75A1.25,1.25 0 0,1 14.25,14.5Z",
  blinds: "M3,2H21A1,1 0 0,1 22,3V5A1,1 0 0,1 21,6H20V13A1,1 0 0,1 19,14H13V16.17C14.17,16.58 15,17.69 15,19A3,3 0 0,1 12,22A3,3 0 0,1 9,19C9,17.69 9.83,16.58 11,16.17V14H5A1,1 0 0,1 4,13V6H3A1,1 0 0,1 2,5V3A1,1 0 0,1 3,2M12,18A1,1 0 0,0 11,19A1,1 0 0,0 12,20A1,1 0 0,0 13,19A1,1 0 0,0 12,18Z",
  // The scene's blind (mdi blinds-horizontal).
  blinds_h:
    "M20 19V3H4V19H2V21H22V19H20M16 9H18V11H16V9M14 11H6V9H14V11M18 7H16V5H18V7M14 5V7H6V5H14M6 19V13H14V14.82C13.55 15.14 13.25 15.66 13.25 16.25C13.25 17.22 14.03 18 15 18S16.75 17.22 16.75 16.25C16.75 15.66 16.45 15.13 16 14.82V13H18V19H6Z",
  shutter: "M3 4H21V8H19V20H17V8H7V20H5V8H3V4M8 9H16V11H8V9M8 12H16V14H8V12M8 15H16V17H8V15M8 18H16V20H8V18Z",
  curtains: "M23 3H1V1H23V3M2 22H6C6 19 4 17 4 17C10 13 11 4 11 4H2V22M22 4H13C13 4 14 13 20 17C20 17 18 19 18 22H22V4Z",
  garage: "M19,20H17V11H7V20H5V9L12,5L19,9V20M8,12H16V14H8V12M8,15H16V17H8V15M16,18V20H8V18H16Z",
  thermostat: "M16.95,16.95L14.83,14.83C15.55,14.1 16,13.1 16,12C16,11.26 15.79,10.57 15.43,10L17.6,7.81C18.5,9 19,10.43 19,12C19,13.93 18.22,15.68 16.95,16.95M12,5C13.57,5 15,5.5 16.19,6.4L14,8.56C13.43,8.21 12.74,8 12,8A4,4 0 0,0 8,12C8,13.1 8.45,14.1 9.17,14.83L7.05,16.95C5.78,15.68 5,13.93 5,12A7,7 0 0,1 12,5M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,6.47 17.5,2 12,2Z",
  fan: "M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11M12.5,2C17,2 17.11,5.57 14.75,6.75C13.76,7.24 13.32,8.29 13.13,9.22C13.61,9.42 14.03,9.73 14.35,10.13C18.05,8.13 22.03,8.92 22.03,12.5C22.03,17 18.46,17.1 17.28,14.73C16.78,13.74 15.72,13.3 14.79,13.11C14.59,13.59 14.28,14 13.88,14.34C15.87,18.03 15.08,22 11.5,22C7,22 6.91,18.42 9.27,17.24C10.25,16.75 10.69,15.71 10.89,14.79C10.4,14.59 9.97,14.27 9.65,13.87C5.96,15.85 2,15.07 2,11.5C2,7 5.56,6.89 6.74,9.26C7.24,10.25 8.29,10.68 9.22,10.87C9.41,10.39 9.73,9.97 10.14,9.65C8.15,5.96 8.94,2 12.5,2Z",
  air: "M19,18.31V20A2,2 0 0,1 17,22H7A2,2 0 0,1 5,20V16.3C4.54,16.12 3.95,16 3,16A1,1 0 0,1 2,15A1,1 0 0,1 3,14C3.82,14 4.47,14.08 5,14.21V12.3C4.54,12.12 3.95,12 3,12A1,1 0 0,1 2,11A1,1 0 0,1 3,10C3.82,10 4.47,10.08 5,10.21V8.3C4.54,8.12 3.95,8 3,8A1,1 0 0,1 2,7A1,1 0 0,1 3,6C3.82,6 4.47,6.08 5,6.21V4A2,2 0 0,1 7,2H17A2,2 0 0,1 19,4V6.16C20.78,6.47 21.54,7.13 21.71,7.29C22.1,7.68 22.1,8.32 21.71,8.71C21.32,9.1 20.8,9.09 20.29,8.71V8.71C20.29,8.71 19.25,8 17,8C15.74,8 14.91,8.41 13.95,8.9C12.91,9.41 11.74,10 10,10C9.64,10 9.31,10 9,9.96V7.95C9.3,8 9.63,8 10,8C11.26,8 12.09,7.59 13.05,7.11C14.09,6.59 15.27,6 17,6V4H7V20H17V18C18.5,18 18.97,18.29 19,18.31M17,10C15.27,10 14.09,10.59 13.05,11.11C12.09,11.59 11.26,12 10,12C9.63,12 9.3,12 9,11.95V13.96C9.31,14 9.64,14 10,14C11.74,14 12.91,13.41 13.95,12.9C14.91,12.42 15.74,12 17,12C19.25,12 20.29,12.71 20.29,12.71V12.71C20.8,13.1 21.32,13.1 21.71,12.71C22.1,12.32 22.1,11.69 21.71,11.29C21.5,11.08 20.25,10 17,10M17,14C15.27,14 14.09,14.59 13.05,15.11C12.09,15.59 11.26,16 10,16C9.63,16 9.3,16 9,15.95V17.96C9.31,18 9.64,18 10,18C11.74,18 12.91,17.41 13.95,16.9C14.91,16.42 15.74,16 17,16C19.25,16 20.29,16.71 20.29,16.71V16.71C20.8,17.1 21.32,17.1 21.71,16.71C22.1,16.32 22.1,15.69 21.71,15.29C21.5,15.08 20.25,14 17,14Z",
  humidifier: "M11 9C8.79 9 7 10.79 7 13S8.79 17 11 17 15 15.21 15 13 13.21 9 11 9M11 15C9.9 15 9 14.11 9 13S9.9 11 11 11 13 11.9 13 13 12.11 15 11 15M7 4H14C16.21 4 18 5.79 18 8V9H16V8C16 6.9 15.11 6 14 6H7C5.9 6 5 6.9 5 8V20H16V18H18V22H3V8C3 5.79 4.79 4 7 4M19 10.5C19 10.5 21 12.67 21 14C21 15.1 20.1 16 19 16S17 15.1 17 14C17 12.67 19 10.5 19 10.5",
  button: "M13 5C15.21 5 17 6.79 17 9C17 10.5 16.2 11.77 15 12.46V11.24C15.61 10.69 16 9.89 16 9C16 7.34 14.66 6 13 6S10 7.34 10 9C10 9.89 10.39 10.69 11 11.24V12.46C9.8 11.77 9 10.5 9 9C9 6.79 10.79 5 13 5M20 20.5C19.97 21.32 19.32 21.97 18.5 22H13C12.62 22 12.26 21.85 12 21.57L8 17.37L8.74 16.6C8.93 16.39 9.2 16.28 9.5 16.28H9.7L12 18V9C12 8.45 12.45 8 13 8S14 8.45 14 9V13.47L15.21 13.6L19.15 15.79C19.68 16.03 20 16.56 20 17.14V20.5M20 2H4C2.9 2 2 2.9 2 4V12C2 13.11 2.9 14 4 14H8V12L4 12L4 4H20L20 12H18V14H20V13.96L20.04 14C21.13 14 22 13.09 22 12V4C22 2.9 21.11 2 20 2Z",
  wifi: "M12,21L15.6,16.2C14.6,15.45 13.35,15 12,15C10.65,15 9.4,15.45 8.4,16.2L12,21M12,3C7.95,3 4.21,4.34 1.2,6.6L3,9C5.5,7.12 8.62,6 12,6C15.38,6 18.5,7.12 21,9L22.8,6.6C19.79,4.34 16.05,3 12,3M12,9C9.3,9 6.81,9.89 4.8,11.4L6.6,13.8C8.1,12.67 9.97,12 12,12C14.03,12 15.9,12.67 17.4,13.8L19.2,11.4C17.19,9.89 14.7,9 12,9Z",
  ethernet: "M7,15H9V18H11V15H13V18H15V15H17V18H19V9H15V6H9V9H5V18H7V15M4.38,3H19.63C20.94,3 22,4.06 22,5.38V19.63A2.37,2.37 0 0,1 19.63,22H4.38C3.06,22 2,20.94 2,19.63V5.38C2,4.06 3.06,3 4.38,3Z",
  expand: "M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z",
  collapse: "M19.5,3.09L15,7.59V4H13V11H20V9H16.41L20.91,4.5L19.5,3.09M4,13V15H7.59L3.09,19.5L4.5,20.91L9,16.41V20H11V13H4Z",
  close: "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z",
  chip: "M6,4H18V5H21V7H18V9H21V11H18V13H21V15H18V17H21V19H18V20H6V19H3V17H6V15H3V13H6V11H3V9H6V7H3V5H6V4M11,15V18H12V15H11M13,15V18H14V15H13M15,15V18H16V15H15Z",
  speaker: "M12,12A3,3 0 0,0 9,15A3,3 0 0,0 12,18A3,3 0 0,0 15,15A3,3 0 0,0 12,12M12,20A5,5 0 0,1 7,15A5,5 0 0,1 12,10A5,5 0 0,1 17,15A5,5 0 0,1 12,20M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8C10.89,8 10,7.1 10,6C10,4.89 10.89,4 12,4M17,2H7C5.89,2 5,2.89 5,4V20A2,2 0 0,0 7,22H17A2,2 0 0,0 19,20V4C19,2.89 18.1,2 17,2Z",
  vacuum: "M12,2C14.65,2 17.19,3.06 19.07,4.93L17.65,6.35C16.15,4.85 14.12,4 12,4C9.88,4 7.84,4.84 6.35,6.35L4.93,4.93C6.81,3.06 9.35,2 12,2M3.66,6.5L5.11,7.94C4.39,9.17 4,10.57 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,10.57 19.61,9.17 18.88,7.94L20.34,6.5C21.42,8.12 22,10.04 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12C2,10.04 2.58,8.12 3.66,6.5M12,6A6,6 0 0,1 18,12C18,13.59 17.37,15.12 16.24,16.24L14.83,14.83C14.08,15.58 13.06,16 12,16C10.94,16 9.92,15.58 9.17,14.83L7.76,16.24C6.63,15.12 6,13.59 6,12A6,6 0 0,1 12,6M12,8A1,1 0 0,0 11,9A1,1 0 0,0 12,10A1,1 0 0,0 13,9A1,1 0 0,0 12,8Z",
  smoke: "M12 4C16.41 4 20 7.59 20 12S16.41 20 12 20 4 16.41 4 12 7.59 4 12 4M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M12 11C11.45 11 11 11.45 11 12S11.45 13 12 13 13 12.55 13 12 12.55 11 12 11M10.72 9.3C11.11 9.11 11.54 9 12 9S12.89 9.11 13.29 9.3L14 8.57C13.43 8.22 12.74 8 12 8S10.58 8.22 10 8.57L10.72 9.3M15 12C15 12.46 14.89 12.89 14.7 13.29L15.43 14C15.79 13.43 16 12.74 16 12S15.79 10.58 15.43 10L14.7 10.72C14.89 11.11 15 11.54 15 12M9 12C9 11.54 9.11 11.11 9.3 10.72L8.57 10C8.22 10.58 8 11.26 8 12S8.22 13.43 8.57 14L9.3 13.29C9.11 12.89 9 12.46 9 12M13.29 14.7C12.89 14.89 12.46 15 12 15S11.11 14.89 10.72 14.7L10 15.43C10.58 15.79 11.26 16 12 16S13.43 15.79 14 15.43L13.29 14.7M16.89 8.53L16.17 9.25C16.69 10.04 17 11 17 12S16.69 13.96 16.17 14.75L16.89 15.47C17.59 14.5 18 13.3 18 12S17.59 9.5 16.89 8.53M9.25 7.83C10.04 7.31 11 7 12 7S13.96 7.31 14.75 7.83L15.47 7.11C14.5 6.42 13.3 6 12 6S9.5 6.42 8.53 7.11L9.25 7.83M14.75 16.17C13.96 16.69 13 17 12 17S10.04 16.69 9.25 16.17L8.53 16.89C9.5 17.59 10.7 18 12 18S14.5 17.59 15.47 16.89L14.75 16.17M7.83 14.75C7.31 13.96 7 13 7 12S7.31 10.04 7.83 9.25L7.11 8.53C6.42 9.5 6 10.7 6 12S6.42 14.5 7.11 15.47L7.83 14.75Z",
  open: "M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z",
  plus: "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z",
  valve: "M4 22H2V2H4M22 2H20V22H22M17.24 5.34L13.24 9.34A3 3 0 0 0 9.24 13.34L5.24 17.34L6.66 18.76L10.66 14.76A3 3 0 0 0 14.66 10.76L18.66 6.76Z",
  boiler: "M8 2C6.89 2 6 2.89 6 4V16C6 17.11 6.89 18 8 18H9V20H6V22H9C10.11 22 11 21.11 11 20V18H13V20C13 21.11 13.89 22 15 22H18V20H15V18H16C17.11 18 18 17.11 18 16V4C18 2.89 17.11 2 16 2H8M12 4.97A2 2 0 0 1 14 6.97A2 2 0 0 1 12 8.97A2 2 0 0 1 10 6.97A2 2 0 0 1 12 4.97M10 14.5H14V16H10V14.5Z",
  ev: "M19.77,7.23L19.78,7.22L16.06,3.5L15,4.56L17.11,6.67C16.17,7.03 15.5,7.93 15.5,9A2.5,2.5 0 0,0 18,11.5C18.36,11.5 18.69,11.42 19,11.29V18.5A1,1 0 0,1 18,19.5A1,1 0 0,1 17,18.5V14A2,2 0 0,0 15,12H14V5A2,2 0 0,0 12,3H6A2,2 0 0,0 4,5V21H14V13.5H15.5V18.5A2.5,2.5 0 0,0 18,21A2.5,2.5 0 0,0 20.5,18.5V9C20.5,8.31 20.22,7.68 19.77,7.23M18,10A1,1 0 0,1 17,9A1,1 0 0,1 18,8A1,1 0 0,1 19,9A1,1 0 0,1 18,10M8,18V13.5H6L10,6V11H12L8,18Z",
  power: "M7,2V13H10V22L17,10H13L17,2H7Z",
  // The Thread mark, the bridge, the battery and the unavailable cross of the approved design.
  thread:
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m0 2a8 8 0 0 1 1 15.94V11h3a1 1 0 0 0 0-2h-3V7.5a1.5 1.5 0 0 1 3 0h2a3.5 3.5 0 0 0-7 0V9H8a3 3 0 0 0 0 6v-2a1 1 0 0 1 0-2h3v8.94A8 8 0 0 1 12 4z",
  bridge:
    "M7,15H9V18H11V15H13V18H15V15H17V18H19V9H15V6H9V9H5V18H7V15M4.38,3H19.63C20.94,3 22,4.06 22,5.38V19.63A2.37,2.37 0 0,1 19.63,22H4.38C3.06,22 2,20.94 2,19.63V5.38C2,4.06 3.06,3 4.38,3Z",
  battery:
    "M16,20H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4M15,16H9V19H15V16Z",
  offline:
    "M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z",
};

const STRINGS = {
  en: {
    matter: "Matter",
    title: "Matter devices",
    nodes_one: "{n} node",
    nodes_other: "{n} nodes",
    fabrics_one: "{n} fabric",
    fabrics_other: "{n} fabrics",
    server: "Server {version}",
    online: "{n} / {total} online",
    unavailable_one: "{n} unavailable",
    unavailable_other: "{n} unavailable",
    low_battery_one: "{n} low battery",
    low_battery_other: "{n} low battery",
    issues_one: "{n} issue",
    issues_other: "{n} issues",
    healthy: "Healthy",
    no_nodes: "No devices",
    thread: "Thread",
    wifi: "Wi-Fi",
    ethernet: "Ethernet",
    unknown: "Unknown",
    count_thread: "{n} Thread",
    count_wifi: "{n} Wi-Fi",
    count_ethernet: "{n} Ethernet",
    thread_network: "Thread · {name}",
    channel: "Channel {n}",
    pan: "PAN {id}",
    border_routers_one: "{n} border router",
    border_routers_other: "{n} border routers",
    endpoints_one: "{n} endpoint",
    endpoints_other: "{n} endpoints",
    unavailable: "Unavailable",
    online_state: "Online",
    battery: "Battery {pct}",
    dur_min: "{n} min",
    dur_h: "{n} h",
    dur_d: "{n} d",
    role_router: "router",
    role_leader: "leader",
    role_reed: "router eligible",
    role_end_device: "end device",
    role_sleepy_end_device: "sleepy end device",
    role_routing_end_device: "router",
    role_bridge: "bridge",
    commission: "Commission device",
    open_device: "Open device",
    close: "Close",
    node_id: "Node ID",
    vendor: "Vendor",
    product: "Product",
    firmware: "Firmware",
    network: "Network",
    node_type: "Role",
    ip: "IP address",
    mac: "MAC address",
    rssi: "Signal",
    last_seen: "Last seen",
    fabrics: "Fabrics",
    no_devices: "No Matter device found. Is the Matter integration set up?",
    zoom_in: "Show the full card",
    zoom_out: "Back to the compact view",
    // Visual editor
    ed_title: "Title",
    sort: "Sort",
    sort_name: "By name",
    sort_status: "Issues first",
    columns: "Columns",
    battery_threshold: "Low battery below (%)",
    show_thread: "Thread network",
    show_commission: "Commission button",
    show_bridged: "Bridged devices",
    illustration: "Illustration",
    illustration_theme: "Illustration theme",
    theme_auto: "Automatic",
    theme_day: "Day",
    theme_night: "Night",
    zoom: "Detail button",
    language: "Language",
    lang_auto: "Automatic",
  },
  fr: {
    matter: "Matter",
    title: "Appareils Matter",
    nodes_one: "{n} nœud",
    nodes_other: "{n} nœuds",
    fabrics_one: "{n} fabric",
    fabrics_other: "{n} fabrics",
    server: "Serveur {version}",
    online: "{n} / {total} en ligne",
    unavailable_one: "{n} indisponible",
    unavailable_other: "{n} indisponibles",
    low_battery_one: "{n} batterie faible",
    low_battery_other: "{n} batteries faibles",
    issues_one: "{n} problème",
    issues_other: "{n} problèmes",
    healthy: "Tout va bien",
    no_nodes: "Aucun appareil",
    thread: "Thread",
    wifi: "Wi-Fi",
    ethernet: "Ethernet",
    unknown: "Inconnu",
    count_thread: "{n} Thread",
    count_wifi: "{n} Wi-Fi",
    count_ethernet: "{n} Ethernet",
    thread_network: "Thread · {name}",
    channel: "Canal {n}",
    pan: "PAN {id}",
    border_routers_one: "{n} routeur de bordure",
    border_routers_other: "{n} routeurs de bordure",
    endpoints_one: "{n} endpoint",
    endpoints_other: "{n} endpoints",
    unavailable: "Indisponible",
    online_state: "En ligne",
    battery: "Batterie {pct}",
    dur_min: "{n} min",
    dur_h: "{n} h",
    dur_d: "{n} j",
    role_router: "routeur",
    role_leader: "leader",
    role_reed: "éligible routeur",
    role_end_device: "appareil terminal",
    role_sleepy_end_device: "appareil terminal en veille",
    role_routing_end_device: "routeur",
    role_bridge: "pont",
    commission: "Ajouter un appareil",
    open_device: "Ouvrir l'appareil",
    close: "Fermer",
    node_id: "ID du nœud",
    vendor: "Fabricant",
    product: "Produit",
    firmware: "Firmware",
    network: "Réseau",
    node_type: "Rôle",
    ip: "Adresse IP",
    mac: "Adresse MAC",
    rssi: "Signal",
    last_seen: "Vu pour la dernière fois",
    fabrics: "Fabrics",
    no_devices: "Aucun appareil Matter trouvé. L'intégration Matter est-elle configurée ?",
    zoom_in: "Afficher la carte complète",
    zoom_out: "Revenir à la vue compacte",
    ed_title: "Titre",
    sort: "Tri",
    sort_name: "Par nom",
    sort_status: "Problèmes d'abord",
    columns: "Colonnes",
    battery_threshold: "Batterie faible sous (%)",
    show_thread: "Réseau Thread",
    show_commission: "Bouton d'ajout",
    show_bridged: "Appareils pontés",
    illustration: "Illustration",
    illustration_theme: "Thème de l'illustration",
    theme_auto: "Automatique",
    theme_day: "Jour",
    theme_night: "Nuit",
    zoom: "Bouton de détail",
    language: "Langue",
    lang_auto: "Automatique",
  },
  de: {
    matter: "Matter",
    title: "Matter-Geräte",
    nodes_one: "{n} Knoten",
    nodes_other: "{n} Knoten",
    fabrics_one: "{n} Fabric",
    fabrics_other: "{n} Fabrics",
    server: "Server {version}",
    online: "{n} / {total} online",
    unavailable_one: "{n} nicht verfügbar",
    unavailable_other: "{n} nicht verfügbar",
    low_battery_one: "{n} Batterie schwach",
    low_battery_other: "{n} Batterien schwach",
    issues_one: "{n} Problem",
    issues_other: "{n} Probleme",
    healthy: "Alles in Ordnung",
    no_nodes: "Keine Geräte",
    thread: "Thread",
    wifi: "WLAN",
    ethernet: "Ethernet",
    unknown: "Unbekannt",
    count_thread: "{n} Thread",
    count_wifi: "{n} WLAN",
    count_ethernet: "{n} Ethernet",
    thread_network: "Thread · {name}",
    channel: "Kanal {n}",
    pan: "PAN {id}",
    border_routers_one: "{n} Border-Router",
    border_routers_other: "{n} Border-Router",
    endpoints_one: "{n} Endpunkt",
    endpoints_other: "{n} Endpunkte",
    unavailable: "Nicht verfügbar",
    online_state: "Online",
    battery: "Batterie {pct}",
    dur_min: "{n} Min.",
    dur_h: "{n} Std.",
    dur_d: "{n} T.",
    role_router: "Router",
    role_leader: "Leader",
    role_reed: "routerfähig",
    role_end_device: "Endgerät",
    role_sleepy_end_device: "schlafendes Endgerät",
    role_routing_end_device: "Router",
    role_bridge: "Bridge",
    commission: "Gerät hinzufügen",
    open_device: "Gerät öffnen",
    close: "Schließen",
    node_id: "Knoten-ID",
    vendor: "Hersteller",
    product: "Produkt",
    firmware: "Firmware",
    network: "Netzwerk",
    node_type: "Rolle",
    ip: "IP-Adresse",
    mac: "MAC-Adresse",
    rssi: "Signal",
    last_seen: "Zuletzt gesehen",
    fabrics: "Fabrics",
    no_devices: "Kein Matter-Gerät gefunden. Ist die Matter-Integration eingerichtet?",
    zoom_in: "Vollständige Karte anzeigen",
    zoom_out: "Zurück zur kompakten Ansicht",
    ed_title: "Titel",
    sort: "Sortierung",
    sort_name: "Nach Name",
    sort_status: "Probleme zuerst",
    columns: "Spalten",
    battery_threshold: "Batterie schwach unter (%)",
    show_thread: "Thread-Netzwerk",
    show_commission: "Hinzufügen-Schaltfläche",
    show_bridged: "Gebridgte Geräte",
    illustration: "Illustration",
    illustration_theme: "Illustrationsthema",
    theme_auto: "Automatisch",
    theme_day: "Tag",
    theme_night: "Nacht",
    zoom: "Detail-Schaltfläche",
    language: "Sprache",
    lang_auto: "Automatisch",
  },
  es: {
    matter: "Matter",
    title: "Dispositivos Matter",
    nodes_one: "{n} nodo",
    nodes_other: "{n} nodos",
    fabrics_one: "{n} fabric",
    fabrics_other: "{n} fabrics",
    server: "Servidor {version}",
    online: "{n} / {total} en línea",
    unavailable_one: "{n} no disponible",
    unavailable_other: "{n} no disponibles",
    low_battery_one: "{n} batería baja",
    low_battery_other: "{n} baterías bajas",
    issues_one: "{n} problema",
    issues_other: "{n} problemas",
    healthy: "Todo bien",
    no_nodes: "Sin dispositivos",
    thread: "Thread",
    wifi: "Wi-Fi",
    ethernet: "Ethernet",
    unknown: "Desconocido",
    count_thread: "{n} Thread",
    count_wifi: "{n} Wi-Fi",
    count_ethernet: "{n} Ethernet",
    thread_network: "Thread · {name}",
    channel: "Canal {n}",
    pan: "PAN {id}",
    border_routers_one: "{n} router de borde",
    border_routers_other: "{n} routers de borde",
    endpoints_one: "{n} endpoint",
    endpoints_other: "{n} endpoints",
    unavailable: "No disponible",
    online_state: "En línea",
    battery: "Batería {pct}",
    dur_min: "{n} min",
    dur_h: "{n} h",
    dur_d: "{n} d",
    role_router: "router",
    role_leader: "líder",
    role_reed: "apto para router",
    role_end_device: "dispositivo final",
    role_sleepy_end_device: "dispositivo final en reposo",
    role_routing_end_device: "router",
    role_bridge: "puente",
    commission: "Añadir dispositivo",
    open_device: "Abrir dispositivo",
    close: "Cerrar",
    node_id: "ID del nodo",
    vendor: "Fabricante",
    product: "Producto",
    firmware: "Firmware",
    network: "Red",
    node_type: "Función",
    ip: "Dirección IP",
    mac: "Dirección MAC",
    rssi: "Señal",
    last_seen: "Visto por última vez",
    fabrics: "Fabrics",
    no_devices: "No se encontró ningún dispositivo Matter. ¿Está configurada la integración Matter?",
    zoom_in: "Mostrar la tarjeta completa",
    zoom_out: "Volver a la vista compacta",
    ed_title: "Título",
    sort: "Orden",
    sort_name: "Por nombre",
    sort_status: "Problemas primero",
    columns: "Columnas",
    battery_threshold: "Batería baja por debajo de (%)",
    show_thread: "Red Thread",
    show_commission: "Botón para añadir",
    show_bridged: "Dispositivos puenteados",
    illustration: "Ilustración",
    illustration_theme: "Tema de la ilustración",
    theme_auto: "Automático",
    theme_day: "Día",
    theme_night: "Noche",
    zoom: "Botón de detalle",
    language: "Idioma",
    lang_auto: "Automático",
  },
  sr: {
    matter: "Matter",
    title: "Matter уређаји",
    nodes_one: "{n} чвор",
    nodes_few: "{n} чвора",
    nodes_other: "{n} чворова",
    fabrics_one: "{n} фабрик",
    fabrics_few: "{n} фабрика",
    fabrics_other: "{n} фабрика",
    server: "Сервер {version}",
    online: "{n} / {total} на мрежи",
    unavailable_one: "Недоступно: {n}",
    unavailable_other: "Недоступно: {n}",
    low_battery_one: "Слаба батерија: {n}",
    low_battery_other: "Слаба батерија: {n}",
    issues_one: "{n} проблем",
    issues_few: "{n} проблема",
    issues_other: "{n} проблема",
    healthy: "Све је у реду",
    no_nodes: "Нема уређаја",
    thread: "Thread",
    wifi: "Wi-Fi",
    ethernet: "Ethernet",
    unknown: "Непознато",
    count_thread: "{n} Thread",
    count_wifi: "{n} Wi-Fi",
    count_ethernet: "{n} Ethernet",
    thread_network: "Thread · {name}",
    channel: "Канал {n}",
    pan: "PAN {id}",
    border_routers_one: "{n} гранични рутер",
    border_routers_few: "{n} гранична рутера",
    border_routers_other: "{n} граничних рутера",
    endpoints_one: "{n} крајња тачка",
    endpoints_few: "{n} крајње тачке",
    endpoints_other: "{n} крајњих тачака",
    unavailable: "Недоступно",
    online_state: "На мрежи",
    battery: "Батерија {pct}",
    dur_min: "{n} мин",
    dur_h: "{n} ч",
    dur_d: "{n} д",
    role_router: "рутер",
    role_leader: "лидер",
    role_reed: "може бити рутер",
    role_end_device: "крајњи уређај",
    role_sleepy_end_device: "крајњи уређај у мировању",
    role_routing_end_device: "рутер",
    role_bridge: "мост",
    commission: "Додај уређај",
    open_device: "Отвори уређај",
    close: "Затвори",
    node_id: "ID чвора",
    vendor: "Произвођач",
    product: "Производ",
    firmware: "Фирмвер",
    network: "Мрежа",
    node_type: "Улога",
    ip: "IP адреса",
    mac: "MAC адреса",
    rssi: "Сигнал",
    last_seen: "Последњи пут виђен",
    fabrics: "Фабрици",
    no_devices: "Није пронађен ниједан Matter уређај. Да ли је Matter интеграција подешена?",
    zoom_in: "Прикажи целу картицу",
    zoom_out: "Назад на сажети приказ",
    ed_title: "Наслов",
    sort: "Редослед",
    sort_name: "По имену",
    sort_status: "Прво проблеми",
    columns: "Колоне",
    battery_threshold: "Слаба батерија испод (%)",
    show_thread: "Thread мрежа",
    show_commission: "Дугме за додавање",
    show_bridged: "Премошћени уређаји",
    illustration: "Илустрација",
    illustration_theme: "Тема илустрације",
    theme_auto: "Аутоматски",
    theme_day: "Дан",
    theme_night: "Ноћ",
    zoom: "Дугме за детаље",
    language: "Језик",
    lang_auto: "Аутоматски",
  },
  "sr-Latn": {
    matter: "Matter",
    title: "Matter uređaji",
    nodes_one: "{n} čvor",
    nodes_few: "{n} čvora",
    nodes_other: "{n} čvorova",
    fabrics_one: "{n} fabrik",
    fabrics_few: "{n} fabrika",
    fabrics_other: "{n} fabrika",
    server: "Server {version}",
    online: "{n} / {total} na mreži",
    unavailable_one: "Nedostupno: {n}",
    unavailable_other: "Nedostupno: {n}",
    low_battery_one: "Slaba baterija: {n}",
    low_battery_other: "Slaba baterija: {n}",
    issues_one: "{n} problem",
    issues_few: "{n} problema",
    issues_other: "{n} problema",
    healthy: "Sve je u redu",
    no_nodes: "Nema uređaja",
    thread: "Thread",
    wifi: "Wi-Fi",
    ethernet: "Ethernet",
    unknown: "Nepoznato",
    count_thread: "{n} Thread",
    count_wifi: "{n} Wi-Fi",
    count_ethernet: "{n} Ethernet",
    thread_network: "Thread · {name}",
    channel: "Kanal {n}",
    pan: "PAN {id}",
    border_routers_one: "{n} granični ruter",
    border_routers_few: "{n} granična rutera",
    border_routers_other: "{n} graničnih rutera",
    endpoints_one: "{n} krajnja tačka",
    endpoints_few: "{n} krajnje tačke",
    endpoints_other: "{n} krajnjih tačaka",
    unavailable: "Nedostupno",
    online_state: "Na mreži",
    battery: "Baterija {pct}",
    dur_min: "{n} min",
    dur_h: "{n} č",
    dur_d: "{n} d",
    role_router: "ruter",
    role_leader: "lider",
    role_reed: "može biti ruter",
    role_end_device: "krajnji uređaj",
    role_sleepy_end_device: "krajnji uređaj u mirovanju",
    role_routing_end_device: "ruter",
    role_bridge: "most",
    commission: "Dodaj uređaj",
    open_device: "Otvori uređaj",
    close: "Zatvori",
    node_id: "ID čvora",
    vendor: "Proizvođač",
    product: "Proizvod",
    firmware: "Firmver",
    network: "Mreža",
    node_type: "Uloga",
    ip: "IP adresa",
    mac: "MAC adresa",
    rssi: "Signal",
    last_seen: "Poslednji put viđen",
    fabrics: "Fabrici",
    no_devices: "Nije pronađen nijedan Matter uređaj. Da li je Matter integracija podešena?",
    zoom_in: "Prikaži celu karticu",
    zoom_out: "Nazad na sažeti prikaz",
    ed_title: "Naslov",
    sort: "Redosled",
    sort_name: "Po imenu",
    sort_status: "Prvo problemi",
    columns: "Kolone",
    battery_threshold: "Slaba baterija ispod (%)",
    show_thread: "Thread mreža",
    show_commission: "Dugme za dodavanje",
    show_bridged: "Premošćeni uređaji",
    illustration: "Ilustracija",
    illustration_theme: "Tema ilustracije",
    theme_auto: "Automatski",
    theme_day: "Dan",
    theme_night: "Noć",
    zoom: "Dugme za detalje",
    language: "Jezik",
    lang_auto: "Automatski",
  },
  it: {
    matter: "Matter",
    title: "Dispositivi Matter",
    nodes_one: "{n} nodo",
    nodes_other: "{n} nodi",
    fabrics_one: "{n} fabric",
    fabrics_other: "{n} fabric",
    server: "Server {version}",
    online: "{n} / {total} online",
    unavailable_one: "{n} non disponibile",
    unavailable_other: "{n} non disponibili",
    low_battery_one: "{n} batteria scarica",
    low_battery_other: "{n} batterie scariche",
    issues_one: "{n} problema",
    issues_other: "{n} problemi",
    healthy: "Tutto ok",
    no_nodes: "Nessun dispositivo",
    thread: "Thread",
    wifi: "Wi-Fi",
    ethernet: "Ethernet",
    unknown: "Sconosciuto",
    count_thread: "{n} Thread",
    count_wifi: "{n} Wi-Fi",
    count_ethernet: "{n} Ethernet",
    thread_network: "Thread · {name}",
    channel: "Canale {n}",
    pan: "PAN {id}",
    border_routers_one: "{n} border router",
    border_routers_other: "{n} border router",
    endpoints_one: "{n} endpoint",
    endpoints_other: "{n} endpoint",
    unavailable: "Non disponibile",
    online_state: "Online",
    battery: "Batteria {pct}",
    dur_min: "{n} min",
    dur_h: "{n} h",
    dur_d: "{n} g",
    role_router: "router",
    role_leader: "leader",
    role_reed: "idoneo a router",
    role_end_device: "dispositivo finale",
    role_sleepy_end_device: "dispositivo finale dormiente",
    role_routing_end_device: "router",
    role_bridge: "bridge",
    commission: "Aggiungi dispositivo",
    open_device: "Apri dispositivo",
    close: "Chiudi",
    node_id: "ID nodo",
    vendor: "Produttore",
    product: "Prodotto",
    firmware: "Firmware",
    network: "Rete",
    node_type: "Ruolo",
    ip: "Indirizzo IP",
    mac: "Indirizzo MAC",
    rssi: "Segnale",
    last_seen: "Visto l'ultima volta",
    fabrics: "Fabric",
    no_devices: "Nessun dispositivo Matter trovato. L'integrazione Matter è configurata?",
    zoom_in: "Mostra la scheda completa",
    zoom_out: "Torna alla vista compatta",
    ed_title: "Titolo",
    sort: "Ordinamento",
    sort_name: "Per nome",
    sort_status: "Prima i problemi",
    columns: "Colonne",
    battery_threshold: "Batteria scarica sotto (%)",
    show_thread: "Rete Thread",
    show_commission: "Pulsante di aggiunta",
    show_bridged: "Dispositivi in bridge",
    illustration: "Illustrazione",
    illustration_theme: "Tema dell'illustrazione",
    theme_auto: "Automatico",
    theme_day: "Giorno",
    theme_night: "Notte",
    zoom: "Pulsante dettagli",
    language: "Lingua",
    lang_auto: "Automatica",
  },
  nl: {
    matter: "Matter",
    title: "Matter-apparaten",
    nodes_one: "{n} node",
    nodes_other: "{n} nodes",
    fabrics_one: "{n} fabric",
    fabrics_other: "{n} fabrics",
    server: "Server {version}",
    online: "{n} / {total} online",
    unavailable_one: "{n} niet beschikbaar",
    unavailable_other: "{n} niet beschikbaar",
    low_battery_one: "{n} batterij bijna leeg",
    low_battery_other: "{n} batterijen bijna leeg",
    issues_one: "{n} probleem",
    issues_other: "{n} problemen",
    healthy: "Alles in orde",
    no_nodes: "Geen apparaten",
    thread: "Thread",
    wifi: "Wi-Fi",
    ethernet: "Ethernet",
    unknown: "Onbekend",
    count_thread: "{n} Thread",
    count_wifi: "{n} Wi-Fi",
    count_ethernet: "{n} Ethernet",
    thread_network: "Thread · {name}",
    channel: "Kanaal {n}",
    pan: "PAN {id}",
    border_routers_one: "{n} borderrouter",
    border_routers_other: "{n} borderrouters",
    endpoints_one: "{n} endpoint",
    endpoints_other: "{n} endpoints",
    unavailable: "Niet beschikbaar",
    online_state: "Online",
    battery: "Batterij {pct}",
    dur_min: "{n} min",
    dur_h: "{n} u",
    dur_d: "{n} d",
    role_router: "router",
    role_leader: "leider",
    role_reed: "geschikt als router",
    role_end_device: "eindapparaat",
    role_sleepy_end_device: "slapend eindapparaat",
    role_routing_end_device: "router",
    role_bridge: "bridge",
    commission: "Apparaat toevoegen",
    open_device: "Apparaat openen",
    close: "Sluiten",
    node_id: "Node-ID",
    vendor: "Fabrikant",
    product: "Product",
    firmware: "Firmware",
    network: "Netwerk",
    node_type: "Rol",
    ip: "IP-adres",
    mac: "MAC-adres",
    rssi: "Signaal",
    last_seen: "Laatst gezien",
    fabrics: "Fabrics",
    no_devices: "Geen Matter-apparaat gevonden. Is de Matter-integratie ingesteld?",
    zoom_in: "Volledige kaart tonen",
    zoom_out: "Terug naar de compacte weergave",
    ed_title: "Titel",
    sort: "Sortering",
    sort_name: "Op naam",
    sort_status: "Problemen eerst",
    columns: "Kolommen",
    battery_threshold: "Batterij bijna leeg onder (%)",
    show_thread: "Thread-netwerk",
    show_commission: "Toevoegknop",
    show_bridged: "Gebridgede apparaten",
    illustration: "Illustratie",
    illustration_theme: "Thema van de illustratie",
    theme_auto: "Automatisch",
    theme_day: "Dag",
    theme_night: "Nacht",
    zoom: "Detailknop",
    language: "Taal",
    lang_auto: "Automatisch",
  },
  pt: {
    matter: "Matter",
    title: "Dispositivos Matter",
    nodes_one: "{n} nó",
    nodes_other: "{n} nós",
    fabrics_one: "{n} fabric",
    fabrics_other: "{n} fabrics",
    server: "Servidor {version}",
    online: "{n} / {total} online",
    unavailable_one: "{n} indisponível",
    unavailable_other: "{n} indisponíveis",
    low_battery_one: "{n} bateria fraca",
    low_battery_other: "{n} baterias fracas",
    issues_one: "{n} problema",
    issues_other: "{n} problemas",
    healthy: "Tudo bem",
    no_nodes: "Sem dispositivos",
    thread: "Thread",
    wifi: "Wi-Fi",
    ethernet: "Ethernet",
    unknown: "Desconhecido",
    count_thread: "{n} Thread",
    count_wifi: "{n} Wi-Fi",
    count_ethernet: "{n} Ethernet",
    thread_network: "Thread · {name}",
    channel: "Canal {n}",
    pan: "PAN {id}",
    border_routers_one: "{n} border router",
    border_routers_other: "{n} border routers",
    endpoints_one: "{n} endpoint",
    endpoints_other: "{n} endpoints",
    unavailable: "Indisponível",
    online_state: "Online",
    battery: "Bateria {pct}",
    dur_min: "{n} min",
    dur_h: "{n} h",
    dur_d: "{n} d",
    role_router: "router",
    role_leader: "líder",
    role_reed: "elegível como router",
    role_end_device: "dispositivo final",
    role_sleepy_end_device: "dispositivo final em repouso",
    role_routing_end_device: "router",
    role_bridge: "ponte",
    commission: "Adicionar dispositivo",
    open_device: "Abrir dispositivo",
    close: "Fechar",
    node_id: "ID do nó",
    vendor: "Fabricante",
    product: "Produto",
    firmware: "Firmware",
    network: "Rede",
    node_type: "Função",
    ip: "Endereço IP",
    mac: "Endereço MAC",
    rssi: "Sinal",
    last_seen: "Visto pela última vez",
    fabrics: "Fabrics",
    no_devices: "Nenhum dispositivo Matter encontrado. A integração Matter está configurada?",
    zoom_in: "Mostrar o cartão completo",
    zoom_out: "Voltar à vista compacta",
    ed_title: "Título",
    sort: "Ordenação",
    sort_name: "Por nome",
    sort_status: "Problemas primeiro",
    columns: "Colunas",
    battery_threshold: "Bateria fraca abaixo de (%)",
    show_thread: "Rede Thread",
    show_commission: "Botão de adição",
    show_bridged: "Dispositivos em ponte",
    illustration: "Ilustração",
    illustration_theme: "Tema da ilustração",
    theme_auto: "Automático",
    theme_day: "Dia",
    theme_night: "Noite",
    zoom: "Botão de detalhe",
    language: "Idioma",
    lang_auto: "Automático",
  },
  pl: {
    matter: "Matter",
    title: "Urządzenia Matter",
    nodes_one: "{n} węzeł",
    nodes_few: "{n} węzły",
    nodes_many: "{n} węzłów",
    nodes_other: "{n} węzła",
    fabrics_one: "{n} fabric",
    fabrics_few: "{n} fabrics",
    fabrics_many: "{n} fabrics",
    fabrics_other: "{n} fabrics",
    server: "Serwer {version}",
    online: "{n} / {total} online",
    unavailable_one: "Niedostępne: {n}",
    unavailable_other: "Niedostępne: {n}",
    low_battery_one: "Słaba bateria: {n}",
    low_battery_other: "Słaba bateria: {n}",
    issues_one: "{n} problem",
    issues_few: "{n} problemy",
    issues_many: "{n} problemów",
    issues_other: "{n} problemu",
    healthy: "Wszystko w porządku",
    no_nodes: "Brak urządzeń",
    thread: "Thread",
    wifi: "Wi-Fi",
    ethernet: "Ethernet",
    unknown: "Nieznany",
    count_thread: "{n} Thread",
    count_wifi: "{n} Wi-Fi",
    count_ethernet: "{n} Ethernet",
    thread_network: "Thread · {name}",
    channel: "Kanał {n}",
    pan: "PAN {id}",
    border_routers_one: "{n} router brzegowy",
    border_routers_few: "{n} routery brzegowe",
    border_routers_many: "{n} routerów brzegowych",
    border_routers_other: "{n} routera brzegowego",
    endpoints_one: "{n} punkt końcowy",
    endpoints_few: "{n} punkty końcowe",
    endpoints_many: "{n} punktów końcowych",
    endpoints_other: "{n} punktu końcowego",
    unavailable: "Niedostępne",
    online_state: "Online",
    battery: "Bateria {pct}",
    dur_min: "{n} min",
    dur_h: "{n} godz.",
    dur_d: "{n} d",
    role_router: "router",
    role_leader: "lider",
    role_reed: "może być routerem",
    role_end_device: "urządzenie końcowe",
    role_sleepy_end_device: "uśpione urządzenie końcowe",
    role_routing_end_device: "router",
    role_bridge: "mostek",
    commission: "Dodaj urządzenie",
    open_device: "Otwórz urządzenie",
    close: "Zamknij",
    node_id: "ID węzła",
    vendor: "Producent",
    product: "Produkt",
    firmware: "Oprogramowanie",
    network: "Sieć",
    node_type: "Rola",
    ip: "Adres IP",
    mac: "Adres MAC",
    rssi: "Sygnał",
    last_seen: "Ostatnio widziany",
    fabrics: "Fabrics",
    no_devices: "Nie znaleziono urządzeń Matter. Czy integracja Matter jest skonfigurowana?",
    zoom_in: "Pokaż pełną kartę",
    zoom_out: "Wróć do widoku kompaktowego",
    ed_title: "Tytuł",
    sort: "Sortowanie",
    sort_name: "Według nazwy",
    sort_status: "Najpierw problemy",
    columns: "Kolumny",
    battery_threshold: "Słaba bateria poniżej (%)",
    show_thread: "Sieć Thread",
    show_commission: "Przycisk dodawania",
    show_bridged: "Urządzenia za mostkiem",
    illustration: "Ilustracja",
    illustration_theme: "Motyw ilustracji",
    theme_auto: "Automatyczny",
    theme_day: "Dzień",
    theme_night: "Noc",
    zoom: "Przycisk szczegółów",
    language: "Język",
    lang_auto: "Automatyczny",
  },
  ro: {
    matter: "Matter",
    title: "Dispozitive Matter",
    nodes_one: "{n} nod",
    nodes_few: "{n} noduri",
    nodes_other: "{n} de noduri",
    fabrics_one: "{n} fabric",
    fabrics_few: "{n} fabric-uri",
    fabrics_other: "{n} de fabric-uri",
    server: "Server {version}",
    online: "{n} / {total} online",
    unavailable_one: "{n} indisponibil",
    unavailable_few: "{n} indisponibile",
    unavailable_other: "{n} indisponibile",
    low_battery_one: "{n} baterie descărcată",
    low_battery_few: "{n} baterii descărcate",
    low_battery_other: "{n} de baterii descărcate",
    issues_one: "{n} problemă",
    issues_few: "{n} probleme",
    issues_other: "{n} de probleme",
    healthy: "Totul e în regulă",
    no_nodes: "Niciun dispozitiv",
    thread: "Thread",
    wifi: "Wi-Fi",
    ethernet: "Ethernet",
    unknown: "Necunoscut",
    count_thread: "{n} Thread",
    count_wifi: "{n} Wi-Fi",
    count_ethernet: "{n} Ethernet",
    thread_network: "Thread · {name}",
    channel: "Canal {n}",
    pan: "PAN {id}",
    border_routers_one: "{n} router de margine",
    border_routers_few: "{n} routere de margine",
    border_routers_other: "{n} de routere de margine",
    endpoints_one: "{n} endpoint",
    endpoints_few: "{n} endpointuri",
    endpoints_other: "{n} de endpointuri",
    unavailable: "Indisponibil",
    online_state: "Online",
    battery: "Baterie {pct}",
    dur_min: "{n} min",
    dur_h: "{n} h",
    dur_d: "{n} z",
    role_router: "router",
    role_leader: "lider",
    role_reed: "eligibil ca router",
    role_end_device: "dispozitiv final",
    role_sleepy_end_device: "dispozitiv final în repaus",
    role_routing_end_device: "router",
    role_bridge: "punte",
    commission: "Adaugă dispozitiv",
    open_device: "Deschide dispozitivul",
    close: "Închide",
    node_id: "ID nod",
    vendor: "Producător",
    product: "Produs",
    firmware: "Firmware",
    network: "Rețea",
    node_type: "Rol",
    ip: "Adresă IP",
    mac: "Adresă MAC",
    rssi: "Semnal",
    last_seen: "Văzut ultima dată",
    fabrics: "Fabric-uri",
    no_devices: "Niciun dispozitiv Matter găsit. Este configurată integrarea Matter?",
    zoom_in: "Afișează cardul complet",
    zoom_out: "Înapoi la vizualizarea compactă",
    ed_title: "Titlu",
    sort: "Sortare",
    sort_name: "După nume",
    sort_status: "Întâi problemele",
    columns: "Coloane",
    battery_threshold: "Baterie descărcată sub (%)",
    show_thread: "Rețea Thread",
    show_commission: "Buton de adăugare",
    show_bridged: "Dispozitive prin punte",
    illustration: "Ilustrație",
    illustration_theme: "Tema ilustrației",
    theme_auto: "Automat",
    theme_day: "Zi",
    theme_night: "Noapte",
    zoom: "Buton de detalii",
    language: "Limbă",
    lang_auto: "Automat",
  },
  da: {
    matter: "Matter",
    title: "Matter-enheder",
    nodes_one: "{n} node",
    nodes_other: "{n} noder",
    fabrics_one: "{n} fabric",
    fabrics_other: "{n} fabrics",
    server: "Server {version}",
    online: "{n} / {total} online",
    unavailable_one: "{n} utilgængelig",
    unavailable_other: "{n} utilgængelige",
    low_battery_one: "{n} lavt batteri",
    low_battery_other: "{n} lave batterier",
    issues_one: "{n} problem",
    issues_other: "{n} problemer",
    healthy: "Alt i orden",
    no_nodes: "Ingen enheder",
    thread: "Thread",
    wifi: "Wi-Fi",
    ethernet: "Ethernet",
    unknown: "Ukendt",
    count_thread: "{n} Thread",
    count_wifi: "{n} Wi-Fi",
    count_ethernet: "{n} Ethernet",
    thread_network: "Thread · {name}",
    channel: "Kanal {n}",
    pan: "PAN {id}",
    border_routers_one: "{n} border-router",
    border_routers_other: "{n} border-routere",
    endpoints_one: "{n} endpoint",
    endpoints_other: "{n} endpoints",
    unavailable: "Utilgængelig",
    online_state: "Online",
    battery: "Batteri {pct}",
    dur_min: "{n} min",
    dur_h: "{n} t",
    dur_d: "{n} d",
    role_router: "router",
    role_leader: "leder",
    role_reed: "kan blive router",
    role_end_device: "slutenhed",
    role_sleepy_end_device: "sovende slutenhed",
    role_routing_end_device: "router",
    role_bridge: "bro",
    commission: "Tilføj enhed",
    open_device: "Åbn enhed",
    close: "Luk",
    node_id: "Node-ID",
    vendor: "Producent",
    product: "Produkt",
    firmware: "Firmware",
    network: "Netværk",
    node_type: "Rolle",
    ip: "IP-adresse",
    mac: "MAC-adresse",
    rssi: "Signal",
    last_seen: "Sidst set",
    fabrics: "Fabrics",
    no_devices: "Ingen Matter-enhed fundet. Er Matter-integrationen sat op?",
    zoom_in: "Vis hele kortet",
    zoom_out: "Tilbage til den kompakte visning",
    ed_title: "Titel",
    sort: "Sortering",
    sort_name: "Efter navn",
    sort_status: "Problemer først",
    columns: "Kolonner",
    battery_threshold: "Lavt batteri under (%)",
    show_thread: "Thread-netværk",
    show_commission: "Tilføj-knap",
    show_bridged: "Brokoblede enheder",
    illustration: "Illustration",
    illustration_theme: "Illustrationstema",
    theme_auto: "Automatisk",
    theme_day: "Dag",
    theme_night: "Nat",
    zoom: "Detaljeknap",
    language: "Sprog",
    lang_auto: "Automatisk",
  },
  sv: {
    matter: "Matter",
    title: "Matter-enheter",
    nodes_one: "{n} nod",
    nodes_other: "{n} noder",
    fabrics_one: "{n} fabric",
    fabrics_other: "{n} fabrics",
    server: "Server {version}",
    online: "{n} / {total} online",
    unavailable_one: "{n} otillgänglig",
    unavailable_other: "{n} otillgängliga",
    low_battery_one: "{n} lågt batteri",
    low_battery_other: "{n} låga batterier",
    issues_one: "{n} problem",
    issues_other: "{n} problem",
    healthy: "Allt i ordning",
    no_nodes: "Inga enheter",
    thread: "Thread",
    wifi: "Wi-Fi",
    ethernet: "Ethernet",
    unknown: "Okänd",
    count_thread: "{n} Thread",
    count_wifi: "{n} Wi-Fi",
    count_ethernet: "{n} Ethernet",
    thread_network: "Thread · {name}",
    channel: "Kanal {n}",
    pan: "PAN {id}",
    border_routers_one: "{n} gränsrouter",
    border_routers_other: "{n} gränsroutrar",
    endpoints_one: "{n} endpoint",
    endpoints_other: "{n} endpoints",
    unavailable: "Otillgänglig",
    online_state: "Online",
    battery: "Batteri {pct}",
    dur_min: "{n} min",
    dur_h: "{n} h",
    dur_d: "{n} d",
    role_router: "router",
    role_leader: "ledare",
    role_reed: "kan bli router",
    role_end_device: "slutenhet",
    role_sleepy_end_device: "sovande slutenhet",
    role_routing_end_device: "router",
    role_bridge: "brygga",
    commission: "Lägg till enhet",
    open_device: "Öppna enhet",
    close: "Stäng",
    node_id: "Nod-ID",
    vendor: "Tillverkare",
    product: "Produkt",
    firmware: "Firmware",
    network: "Nätverk",
    node_type: "Roll",
    ip: "IP-adress",
    mac: "MAC-adress",
    rssi: "Signal",
    last_seen: "Senast sedd",
    fabrics: "Fabrics",
    no_devices: "Ingen Matter-enhet hittades. Är Matter-integrationen konfigurerad?",
    zoom_in: "Visa hela kortet",
    zoom_out: "Tillbaka till kompakt vy",
    ed_title: "Titel",
    sort: "Sortering",
    sort_name: "Efter namn",
    sort_status: "Problem först",
    columns: "Kolumner",
    battery_threshold: "Lågt batteri under (%)",
    show_thread: "Thread-nätverk",
    show_commission: "Lägg till-knapp",
    show_bridged: "Bryggade enheter",
    illustration: "Illustration",
    illustration_theme: "Illustrationstema",
    theme_auto: "Automatiskt",
    theme_day: "Dag",
    theme_night: "Natt",
    zoom: "Detaljknapp",
    language: "Språk",
    lang_auto: "Automatiskt",
  },
  bg: {
    matter: "Matter",
    title: "Matter устройства",
    nodes_one: "{n} възел",
    nodes_other: "{n} възела",
    fabrics_one: "{n} фабрик",
    fabrics_other: "{n} фабрика",
    server: "Сървър {version}",
    online: "{n} / {total} на линия",
    unavailable_one: "{n} недостъпно",
    unavailable_other: "{n} недостъпни",
    low_battery_one: "{n} слаба батерия",
    low_battery_other: "{n} слаби батерии",
    issues_one: "{n} проблем",
    issues_other: "{n} проблема",
    healthy: "Всичко е наред",
    no_nodes: "Няма устройства",
    thread: "Thread",
    wifi: "Wi-Fi",
    ethernet: "Ethernet",
    unknown: "Неизвестно",
    count_thread: "{n} Thread",
    count_wifi: "{n} Wi-Fi",
    count_ethernet: "{n} Ethernet",
    thread_network: "Thread · {name}",
    channel: "Канал {n}",
    pan: "PAN {id}",
    border_routers_one: "{n} граничен рутер",
    border_routers_other: "{n} гранични рутера",
    endpoints_one: "{n} крайна точка",
    endpoints_other: "{n} крайни точки",
    unavailable: "Недостъпно",
    online_state: "На линия",
    battery: "Батерия {pct}",
    dur_min: "{n} мин",
    dur_h: "{n} ч",
    dur_d: "{n} д",
    role_router: "рутер",
    role_leader: "лидер",
    role_reed: "може да е рутер",
    role_end_device: "крайно устройство",
    role_sleepy_end_device: "спящо крайно устройство",
    role_routing_end_device: "рутер",
    role_bridge: "мост",
    commission: "Добавяне на устройство",
    open_device: "Отваряне на устройството",
    close: "Затваряне",
    node_id: "ID на възела",
    vendor: "Производител",
    product: "Продукт",
    firmware: "Фърмуер",
    network: "Мрежа",
    node_type: "Роля",
    ip: "IP адрес",
    mac: "MAC адрес",
    rssi: "Сигнал",
    last_seen: "Последно видян",
    fabrics: "Фабрики",
    no_devices: "Не е намерено Matter устройство. Настроена ли е интеграцията Matter?",
    zoom_in: "Показване на цялата карта",
    zoom_out: "Обратно към компактния изглед",
    ed_title: "Заглавие",
    sort: "Подреждане",
    sort_name: "По име",
    sort_status: "Първо проблемите",
    columns: "Колони",
    battery_threshold: "Слаба батерия под (%)",
    show_thread: "Thread мрежа",
    show_commission: "Бутон за добавяне",
    show_bridged: "Устройства през мост",
    illustration: "Илюстрация",
    illustration_theme: "Тема на илюстрацията",
    theme_auto: "Автоматично",
    theme_day: "Ден",
    theme_night: "Нощ",
    zoom: "Бутон за детайли",
    language: "Език",
    lang_auto: "Автоматично",
  },
  ru: {
    matter: "Matter",
    title: "Устройства Matter",
    nodes_one: "{n} узел",
    nodes_few: "{n} узла",
    nodes_many: "{n} узлов",
    nodes_other: "{n} узла",
    fabrics_one: "{n} фабрика",
    fabrics_few: "{n} фабрики",
    fabrics_many: "{n} фабрик",
    fabrics_other: "{n} фабрики",
    server: "Сервер {version}",
    online: "{n} / {total} в сети",
    unavailable_one: "Недоступно: {n}",
    unavailable_other: "Недоступно: {n}",
    low_battery_one: "Низкий заряд: {n}",
    low_battery_other: "Низкий заряд: {n}",
    issues_one: "{n} проблема",
    issues_few: "{n} проблемы",
    issues_many: "{n} проблем",
    issues_other: "{n} проблемы",
    healthy: "Всё в порядке",
    no_nodes: "Нет устройств",
    thread: "Thread",
    wifi: "Wi-Fi",
    ethernet: "Ethernet",
    unknown: "Неизвестно",
    count_thread: "{n} Thread",
    count_wifi: "{n} Wi-Fi",
    count_ethernet: "{n} Ethernet",
    thread_network: "Thread · {name}",
    channel: "Канал {n}",
    pan: "PAN {id}",
    border_routers_one: "{n} пограничный маршрутизатор",
    border_routers_few: "{n} пограничных маршрутизатора",
    border_routers_many: "{n} пограничных маршрутизаторов",
    border_routers_other: "{n} пограничного маршрутизатора",
    endpoints_one: "{n} конечная точка",
    endpoints_few: "{n} конечные точки",
    endpoints_many: "{n} конечных точек",
    endpoints_other: "{n} конечной точки",
    unavailable: "Недоступно",
    online_state: "В сети",
    battery: "Батарея {pct}",
    dur_min: "{n} мин",
    dur_h: "{n} ч",
    dur_d: "{n} д",
    role_router: "маршрутизатор",
    role_leader: "лидер",
    role_reed: "может стать маршрутизатором",
    role_end_device: "конечное устройство",
    role_sleepy_end_device: "спящее конечное устройство",
    role_routing_end_device: "маршрутизатор",
    role_bridge: "мост",
    commission: "Добавить устройство",
    open_device: "Открыть устройство",
    close: "Закрыть",
    node_id: "ID узла",
    vendor: "Производитель",
    product: "Продукт",
    firmware: "Прошивка",
    network: "Сеть",
    node_type: "Роль",
    ip: "IP-адрес",
    mac: "MAC-адрес",
    rssi: "Сигнал",
    last_seen: "Последняя активность",
    fabrics: "Фабрики",
    no_devices: "Устройства Matter не найдены. Настроена ли интеграция Matter?",
    zoom_in: "Показать полную карточку",
    zoom_out: "Вернуться к компактному виду",
    ed_title: "Заголовок",
    sort: "Сортировка",
    sort_name: "По имени",
    sort_status: "Сначала проблемы",
    columns: "Столбцы",
    battery_threshold: "Низкий заряд ниже (%)",
    show_thread: "Сеть Thread",
    show_commission: "Кнопка добавления",
    show_bridged: "Устройства через мост",
    illustration: "Иллюстрация",
    illustration_theme: "Тема иллюстрации",
    theme_auto: "Автоматически",
    theme_day: "День",
    theme_night: "Ночь",
    zoom: "Кнопка подробностей",
    language: "Язык",
    lang_auto: "Автоматически",
  },
  uk: {
    matter: "Matter",
    title: "Пристрої Matter",
    nodes_one: "{n} вузол",
    nodes_few: "{n} вузли",
    nodes_many: "{n} вузлів",
    nodes_other: "{n} вузла",
    fabrics_one: "{n} фабрика",
    fabrics_few: "{n} фабрики",
    fabrics_many: "{n} фабрик",
    fabrics_other: "{n} фабрики",
    server: "Сервер {version}",
    online: "{n} / {total} у мережі",
    unavailable_one: "Недоступно: {n}",
    unavailable_other: "Недоступно: {n}",
    low_battery_one: "Низький заряд: {n}",
    low_battery_other: "Низький заряд: {n}",
    issues_one: "{n} проблема",
    issues_few: "{n} проблеми",
    issues_many: "{n} проблем",
    issues_other: "{n} проблеми",
    healthy: "Усе гаразд",
    no_nodes: "Немає пристроїв",
    thread: "Thread",
    wifi: "Wi-Fi",
    ethernet: "Ethernet",
    unknown: "Невідомо",
    count_thread: "{n} Thread",
    count_wifi: "{n} Wi-Fi",
    count_ethernet: "{n} Ethernet",
    thread_network: "Thread · {name}",
    channel: "Канал {n}",
    pan: "PAN {id}",
    border_routers_one: "{n} прикордонний маршрутизатор",
    border_routers_few: "{n} прикордонні маршрутизатори",
    border_routers_many: "{n} прикордонних маршрутизаторів",
    border_routers_other: "{n} прикордонного маршрутизатора",
    endpoints_one: "{n} кінцева точка",
    endpoints_few: "{n} кінцеві точки",
    endpoints_many: "{n} кінцевих точок",
    endpoints_other: "{n} кінцевої точки",
    unavailable: "Недоступно",
    online_state: "У мережі",
    battery: "Батарея {pct}",
    dur_min: "{n} хв",
    dur_h: "{n} год",
    dur_d: "{n} д",
    role_router: "маршрутизатор",
    role_leader: "лідер",
    role_reed: "може стати маршрутизатором",
    role_end_device: "кінцевий пристрій",
    role_sleepy_end_device: "сплячий кінцевий пристрій",
    role_routing_end_device: "маршрутизатор",
    role_bridge: "міст",
    commission: "Додати пристрій",
    open_device: "Відкрити пристрій",
    close: "Закрити",
    node_id: "ID вузла",
    vendor: "Виробник",
    product: "Продукт",
    firmware: "Прошивка",
    network: "Мережа",
    node_type: "Роль",
    ip: "IP-адреса",
    mac: "MAC-адреса",
    rssi: "Сигнал",
    last_seen: "Остання активність",
    fabrics: "Фабрики",
    no_devices: "Пристроїв Matter не знайдено. Чи налаштовано інтеграцію Matter?",
    zoom_in: "Показати повну картку",
    zoom_out: "Повернутися до компактного вигляду",
    ed_title: "Заголовок",
    sort: "Сортування",
    sort_name: "За назвою",
    sort_status: "Спершу проблеми",
    columns: "Стовпці",
    battery_threshold: "Низький заряд нижче (%)",
    show_thread: "Мережа Thread",
    show_commission: "Кнопка додавання",
    show_bridged: "Пристрої через міст",
    illustration: "Ілюстрація",
    illustration_theme: "Тема ілюстрації",
    theme_auto: "Автоматично",
    theme_day: "День",
    theme_night: "Ніч",
    zoom: "Кнопка деталей",
    language: "Мова",
    lang_auto: "Автоматично",
  },
  hu: {
    matter: "Matter",
    title: "Matter-eszközök",
    nodes_one: "{n} csomópont",
    nodes_other: "{n} csomópont",
    fabrics_one: "{n} fabric",
    fabrics_other: "{n} fabric",
    server: "Szerver {version}",
    online: "{n} / {total} online",
    unavailable_one: "{n} nem elérhető",
    unavailable_other: "{n} nem elérhető",
    low_battery_one: "{n} alacsony akkumulátor",
    low_battery_other: "{n} alacsony akkumulátor",
    issues_one: "{n} probléma",
    issues_other: "{n} probléma",
    healthy: "Minden rendben",
    no_nodes: "Nincs eszköz",
    thread: "Thread",
    wifi: "Wi-Fi",
    ethernet: "Ethernet",
    unknown: "Ismeretlen",
    count_thread: "{n} Thread",
    count_wifi: "{n} Wi-Fi",
    count_ethernet: "{n} Ethernet",
    thread_network: "Thread · {name}",
    channel: "{n}. csatorna",
    pan: "PAN {id}",
    border_routers_one: "{n} határútválasztó",
    border_routers_other: "{n} határútválasztó",
    endpoints_one: "{n} végpont",
    endpoints_other: "{n} végpont",
    unavailable: "Nem elérhető",
    online_state: "Online",
    battery: "Akkumulátor {pct}",
    dur_min: "{n} perc",
    dur_h: "{n} óra",
    dur_d: "{n} nap",
    role_router: "útválasztó",
    role_leader: "vezető",
    role_reed: "útválasztóvá válhat",
    role_end_device: "végeszköz",
    role_sleepy_end_device: "alvó végeszköz",
    role_routing_end_device: "útválasztó",
    role_bridge: "híd",
    commission: "Eszköz hozzáadása",
    open_device: "Eszköz megnyitása",
    close: "Bezárás",
    node_id: "Csomópont-azonosító",
    vendor: "Gyártó",
    product: "Termék",
    firmware: "Firmware",
    network: "Hálózat",
    node_type: "Szerep",
    ip: "IP-cím",
    mac: "MAC-cím",
    rssi: "Jel",
    last_seen: "Utoljára látva",
    fabrics: "Fabricok",
    no_devices: "Nem található Matter-eszköz. Be van állítva a Matter-integráció?",
    zoom_in: "Teljes kártya megjelenítése",
    zoom_out: "Vissza a kompakt nézethez",
    ed_title: "Cím",
    sort: "Rendezés",
    sort_name: "Név szerint",
    sort_status: "Problémák elöl",
    columns: "Oszlopok",
    battery_threshold: "Alacsony akkumulátor ez alatt (%)",
    show_thread: "Thread-hálózat",
    show_commission: "Hozzáadás gomb",
    show_bridged: "Hídon át csatlakozó eszközök",
    illustration: "Illusztráció",
    illustration_theme: "Illusztráció témája",
    theme_auto: "Automatikus",
    theme_day: "Nappal",
    theme_night: "Éjszaka",
    zoom: "Részletek gomb",
    language: "Nyelv",
    lang_auto: "Automatikus",
  },
  sk: {
    matter: "Matter",
    title: "Zariadenia Matter",
    nodes_one: "{n} uzol",
    nodes_few: "{n} uzly",
    nodes_many: "{n} uzla",
    nodes_other: "{n} uzlov",
    fabrics_one: "{n} fabric",
    fabrics_few: "{n} fabrics",
    fabrics_many: "{n} fabrics",
    fabrics_other: "{n} fabrics",
    server: "Server {version}",
    online: "{n} / {total} online",
    unavailable_one: "Nedostupné: {n}",
    unavailable_other: "Nedostupné: {n}",
    low_battery_one: "Slabá batéria: {n}",
    low_battery_other: "Slabá batéria: {n}",
    issues_one: "{n} problém",
    issues_few: "{n} problémy",
    issues_many: "{n} problému",
    issues_other: "{n} problémov",
    healthy: "Všetko v poriadku",
    no_nodes: "Žiadne zariadenia",
    thread: "Thread",
    wifi: "Wi-Fi",
    ethernet: "Ethernet",
    unknown: "Neznáme",
    count_thread: "{n} Thread",
    count_wifi: "{n} Wi-Fi",
    count_ethernet: "{n} Ethernet",
    thread_network: "Thread · {name}",
    channel: "Kanál {n}",
    pan: "PAN {id}",
    border_routers_one: "{n} hraničný smerovač",
    border_routers_few: "{n} hraničné smerovače",
    border_routers_many: "{n} hraničného smerovača",
    border_routers_other: "{n} hraničných smerovačov",
    endpoints_one: "{n} koncový bod",
    endpoints_few: "{n} koncové body",
    endpoints_many: "{n} koncového bodu",
    endpoints_other: "{n} koncových bodov",
    unavailable: "Nedostupné",
    online_state: "Online",
    battery: "Batéria {pct}",
    dur_min: "{n} min",
    dur_h: "{n} h",
    dur_d: "{n} d",
    role_router: "smerovač",
    role_leader: "líder",
    role_reed: "môže byť smerovačom",
    role_end_device: "koncové zariadenie",
    role_sleepy_end_device: "spiace koncové zariadenie",
    role_routing_end_device: "smerovač",
    role_bridge: "most",
    commission: "Pridať zariadenie",
    open_device: "Otvoriť zariadenie",
    close: "Zavrieť",
    node_id: "ID uzla",
    vendor: "Výrobca",
    product: "Produkt",
    firmware: "Firmvér",
    network: "Sieť",
    node_type: "Rola",
    ip: "IP adresa",
    mac: "MAC adresa",
    rssi: "Signál",
    last_seen: "Naposledy videné",
    fabrics: "Fabrics",
    no_devices: "Nenašlo sa žiadne zariadenie Matter. Je integrácia Matter nastavená?",
    zoom_in: "Zobraziť celú kartu",
    zoom_out: "Späť na kompaktné zobrazenie",
    ed_title: "Názov",
    sort: "Zoradenie",
    sort_name: "Podľa názvu",
    sort_status: "Najprv problémy",
    columns: "Stĺpce",
    battery_threshold: "Slabá batéria pod (%)",
    show_thread: "Sieť Thread",
    show_commission: "Tlačidlo pridania",
    show_bridged: "Premostené zariadenia",
    illustration: "Ilustrácia",
    illustration_theme: "Téma ilustrácie",
    theme_auto: "Automaticky",
    theme_day: "Deň",
    theme_night: "Noc",
    zoom: "Tlačidlo podrobností",
    language: "Jazyk",
    lang_auto: "Automaticky",
  },
  cs: {
    matter: "Matter",
    title: "Zařízení Matter",
    nodes_one: "{n} uzel",
    nodes_few: "{n} uzly",
    nodes_many: "{n} uzlu",
    nodes_other: "{n} uzlů",
    fabrics_one: "{n} fabric",
    fabrics_few: "{n} fabrics",
    fabrics_many: "{n} fabrics",
    fabrics_other: "{n} fabrics",
    server: "Server {version}",
    online: "{n} / {total} online",
    unavailable_one: "Nedostupné: {n}",
    unavailable_other: "Nedostupné: {n}",
    low_battery_one: "Slabá baterie: {n}",
    low_battery_other: "Slabá baterie: {n}",
    issues_one: "{n} problém",
    issues_few: "{n} problémy",
    issues_many: "{n} problému",
    issues_other: "{n} problémů",
    healthy: "Vše v pořádku",
    no_nodes: "Žádná zařízení",
    thread: "Thread",
    wifi: "Wi-Fi",
    ethernet: "Ethernet",
    unknown: "Neznámé",
    count_thread: "{n} Thread",
    count_wifi: "{n} Wi-Fi",
    count_ethernet: "{n} Ethernet",
    thread_network: "Thread · {name}",
    channel: "Kanál {n}",
    pan: "PAN {id}",
    border_routers_one: "{n} hraniční směrovač",
    border_routers_few: "{n} hraniční směrovače",
    border_routers_many: "{n} hraničního směrovače",
    border_routers_other: "{n} hraničních směrovačů",
    endpoints_one: "{n} koncový bod",
    endpoints_few: "{n} koncové body",
    endpoints_many: "{n} koncového bodu",
    endpoints_other: "{n} koncových bodů",
    unavailable: "Nedostupné",
    online_state: "Online",
    battery: "Baterie {pct}",
    dur_min: "{n} min",
    dur_h: "{n} h",
    dur_d: "{n} d",
    role_router: "směrovač",
    role_leader: "lídr",
    role_reed: "může být směrovačem",
    role_end_device: "koncové zařízení",
    role_sleepy_end_device: "spící koncové zařízení",
    role_routing_end_device: "směrovač",
    role_bridge: "most",
    commission: "Přidat zařízení",
    open_device: "Otevřít zařízení",
    close: "Zavřít",
    node_id: "ID uzlu",
    vendor: "Výrobce",
    product: "Produkt",
    firmware: "Firmware",
    network: "Síť",
    node_type: "Role",
    ip: "IP adresa",
    mac: "MAC adresa",
    rssi: "Signál",
    last_seen: "Naposledy viděno",
    fabrics: "Fabrics",
    no_devices: "Nenalezeno žádné zařízení Matter. Je integrace Matter nastavena?",
    zoom_in: "Zobrazit celou kartu",
    zoom_out: "Zpět na kompaktní zobrazení",
    ed_title: "Název",
    sort: "Řazení",
    sort_name: "Podle názvu",
    sort_status: "Nejdřív problémy",
    columns: "Sloupce",
    battery_threshold: "Slabá baterie pod (%)",
    show_thread: "Síť Thread",
    show_commission: "Tlačítko přidání",
    show_bridged: "Přemostěná zařízení",
    illustration: "Ilustrace",
    illustration_theme: "Motiv ilustrace",
    theme_auto: "Automaticky",
    theme_day: "Den",
    theme_night: "Noc",
    zoom: "Tlačítko podrobností",
    language: "Jazyk",
    lang_auto: "Automaticky",
  },
  sl: {
    matter: "Matter",
    title: "Naprave Matter",
    nodes_one: "{n} vozlišče",
    nodes_two: "{n} vozlišči",
    nodes_few: "{n} vozlišča",
    nodes_other: "{n} vozlišč",
    fabrics_one: "{n} fabric",
    fabrics_two: "{n} fabrics",
    fabrics_few: "{n} fabrics",
    fabrics_other: "{n} fabrics",
    server: "Strežnik {version}",
    online: "{n} / {total} na spletu",
    unavailable_one: "Nedosegljivo: {n}",
    unavailable_other: "Nedosegljivo: {n}",
    low_battery_one: "Šibka baterija: {n}",
    low_battery_other: "Šibka baterija: {n}",
    issues_one: "{n} težava",
    issues_two: "{n} težavi",
    issues_few: "{n} težave",
    issues_other: "{n} težav",
    healthy: "Vse v redu",
    no_nodes: "Ni naprav",
    thread: "Thread",
    wifi: "Wi-Fi",
    ethernet: "Ethernet",
    unknown: "Neznano",
    count_thread: "{n} Thread",
    count_wifi: "{n} Wi-Fi",
    count_ethernet: "{n} Ethernet",
    thread_network: "Thread · {name}",
    channel: "Kanal {n}",
    pan: "PAN {id}",
    border_routers_one: "{n} mejni usmerjevalnik",
    border_routers_two: "{n} mejna usmerjevalnika",
    border_routers_few: "{n} mejni usmerjevalniki",
    border_routers_other: "{n} mejnih usmerjevalnikov",
    endpoints_one: "{n} končna točka",
    endpoints_two: "{n} končni točki",
    endpoints_few: "{n} končne točke",
    endpoints_other: "{n} končnih točk",
    unavailable: "Nedosegljivo",
    online_state: "Na spletu",
    battery: "Baterija {pct}",
    dur_min: "{n} min",
    dur_h: "{n} h",
    dur_d: "{n} d",
    role_router: "usmerjevalnik",
    role_leader: "vodja",
    role_reed: "lahko postane usmerjevalnik",
    role_end_device: "končna naprava",
    role_sleepy_end_device: "speča končna naprava",
    role_routing_end_device: "usmerjevalnik",
    role_bridge: "most",
    commission: "Dodaj napravo",
    open_device: "Odpri napravo",
    close: "Zapri",
    node_id: "ID vozlišča",
    vendor: "Proizvajalec",
    product: "Izdelek",
    firmware: "Vdelana programska oprema",
    network: "Omrežje",
    node_type: "Vloga",
    ip: "Naslov IP",
    mac: "Naslov MAC",
    rssi: "Signal",
    last_seen: "Nazadnje videno",
    fabrics: "Fabrics",
    no_devices: "Ni najdenih naprav Matter. Ali je integracija Matter nastavljena?",
    zoom_in: "Pokaži celotno kartico",
    zoom_out: "Nazaj na strnjen pogled",
    ed_title: "Naslov",
    sort: "Razvrščanje",
    sort_name: "Po imenu",
    sort_status: "Najprej težave",
    columns: "Stolpci",
    battery_threshold: "Šibka baterija pod (%)",
    show_thread: "Omrežje Thread",
    show_commission: "Gumb za dodajanje",
    show_bridged: "Premoščene naprave",
    illustration: "Ilustracija",
    illustration_theme: "Tema ilustracije",
    theme_auto: "Samodejno",
    theme_day: "Dan",
    theme_night: "Noč",
    zoom: "Gumb za podrobnosti",
    language: "Jezik",
    lang_auto: "Samodejno",
  },
  lv: {
    matter: "Matter",
    title: "Matter ierīces",
    nodes_zero: "{n} mezglu",
    nodes_one: "{n} mezgls",
    nodes_other: "{n} mezgli",
    fabrics_zero: "{n} fabric",
    fabrics_one: "{n} fabric",
    fabrics_other: "{n} fabrics",
    server: "Serveris {version}",
    online: "{n} / {total} tiešsaistē",
    unavailable_one: "Nav pieejamas: {n}",
    unavailable_other: "Nav pieejamas: {n}",
    low_battery_one: "Zems akumulators: {n}",
    low_battery_other: "Zems akumulators: {n}",
    issues_zero: "{n} problēmu",
    issues_one: "{n} problēma",
    issues_other: "{n} problēmas",
    healthy: "Viss kārtībā",
    no_nodes: "Nav ierīču",
    thread: "Thread",
    wifi: "Wi-Fi",
    ethernet: "Ethernet",
    unknown: "Nezināms",
    count_thread: "{n} Thread",
    count_wifi: "{n} Wi-Fi",
    count_ethernet: "{n} Ethernet",
    thread_network: "Thread · {name}",
    channel: "Kanāls {n}",
    pan: "PAN {id}",
    border_routers_zero: "{n} robežmaršrutētāju",
    border_routers_one: "{n} robežmaršrutētājs",
    border_routers_other: "{n} robežmaršrutētāji",
    endpoints_zero: "{n} galapunktu",
    endpoints_one: "{n} galapunkts",
    endpoints_other: "{n} galapunkti",
    unavailable: "Nav pieejams",
    online_state: "Tiešsaistē",
    battery: "Akumulators {pct}",
    dur_min: "{n} min",
    dur_h: "{n} h",
    dur_d: "{n} d",
    role_router: "maršrutētājs",
    role_leader: "līderis",
    role_reed: "var kļūt par maršrutētāju",
    role_end_device: "gala ierīce",
    role_sleepy_end_device: "guloša gala ierīce",
    role_routing_end_device: "maršrutētājs",
    role_bridge: "tilts",
    commission: "Pievienot ierīci",
    open_device: "Atvērt ierīci",
    close: "Aizvērt",
    node_id: "Mezgla ID",
    vendor: "Ražotājs",
    product: "Produkts",
    firmware: "Aparātprogrammatūra",
    network: "Tīkls",
    node_type: "Loma",
    ip: "IP adrese",
    mac: "MAC adrese",
    rssi: "Signāls",
    last_seen: "Pēdējo reizi redzēts",
    fabrics: "Fabrics",
    no_devices: "Nav atrasta neviena Matter ierīce. Vai Matter integrācija ir iestatīta?",
    zoom_in: "Rādīt pilno karti",
    zoom_out: "Atpakaļ uz kompakto skatu",
    ed_title: "Virsraksts",
    sort: "Kārtošana",
    sort_name: "Pēc nosaukuma",
    sort_status: "Vispirms problēmas",
    columns: "Kolonnas",
    battery_threshold: "Zems akumulators zem (%)",
    show_thread: "Thread tīkls",
    show_commission: "Pievienošanas poga",
    show_bridged: "Ierīces caur tiltu",
    illustration: "Ilustrācija",
    illustration_theme: "Ilustrācijas tēma",
    theme_auto: "Automātiski",
    theme_day: "Diena",
    theme_night: "Nakts",
    zoom: "Detaļu poga",
    language: "Valoda",
    lang_auto: "Automātiski",
  },
  el: {
    matter: "Matter",
    title: "Συσκευές Matter",
    nodes_one: "{n} κόμβος",
    nodes_other: "{n} κόμβοι",
    fabrics_one: "{n} fabric",
    fabrics_other: "{n} fabrics",
    server: "Διακομιστής {version}",
    online: "{n} / {total} σε σύνδεση",
    unavailable_one: "{n} μη διαθέσιμη",
    unavailable_other: "{n} μη διαθέσιμες",
    low_battery_one: "{n} χαμηλή μπαταρία",
    low_battery_other: "{n} χαμηλές μπαταρίες",
    issues_one: "{n} πρόβλημα",
    issues_other: "{n} προβλήματα",
    healthy: "Όλα εντάξει",
    no_nodes: "Καμία συσκευή",
    thread: "Thread",
    wifi: "Wi-Fi",
    ethernet: "Ethernet",
    unknown: "Άγνωστο",
    count_thread: "{n} Thread",
    count_wifi: "{n} Wi-Fi",
    count_ethernet: "{n} Ethernet",
    thread_network: "Thread · {name}",
    channel: "Κανάλι {n}",
    pan: "PAN {id}",
    border_routers_one: "{n} δρομολογητής ορίου",
    border_routers_other: "{n} δρομολογητές ορίου",
    endpoints_one: "{n} τελικό σημείο",
    endpoints_other: "{n} τελικά σημεία",
    unavailable: "Μη διαθέσιμη",
    online_state: "Σε σύνδεση",
    battery: "Μπαταρία {pct}",
    dur_min: "{n} λεπ.",
    dur_h: "{n} ώρ.",
    dur_d: "{n} ημ.",
    role_router: "δρομολογητής",
    role_leader: "αρχηγός",
    role_reed: "υποψήφιος δρομολογητής",
    role_end_device: "τελική συσκευή",
    role_sleepy_end_device: "τελική συσκευή σε αναμονή",
    role_routing_end_device: "δρομολογητής",
    role_bridge: "γέφυρα",
    commission: "Προσθήκη συσκευής",
    open_device: "Άνοιγμα συσκευής",
    close: "Κλείσιμο",
    node_id: "ID κόμβου",
    vendor: "Κατασκευαστής",
    product: "Προϊόν",
    firmware: "Υλικολογισμικό",
    network: "Δίκτυο",
    node_type: "Ρόλος",
    ip: "Διεύθυνση IP",
    mac: "Διεύθυνση MAC",
    rssi: "Σήμα",
    last_seen: "Τελευταία εμφάνιση",
    fabrics: "Fabrics",
    no_devices: "Δεν βρέθηκε συσκευή Matter. Έχει ρυθμιστεί η ενσωμάτωση Matter;",
    zoom_in: "Εμφάνιση πλήρους κάρτας",
    zoom_out: "Επιστροφή στη συμπαγή προβολή",
    ed_title: "Τίτλος",
    sort: "Ταξινόμηση",
    sort_name: "Κατά όνομα",
    sort_status: "Πρώτα τα προβλήματα",
    columns: "Στήλες",
    battery_threshold: "Χαμηλή μπαταρία κάτω από (%)",
    show_thread: "Δίκτυο Thread",
    show_commission: "Κουμπί προσθήκης",
    show_bridged: "Συσκευές μέσω γέφυρας",
    illustration: "Εικονογράφηση",
    illustration_theme: "Θέμα εικονογράφησης",
    theme_auto: "Αυτόματο",
    theme_day: "Ημέρα",
    theme_night: "Νύχτα",
    zoom: "Κουμπί λεπτομερειών",
    language: "Γλώσσα",
    lang_auto: "Αυτόματα",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

// Locale for Intl: Home Assistant's full locale when its base matches the card's resolved language (keeps the
// region, e.g. pt-BR or de-CH), otherwise the resolved language. Home Assistant's "pt" is European Portuguese,
// which Intl would format as Brazilian, so bare "pt" becomes "pt-PT".
const fmtLang = (hass, config) => {
  const l = lang(hass, config);
  const ha = hass && (hass.locale?.language || hass.language);
  const loc = ha && ha.split("-")[0] === l.split("-")[0] && l !== "sr-Latn" ? ha : l;
  return loc === "pt" ? "pt-PT" : loc;
};

// A text of the card's language, English when missing, with its {placeholders} filled.
const t = (hass, config, key, vars = {}) => {
  const s = STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key;
  return String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
};

// "12 nodes": the plural form of the card's language (Intl.PluralRules), the `_other` form when the language has
// no text for that form.
const plural = (hass, config, key, n) => {
  let cat = "other";
  try {
    cat = new Intl.PluralRules(fmtLang(hass, config)).select(n);
  } catch (_e) {
    /* default form */
  }
  const table = STRINGS[lang(hass, config)];
  const k = `${key}_${cat}` in table ? `${key}_${cat}` : `${key}_other`;
  return t(hass, config, k, { n });
};

const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
const matterLogo = (cls = "") => `<svg class="icon logo ${cls}" viewBox="0 0 512 512" aria-hidden="true"><path d="${MATTER}"/></svg>`;
const num = (v) => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
const unavailableState = (st) => !st || st.state === "unavailable";

const navigate = (path) => {
  history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
};

// ---------------------------------------------------------------------------
// Matter nodes, from the device and entity registries
// ---------------------------------------------------------------------------

const DOMAIN = "matter";
const TRANSPORTS = ["thread", "wifi", "ethernet"];

// The node id and endpoint of a Matter device, from its device registry identifier: `deviceid_<compressed fabric
// id>-<node id>-MatterNodeDevice` for a node, `…-<endpoint>` for a device bridged by a node (homeassistant/components/
// matter/helpers.py, get_device_id). Null when the device has no such identifier.
const matterId = (device) => {
  for (const ident of device?.identifiers || []) {
    if (!Array.isArray(ident) || ident[0] !== DOMAIN) continue;
    const m = /^deviceid_[0-9a-f]+-([0-9a-f]+)-(MatterNodeDevice|\d+)$/i.exec(String(ident[1]));
    if (m) return { node: Number.parseInt(m[1], 16), endpoint: m[2] === "MatterNodeDevice" ? null : Number(m[2]) };
  }
  return null;
};

const isMatterDevice = (d) => !!d && !d.disabled_by && (d.identifiers || []).some((i) => Array.isArray(i) && i[0] === DOMAIN);

// The entities of each device, memoized on the registry objects (Home Assistant replaces them on every change).
let _byDevice = { entities: null, map: new Map() };
const entitiesByDevice = (hass) => {
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
const matterDevices = (hass, config = {}) => {
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
const MAIN_DOMAINS = [
  "lock", "light", "cover", "climate", "fan", "valve", "vacuum", "water_heater", "humidifier", "media_player", "switch",
  "binary_sensor", "sensor", "event", "button", "number", "select",
];
const DIAG_KEYS = new Set(["wifi_rssi", "thread_channel", "thread_routing_role", "thread_network_name"]);

// What the card reads among a device's entities: its main entity, its battery, its power, its Wi-Fi signal and its
// Thread role and network (Matter's diagnostic sensors, found by translation key).
const deviceEntities = (hass, deviceId) => {
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
const BINARY_ICONS = { door: "door", garage_door: "garage", window: "window", opening: "door", motion: "motion", occupancy: "motion", presence: "motion", moisture: "moisture", smoke: "smoke", carbon_monoxide: "smoke", battery: "battery" };
const SENSOR_ICONS = { temperature: "temperature", humidity: "humidity", power: "power", energy: "power", battery: "battery", pm25: "air", pm10: "air", aqi: "air", volatile_organic_compounds: "air", carbon_dioxide: "air" };
const COVER_ICONS = { blind: "blinds", shade: "blinds", shutter: "shutter", curtain: "curtains", garage: "garage", gate: "garage", door: "door", window: "window" };
const DOMAIN_ICONS = { light: "light", lock: "lock", climate: "thermostat", fan: "fan", valve: "valve", vacuum: "vacuum", water_heater: "boiler", humidifier: "humidifier", media_player: "speaker", button: "button", event: "button", cover: "blinds" };
const iconOf = (hass, entityId, isBridge = false) => {
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
const transportOf = (diag, ents) => {
  if (diag && TRANSPORTS.includes(diag.network_type)) return diag.network_type;
  if (ents.role || ents.channel || ents.threadName) return "thread";
  if (ents.rssi) return "wifi";
  return "unknown";
};

// Everything the card shows of a node, worked out from the registries, the states and its diagnostics. `level` is
// ok, warn (low battery) or alert (unavailable).
const nodeInfo = (hass, device, { diag = null, bridged = [], threshold = 20, lastSeen = null } = {}) => {
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
const fabricsOf = (diags) => {
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
const summaryOf = (infos) => {
  const count = { thread: 0, wifi: 0, ethernet: 0, unknown: 0 };
  for (const i of infos) count[i.transport] = (count[i.transport] || 0) + 1;
  const unavailable = infos.filter((i) => !i.available).length;
  const lowBattery = infos.filter((i) => i.lowBattery).length;
  return { total: infos.length, online: infos.length - unavailable, unavailable, lowBattery, issues: unavailable + lowBattery, count };
};

// The Thread network: the preferred dataset of the Thread integration (admins only), else what the Thread nodes
// report (network name, channel); its border routers are those discovered on its extended PAN id.
const threadOf = (infos, dataset, routers, hass) => {
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

const DIAG_TTL = 10 * 60 * 1000;
const RETRY_MS = 60 * 1000;
const store = {
  rev: 0,
  diag: new Map(), // device id → { at, data, available, pending }
  queue: [],
  running: 0,
  thread: { at: 0, pending: false, datasets: null, failed: false },
  topo: { at: 0, pending: false, seen: new Map(), failed: 0 },
  routers: { subs: 0, unsub: null, map: new Map(), pending: false, failed: false },
  cards: new Set(),
};
const bump = () => {
  store.rev++;
  for (const c of store.cards) c._dataChanged();
};

const runQueue = () => {
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
const refreshDiagnostics = (hass, infos) => {
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

const isAdmin = (hass) => !!hass?.user?.is_admin;
const hasComponent = (hass, c) => !Array.isArray(hass?.config?.components) || hass.config.components.includes(c);

// A websocket command of an admin, asked every 10 minutes (an hour after a failure, as with an older server), its
// answer kept in `s` by `keep`.
const refreshEvery = (hass, s, type, keep, ok = true) => {
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
const refreshThread = (hass) =>
  refreshEvery(
    hass,
    store.thread,
    "thread/list_datasets",
    (r) => {
      store.thread.datasets = Array.isArray(r?.datasets) ? r.datasets : [];
    },
    hasComponent(hass, "thread"),
  );

const preferredDataset = () => {
  const ds = store.thread.datasets;
  return ds ? ds.find((d) => d.preferred) || ds[0] || null : null;
};

// The Matter network topology (recent Matter Server): the time each node was last seen.
const refreshTopology = (hass) =>
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
const subscribeRouters = (hass) => {
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
const unsubscribeRouters = (force = false) => {
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
const serverVersion = (hass) => {
  for (const st of Object.values(hass?.states || {})) {
    if (!st?.entity_id?.startsWith("update.")) continue;
    const title = String(st.attributes?.title || st.attributes?.friendly_name || "");
    if (/matter server/i.test(title) && st.attributes?.installed_version) return String(st.attributes.installed_version);
  }
  return null;
};

// ---------------------------------------------------------------------------
// Shadow DOM patching (kept nodes keep their focus, hover and running animations)
// ---------------------------------------------------------------------------

const patchAttrs = (cur, next) => {
  for (const { name } of [...cur.attributes]) if (!next.hasAttribute(name)) cur.removeAttribute(name);
  for (const { name, value } of next.attributes) if (cur.getAttribute(name) !== value) cur.setAttribute(name, value);
};
const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute("data-key") : null);
const sameNode = (a, b) => !!a && a.nodeType === b.nodeType && a.nodeName === b.nodeName;
const patchChildren = (cur, next) => {
  const old = [...cur.childNodes];
  const fresh = [...next.childNodes];
  const byKey = new Map();
  for (const o of old) {
    const k = keyOf(o);
    if (k !== null && !byKey.has(k)) byKey.set(k, o);
  }
  const used = new Set();
  fresh.forEach((n, i) => {
    const k = keyOf(n);
    let o = k !== null ? byKey.get(k) : old[i];
    if (!sameNode(o, n) || used.has(o) || (k === null && keyOf(o) !== null)) o = null;
    const ref = cur.childNodes[i] ?? null;
    if (!o) {
      cur.insertBefore(n, ref);
      return;
    }
    used.add(o);
    if (o !== ref) cur.insertBefore(o, ref);
    if (n.nodeType === 1) {
      patchAttrs(o, n);
      patchChildren(o, n);
    } else if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue;
  });
  while (cur.childNodes.length > fresh.length) cur.removeChild(cur.lastChild);
};
const morph = (root, html) => {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  patchChildren(root, tpl.content);
};

// A click inside a dialog (more-info opened from the card) is not a click outside the card.
const inDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable sends no click to the page. The handler runs when the press and the
// release are both outside the card; keyboard clicks (no click count) still go through the click event.
const watchOutside = (card, handler) => {
  let downOutside = false;
  const outside = (ev) => !ev.composedPath().includes(card);
  const onDown = (ev) => {
    downOutside = outside(ev);
  };
  const onUp = (ev) => {
    if (downOutside && outside(ev)) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0 && outside(ev)) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
  };
};

// ---------------------------------------------------------------------------
// The banner's scene: a house section, the Matter hub at its centre linked to six devices; packets travel the
// links, and an unreachable device turns red and blinks
// ---------------------------------------------------------------------------

// Every animation of the banner lasts a divisor of 6 s (packets 1.5 / 2 / 3 s, ping 2 s, blink 1.5 s, strip 2 s):
// a 6 s recording loops. The scene is drawn in the 108 × 80 window (x 94 → 202) of a 200 × 80 box whose bottom
// edge stands on the ground strip; the house's walls go down to it. No SVG ids: several cards share a page safely.
const SCENE_HUB = [148, 44];
const SCENE_DEVICES = [
  [112, 22, "light"],
  [140, 14, "outlet"],
  [168, 31, "temperature"],
  [110, 58, "motion"],
  [186, 58, "lock"],
  [160, 66, "blinds_h"],
];
const SCENE_DOWN = 4;
const SCENE_SPEEDS = [1.5, 2, 3, 1.5, 2, 3];
const sceneSvg = (down) => {
  const [hx, hy] = SCENE_HUB;
  const bad = (i) => down && i === SCENE_DOWN;
  const links = SCENE_DEVICES.map(([x, y], i) => {
    const line = `<line class="${bad(i) ? "down" : "up"}" x1="${hx}" y1="${hy}" x2="${x}" y2="${y}"/>`;
    if (bad(i)) return line;
    return `${line}<circle class="pkt" r="1.6" style="offset-path:path('M${hx} ${hy} L${x} ${y}');animation-duration:${SCENE_SPEEDS[i]}s;animation-delay:-${i * 0.5}s"/>`;
  }).join("");
  const devices = SCENE_DEVICES.map(
    ([x, y, icon], i) =>
      `<g class="dev${bad(i) ? " down" : ""}" transform="translate(${x} ${y})"><circle r="9"/><path transform="translate(-6.5 -6.5) scale(0.54)" d="${ICONS[icon]}"/>${
        bad(i) ? '<circle class="alarm blink" cx="6.6" cy="-6.6" r="2.4"/>' : ""
      }</g>`,
  ).join("");
  return `<svg class="scene" viewBox="94 0 108 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">
    <path class="house" d="M98 80 V30 L148 6 L198 30 V80"/><line class="floor" x1="98" y1="44" x2="198" y2="44"/>
    <g class="links">${links}</g>${devices}
    <g transform="translate(${hx} ${hy})"><circle class="ping" r="10"/><circle class="hub" r="10"/><path class="hub-logo" transform="translate(-7 -7) scale(0.0273)" d="${MATTER}"/></g>
  </svg>`;
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const COMMON_STYLE = `
  :host { --mc-accent: #5b5bd6; --mc-ok: var(--success-color, #43a047); --mc-warn: var(--warning-color, #ffa600);
          --mc-alert: var(--error-color, #db4437); --mc-idle: var(--secondary-text-color, #9e9e9e); --mc-na: var(--disabled-color, #9e9e9e);
          --mc-thread: #039be5; --mc-wifi: #7e57c2; --mc-ethernet: #9e9e9e; display: block; min-width: 0; }
  ha-card { overflow: hidden; position: relative; container-type: inline-size; }
  /* A size container has no width of its own content: in a parent sized by its content the card would fall to a
     few pixels. This empty grid gives it a natural width of 400 px without any minimum. */
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, 400px); height: 0; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  [role="button"] { cursor: pointer; }
  [role="button"]:focus-visible, button:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  .ok { --c: var(--mc-ok); } .warn { --c: var(--mc-warn); } .alert { --c: var(--mc-alert); } .na { --c: var(--mc-na); }
  .warning { padding: 16px; color: color-mix(in srgb, var(--mc-warn) 40%, var(--primary-text-color, #212121)); }
`;

// The status pill (a dot and its label in the badge's colour), on the banner, the classic header and the mini card.
const PILL_STYLE = `
  .s-ok { --c: var(--mc-accent); } .s-warn { --c: var(--mc-warn); } .s-alert { --c: var(--mc-alert); } .s-na { --c: var(--mc-idle); }
  .night .bst.s-ok { --c: #b9b7ff; }
  .bst { flex: none; display: inline-flex; align-items: center; gap: 5px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;
         line-height: 16px; white-space: nowrap; box-sizing: border-box; max-width: 100%; overflow: hidden;
         background: color-mix(in srgb, var(--c) 15%, transparent); color: color-mix(in srgb, var(--c) 40%, var(--primary-text-color, #212121)); }
  .banner .bst { background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
  .banner.night .bst { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }
  .bst .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--c); flex: none; }
  .bst .txt { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  @container (max-width: 200px) { .bst { padding: 4px; } .bst .txt { display: none; } }
`;

// The illustrated header, the same on both cards: 90 px, the title on the lavender sky at its left, the scene at its
// right, a 10 px ground strip edge to edge at its bottom (a network line with nodes, packets sliding along it).
const BANNER_STYLE = `
  .banner { position: relative; height: 90px; overflow: hidden; --strip-h: 10px; --scene-w: 108px;
            --sky-text: #1f1b4d; --sky-muted: #4b4680; --mesh: #7f5bd6; --line: #5b52c9; --dev-bg: #f6f5ff; --dev-st: #c9c4f5; --wall: #d8cfc1;
            background: linear-gradient(90deg, #f7f6ff 0%, #ecebfd 34%, #d8d5fa 70%, #c6c2f5 100%); }
  .banner.night { --sky-text: #ffffff; --sky-muted: rgba(255,255,255,.78); --line: #a9a3ff; --dev-bg: #211e47; --dev-st: #3e3a7a; --wall: #3a4456;
                  background: linear-gradient(90deg, #26234f 0%, #211e47 36%, #1b1940 72%, #161435 100%); }
  /* With the detail button in its top-right corner, the scene stands left of it. */
  .banner:has(> .zoom) { --btn-w: 30px; }
  .banner .scene { position: absolute; right: var(--btn-w, 0px); bottom: var(--strip-h); height: calc(100% - var(--strip-h)); width: var(--scene-w); overflow: hidden; }
  /* Ground strip: the Matter network line, its nodes every 24 px. */
  .strip { position: absolute; left: 0; right: 0; bottom: 0; height: var(--strip-h);
           background-color: color-mix(in srgb, var(--mesh) 18%, #e9eef5);
           background-image: radial-gradient(circle, var(--mesh) 2px, transparent 2.5px), linear-gradient(var(--mesh), var(--mesh));
           background-size: 24px 100%, 100% 1px; background-repeat: repeat-x, no-repeat; background-position: 0 50%, 0 50%;
           box-shadow: inset 0 2px 0 color-mix(in srgb, var(--mesh) 50%, #fff); animation: mc-slide 2s linear infinite; }
  .night .strip { background-color: color-mix(in srgb, var(--mesh) 20%, #1a202c); box-shadow: inset 0 2px 0 color-mix(in srgb, var(--mesh) 55%, #1a202c); }
  .head { position: absolute; z-index: 1; left: 0; top: 0; bottom: var(--strip-h); box-sizing: border-box; right: calc(var(--scene-w) + var(--btn-w, 0px) + 4px);
          display: flex; align-items: center; gap: 10px; padding: 6px 6px 6px 12px; min-width: 0; color: var(--sky-text); }
  /* The Matter badge: its colour is the network's status (healthy accent, a low battery amber, an unreachable node red,
     no node grey). */
  .badge { position: relative; width: 40px; height: 40px; flex: none; border-radius: 50%; display: grid; place-items: center; color: var(--bc);
           --bc: var(--mc-accent); background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px rgba(91,91,214,.2); }
  .night .badge { --bc: #b9b7ff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
  .badge.s-warn, .night .badge.s-warn { --bc: var(--mc-warn); } .badge.s-alert, .night .badge.s-alert { --bc: var(--mc-alert); }
  .badge.s-na, .night .badge.s-na { --bc: var(--mc-idle); }
  .badge .icon { width: 24px; height: 24px; }
  .titles { flex: 1 1 0; min-width: 0; overflow: hidden; display: flex; flex-direction: column; }
  /* The title row: the name, then the status pill right after it (the name gives way first, down to 4 characters);
     when the pill does not fit (measured, see _fitPill) or on a narrow card, it takes a line of its own under the
     subtitle, and on the narrowest cards only its dot stays. */
  .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .trow > .name { flex: 0 1 auto; min-width: 4.5ch; }
${PILL_STYLE}  .titles.below .trow { display: contents; }
  .titles.below .bst { order: 2; align-self: flex-start; margin-top: 2px; }
  .titles.below .stats { order: 1; max-height: 16px; }
  @container (max-width: 260px) {
    .trow { display: contents; }
    .trow > .bst { order: 2; align-self: flex-start; margin-top: 2px; }
    .titles .stats { order: 1; max-height: 16px; }
  }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* The statistics on two lines at most: a part that does not fit goes to a third line, clipped away; the "·" that
     starts a line sits in the negative margin, clipped too. */
  .stats { display: flex; flex-wrap: wrap; max-height: 32px; overflow: hidden; margin-left: -10px; font-size: 12px; line-height: 16px; color: var(--sky-muted); }
  .stats span { white-space: nowrap; }
  .stats span::before { content: "·"; display: inline-block; width: 10px; text-align: center; }
  /* Scene colours, day and night. */
  .scene .house { fill: rgba(255,255,255,.55); stroke: var(--wall); stroke-width: 1.6; }
  .night .scene .house { fill: rgba(255,255,255,.03); }
  .scene .floor { stroke: var(--wall); stroke-width: 1; stroke-dasharray: 3 3; }
  .scene .links line { stroke: var(--line); stroke-width: 1.2; stroke-opacity: .55; }
  .scene .links line.down { stroke: var(--mc-alert); stroke-opacity: .8; stroke-dasharray: 2 3; }
  .scene .pkt { fill: var(--line); animation: mc-pkt 2s linear infinite; }
  .scene .dev circle { fill: var(--dev-bg); stroke: var(--dev-st); stroke-width: 1.4; }
  .scene .dev path { fill: var(--line); }
  .scene .dev.down circle { stroke: var(--mc-alert); } .scene .dev.down path { fill: var(--mc-alert); }
  .scene .dev .alarm { fill: var(--mc-alert); stroke: none; }
  .scene .hub { fill: var(--line); } .scene .hub-logo { fill: #ffffff; }
  .scene .ping { fill: none; stroke: var(--line); stroke-width: 1; transform-box: fill-box; transform-origin: center; animation: mc-ping 2s ease-out infinite; }
  /* ── Animations (each one a divisor of 6 s) ── */
  .scene .blink { animation: mc-blink 1.5s ease-in-out infinite; }
  @keyframes mc-pkt { from { offset-distance: 0%; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } to { offset-distance: 100%; opacity: 0; } }
  @keyframes mc-ping { from { transform: scale(1); opacity: .9; } to { transform: scale(2.6); opacity: 0; } }
  @keyframes mc-blink { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
  @keyframes mc-slide { to { background-position: 24px 50%, 0 50%; } }
  @media (prefers-reduced-motion: reduce) {
    .scene *, .strip { animation: none !important; }
    .scene .pkt, .scene .ping { display: none; }
  }
  /* A narrow card keeps the sky and the strip for its texts: no scene. */
  @container (max-width: 300px) {
    .banner .scene { display: none; }
    .head { right: var(--btn-w, 0px); }
  }

  /* ── Classic header (illustration: false) ── */
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 14px 0; }
  .header .badge { background: color-mix(in srgb, var(--bc) 16%, transparent); box-shadow: none; }
  .header .stats { color: var(--secondary-text-color); }
`;

const FULL_STYLE = `
  /* Status pill: the state colour on a tint, the text mixed with the text colour to stay readable. */
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;
          line-height: 16px; white-space: nowrap; min-width: 0; max-width: 100%; box-sizing: border-box; overflow: hidden; flex: 0 1 auto;
          background: color-mix(in srgb, var(--c) 15%, transparent); color: color-mix(in srgb, var(--c) 40%, var(--primary-text-color, #212121)); }
  .chip .txt { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c); flex: none; }

  /* ── Status chips, fabrics on the right ── */
  .status { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 8px; padding: 10px 12px 0; min-width: 0; }
  .fabrics { margin-left: auto; min-width: 0; max-width: 100%; font-size: 12px; line-height: 16px; color: var(--secondary-text-color);
             white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* ── Thread network and nodes: 56 px tiles, the size of Home Assistant's Tile card ── */
  .content { padding: 10px 12px 12px; display: flex; flex-direction: column; gap: 8px; }
  .grid { display: grid; grid-template-columns: repeat(var(--cols, 2), minmax(0, 1fr)); gap: 8px; }
  /* Under 460 px (a phone, a narrow column) two tiles leave the name a few letters: one node per row, its transport
     tag kept. */
  @container (max-width: 459px) { .grid { grid-template-columns: minmax(0, 1fr); } }
  .tile { all: unset; position: relative; box-sizing: border-box; cursor: pointer; min-width: 0; min-height: 56px;
          display: flex; align-items: center; gap: 10px; padding: 8px 10px 8px 8px; border-radius: 12px; --t: var(--mc-ok);
          background: var(--secondary-background-color, #f1f1f1); transition: background .2s; }
  .tile.lvl-warn { --t: var(--mc-warn); } .tile.lvl-alert { --t: var(--mc-alert); }
  /* The tile stays neutral: an issue shows on its icon, its state line and its status dot only. */
  .tile:hover { background: color-mix(in srgb, var(--t) 13%, var(--secondary-background-color, #f1f1f1)); }
  .tile:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  .ic { position: relative; flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
        color: var(--t); background: color-mix(in srgb, var(--t) 16%, transparent); }
  .lvl-ok .ic { color: var(--primary-text-color); background: color-mix(in srgb, var(--mc-idle) 14%, transparent); }
  .ic .icon { width: 24px; height: 24px; }
  .ic ha-icon { --mdc-icon-size: 24px; }
  .sdot { position: absolute; right: -1px; bottom: -1px; width: 10px; height: 10px; border-radius: 50%; background: var(--t);
          box-shadow: 0 0 0 2px var(--secondary-background-color, #f1f1f1); }
  .txt { flex: 1 1 auto; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .tname { font-size: 14px; font-weight: 500; line-height: 1.25; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* A reading is never cut short: on a narrow tile it goes on to a second line, between its words only (a word too
     long for its line ends with "…"); the name, a label, keeps its ellipsis. */
  .tstate { font-size: 12px; line-height: 1.25; color: var(--secondary-text-color); overflow: hidden; text-overflow: ellipsis; }
  .tile:not(.lvl-ok) .tstate { color: var(--t); }
  /* Transport tag: Thread blue, Wi-Fi purple, Ethernet grey. */
  .tag { flex: none; padding: 1px 6px; border-radius: 12px; font-size: 11px; font-weight: 500; line-height: 16px; white-space: nowrap;
         background: color-mix(in srgb, var(--c) 15%, transparent); color: color-mix(in srgb, var(--c) 40%, var(--primary-text-color, #212121)); }
  .tag.thread { --c: var(--mc-thread); } .tag.wifi { --c: var(--mc-wifi); }
  .tag.ethernet { --c: var(--mc-ethernet); background: color-mix(in srgb, var(--c) 18%, transparent); color: color-mix(in srgb, var(--c) 25%, var(--primary-text-color, #212121)); }
  .tile .chip { flex: none; }
  /* The Thread tile of a card this narrow keeps its line for the network: its node count is in the banner. */
  @container (max-width: 300px) { .thread-net .chip { display: none; } }
  .empty { padding: 4px 2px; font-size: 13px; color: var(--secondary-text-color); }

  /* ── Commission button: tinted, never filled ── */
  .actions { display: flex; justify-content: flex-end; margin-top: 2px; }
  .btn { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; padding: 8px 14px;
         font-size: 13px; font-weight: 500; line-height: 16px; box-sizing: border-box; max-width: 100%;
         background: color-mix(in srgb, var(--mc-accent) 14%, transparent); color: color-mix(in srgb, var(--mc-accent) 70%, var(--primary-text-color, #212121)); }
  .btn:hover { background: color-mix(in srgb, var(--mc-accent) 22%, transparent); }
  .btn:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  .btn .icon { width: 16px; height: 16px; }

  /* ── Node popup, at the top of the card ── */
  .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: flex-start; justify-content: center;
              padding-top: 10px; box-sizing: border-box; z-index: 9; border-radius: inherit; }
  .modal { background: var(--card-background-color, #fff); color: var(--primary-text-color); width: min(94%, 380px); max-height: calc(100% - 20px);
           overflow: auto; box-sizing: border-box; border-radius: 14px; padding: 14px; box-shadow: 0 8px 30px rgba(0,0,0,.35);
           display: flex; flex-direction: column; gap: 10px; }
  .mhead { display: flex; align-items: flex-start; gap: 10px; }
  .mhead .ic { width: 36px; height: 36px; }
  .mhead .ic .icon { width: 20px; height: 20px; }
  .mhead .ic ha-icon { --mdc-icon-size: 20px; }
  .mhead h3 { margin: 0; font-size: 16px; font-weight: 500; line-height: 1.3; overflow-wrap: anywhere; }
  .mhead .sub { font-size: 12px; color: var(--secondary-text-color); overflow-wrap: anywhere; }
  .mhead > div { flex: 1 1 auto; min-width: 0; }
  .close { all: unset; flex: none; cursor: pointer; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center;
           color: var(--secondary-text-color); box-shadow: inset 0 0 0 1px var(--divider-color, rgba(127,127,127,.3)); }
  .close:hover { color: var(--primary-text-color); background: color-mix(in srgb, var(--secondary-text-color) 12%, transparent); }
  .close .icon { width: 16px; height: 16px; }
  .mchips { display: flex; flex-wrap: wrap; gap: 6px; }
  .facts { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 5px 12px; margin: 0; font-size: 13px; }
  .facts dt { color: var(--secondary-text-color); }
  .facts dd { margin: 0; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }
  .modal .actions { margin-top: 0; }
`;

// The mini cards' chips row.
const MINI_CHIPS_STYLE = `
  .rs { display: flex; flex-wrap: wrap; gap: 2px 4px; margin-left: -4px; }
  .rs:empty { display: none; }
  /* A chip is plain (icon and text) until it needs a look: then a tinted pill. It never runs past the card. */
  .r { display: inline-flex; align-items: center; gap: 1px; padding: 0 5px 0 4px; box-sizing: border-box; min-width: 0; max-width: 100%;
       overflow: hidden; border-radius: 999px; font-size: 12px; font-weight: 500; line-height: 18px; white-space: nowrap; --t: var(--mc-ok);
       color: var(--primary-text-color); }
  .r .icon { width: 13px; height: 13px; color: var(--t); margin-right: 2px; }
  .r > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .r.pill { color: var(--t); background: color-mix(in srgb, var(--t) 14%, transparent); }
  .r.alert { --t: var(--mc-alert); } .r.warn { --t: var(--mc-warn); }
`;

// The mini card: a 40 px badge beside the title, the status and the chips, like the other ha-* mini cards.
const MINI_STYLE = `
  ha-card { padding: 12px; }
  .mini { display: flex; align-items: flex-start; gap: 10px; }
  .badge { flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; --bc: var(--mc-accent);
           background: color-mix(in srgb, var(--bc) 16%, transparent); color: var(--bc); }
  .badge.s-warn { --bc: var(--mc-warn); } .badge.s-alert { --bc: var(--mc-alert); } .badge.s-na { --bc: var(--mc-idle); }
  .badge .icon { width: 24px; height: 24px; }
  /* The badge keeps the full card's size (40 px, icon 24 px): the body is at least as tall, a lone title line centred
     beside it. */
  .body { flex: 1; min-width: 0; min-height: 40px; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
  .mhead { display: flex; align-items: center; gap: 8px; }
  .title { flex: 0 1 auto; min-width: 4.5ch; font-size: 16px; font-weight: 500; line-height: 1.25; color: var(--primary-text-color);
           white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mhead > .bst { flex: none; }
  .mhead > .zoom { margin-left: auto; }
${MINI_CHIPS_STYLE}  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px -4px -4px 0; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--mc-idle) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 1px; }
  /* Under 200 px the status pill is only its coloured dot (PILL_STYLE), its text kept in its title and aria-label. */
  @container (max-width: 200px) {
    /* The title keeps a few letters beside the dot and the detail button (6 columns on a phone). */
    .mhead { gap: 4px; }
    .title { min-width: 2ch; }
  }
`;

// The illustrated mini card: the banner, the status (a dot of its colour) under the title, the chips row below.
const MINI_BANNER_STYLE = `
${MINI_CHIPS_STYLE}  .rs { padding: 8px 10px 10px 8px; margin-left: 0; }
`;

// The zoomed mini card: the full card, with the detail button over its banner.
const ZOOM_STYLE = `
  .zoom { all: unset; position: absolute; z-index: 2; top: 5px; right: 5px; cursor: pointer; width: 24px; height: 24px; border-radius: 50%;
          display: grid; place-items: center; color: #33506b; background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7);
          backdrop-filter: blur(4px); }
  .zoom:hover { background: rgba(255,255,255,.75); }
  .zoom.on-night { color: #ffffff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
  .zoom.on-night:hover { background: rgba(255,255,255,.22); }
  .zoom.plain { color: var(--secondary-text-color); background: none; box-shadow: inset 0 0 0 1px var(--divider-color, rgba(127,127,127,.3)); top: 18px; right: 12px; }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 1px; }
  .header { position: relative; padding-right: 48px; }
`;

// ---------------------------------------------------------------------------
// The full card
// ---------------------------------------------------------------------------

class MatterCard extends HTMLElement {
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

  // Night banner: forced by illustration_theme, else the sun below the horizon, else the dark theme.
  _night() {
    const mode = this._config.illustration_theme;
    if (mode === "night") return true;
    if (mode === "day") return false;
    const sun = this._hass?.states?.["sun.sun"]?.state;
    if (sun === "below_horizon" || sun === "above_horizon") return sun === "below_horizon";
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

  // The pill keeps its whole label: when it does not fit beside the title (already down to four characters), it
  // takes a line of its own under the subtitle.
  _fitPill() {
    const t = this.shadowRoot?.querySelector(".head .titles, .header .titles");
    if (!t?.classList) return;
    t.classList.remove("below");
    const tx = t.querySelector(".bst .txt");
    if (tx && tx.scrollWidth > tx.clientWidth + 0.5) t.classList.add("below");
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
        <div class="stats">${stats.map((s) => `<span>${esc(s)}</span>`).join("")}</div>
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
      <span class="txt"><span class="tname">${esc(i.name)}</span><span class="tstate">${esc(state)}</span></span>
      ${this._tag(i.transport)}
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

// ---------------------------------------------------------------------------
// The mini card: the status of the network beside the Matter badge; its detail button unfolds the full card
// ---------------------------------------------------------------------------

class MatterMiniCard extends MatterCard {
  constructor() {
    super();
    this._zoomed = false;
    this._onFold = (ev) => {
      // The click that closed the node popup only closes the popup.
      if (this._detailClosedBy === ev) return;
      if (this._zoomed && !inDialog(ev)) this._setZoom(false);
    };
  }

  static getConfigElement() {
    return document.createElement("matter-mini-card-editor");
  }

  connectedCallback() {
    super.connectedCallback();
    (this._foldWatch ??= watchOutside(this, (ev) => this._onFold(ev))).on();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._foldWatch?.off();
    this._zoomed = false;
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : this._config?.illustration === false ? 2 : 3;
  }

  getGridOptions() {
    return this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 };
  }

  _setZoom(zoomed) {
    this._zoomed = zoomed;
    if (!zoomed) {
      this._detail = null;
      window.removeEventListener("keydown", this._onKey);
    }
    this._update(this._sig);
  }

  _click(ev) {
    if (!this._detail && ev.composedPath().some((n) => n.classList?.contains("zoom"))) {
      ev.stopPropagation();
      this._setZoom(!this._zoomed);
      if (ev.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
      return;
    }
    super._click(ev);
  }

  _extraStyle() {
    return this._zoomed ? ZOOM_STYLE : "";
  }

  _zoomButton(cls = "") {
    if (this._config.zoom === false) return "";
    const z = this._zoomed;
    const label = esc(this._t(z ? "zoom_out" : "zoom_in"));
    return `<button class="zoom ${cls}" title="${label}" aria-label="${label}" aria-expanded="${z}">${svgIcon(z ? ICONS.collapse : ICONS.expand)}</button>`;
  }

  _miniChip(icon, text, cls = "") {
    return `<span class="r${cls ? ` pill ${cls}` : ""}">${svgIcon(icon)}<span>${esc(text)}</span></span>`;
  }

  _render() {
    if (this._zoomed) return super._render();
    if (!this._infos.length && !Object.values(this._hass?.devices || {}).some(isMatterDevice)) return this._noDevices();
    const s = this._summary;
    const chips = [];
    const TRANSPORT_ICONS = { thread: ICONS.thread, wifi: ICONS.wifi, ethernet: ICONS.bridge };
    for (const tr of TRANSPORTS) if (s.count[tr]) chips.push(this._miniChip(TRANSPORT_ICONS[tr], this._t(`count_${tr}`, { n: this._num(s.count[tr]) })));
    if (s.unavailable) chips.push(this._miniChip(ICONS.offline, this._p("unavailable", s.unavailable), "alert"));
    if (s.lowBattery) chips.push(this._miniChip(ICONS.battery, this._p("low_battery", s.lowBattery), "warn"));
    const title = esc(this._config.title || this._t("matter"));
    if (this._config.illustration === false)
      return `<style>${COMMON_STYLE}${PILL_STYLE}${MINI_STYLE}</style>
      <ha-card>
        <div class="mini s-${this._level()}">
          ${this._badgeHtml()}
          <div class="body">
            <div class="mhead">
              <span class="title">${title}</span>${this._pill()}
              ${this._zoomButton()}
            </div>
            <div class="rs">${chips.join("")}</div>
          </div>
        </div>
      </ha-card>`;
    // The illustrated mini card: the full card's banner, its status pill after the title, the chips below.
    return `<style>${COMMON_STYLE}${BANNER_STYLE}${MINI_BANNER_STYLE}${ZOOM_STYLE}</style>
      <ha-card>
        <div class="mini">
          ${this._bannerOpen()}
            <div class="head">${this._badgeHtml()}<div class="titles"><div class="trow"><div class="name">${title}</div>${this._pill()}</div></div></div>
            ${this._zoomButton(this._night() ? "on-night" : "")}
          </div>
          <div class="rs">${chips.join("")}</div>
        </div>
      </ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------

// Options on by default (left out of the YAML while on), and off by default (left out while off).
const ON_BY_DEFAULT = ["show_thread", "show_commission", "illustration", "zoom"];
const OFF_BY_DEFAULT = ["show_bridged"];
const DEFAULTS = { sort: "name", columns: 2, battery_threshold: 20, illustration_theme: "auto" };
const LANGUAGES = [
  ["en", "English"], ["fr", "Français"], ["de", "Deutsch"], ["es", "Español"], ["sr", "Српски"], ["sr-Latn", "Srpski (latinica)"],
  ["it", "Italiano"], ["nl", "Nederlands"], ["pt", "Português (Portugal)"], ["pl", "Polski"], ["ro", "Română"], ["da", "Dansk"],
  ["sv", "Svenska"], ["bg", "Български"], ["ru", "Русский"], ["uk", "Українська"], ["hu", "Magyar"], ["sk", "Slovenčina"],
  ["cs", "Čeština"], ["sl", "Slovenščina"], ["lv", "Latviešu"], ["el", "Ελληνικά"],
];

class MatterCardEditor extends HTMLElement {
  static get mini() {
    return false;
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _schema() {
    const tr = (k) => t(this._hass, this._config, k);
    const toggles = ["show_thread", "show_commission", "show_bridged", "illustration"];
    if (this.constructor.mini) toggles.push("zoom");
    return [
      { name: "title", selector: { text: {} } },
      {
        type: "grid",
        name: "",
        schema: [
          { name: "sort", selector: { select: { mode: "dropdown", options: ["name", "status"].map((v) => ({ value: v, label: tr(`sort_${v}`) })) } } },
          { name: "columns", selector: { number: { min: 1, max: 4, step: 1, mode: "box" } } },
          { name: "battery_threshold", selector: { number: { min: 1, max: 100, step: 1, mode: "box", unit_of_measurement: "%" } } },
          {
            name: "illustration_theme",
            selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((v) => ({ value: v, label: tr(`theme_${v}`) })) } },
          },
        ],
      },
      { type: "grid", name: "", schema: toggles.map((name) => ({ name, selector: { boolean: {} } })) },
      {
        name: "language",
        selector: { select: { mode: "dropdown", options: [{ value: "", label: tr("lang_auto") }, ...LANGUAGES.map(([value, label]) => ({ value, label }))] } },
      },
    ];
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => t(this._hass, this._config, s.name === "title" ? "ed_title" : s.name);
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        for (const [k, v] of Object.entries(config)) {
          // A minimal YAML: no empty values, no options left at their default.
          if (
            v === "" ||
            v === undefined ||
            v === null ||
            (ON_BY_DEFAULT.includes(k) && v === true) ||
            (OFF_BY_DEFAULT.includes(k) && v === false) ||
            (k in DEFAULTS && DEFAULTS[k] === v)
          )
            delete config[k];
        }
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const data = { ...DEFAULTS, ...this._config };
    for (const k of ON_BY_DEFAULT) if (data[k] === undefined) data[k] = true;
    for (const k of OFF_BY_DEFAULT) if (data[k] === undefined) data[k] = false;
    this._form.hass = this._hass;
    this._form.data = data;
    this._form.schema = this._schema();
  }
}

class MatterMiniCardEditor extends MatterCardEditor {
  static get mini() {
    return true;
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const define = (name, cls) => {
  if (!customElements.get(name)) customElements.define(name, cls);
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
