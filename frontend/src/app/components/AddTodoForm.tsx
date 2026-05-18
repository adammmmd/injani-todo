interface AddTodoFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export default function AddTodoForm({
  value,
  onChange,
  onSubmit,
  loading,
}: AddTodoFormProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      onSubmit();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add new todo..."
        disabled={loading}
        className="flex-1 border-2 border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-900 disabled:opacity-50 disabled:bg-gray-50 transition-colors"
      />
      <button
        onClick={onSubmit}
        disabled={loading || !value.trim()}
        className="border-2 border-gray-900 bg-gray-900 text-white px-6 py-3 text-sm disabled:opacity-50 hover:bg-gray-800 hover:border-gray-800 transition-all duration-200 whitespace-nowrap"
      >
        {loading ? "Adding..." : "Add Todo"}
      </button>
    </div>
  );
}
