import React, { useEffect, useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { KeyValue } from '../../store/useStore'

interface KeyValueEditorProps {
  items: KeyValue[]
  onChange: (items: KeyValue[]) => void
}

const KeyValueEditor: React.FC<KeyValueEditorProps> = ({ items, onChange }) => {
  // Ensure there is always at least one empty row at the end
  useEffect(() => {
    const lastItem = items[items.length - 1]
    if (!lastItem || lastItem.key || lastItem.value) {
      onChange([...items, { id: crypto.randomUUID(), key: '', value: '', enabled: true }])
    }
  }, [items, onChange])

  const handleUpdate = (id: string, updates: Partial<KeyValue>) => {
    const newItems = items.map(item => item.id === id ? { ...item, ...updates } : item)
    onChange(newItems)
  }

  const handleDelete = (id: string) => {
    if (items.length <= 1) return
    onChange(items.filter(item => item.id !== id))
  }

  return (
    <div className="flex flex-col text-[11px] font-mono select-text">
      <div className="flex border-b border-border bg-surface-dark/40 py-1 text-zinc-500 uppercase tracking-tighter font-bold">
        <div className="w-10 px-2 shrink-0"></div>
        <div className="flex-1 px-3 border-r border-border/50">Key</div>
        <div className="flex-1 px-3 border-r border-border/50">Value</div>
        <div className="flex-1 px-3">Description</div>
        <div className="w-10 shrink-0"></div>
      </div>
      
      <div className="divide-y divide-border/30">
        {items.map((item, index) => (
          <div key={item.id} className="group flex items-center hover:bg-white/5 transition-colors">
            {/* Enabled Checkbox */}
            <div className="w-10 flex items-center justify-center border-r border-border/20 h-8">
              <input 
                type="checkbox" 
                checked={item.enabled}
                onChange={(e) => handleUpdate(item.id, { enabled: e.target.checked })}
                className="w-3 h-3 accent-accent cursor-pointer opacity-40 group-hover:opacity-100 transition-opacity"
              />
            </div>
            
            {/* Key Input */}
            <div className="flex-1 border-r border-border/20 h-8">
              <input 
                type="text" 
                placeholder="Key"
                value={item.key}
                onChange={(e) => handleUpdate(item.id, { key: e.target.value })}
                className="w-full h-full bg-transparent px-3 outline-none focus:bg-accent/5 transition-colors placeholder:text-zinc-800"
              />
            </div>
            
            {/* Value Input */}
            <div className="flex-1 border-r border-border/20 h-8">
              <input 
                type="text" 
                placeholder="Value"
                value={item.value}
                onChange={(e) => handleUpdate(item.id, { value: e.target.value })}
                className="w-full h-full bg-transparent px-3 outline-none focus:bg-accent/5 transition-colors placeholder:text-zinc-800"
              />
            </div>

            {/* Description Input */}
            <div className="flex-1 h-8">
              <input 
                type="text" 
                placeholder="Description"
                value={item.description || ''}
                onChange={(e) => handleUpdate(item.id, { description: e.target.value })}
                className="w-full h-full bg-transparent px-3 outline-none focus:bg-accent/5 transition-colors placeholder:text-zinc-800"
              />
            </div>

            {/* Actions */}
            <div className="w-10 flex items-center justify-center h-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleDelete(item.id)}
                className="text-zinc-600 hover:text-red-400 p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default KeyValueEditor
