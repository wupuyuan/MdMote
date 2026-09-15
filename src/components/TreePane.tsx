import { useState } from 'react'
import type { TreeNode, Heading } from '../utils/markdown'

interface TreePaneProps {
  nodes: TreeNode[]
  onJump: (heading: Heading) => void
}

export default function TreePane({ nodes, onJump }: TreePaneProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  if (nodes.length === 0) {
    return (
      <aside className="tree-pane">
        <div className="tree-title">大纲</div>
        <div className="tree-empty">暂无标题</div>
      </aside>
    )
  }

  const toggle = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const renderNode = (node: TreeNode, key: string, depth: number) => {
    const hasChildren = node.children.length > 0
    const isCollapsed = collapsed.has(key)

    return (
      <div key={key}>
        <div
          className="tree-node"
          style={{ paddingLeft: depth * 10 + 6 }}
          onClick={() => onJump(node.heading)}
        >
          {hasChildren ? (
            <span
              className={`tree-caret${isCollapsed ? ' collapsed' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                toggle(key)
              }}
            >
              ▸
            </span>
          ) : (
            <span className="tree-caret tree-caret-empty" />
          )}
          <span className="tree-text" title={node.heading.text}>
            {node.heading.text}
          </span>
        </div>
        {hasChildren &&
          !isCollapsed &&
          node.children.map((c, i) => renderNode(c, `${key}-${i}`, depth + 1))}
      </div>
    )
  }

  return (
    <aside className="tree-pane">
      <div className="tree-title">大纲</div>
      <div className="tree-scroll">
        {nodes.map((n, i) => renderNode(n, `root-${i}`, 0))}
      </div>
    </aside>
  )
}