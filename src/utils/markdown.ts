export interface Heading {
  text: string
  level: number
  line: number
}

const HEADING_RE = /^(#{1,6})\s+(.*)$/

export function parseHeadings(md: string): Heading[] {
  const lines = md.split('\n')
  const headings: Heading[] = []
  for (let i = 0; i < lines.length; i++) {
    const m = HEADING_RE.exec(lines[i])
    if (m) {
      headings.push({
        text: m[2].trim(),
        level: m[1].length,
        line: i + 1
      })
    }
  }
  return headings
}

export interface TreeNode {
  heading: Heading
  children: TreeNode[]
}

export function buildTree(headings: Heading[]): TreeNode[] {
  const roots: TreeNode[] = []
  const stack: TreeNode[] = []

  for (const h of headings) {
    const node: TreeNode = { heading: h, children: [] }
    while (stack.length > 0 && stack[stack.length - 1].heading.level >= h.level) {
      stack.pop()
    }
    if (stack.length > 0) {
      stack[stack.length - 1].children.push(node)
    } else {
      roots.push(node)
    }
    stack.push(node)
  }

  return roots
}