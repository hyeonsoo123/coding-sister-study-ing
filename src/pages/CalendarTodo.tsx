// ============================================================
//  캘린더 · TODO 앱 (기존 index.html + calendar.js + todo.js + app.js 이식)
//  Firebase Realtime DB 구독으로 실시간 동기화
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBodyClass } from '../hooks/useBodyClass'
import { todoDB, type Todo } from '../lib/firebase'

// 로컬 시간 기준 YYYY-MM-DD (UTC 변환으로 인한 하루 밀림 방지)
function formatDateLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
function isSameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}
// "2026. 7. 2. 오후 3:00:00" → "7. 2. 오후 3:00"
function formatTimeShort(str?: string): string {
  return String(str || '')
    .replace(/^\d{4}\.\s*/, '')
    .replace(/((오전|오후)\s\d{1,2}:\d{2}):\d{2}/, '$1')
}

type Filter = 'all' | 'active' | 'completed'

export default function CalendarTodo() {
  useBodyClass('plain-bg')

  const [todos, setTodos] = useState<Todo[]>([])
  const [loaded, setLoaded] = useState(false)
  const [dbError, setDbError] = useState(false)
  const [viewDate, setViewDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [filter, setFilter] = useState<Filter>('all')
  const [mobileTab, setMobileTab] = useState<'calendar' | 'todo'>('calendar')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)

  // 입력 폼
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [titleError, setTitleError] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  // Firebase 구독
  useEffect(() => {
    const unsub = todoDB.subscribe(
      (list) => {
        setTodos(list)
        setLoaded(true)
      },
      () => setDbError(true),
    )
    return () => unsub()
  }, [])

  const selectedStr = formatDateLocal(selectedDate)
  const todosForDate = useMemo(() => todos.filter((t) => t.date === selectedStr), [todos, selectedStr])

  const counts = {
    all: todosForDate.length,
    active: todosForDate.filter((t) => !t.completed).length,
    completed: todosForDate.filter((t) => t.completed).length,
  }

  const filtered = useMemo(() => {
    const list = todosForDate.filter((t) => {
      if (filter === 'active') return !t.completed
      if (filter === 'completed') return t.completed
      return true
    })
    return [...list].sort((a, b) => (a.completed !== b.completed ? (a.completed ? 1 : -1) : 0))
  }, [todosForDate, filter])

  // ---------- 액션 ----------
  const addTodo = () => {
    if (!title.trim()) {
      setTitleError(true)
      titleRef.current?.focus()
      return
    }
    todoDB.add({
      title: title.trim(),
      description: desc.trim(),
      completed: false,
      date: selectedStr,
      createdAt: new Date().toLocaleString('ko-KR'),
      completedAt: null,
    })
    setTitle('')
    setDesc('')
    titleRef.current?.focus()
    if (filter === 'completed') setFilter('all')
  }

  const toggleTodo = (todo: Todo) => {
    const completed = !todo.completed
    todoDB.update(todo.id, {
      completed,
      completedAt: completed ? new Date().toLocaleString('ko-KR') : null,
    })
  }

  const deleteTodo = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) todoDB.remove(id)
  }

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  // ---------- 캘린더 ----------
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const today = new Date()

  const todoStatusOnDate = (date: Date): 'pending' | 'done' | null => {
    const ds = formatDateLocal(date)
    const day = todos.filter((t) => t.date === ds)
    if (day.length === 0) return null
    return day.every((t) => t.completed) ? 'done' : 'pending'
  }

  const changeMonth = (delta: number) => setViewDate(new Date(year, month + delta, 1))

  const selectedLabel = selectedDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  const calendar = (
    <Calendar
      year={year}
      month={month}
      today={today}
      selectedDate={selectedDate}
      statusOf={todoStatusOnDate}
      onPrev={() => changeMonth(-1)}
      onNext={() => changeMonth(1)}
      onSelect={(d) => setSelectedDate(d)}
    />
  )

  const summary = <Summary year={year} month={month} todos={todos} />

  return (
    <div className="min-h-screen font-sans">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600">📅 Coding Sister 캘린더</h1>
            <div className="flex gap-2 shrink-0">
              <Link
                to="/movie"
                className="inline-flex items-center justify-center px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-semibold min-h-[44px] text-sm"
              >
                🎬 영화
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition font-semibold min-h-[44px] text-sm"
              >
                👤 내 정보
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 모바일 탭 */}
        <div className="lg:hidden mb-6">
          <div className="flex gap-2 bg-gray-200 rounded-lg p-1">
            {(['calendar', 'todo'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setMobileTab(tab)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition min-h-[44px] ${
                  mobileTab === tab ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {tab === 'calendar' ? '📅 캘린더' : '✅ TODO'}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-3 gap-6">
          {/* 캘린더 + 요약 */}
          <div className={`${mobileTab === 'calendar' ? '' : 'hidden'} lg:block mb-6 lg:mb-0`}>
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">{calendar}</div>
              {summary}
            </div>
          </div>

          {/* TODO */}
          <div className={`${mobileTab === 'todo' ? '' : 'hidden'} lg:block lg:col-span-2`}>
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">{selectedLabel} 일정</h2>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">일정 제목</label>
                <input
                  ref={titleRef}
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    setTitleError(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) addTodo()
                  }}
                  placeholder={titleError ? '⚠️ 일정 제목을 입력해주세요' : '일정 제목을 입력하세요...'}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-base min-h-[44px] ${
                    titleError ? 'border-red-400 ring-2 ring-red-300' : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  상세 설명 <span className="text-gray-400 font-normal">(선택)</span>
                </label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="일정에 대한 설명을 입력하세요..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base min-h-[120px] resize-none"
                />
              </div>
              <button
                onClick={addTodo}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold min-h-[44px]"
              >
                ➕ 일정 등록
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b">
                {(['all', 'active', 'completed'] as const).map((f) => {
                  const labels = { all: '전체', active: '진행중', completed: '완료' }
                  return (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-3 sm:py-2 rounded-full font-semibold min-h-[44px] text-sm ${
                        filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {counts[f] > 0 ? `${labels[f]} ${counts[f]}` : labels[f]}
                    </button>
                  )
                })}
              </div>

              <div className="space-y-4">
                {!loaded && !dbError && <p className="text-center text-gray-500 py-8">⏳ 불러오는 중...</p>}
                {dbError && (
                  <p className="text-center text-red-500 py-8">
                    ⚠️ DB 연결에 실패했습니다. 데이터베이스 규칙(Rules)을 확인해주세요.
                  </p>
                )}
                {loaded && !dbError && filtered.length === 0 && (
                  <EmptyTodos filter={filter} hasAny={counts.all > 0} />
                )}
                {loaded &&
                  !dbError &&
                  filtered.map((todo) =>
                    todo.id === editingId ? (
                      <EditCard
                        key={todo.id}
                        todo={todo}
                        onCancel={() => setEditingId(null)}
                        onSave={(newTitle, newDesc) => {
                          const changed = todo.title !== newTitle || (todo.description || '') !== newDesc
                          if (changed) {
                            todoDB.pushHistory(todo.id, {
                              title: todo.title,
                              description: todo.description || '',
                              editedAt: new Date().toLocaleString('ko-KR'),
                            })
                            todoDB.update(todo.id, {
                              title: newTitle,
                              description: newDesc,
                              updatedAt: new Date().toLocaleString('ko-KR'),
                            })
                          }
                          setEditingId(null)
                        }}
                      />
                    ) : (
                      <TodoCard
                        key={todo.id}
                        todo={todo}
                        expanded={expanded.has(todo.id)}
                        onToggleExpand={() => toggleExpand(todo.id)}
                        onToggle={() => toggleTodo(todo)}
                        onDelete={() => deleteTodo(todo.id)}
                        onEdit={() => {
                          setEditingId(todo.id)
                          setExpanded((prev) => new Set(prev).add(todo.id))
                        }}
                      />
                    ),
                  )}

                {loaded && !dbError && filtered.length > 0 && (
                  <div className="mt-6 pt-4 border-t text-sm text-gray-600">
                    <div className="flex justify-between items-center mb-2">
                      <span>진행률</span>
                      <span>
                        <strong>{counts.completed}</strong> / {counts.all} 완료 ·{' '}
                        {Math.round((counts.completed / counts.all) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((counts.completed / counts.all) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ---------- 캘린더 ----------
function Calendar({
  year,
  month,
  today,
  selectedDate,
  statusOf,
  onPrev,
  onNext,
  onSelect,
}: {
  year: number
  month: number
  today: Date
  selectedDate: Date
  statusOf: (d: Date) => 'pending' | 'done' | null
  onPrev: () => void
  onNext: () => void
  onSelect: (d: Date) => void
}) {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()

  const cells: React.ReactNode[] = []
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push(
      <button
        key={`p${i}`}
        disabled
        className="aspect-square p-0 text-gray-400 text-xs sm:text-sm rounded flex flex-col items-center justify-center leading-none"
      >
        <span>{daysInPrev - i}</span>
        <span className="w-1 h-1 mt-0.5" />
      </button>,
    )
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day)
    const isToday = isSameDay(dateObj, today)
    const isSelected = isSameDay(dateObj, selectedDate)
    const status = statusOf(dateObj)
    let cls = 'aspect-square p-0 text-xs sm:text-sm font-semibold rounded transition flex flex-col items-center justify-center leading-none'
    if (isSelected) cls += ' bg-indigo-600 text-white ring-2 ring-indigo-400'
    else if (isToday) cls += ' bg-blue-100 text-indigo-600 border-2 border-indigo-600'
    else cls += ' bg-gray-100 text-gray-800 hover:bg-gray-200'
    let dot = 'bg-transparent'
    if (status) dot = isSelected ? 'bg-white' : status === 'done' ? 'bg-green-500' : 'bg-indigo-500'
    cells.push(
      <button key={day} className={cls} onClick={() => onSelect(dateObj)}>
        <span>{day}</span>
        <span className={`w-1 h-1 rounded-full mt-0.5 ${dot}`} />
      </button>,
    )
  }
  const remaining = 42 - cells.length
  for (let day = 1; day <= remaining; day++) {
    cells.push(
      <button
        key={`n${day}`}
        disabled
        className="aspect-square p-0 text-gray-400 text-xs sm:text-sm rounded flex flex-col items-center justify-center leading-none"
      >
        <span>{day}</span>
        <span className="w-1 h-1 mt-0.5" />
      </button>,
    )
  }

  return (
    <div id="calendar">
      <div className="flex justify-between items-center mb-3 gap-2">
        <button
          onClick={onPrev}
          className="px-2 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold flex items-center justify-center flex-shrink-0"
        >
          ◀️
        </button>
        <h3 className="text-base sm:text-lg font-bold text-gray-800 text-center flex-1">
          📅 {year}년 {month + 1}월
        </h3>
        <button
          onClick={onNext}
          className="px-2 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold flex items-center justify-center flex-shrink-0"
        >
          ▶️
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-2">
        {dayNames.map((d) => (
          <div key={d} className="text-center font-semibold text-gray-600 py-1 text-xs sm:text-sm">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">{cells}</div>
      <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          진행중
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          완료
        </span>
      </div>
    </div>
  )
}

// ---------- 월 요약 ----------
function Summary({ year, month, todos }: { year: number; month: number; todos: Todo[] }) {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthTodos = todos.filter((t) => t.date && t.date.startsWith(prefix))
  const total = monthTodos.length
  const done = monthTodos.filter((t) => t.completed).length
  const pending = total - done
  const ratio = total ? Math.round((done / total) * 100) : 0

  return (
    <div className="bg-white rounded-lg shadow-lg p-5">
      <h3 className="text-sm font-bold text-gray-700 mb-4">
        📊 {year}년 {month + 1}월 요약
      </h3>
      {total === 0 ? (
        <p className="text-sm text-gray-400 text-center py-2">이번 달 등록된 일정이 없어요</p>
      ) : (
        <>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">전체 일정</span>
              <span className="font-semibold text-gray-800">{total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">완료</span>
              <span className="font-semibold text-green-600">{done}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">진행중</span>
              <span className="font-semibold text-indigo-600">{pending}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1 text-xs text-gray-500">
              <span>완료율</span>
              <span className="font-semibold">{ratio}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${ratio}%` }} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ---------- 빈 목록 안내 ----------
function EmptyTodos({ filter, hasAny }: { filter: Filter; hasAny: boolean }) {
  let message = (
    <>
      이 날짜에 일정이 없습니다.
      <br />
      위 입력창에서 첫 일정을 등록해보세요 ✍️
    </>
  )
  if (filter === 'active' && hasAny) message = <>진행중인 일정이 없어요. 전부 완료! 🎉</>
  else if (filter === 'completed' && hasAny)
    message = (
      <>
        아직 완료한 일정이 없어요.
        <br />
        일정의 스케줄 완료 버튼을 눌러보세요
      </>
    )
  return <p className="text-center text-gray-500 py-8 leading-relaxed">{message}</p>
}

// ---------- TODO 카드 ----------
function TodoCard({
  todo,
  expanded,
  onToggleExpand,
  onToggle,
  onDelete,
  onEdit,
}: {
  todo: Todo
  expanded: boolean
  onToggleExpand: () => void
  onToggle: () => void
  onDelete: () => void
  onEdit: () => void
}) {
  const hasDesc = !!todo.description
  const history = todo.history ? Object.values(todo.history).reverse() : []
  const hasExtra = hasDesc || history.length > 0

  return (
    <div
      className={`p-4 rounded-xl border transition ${
        todo.completed ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-white border-gray-200 hover:border-indigo-200 hover:shadow-sm'
      }`}
    >
      <div
        className={hasExtra ? 'cursor-pointer' : ''}
        onClick={hasExtra ? onToggleExpand : undefined}
        title={hasExtra ? (expanded ? '접기' : '펼치기') : undefined}
      >
        <div className="flex items-center justify-between gap-3">
          <p
            className={`flex-1 min-w-0 text-base sm:text-lg font-semibold text-gray-800 break-words ${
              todo.completed ? 'line-through text-gray-400' : ''
            }`}
          >
            {todo.title}
          </p>
          {hasExtra && (
            <span className={`shrink-0 text-gray-400 text-xs transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 mt-1 text-xs text-gray-400">
          <span>{formatTimeShort(todo.createdAt)} 등록</span>
          {todo.updatedAt && <span className="text-indigo-500">· {formatTimeShort(todo.updatedAt)} 수정</span>}
          {todo.completedAt && <span className="text-green-600 font-medium">· {formatTimeShort(todo.completedAt)} 완료</span>}
        </div>
      </div>

      {expanded && (
        <>
          {hasDesc && (
            <p className="mt-3 text-sm text-gray-600 break-words whitespace-pre-line bg-gray-50 rounded-lg p-3">
              {todo.description}
            </p>
          )}
          {history.length > 0 && (
            <div className="mt-3 border-t border-dashed border-gray-200 pt-3">
              <p className="text-xs font-semibold text-gray-500 mb-2">📝 수정 이력 {history.length}개</p>
              <ul className="space-y-2">
                {history.map((h, i) => (
                  <li key={i} className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2">
                    <span className="text-gray-500">{formatTimeShort(h.editedAt)} 이전</span>
                    <p className="text-gray-600 mt-0.5 break-words">{h.title}</p>
                    {h.description && (
                      <p className="text-gray-400 mt-0.5 break-words whitespace-pre-line">{h.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={onToggle}
          className={`px-4 py-2 rounded-lg transition font-semibold text-sm min-h-[44px] ${
            todo.completed ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
          }`}
        >
          {todo.completed ? '완료 취소' : '스케줄 완료'}
        </button>
        {!todo.completed && (
          <button
            onClick={onEdit}
            className="px-4 py-2 rounded-lg transition font-semibold text-sm min-h-[44px] bg-gray-100 text-gray-500 hover:bg-gray-200"
          >
            수정
          </button>
        )}
        <button
          onClick={onDelete}
          className="px-4 py-2 rounded-lg transition font-semibold text-sm min-h-[44px] bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600"
        >
          삭제
        </button>
      </div>
    </div>
  )
}

// ---------- 편집 카드 ----------
function EditCard({
  todo,
  onCancel,
  onSave,
}: {
  todo: Todo
  onCancel: () => void
  onSave: (title: string, desc: string) => void
}) {
  const [t, setT] = useState(todo.title)
  const [d, setD] = useState(todo.description || '')
  const [err, setErr] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    ref.current?.focus()
    const el = ref.current
    if (el) el.setSelectionRange(el.value.length, el.value.length)
  }, [])
  const save = () => {
    if (!t.trim()) {
      setErr(true)
      ref.current?.focus()
      return
    }
    onSave(t.trim(), d.trim())
  }
  return (
    <div className="p-4 rounded-xl border-2 border-indigo-300 bg-white shadow-sm">
      <input
        ref={ref}
        type="text"
        value={t}
        onChange={(e) => {
          setT(e.target.value)
          setErr(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            save()
          } else if (e.key === 'Escape') onCancel()
        }}
        placeholder="일정 제목"
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-base font-semibold min-h-[44px] ${
          err ? 'border-red-400 ring-2 ring-red-300' : 'border-gray-300 focus:ring-indigo-500'
        }`}
      />
      <textarea
        value={d}
        onChange={(e) => setD(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel()
        }}
        placeholder="상세 설명 (선택)"
        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm min-h-[80px] resize-none"
      />
      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={save}
          className="px-4 py-2 rounded-lg transition font-semibold text-sm min-h-[44px] bg-indigo-600 text-white hover:bg-indigo-700"
        >
          저장
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg transition font-semibold text-sm min-h-[44px] bg-gray-100 text-gray-500 hover:bg-gray-200"
        >
          취소
        </button>
      </div>
    </div>
  )
}
