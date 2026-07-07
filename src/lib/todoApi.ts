// ============================================================
//  TODO 데이터 접근 계층 — MongoDB(Atlas) 백엔드(/api/todos) 호출
//  기존 Firebase 버전과 동일한 인터페이스(todoDB)를 유지해 화면 코드는 그대로.
//  실시간 구독(onValue) 대신 폴링(5초) + 변경 즉시 갱신으로 동기화.
// ============================================================

export interface TodoHistory {
  title: string
  description: string
  editedAt: string
}

export interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  date: string
  createdAt: string
  completedAt?: string | null
  updatedAt?: string
  history?: TodoHistory[]
}

const API = '/api/todos'
const POLL_MS = 5000

type Sub = { cb: (list: Todo[]) => void; onError?: (e: Error) => void }
let subs: Sub[] = []
let timer: ReturnType<typeof setInterval> | undefined

async function fetchList(): Promise<Todo[]> {
  const r = await fetch(API)
  if (!r.ok) throw new Error(`GET ${API} → ${r.status}`)
  return r.json()
}

// 서버에서 목록을 다시 읽어 모든 구독자에게 전달
async function refresh() {
  try {
    const list = await fetchList()
    subs.forEach((s) => s.cb(list))
  } catch (e) {
    console.error('[todoApi] 목록 조회 실패:', e)
    subs.forEach((s) => s.onError?.(e as Error))
  }
}

async function send(url: string, opts: RequestInit) {
  const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts })
  if (!r.ok) throw new Error(`${opts.method} ${url} → ${r.status}`)
  return r
}

// 변경 요청 실패 시 화면에 에러를 알리기 위한 공통 처리
async function mutate(action: () => Promise<unknown>, label: string) {
  try {
    await action()
    await refresh()
  } catch (e) {
    console.error(`[todoApi] ${label} 실패:`, e)
    subs.forEach((s) => s.onError?.(e as Error))
  }
}

export const todoDB = {
  // 목록 구독 — 즉시 1회 조회 후 POLL_MS 주기로 재조회. 반환값은 구독 해제 함수.
  subscribe(callback: (list: Todo[]) => void, onError?: (e: Error) => void) {
    const entry: Sub = { cb: callback, onError }
    subs.push(entry)
    refresh()
    if (!timer) timer = setInterval(refresh, POLL_MS)
    return () => {
      subs = subs.filter((s) => s !== entry)
      if (subs.length === 0 && timer) {
        clearInterval(timer)
        timer = undefined
      }
    }
  },

  add(todo: Omit<Todo, 'id'>) {
    return mutate(() => send(API, { method: 'POST', body: JSON.stringify(todo) }), 'add')
  },

  update(id: string, fields: Partial<Todo>) {
    return mutate(
      () => send(`${API}/${id}`, { method: 'PATCH', body: JSON.stringify({ set: fields }) }),
      'update',
    )
  },

  pushHistory(id: string, entry: TodoHistory) {
    return mutate(
      () => send(`${API}/${id}`, { method: 'PATCH', body: JSON.stringify({ pushHistory: entry }) }),
      'pushHistory',
    )
  },

  remove(id: string) {
    return mutate(() => send(`${API}/${id}`, { method: 'DELETE' }), 'remove')
  },
}
