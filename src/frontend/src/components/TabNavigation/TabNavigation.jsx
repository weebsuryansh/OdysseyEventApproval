import './TabNavigation.scss'

function TabNavigation({ tabs, active, onChange }) {
  return (
    <>
      <div className="tab-sidebar">
        {tabs.map((tab) => (
          <button key={tab.value} className={`tab-btn ${active === tab.value ? 'active' : ''}`} onClick={() => onChange(tab.value)}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-bottom">
        {tabs.map((tab) => (
          <button key={tab.value} className={`tab-btn ${active === tab.value ? 'active' : ''}`} onClick={() => onChange(tab.value)}>
            {tab.label}
          </button>
        ))}
      </div>
    </>
  )
}

export default TabNavigation
