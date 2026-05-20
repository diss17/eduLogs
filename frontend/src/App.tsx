import { FormEvent, useState } from 'react';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log('Login:', { username, password });
    alert(`Usuario: ${username}\nContraseña: ${password}`);
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
            Usuario
            <input
              type="text"
              name="username"
              placeholder="ej. Daniel"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button type="submit">Entrar</button>
        </form>

        <p className="login-help">¿No tienes cuenta? Contacta con el administrador.</p>
      </section>
    </main>
  );
}

export default App;
