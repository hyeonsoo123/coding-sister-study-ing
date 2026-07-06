// Firebase Realtime Database 연결 (ES 모듈)
// 다른 스크립트(todo.js 등)는 일반 스크립트라서, 여기서 window.todoDB로 노출해준다.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
    getDatabase,
    ref,
    onValue,
    push,
    update,
    remove
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";

// 설정이 아직 비어있으면 안내만 하고 중단
if (!window.firebaseConfig || window.firebaseConfig.apiKey.startsWith("YOUR_")) {
    console.error("[firebase] js/firebase-config.js에 Firebase 콘솔의 설정값을 채워주세요.");
    document.addEventListener("DOMContentLoaded", () => {
        const todoList = document.getElementById("todoList");
        if (todoList) {
            todoList.innerHTML =
                '<p class="text-center text-red-500 py-8">⚠️ Firebase 설정이 필요합니다.<br>js/firebase-config.js를 채워주세요.</p>';
        }
    });
} else {
    const app = initializeApp(window.firebaseConfig);
    const db = getDatabase(app);
    const todosRef = ref(db, "todos");

    window.todoDB = {
        // todos 전체를 구독 — 데이터가 바뀔 때마다 callback(배열) 호출
        subscribe(callback) {
            onValue(todosRef, (snapshot) => {
                const data = snapshot.val() || {};
                // push 키는 시간순 정렬이므로, 뒤집으면 최신 항목이 위로 온다
                const list = Object.entries(data)
                    .map(([id, todo]) => ({ id, ...todo }))
                    .reverse();
                callback(list);
            }, (error) => {
                console.error("[firebase] 데이터 구독 실패:", error);
                const todoList = document.getElementById("todoList");
                if (todoList) {
                    todoList.innerHTML =
                        '<p class="text-center text-red-500 py-8">⚠️ DB 연결에 실패했습니다. 데이터베이스 규칙(Rules)을 확인해주세요.</p>';
                }
            });
        },
        add(todo) {
            return push(todosRef, todo);
        },
        update(id, fields) {
            return update(ref(db, `todos/${id}`), fields);
        },
        // 이전 버전을 해당 일정의 history 밑에 스냅샷으로 저장
        pushHistory(id, entry) {
            return push(ref(db, `todos/${id}/history`), entry);
        },
        remove(id) {
            return remove(ref(db, `todos/${id}`));
        }
    };
}
