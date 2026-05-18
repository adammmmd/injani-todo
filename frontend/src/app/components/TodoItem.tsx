interface TodoItemProps {
  id: number;
  title: string;
  completed: boolean;
  onComplete: (id: number) => void;
}

export default function TodoItem({
  id,
  title,
  completed,
  onComplete,
}: TodoItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 border-2 border-gray-200 hover:border-gray-400 transition-all duration-200 bg-white">
      <input
        type="checkbox"
        checked={completed}
        onChange={() => !completed && onComplete(id)}
        disabled={completed}
        className="w-5 h-5 cursor-pointer disabled:cursor-default flex-shrink-0"
      />
      <span
        className={
          completed
            ? "line-through text-gray-400 text-sm flex-1"
            : "text-sm text-gray-900 flex-1"
        }
      >
        {title}
      </span>
      {completed && (
        <span className="ml-auto text-xs text-gray-500">Completed</span>
      )}
    </div>
  );
}
