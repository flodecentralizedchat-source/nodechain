export default function BottomNav({ page, setPage }) {
  const tabs = [
    { id: 'home',    label: 'Home',    icon: '⊡' },
    { id: 'account', label: 'Account', icon: '◎' },
    { id: 'mining',  label: 'Mining',  icon: '⬡' },
    { id: 'orders',  label: 'Orders',  icon: '≡' },
  ]

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      padding: '10px 0 env(safe-area-inset-bottom, 16px)',
      zIndex: 100,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setPage(t.id)} style={{
          flex: 1, background: 'none',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 4, padding: '6px 0',
          color: page === t.id ? 'var(--accent)' : 'var(--text3)',
          transition: 'color 0.2s',
          fontSize: 11, fontWeight: 500,
          letterSpacing: '0.03em',
        }}>
          <span style={{
            fontSize: 20, lineHeight: 1,
            transform: page === t.id ? 'scale(1.15)' : 'scale(1)',
            transition: 'transform 0.2s',
            display: 'inline-block',
          }}>
            {t.icon}
          </span>
          {t.label}
        </button>
      ))}
    </nav>
  )
}
