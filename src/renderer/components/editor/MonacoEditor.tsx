import React from 'react'
import Editor, { OnMount } from '@monaco-editor/react'

interface MonacoEditorProps {
  value: string
  onChange: (value: string | undefined) => void
  language?: 'json' | 'xml'
  readOnly?: boolean
  height?: string
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({ 
  value, 
  onChange, 
  language = 'json',
  readOnly = false,
  height = '100%'
}) => {
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    monaco.editor.defineTheme('noir', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'string', foreground: '00ff88' },
        { token: 'keyword', foreground: 'ffffff', fontStyle: 'bold' },
        { token: 'comment', foreground: '666666' },
      ],
      colors: {
        'editor.background': '#0f0f0f',
        'editorCursor.foreground': '#00ff88',
        'editorLineNumber.foreground': '#333333',
        'editor.lineHighlightBackground': '#181818',
        'editorIndentGuide.background': '#222222',
        'editorIndentGuide.activeBackground': '#333333',
      }
    })
    monaco.editor.setTheme('noir')
  }

  return (
    <Editor
      height={height}
      defaultLanguage={language}
      value={value}
      onChange={onChange}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        readOnly,
        padding: { top: 16, bottom: 16 },
        fontFamily: "'JetBrains Mono', monospace",
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        renderLineHighlight: 'all',
        links: true,
        contextmenu: true,
        quickSuggestions: true,
      }}
    />
  )
}

export default MonacoEditor
