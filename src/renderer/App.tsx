import React, { useEffect } from 'react'
import Sidebar from './components/layout/Sidebar'
import TabBar from './components/layout/TabBar'
import RequestPanel from './components/layout/RequestPanel'
import ResponsePanel from './components/response/ResponsePanel'
import { useStore } from './store/useStore'
import { useSyncDB } from './hooks/useSyncDB'

const App: React.FC = () => {
  const { loadData } = useStore()
  useSyncDB()

  useEffect(() => {
    loadData()
    // Add default tab if empty
    setTimeout(() => {
      const state = useStore.getState()
      if (state.tabs.length === 0) {
        state.addTab({
          name: 'Welcome Request',
          method: 'GET',
          url: 'https://api.github.com/repos/dougtq/api-plataform-pwa',
          isPersistent: true
        })
      }
    }, 500)
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-dark select-none">
      {/* Primary Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Tab System */}
        <TabBar />

        {/* Content Splitter (Vertical for now) */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
             <RequestPanel />
          </div>
          
          <div className="h-[40%] min-h-[150px]">
             <ResponsePanel />
          </div>
        </div>

        {/* Status Bar */}
        <footer className="h-6 border-t border-border flex items-center justify-between px-3 text-[9px] font-mono text-zinc-600 uppercase tracking-widest bg-surface-dark/80">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-accent">
              <span className="w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_5px_var(--color-accent)]"></span>
              Synchronized
            </span>
            <span>Local-First Persistent</span>
          </div>
          <div className="flex items-center gap-4">
            <span>JSON / XML Mode</span>
            <span>UTF-8</span>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default App
