import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef
} from 'react'
import { marked } from 'marked'
import { useDebouncedValue } from '../hooks/useDebounce'

marked.setOptions({
  gfm: true,
  breaks: true
})

export interface PreviewHandle {
  scrollToHeading: (text: string) => boolean
}

interface PreviewPaneProps {
  content: string
}

const headingSelector = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].join(', ')

function findHeadingByText(container: HTMLElement, text: string): HTMLElement | null {
  const norm = text.trim().toLowerCase()
  const headings = container.querySelectorAll(headingSelector)
  for (const h of headings) {
    if ((h.textContent || '').trim().toLowerCase() === norm) {
      return h as HTMLElement
    }
  }
  return null
}

const PreviewPane = forwardRef<PreviewHandle, PreviewPaneProps>(
  function PreviewPane({ content }, ref) {
    const debounced = useDebouncedValue(content, 250)

    const html = useMemo(() => {
      try {
        return marked.parse(debounced || '') as string
      } catch {
        return ''
      }
    }, [debounced])

    const containerRef = useRef<HTMLDivElement>(null)
    const focusTimer = useRef<number | undefined>(undefined)

    const scrollToHeading = useCallback((text: string) => {
      const container = containerRef.current
      if (!container) return false
      const target = findHeadingByText(container, text)
      if (!target) return false
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.clearTimeout(focusTimer.current)
      target.classList.add('heading-focus')
      focusTimer.current = window.setTimeout(
        () => target.classList.remove('heading-focus'),
        1500
      )
      return true
    }, [])

    useImperativeHandle(
      ref,
      () => ({ scrollToHeading }),
      [scrollToHeading]
    )

    return (
      <section className="preview-pane">
        <div className="pane-header">预览</div>
        <div
          ref={containerRef}
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </section>
    )
  }
)

export default PreviewPane