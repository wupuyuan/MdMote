import type { editor as MonacoEditor } from 'monaco-editor'
import * as monaco from 'monaco-editor'

const OL_ITEM_RE = /^(\s*)(\d+)([.)])\s+(.+)$/
const OL_EMPTY_RE = /^(\s*)(\d+[.)])(\s*)$/
const NEWLINE = '\n'
const FOCUS_WHEN = 'editorTextFocus && !historyNavigationVisible'

function insertText(editor: MonacoEditor.IStandaloneCodeEditor, text: string): void {
  editor.trigger('keyboard', 'type', { text })
}

function lineInfo(
  editor: MonacoEditor.IStandaloneCodeEditor
): { lineNumber: number; prefix: string; rest: string } | null {
  const model = editor.getModel()
  const selection = editor.getSelection()
  if (!model || !selection || !selection.isEmpty()) return null
  const column = selection.startColumn
  const line = model.getLineContent(selection.startLineNumber)
  return {
    lineNumber: selection.startLineNumber,
    prefix: line.slice(0, column - 1),
    rest: line.slice(column - 1)
  }
}

function isEmptyMarker(info: { prefix: string; rest: string } | null): boolean {
  return info !== null && OL_EMPTY_RE.test(info.prefix) && info.rest.trim() === ''
}

export function installListEditing(editor: MonacoEditor.IStandaloneCodeEditor): monaco.IDisposable {
  editor.addCommand(
    monaco.KeyCode.Enter,
    () => {
      if (!editor.getModel()) return
      const info = lineInfo(editor)
      if (info === null || info.rest.trim() !== '') {
        insertText(editor, NEWLINE)
        return
      }
      const text = info.prefix
      if (OL_EMPTY_RE.test(text)) {
        editor.executeEdits('mdmote.list-exit', [
          {
            range: new monaco.Range(
              info.lineNumber,
              1,
              info.lineNumber,
              text.length + 1
            ),
            text: ''
          }
        ])
        insertText(editor, NEWLINE)
        return
      }
      const ol = OL_ITEM_RE.exec(text)
      if (ol) {
        insertText(editor, NEWLINE + ol[1] + String(Number(ol[2]) + 1) + ol[3] + ' ')
        return
      }
      insertText(editor, NEWLINE)
    },
    FOCUS_WHEN
  )

  const shiftMarker = (delta: number, info: { lineNumber: number; prefix: string; rest: string }): void => {
    if (!isEmptyMarker(info)) return
    const match = OL_EMPTY_RE.exec(info.prefix)!
    const indent = match[1]
    if (delta < 0 && indent.length < 2) return
    const replacement = (delta > 0 ? '  ' : '') +
      (delta < 0 ? indent.slice(2) : indent) +
      match[2] +
      match[3]
    editor.executeEdits('mdmote.list-indent', [
      {
        range: new monaco.Range(
          info.lineNumber,
          1,
          info.lineNumber,
          info.prefix.length + 1
        ),
        text: replacement
      }
    ])
  }

  editor.addCommand(
    monaco.KeyCode.Tab,
    () => {
      const info = lineInfo(editor)
      if (isEmptyMarker(info)) {
        shiftMarker(1, info!)
        return
      }
      editor.trigger('keyboard', 'tab', null)
    },
    FOCUS_WHEN
  )

  editor.addCommand(
    monaco.KeyMod.Shift | monaco.KeyCode.Tab,
    () => {
      const info = lineInfo(editor)
      if (isEmptyMarker(info)) {
        shiftMarker(-1, info!)
        return
      }
      editor.trigger('keyboard', 'outdent', null)
    },
    FOCUS_WHEN
  )

  return { dispose: () => {} }
}