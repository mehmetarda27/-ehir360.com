# Şehir360

Mevcut tasarim korunarak veri katmani Google Places API New uzerinden canli isletme verisi cekecek sekilde duzenlendi. Sahte isletme, random telefon, random adres veya demo isletme uretilmez.

## Calistirma

```bash
npm install
copy .env.example .env
npm run dev
```

- API: `http://127.0.0.1:4000`
- Client: Vite terminalinde yazan adres, genelde `http://127.0.0.1:5173`

## Google Places API New

`.env` dosyasina Google Places API New anahtari ekleyin:

```bash
GOOGLE_MAPS_API_KEY=google_api_keyiniz
```

Anahtar yoksa sistem sahte veri uretmez. API yanitlarinda `googleEnabled=false` ve acik hata mesaji doner.

## Admin

Ilk calistirmada sadece admin kullanicisi bootstrap edilir:

- Admin: `admin@sehirpaneli.com` / `Admin123`

Bu degerleri `.env` ile degistirebilirsiniz:

```bash
ADMIN_EMAIL=admin@site.com
ADMIN_PASSWORD=GucluSifre123
```

## Google Veri Guncelleme

Tek kategori senkronizasyonu:

```bash
POST /api/google/places/sync
Authorization: Bearer <admin_token>
{
  "city": "Mersin",
  "category": "restaurants",
  "force": false
}
```

Tum kategori senkronizasyonu:

```bash
POST /api/google/places/sync-city
Authorization: Bearer <admin_token>
{
  "city": "Mersin",
  "force": false
}
```

Sonuclar `data/db.json` icine kaydedilir. Tekrar eden aramalarda `data/google-cache.json` cache kullanilir.

## Endpointler

- `GET /api/businesses?city=Mersin&category=restaurants&autofetch=1`
- `GET /api/google/places/search?city=Mersin&category=restaurants`
- `POST /api/google/places/sync`
- `POST /api/google/places/sync-city`
- `GET /api/google/places/details/:placeId`
- `GET /api/categories`
- `GET /api/cities`
- `GET /api/admin/stats`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`

## Not

Google Places API New Text Search ve Place Details isteklerinde field mask kullanilir. API key sadece backend tarafinda okunur, frontend bundle icine yazilmaz.
