import './Header.scss'

function Header({ user, onLogout, onToggleTheme, theme }) {
  return (
    <header className="topbar">
      <div className="brand">Odyssey Event Approval</div>
      <div className="header-actions">
        <button className="compact theme-toggle" onClick={onToggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? '☀️ Light mode' : '🌙 Night mode'}
        </button>
        {user && (
          <div className="user-bar">
            <span>
              {user.displayName} ({user.role})
            </span>
            <button onClick={onLogout}>Logout</button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
