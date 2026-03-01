import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

interface Props {
  content: string
}

const bidiBlock = { dir: 'auto' as const, style: { unicodeBidi: 'plaintext' as const } }

export function MarkdownRenderer({ content }: Props) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p({ children }) {
            return <p {...bidiBlock}>{children}</p>
          },
          li({ children }) {
            return <li {...bidiBlock}>{children}</li>
          },
          h1({ children }) {
            return <h1 {...bidiBlock}>{children}</h1>
          },
          h2({ children }) {
            return <h2 {...bidiBlock}>{children}</h2>
          },
          h3({ children }) {
            return <h3 {...bidiBlock}>{children}</h3>
          },
          h4({ children }) {
            return <h4 {...bidiBlock}>{children}</h4>
          },
          blockquote({ children }) {
            return <blockquote {...bidiBlock}>{children}</blockquote>
          },
          td({ children }) {
            return <td {...bidiBlock}>{children}</td>
          },
          th({ children }) {
            return <th {...bidiBlock}>{children}</th>
          },
          code({ children, className, ...rest }) {
            const isBlock = className?.startsWith('language-')
            if (isBlock) {
              return <code dir="ltr" className={className} {...rest}>{children}</code>
            }
            return <code dir="ltr" {...rest}>{children}</code>
          },
          pre({ children }) {
            return <pre dir="ltr">{children}</pre>
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
