import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

const FILTERS = { all: 'All', active: 'Active', done: 'Done' }

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d.map((p) => <path key={p} d={p} />)}
  </svg>
)
const PencilIcon = () => <Icon d={['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z']} />
const TrashIcon = () => <Icon d={['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6']} />
const PlusIcon = () => <Icon d={['M12 5v14', 'M5 12h14']} />

function TodoItem({ todo, onToggle, onSave, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(todo.title)
  const [description, setDescription] = useState(todo.description ?? '')

  const save = async (e) => {
    e.preventDefault()
    if (await onSave(todo.id, { title: title.trim(), description: description.trim() || null })) setEditing(false)
  }

  if (editing) {
    return (
      <li className="item">
        <form className="edit" onSubmit={save}>
          <input aria-label="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required autoFocus />
          <input aria-label="Description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} placeholder="Description (optional)" />
          <div className="row">
            <button className="btn primary" disabled={!title.trim()}>Save</button>
            <button type="button" className="btn" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className={`item ${todo.completed ? 'done' : ''}`}>
      <label className="check">
        <input type="checkbox" checked={todo.completed} onChange={() => onToggle(todo)} />
        <span className="text">
          <span className="title">{todo.title}</span>
          {todo.description && <span className="desc">{todo.description}</span>}
        </span>
      </label>
      <button className="icon" aria-label={`Edit ${todo.title}`} onClick={() => setEditing(true)}><PencilIcon /></button>
      <button className="icon danger" aria-label={`Delete ${todo.title}`} onClick={() => onDelete(todo.id)}><TrashIcon /></button>
    </li>
  )
}

export default function App() {
  const [todos, setTodos] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | failed
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const load = useCallback(async () => {
    try {
      setTodos(await api.list())
      setStatus('ready')
    } catch (e) {
      setError(e.message)
      setStatus('failed')
    }
  }, [])

  useEffect(() => { load() }, [load])

  // runs a mutation; shows the error banner and returns false on failure
  const attempt = async (fn) => {
    setError('')
    try {
      await fn()
      return true
    } catch (e) {
      setError(e.message)
      return false
    }
  }

  const add = async (e) => {
    e.preventDefault()
    const ok = await attempt(async () => {
      const created = await api.create({ title: title.trim(), description: description.trim() || null })
      setTodos((t) => [...t, created])
    })
    if (ok) { setTitle(''); setDescription('') }
  }

  const replace = (updated) => setTodos((t) => t.map((x) => (x.id === updated.id ? updated : x)))

  const toggle = async (todo) => {
    replace({ ...todo, completed: !todo.completed }) // optimistic
    const ok = await attempt(async () => replace(await api.update(todo.id, { completed: !todo.completed })))
    if (!ok) replace(todo) // roll back
  }

  const save = (id, data) => attempt(async () => replace(await api.update(id, data)))
  const remove = (id) => attempt(async () => {
    await api.remove(id)
    setTodos((t) => t.filter((x) => x.id !== id))
  })

  const doneCount = todos.filter((t) => t.completed).length
  const visible = todos.filter((t) => filter === 'all' || (filter === 'done') === t.completed)

  return (
    <main className="app">
      <header>
        <h1>Todo</h1>
        <p className="muted">{status === 'ready' ? `${doneCount} of ${todos.length} done` : ' '}</p>
      </header>

      <form className="add" onSubmit={add}>
        <label className="sr-only" htmlFor="new-title">New task</label>
        <input id="new-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" maxLength={200} required />
        <label className="sr-only" htmlFor="new-desc">Description</label>
        <input id="new-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details (optional)" maxLength={1000} />
        <button className="btn primary" disabled={!title.trim()}><PlusIcon /> Add</button>
      </form>

      {error && (
        <div className="error" role="alert">
          <span>{error}</span>
          {status === 'failed' && <button className="btn" onClick={() => { setError(''); setStatus('loading'); load() }}>Try again</button>}
        </div>
      )}

      <div className="tabs" role="group" aria-label="Filter tasks">
        {Object.entries(FILTERS).map(([key, label]) => (
          <button key={key} className={filter === key ? 'tab active' : 'tab'} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>
        ))}
      </div>

      {status === 'loading' && (
        <ul className="list" aria-busy="true" aria-label="Loading tasks">
          {[0, 1, 2].map((i) => <li key={i} className="item skeleton" />)}
        </ul>
      )}

      {status === 'ready' && (visible.length ? (
        <ul className="list">
          {visible.map((todo) => <TodoItem key={todo.id} todo={todo} onToggle={toggle} onSave={save} onDelete={remove} />)}
        </ul>
      ) : (
        <p className="empty">
          {todos.length === 0 ? 'No tasks yet. Add your first one above.' : `No ${FILTERS[filter].toLowerCase()} tasks.`}
        </p>
      ))}
    </main>
  )
}
