import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Encabezado from '../componentes/Encabezado/Encabezado';
import PieDePagina from '../componentes/PieDePagina/PieDePagina';
import { useAuth } from '../contextos/AuthContext';
import styles from './auth.module.css';

const Login = () => {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const [formulario, setFormulario] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cambiarCampo = (campo) => (evento) => {
    setFormulario((previo) => ({ ...previo, [campo]: evento.target.value }));
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await iniciarSesion(formulario);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={styles.pagina}>
      <Encabezado />
      <main className={styles.principal}>
        <div className={styles.tarjeta}>
          <img src="/logo.png" alt="Concierto Finder" className={styles.logo} />
          <h1 className={styles.titulo}>Iniciar sesión</h1>
          <p className={styles.subtitulo}>Volvé a tu cuenta de Concierto Finder</p>

          {error && <div className={styles.error} role="alert">{error}</div>}

          <form className={styles.formulario} onSubmit={enviar}>
            <div className={styles.campo}>
              <label className={styles.etiqueta} htmlFor="email">Email</label>
              <input
                id="email"
                className={styles.input}
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={formulario.email}
                onChange={cambiarCampo('email')}
                required
              />
            </div>

            <div className={styles.campo}>
              <label className={styles.etiqueta} htmlFor="password">Contraseña</label>
              <input
                id="password"
                className={styles.input}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={formulario.password}
                onChange={cambiarCampo('password')}
                required
              />
            </div>

            <button className={styles.boton} type="submit" disabled={enviando}>
              {enviando ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>

          <p className={styles.pie}>
            ¿No tenés cuenta? <Link to="/registro" className={styles.enlace}>Crear cuenta</Link>
          </p>
        </div>
      </main>
      <PieDePagina />
    </div>
  );
};

export default Login;