# Virtual Lab IRK Mobile

Client mobile untuk Virtual Lab IRK berbasis Expo Router (Android/iOS/Web).

## Setup cepat

1) Install depedensi

```bash
npm install
```

2) Salin env

```bash
cp .env.example .env
```

- Isi `EXPO_PUBLIC_API_BASE_URL` dengan IP laptop + port backend saat development LAN. Contoh: `http://192.168.1.10:8000`.
- Hindari `localhost` bila memakai perangkat fisik; gunakan `10.0.2.2` di emulator Android.
- Jika backend di cloud (DigitalOcean), isi dengan URL cloud tersebut.

3) Jalankan di LAN agar tidak perlu tunnel

```bash
npx expo start --host lan
```

- Pastikan laptop & HP di Wi-Fi yang sama dan firewall mengizinkan port Expo/Metro.
- Untuk web, buka URL yang ditampilkan (default `http://localhost:8081`).

## Rute penting

- `/login` — halaman masuk (Clerk/mock sesuai env).
- `/(tabs)` — navigasi utama aplikasi.
- `/admin-dashboard` & `/assistant-dashboard` — kini dapat dibuka via tab Profile sesuai peran user.

## Reset proyek (opsional)

```bash
npm run reset-project
```

Memindahkan starter ke `app-example` dan membuat folder `app` kosong.
