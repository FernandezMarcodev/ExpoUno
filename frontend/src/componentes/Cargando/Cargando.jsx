import styles from "./cargando.module.css";

const Cargando = ({ mensaje = "Cargando conciertos..." }) => {
  return (
    <div className={styles.cargando} role="status" aria-live="polite">
      <div className={styles.wrapperIcono}>
        <span className={styles.anillo} aria-hidden="true" />
      </div>
      <p className={styles.mensaje}>{mensaje}</p>
    </div>
  );
};

export default Cargando;