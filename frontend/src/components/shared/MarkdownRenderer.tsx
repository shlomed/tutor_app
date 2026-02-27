import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

interface Props {
  content: string
}

export function MarkdownRenderer({ content }: Props) {
  return (
    <div dir="auto" style={{ unicodeBidi: 'plaintext' }} className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
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
