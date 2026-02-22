# Frontend BISINDO (Next.js)

Frontend real‑time kamera untuk prediksi huruf BISINDO A‑Z.

## Prasyarat
- Node.js 18+

## Menjalankan Frontend
```powershell
cd C:\Users\Dewi\Downloads\Proyek_BISINDO\Proyek_BISINDO\frontend
npm install
npm run dev
```
Buka `http://localhost:3000` dan izinkan akses kamera.

## Konfigurasi API
Default API:
`http://localhost:8000`

Untuk mengubah:
```
setx NEXT_PUBLIC_API_URL "http://localhost:8000"
```
Lalu restart `npm run dev`.

## Gambar Gesture A‑Z
Simpan gambar gesture di:
`frontend/public/gestures`

Format nama file:
`A.png` sampai `Z.png` (atau `.jpeg`).
