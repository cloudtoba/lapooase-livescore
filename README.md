# World Cup 2026 Live Board

Website statis untuk layar infocus: slideshow antara live score dan jadwal pertandingan berikutnya dalam WIB.

## Jalankan di localhost

```bash
python3 -m http.server 5173
```

Buka:

```text
http://localhost:5173
```

## Data

Urutan sumber data:

1. `data/matches.json` untuk data lokal. File ini sudah berisi fixture fase grup sampai akhir Juni WIB.
2. API-Football jika API key dimasukkan lewat tombol `Data`.
3. Fallback demo otomatis kalau data tidak tersedia.

Format waktu selalu ditampilkan dalam `Asia/Jakarta` / WIB.
Slide jadwal otomatis mengambil pertandingan berikutnya dari waktu saat ini, bukan hanya tanggal hari ini.

Untuk memakai data lokal dari sistem lain, update `data/matches.json` dengan format:

```json
{
  "matches": [
    {
      "home": "Argentina",
      "away": "Morocco",
      "homeScore": 1,
      "awayScore": 1,
      "status": "LIVE",
      "elapsed": 64,
      "kickoff": "2026-06-19T02:00:00Z",
      "venue": "Stadium name"
    }
  ]
}
```
