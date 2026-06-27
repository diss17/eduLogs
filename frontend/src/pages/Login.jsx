import { useState } from 'react';
import { login } from '../api/auth';
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login({ email, password });
      sessionStorage.setItem('user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al iniciar sesión'
      );
    } finally {
      setLoading(false);
    }
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
