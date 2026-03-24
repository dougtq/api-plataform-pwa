import React, { useEffect } from 'react'
import { useStore } from '../../store/useStore'
import MonacoEditor from '../editor/MonacoEditor'
import KeyValueEditor from '../request/KeyValueEditor'
import { Send, Plus, Shield } from 'lucide-react'
import { clsx } from 'clsx'

type PanelTab = 'params' | 'auth' | 'headers' | 'body'

const RequestPanel: React.FC = () => {
  const { activeTabId, tabs, updateTab, sendRequest } = useStore()
  const activeTab = tabs.find(t => t.id === activeTabId)

  const setActivePanelTab = (tab: PanelTab) => {
    if (activeTab) updateTab(activeTab.id, { activePanelTab: tab })
  }

  const activePanelTab = activeTab?.activePanelTab || 'body'

  // URL-Params Bidirectional Sync
  useEffect(() => {
    if (!activeTab || !activeTabId) return

    // 1. Sync URL -> Params (When URL is typed/pasted)
    const urlObj = (() => {
      try {
        return new URL(activeTab.url.startsWith('http') ? activeTab.url : `http://${activeTab.url}`)
      } catch {
        return null
      }
    })()

    if (urlObj) {
      const searchParams = Array.from(urlObj.searchParams.entries()).map(([key, value]) => ({
        id: crypto.randomUUID(),
        key,
        value,
        enabled: true
      }))

      // Only update if fundamentally different to avoid circular loops
      const currentParamsStr = JSON.stringify(activeTab.params.filter(p => p.key).map(p => ({ k: p.key, v: p.value })))
      const envParamsStr = JSON.stringify(searchParams.map(p => ({ k: p.key, v: p.value })))
      
      if (currentParamsStr !== envParamsStr && envParamsStr !== '[]') {
        // This is a simplified sync, in a real app we'd merge or be more careful
        // updateTab(activeTab.id, { params: searchParams })
      }
    }
  }, [activeTab?.url])

  const handleParamsChange = (newParams: any[]) => {
    if (!activeTab) return
    
    // Sync Params -> URL
    const urlBase = activeTab.url.split('?')[0]
    const searchParams = new URLSearchParams()
    newParams.forEach(p => {
      if (p.enabled && p.key) searchParams.append(p.key, p.value)
    })
    
    const queryString = searchParams.toString()
    const newUrl = queryString ? `${urlBase}?${queryString}` : urlBase
    
    updateTab(activeTab.id, { 
      params: newParams, 
      url: newUrl,
      isDirty: true 
    })
  }

  if (!activeTab) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 gap-4 animate-fade-in bg-surface-dark/20 h-full">
        <div className="w-16 h-16 border border-zinc-800 rounded-full flex items-center justify-center bg-surface-dark shadow-[0_0_20px_-5px_rgba(255,255,255,0.05)]">
          <Plus size={32} strokeWidth={1} />
        </div>
        <div className="text-center">
          <p className="text-sm font-light">Select a request or create a new one</p>
          <p className="text-[10px] uppercase tracking-widest mt-2 opacity-50 font-mono">VS Code Style Tabs Active</p>
        </div>
      </div>
    )
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateTab(activeTab.id, { url: e.target.value, isDirty: true })
  }

  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateTab(activeTab.id, { method: e.target.value, isDirty: true })
  }

  return (
    <div key={activeTab.id} className="flex-1 flex flex-col bg-surface animate-fade-in h-full overflow-hidden">
      {/* Request URL Bar */}
      <div className="p-4 flex gap-2 border-b border-border bg-surface-dark/30">
        <div className="relative">
          <select 
            value={activeTab.method}
            onChange={handleMethodChange}
            className="bg-surface-light border border-border px-3 py-2 text-xs font-bold text-accent rounded-sm focus:outline-none focus:border-accent transition-all uppercase appearance-none cursor-pointer hover:bg-surface min-w-[100px]"
          >
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>PATCH</option>
            <option>DELETE</option>
          </select>
        </div>
        <input 
          type="text" 
          value={activeTab.url}
          onChange={handleUrlChange}
          placeholder="https://api.example.com/v1/resource"
          className="flex-1 bg-surface-light border border-border px-4 py-2 text-sm rounded-sm focus:outline-none focus:border-accent transition-all font-mono"
        />
        <button 
          onClick={() => sendRequest()}
          className="btn-primary flex items-center gap-2 px-6"
        >
          <Send size={14} />
          <span>Send</span>
        </button>
      </div>

      {/* Tabs for Body/Headers/etc */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex border-b border-border bg-surface-dark/20 text-[10px] uppercase tracking-widest font-bold">
          <button 
            onClick={() => setActivePanelTab('params')}
            className={clsx(
              "px-5 py-2.5 transition-all border-b-2 hover:text-accent",
              activePanelTab === 'params' ? "border-accent text-accent bg-surface/50" : "border-transparent text-zinc-500"
            )}
          >
            Params {activeTab.params.filter(p => p.key).length > 0 && `(${activeTab.params.filter(p => p.key).length})`}
          </button>
          <button 
            onClick={() => setActivePanelTab('auth')}
            className={clsx(
              "px-5 py-2.5 transition-all border-b-2 hover:text-accent",
              activePanelTab === 'auth' ? "border-accent text-accent bg-surface/50" : "border-transparent text-zinc-500"
            )}
          >
            Auth {activeTab.auth?.type !== 'none' && '●'}
          </button>
          <button 
            onClick={() => setActivePanelTab('headers')}
            className={clsx(
              "px-5 py-2.5 transition-all border-b-2 hover:text-accent",
              activePanelTab === 'headers' ? "border-accent text-accent bg-surface/50" : "border-transparent text-zinc-500"
            )}
          >
            Headers {activeTab.headers.filter(h => h.key).length > 0 && `(${activeTab.headers.filter(h => h.key).length})`}
          </button>
          <button 
            onClick={() => setActivePanelTab('body')}
            className={clsx(
              "px-5 py-2.5 transition-all border-b-2 hover:text-accent",
              activePanelTab === 'body' ? "border-accent text-accent bg-surface/50" : "border-transparent text-zinc-500"
            )}
          >
            Body
          </button>
        </div>

        <div className="flex-1 min-h-0 bg-[#0f0f0f] overflow-y-auto custom-scrollbar">
          {activePanelTab === 'body' && (
            <MonacoEditor 
              value={activeTab.body} 
              onChange={(val: string | undefined) => updateTab(activeTab.id, { body: val || '', isDirty: true })} 
            />
          )}

          {activePanelTab === 'params' && (
            <div className="p-2">
              <KeyValueEditor 
                items={activeTab.params} 
                onChange={(newItems) => handleParamsChange(newItems)}
              />
            </div>
          )}

          {activePanelTab === 'headers' && (
            <div className="p-2">
              <KeyValueEditor 
                items={activeTab.headers} 
                onChange={(newItems) => updateTab(activeTab.id, { headers: newItems, isDirty: true })}
              />
            </div>
          )}

          {activePanelTab === 'auth' && (
            <div className="p-8 max-w-lg animate-fade-in">
              <div className="mb-6">
                <label className="text-[10px] uppercase text-zinc-500 font-bold mb-2 block">Auth Type</label>
                <select 
                  value={activeTab.auth.type}
                  onChange={(e) => updateTab(activeTab.id, { auth: { ...activeTab.auth, type: e.target.value as any }, isDirty: true })}
                  className="w-full bg-surface-light border border-border px-3 py-2 text-xs rounded-sm focus:outline-none focus:border-accent appearance-none cursor-pointer"
                >
                  <option value="none">No Auth</option>
                  <option value="basic">Basic Auth</option>
                  <option value="bearer">Bearer Token</option>
                </select>
              </div>

              {activeTab.auth.type === 'bearer' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="text-[10px] uppercase text-zinc-500 font-bold mb-2 block">Token</label>
                    <input 
                      type="text" 
                      value={activeTab.auth.bearer?.token || ''}
                      onChange={(e) => updateTab(activeTab.id, { auth: { ...activeTab.auth, bearer: { token: e.target.value } }, isDirty: true })}
                      placeholder="Enter Bearer Token"
                      className="w-full bg-surface-light border border-border px-3 py-2 text-xs rounded-sm focus:outline-none focus:border-accent font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-600">The token will be added to the Authorization header.</p>
                </div>
              )}

              {activeTab.auth.type === 'basic' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="text-[10px] uppercase text-zinc-500 font-bold mb-2 block">Username</label>
                    <input 
                      type="text" 
                      value={activeTab.auth.basic?.username || ''}
                      onChange={(e) => updateTab(activeTab.id, { auth: { ...activeTab.auth, basic: { ...activeTab.auth.basic!, username: e.target.value } }, isDirty: true })}
                      placeholder="Username"
                      className="w-full bg-surface-light border border-border px-3 py-2 text-xs rounded-sm focus:outline-none focus:border-accent font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-zinc-500 font-bold mb-2 block">Password</label>
                    <input 
                      type="password" 
                      value={activeTab.auth.basic?.password || ''}
                      onChange={(e) => updateTab(activeTab.id, { auth: { ...activeTab.auth, basic: { ...activeTab.auth.basic!, password: e.target.value } }, isDirty: true })}
                      placeholder="Password"
                      className="w-full bg-surface-light border border-border px-3 py-2 text-xs rounded-sm focus:outline-none focus:border-accent font-mono"
                    />
                  </div>
                </div>
              )}

              {activeTab.auth.type === 'none' && (
                <div className="flex flex-col items-center justify-center py-10 text-zinc-600 gap-3">
                  <Shield size={32} strokeWidth={1} />
                  <p className="text-xs">This request does not use any authentication.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RequestPanel
