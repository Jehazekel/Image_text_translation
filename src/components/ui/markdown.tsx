import { ReactNode, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'

interface MarkdownProps {
  children?: ReactNode;
  text: string;
}
export default function Markdown({children, text}: MarkdownProps){
  const sampleText = useMemo(()=>{
    return text
  }, [text])
  
    return <ReactMarkdown remarkPlugins={[[remarkGfm]]}
//   style={{ height : '350px', overflowY : 'auto'}}
  
  >
  {sampleText}
  </ReactMarkdown>
}