interface HeaderProps {
  name: string;
  email: string;
  onSignOut: () => void;
}

export default function Header({ name, email, onSignOut }: HeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-6 border-b-2 border-gray-200">
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-semibold text-gray-900 truncate">{name}</h1>
        <p className="text-sm text-gray-600 truncate mt-1">{email}</p>
      </div>
      <button
        onClick={onSignOut}
        className="border border-gray-900 text-gray-900 px-5 py-2 text-sm hover:bg-gray-900 hover:text-white transition-all duration-200 w-full sm:w-auto"
      >
        Sign Out
      </button>
    </div>
  );
}
