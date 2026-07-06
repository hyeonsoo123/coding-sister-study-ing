// 테트리스 미니게임 (기존 tetris.js 이식) — canvas 기반
import { useCallback, useEffect, useRef, useState } from 'react'

const ROWS = 20
const COLS = 10
const BLOCK_SIZE = 30

interface Piece {
  shape: number[][]
  color: string
}

const PIECES: Piece[] = [
  { shape: [[1, 1, 1, 1]], color: '#00FFFF' }, // I
  { shape: [[1, 1], [1, 1]], color: '#FFFF00' }, // O
  { shape: [[0, 1, 0], [1, 1, 1]], color: '#9933FF' }, // T
  { shape: [[1, 0, 0], [1, 1, 1]], color: '#0000FF' }, // J
  { shape: [[0, 0, 1], [1, 1, 1]], color: '#FFA500' }, // L
  { shape: [[0, 1, 1], [1, 1, 0]], color: '#00FF00' }, // S
  { shape: [[1, 1, 0], [0, 1, 1]], color: '#FF0000' }, // Z
]

type Cell = 0 | string
const emptyGrid = (): Cell[][] => Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 0 as Cell))
const randomPiece = (): Piece => JSON.parse(JSON.stringify(PIECES[Math.floor(Math.random() * PIECES.length)]))

export default function Tetris() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)

  const grid = useRef<Cell[][]>(emptyGrid())
  const piece = useRef<Piece | null>(null)
  const pos = useRef({ x: 0, y: 0 })
  const scoreN = useRef(0)
  const linesN = useRef(0)
  const levelN = useRef(1)
  const running = useRef(false)
  const paused = useRef(false)
  const dropCounter = useRef(0)
  const lastTime = useRef(0)
  const rafId = useRef(0)

  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [startLabel, setStartLabel] = useState('🎮 게임 시작')

  const drawBlock = (x: number, y: number, color: string) => {
    const ctx = ctxRef.current!
    ctx.fillStyle = color
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 2, BLOCK_SIZE - 2)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 2, BLOCK_SIZE - 2)
  }

  const drawGrid = () => {
    const ctx = ctxRef.current!
    const canvas = canvasRef.current!
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)'
    ctx.lineWidth = 1
    for (let i = 0; i <= ROWS; i++) {
      ctx.beginPath()
      ctx.moveTo(0, i * BLOCK_SIZE)
      ctx.lineTo(canvas.width, i * BLOCK_SIZE)
      ctx.stroke()
    }
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath()
      ctx.moveTo(i * BLOCK_SIZE, 0)
      ctx.lineTo(i * BLOCK_SIZE, canvas.height)
      ctx.stroke()
    }
  }

  const drawBoard = useCallback(() => {
    drawGrid()
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (grid.current[row][col]) drawBlock(col, row, grid.current[row][col] as string)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const drawCurrent = () => {
    const p = piece.current
    if (!p) return
    p.shape.forEach((row, y) =>
      row.forEach((cell, x) => {
        if (cell) drawBlock(pos.current.x + x, pos.current.y + y, p.color)
      }),
    )
  }

  const canPlace = (p: Piece, at: { x: number; y: number }) =>
    p.shape.every((row, y) =>
      row.every((cell, x) => {
        if (!cell) return true
        const nY = at.y + y
        const nX = at.x + x
        if (nX < 0 || nX >= COLS || nY >= ROWS) return false
        if (nY < 0) return true
        return grid.current[nY][nX] === 0
      }),
    )

  const clearLines = () => {
    let cleared = 0
    for (let row = ROWS - 1; row >= 0; row--) {
      if (grid.current[row].every((c) => c !== 0)) {
        grid.current.splice(row, 1)
        grid.current.unshift(Array.from({ length: COLS }, () => 0 as Cell))
        cleared++
        row++
      }
    }
    if (cleared > 0) {
      linesN.current += cleared
      scoreN.current += cleared * 100 * levelN.current
      levelN.current = Math.floor(linesN.current / 10) + 1
      setScore(scoreN.current)
      setLines(linesN.current)
      setLevel(levelN.current)
    }
  }

  const spawn = () => {
    piece.current = randomPiece()
    pos.current = { x: Math.floor(COLS / 2) - 1, y: 0 }
    if (!canPlace(piece.current, pos.current)) {
      running.current = false
      setStartLabel('🎮 게임 오버! 다시 시작')
      alert(`게임 오버!\n점수: ${scoreN.current}\n라인: ${linesN.current}`)
    }
  }

  const placePiece = () => {
    const p = piece.current!
    p.shape.forEach((row, y) =>
      row.forEach((cell, x) => {
        if (cell) {
          const nY = pos.current.y + y
          const nX = pos.current.x + x
          if (nY >= 0) grid.current[nY][nX] = p.color
        }
      }),
    )
    clearLines()
    spawn()
  }

  const moveDown = () => {
    if (canPlace(piece.current!, { x: pos.current.x, y: pos.current.y + 1 })) pos.current.y++
    else placePiece()
  }

  const rotate = () => {
    const p = piece.current!
    const rotated: Piece = {
      ...p,
      shape: p.shape[0].map((_, i) => p.shape.map((row) => row[i]).reverse()),
    }
    if (canPlace(rotated, pos.current)) piece.current = rotated
  }

  const update = useCallback(
    (time = 0) => {
      if (!running.current) return
      if (!lastTime.current) lastTime.current = time
      if (paused.current) {
        lastTime.current = time
        rafId.current = requestAnimationFrame(update)
        return
      }
      const delta = time - lastTime.current
      lastTime.current = time
      dropCounter.current += delta
      const dropInterval = Math.max(80, 500 - (levelN.current - 1) * 50)
      if (dropCounter.current >= dropInterval) {
        moveDown()
        dropCounter.current = 0
      }
      drawBoard()
      drawCurrent()
      rafId.current = requestAnimationFrame(update)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [drawBoard],
  )

  const startGame = useCallback(() => {
    grid.current = emptyGrid()
    scoreN.current = 0
    linesN.current = 0
    levelN.current = 1
    running.current = true
    paused.current = false
    dropCounter.current = 0
    lastTime.current = 0
    setScore(0)
    setLines(0)
    setLevel(1)
    spawn()
    setStartLabel('⏸️ 일시정지')
    rafId.current = requestAnimationFrame(update)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [update])

  const togglePause = useCallback(() => {
    if (!running.current) {
      startGame()
    } else {
      paused.current = !paused.current
      setStartLabel(paused.current ? '▶️ 계속' : '⏸️ 일시정지')
    }
  }, [startGame])

  // 초기 드로우 + 정리
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    ctxRef.current = canvas.getContext('2d')
    drawBoard()
    return () => cancelAnimationFrame(rafId.current)
  }, [drawBoard])

  // 키보드
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!running.current) return
      const key = e.key.toLowerCase()
      let handled = false
      switch (key) {
        case 'arrowleft':
          if (canPlace(piece.current!, { x: pos.current.x - 1, y: pos.current.y })) pos.current.x--
          handled = true
          break
        case 'arrowright':
          if (canPlace(piece.current!, { x: pos.current.x + 1, y: pos.current.y })) pos.current.x++
          handled = true
          break
        case 'arrowup':
          rotate()
          handled = true
          break
        case 'arrowdown':
          moveDown()
          dropCounter.current = 0
          handled = true
          break
        case ' ':
          while (canPlace(piece.current!, { x: pos.current.x, y: pos.current.y + 1 })) pos.current.y++
          placePiece()
          handled = true
          break
        case 'p':
          togglePause()
          handled = true
          break
      }
      if (handled) e.preventDefault()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [togglePause])

  // 모바일 터치 조작
  const act = {
    left: () => running.current && !paused.current && canPlace(piece.current!, { x: pos.current.x - 1, y: pos.current.y }) && (pos.current.x--, true),
    right: () => running.current && !paused.current && canPlace(piece.current!, { x: pos.current.x + 1, y: pos.current.y }) && (pos.current.x++, true),
    rotate: () => running.current && !paused.current && rotate(),
    down: () => {
      if (!running.current || paused.current) return
      moveDown()
      dropCounter.current = 0
    },
    drop: () => {
      if (!running.current || paused.current) return
      while (canPlace(piece.current!, { x: pos.current.x, y: pos.current.y + 1 })) pos.current.y++
      placePiece()
    },
  }

  return (
    <section id="tetrisSection" className="bg-black rounded-lg shadow-lg p-6 sm:p-8 mb-8">
      <div className="text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">🧩 테트리스 미니게임</h2>
        <p className="text-gray-300 text-base sm:text-lg mb-6">클래식 테트리스를 즐겨보세요!</p>

        <div className="flex flex-col items-center gap-4 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-start sm:gap-6 mb-6">
          <div className="hidden sm:block sm:order-1" />
          <div className="flex justify-center order-1 sm:order-2">
            <canvas
              ref={canvasRef}
              width={300}
              height={600}
              className="border-4 border-yellow-400 bg-black max-w-full"
            />
          </div>

          <div className="lg:hidden order-2 sm:order-4 sm:col-span-3 w-full max-w-xs mx-auto select-none">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div />
              <button onClick={act.rotate} className="touch-manipulation py-4 bg-gray-800 text-white text-2xl rounded-lg active:bg-gray-600" aria-label="회전">
                🔄
              </button>
              <div />
              <button onClick={act.left} className="touch-manipulation py-4 bg-gray-800 text-white text-2xl rounded-lg active:bg-gray-600" aria-label="왼쪽 이동">
                ⬅️
              </button>
              <button onClick={act.down} className="touch-manipulation py-4 bg-gray-800 text-white text-2xl rounded-lg active:bg-gray-600" aria-label="아래로 이동">
                ⬇️
              </button>
              <button onClick={act.right} className="touch-manipulation py-4 bg-gray-800 text-white text-2xl rounded-lg active:bg-gray-600" aria-label="오른쪽 이동">
                ➡️
              </button>
            </div>
            <button onClick={act.drop} className="touch-manipulation w-full py-3 bg-yellow-500 text-black font-bold rounded-lg active:bg-yellow-400" aria-label="한 번에 내리기">
              ⏬ 한 번에 내리기
            </button>
          </div>

          <div className="order-3 sm:order-3 flex flex-col gap-3 w-full sm:gap-4 sm:w-56 sm:justify-self-start sm:self-stretch">
            <div className="flex flex-row sm:flex-col gap-3 sm:gap-4">
              <div className="bg-gray-900 rounded p-4 flex-1">
                <p className="text-gray-400 text-sm">점수</p>
                <p className="text-2xl font-bold text-yellow-400">{score}</p>
              </div>
              <div className="bg-gray-900 rounded p-4 flex-1">
                <p className="text-gray-400 text-sm">레벨</p>
                <p className="text-2xl font-bold text-cyan-400">{level}</p>
              </div>
              <div className="bg-gray-900 rounded p-4 flex-1">
                <p className="text-gray-400 text-sm">라인</p>
                <p className="text-2xl font-bold text-red-400">{lines}</p>
              </div>
            </div>
            <div className="hidden sm:block bg-gray-900 rounded p-4 text-left sm:mt-auto">
              <p className="text-white font-bold mb-2">🎮 조작법</p>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>
                  <span className="lg:hidden">버튼 또는 </span>방향키 ⬅️ ➡️: 좌우 이동
                </li>
                <li>⬆️ (또는 🔄): 회전</li>
                <li>⬇️: 빠르게 내려오기</li>
                <li>
                  <span className="lg:hidden">⏬ 버튼 / </span>스페이스: 한 번에 내리기
                </li>
                <li>P: 일시정지</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={togglePause}
          className="px-6 py-3 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition font-bold min-h-[44px]"
        >
          {startLabel}
        </button>
      </div>
    </section>
  )
}
