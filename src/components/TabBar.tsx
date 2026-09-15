import { useRef, useState } from 'react'
import type { Tab } from '../App'

interface TabBarProps {
  tabs: Tab[]
  activeId: string
  onSelect: (id: string) => void
  onClose: (id: string) => void
  onNewTab: () => void
}

interface TooltipState {
  left: number
  top: number
  text: string
}

export default function TabBar({ tabs, activeId, onSelect, onClose, onNewTab }: TabBarProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const tooltipTimer = useRef<number | undefined>(undefined)

  const handleDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.tab')) return
    onNewTab()
  }

  const handleHover = (
    e: React.MouseEvent<HTMLElement>,
    tab: Tab
  ) => {
    const full = tab.path ?? `未保存 · ${tab.name}`
    if (!tab.path) {
      setTooltip({
        left: e.clientX,
        top: e.clientY,
        text: full
      })
      return
    }
    const short = tab.name.length > 12
    window.clearTimeout(tooltipTimer.current)
    if (!short && tab.name.length > 0) {
      setTooltip(null)
      return
    }
    tooltipTimer.current = window.setTimeout(() => {
      setTooltip({
        left: e.clientX,
        top: e.clientY,
        text: full
      })
    }, 350)
  }

  const handleOut = () => {
    window.clearTimeout(tooltipTimer.current)
    setTooltip(null)
  }

  return (
    <div className="tab-bar" onMouseLeave={handleOut} onDoubleClick={handleDoubleClick}>
      <div className="tab-list">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab${tab.id === activeId ? ' active' : ''}${tab.dirty ? ' dirty' : ''}`}
            onClick={() => onSelect(tab.id)}
            onMouseMove={(e) => handleHover(e, tab)}
            onMouseLeave={() => window.clearTimeout(tooltipTimer.current)}
            title={tab.path ?? '未保存'}
          >
            <span className="tab-name">{tab.name}</span>
            <span
              className="tab-close"
              role="button"
              title="关闭标签"
              onClick={(e) => {
                e.stopPropagation()
                onClose(tab.id)
              }}
            >
              ×
            </span>
          </div>
        ))}
      </div>
      {tooltip && (
        <div
          className="tab-tooltip"
          style={{
            left: Math.min(tooltip.left + 12, window.innerWidth - 420),
            top: tooltip.top + 18
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}