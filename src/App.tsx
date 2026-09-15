import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { editor as MonacoEditor } from 'monaco-editor'
import MenuBar from './components/MenuBar'
import TabBar from './components/TabBar'
import TreePane from './components/TreePane'
import PreviewPane from './components/PreviewPane'
import EditorPane from './components/EditorPane'
import { buildTree, parseHeadings, type Heading } from './utils/markdown'
import type { PreviewHandle } from './components/PreviewPane'

export interface Tab {
  id: string
  path: string | null
  name: string
  content: string
  saved: boolean
  dirty: boolean
}

const SAMPLE = `# 欢迎使用 MdMote

这是一个跨平台的 Markdown 编辑工具，采用毛玻璃设计。

## 功能特点

- 多标签页编辑，可同时打开多个文件
- 左侧大纲树，快速定位章节
- 实时预览，所见即所得
- 毛玻璃界面，10% 透明菜单

## 快捷键

| 功能 | 快捷键 |
| ---- | ------ |
| 打开文件 | Ctrl/Cmd + O |
| 新建标签 | Ctrl/Cmd + T |
| 保存 | Ctrl/Cmd + S |

## 使用方法

可以直接在右侧编辑区输入内容，中间预览区会实时渲染。

> 试试点击左侧大纲，可以快速跳转到对应章节。
`

let untitledCount = 0

function makeTab(filePath: string | null, content = ''): Tab {
  const name = filePath
    ? filePath.split(/[\\/]/).pop() || '未命名'
    : `未命名${++untitledCount}.md`
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    path: filePath,
    name,
    content,
    saved: filePath !== null,
    dirty: false
  }
}

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>(() => [makeTab(null, SAMPLE)])
  const [activeId, setActiveId] = useState<string>(() => tabs[0].id)
  const [maximized, setMaximized] = useState(false)
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
  const previewRef = useRef<PreviewHandle>(null)

  useEffect(() => {
    const off = window.api.onMaximized(setMaximized)
    return off
  }, [])

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeId) ?? null,
    [tabs, activeId]
  )

  const saveTab = useCallback(
    async (tab: Tab) => {
      let targetPath = tab.path
      if (!targetPath) {
        targetPath = await window.api.saveFileDialog()
        if (!targetPath) return
      }
      await window.api.writeFile(targetPath, tab.content)
      setTabs((prev) =>
        prev.map((t) =>
          t.id === tab.id
            ? {
                ...t,
                path: targetPath!,
                name: targetPath!.split(/[\\/]/).pop() || t.name,
                saved: true,
                dirty: false
              }
            : t
        )
      )
    },
    []
  )

  const openFiles = useCallback(async () => {
    const paths = await window.api.openFileDialog()
    if (!paths) return
    for (const p of paths) {
      const existing = tabs.find((t) => t.path === p)
      if (existing) {
        setActiveId(existing.id)
        continue
      }
      const content = await window.api.readFile(p)
      const tab = makeTab(p, content)
      setTabs((prev) => [...prev, tab])
      setActiveId(tab.id)
    }
  }, [tabs])

  const newTab = useCallback(() => {
    const tab = makeTab(null)
    setTabs((prev) => [...prev, tab])
    setActiveId(tab.id)
  }, [])

  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === id)
        if (idx === -1) return prev
        const next = prev.filter((t) => t.id !== id)
        if (next.length === 0) {
          const tab = makeTab(null)
          setActiveId(tab.id)
          return [tab]
        }
        if (id === activeId) {
          const neighbor = next[Math.min(idx, next.length - 1)]
          setActiveId(neighbor.id)
        }
        return next
      })
    },
    [activeId]
  )

  const updateContent = useCallback((id: string, content: string) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, content, dirty: true, saved: false } : t
      )
    )
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      const key = e.key.toLowerCase()
      if (key === 't') {
        e.preventDefault()
        newTab()
      } else if (key === 'o') {
        e.preventDefault()
        void openFiles()
      } else if (key === 's') {
        e.preventDefault()
        if (e.shiftKey) {
          const t = activeTab
          if (t) void saveTab({ ...t, path: null })
        } else if (activeTab) {
          void saveTab(activeTab)
        }
      } else if (key === 'w') {
        e.preventDefault()
        if (activeTab) closeTab(activeTab.id)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [newTab, openFiles, saveTab, closeTab, activeTab])

  const treeNodes = useMemo(
    () => (activeTab ? buildTree(parseHeadings(activeTab.content)) : []),
    [activeTab]
  )

  const jumpToHeading = useCallback((heading: Heading) => {
    const ed = editorRef.current
    if (ed) {
      try {
        ed.revealLineInCenter(heading.line)
        ed.setPosition({ lineNumber: heading.line, column: 1 })
        ed.focus()
      } catch {
        /* ignore */
      }
    }
    const scrollPreview = () => {
      const ok = previewRef.current?.scrollToHeading(heading.text)
      if (!ok) {
        retry()
      }
    }
    let retries = 2
    const retry = () => {
      if (retries <= 0) return
      retries--
      window.setTimeout(scrollPreview, 400)
    }
    scrollPreview()
  }, [])

  return (
    <div className="app-shell">
      <MenuBar
        maximized={maximized}
        onNewTab={newTab}
        onOpen={openFiles}
        onSave={() => activeTab && void saveTab(activeTab)}
      />
      <TabBar
        tabs={tabs}
        activeId={activeId}
        onSelect={setActiveId}
        onClose={closeTab}
        onNewTab={newTab}
      />
      <main className="workspace">
        <TreePane nodes={treeNodes} onJump={jumpToHeading} />
        <PreviewPane ref={previewRef} content={activeTab?.content ?? ''} />
        <EditorPane
          value={activeTab?.content ?? ''}
          onChange={(v) => updateContent(activeTab?.id ?? '', v)}
          onMount={(ed) => {
            editorRef.current = ed
          }}
        />
      </main>
    </div>
  )
}