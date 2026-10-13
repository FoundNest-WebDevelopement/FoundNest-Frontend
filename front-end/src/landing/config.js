// Configuration and static content of the public landing page.
// Everything that depends on the deployment is read from Vite env variables (see .env.example).

export const API_URL = import.meta.env.VITE_API_URL;

// Same tile service the in-app Map screen uses (no API key needed)
export const MAP_TILE_URL = "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
export const CAMPUS_CENTER = [14.8582, 120.8142];
// Offices further away than this from the campus centre are left off the landing map, so one
// off-campus / test record can't zoom the whole map out. Raise it if an official off-campus
// office should be listed.
export const MAX_OFFICE_DISTANCE_KM = 3;

// The APK is attached to the "application" release of this repository and is always re-published
// there under the same file name, so this direct asset URL keeps working. GitHub answers it with a
// file-download response, so the browser starts downloading without leaving the page.
export const APP_DOWNLOAD_URL =
  "https://github.com/FoundNest-WebDevelopement/FoundNest-Frontend/releases/download/application/app-release.apk";
export const APP_DOWNLOAD_FILENAME = "app-release.apk";

export const NAV_LINKS = [
  { id: "how-it-works", label: "How It Works" },
  { id: "office-map", label: "Office Map" },
  { id: "recent-items", label: "Recent Items" },
  { id: "qr-features", label: "QR Features" },
];

// Illustrative items for the "Browse Recent Found Items" carousel. /api/found-reports/public needs a
// signed-in user, so the public page shows examples. Categories use the names the real system has;
// none of these are real records.
export const PREVIEW_ITEMS = [
  { id: "p1", name: "Black folding umbrella", category: "Personal Items", place: "Near the library", icon: "Umbrella" },
  { id: "p2", name: "Smartphone with blue case", category: "Electronics", place: "Activity Center", icon: "Smartphone" },
  { id: "p3", name: "Brown leather wallet", category: "Personal Items", place: "Heroes Park", icon: "Wallet" },
  { id: "p4", name: "Student ID and lanyard", category: "Official Documents", place: "Main gate area", icon: "IdCard" },
  { id: "p5", name: "Wireless earphones", category: "Electronics & Gadgets", place: "Bulsu E-Library", icon: "Headphones" },
  { id: "p6", name: "Gray zip-up jacket", category: "Clothing and Accessories", place: "Covered court", icon: "Shirt" },
  { id: "p7", name: "Badminton racket", category: "Sports Equipment", place: "Gymnasium", icon: "Dumbbell" },
  { id: "p8", name: "Set of keys", category: "Personal Items", place: "Near the canteen", icon: "KeyRound" },
];
