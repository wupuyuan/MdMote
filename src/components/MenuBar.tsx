interface MenuBarProps {
  maximized: boolean
  onNewTab: () => void
  onOpen: () => void
  onSave: () => void
}

const isMac = window.api.platform === 'darwin'

const kbd = (key: string): string => (isMac ? `⌘${key}` : `Ctrl+${key}`)

export default function MenuBar({
  maximized,
  onNewTab,
  onOpen,
  onSave
}: MenuBarProps) {
  return (
    <header className="menu-bar">
      <div className="menu-title">MdMote</div>

      <nav className="menu-group">
        <button
          className="menu-btn"
          onClick={onOpen}
          title={kbd('O')}
        >
          Open
        </button>
        <button
          className="menu-btn"
          onClick={onNewTab}
          title={kbd('T')}
        >
          New
        </button>
        <button
          className="menu-btn"
          onClick={onSave}
          title={kbd('S')}
        >
          Save
        </button>
      </nav>

      <div className="menu-spacer" />

      <div className="menu-right">
        <button
          className="menu-icon"
          onClick={() => window.api.minimize()}
          title="最小化"
          aria-label="最小化"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
        <button
          className="menu-icon"
          onClick={() => window.api.toggleMaximize()}
          title={maximized ? '还原' : '最大化'}
          aria-label="最大化"
        >
          {maximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="1" y="3" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M3 3V1h8v8h-2" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
          )}
        </button>
        <button
          className="menu-icon menu-icon-close"
          onClick={() => window.api.close()}
          title="关闭"
          aria-label="关闭"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
      </div>
    </header>
  )
}