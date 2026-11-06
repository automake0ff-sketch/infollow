import { LEGAL } from "@/lib/legal";

export const metadata = { title: "Términos del servicio · INMO FOLLOW AI" };

export default function Page() {
  return (
    <>
      <h1>Términos del servicio</h1>
      <p>Estos términos regulan el uso de {LEGAL.product}, ofrecido por {LEGAL.name} (NIF/CIF {LEGAL.taxId}). Al crear una cuenta los aceptas junto con la <a href="/privacidad" className="underline">política de privacidad</a> y el <a href="/dpa" className="underline">contrato de encargo de tratamiento</a>.</p>

      <h2>1. El servicio</h2>
      <p>Herramienta web para gestionar contactos, propiedades, seguimientos y oportunidades comerciales, con funciones de ayuda basadas en reglas y en inteligencia artificial.</p>

      <h2>2. Cuenta y acceso</h2>
      <p>Debes ser profesional o empresa, facilitar datos veraces y custodiar tus credenciales. Eres responsable de la actividad de tu cuenta y de las personas a las que des acceso.</p>

      <h2>3. Precio y prueba</h2>
      <p>{"[PENDIENTE: condiciones de la prueba gratuita, precio, facturación e impuestos y política de cancelación y reembolso]"}</p>

      <h2>4. Uso aceptable y datos de terceros</h2>
      <ul>
        <li>Solo puedes introducir o importar datos personales que tengas derecho a tratar y para finalidades legítimas, informando a los interesados como exige el RGPD.</li>
        <li>La aplicación <strong>no envía mensajes</strong>: los mensajes que redactes o generes los envías tú desde tus propios canales. Eres responsable de cumplir la normativa de comunicaciones comerciales (LSSI) y de contar con el consentimiento cuando sea necesario.</li>
        <li>Está prohibido el uso ilícito, el abuso de los límites, el acceso a datos de otras cuentas o cualquier intento de comprometer el servicio.</li>
      </ul>

      <h2>5. Inteligencia artificial</h2>
      <p>Las funciones de IA son una ayuda: pueden contener errores u omisiones y no constituyen asesoramiento jurídico, fiscal ni financiero. Debes revisar todo contenido antes de usarlo. El uso de IA está sujeto a límites diarios y a la disponibilidad de los proveedores, que pueden cambiar o interrumpirse.</p>

      <h2>6. Tus datos</h2>
      <p>Los datos que introduces son tuyos. Puedes exportarlos y eliminar tu agencia en cualquier momento desde Ajustes. Solo los tratamos para prestarte el servicio.</p>

      <h2>7. Disponibilidad y cambios</h2>
      <p>Trabajamos para mantener el servicio disponible, pero no garantizamos que sea ininterrumpido. Podemos modificar o retirar funciones avisando con antelación razonable cuando afecte de forma relevante al servicio contratado.</p>

      <h2>8. Responsabilidad</h2>
      <p>En la medida permitida por la ley, no respondemos de pérdidas indirectas ni del lucro cesante, ni de decisiones comerciales tomadas a partir de los resultados del servicio. {"[PENDIENTE: revisar límite de responsabilidad]"}</p>

      <h2>9. Suspensión y baja</h2>
      <p>Puedes darte de baja cuando quieras. Podemos suspender cuentas que incumplan estos términos o pongan en riesgo el servicio.</p>

      <h2>10. Ley aplicable</h2>
      <p>Legislación española. {"[PENDIENTE: jurisdicción y, en su caso, derechos de consumidores]"}</p>

      <p>Contacto: {LEGAL.email}</p>
    </>
  );
}
