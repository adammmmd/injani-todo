"use client";
import { signIn, signOut, useSession } from "@/lib/auth-client";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { useState, useEffect } from "react";

type Todo = {
  id: number;
  title: string;
  completed: boolean;
  user_id: string;
};

export default function Home() {
  const { data: session, isPending } = useSession();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [loading, setLoading] = useState(false);
  const [todosLoading, setTodosLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  async function fetchTodos() {
    setTodosLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/todos");
      if (res.status === 401) {
        await signOut();
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch todos");
      setTodos(await res.json());
    } catch (e) {
      setError("Failed to load todos. Please try again.");
    } finally {
      setTodosLoading(false);
    }
  }

  async function addTodo() {
    if (!newTodo.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTodo }),
      });
      if (!res.ok) throw new Error("Failed to add todo");
      setNewTodo("");
      await fetchTodos();
    } catch (e) {
      setError("Failed to add todo. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function completeTodo(id: number) {
    setError(null);
    try {
      const res = await fetch(`/api/todos/${id}/complete`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to complete todo");
      await fetchTodos();
    } catch (e) {
      setError("Failed to update todo. Please try again.");
    }
  }

  async function tryPasskeyLogin() {
    setPasskeyLoading(true);
    try {
      const optRes = await fetch("/api/passkey/login-options", { method: "POST" });
      const options = await optRes.json();
      const credential = await startAuthentication({
        optionsJSON: options,
        useBrowserAutofill: false,
      });
      const verRes = await fetch("/api/passkey/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credential),
      });
      const result = await verRes.json();
      if (result.success) window.location.replace("/");
    } catch (e) {
      // silent fail
    } finally {
      setPasskeyLoading(false);
    }
  }

  async function offerPasskeyRegistration() {
    const hasPasskey = localStorage.getItem("passkey_registered");
    if (hasPasskey) return;

    const confirm = window.confirm(
      "Would you like to register a Passkey for faster login next time?"
    );
    if (!confirm) {
      localStorage.setItem("passkey_registered", "skipped");
      return;
    }

    try {
      const optRes = await fetch("/api/passkey/register-options", { method: "POST" });
      const options = await optRes.json();
      const credential = await startRegistration({ optionsJSON: options });
      const verRes = await fetch("/api/passkey/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credential),
      });
      const result = await verRes.json();
      if (result.success) {
        localStorage.setItem("passkey_registered", "true");
        alert("Passkey registered! You can now sign in faster next time.");
      }
    } catch (e) {
      // user cancel
    }
  }

  useEffect(() => {
    if (session) {
      fetchTodos();
      offerPasskeyRegistration();
    }
  }, [session]);

  useEffect(() => {
    if (!isPending && !session) {
      tryPasskeyLogin();
    }
  }, [isPending, session]);

  if (isPending) {
    return (
      <div className="p-8 flex items-center gap-2 text-gray-400">
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        Loading...
      </div>
    );
  }

  if (session) {
    return (
      <div className="p-8 max-w-lg flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{session.user.name}</h1>
            <p className="text-gray-400 text-sm">{session.user.email}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
          >
            Sign Out
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <h2 className="font-bold text-lg">My Todos</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && addTodo()}
              placeholder="Add new todo..."
              disabled={loading}
              className="flex-1 border border-gray-600 bg-gray-800 text-white px-3 py-2 rounded disabled:opacity-50"
            />
            <button
              onClick={addTodo}
              disabled={loading || !newTodo.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-blue-700 transition flex items-center gap-2"
            >
              {loading && (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? "Adding..." : "Add"}
            </button>
          </div>

          {todosLoading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm mt-2">
              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Loading todos...
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              {todos.length === 0 && (
                <p className="text-gray-500 text-sm">No todos yet. Add one above!</p>
              )}
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-3 p-3 border border-gray-700 rounded hover:border-gray-500 transition"
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => !todo.completed && completeTodo(todo.id)}
                    disabled={todo.completed}
                    className="w-4 h-4 cursor-pointer disabled:cursor-default"
                  />
                  <span className={todo.completed ? "line-through text-gray-500" : ""}>
                    {todo.title}
                  </span>
                  {todo.completed && (
                    <span className="ml-auto text-xs text-green-500">Done</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col gap-4 max-w-sm">
      <h1 className="text-xl font-bold">Login</h1>
      <p className="text-gray-400 text-sm">
        {passkeyLoading ? "Checking for passkey..." : "Sign in to access your todos."}
      </p>
      {passkeyLoading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          Looking for passkey...
        </div>
      )}
      <button
        onClick={() => signIn.social({ provider: "google", callbackURL: "/" })}
        disabled={passkeyLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded w-fit hover:bg-blue-600 transition disabled:opacity-50"
      >
        Sign in with Google
      </button>
    </div>
  );
}