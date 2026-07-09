const img = (id, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=82`;

export const cities = [
  { id: "mersin", name: "Mersin", active: true, businessCount: 1248, image: img("photo-1500530855697-b586d89ba3ee") },
  { id: "istanbul", name: "İstanbul", active: false, businessCount: 0, image: img("photo-1524231757912-21f4fe3a7200") },
  { id: "ankara", name: "Ankara", active: false, businessCount: 0, image: img("photo-1558618666-fcd25c85cd64") },
  { id: "izmir", name: "İzmir", active: false, businessCount: 0, image: img("photo-1533105079780-92b9be482077") }
];

export const categories = [
  { id: "food", slug: "yeme-icme", name: "Yeme & İçme", icon: "🍽️", count: 342 },
  { id: "health", slug: "saglik", name: "Sağlık", icon: "🏥", count: 186 },
  { id: "hotel", slug: "konaklama", name: "Konaklama", icon: "🏨", count: 74 },
  { id: "beauty", slug: "guzellik", name: "Güzellik", icon: "✨", count: 128 },
  { id: "auto", slug: "otomobil", name: "Otomobil", icon: "🚗", count: 93 },
  { id: "education", slug: "egitim", name: "Eğitim", icon: "🎓", count: 61 },
  { id: "service", slug: "hizmet", name: "Hizmet", icon: "🧰", count: 214 },
  { id: "shopping", slug: "alisveris", name: "Alışveriş", icon: "🛍️", count: 156 }
];

const commonHours = [
  { day: "Pazartesi", time: "09:00 - 23:00" },
  { day: "Salı", time: "09:00 - 23:00" },
  { day: "Çarşamba", time: "09:00 - 23:00" },
  { day: "Perşembe", time: "09:00 - 23:00" },
  { day: "Cuma", time: "09:00 - 00:00" },
  { day: "Cumartesi", time: "10:00 - 00:00" },
  { day: "Pazar", time: "10:00 - 22:00" }
];

export const reviews = [
  { id: "r1", name: "Zeynep Demir", rating: 5, date: "2 gün önce", avatar: img("photo-1494790108377-be9c29b29330", 200), text: "Servis çok hızlıydı, mekan temiz ve profesyonel. Şehir Paneli üzerinden bulduğuma sevindim." },
  { id: "r2", name: "Murat Kaya", rating: 4.8, date: "1 hafta önce", avatar: img("photo-1500648767791-00dcc994a43e", 200), text: "Konum bilgisi ve yorumlar doğruydu. Rezervasyon öncesi karar vermek çok kolaylaştı." },
  { id: "r3", name: "Ayşe Yılmaz", rating: 4.9, date: "3 saat önce", avatar: img("photo-1534528741775-53994a69daeb", 200), text: "Kampanyalar bölümü sayesinde yeni bir kahve mekanı keşfettik. Listeleme çok güven veriyor." }
];

export const businesses = [
  {
    id: "b1",
    slug: "gaziantep-mutfagi-pozcu",
    name: "Gaziantep Mutfağı - Pozcu",
    city: "Mersin",
    district: "Yenişehir",
    category: "Restoran",
    categorySlug: "yeme-icme",
    rating: 4.9,
    reviewCount: 1240,
    open: true,
    verified: true,
    sponsored: false,
    featured: true,
    image: img("photo-1555396273-367ea4eb4db5"),
    cover: img("photo-1517248135467-4c7edcad34c4", 1400),
    logo: img("photo-1544145945-f90425340c7e", 300),
    address: "Gazi Mustafa Kemal Bulvarı No:42, Pozcu, Yenişehir, Mersin",
    phone: "+90 324 123 45 67",
    whatsapp: "903241234567",
    website: "https://gaziantepmutfagi.example.com",
    description: "Gaziantep'in köklü mutfak kültürünü Mersin'in kalbi Pozcu'ya taşıyan, taş fırın lahmacun, kebap çeşitleri ve taze baklava sunan premium aile restoranı.",
    services: ["Paket servis", "Vale hizmeti", "Çocuk oyun alanı", "Açık hava oturma", "Kredi kartı", "Grup rezervasyonu"],
    hours: commonHours,
    gallery: [img("photo-1544025162-d76694265947"), img("photo-1600891964092-4316c288032e"), img("photo-1551024506-0bccd828d307")],
    reviews: reviews.slice(0, 2)
  },
  {
    id: "b2",
    slug: "mersin-marina-cafe",
    name: "Mersin Marina Cafe",
    city: "Mersin",
    district: "Mezitli",
    category: "Cafe & Kahve",
    categorySlug: "yeme-icme",
    rating: 4.7,
    reviewCount: 860,
    open: true,
    verified: true,
    sponsored: true,
    featured: true,
    image: img("photo-1501339847302-ac426a4a7cbb"),
    cover: img("photo-1554118811-1e0d58224f24", 1400),
    logo: img("photo-1517248135467-4c7edcad34c4", 300),
    address: "Marina Cad. No:8, Mezitli, Mersin",
    phone: "+90 324 222 20 20",
    whatsapp: "903242222020",
    website: "https://marinacafe.example.com",
    description: "Deniz manzaralı terası, nitelikli kahveleri ve hafif Akdeniz menüsüyle Marina hattında gün boyu çalışan modern bir buluşma noktası.",
    services: ["Kahvaltı", "Nitelikli kahve", "Evcil hayvan dostu", "Wi-Fi", "Teras", "Online rezervasyon"],
    hours: commonHours,
    gallery: [img("photo-1559925393-8be0ec4767c8"), img("photo-1521017432531-fbd92d768814"), img("photo-1495474472287-4d71bcdd2085")],
    reviews: reviews
  },
  {
    id: "b3",
    slug: "akdeniz-dis-klinigi",
    name: "Akdeniz Ağız ve Diş Sağlığı",
    city: "Mersin",
    district: "Yenişehir",
    category: "Sağlık",
    categorySlug: "saglik",
    rating: 4.6,
    reviewCount: 312,
    open: true,
    verified: true,
    sponsored: false,
    featured: true,
    image: img("photo-1629909613654-28e377c37b09"),
    cover: img("photo-1629909615184-74f495363b67", 1400),
    logo: img("photo-1588776814546-1ffcf47267a5", 300),
    address: "İstemihan Talay Cad. No:17, Yenişehir, Mersin",
    phone: "+90 324 333 45 45",
    whatsapp: "903243334545",
    website: "https://akdenizdis.example.com",
    description: "Dijital röntgen, implantoloji ve estetik diş hekimliği alanlarında çalışan, randevu süreçleri online takip edilebilen modern klinik.",
    services: ["İmplant", "Ortodonti", "Diş beyazlatma", "Çocuk diş hekimliği"],
    hours: commonHours,
    gallery: [img("photo-1606811971618-4486d14f3f99"), img("photo-1609840114035-3c981b782dfe"), img("photo-1588776813677-77aaf5595b83")],
    reviews: reviews.slice(1)
  },
  {
    id: "b4",
    slug: "aura-wellness-spa",
    name: "Aura Wellness Spa",
    city: "Mersin",
    district: "Mezitli",
    category: "Güzellik",
    categorySlug: "guzellik",
    rating: 4.5,
    reviewCount: 188,
    open: false,
    verified: false,
    sponsored: true,
    featured: false,
    image: img("photo-1540555700478-4be289fbecef"),
    cover: img("photo-1519823551278-64ac92734fb1", 1400),
    logo: img("photo-1522335789203-aabd1fc54bc9", 300),
    address: "Viranşehir Sahil Yolu No:19, Mezitli, Mersin",
    phone: "+90 324 444 19 19",
    whatsapp: "903244441919",
    website: "https://auraspa.example.com",
    description: "Masaj, cilt bakımı ve wellness paketleriyle çalışan, sahil hattında sakin ve premium bir bakım merkezi.",
    services: ["Cilt bakımı", "Masaj", "Spa paketi", "Sauna"],
    hours: commonHours,
    gallery: [img("photo-1515377905703-c4788e51af15"), img("photo-1600334129128-685c5582fd35"), img("photo-1522337660859-02fbefca4702")],
    reviews
  },
  {
    id: "b5",
    slug: "titanium-fitness-club",
    name: "Titanium Fitness Club",
    city: "Mersin",
    district: "Yenişehir",
    category: "Spor Salonu",
    categorySlug: "hizmet",
    rating: 4.7,
    reviewCount: 420,
    open: true,
    verified: true,
    sponsored: false,
    featured: false,
    image: img("photo-1534438327276-14e5300c3a48"),
    cover: img("photo-1540497077202-7c8a3999166f", 1400),
    logo: img("photo-1571019613914-85f342c6a11e", 300),
    address: "Forum AVM Arkası No:5, Yenişehir, Mersin",
    phone: "+90 324 555 35 35",
    whatsapp: "903245553535",
    website: "https://titaniumfit.example.com",
    description: "Kişisel antrenman, grup dersleri ve performans ölçümü sunan teknoloji odaklı fitness kulübü.",
    services: ["PT", "Pilates", "Cross training", "Vücut analizi"],
    hours: commonHours,
    gallery: [img("photo-1517836357463-d25dfeac3438"), img("photo-1571902943202-507ec2618e8f"), img("photo-1518611012118-696072aa579a")],
    reviews
  },
  {
    id: "b6",
    slug: "mersin-hukuk-danismanlik",
    name: "Mersin Hukuk & Danışmanlık",
    city: "Mersin",
    district: "Akdeniz",
    category: "Hizmet",
    categorySlug: "hizmet",
    rating: 5.0,
    reviewCount: 96,
    open: true,
    verified: true,
    sponsored: false,
    featured: false,
    image: img("photo-1497366754035-f200968a6e72"),
    cover: img("photo-1497366811353-6870744d04b2", 1400),
    logo: img("photo-1450101499163-c8848c66ca85", 300),
    address: "İsmet İnönü Bulvarı No:32, Akdeniz, Mersin",
    phone: "+90 324 666 10 10",
    whatsapp: "903246661010",
    website: "https://mersinhukuk.example.com",
    description: "Ticaret hukuku, marka danışmanlığı ve sözleşme yönetimi alanlarında çalışan kurumsal danışmanlık ofisi.",
    services: ["Sözleşme", "Şirket kuruluşu", "Marka tescil", "Arabuluculuk"],
    hours: commonHours,
    gallery: [img("photo-1497215728101-856f4ea42174"), img("photo-1516321318423-f06f85e504b3"), img("photo-1486406146926-c627a92ad1ab")],
    reviews: reviews.slice(0, 2)
  }
];

export const campaigns = [
  { id: "c1", businessId: "b1", title: "Hafta içi kebap menüsünde fırsat", discount: "%20", description: "Pazartesi ve Perşembe günleri seçili kebap menülerinde indirim." },
  { id: "c2", businessId: "b2", title: "Marina gün batımı kahve seti", discount: "2 al 1 öde", description: "18:00 - 20:00 arası filtre kahve ve tatlı seti." },
  { id: "c3", businessId: "b4", title: "Spa başlangıç paketi", discount: "%30", description: "İlk randevuya özel cilt bakımı ve aromaterapi paketi." },
  { id: "c4", businessId: "b5", title: "Yıllık üyelik kampanyası", discount: "2 ay hediye", description: "Premium üyelikte vücut analizi ve grup dersleri dahil." }
];

export const events = [
  { id: "e1", title: "Mersin Marina Caz Akşamı", type: "Konser", date: "18 Temmuz 2026", description: "Marina sahnesinde açık hava caz performansı." },
  { id: "e2", title: "Yerel Lezzetler Festivali", type: "Festival", date: "25 Temmuz 2026", description: "Mersin mutfağı, tantuni stantları ve üretici pazarı." },
  { id: "e3", title: "KOBİ Dijitalleşme Semineri", type: "Seminer", date: "2 Ağustos 2026", description: "Yerel işletmeler için dijital görünürlük ve müşteri yönetimi." }
];

export const pharmacies = [
  { id: "p1", name: "Pozcu Nöbetçi Eczanesi", status: "Açık", district: "Yenişehir", address: "Gmk Bulvarı No:88" },
  { id: "p2", name: "Mezitli Sahil Eczanesi", status: "Açık", district: "Mezitli", address: "Sahil Yolu No:12" },
  { id: "p3", name: "Toroslar Yaşam Eczanesi", status: "Açık", district: "Toroslar", address: "Kuvayi Milliye Cad. No:22" }
];

export const jobs = [
  { id: "j1", title: "Barista", company: "Mersin Marina Cafe", salary: "₺32.000 - ₺38.000", description: "Tam zamanlı, deneyimli barista aranıyor." },
  { id: "j2", title: "Ön Muhasebe Uzmanı", company: "Mersin Hukuk & Danışmanlık", salary: "₺40.000+", description: "Cari hesap ve fatura süreçlerinde deneyimli takım arkadaşı." },
  { id: "j3", title: "Diş Hekimi Asistanı", company: "Akdeniz Diş Kliniği", salary: "Görüşülür", description: "Hasta karşılama ve klinik destek süreçlerinde görev alacak." }
];
