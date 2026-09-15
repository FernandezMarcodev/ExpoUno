import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Encabezado from '../componentes/Encabezado/Encabezado';
import PieDePagina from '../componentes/PieDePagina/PieDePagina';
import { useAuth } from '../contextos/AuthContext';
import styles from './auth.module.css';

const Registro = () => {
  const { registrarse } = useAuth();
  const navigate = useNavigate();
  const [formulario, setFormulario] = useState({ email: '', nombre: '', password: '' });
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
      await registrarse(formulario);
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
          <h1 className={styles.titulo}>Crear cuenta</h1>
          <p className={styles.subtitulo}>Tu cuenta para favoritos, artistas seguidos y avisos</p>

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
              <label className={styles.etiqueta} htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                className={styles.input}
                type="text"
                autoComplete="name"
                placeholder="Tu nombre"
                value={formulario.nombre}
                onChange={cambiarCampo('nombre')}
                required
              />
            </div>

            <div className={styles.campo}>
              <label className={styles.etiqueta} htmlFor="password">Contraseña</label>
              <input
                id="password"
                className={styles.input}
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres, 1 número, 1 mayúscula"
                value={formulario.password}
                onChange={cambiarCampo('password')}
                required
              />
              <span className={styles.ayuda}>Mínimo 8 caracteres, con números y mayúscula.</span>
            </div>

            <button className={styles.boton} type="submit" disabled={enviando}>
              {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>

          <p className={styles.pie}>
            ¿Ya tenés cuenta? <Link to="/login" className={styles.enlace}>Iniciar sesión</Link>
          </p>
        </div>
      </main>
      <PieDePagina />
    </div>
  );
};

export default Registro;