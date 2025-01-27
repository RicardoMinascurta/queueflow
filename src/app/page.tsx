export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">QueueFlow</h1>
      <div className="mt-8 flex gap-4">
        <a href="/dashboard" className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          Painel de Controle
        </a>
        <a href="/display" className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600">
          Monitor de Senhas
        </a>
      </div>
    </main>
  );
}