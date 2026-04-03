import React, { useState } from 'react'

const colorsForScore = s => {
  if (s < 4) return '#ff4d4f'
  if (s < 7) return '#ffa940'
  return '#52c41a'
}

export default function App() {
  const [emailText, setEmailText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const submit = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailText })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#e6eef8', fontFamily: 'Inter, system-ui, sans-serif', padding: 24 }}>
      <header style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h1 style={{ margin: 0 }}>OutboundAudit</h1>
        <p style={{ margin: 0, color: '#9aa9d6' }}>Paste your cold email. Get an expert audit in 10 seconds.</p>
      </header>

      <main style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20, marginTop: 20 }}>
        <section>
          <textarea
            placeholder="Paste your email or full sequence here..."
            value={emailText}
            onChange={e => setEmailText(e.target.value)}
            style={{ width: '100%', height: 320, padding: 12, borderRadius: 8, background: '#0b0c0f', color: '#e6eef8', border: '1px solid #20232a' }}
          />

          <div style={{ marginTop: 12 }}>
            <button
              onClick={submit}
              disabled={loading || !emailText.trim()}
              style={{
                background: '#4f8ef7',
                color: 'white',
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                cursor: loading || !emailText.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Auditing your email...' : 'Audit my email →'}
            </button>
          </div>

          {error && (
            <div style={{ marginTop: 12, background: '#2b1a1a', padding: 12, borderRadius: 8, color: '#ffd2d2' }}>
              {error}
            </div>
          )}
        </section>

        <aside style={{ background: '#0b0c0f', border: '1px solid #20232a', padding: 16, borderRadius: 8 }}>
          {!result && !loading && <div style={{ color: '#9aa9d6' }}>Results will appear here.</div>}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div className="spinner" style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.06)', borderTopColor: '#4f8ef7', animation: 'spin 1s linear infinite' }} />
              <div>Auditing your email...</div>
            </div>
          )}

          {result && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 84, height: 84, borderRadius: '50%', background: colorsForScore(result.overall_score), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 }}>
                  {result.overall_score}/10
                </div>
                <div style={{ fontStyle: 'italic', color: '#c0c9e8' }}>{result.verdict}</div>
              </div>

              <div style={{ marginTop: 12 }}>
                <h4 style={{ margin: '8px 0' }}>Issues</h4>
                {Array.isArray(result.issues) && result.issues.length ? (
                  result.issues.map((issue, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ background: '#20232a', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>{issue.rule}</div>
                        <div style={{ color: '#e6eef8' }}>{issue.problem}</div>
                      </div>
                      <div style={{ marginTop: 6, background: '#071127', padding: 10, borderRadius: 6, color: '#bfe3ff' }}>{issue.fix}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#9aa9d6' }}>No issues found.</div>
                )}
              </div>

              {result.rewrite && (
                <div style={{ marginTop: 12 }}>
                  <h4>Suggested rewrite</h4>
                  <div style={{ background: '#071127', padding: 12, borderRadius: 8, color: '#bfe3ff', whiteSpace: 'pre-wrap' }}>{result.rewrite}</div>
                </div>
              )}
            </div>
          )}
        </aside>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
