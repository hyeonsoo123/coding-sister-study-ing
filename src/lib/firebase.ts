// ============================================================
//  Firebase Realtime Database 연결 (기존 firebase-config.js + firebase.js 이식)
//  ※ 웹용 apiKey는 비밀키가 아니라 프로젝트 식별자 — 커밋 가능.
//     데이터 보호는 Realtime Database "규칙(Rules)"에서 담당.
// ============================================================
import { initializeApp } from 'firebase/app'
import {
  getDatabase,
  ref,
  onValue,
  push,
  update as dbUpdate,
  remove as dbRemove,
} from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyAnluAKuwtlHB0J1Cl6wP0l1Bgov63X8o8',
  authDomain: 'coding-sister-study.firebaseapp.com',
  databaseURL: 'https://coding-sister-study-default-rtdb.firebaseio.com',
  projectId: 'coding-sister-study',
  storageBucket: 'coding-sister-study.firebasestorage.app',
  messagingSenderId: '883091078030',
  appId: '1:883091078030:web:804e6db5d830932e2e02df',
}

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
  history?: Record<string, TodoHistory>
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)
const todosRef = ref(db, 'todos')

export const todoDB = {
  // todos 전체 구독 — 데이터가 바뀔 때마다 callback(배열) 호출. 최신 항목이 위로.
  subscribe(callback: (list: Todo[]) => void, onError?: (e: Error) => void) {
    return onValue(
      todosRef,
      (snapshot) => {
        const data = (snapshot.val() as Record<string, Omit<Todo, 'id'>>) || {}
        const list = Object.entries(data)
          .map(([id, todo]) => ({ id, ...todo }) as Todo)
          .reverse()
        callback(list)
      },
      (error) => {
        console.error('[firebase] 데이터 구독 실패:', error)
        onError?.(error as Error)
      },
    )
  },
  add(todo: Omit<Todo, 'id'>) {
    return push(todosRef, todo)
  },
  update(id: string, fields: Partial<Todo>) {
    return dbUpdate(ref(db, `todos/${id}`), fields)
  },
  pushHistory(id: string, entry: TodoHistory) {
    return push(ref(db, `todos/${id}/history`), entry)
  },
  remove(id: string) {
    return dbRemove(ref(db, `todos/${id}`))
  },
}
