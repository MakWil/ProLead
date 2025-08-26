import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) || ''

function App() {
  const [houses, setHouses] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua')

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`${API_BASE}/api/houses`)
        const data = await res.json()
        setHouses(data)
      } catch (e) {
        setError('Gagal memuat data. Pastikan backend berjalan di port 3000.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    const byTerm = !term ? houses : houses.filter(h => `${h.title} ${h.location} ${h.beds} ${h.baths} ${h.area}`.toLowerCase().includes(term))
    if (activeCategory === 'Semua') return byTerm
    return byTerm.filter(h => (h.category || 'Lainnya') === activeCategory)
  }, [houses, query, activeCategory])

  const categories = useMemo(() => {
    const set = new Set(houses.map(h => h.category || 'Lainnya'))
    return ['Semua', ...Array.from(set)]
  }, [houses])

  const toCurrency = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  useEffect(() => {
    const onScroll = () => {
      const nav = document.querySelector('.navbar')
      if (!nav) return
      if (window.scrollY > 4) nav.classList.add('scrolled')
      else nav.classList.remove('scrolled')
    }
    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="container page">
      <header style={{position:'sticky',top:0,zIndex:10,backdropFilter:'blur(8px)'}}>
        <nav className="navbar">
          <div className="nav-left">
            <div className="brand">ProLead Properti</div>
            <a className="nav-link" href="#">Beranda</a>
            <a className="nav-link" href="#">Tentang</a>
            <a className="nav-link" href="#">Kontak</a>
          </div>
          <div className="nav-right muted">React + Vite → Express API</div>
          <button className="nav-toggle" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Top</button>
        </nav>
      </header>
      <main>
        <div className="toolbar">
          <div className="left categories">
            {categories.map(cat => (
              <button
                key={cat}
                className={`chip ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >{cat}</button>
            ))}
          </div>
          <div className="right">
            <input
              type="search"
              placeholder="Cari lokasi / judul..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        {loading && <div className="muted">Memuat...</div>}
        {error && <div className="error">{error}</div>}
        {!loading && !error && (
          <section className="grid">
            {filtered.map(h => (
              <article key={h.id} className="card">
                <img src={`https://picsum.photos/seed/house${h.id}/640/400`} alt={h.title} loading="lazy" />
                <div className="card-body">
                  <h3>{h.title}</h3>
                  <p className="price">{toCurrency(h.price)}</p>
                  <p className="meta">{h.location} · {h.beds} KT · {h.baths} KM · {h.area} m²</p>
                  <span className="badge">{h.category || 'Lainnya'}</span>
                  <button className="btn" onClick={() => alert(`Detail: ${h.title}`)}>Lihat Detail</button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
      <footer>
        <div className="muted">© {new Date().getFullYear()} ProLead</div>
      </footer>
    </div>
  )
}

export default App
