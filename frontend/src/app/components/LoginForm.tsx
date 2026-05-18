interface LoginFormProps {
  onGoogleSignIn: () => void;
  passkeyLoading: boolean;
}

export default function LoginForm({
  onGoogleSignIn,
  passkeyLoading,
}: LoginFormProps) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-md p-8 border-2 border-gray-200 bg-white">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">Welcome</h1>
        <p className="text-sm text-gray-600">
          {passkeyLoading
            ? "Checking for passkey..."
            : "Sign in to access your todos."}
        </p>
      </div>
      {passkeyLoading && (
        <div className="text-sm text-gray-500 text-center">
          Looking for passkey...
        </div>
      )}
      <button
        onClick={onGoogleSignIn}
        disabled={passkeyLoading}
        className="border-2 border-gray-900 bg-gray-900 text-white px-6 py-3 text-sm w-full hover:bg-gray-800 hover:border-gray-800 transition-all duration-200 disabled:opacity-50"
      >
        Sign in with Google
      </button>
    </div>
  );
}
