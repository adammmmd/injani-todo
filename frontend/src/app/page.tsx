"use client";
import { signIn, signOut, useSession } from "@/lib/auth-client";
import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import { useState, useEffect } from "react";
import {
  Header,
  AddTodoForm,
  TodoList,
  LoginForm,
  ErrorMessage,
} from "./components";

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
      const optRes = await fetch("/api/passkey/login-options", {
        method: "POST",
      });
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
      "Would you like to register a Passkey for faster login next time?",
    );
    if (!confirm) {
      localStorage.setItem("passkey_registered", "skipped");
      return;
    }

    try {
      const optRes = await fetch("/api/passkey/register-options", {
        method: "POST",
      });
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          <Header
            name={session.user.name || "User"}
            email={session.user.email || ""}
            onSignOut={() => signOut()}
          />

          {error && (
            <div className="mt-6">
              <ErrorMessage message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          <div className="mt-8 flex flex-col gap-6">
            <h2 className="text-lg font-semibold text-gray-900">My Todos</h2>

            <AddTodoForm
              value={newTodo}
              onChange={setNewTodo}
              onSubmit={addTodo}
              loading={loading}
            />

            <TodoList
              todos={todos}
              loading={todosLoading}
              onComplete={completeTodo}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <LoginForm
        onGoogleSignIn={() =>
          signIn.social({ provider: "google", callbackURL: "/" })
        }
        passkeyLoading={passkeyLoading}
      />
    </div>
  );
}
