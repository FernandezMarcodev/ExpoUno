import React from 'react';
import { FaGithub, FaEnvelope } from 'react-icons/fa';
import './PieDePagina.css';

const PieDePagina = () => {
    return (
        <footer className="pie-de-pagina">
            <div className="pie-contenedor">
                <div className="pie-enlaces">
                    <a 
                        href="https://github.com/FernandezMarcodev/ExpoUno" 
                        target="_blank" 
                        rel="noopener noreferrer"
                    >
                        <FaGithub size={20} /> GitHub
                    </a>
                    <a href="mailto:BombaServices@gmail.com">
                        <FaEnvelope size={20} /> Contacto
                    </a>
                </div>
            </div>
            <p className="pie-copy">&copy; {new Date().getFullYear()} Concierto Finder. Todos los derechos reservados.</p>
        </footer>
    );
};

export default PieDePagina;
