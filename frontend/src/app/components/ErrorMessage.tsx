interface ErrorMessageProps {
  message: string;
  onDismiss: () => void;
}

export default function ErrorMessage({
  message,
  onDismiss,
}: ErrorMessageProps) {
  return (
    <div className="border-2 border-red-300 bg-red-50 text-red-800 px-5 py-4 text-sm flex items-start justify-between gap-4">
      <span className="flex-1">{message}</span>
      <button
        onClick={onDismiss}
        className="underline hover:no-underline whitespace-nowrap"
      >
        Dismiss
      </button>
    </div>
  );
}
