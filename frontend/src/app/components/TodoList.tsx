import TodoItem from "./TodoItem";

type Todo = {
  id: number;
  title: string;
  completed: boolean;
  user_id: string;
};

interface TodoListProps {
  todos: Todo[];
  loading: boolean;
  onComplete: (id: number) => void;
}

export default function TodoList({
  todos,
  loading,
  onComplete,
}: TodoListProps) {
  if (loading) {
    return (
      <div className="text-sm text-gray-500 py-6 text-center">
        Loading todos...
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-300\">
        <p className="text-sm text-gray-500\">No todos yet. Add one above.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          id={todo.id}
          title={todo.title}
          completed={todo.completed}
          onComplete={onComplete}
        />
      ))}
    </div>
  );
}
