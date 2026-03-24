import React, { useRef } from 'react'
import { useStore } from '../../store/useStore'
import { Folder, History, Settings, Plus, Trash2, Globe, Upload, Download } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { PostmanImporter } from '../../services/postmanImporter'

const Sidebar: React.FC = () => {
  const { collections, requests, addCollection, deleteCollection, addTab, importCollection } = useStore()
  const [activePane, setActivePane] = React.useState<'collections' | 'history'>('collections')
  const [isImporting, setIsImporting] = React.useState(false)
  const [importProgress, setImportProgress] = React.useState({ processed: 0, total: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        setIsImporting(true)
        const json = event.target?.result as string
        const { collection, requests, folders } = PostmanImporter.parseCollection(json)
        
        await importCollection(collection, requests, folders, (processed, total) => {
          setImportProgress({ processed, total })
        })
        
        // Reset input and state
        e.target.value = ''
        setIsImporting(false)
        setImportProgress({ processed: 0, total: 0 })
      } catch (err) {
        console.error('Import failed:', err)
        alert('Failed to import Postman collection. Check console for details.')
        setIsImporting(false)
      }
    }
    reader.readAsText(file)
  }

  const handleExport = (colId: number) => {
    const collection = collections.find(c => c.id === colId)
    if (!collection) return

    const colRequests = requests.filter(r => r.collectionId === colId)
    const json = PostmanImporter.exportCollection(collection, colRequests)
    
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${collection.name}.postman_collection.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <aside className="w-64 border-r border-border flex flex-col glass-panel animate-fade-in">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json" 
        className="hidden" 
      />

      {/* Pane Switcher */}
      <div className="flex border-b border-border">
        <button 
          onClick={() => setActivePane('collections')}
          className={twMerge(
            "flex-1 p-3 flex justify-center hover:bg-surface-light transition-all",
            activePane === 'collections' ? "text-accent border-b border-accent" : "text-zinc-500"
          )}
        >
          <Folder size={18} />
        </button>
        <button 
          onClick={() => setActivePane('history')}
          className={twMerge(
            "flex-1 p-3 flex justify-center hover:bg-surface-light transition-all",
            activePane === 'history' ? "text-accent border-b border-accent" : "text-zinc-500"
          )}
        >
          <History size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {activePane === 'collections' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <span className="accent-text">Collections</span>
              <div className="flex gap-2">
                <button 
                  onClick={handleImportClick}
                  className="text-zinc-500 hover:text-accent transition-all"
                  title="Import Postman Collection"
                >
                  <Upload size={14} />
                </button>
                <button 
                  onClick={() => addCollection("New Collection")}
                  className="text-zinc-500 hover:text-accent transition-all"
                  title="New Collection"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            {isImporting && (
              <div className="mx-2 p-3 bg-accent/10 border border-accent/20 rounded-md animate-pulse">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-accent">Importing...</span>
                  <span className="text-[10px] font-mono text-accent">{importProgress.processed}/{importProgress.total}</span>
                </div>
                <div className="w-full bg-surface-light h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-accent h-full transition-all duration-300" 
                    style={{ width: `${(importProgress.processed / (importProgress.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            {collections.map(col => (
              <div key={col.id} className="group flex flex-col">
                <div className="flex justify-between items-center p-2 rounded hover:bg-surface-light cursor-pointer">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Folder size={14} className="text-zinc-500 shrink-0" />
                    <span className="text-sm truncate">{col.name}</span>
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100">
                    <button 
                      onClick={(e) => { e.stopPropagation(); col.id && handleExport(col.id) }}
                      className="text-zinc-600 hover:text-sky-400"
                      title="Export Collection"
                    >
                      <Download size={12} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); col.id && deleteCollection(col.id) }}
                      className="text-zinc-600 hover:text-red-400"
                      title="Delete Collection"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            <button 
              onClick={() => addTab({ name: 'New Request', isPersistent: false })}
              className="w-full flex items-center gap-2 p-2 text-zinc-500 hover:text-accent hover:bg-accent-dim transition-all rounded text-xs mt-4"
            >
              <Plus size={14} />
              New Quick Request
            </button>
          </div>
        )}
      </div>

      {/* Footer Settings */}
      <div className="p-3 border-t border-border flex justify-between text-zinc-600 bg-surface-dark/50">
        <Settings size={16} className="hover:text-zinc-300 cursor-pointer transition-all" />
        <Globe size={16} className="hover:text-zinc-300 cursor-pointer transition-all" />
      </div>
    </aside>
  )
}

export default Sidebar
