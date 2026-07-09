# Sehir360

Mevcut tasarim korunarak frontend ve API tek Vercel deploy icinde calisacak hale getirildi. Sistem sahte isletme uretmez; mevcut `data/db.json` kayitlarini bootstrap kaynagi olarak kullanir.

## Lokal calistirma

```bash
npm install
copy .env.example .env
npm run dev
```

- Frontend API adresi varsayilan olarak `/api` relative path kullanir.
- Lokal gelistirmede `npm run api` mevcut `data/db.json` dosyasini okur/yazar.
- Vite terminalde verdigi lokal adresten acilir.

## Vercel production

Tek deploy hedefi Vercel'dir:

- Frontend: Vite build cikisi.
- API: `api/[...path].js` uzerinden Vercel serverless function.
- SPA refresh: `vercel.json` tum frontend route'larini `index.html`e dusurur.
- API route'lari: `/api/businesses`, `/api/categories`, `/api/auth/login` gibi ayni domain altinda calisir.

Vercel dosya sistemi kalici yazma alani olmadigi icin production veri kaynagi Vercel Blob'dur. Vercel projesine Blob store baglayip `BLOB_READ_WRITE_TOKEN` env degerini tanimlayin. Ilk production okumada mevcut `data/db.json` Blob'a kopyalanir; sonraki admin ekleme/guncelleme/silme islemleri Blob'daki `sehir-paneli/db.json` kaydina yazilir.

Gerekli env:

```bash
JWT_SECRET=guclu-production-secret
BLOB_READ_WRITE_TOKEN=vercel-blob-token
DB_BLOB_KEY=sehir-paneli/db.json
ADMIN_EMAIL=admin@sehirpaneli.com
ADMIN_PASSWORD=Admin123
GOOGLE_MAPS_API_KEY=
```

## Admin

Ilk calistirmada mevcut veritabaninda admin yoksa sadece admin kullanicisi bootstrap edilir:

- Admin: `admin@sehirpaneli.com` / `Admin123`

Bu degerleri `.env` veya Vercel environment variables ile degistirebilirsiniz.

## Endpointler

- `GET /api/health`
- `GET /api/businesses`
- `GET /api/businesses?category=restoranlar`
- `GET /api/businesses/:idOrSlug`
- `POST /api/businesses`
- `PUT /api/businesses/:idOrSlug`
- `DELETE /api/businesses/:idOrSlug`
- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/:idOrSlug`
- `DELETE /api/categories/:idOrSlug`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`

## Not

Google Places veya OSM senkronizasyonu anahtar/cache uygunsa gercek kaynaklardan veri ceker. Anahtar yoksa sistem sahte veri uretmez ve mevcut DB kayitlariyla calismaya devam eder.
