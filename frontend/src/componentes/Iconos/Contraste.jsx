/* Se crea un SVG para el icono de modo oscuro */
export default function IconoContraste({ size = 22, className, title = 'Contraste' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden={title ? undefined : true}
      role="img"
      className={className}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 2a10 10 0 1 0 0 20V2z" fill="currentColor" opacity="0.9" />
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.9" />
    </svg>
  );
}