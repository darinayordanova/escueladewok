import { useState } from 'react'
import { set } from 'sanity'
import type { ArrayOfPrimitivesInputProps } from 'sanity'

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildCells(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const cells: (Date | null)[] = Array(first.getDay()).fill(null)
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d))
  return cells
}

export function MultiDateCalendar(props: ArrayOfPrimitivesInputProps) {
  const { value, onChange, readOnly } = props
  const selected = new Set((value as string[] | undefined) ?? [])
  const today = toDateStr(new Date())

  const [view, setView] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  function navigate(delta: number) {
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  function toggle(dateStr: string) {
    if (readOnly) return
    const next = new Set(selected)
    if (next.has(dateStr)) next.delete(dateStr)
    else next.add(dateStr)
    onChange(set(Array.from(next).sort()))
  }

  function clearAll() {
    if (readOnly) return
    onChange(set([]))
  }

  const { year, month } = view
  const cells = buildCells(year, month)
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })

  const sortedDates = Array.from(selected).sort()

  return (
    <div style={{ userSelect: 'none', maxWidth: 320, fontFamily: 'inherit' }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
        <button type="button" onClick={() => navigate(-1)} style={navBtn}>‹</button>
        <span style={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: 14 }}>
          {monthLabel}
        </span>
        <button type="button" onClick={() => navigate(1)} style={navBtn}>›</button>
      </div>

      {/* Day-of-week headers */}
      <div style={grid7}>
        {WEEK_DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#888', paddingBottom: 4 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div style={grid7}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={`pad-${i}`} />
          const dateStr = toDateStr(cell)
          const isSel = selected.has(dateStr)
          const isToday = dateStr === today
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => toggle(dateStr)}
              disabled={!!readOnly}
              style={{
                padding: '5px 0',
                borderRadius: 4,
                border: isToday && !isSel ? '1.5px solid #2276FC' : '1.5px solid transparent',
                background: isSel ? '#2276FC' : 'transparent',
                color: isSel ? '#fff' : 'inherit',
                cursor: readOnly ? 'default' : 'pointer',
                fontSize: 13,
                fontWeight: isSel ? 700 : 400,
                width: '100%',
              }}
            >
              {cell.getDate()}
            </button>
          )
        })}
      </div>

      {/* Selected dates summary */}
      <div style={{ marginTop: 14, borderTop: '1px solid #e5e7eb', paddingTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
            {selected.size === 0 ? 'No dates selected' : `${selected.size} date${selected.size !== 1 ? 's' : ''} selected`}
          </span>
          {selected.size > 0 && !readOnly && (
            <button type="button" onClick={clearAll} style={clearBtn}>Clear all</button>
          )}
        </div>
       
      </div>
    </div>
  )
}

const navBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #d1d5db',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
  padding: '3px 10px',
}

const clearBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#6b7280',
  cursor: 'pointer',
  fontSize: 11,
  padding: 0,
  textDecoration: 'underline',
}

const grid7: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: 2,
}