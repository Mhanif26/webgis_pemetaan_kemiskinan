import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { placesOfWorship, recipients, distributions, activityLogs } from "@db/schema";
import { seedLocalUserIfMissing } from "./auth";

export const seedRouter = createRouter({
  run: publicQuery.mutation(async () => {
    const db = getDb();
    await seedLocalUserIfMissing();

    // Check if data already exists
    const existing = await db.select({ count: placesOfWorship.id }).from(placesOfWorship).limit(1);
    if (existing.length > 0) {
      return { message: "Local admin ensured; data already seeded" };
    }

    // Seed Places of Worship
    await db.insert(placesOfWorship).values([
      { name: "Masjid Al-Ikhlas", type: "mosque", address: "Jl. Pahlawan No. 12, Kelurahan Cempaka", latitude: "-6.1754", longitude: "106.8650", radius: 1500, capacity: 200, contactName: "Bapak Ahmad Surya", contactPhone: "081234567890", isActive: "yes" },
      { name: "Gereja Kristen Jawa", type: "church", address: "Jl. Diponegoro No. 45, Kelurahan Menteng", latitude: "-6.2008", longitude: "106.8320", radius: 1200, capacity: 150, contactName: "Ibu Maria Tan", contactPhone: "081987654321", isActive: "yes" },
      { name: "Pura Agung Jagatnatha", type: "temple", address: "Jl. Nusantara No. 78, Denpasar Timur", latitude: "-8.6580", longitude: "115.2200", radius: 2000, capacity: 100, contactName: "I Made Wirata", contactPhone: "082233445566", isActive: "yes" },
      { name: "Vihara Dharma Bhakti", type: "vihara", address: "Jl. Gajah Mada No. 88, Glodok, Jakarta Barat", latitude: "-6.1477", longitude: "106.8133", radius: 1000, capacity: 80, contactName: "Bapak Lim Swie Hian", contactPhone: "083344556677", isActive: "yes" },
      { name: "Masjid Nurul Huda", type: "mosque", address: "Jl. Sudirman No. 25, Kuningan, Jakarta Selatan", latitude: "-6.2088", longitude: "106.8456", radius: 1800, capacity: 300, contactName: "Bapak Hadi Pranoto", contactPhone: "084455667788", isActive: "yes" },
      { name: "Gereja Katolik Santo Antonius", type: "church", address: "Jl. Kartini No. 15, Yogyakarta Kota", latitude: "-7.8014", longitude: "110.3648", radius: 1300, capacity: 120, contactName: "Romo Yulianto", contactPhone: "085566778899", isActive: "yes" },
    ]);

    // Seed Recipients
    await db.insert(recipients).values([
      { nik: "3175012345678901", name: "Budi Santoso", birthDate: "1975-05-15", gender: "male", address: "Jl. Melati No. 3, Cempaka Putih", phone: "081111111111", latitude: "-6.1760", longitude: "106.8645", familyMembers: 4, incomePerMonth: 800000, status: "active", placeOfWorshipId: 1, notes: "Pekerja serabutan" },
      { nik: "3175012345678902", name: "Siti Aminah", birthDate: "1980-12-20", gender: "female", address: "Jl. Anggrek No. 7, Cempaka Putih", phone: "081222222222", latitude: "-6.1748", longitude: "106.8660", familyMembers: 3, incomePerMonth: 600000, status: "active", placeOfWorshipId: 1, notes: "Janda dengan 2 anak" },
      { nik: "3175012345678903", name: "Ahmad Fauzi", birthDate: "1968-03-10", gender: "male", address: "Jl. Mawar No. 12, Menteng", phone: "081333333333", latitude: "-6.2012", longitude: "106.8315", familyMembers: 5, incomePerMonth: 1000000, status: "active", placeOfWorshipId: 2, notes: "Penjual nasi keliling" },
      { nik: "3175012345678904", name: "Dewi Kusuma", birthDate: "1990-08-25", gender: "female", address: "Jl. Cemara No. 9, Menteng", phone: "081444444444", latitude: "-6.2002", longitude: "106.8330", familyMembers: 2, incomePerMonth: 700000, status: "pending", placeOfWorshipId: 2, notes: "Pekerja cleaning service" },
      { nik: "5175012345678905", name: "I Wayan Suardana", birthDate: "1972-11-05", gender: "male", address: "Jl. Raya Sanur No. 21, Denpasar", phone: "082555555555", latitude: "-8.6575", longitude: "115.2195", familyMembers: 6, incomePerMonth: 1200000, status: "active", placeOfWorshipId: 3, notes: "Petani subsisten" },
      { nik: "3175012345678906", name: "Rini Sulastri", birthDate: "1985-04-18", gender: "female", address: "Jl. Pekojan No. 14, Glodok", phone: "083666666666", latitude: "-6.1472", longitude: "106.8140", familyMembers: 3, incomePerMonth: 500000, status: "pending", placeOfWorshipId: 4, notes: "Penjual kue tradisional" },
      { nik: "3175012345678907", name: "Hendra Wijaya", birthDate: "1978-07-30", gender: "male", address: "Jl. Karet No. 8, Kuningan", phone: "084777777777", latitude: "-6.2095", longitude: "106.8450", familyMembers: 4, incomePerMonth: 900000, status: "active", placeOfWorshipId: 5, notes: "Sopir angkot" },
      { nik: "3475012345678908", name: "Yuliani", birthDate: "1982-09-12", gender: "female", address: "Jl. Malioboro No. 33, Yogyakarta", phone: "085888888888", latitude: "-7.8020", longitude: "110.3655", familyMembers: 2, incomePerMonth: 650000, status: "active", placeOfWorshipId: 6, notes: "Penjual oleh-oleh" },
      { nik: "3175012345678909", name: "Agus Priyanto", birthDate: "1965-01-22", gender: "male", address: "Jl. Kenanga No. 5, Cempaka Putih", phone: "086999999999", latitude: "-6.1750", longitude: "106.8655", familyMembers: 3, incomePerMonth: 750000, status: "rejected", placeOfWorshipId: 1, rejectionReason: "Memiliki usaha warung yang cukup stabil", notes: "Pemilik warung kecil" },
      { nik: "3175012345678910", name: "Maya Indah", birthDate: "1992-06-08", gender: "female", address: "Jl. Flamboyan No. 11, Kuningan", phone: "087000000001", latitude: "-6.2078", longitude: "106.8465", familyMembers: 1, incomePerMonth: 850000, status: "pending", placeOfWorshipId: 5, notes: "Mahasiswa tinggal sendiri" },
    ]);

    // Seed Distributions
    await db.insert(distributions).values([
      { placeOfWorshipId: 1, recipientId: 1, aidType: "Sembako", amount: "350000", quantity: 2, unit: "paket", notes: "Paket beras, minyak, gula, teh" },
      { placeOfWorshipId: 1, recipientId: 2, aidType: "Sembako", amount: "350000", quantity: 1, unit: "paket", notes: "Paket beras, minyak, gula" },
      { placeOfWorshipId: 2, recipientId: 3, aidType: "Bantuan Tunai", amount: "500000", quantity: 1, unit: "kali", notes: "BLT" },
      { placeOfWorshipId: 3, recipientId: 5, aidType: "Sembako", amount: "400000", quantity: 2, unit: "paket", notes: "Paket besar keluarga 6 orang" },
      { placeOfWorshipId: 4, recipientId: 6, aidType: "Modal Usaha", amount: "1000000", quantity: 1, unit: "kali", notes: "Modal usaha kue" },
      { placeOfWorshipId: 5, recipientId: 7, aidType: "Sembako", amount: "350000", quantity: 1, unit: "paket" },
      { placeOfWorshipId: 6, recipientId: 8, aidType: "Bantuan Pendidikan", amount: "750000", quantity: 1, unit: "kali", notes: "Biaya sekolah" },
      { placeOfWorshipId: 1, recipientId: 1, aidType: "Bantuan Tunai", amount: "600000", quantity: 1, unit: "kali", notes: "Bulanan kedua" },
    ]);

    // Seed Activity Logs
    await db.insert(activityLogs).values([
      { action: "CREATE", entityType: "recipient", entityId: 1, details: "Mendaftarkan Budi Santoso" },
      { action: "CREATE", entityType: "recipient", entityId: 2, details: "Mendaftarkan Siti Aminah" },
      { action: "VERIFY", entityType: "recipient", entityId: 1, details: "Memverifikasi Budi Santoso - Diterima" },
      { action: "VERIFY", entityType: "recipient", entityId: 2, details: "Memverifikasi Siti Aminah - Diterima" },
      { action: "CREATE", entityType: "distribution", entityId: 1, details: "Distribusi sembako ke Budi Santoso" },
      { action: "CREATE", entityType: "recipient", entityId: 4, details: "Mendaftarkan Dewi Kusuma" },
      { action: "CREATE", entityType: "recipient", entityId: 9, details: "Mendaftarkan Agus Priyanto" },
      { action: "VERIFY", entityType: "recipient", entityId: 9, details: "Memverifikasi Agus Priyanto - Ditolak" },
      { action: "CREATE", entityType: "place_of_worship", entityId: 5, details: "Menambahkan Masjid Nurul Huda" },
      { action: "CREATE", entityType: "recipient", entityId: 10, details: "Mendaftarkan Maya Indah" },
    ]);

    return { message: "Database seeded successfully" };
  }),
});
