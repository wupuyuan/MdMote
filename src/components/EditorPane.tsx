import { useEffect, useRef } from 'react'
import type { editor as MonacoEditor } from 'monaco-editor'
import monaco from '../monaco'

interface EditorPaneProps {
  value: string
  onChange: (value: string) => void
  onMount: (editor: MonacoEditor.IStandaloneCodeEditor | null) => void
}

export default function EditorPane({ value, onChange, onMount }: EditorPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!containerRef.current) return

    const editor = monaco.editor.create(containerRef.current, {
      value: value,
      language: 'markdown',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14,
      lineHeight: 22,
      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace",
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      renderWhitespace: 'none',
      tabSize: 2,
      folding: true,
      foldingHighlight: true,
      lineNumbersMinChars: 3,
      overviewRulerBorder: false,
      scrollbar: {
        verticalScrollbarSize: 9,
        horizontalScrollbarSize: 9
      }
    })

    editorRef.current = editor
    onMount(editor)

    const sub = editor.onDidChangeModelContent(() => {
      onChangeRef.current(editor.getValue())
    })

    return () => {
      sub.dispose()
      editorRef.current = null
      onMount(null)
      editor.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const ed = editorRef.current
    if (ed && ed.getValue() !== value) {
      ed.setValue(value)
    }
  }, [value])

  return <section className="editor-pane"><div ref={containerRef} className="editor-container" /></section>
}