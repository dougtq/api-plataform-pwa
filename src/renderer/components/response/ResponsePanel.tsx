import React, { useRef, useState, useEffect } from 'react'
import { useStore } from '../../store/useStore'
import MonacoEditor from '../editor/MonacoEditor'
// @ts-ignore - The installed version has a different API
import { List } from 'react-window'
import { Info, Copy, Check } from 'lucide-react'
import { clsx } from 'clsx'

// Row component as per the new react-window API
const RowRenderer = ({ index, style, lines }: any) => (
  <div style={style} className="px-4 text-[13px] font-mono text-zinc-400 whitespace-pre overflow-hidden flex items-center border-b border-border/10">
    <span className="text-zinc-700 mr-4 select-none inline-block w-10 text-right shrink-0">{index + 1}</span>
    <span className="truncate">{lines[index]}</span>
  </div>
)

const ResponsePanel: React.FC = () => {
  const { activeTabId, tabs } = useStore()
  const activeTab = tabs.find(t => t.id === activeTabId)
  const response = activeTab?.response
  
  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => {
      if (entries[0]) setHeight(entries[0].contentRect.height)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  if (!response) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 h-full border-t border-border bg-surface-dark/40">
        <div className="flex flex-col items-center gap-2 opacity-50">
          <Info size={24} strokeWidth={1} />
          <p className="text-[10px] uppercase tracking-[0.3em] font-light">Waiting for Request</p>
        </div>
      </div>
    )
  }

  const handleCopy = () => {
    const text = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isLargePayload = response.size > 1024 * 1024 || (typeof response.data === 'string' && response.data.split('\n').length > 5000)

  const responseString = typeof response.data === 'string' 
    ? response.data 
    : JSON.stringify(response.data, null, 2)

  const lines = responseString.split('\n')

  return (
    <div className="flex-1 flex flex-col border-t border-border bg-surface animate-fade-in overflow-hidden h-full">
      {/* Response Header */}
      <div className="px-4 py-2.5 flex items-center justify-between bg-surface-dark/50 border-b border-border">
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2">
            <span className="accent-text !text-[8.5px]">Status</span>
            <span className={clsx(
              "font-mono text-xs font-bold",
              response.status < 300 ? "text-emerald-400" : 
              response.status < 400 ? "text-sky-400" : "text-rose-400"
            )}>
              {response.status} {response.statusText}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="accent-text !text-[8.5px]">Time</span>
            <span className="font-mono text-[11px] text-zinc-400">{response.time}ms</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="accent-text !text-[8.5px]">Size</span>
            <span className="font-mono text-[11px] text-zinc-400">
              {response.size > 1024 * 1024 
                ? `${(response.size / (1024 * 1024)).toFixed(2)} MB` 
                : `${(response.size / 1024).toFixed(2)} KB`}
            </span>
          </div>
        </div>
        
        <div className="flex gap-4">
          {isLargePayload && (
            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[9px] font-bold rounded-sm h-fit">
              VIRTUALIZED (60FPS)
            </span>
          )}
          <button 
            onClick={handleCopy}
            className="text-[10px] uppercase text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-all"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Response Body */}
      <div ref={containerRef} className="flex-1 min-h-0 bg-[#0f0f0f] relative custom-scrollbar">
        {isLargePayload ? (
          <List
            style={{ height }}
            rowCount={lines.length}
            rowHeight={20}
            rowComponent={RowRenderer}
            rowProps={{ lines }}
          />
        ) : (
          <MonacoEditor 
            value={responseString} 
            onChange={() => {}} 
            readOnly 
          />
        )}
      </div>
    </div>
  )
}

export default ResponsePanel
