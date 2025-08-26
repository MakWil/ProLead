const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory sample data: many property listings
const houses = [
  { id: 1, title: 'Rumah Minimalis 1 Lantai', price: 450000000, location: 'Bekasi', beds: 2, baths: 1, area: 60, category: 'Rumah' },
  { id: 2, title: 'Cluster Modern', price: 780000000, location: 'BSD', beds: 3, baths: 2, area: 90, category: 'Cluster' },
  { id: 3, title: 'Rumah Hook Strategis', price: 1200000000, location: 'Kelapa Gading', beds: 4, baths: 3, area: 160, category: 'Rumah' },
  { id: 4, title: 'Townhouse Premium', price: 2400000000, location: 'Pondok Indah', beds: 4, baths: 4, area: 220, category: 'Townhouse' },
  { id: 5, title: 'Rumah Asri Dekat Taman', price: 680000000, location: 'Depok', beds: 3, baths: 2, area: 84, category: 'Rumah' },
  { id: 6, title: 'Perumahan Syariah', price: 520000000, location: 'Bogor', beds: 2, baths: 1, area: 72, category: 'Rumah' },
  { id: 7, title: 'Rumah Siap Huni', price: 950000000, location: 'Cibubur', beds: 3, baths: 2, area: 120, category: 'Rumah' },
  { id: 8, title: 'Villa Pegunungan', price: 1750000000, location: 'Puncak', beds: 5, baths: 4, area: 300, category: 'Villa' },
  { id: 9, title: 'Rumah Dekat Tol', price: 730000000, location: 'Serpong', beds: 3, baths: 2, area: 96, category: 'Rumah' },
  { id: 10, title: 'Rumah Industrial', price: 1350000000, location: 'Bintaro', beds: 4, baths: 3, area: 180, category: 'Rumah' },
  { id: 11, title: 'Rumah Kompak', price: 390000000, location: 'Tambun', beds: 2, baths: 1, area: 45, category: 'Rumah' },
  { id: 12, title: 'Rumah Sudut + Carport', price: 860000000, location: 'Harapan Indah', beds: 3, baths: 2, area: 110, category: 'Rumah' },
  { id: 13, title: 'Rumah 2 Lantai Baru', price: 990000000, location: 'Ciledug', beds: 3, baths: 3, area: 140, category: 'Rumah' },
  { id: 14, title: 'Rumah Elite', price: 3200000000, location: 'Menteng', beds: 5, baths: 5, area: 420, category: 'Elite' },
  { id: 15, title: 'Rumah Keluarga Nyaman', price: 820000000, location: 'Cikarang', beds: 3, baths: 2, area: 100, category: 'Rumah' },
  { id: 16, title: 'Rumah Dekat Stasiun', price: 610000000, location: 'Bogor Kota', beds: 2, baths: 2, area: 75, category: 'Rumah' }
];

// Enable CORS for all routes (so a separate frontend can call the API)
app.use(cors());

app.get('/api/houses', (req, res) => {
  res.json(houses);
});

// Health check/root message
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Backend API berjalan', endpoints: ['/api/houses'] });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});


