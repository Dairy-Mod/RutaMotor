import { useState } from "react";
import { write } from "../api";
import { Icon } from "../components/Icons";
export default function Auth({ onLogin }) {
  const [register, setRegister] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [show, setShow] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      const { data } = await write(
        "/auth/" + (register ? "register" : "login"),
        Object.fromEntries(form),
      );
      onLogin(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <section className="auth-story">
        <a className="brand" href="/">
          <span className="brand-mark">
            <Icon name="navigate" size={26} />
          </span>
          ruta<span>motor</span>
        </a>
        <div className="auth-copy">
          <span className="eyebrow light">TU CAMINO, CON RESPALDO</span>
          <h1>
            Un buen viaje
            <br />
            empieza con
            <br />
            <em>tranquilidad.</em>
          </h1>
          <p>
            Talleres, tiendas de autos, refaccionarias y agencias, en un solo
            mapa. Encuentra el servicio que tu vehículo necesita.
          </p>
        </div>
        <div className="road-art" aria-hidden="true">
          <div className="road-line" />
          <span className="road-point p1">
            <Icon name="wrench" size={28} />
          </span>
          <span className="road-point p2">
            <Icon name="store" size={28} />
          </span>
          <span className="road-point p3">
            <Icon name="car" size={28} />
          </span>
        </div>
        <p className="auth-foot">
          <Icon name="pin" size={17} />
          Hecho para moverte por León, Guanajuato.
        </p>
      </section>
      <main className="auth-main">
        <span className="pill">
          <Icon name="compass" size={15} />
          Tu directorio automotriz
        </span>
        <div className="auth-box">
          <h2>
            {register
              ? "Tu próxima ruta empieza aquí."
              : "Qué bueno tenerte de vuelta."}
          </h2>
          <p>
            {register
              ? "Crea tu cuenta para explorar y aportar al mapa."
              : "Entra y encuentra una solución cerca de ti."}
          </p>
          <div className="segmented">
            <button
              type="button"
              className={!register ? "active" : ""}
              onClick={() => {
                setRegister(false);
                setError("");
              }}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className={register ? "active" : ""}
              onClick={() => {
                setRegister(true);
                setError("");
              }}
            >
              Crear cuenta
            </button>
          </div>
          <form onSubmit={submit} key={String(register)}>
            {register && (
              <label>
                Tu nombre
                <input
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder="¿Cómo te llamas?"
                />
              </label>
            )}
            <label>
              Correo electrónico
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="nombre@correo.com"
              />
            </label>
            <label>
              Contraseña
              <span className="password-field">
                <input
                  name="password"
                  type={show ? "text" : "password"}
                  autoComplete={register ? "new-password" : "current-password"}
                  required
                  minLength={10}
                  maxLength={72}
                  placeholder={
                    register ? "Al menos 10 caracteres" : "Tu contraseña"
                  }
                />
                <button
                  type="button"
                  aria-label={
                    show ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  onClick={() => setShow(!show)}
                >
                  <Icon name="eye" size={18} />
                </button>
              </span>
            </label>
            {error && (
              <div className="inline-error" role="alert">
                {error}
              </div>
            )}
            <button className="button primary auth-submit" disabled={busy}>
              {busy ? (
                <Icon name="loading" className="spin" />
              ) : (
                <Icon name="compass" size={19} />
              )}{" "}
              {register ? "Crear mi cuenta" : "Entrar a RutaMotor"}
            </button>
          </form>
          <div className="auth-info">
            <Icon name="map" size={21} />
            <p>
              Descubre lugares, guarda zonas de servicio y aprende a reconocer
              los testigos de tu tablero.
            </p>
          </div>
          <p className="muted small">
            Usa la aplicación cuando estés estacionado en un lugar seguro.
          </p>
        </div>
        <footer>
          RutaMotor © {new Date().getFullYear()}{" "}
          <span>Proyecto local · León, Gto.</span>
        </footer>
      </main>
    </div>
  );
}
