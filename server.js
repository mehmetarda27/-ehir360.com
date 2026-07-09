import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { get as getBlob, put as putBlob } from "@vercel/blob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const dbFile = path.join(dataDir, "db.json");
const googleCacheFile = path.join(dataDir, "google-cache.json");
const osmCacheFile = path.join(dataDir, "osm-cache.json");
const PORT = Number(process.env.API_PORT || 4000);
const DB_BLOB_KEY = process.env.DB_BLOB_KEY || "sehir-paneli/db.json";
const JWT_SECRET = process.env.JWT_SECRET || "local-dev-secret-change-me";
const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
const GOOGLE_CACHE_TTL_MS = Number(process.env.GOOGLE_CACHE_TTL_MS || 1000 * 60 * 60 * 24);
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter"
];
const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const CITY_VIEWBOXES = {
  mersin: "34.35,36.95,35.00,36.55",
  istanbul: "28.50,41.35,29.45,40.75",
  ankara: "32.45,40.15,33.20,39.65",
  izmir: "26.85,38.65,27.45,38.20"
};

const categoryCatalog = [
  { id: "restaurants", slug: "restoranlar", name: "Restoranlar", googleType: "restaurant", query: "restoran", nominatimQueries: ["restaurant", "restoran"], osmFilters: [{ key: "amenity", value: "restaurant" }] },
  { id: "cafes", slug: "kafeler", name: "Kafeler", googleType: "cafe", query: "kafe", nominatimQueries: ["cafe", "kafe"], osmFilters: [{ key: "amenity", value: "cafe" }] },
  { id: "bakeries", slug: "pastaneler", name: "Pastaneler", googleType: "bakery", query: "pastane tatlici", nominatimQueries: ["bakery", "pastane", "tatlici"], osmFilters: [{ key: "shop", value: "bakery" }, { key: "amenity", value: "ice_cream" }] },
  { id: "fast-food", slug: "fast-food", name: "Fast Food", googleType: "fast_food_restaurant", query: "fast food", osmFilters: [{ key: "amenity", value: "fast_food" }] },
  { id: "hotels", slug: "oteller", name: "Oteller", googleType: "hotel", query: "otel", nominatimQueries: ["hotel", "otel"], osmFilters: [{ key: "tourism", value: "hotel" }, { key: "tourism", value: "guest_house" }, { key: "tourism", value: "hostel" }] },
  { id: "hair-care", slug: "kuaforler", name: "Kuaforler", googleType: "hair_care", query: "kuafor berber", nominatimQueries: ["kuafor", "hairdresser", "berber"], osmFilters: [{ key: "shop", value: "hairdresser" }, { key: "shop", value: "beauty" }] },
  { id: "hospitals", slug: "hastaneler", name: "Hastaneler", googleType: "hospital", query: "hastane", osmFilters: [{ key: "amenity", value: "hospital" }, { key: "healthcare", value: "hospital" }, { key: "healthcare", value: "clinic" }] },
  { id: "dentists", slug: "dis-klinikleri", name: "Dis Klinikleri", googleType: "dentist", query: "dis klinigi", nominatimQueries: ["diş", "dentist", "ağız diş", "diş kliniği"], osmFilters: [{ key: "amenity", value: "dentist" }, { key: "healthcare", value: "dentist" }] },
  { id: "pharmacies", slug: "eczaneler", name: "Eczaneler", googleType: "pharmacy", query: "eczane", nominatimQueries: ["eczane", "pharmacy"], osmFilters: [{ key: "amenity", value: "pharmacy" }] },
  { id: "markets", slug: "marketler", name: "Marketler", googleType: "supermarket", query: "market", nominatimQueries: ["supermarket", "bakkal", "market"], osmFilters: [{ key: "shop", value: "supermarket" }, { key: "shop", value: "convenience" }, { key: "shop", value: "greengrocer" }] },
  { id: "gyms", slug: "spor-salonlari", name: "Spor Salonlari", googleType: "gym", query: "spor salonu", nominatimQueries: ["spor salonu", "pilates", "fitness", "gym"], osmFilters: [{ key: "leisure", value: "fitness_centre" }, { key: "leisure", value: "sports_centre" }, { key: "amenity", value: "gym" }] },
  { id: "car-repair", slug: "oto-servisler", name: "Oto Servisler", googleType: "car_repair", query: "oto servis", nominatimQueries: ["oto servis", "car repair", "oto"], osmFilters: [{ key: "shop", value: "car_repair" }, { key: "shop", value: "car" }, { key: "amenity", value: "car_wash" }] },
  { id: "gas-stations", slug: "akaryakit-istasyonlari", name: "Akaryakit Istasyonlari", googleType: "gas_station", query: "akaryakit istasyonu", osmFilters: [{ key: "amenity", value: "fuel" }] },
  { id: "veterinary", slug: "veterinerler", name: "Veterinerler", googleType: "veterinary_care", query: "veteriner", osmFilters: [{ key: "amenity", value: "veterinary" }] },
  { id: "lawyers", slug: "avukatlar", name: "Avukatlar", googleType: "lawyer", query: "avukat", osmFilters: [{ key: "office", value: "lawyer" }] },
  { id: "accounting", slug: "muhasebeciler", name: "Muhasebeciler", googleType: "accounting", query: "muhasebeci", osmFilters: [{ key: "office", value: "accountant" }, { key: "office", value: "tax_advisor" }] },
  { id: "courses", slug: "kurslar", name: "Kurslar", googleType: "school", query: "kurs egitim", nominatimQueries: ["kurs", "egitim", "school", "driving school"], osmFilters: [{ key: "amenity", value: "school" }, { key: "amenity", value: "language_school" }, { key: "amenity", value: "driving_school" }, { key: "office", value: "educational_institution" }] },
  { id: "taxi", slug: "taksi-duraklari", name: "Taksi Duraklari", googleType: "taxi_stand", query: "taksi duragi", nominatimQueries: ["taksi", "taxi", "taksi duragi"], osmFilters: [{ key: "amenity", value: "taxi" }] },
  { id: "real-estate", slug: "emlakcilar", name: "Emlakcilar", googleType: "real_estate_agency", query: "emlakci", nominatimQueries: ["emlak", "gayrimenkul", "estate agent", "real estate"], osmFilters: [{ key: "office", value: "estate_agent" }] },
  { id: "technical-service", slug: "teknik-servisler", name: "Teknik Servisler", googleType: "electronics_store", query: "teknik servis", nominatimQueries: ["bilgisayar", "electronics", "computer", "telefon", "teknik servis"], osmFilters: [{ key: "shop", value: "electronics" }, { key: "craft", value: "electronics_repair" }, { key: "shop", value: "mobile_phone" }, { key: "shop", value: "computer" }] }
];

const defaultCities = [
  { id: "mersin", name: "Mersin", active: true, businessCount: 0 },
  { id: "istanbul", name: "Istanbul", active: false, businessCount: 0 },
  { id: "ankara", name: "Ankara", active: false, businessCount: 0 },
  { id: "izmir", name: "Izmir", active: false, businessCount: 0 }
];

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin) || origin === process.env.CLIENT_ORIGIN) return callback(null, true);
    callback(new Error("CORS origin reddedildi"));
  }
}));
app.use(express.json({ limit: "2mb" }));
app.use(express.text({ type: ["text/csv", "text/plain"], limit: "5mb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 240 }));

const now = () => new Date().toISOString();
const slugify = (value) => String(value || "")
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "") || `kayit-${Date.now()}`;

const isDbFile = (file) => path.resolve(file) === path.resolve(dbFile);
const hasBlobStore = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN));
let dbBlobNeedsBootstrap = false;

async function streamToText(stream) {
  const reader = stream.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function readJson(file, fallback) {
  if (isDbFile(file) && hasBlobStore()) {
    try {
      const blob = await getBlob(DB_BLOB_KEY, { access: "private", useCache: false });
      if (blob?.statusCode === 200 && blob.stream) {
        return JSON.parse(await streamToText(blob.stream));
      }
      dbBlobNeedsBootstrap = true;
    } catch (error) {
      if (!["BlobNotFoundError", "BlobStoreNotFoundError"].includes(error?.name)) {
        throw error;
      }
      dbBlobNeedsBootstrap = true;
    }
  }
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(file, data) {
  if (isDbFile(file) && hasBlobStore()) {
    await putBlob(DB_BLOB_KEY, JSON.stringify(data, null, 2), {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60
    });
    dbBlobNeedsBootstrap = false;
    return;
  }
  if (isDbFile(file) && process.env.VERCEL) {
    throw new Error("Vercel production icin BLOB_READ_WRITE_TOKEN veya Blob store baglantisi gerekli.");
  }
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

function normalizeDb(db) {
  const existingCategories = db.categories || [];
  const categories = [
    ...categoryCatalog.map((category) => ({ ...category, count: 0, ...(existingCategories.find((item) => item.id === category.id) || {}) })),
    ...existingCategories.filter((item) => !categoryCatalog.some((category) => category.id === item.id))
  ];
  return {
    users: db.users || [],
    businesses: (db.businesses || []).filter((item) => item.source !== "seed"),
    categories,
    cities: db.cities?.length ? db.cities : defaultCities,
    campaigns: db.campaigns || [],
    notifications: db.notifications || [],
    packages: db.packages?.length ? db.packages : [
      { id: "free", name: "Ucretsiz", price: 0, features: ["Temel profil"] },
      { id: "premium", name: "Premium", price: 999, features: ["One cikarma", "Sponsor rozet"] }
    ],
    reviews: db.reviews || [],
    favorites: db.favorites || [],
    googleImports: db.googleImports || [],
    googleSyncs: db.googleSyncs || []
  };
}

async function seedDb() {
  const rawDb = await readJson(dbFile, {});
  const existing = normalizeDb(rawDb);
  let shouldPersist = dbBlobNeedsBootstrap || !rawDb.users || !rawDb.businesses || !rawDb.categories;
  if (!existing.users.some((user) => user.role === "admin")) {
    existing.users.push({
      id: "u-admin",
      role: "admin",
      name: "Yonetici",
      email: process.env.ADMIN_EMAIL || "admin@sehirpaneli.com",
      passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || "Admin123", 10),
      createdAt: now()
    });
    shouldPersist = true;
  }
  if (shouldPersist) await writeJson(dbFile, existing);
  return existing;
}

async function withDb(handler) {
  const db = await seedDb();
  const result = await handler(db);
  await writeJson(dbFile, db);
  return result;
}

const publicUser = (user) => {
  const { passwordHash, ...safe } = user;
  return safe;
};

function sign(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}

function auth(requiredRoles = []) {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) return res.status(401).json({ message: "Token gerekli" });
      const payload = jwt.verify(token, JWT_SECRET);
      const db = await seedDb();
      const user = db.users.find((item) => item.id === payload.id);
      if (!user) return res.status(401).json({ message: "Kullanici bulunamadi" });
      if (requiredRoles.length && !requiredRoles.includes(user.role)) return res.status(403).json({ message: "Yetki yok" });
      req.user = user;
      req.db = db;
      next();
    } catch {
      res.status(401).json({ message: "Oturum gecersiz" });
    }
  };
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
}

function validatePhone(phone) {
  return !phone || /^\+?[0-9\s()-]{10,20}$/.test(String(phone));
}

function createNotification(db, notification) {
  const record = { id: `n-${Date.now()}-${Math.random().toString(16).slice(2)}`, readBy: [], createdAt: now(), ...notification };
  db.notifications.unshift(record);
  return record;
}

function categoryBySlugOrId(value, categories = categoryCatalog) {
  if (!value) return null;
  const needle = String(value);
  const needleLower = needle.toLowerCase();
  const needleSlug = slugify(needle);
  return categories.find((item) => (
    String(item.id || "").toLowerCase() === needleLower ||
    String(item.slug || "").toLowerCase() === needleLower ||
    String(item.googleType || "").toLowerCase() === needleLower ||
    String(item.name || "").toLowerCase() === needleLower ||
    slugify(item.id) === needleSlug ||
    slugify(item.slug) === needleSlug ||
    slugify(item.name) === needleSlug
  ));
}

function categoryForPlace(place, fallbackCategory) {
  const types = place.types || [];
  return categoryCatalog.find((category) => types.includes(category.googleType)) || fallbackCategory || categoryCatalog[0];
}

function photoUrl(photoName) {
  if (!photoName || !GOOGLE_KEY) return "";
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=900&key=${encodeURIComponent(GOOGLE_KEY)}`;
}

function districtFromAddress(address, city) {
  const parts = String(address || "").split(",").map((part) => part.trim()).filter(Boolean);
  return parts.find((part) => part && !part.toLowerCase().includes(String(city || "").toLowerCase())) || city || "";
}

function mapGooglePlace(place, { city, category }) {
  const resolvedCategory = categoryForPlace(place, category);
  const photos = (place.photos || []).slice(0, 5).map((photo) => photoUrl(photo.name)).filter(Boolean);
  const phone = place.nationalPhoneNumber || place.internationalPhoneNumber || "";
  const website = place.websiteUri || place.googleMapsUri || "";
  const displayName = place.displayName?.text || place.name || place.id;
  return {
    id: `google-${place.id}`,
    placeId: place.id,
    googleResourceName: place.name,
    name: displayName,
    slug: slugify(displayName),
    categoryId: resolvedCategory.id,
    category: resolvedCategory.name,
    categorySlug: resolvedCategory.slug,
    cityId: slugify(city),
    city,
    address: place.formattedAddress || place.shortFormattedAddress || city,
    district: districtFromAddress(place.formattedAddress || "", city),
    phone,
    whatsapp: phone.replace(/\D/g, ""),
    website,
    instagram: "",
    rating: place.rating || 0,
    reviewCount: place.userRatingCount || 0,
    open: place.currentOpeningHours?.openNow ?? place.regularOpeningHours?.openNow ?? true,
    isOpen: place.currentOpeningHours?.openNow ?? place.regularOpeningHours?.openNow ?? true,
    verified: true,
    isVerified: true,
    sponsored: false,
    isSponsored: false,
    featured: Number(place.rating || 0) >= 4.3,
    isNew: false,
    packageType: "google",
    package: "google",
    source: "google",
    description: place.editorialSummary?.text || `${displayName} Google Places uzerinden listelenen canli isletme kaydidir.`,
    services: place.types || [],
    menuItems: [],
    photos,
    image: photos[0] || "",
    cover: photos[1] || photos[0] || "",
    logo: photos[0] || "",
    gallery: photos,
    openingHours: place.regularOpeningHours?.weekdayDescriptions || [],
    hours: (place.regularOpeningHours?.weekdayDescriptions || []).map((line) => {
      const [day, ...rest] = line.split(":");
      return { day, time: rest.join(":").trim() };
    }),
    latitude: place.location?.latitude || null,
    longitude: place.location?.longitude || null,
    googleMapsUri: place.googleMapsUri || "",
    reviews: [],
    clicks: { phone: 0, whatsapp: 0, directions: 0, website: 0 },
    createdAt: now(),
    updatedAt: now()
  };
}

function mergeBusiness(db, incoming) {
  const index = db.businesses.findIndex((item) => (
    (incoming.placeId && item.placeId === incoming.placeId) ||
    (incoming.osmId && item.osmId === incoming.osmId) ||
    item.id === incoming.id
  ));
  if (index >= 0) {
    db.businesses[index] = { ...db.businesses[index], ...incoming, id: db.businesses[index].id, createdAt: db.businesses[index].createdAt, updatedAt: now() };
    return { business: db.businesses[index], created: false };
  }
  db.businesses.unshift(incoming);
  return { business: incoming, created: true };
}

async function googleTextSearch({ city = "Mersin", category, q, pageSize = 20, force = false }) {
  const resolvedCategory = categoryBySlugOrId(category) || categoryCatalog[0];
  const textQuery = [q || resolvedCategory.query, city].filter(Boolean).join(" ");
  const cache = await readJson(googleCacheFile, {});
  const cacheKey = JSON.stringify({ textQuery, type: resolvedCategory.googleType, pageSize });
  if (!force && cache[cacheKey] && Date.now() - cache[cacheKey].createdAt < GOOGLE_CACHE_TTL_MS) {
    return { places: cache[cacheKey].places, cacheHit: true, googleEnabled: Boolean(GOOGLE_KEY), message: null };
  }
  if (!GOOGLE_KEY) {
    return {
      places: [],
      cacheHit: false,
      googleEnabled: false,
      message: "GOOGLE_MAPS_API_KEY tanimli degil. Sahte veri uretilmedi; canli isletme cekmek icin .env dosyasina Google Places API anahtari ekleyin."
    };
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_KEY,
      "X-Goog-FieldMask": [
        "places.id",
        "places.name",
        "places.displayName",
        "places.formattedAddress",
        "places.shortFormattedAddress",
        "places.location",
        "places.rating",
        "places.userRatingCount",
        "places.currentOpeningHours",
        "places.regularOpeningHours",
        "places.nationalPhoneNumber",
        "places.internationalPhoneNumber",
        "places.websiteUri",
        "places.googleMapsUri",
        "places.types",
        "places.photos",
        "places.editorialSummary"
      ].join(",")
    },
    body: JSON.stringify({
      textQuery,
      languageCode: "tr",
      regionCode: "TR",
      includedType: resolvedCategory.googleType,
      pageSize: Math.max(1, Math.min(Number(pageSize) || 20, 20))
    })
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error?.message || "Google Places API istegi basarisiz");
  }
  const places = (json.places || []).map((place) => mapGooglePlace(place, { city, category: resolvedCategory }));
  cache[cacheKey] = { createdAt: Date.now(), places };
  await writeJson(googleCacheFile, cache);
  return { places, cacheHit: false, googleEnabled: true, message: null };
}

async function syncGooglePlaces({ city = "Mersin", category, q, force = false }) {
  const result = await googleTextSearch({ city, category, q, force });
  const saved = await withDb(async (db) => {
    const savedRows = [];
    for (const place of result.places) {
      const merged = mergeBusiness(db, place);
      savedRows.push(merged);
      if (merged.created) {
        createNotification(db, { role: "customer", title: "Yeni isletme eklendi", text: `${place.name} Google Places uzerinden eklendi.`, to: `/business/${place.slug}` });
        createNotification(db, { role: "admin", title: "Google verisi eklendi", text: `${place.name} veritabanina kaydedildi.`, to: "/admin" });
      }
    }
    db.googleSyncs.unshift({ id: `sync-${Date.now()}`, city, category, q, count: savedRows.length, cacheHit: result.cacheHit, googleEnabled: result.googleEnabled, createdAt: now() });
    return savedRows;
  });
  return { ...result, savedCount: saved.length, createdCount: saved.filter((item) => item.created).length };
}

function osmFilterQuery(category) {
  return (category.osmFilters || []).flatMap((filter) => [
    `node(area.searchArea)["${filter.key}"="${filter.value}"];`,
    `way(area.searchArea)["${filter.key}"="${filter.value}"];`,
    `relation(area.searchArea)["${filter.key}"="${filter.value}"];`
  ]).join("\n");
}

function osmElementCenter(element) {
  return {
    latitude: element.lat ?? element.center?.lat ?? null,
    longitude: element.lon ?? element.center?.lon ?? null
  };
}

function mapOsmElement(element, { city, category }) {
  const tags = element.tags || {};
  const name = tags.name || tags["name:tr"] || tags.brand || tags.operator || "";
  if (!name) return null;
  const center = osmElementCenter(element);
  const street = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ");
  const address = [street, tags["addr:neighbourhood"], tags["addr:district"], tags["addr:city"] || city].filter(Boolean).join(", ");
  const phone = tags.phone || tags["contact:phone"] || "";
  const website = tags.website || tags["contact:website"] || "";
  const openingHours = tags.opening_hours ? [tags.opening_hours] : [];
  const osmId = `${element.type}-${element.id}`;
  return {
    id: `osm-${osmId}`,
    osmId,
    name,
    slug: slugify(`${name}-${osmId}`),
    categoryId: category.id,
    category: category.name,
    categorySlug: category.slug,
    cityId: slugify(city),
    city,
    address: address || city,
    district: tags["addr:district"] || tags["addr:suburb"] || tags["addr:neighbourhood"] || "",
    phone,
    whatsapp: phone.replace(/\D/g, ""),
    website,
    instagram: tags["contact:instagram"] || tags.instagram || "",
    rating: 0,
    reviewCount: 0,
    open: true,
    isOpen: true,
    verified: true,
    isVerified: true,
    sponsored: false,
    isSponsored: false,
    featured: false,
    isNew: false,
    packageType: "osm",
    package: "osm",
    source: "osm",
    description: tags.description || tags.note || `${name} OpenStreetMap uzerinden alinan gercek isletme kaydidir.`,
    services: Object.entries(tags).filter(([key]) => ["amenity", "shop", "tourism", "healthcare", "office", "leisure", "craft", "cuisine"].includes(key)).map(([key, value]) => `${key}=${value}`),
    menuItems: [],
    photos: [],
    image: "",
    cover: "",
    logo: "",
    gallery: [],
    openingHours,
    hours: openingHours.map((time) => ({ day: "OSM", time })),
    latitude: center.latitude,
    longitude: center.longitude,
    googleMapsUri: center.latitude && center.longitude ? `https://maps.google.com/?q=${center.latitude},${center.longitude}` : "",
    osmUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    reviews: [],
    clicks: { phone: 0, whatsapp: 0, directions: 0, website: 0 },
    createdAt: now(),
    updatedAt: now()
  };
}

function mapNominatimPlace(place, { city, category }) {
  const name = place.name || place.address?.amenity || place.address?.shop || place.display_name?.split(",")[0] || "";
  if (!name) return null;
  const osmId = `${place.osm_type}-${place.osm_id}`;
  const address = place.display_name || city;
  const latitude = place.lat ? Number(place.lat) : null;
  const longitude = place.lon ? Number(place.lon) : null;
  return {
    id: `osm-${osmId}`,
    osmId,
    name,
    slug: slugify(`${name}-${osmId}`),
    categoryId: category.id,
    category: category.name,
    categorySlug: category.slug,
    cityId: slugify(city),
    city,
    address,
    district: place.address?.suburb || place.address?.city_district || place.address?.town || place.address?.county || "",
    phone: "",
    whatsapp: "",
    website: "",
    instagram: "",
    rating: 0,
    reviewCount: 0,
    open: true,
    isOpen: true,
    verified: true,
    isVerified: true,
    sponsored: false,
    isSponsored: false,
    featured: false,
    isNew: false,
    packageType: "osm",
    package: "osm",
    source: "osm",
    description: `${name} OpenStreetMap/Nominatim uzerinden alinan gercek isletme kaydidir.`,
    services: [place.category, place.type].filter(Boolean),
    menuItems: [],
    photos: [],
    image: "",
    cover: "",
    logo: "",
    gallery: [],
    openingHours: [],
    hours: [],
    latitude,
    longitude,
    googleMapsUri: latitude && longitude ? `https://maps.google.com/?q=${latitude},${longitude}` : "",
    osmUrl: place.osm_type && place.osm_id ? `https://www.openstreetmap.org/${place.osm_type}/${place.osm_id}` : "",
    reviews: [],
    clicks: { phone: 0, whatsapp: 0, directions: 0, website: 0 },
    createdAt: now(),
    updatedAt: now()
  };
}

async function nominatimSearch({ city = "Mersin", category, limit = 15 }) {
  const resolvedCategory = categoryBySlugOrId(category) || categoryCatalog[0];
  const cityKey = slugify(city);
  const viewbox = CITY_VIEWBOXES[cityKey] || CITY_VIEWBOXES.mersin;
  const targetLimit = Math.max(1, Math.min(Number(limit) || 15, 40));
  const queries = resolvedCategory.nominatimQueries || [resolvedCategory.query];
  const json = [];
  for (const queryText of queries) {
    const searchParams = new URLSearchParams({
      format: "jsonv2",
      q: queryText,
      limit: String(targetLimit),
      addressdetails: "1",
      bounded: "1",
      viewbox
    });
    const response = await fetch(`${NOMINATIM_ENDPOINT}?${searchParams.toString()}`, {
      headers: { "User-Agent": "SehirPaneli/1.0 local development contact=local" }
    });
    const rows = await response.json();
    if (!response.ok) throw new Error(rows.error || "Nominatim istegi basarisiz");
    json.push(...rows);
    const uniqueCount = new Set(json.map((place) => `${place.osm_type}-${place.osm_id}`)).size;
    if (uniqueCount >= targetLimit) break;
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }
  const seen = new Set();
  const businesses = (json || [])
    .map((place) => mapNominatimPlace(place, { city, category: resolvedCategory }))
    .filter(Boolean)
    .filter((business) => {
      if (seen.has(business.osmId)) return false;
      seen.add(business.osmId);
      return true;
    })
    .slice(0, targetLimit);
  return businesses;
}

async function overpassSearch({ city = "Mersin", category, limit = 25, force = false }) {
  const resolvedCategory = categoryBySlugOrId(category) || categoryCatalog[0];
  const cache = await readJson(osmCacheFile, {});
  const cacheKey = JSON.stringify({ city, category: resolvedCategory.id, limit, provider: "osm" });
  if (!force && cache[cacheKey] && Date.now() - cache[cacheKey].createdAt < GOOGLE_CACHE_TTL_MS) {
    return { businesses: cache[cacheKey].businesses, cacheHit: true, provider: cache[cacheKey].provider || "osm" };
  }
  const query = `
[out:json][timeout:50];
area["name"="${city}"]["boundary"="administrative"]->.searchArea;
(
${osmFilterQuery(resolvedCategory)}
);
out center tags ${Math.max(1, Math.min(Number(limit) || 25, 80))};
`;
  let json = null;
  let lastError = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: new URLSearchParams({ data: query })
      });
      const text = await response.text();
      if (!response.ok) {
        lastError = `${endpoint}: ${text.slice(0, 180)}`;
        continue;
      }
      json = JSON.parse(text);
      break;
    } catch (error) {
      lastError = error.message;
    }
  }
  if (!json) {
    const businesses = await nominatimSearch({ city, category: resolvedCategory.id, limit });
    cache[cacheKey] = { createdAt: Date.now(), businesses, provider: "nominatim", overpassError: lastError };
    await writeJson(osmCacheFile, cache);
    return { businesses, cacheHit: false, provider: "nominatim", overpassError: lastError };
  }
  const seen = new Set();
  const businesses = (json.elements || [])
    .map((element) => mapOsmElement(element, { city, category: resolvedCategory }))
    .filter(Boolean)
    .filter((business) => {
      const key = business.osmId || business.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  cache[cacheKey] = { createdAt: Date.now(), businesses };
  await writeJson(osmCacheFile, cache);
  return { businesses, cacheHit: false, provider: "overpass" };
}

async function nominatimCachedSearch({ city = "Mersin", category, limit = 15, force = false }) {
  const resolvedCategory = categoryBySlugOrId(category) || categoryCatalog[0];
  const cache = await readJson(osmCacheFile, {});
  const cacheKey = JSON.stringify({ city, category: resolvedCategory.id, limit, provider: "nominatim" });
  if (!force && cache[cacheKey] && Date.now() - cache[cacheKey].createdAt < GOOGLE_CACHE_TTL_MS) {
    return { businesses: cache[cacheKey].businesses, cacheHit: true, provider: "nominatim" };
  }
  const businesses = await nominatimSearch({ city, category: resolvedCategory.id, limit });
  cache[cacheKey] = { createdAt: Date.now(), businesses, provider: "nominatim" };
  await writeJson(osmCacheFile, cache);
  return { businesses, cacheHit: false, provider: "nominatim" };
}

async function syncOsmPlaces({ city = "Mersin", category, force = false, limit = 25, direct = false }) {
  const result = direct
    ? await nominatimCachedSearch({ city, category, force, limit })
    : await overpassSearch({ city, category, force, limit });
  const saved = await withDb(async (db) => {
    const savedRows = [];
    for (const business of result.businesses) {
      const merged = mergeBusiness(db, business);
      savedRows.push(merged);
      if (merged.created) {
        createNotification(db, { role: "customer", title: "Yeni isletme eklendi", text: `${business.name} OpenStreetMap uzerinden eklendi.`, to: `/business/${business.slug}` });
        createNotification(db, { role: "admin", title: "OSM verisi eklendi", text: `${business.name} veritabanina kaydedildi.`, to: "/admin" });
      }
    }
    db.googleSyncs.unshift({ id: `osm-sync-${Date.now()}`, provider: "osm", city, category, count: savedRows.length, cacheHit: result.cacheHit, createdAt: now() });
    return savedRows;
  });
  return { ...result, savedCount: saved.length, createdCount: saved.filter((item) => item.created).length };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  const [headers = [], ...data] = rows;
  return data.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function filterBusinesses(rows, { city, category, q }, categories = categoryCatalog) {
  let result = rows;
  if (city) result = result.filter((item) => item.city?.toLowerCase() === String(city).toLowerCase() || item.cityId === slugify(city));
  if (category) {
    const resolved = categoryBySlugOrId(category, categories);
    const categorySlug = slugify(category);
    result = result.filter((item) => (
      slugify(item.categorySlug) === categorySlug ||
      slugify(item.categoryId) === categorySlug ||
      slugify(item.category) === categorySlug ||
      (resolved && (item.categoryId === resolved.id || item.categorySlug === resolved.slug || slugify(item.category) === slugify(resolved.name)))
    ));
  }
  if (q) {
    const needle = slugify(q);
    result = result.filter((item) => slugify(`${item.name} ${item.category} ${item.district} ${item.address}`).includes(needle));
  }
  return result;
}

function buildUserBusiness(input, ownerId, approved = false, categories = categoryCatalog) {
  const name = input.name || input.businessName;
  const category = categoryBySlugOrId(input.categoryId || input.categorySlug || input.category, categories) || categories[0] || categoryCatalog[0];
  const photos = input.photos || [];
  const statusApproved = ["onayli", "onayl"].includes(slugify(input.status));
  const isApproved = input.verified ?? input.isVerified ?? (input.status ? statusApproved : approved);
  return {
    id: input.id || `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    slug: input.slug || slugify(name),
    categoryId: category.id,
    category: category.name,
    categorySlug: category.slug,
    cityId: slugify(input.city || "Mersin"),
    city: input.city || "Mersin",
    address: input.address || "",
    district: input.district || "",
    phone: input.phone || "",
    whatsapp: String(input.whatsapp || input.phone || "").replace(/\D/g, ""),
    website: input.website || "",
    instagram: input.instagram || "",
    rating: Number(input.rating || 0),
    reviewCount: Number(input.reviewCount || 0),
    open: input.open ?? true,
    isOpen: input.isOpen ?? true,
    verified: isApproved,
    isVerified: isApproved,
    sponsored: input.packageType === "premium",
    isSponsored: input.packageType === "premium",
    featured: true,
    isNew: true,
    packageType: input.packageType || "free",
    package: input.packageType || "free",
    description: input.description || "",
    services: input.services || [],
    menuItems: input.menuItems || [],
    photos,
    image: input.image || photos[0] || "",
    cover: input.cover || photos[1] || photos[0] || "",
    logo: input.logo || photos[0] || "",
    gallery: input.gallery || photos,
    openingHours: input.openingHours || [],
    hours: input.hours || [],
    latitude: input.latitude || null,
    longitude: input.longitude || null,
    source: "user",
    ownerId,
    reviews: input.reviews || [],
    clicks: input.clicks || { phone: 0, whatsapp: 0, directions: 0, website: 0 },
    createdAt: input.createdAt || now(),
    updatedAt: now()
  };
}

app.get("/api/health", (_req, res) => res.json({
  ok: true,
  googleEnabled: Boolean(GOOGLE_KEY),
  storage: hasBlobStore() ? "vercel-blob" : "local-json"
}));

app.post("/api/auth/register", async (req, res) => {
  const { role = "customer", name, email, password, businessName, phone } = req.body;
  if (!["customer", "business", "admin"].includes(role)) return res.status(400).json({ message: "Gecersiz rol" });
  if (!name || !validateEmail(email) || String(password || "").length < 6) return res.status(400).json({ message: "Ad, gecerli e-posta ve en az 6 karakter sifre gerekli" });
  if (!validatePhone(phone)) return res.status(400).json({ message: "Telefon formati gecersiz" });
  const payload = await withDb(async (db) => {
    if (db.users.some((user) => user.email.toLowerCase() === email.toLowerCase())) return { status: 409, body: { message: "Bu e-posta zaten kayitli" } };
    const user = { id: `u-${Date.now()}`, role, name, email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 10), packageType: null, createdAt: now() };
    db.users.push(user);
    if (role === "business") {
      const business = buildUserBusiness({ businessName: businessName || name, phone, city: "Mersin" }, user.id, false, db.categories);
      user.businessId = business.id;
      db.businesses.unshift(business);
      createNotification(db, { role: "admin", title: "Yeni isletme kaydi", text: `${business.name} kayit oldu ve onay bekliyor.`, to: "/admin" });
      createNotification(db, { role: "customer", title: "Yeni isletme eklendi", text: `${business.name} yakinda yayinda.`, to: `/business/${business.slug}` });
    }
    return { status: 201, body: { user: publicUser(user), token: sign(user) } };
  });
  res.status(payload.status).json(payload.body);
});

app.post("/api/auth/login", async (req, res) => {
  const { role, email, password } = req.body;
  const db = await seedDb();
  const user = db.users.find((item) => item.email.toLowerCase() === String(email || "").toLowerCase() && (!role || item.role === role));
  if (!user || !(await bcrypt.compare(String(password || ""), user.passwordHash))) return res.status(401).json({ message: "E-posta, sifre veya hesap turu hatali" });
  res.json({ token: sign(user), user: publicUser(user) });
});

app.get("/api/auth/me", auth(), (req, res) => res.json({ user: publicUser(req.user) }));

app.post("/api/auth/package", auth(["business"]), async (req, res) => {
  const { packageType } = req.body;
  if (!["free", "premium"].includes(packageType)) return res.status(400).json({ message: "Paket secimi gerekli" });
  const payload = await withDb(async (db) => {
    const user = db.users.find((item) => item.id === req.user.id);
    user.packageType = packageType;
    const business = db.businesses.find((item) => item.ownerId === user.id || item.id === user.businessId);
    if (business) {
      business.packageType = packageType;
      business.package = packageType;
      business.sponsored = packageType === "premium";
      business.isSponsored = packageType === "premium";
      business.updatedAt = now();
      user.businessId = business.id;
    }
    createNotification(db, { role: "admin", title: "Paket secildi", text: `${user.name} ${packageType} paketini secti.`, to: "/admin" });
    return { user: publicUser(user), business };
  });
  res.json(payload);
});

app.get("/api/businesses", async (req, res) => {
  const db = await seedDb();
  const localRows = filterBusinesses(db.businesses, req.query, db.categories);
  if (localRows.length || !req.query.autofetch) {
    return res.json({ businesses: localRows, googleEnabled: Boolean(GOOGLE_KEY), source: "db", message: GOOGLE_KEY ? null : "GOOGLE_MAPS_API_KEY tanimli degil; canli veri cekilemedi." });
  }
  const sync = await syncOsmPlaces({ city: req.query.city || "Mersin", category: req.query.category, limit: req.query.limit || 25 });
  const freshDb = await seedDb();
  res.json({ businesses: filterBusinesses(freshDb.businesses, req.query, freshDb.categories), provider: "osm", cacheHit: sync.cacheHit, savedCount: sync.savedCount });
});

app.post("/api/businesses", auth(["admin", "business"]), async (req, res) => {
  if (!req.body.name && !req.body.businessName) return res.status(400).json({ message: "Isletme adi gerekli" });
  const business = await withDb(async (db) => {
    const row = buildUserBusiness(req.body, req.user.role === "business" ? req.user.id : req.body.ownerId, req.user.role === "admin", db.categories);
    db.businesses.unshift(row);
    const owner = db.users.find((user) => user.id === row.ownerId);
    if (owner) owner.businessId = row.id;
    createNotification(db, { role: "admin", title: "Yeni isletme eklendi", text: `${row.name} sisteme kaydedildi.`, to: "/admin" });
    createNotification(db, { role: "customer", title: "Yeni isletme eklendi", text: `${row.name} eklendi, denemek ister misin?`, to: `/business/${row.slug}` });
    return row;
  });
  res.status(201).json({ business });
});

app.get("/api/businesses/mine", auth(["business"]), async (req, res) => {
  const db = await seedDb();
  const business = db.businesses.find((item) => item.ownerId === req.user.id || item.id === req.user.businessId);
  res.json({ business: business || null });
});

app.get("/api/businesses/:id", async (req, res) => {
  const db = await seedDb();
  const business = db.businesses.find((item) => item.id === req.params.id || item.slug === req.params.id || item.placeId === req.params.id);
  if (!business) return res.status(404).json({ message: "Isletme bulunamadi" });
  res.json({ business });
});

app.put("/api/businesses/:id", auth(["admin", "business"]), async (req, res) => {
  const business = await withDb(async (db) => {
    const row = db.businesses.find((item) => item.id === req.params.id || item.slug === req.params.id);
    if (!row) return null;
    if (req.user.role === "business" && row.ownerId !== req.user.id) return "forbidden";
    const category = categoryBySlugOrId(req.body.categoryId || req.body.categorySlug || req.body.category, db.categories) || categoryBySlugOrId(row.categoryId, db.categories) || db.categories[0] || categoryCatalog[0];
    Object.assign(row, req.body, {
      categoryId: category.id,
      category: category.name,
      categorySlug: category.slug,
      whatsapp: String(req.body.whatsapp || req.body.phone || row.phone || "").replace(/\D/g, ""),
      isNew: true,
      updatedAt: now()
    });
    createNotification(db, { role: "admin", title: "Isletme bilgileri guncellendi", text: `${row.name} panelden bilgilerini kaydetti.`, to: "/admin" });
    createNotification(db, { role: "customer", title: "Isletme bilgileri guncellendi", text: `${row.name} bilgilerini guncelledi.`, to: `/business/${row.slug}` });
    return row;
  });
  if (business === "forbidden") return res.status(403).json({ message: "Bu isletmeyi duzenleme yetkiniz yok" });
  if (!business) return res.status(404).json({ message: "Isletme bulunamadi" });
  res.json({ business });
});

app.delete("/api/businesses/:id", auth(["admin"]), async (req, res) => {
  await withDb(async (db) => db.businesses = db.businesses.filter((item) => item.id !== req.params.id && item.slug !== req.params.id));
  res.json({ ok: true });
});

app.post("/api/businesses/:id/click", async (req, res) => {
  const clicks = await withDb(async (db) => {
    const business = db.businesses.find((item) => item.id === req.params.id || item.slug === req.params.id);
    if (!business) return null;
    const type = req.body.type || "website";
    business.clicks = business.clicks || {};
    business.clicks[type] = (business.clicks[type] || 0) + 1;
    return business.clicks;
  });
  if (!clicks) return res.status(404).json({ message: "Isletme bulunamadi" });
  res.json({ clicks });
});

app.post("/api/businesses/:id/claim", auth(["business"]), async (req, res) => {
  const business = await withDb(async (db) => {
    const row = db.businesses.find((item) => item.id === req.params.id);
    if (!row) return null;
    row.ownerId = req.user.id;
    createNotification(db, { role: "admin", title: "Yeni sahiplenme talebi", text: `${row.name} sahiplenildi.`, to: "/admin" });
    return row;
  });
  if (!business) return res.status(404).json({ message: "Isletme bulunamadi" });
  res.json({ business });
});

app.get("/api/categories", async (_req, res) => {
  const db = await seedDb();
  const categories = db.categories.map((category) => ({
    ...category,
    count: db.businesses.filter((business) => (
      business.categoryId === category.id ||
      business.categorySlug === category.slug ||
      slugify(business.category) === slugify(category.name)
    )).length
  }));
  res.json({ categories });
});

app.post("/api/categories", auth(["admin"]), async (req, res) => {
  const payload = await withDb(async (db) => {
    const name = String(req.body.name || "").trim();
    if (!name) return { status: 400, body: { message: "Kategori adi gerekli" } };
    const slug = slugify(req.body.slug || name);
    if (categoryBySlugOrId(slug, db.categories) || categoryBySlugOrId(name, db.categories)) {
      return { status: 409, body: { message: "Bu kategori zaten var" } };
    }
    const category = {
      id: slug,
      slug,
      name,
      icon: req.body.icon || "📍",
      count: 0,
      createdAt: now(),
      updatedAt: now()
    };
    db.categories.push(category);
    createNotification(db, { role: "admin", title: "Kategori eklendi", text: `${name} kategorisi sisteme eklendi.`, to: "/admin" });
    return { status: 201, body: { category } };
  });
  res.status(payload.status).json(payload.body);
});

app.put("/api/categories/:id", auth(["admin"]), async (req, res) => {
  const payload = await withDb(async (db) => {
    const category = categoryBySlugOrId(req.params.id, db.categories);
    if (!category) return { status: 404, body: { message: "Kategori bulunamadi" } };
    const nextName = String(req.body.name || category.name).trim();
    const nextSlug = slugify(req.body.slug || category.slug || nextName);
    const duplicate = db.categories.find((item) => item !== category && (item.id === nextSlug || item.slug === nextSlug || slugify(item.name) === slugify(nextName)));
    if (duplicate) return { status: 409, body: { message: "Bu kategori zaten var" } };
    const previous = { id: category.id, slug: category.slug, name: category.name };
    Object.assign(category, {
      id: nextSlug,
      slug: nextSlug,
      name: nextName,
      icon: req.body.icon || category.icon || "📍",
      updatedAt: now()
    });
    db.businesses.forEach((business) => {
      const matchesPrevious = business.categoryId === previous.id || business.categorySlug === previous.slug || slugify(business.category) === slugify(previous.name);
      if (matchesPrevious) {
        business.categoryId = category.id;
        business.categorySlug = category.slug;
        business.category = category.name;
        business.updatedAt = now();
      }
    });
    return { status: 200, body: { category } };
  });
  res.status(payload.status).json(payload.body);
});

app.delete("/api/categories/:id", auth(["admin"]), async (req, res) => {
  const payload = await withDb(async (db) => {
    const category = categoryBySlugOrId(req.params.id, db.categories);
    if (!category) return { status: 404, body: { message: "Kategori bulunamadi" } };
    const used = db.businesses.some((business) => business.categoryId === category.id || business.categorySlug === category.slug || slugify(business.category) === slugify(category.name));
    if (used) return { status: 409, body: { message: "Bu kategoriye bagli isletmeler var; veri kaybi olmamasi icin silinmedi." } };
    db.categories = db.categories.filter((item) => item !== category);
    return { status: 200, body: { ok: true } };
  });
  res.status(payload.status).json(payload.body);
});

app.get("/api/cities", async (_req, res) => {
  const db = await seedDb();
  const cities = db.cities.map((city) => ({ ...city, businessCount: db.businesses.filter((business) => business.cityId === city.id || business.city === city.name).length }));
  res.json({ cities });
});

app.get("/api/notifications", auth(), (req, res) => {
  const notifications = req.db.notifications
    .filter((item) => !item.role || item.role === req.user.role || item.userId === req.user.id)
    .map((item) => ({ ...item, read: item.readBy?.includes(req.user.id) }));
  res.json({ notifications });
});

app.post("/api/notifications", auth(["admin"]), async (req, res) => {
  const notification = await withDb(async (db) => createNotification(db, req.body));
  res.status(201).json({ notification });
});

app.patch("/api/notifications/read", auth(), async (req, res) => {
  await withDb(async (db) => db.notifications.forEach((item) => {
    item.readBy = item.readBy || [];
    if (!item.readBy.includes(req.user.id)) item.readBy.push(req.user.id);
  }));
  res.json({ ok: true });
});

app.get("/api/admin/stats", auth(["admin"]), (req, res) => {
  res.json({
    stats: {
      businesses: req.db.businesses.length,
      users: req.db.users.length,
      categories: req.db.categories.length,
      campaigns: req.db.campaigns.length,
      pending: req.db.businesses.filter((item) => !item.verified && !item.isVerified).length,
      premium: req.db.businesses.filter((item) => item.packageType === "premium" || item.package === "premium").length,
      google: req.db.businesses.filter((item) => item.source === "google").length
    }
  });
});

app.get("/api/admin/users", auth(["admin"]), (req, res) => res.json({ users: req.db.users.map(publicUser) }));

app.get("/api/packages", async (_req, res) => res.json({ packages: (await seedDb()).packages }));
app.get("/api/campaigns", async (_req, res) => res.json({ campaigns: (await seedDb()).campaigns }));
app.get("/api/reviews", async (_req, res) => res.json({ reviews: (await seedDb()).reviews }));
app.get("/api/reservations", auth(["business", "admin"]), (_req, res) => res.json({ reservations: [] }));
app.get("/api/favorites", auth(["customer"]), (req, res) => res.json({ favorites: req.db.favorites.filter((item) => item.userId === req.user.id) }));
app.post("/api/favorites/:businessId", auth(["customer"]), async (req, res) => {
  await withDb(async (db) => {
    if (!db.favorites.some((item) => item.userId === req.user.id && item.businessId === req.params.businessId)) db.favorites.push({ userId: req.user.id, businessId: req.params.businessId, createdAt: now() });
  });
  res.json({ ok: true });
});
app.delete("/api/favorites/:businessId", auth(["customer"]), async (req, res) => {
  await withDb(async (db) => db.favorites = db.favorites.filter((item) => item.userId !== req.user.id || item.businessId !== req.params.businessId));
  res.json({ ok: true });
});

app.get("/api/osm/overpass/search", async (req, res) => {
  const result = req.query.direct === "true"
    ? await nominatimCachedSearch({ city: req.query.city || "Mersin", category: req.query.category, limit: req.query.limit || 25, force: req.query.force === "true" })
    : await overpassSearch({ city: req.query.city || "Mersin", category: req.query.category, limit: req.query.limit || 25, force: req.query.force === "true" });
  res.json({ provider: "osm", ...result });
});

app.post("/api/osm/overpass/sync", auth(["admin"]), async (req, res) => {
  const result = await syncOsmPlaces({ city: req.body.city || "Mersin", category: req.body.category, limit: req.body.limit || 25, force: Boolean(req.body.force), direct: Boolean(req.body.direct) });
  res.json({ provider: "osm", ...result });
});

app.post("/api/osm/overpass/sync-city", auth(["admin"]), async (req, res) => {
  const city = req.body.city || "Mersin";
  const categories = req.body.categories?.length ? req.body.categories : categoryCatalog.map((item) => item.id);
  const results = [];
  for (const category of categories) {
    try {
      results.push({ category, ...(await syncOsmPlaces({ city, category, limit: req.body.limit || 25, force: Boolean(req.body.force), direct: Boolean(req.body.direct) })) });
    } catch (error) {
      results.push({ category, error: error.message, businesses: [], savedCount: 0, createdCount: 0, cacheHit: false });
    }
  }
  res.json({
    provider: "osm",
    categories: results.length,
    savedCount: results.reduce((sum, item) => sum + (item.savedCount || 0), 0),
    createdCount: results.reduce((sum, item) => sum + (item.createdCount || 0), 0),
    cacheHits: results.filter((item) => item.cacheHit).length,
    results
  });
});

app.post("/api/import/csv", auth(["admin"]), async (req, res) => {
  const csvText = typeof req.body === "string" ? req.body : req.body?.csv;
  if (!csvText) return res.status(400).json({ message: "CSV metni gerekli" });
  const rows = parseCsv(csvText);
  const imported = await withDb(async (db) => {
    const saved = [];
    for (const row of rows) {
      const name = row.name || row.isletme || row["işletme"] || row["İşletme"] || row.title;
      if (!name) continue;
      const category = categoryBySlugOrId(row.categoryId || row.category || row.kategori) || categoryCatalog[0];
      const business = {
        id: `csv-${Date.now()}-${saved.length}`,
        name,
        slug: slugify(`${name}-${saved.length}`),
        categoryId: category.id,
        category: category.name,
        categorySlug: category.slug,
        cityId: slugify(row.city || row.sehir || "Mersin"),
        city: row.city || row.sehir || "Mersin",
        address: row.address || row.adres || "",
        district: row.district || row.ilce || row["ilçe"] || "",
        phone: row.phone || row.telefon || "",
        whatsapp: String(row.whatsapp || row.phone || row.telefon || "").replace(/\D/g, ""),
        website: row.website || row.web || "",
        instagram: row.instagram || "",
        rating: Number(row.rating || row.puan || 0),
        reviewCount: Number(row.reviewCount || row.yorum || 0),
        open: true,
        isOpen: true,
        verified: true,
        isVerified: true,
        sponsored: false,
        isSponsored: false,
        featured: false,
        isNew: true,
        packageType: "manual",
        package: "manual",
        source: "csv",
        description: row.description || row.aciklama || "",
        services: row.services ? String(row.services).split("|") : [],
        menuItems: [],
        photos: row.photos ? String(row.photos).split("|") : [],
        image: row.image || "",
        cover: row.cover || "",
        logo: row.logo || "",
        gallery: row.photos ? String(row.photos).split("|") : [],
        openingHours: row.openingHours ? String(row.openingHours).split("|") : [],
        hours: [],
        latitude: row.latitude ? Number(row.latitude) : null,
        longitude: row.longitude ? Number(row.longitude) : null,
        reviews: [],
        clicks: { phone: 0, whatsapp: 0, directions: 0, website: 0 },
        createdAt: now(),
        updatedAt: now()
      };
      const merged = mergeBusiness(db, business);
      saved.push(merged.business);
    }
    createNotification(db, { role: "admin", title: "CSV import tamamlandi", text: `${saved.length} isletme ice aktarildi.`, to: "/admin" });
    return saved;
  });
  res.json({ importedCount: imported.length, businesses: imported });
});

app.get("/api/google/places/search", async (req, res) => {
  const result = await googleTextSearch(req.query);
  res.json({ businesses: result.places, googleEnabled: result.googleEnabled, cacheHit: result.cacheHit, message: result.message });
});

app.post("/api/google/places/sync", auth(["admin"]), async (req, res) => {
  const result = await syncGooglePlaces({ ...req.body, force: Boolean(req.body.force) });
  res.json(result);
});

app.post("/api/google/places/sync-city", auth(["admin"]), async (req, res) => {
  const city = req.body.city || "Mersin";
  const categories = req.body.categories?.length ? req.body.categories : categoryCatalog.map((item) => item.id);
  const results = [];
  for (const category of categories) {
    results.push(await syncGooglePlaces({ city, category, force: Boolean(req.body.force) }));
  }
  res.json({
    googleEnabled: Boolean(GOOGLE_KEY),
    categories: results.length,
    savedCount: results.reduce((sum, item) => sum + item.savedCount, 0),
    createdCount: results.reduce((sum, item) => sum + item.createdCount, 0),
    cacheHits: results.filter((item) => item.cacheHit).length,
    message: GOOGLE_KEY ? null : "GOOGLE_MAPS_API_KEY tanimli degil; sahte veri uretilmedi.",
    results
  });
});

app.get("/api/google/places/details/:placeId", async (req, res) => {
  if (!GOOGLE_KEY) return res.status(503).json({ message: "GOOGLE_MAPS_API_KEY tanimli degil" });
  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(req.params.placeId)}`, {
    headers: {
      "X-Goog-Api-Key": GOOGLE_KEY,
      "X-Goog-FieldMask": "id,name,displayName,formattedAddress,location,rating,userRatingCount,currentOpeningHours,regularOpeningHours,nationalPhoneNumber,internationalPhoneNumber,websiteUri,googleMapsUri,types,photos,editorialSummary"
    }
  });
  res.status(response.status).json(await response.json());
});

export default app;
export { seedDb };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await seedDb();
  app.listen(PORT, () => {
    console.log(`API ready on port ${PORT}`);
  });
}
