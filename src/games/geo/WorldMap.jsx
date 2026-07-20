// خريطة العالم — تحريك/تكبير عبر CSS transform (مسرّع بالGPU) بمستمعات pointer أصلية لأقصى سلاسة.
// الخريطة تُرسم مرة واحدة، والتفاعل يغيّر transform مباشرةً بدون إعادة رسم React.
import { useMemo, useRef, useEffect } from 'react'
import { geoEquirectangular, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import landTopo from 'world-atlas/land-110m.json'
import { COUNTRIES } from './countries'

const W = 720
const H = 360

const projection = geoEquirectangular().fitSize([W, H], { type: 'Sphere' })
const landGeo = feature(landTopo, landTopo.objects.land)
const LAND_D = geoPath(projection)(landGeo)

const POINTS = COUNTRIES.map((c) => {
  const [x, y] = projection([c.lng, c.lat])
  return { ...c, x, y }
})

const HEAT_COLOR = { hit: '#4ade80', hot: '#ff6b81', warm: '#ffb454', cool: '#6aa9ff', cold: '#8b7bff' }
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const MAX_K = 8

export default function WorldMap({
  guesses = [], onPick, selectable = true, revealIso = null,
  pinIso = null, pendingIso = null, disabledIsos = [],
}) {
  const wrapRef = useRef(null)
  const svgRef = useRef(null)
  const view = useRef({ k: 1, tx: 0, ty: 0 })
  const panned = useRef(false)
  const api = useRef({})

  // تفاعل التحريك/التكبير عبر مستمعات pointer أصلية (تعمل مع اللمس والفأرة بسلاسة)
  useEffect(() => {
    const el = wrapRef.current
    const svg = svgRef.current
    if (!el || !svg) return

    const size = () => { const r = el.getBoundingClientRect(); return [r.width, r.height] }
    const clampView = () => {
      const [w, h] = size(); const v = view.current
      v.tx = clamp(v.tx, w * (1 - v.k), 0)
      v.ty = clamp(v.ty, h * (1 - v.k), 0)
    }
    const apply = () => {
      const v = view.current
      svg.style.transform = `translate3d(${v.tx}px, ${v.ty}px, 0) scale(${v.k})`
    }
    const zoomAtPoint = (factor, cx, cy) => {
      const v = view.current
      const nk = clamp(v.k * factor, 1, MAX_K)
      const wx = (cx - v.tx) / v.k
      const wy = (cy - v.ty) / v.k
      v.k = nk; v.tx = cx - wx * nk; v.ty = cy - wy * nk
      clampView(); apply()
    }

    api.current.zoomCenter = (f) => { const [w, h] = size(); zoomAtPoint(f, w / 2, h / 2) }
    api.current.reset = () => { view.current = { k: 1, tx: 0, ty: 0 }; apply() }
    apply()

    let drag = null
    let raf = 0
    const onMove = (e) => {
      if (!drag) return
      const dx = e.clientX - drag.x
      const dy = e.clientY - drag.y
      if (Math.abs(dx) + Math.abs(dy) > 3) panned.current = true
      drag.x = e.clientX; drag.y = e.clientY
      const v = view.current
      v.tx += dx; v.ty += dy
      clampView()
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; apply() })
    }
    const onUp = () => {
      drag = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    const onDown = (e) => {
      if (e.button != null && e.button > 0) return
      drag = { x: e.clientX, y: e.clientY }
      panned.current = false
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    }
    const onWheel = (e) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      zoomAtPoint(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top)
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('wheel', onWheel)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  const pick = (iso, isDisabled) => {
    if (panned.current) return
    if (!selectable || isDisabled) return
    onPick?.(iso)
  }

  // المحتوى الثابت — يُبنى عند تغيّر الحالة فقط، لا علاقة له بالتحريك/التكبير
  const content = useMemo(() => {
    const disabled = new Set(disabledIsos)
    const guessMap = {}
    for (const g of guesses) guessMap[g.iso] = g
    const last = guesses.length ? guesses[guesses.length - 1] : null
    const lastPt = last ? POINTS.find((p) => p.iso === last.iso) : null
    const pinPt = pinIso ? POINTS.find((p) => p.iso === pinIso) : null

    return (
      <>
        <path d={LAND_D} fill="var(--geo-land, #2b3b57)" stroke="var(--geo-land-edge, #3a4d70)" strokeWidth="0.5" />
        {POINTS.map((p) => {
          const g = guessMap[p.iso]
          const color = g ? HEAT_COLOR[g.heat] : null
          const isReveal = revealIso === p.iso
          const isPending = pendingIso === p.iso
          const isDisabled = disabled.has(p.iso)
          const canPick = selectable && !isDisabled
          const r = g || isReveal || isPending ? 3.2 : 1.7
          return (
            <g key={p.iso} className={`geo-dot${canPick ? ' pick' : ''}${isDisabled ? ' off' : ''}`} onClick={() => pick(p.iso, isDisabled)}>
              <title>{p.ar}</title>
              {(g || isReveal || isPending) && (
                <circle cx={p.x} cy={p.y} r={isPending ? 8 : isReveal ? 9 : 6}
                  fill={isPending ? '#ffb454' : isReveal ? '#4ade80' : color} opacity="0.28" />
              )}
              <circle cx={p.x} cy={p.y} r="7" fill="transparent" />
              <circle cx={p.x} cy={p.y} r={r}
                fill={isPending ? '#ffb454' : isReveal ? '#4ade80' : color || 'var(--geo-pin, #7d8bb0)'}
                stroke={g || isReveal || isPending ? '#fff' : 'none'} strokeWidth="0.8"
                opacity={isDisabled && !g ? 0.35 : 1} />
            </g>
          )
        })}
        {pinPt && (
          <g>
            <title>دولتك: {pinPt.ar}</title>
            <circle cx={pinPt.x} cy={pinPt.y} r="7" fill="none" stroke="#ffd479" strokeWidth="1.6" />
            <circle cx={pinPt.x} cy={pinPt.y} r="2.4" fill="#ffd479" />
          </g>
        )}
        {lastPt && last.bearing != null && !last.hit && (
          <g transform={`translate(${lastPt.x} ${lastPt.y}) rotate(${last.bearing})`}>
            <path d="M0,-16 L4,-7 L1,-7 L1,0 L-1,0 L-1,-7 L-4,-7 Z" fill="#fff" stroke="#0008" strokeWidth="0.4" />
          </g>
        )}
      </>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guesses, onPick, selectable, revealIso, pinIso, pendingIso, disabledIsos])

  return (
    <div className="geo-map-wrap">
      <div className="geo-map-viewport" ref={wrapRef}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="geo-map" role="img" aria-label="خريطة العالم">
          {content}
        </svg>
      </div>
      <div className="geo-map-ctrl">
        <button type="button" onClick={() => api.current.zoomCenter?.(1.6)} aria-label="تكبير">＋</button>
        <button type="button" onClick={() => api.current.zoomCenter?.(1 / 1.6)} aria-label="تصغير">－</button>
        <button type="button" onClick={() => api.current.reset?.()} aria-label="إعادة">⟳</button>
      </div>
    </div>
  )
}
