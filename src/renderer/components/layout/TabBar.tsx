import React from 'react'
import { useStore } from '../../store/useStore'
import { X, Circle } from 'lucide-react'
import { twMerge } from 'tailwind-merge'

const TabBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, closeTab, persistTab } = useStore()

  if (tabs.length === 0) return null

  return (
    <div className="flex bg-surface-dark border-b border-border overflow-x-auto custom-scrollbar no-scrollbar">
      {tabs.map(tab => (
        <div
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          onDoubleClick={() => persistTab(tab.id)}
          className={twMerge(
            "group flex items-center gap-3 px-4 py-2 border-r border-border cursor-pointer min-w-[120px] max-w-[220px] transition-all relative overflow-hidden shrink-0",
            activeTabId === tab.id 
              ? "bg-surface text-accent before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-accent" 
              : "text-zinc-500 hover:bg-surface-light hover:text-zinc-300"
          )}
        >
          <span className={twMerge(
            "text-[9px] font-bold uppercase shrink-0 px-1 rounded-sm border",
            tab.method === 'GET' ? "text-emerald-500 border-emerald-500/30" : 
            tab.method === 'POST' ? "text-amber-500 border-amber-500/30" : 
            tab.method === 'PUT' ? "text-sky-500 border-sky-500/30" :
            "text-rose-500 border-rose-500/30"
          )}>
            {tab.method}
          </span>
          <span className={twMerge(
            "text-xs truncate flex-1",
            !tab.isPersistent && "italic opacity-80"
          )}>
            {tab.name || tab.url || 'Untitled'}
          </span>
          
          <div className="flex items-center gap-1.5 w-4 justify-end">
            {tab.isDirty && <Circle size={8} fill="currentColor" className="text-accent animate-pulse" />}
            <button 
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
              className={twMerge(
                "hover:bg-zinc-800 p-0.5 rounded transition-all",
                tab.isDirty ? "opacity-0 group-hover:opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
            >
              <X size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TabBar
