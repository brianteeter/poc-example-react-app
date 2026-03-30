import { useCallback, useEffect, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'poc-api-base-url'

function apiUrl(url) {
  return url.trim().replace(/\/+$/, '')
}

async function readResponseBody(res) {
  const ct = res.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) {
    const data = await res.json()
    if (data && typeof data === 'object' && 'text' in data) {
      return String(data.text)
    }
    return JSON.stringify(data, null, 2)
  }
  return res.text()
}

export default function App() {
  const defaultBase =
    import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000'

  const [baseUrl, setBaseUrl] = useState(defaultBase)
  const [text, setText] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setBaseUrl(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, baseUrl)
  }, [baseUrl])

  const run = useCallback(
    async (label, fn) => {
      setBusy(true)
      setStatus('')
      try {
        const msg = await fn()
        setStatus(`${label}: ${msg}`)
      } catch (e) {
        setStatus(`${label} failed: ${e instanceof Error ? e.message : String(e)}`)
      } finally {
        setBusy(false)
      }
    },
    [],
  )

  const handleGet = () => {
    run('GET', async () => {
      const url = apiUrl(baseUrl)
      const res = await fetch(url)
      const body = await readResponseBody(res)
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText} — ${body.slice(0, 200)}`)
      }
      setText(body)
      return `ok (${res.status}), ${body.length} chars`
    })
  }

  const handlePut = () => {
    run('PUT (append)', async () => {
      const url = apiUrl(baseUrl)
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: text,
      })
      const body = await readResponseBody(res)
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText} — ${body.slice(0, 200)}`)
      }
      setText(body)
      return `ok (${res.status}), ${body.length} chars`
    })
  }

  const handlePost = () => {
    run('POST (replace)', async () => {
      const url = apiUrl(baseUrl)
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: text,
      })
      const body = await readResponseBody(res)
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText} — ${body.slice(0, 200)}`)
      }
      setText(body)
      return `ok (${res.status}), ${body.length} chars`
    })
  }

  return (
    <div className="poc">
      <h1 className="poc-title">Text API PoC</h1>

      <label className="poc-label">
        REST API URL (root <code>/</code>)
        <input
          className="poc-input"
          type="url"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="http://localhost:3000"
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      <p className="poc-hint">
        GET / PUT / POST target this URL (server root only, no path). Optional default:{' '}
        <code>VITE_API_BASE_URL</code>.
      </p>

      <textarea
        className="poc-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Text from GET, or body for PUT / POST"
        rows={12}
      />

      <div className="poc-actions">
        <button type="button" onClick={handleGet} disabled={busy}>
          GET
        </button>
        <button type="button" onClick={handlePut} disabled={busy}>
          PUT (append)
        </button>
        <button type="button" onClick={handlePost} disabled={busy}>
          POST (replace)
        </button>
      </div>

      {status ? <p className="poc-status">{status}</p> : null}
    </div>
  )
}
