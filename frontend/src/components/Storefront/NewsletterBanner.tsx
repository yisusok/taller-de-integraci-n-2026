import { useState } from 'react';
import type { FormEvent } from 'react';

export function NewsletterBanner() {
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'ok' | 'error';
    text: string;
  } | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      setStatusMessage({
        type: 'error',
        text: 'Ingresa un correo electrónico válido.',
      });
      return;
    }
    setStatusMessage({
      type: 'ok',
      text: `¡Listo! Registramos ${cleaned} para enviarte novedades y lanzamientos.`,
    });
    setEmail('');
  };

  return (
    <section className="sf-newsletter" aria-label="Suscripción a novedades">
      <div className="sf-container sf-newsletter__inner">
        <h2 className="sf-newsletter__title">Suscríbete</h2>
        <p className="sf-newsletter__subtitle">
          Recibe las últimas novedades y promociones exclusivas en tu correo.
        </p>

        <form className="sf-newsletter__form" onSubmit={handleSubmit} noValidate>
          <input
            type="email"
            className="sf-newsletter__input"
            placeholder="Tu dirección de correo electrónico"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (statusMessage) setStatusMessage(null);
            }}
            aria-label="Tu dirección de correo electrónico"
          />
          <button type="submit" className="sf-btn sf-btn--primary sf-newsletter__submit">
            ENVIAR
          </button>
        </form>

        {statusMessage && (
          <p
            className={`sf-newsletter__feedback ${
              statusMessage.type === 'ok' ? 'is-ok' : 'is-error'
            }`}
            role="status"
          >
            {statusMessage.text}
          </p>
        )}
      </div>
    </section>
  );
}
