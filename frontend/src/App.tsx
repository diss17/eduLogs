import { FormEvent, useState } from 'react';
import { login } from './api/auth';
import type { LoginResponse } from './api/types';

type AppState = { view: 'login' } | { view: 'dashboard'; user: LoginResponse };

function App() {
  const [state, setState] = useState<AppState>({ view: 'login' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login({ email, password });
      setState({ view: 'dashboard', user });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setState({ view: 'login' });
    setEmail('');
    setPassword('');
    setError('');
  }

  if (state.view === 'dashboard') {
    const { user } = state;
    return (
      <main className="dashboard-page">
        <header className="dashboard-header">
          <h1 className="dashboard-brand">eduLogs</h1>
          <button className="dashboard-logout" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </header>

        <section className="dashboard-welcome">
          <p className="dashboard-greeting">Bienvenido/a,</p>
          <h2 className="dashboard-name">
            {user.nombre} {user.apellido}
          </h2>
          <span className="dashboard-role">{user.rol}</span>
        </section>
      </main>
    );
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <h1>eduLogs</h1>
          <p>Inicia sesión para continuar</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Correo electrónico
            <input
              type="email"
              name="email"
              placeholder="ej. daniel@escuela.cl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Ingresando…' : 'Entrar'}
          </button>
        </form>

        <p className="login-help">¿No tienes cuenta? Contacta con el administrador.</p>
      </section>
    </main>
  );
}

export default App;
