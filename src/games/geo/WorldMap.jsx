// خريطة العالم التفاعلية — خفيفة وسلسة: اليابسة تُرسم مرة واحدة،
// والمحتوى مُثبّت في useMemo، والتكبير/التحريك يحرّك طبقة التحويل فقط.
import { useMemo, useRef, useState, useEffect } from 'react'
import { geoEquirectangular, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import landTopo from 'world-atlas/land-110m.json'
import { COUNTRIES } from './countries'

const W = 720
const H = 360

const projection = geoEquirectangular().fitSize([W, H], { type: 'Sphere' })
const landGeo = feature(landTopo, landTopo.objects.land)
const LAND_D = geoPath(projection)(landGeo) // يُحسب مرة واحدة (كان يُعاد كل إطار!)

const POINTS = COUNTRIES.map((c) => {
  const [x, y] = projection([c.lng, c.lat])
  return { ...c, x, y }
})

const HEAT_COLOR = {
  hit: '#4ade80', hot: '#ff6b81', warm: '#ffb454', cool: '#6aa9ff', cold: '#8b7bff',
}
const NON_SCALING = { vectorEffect: 'non-scaling-stroke' }

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const MAX_K = 8

export default function WorldMap({
  guesses = [], onPick, selectable = true, revealIso = null,
  pinIso = null, pendingIso = null, disabledIsos = [],
}) {
  const svgRef = useRef(null)
  const [view, setView] = useState({ k: 1, x: 0, y: 0 })
  const drag = useRef(null)
  const panned = useRef(false)
  const rafId = useRef(0)
  const accum = useRef({ dx: 0, dy: 0 })

  const clampXY = (x, y, k) => [clamp(x, W * (1 - k), 0), clamp(y, H * (1 - k), 0)]

  const zoomAt = (factor, cx = W / 2, cy = H / 2) => {
    setView((v) => {
      const nk = clamp(v.k * factor, 1, MAX_K)
      const wx = (cx - v.x) / v.k
      const wy = (cy - v.y) / v.k
      const [nx, ny] = clampXY(cx - wx * nk, cy - wy * nk, nk)
      return { k: nk, x: nx, y: ny }
    })
  }

  const svgPoint = (clientX, clientY) => {
    const r = svgRef.current.getBoundingClientRect()
    return [((clientX - r.left) / r.width) * W, ((clientY - r.top) / r.height) * H]
  }

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      const [cx, cy] = svgPoint(e.clientX, e.clientY)
      zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, cx, cy)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // تنعيم السحب: نجمّع الإزاحات ونطبّقها مرة واحدة لكل إطار
  const flushPan = () => {
    rafId.current = 0
    const { dx, dy } = accum.current
    accum.current = { dx: 0, dy: 0 }
    if (!dx && !dy) return
    setView((v) => {
      const [nx, ny] = clampXY(v.x + dx, v.y + dy, v.k)
      return { ...v, x: nx, y: ny }
    })
  }

  const onPointerDown = (e) => {
    drag.current = { x: e.clientX, y: e.clientY }
    panned.current = false
    svgRef.current.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!drag.current) return
    const r = svgRef.current.getBoundingClientRect()
    const dx = ((e.clientX - drag.current.x) / r.width) * W
    const dy = ((e.clientY - drag.current.y) / r.height) * H
    if (Math.abs(e.clientX - drag.current.x) + Math.abs(e.clientY - drag.current.y) > 4) panned.current = true
    drag.current = { x: e.clientX, y: e.clientY }
    accum.current.dx += dx
    accum.current.dy += dy
    if (!rafId.current) rafId.current = requestAnimationFrame(flushPan)
  }
  const onPointerUp = () => {
    drag.current = null
    if (rafId.current) { cancelAnimationFrame(rafId.current); rafId.current = 0; flushPan() }
  }

  // المحتوى الثابت (اليابسة + النقاط + العلامات) — لا يُعاد إنشاؤه عند التكبير/التحريك
  const content = useMemo(() => {
    const disabled = new Set(disabledIsos)
    const guessMap = {}
    for (const g of guesses) guessMap[g.iso] = g
    const last = guesses.length ? guesses[guesses.length - 1] : null
    const lastPt = last ? POINTS.find((p) => p.iso === last.iso) : null
    const pinPt = pinIso ? POINTS.find((p) => p.iso === pinIso) : null

    const pickDot = (iso) => {
      if (panned.current) return
      if (!selectable || disabled.has(iso)) return
      onPick?.(iso)
    }

    return (
      <>
        <path d={LAND_D} fill="var(--geo-land, #2b3b57)" stroke="var(--geo-land-edge, #3a4d70)" strokeWidth="0.5" style={NON_SCALING} />

        {POINTS.map((p) => {
          const g = guessMap[p.iso]
          const color = g ? HEAT_COLOR[g.heat] : null
          const isReveal = revealIso === p.iso
          const isPending = pendingIso === p.iso
          const isDisabled = disabled.has(p.iso)
          const canPick = selectable && !isDisabled
          const r = g || isReveal || isPending ? 3.2 : 1.7
          return (
            <g key={p.iso} className={`geo-dot${canPick ? ' pick' : ''}${isDisabled ? ' off' : ''}`} onClick={() => pickDot(p.iso)}>
              <title>{p.ar}</title>
              {(g || isReveal || isPending) && (
                <circle cx={p.x} cy={p.y} r={isPending ? 8 : isReveal ? 9 : 6}
                  fill={isPending ? '#ffb454' : isReveal ? '#4ade80' : color} opacity="0.28" />
              )}
              <circle cx={p.x} cy={p.y} r="7" fill="transparent" />
              <circle cx={p.x} cy={p.y} r={r}
                fill={isPending ? '#ffb454' : isReveal ? '#4ade80' : color || 'var(--geo-pin, #7d8bb0)'}
                stroke={g || isReveal || isPending ? '#fff' : 'none'} strokeWidth="0.8" style={NON_SCALING}
                opacity={isDisabled && !g ? 0.35 : 1} />
            </g>
          )
        })}

        {pinPt && (
          <g className="geo-pin-mark">
            <title>دولتك: {pinPt.ar}</title>
            <circle cx={pinPt.x} cy={pinPt.y} r="7" fill="none" stroke="#ffd479" strokeWidth="1.6" style={NON_SCALING} />
            <circle cx={pinPt.x} cy={pinPt.y} r="2.4" fill="#ffd479" />
          </g>
        )}

        {lastPt && last.bearing != null && !last.hit && (
          <g transform={`translate(${lastPt.x} ${lastPt.y}) rotate(${last.bearing})`}>
            <path d="M0,-16 L4,-7 L1,-7 L1,0 L-1,0 L-1,-7 L-4,-7 Z" fill="#fff" stroke="#0008" strokeWidth="0.4" style={NON_SCALING} />
          </g>
        )}
      </>
    )
  }, [guesses, onPick, selectable, revealIso, pinIso, pendingIso, disabledIsos])

  return (
    <div className="geo-map-wrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={`geo-map${drag.current ? ' grabbing' : ''}`}
        role="img"
        aria-label="خريطة العالم"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <rect x="0" y="0" width={W} height={H} fill="var(--geo-sea, #16203a)" />
        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          {content}
        </g>
      </svg>

      <div className="geo-map-ctrl">
        <button type="button" onClick={() => zoomAt(1.5)} aria-label="تكبير">＋</button>
        <button type="button" onClick={() => zoomAt(1 / 1.5)} aria-label="تصغير">－</button>
        <button type="button" onClick={() => setView({ k: 1, x: 0, y: 0 })} aria-label="إعادة">⟳</button>
      </div>
    </div>
  )
}
