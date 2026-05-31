import { useState, useEffect, useMemo } from "react";
import "./App.css";

const STORAGE_KEY = "todo-reminder-data";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getStatus(dueDate, dueTime, completed) {
  if (completed) return "completed";
  if (!dueDate) return "none";
  const now = new Date();
  const due = new Date(dueDate + "T" + (dueTime || "23:59:59"));
  if (due < now) return "overdue";
  const diffHours = (due - now) / (1000 * 60 * 60);
  if (diffHours <= 24) return "due-soon";
  return "upcoming";
}

function formatRemaining(dueDate, dueTime) {
  if (!dueDate) return "";
  const now = new Date();
  const due = new Date(dueDate + "T" + (dueTime || "23:59:59"));
  const diff = due - now;
  if (diff < 0) {
    const abs = Math.abs(diff);
    const days = Math.floor(abs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((abs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `已过期 ${days} 天`;
    if (hours > 0) return `已过期 ${hours} 小时`;
    return "刚刚过期";
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `还剩 ${days} 天 ${hours} 小时`;
  if (hours > 0) return `还剩 ${hours} 小时 ${minutes} 分钟`;
  if (minutes > 0) return `还剩 ${minutes} 分钟`;
  return "即将到期";
}

function formatDateTime(date, time) {
  if (!date) return "无截止日期";
  const parts = date.split("-");
  const label = `${parts[1]}月${parts[2]}日`;
  return time ? `${label} ${time}` : label;
}

function App() {
  const [todos, setTodos] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editDueTime, setEditDueTime] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const sortedTodos = useMemo(() => {
    const list = [...todos];
    list.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      const da = new Date(a.dueDate + "T" + (a.dueTime || "23:59:59"));
      const db = new Date(b.dueDate + "T" + (b.dueTime || "23:59:59"));
      return da - db;
    });
    return list;
  }, [todos]);

  const filteredTodos = useMemo(() => {
    switch (filter) {
      case "active":
        return sortedTodos.filter((t) => !t.completed);
      case "completed":
        return sortedTodos.filter((t) => t.completed);
      case "overdue":
        return sortedTodos.filter(
          (t) => !t.completed && getStatus(t.dueDate, t.dueTime, false) === "overdue"
        );
      default:
        return sortedTodos;
    }
  }, [sortedTodos, filter]);

  const counts = useMemo(() => {
    const active = todos.filter((t) => !t.completed).length;
    const overdue = todos.filter(
      (t) => !t.completed && getStatus(t.dueDate, t.dueTime, false) === "overdue"
    ).length;
    const completed = todos.filter((t) => t.completed).length;
    return { active, overdue, completed, total: todos.length };
  }, [todos]);

  function addTodo(e) {
    e.preventDefault();
    if (!title.trim()) return;
    const newTodo = {
      id: generateId(),
      title: title.trim(),
      description: description.trim(),
      dueDate,
      dueTime,
      completed: false,
      createdAt: Date.now(),
    };
    setTodos((prev) => [newTodo, ...prev]);
    setTitle("");
    setDescription("");
    setDueDate("");
    setDueTime("");
  }

  function toggleTodo(id) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  function deleteTodo(id) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function startEdit(todo) {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDescription(todo.description);
    setEditDueDate(todo.dueDate);
    setEditDueTime(todo.dueTime);
  }

  function saveEdit(id) {
    if (!editTitle.trim()) return;
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              title: editTitle.trim(),
              description: editDescription.trim(),
              dueDate: editDueDate,
              dueTime: editDueTime,
            }
          : t
      )
    );
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function clearCompleted() {
    setTodos((prev) => prev.filter((t) => !t.completed));
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span className="logo-icon">📝</span>
          待办提醒
        </h1>
        <p className="subtitle">不再遗漏任何重要事项</p>
      </header>

      <div className="stats-bar">
        <span className="stat">总计 {counts.total}</span>
        <span className="stat stat-active">待办 {counts.active}</span>
        {counts.overdue > 0 && (
          <span className="stat stat-overdue">已过期 {counts.overdue}</span>
        )}
        <span className="stat stat-done">已完成 {counts.completed}</span>
      </div>

      <form className="todo-form" onSubmit={addTodo}>
        <input
          type="text"
          className="input-title"
          placeholder="添加新任务…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <textarea
          className="input-desc"
          placeholder="备注（可选）"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
        <div className="datetime-row">
          <input
            type="date"
            className="input-date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <input
            type="time"
            className="input-time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
          />
          <button type="submit" className="btn-add" disabled={!title.trim()}>
            + 添加
          </button>
        </div>
      </form>

      <div className="filter-tabs">
        {[
          { key: "all", label: "全部", icon: "📋" },
          { key: "active", label: "待办", icon: "⏳" },
          { key: "overdue", label: "已过期", icon: "🔴" },
          { key: "completed", label: "已完成", icon: "✅" },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            className={`filter-btn ${filter === key ? "active" : ""}`}
            onClick={() => setFilter(key)}
          >
            {icon} {label}
            {key === "active" && counts.active > 0 && (
              <span className="badge">{counts.active}</span>
            )}
            {key === "overdue" && counts.overdue > 0 && (
              <span className="badge badge-danger">{counts.overdue}</span>
            )}
          </button>
        ))}
      </div>

      <div className="todo-list">
        {filteredTodos.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🎉</span>
            <p>
              {filter === "all"
                ? "暂无任务，添加一个开始吧！"
                : filter === "active"
                ? "没有待办任务"
                : filter === "overdue"
                ? "没有过期任务，做得好！"
                : "暂无已完成任务"}
            </p>
          </div>
        ) : (
          filteredTodos.map((todo) => {
            const status = getStatus(todo.dueDate, todo.dueTime, todo.completed);
            const isEditing = editingId === todo.id;

            return (
              <div
                key={todo.id}
                className={`todo-item status-${status} ${isEditing ? "editing" : ""}`}
              >
                {isEditing ? (
                  <div className="edit-form">
                    <input
                      type="text"
                      className="edit-title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      autoFocus
                    />
                    <textarea
                      className="edit-desc"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                    />
                    <div className="edit-datetime">
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                      />
                      <input
                        type="time"
                        value={editDueTime}
                        onChange={(e) => setEditDueTime(e.target.value)}
                      />
                      <button
                        className="btn-save"
                        onClick={() => saveEdit(todo.id)}
                      >
                        保存
                      </button>
                      <button className="btn-cancel" onClick={cancelEdit}>
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      className={`check-circle ${todo.completed ? "checked" : ""}`}
                      onClick={() => toggleTodo(todo.id)}
                      title={todo.completed ? "标记为未完成" : "标记为已完成"}
                    >
                      {todo.completed ? "✅" : "○"}
                    </button>

                    <div className="todo-content">
                      <div className={`todo-title ${todo.completed ? "done" : ""}`}>
                        {todo.title}
                      </div>
                      {todo.description && (
                        <div className="todo-desc">{todo.description}</div>
                      )}
                      <div className="todo-meta">
                        {todo.dueDate && (
                          <span className={`due-badge status-${status}`}>
                            {status === "overdue"
                              ? "⚠️ "
                              : status === "due-soon"
                              ? "🔥 "
                              : "📅 "}
                            {formatDateTime(todo.dueDate, todo.dueTime)}
                          </span>
                        )}
                        {todo.dueDate && (
                          <span className={`countdown status-${status}`}>
                            {formatRemaining(todo.dueDate, todo.dueTime)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="todo-actions">
                      <button
                        className="btn-icon"
                        onClick={() => startEdit(todo)}
                        title="编辑"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => deleteTodo(todo.id)}
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {todos.length > 0 && (
        <div className="footer">
          <span>{counts.active} 项未完成</span>
          {counts.completed > 0 && (
            <button className="btn-clear" onClick={clearCompleted}>
              清除已完成
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
