import { LEGAL } from "@/lib/legal";

export const metadata = { title: "Política de privacidad · INMO FOLLOW AI" };

export default function Page() {
  return (
    <>
      <h1>Política de privacidad</h1>
      <p>Esta política explica cómo se tratan los datos personales en {LEGAL.product}, un servicio de gestión comercial para profesionales inmobiliarios.</p>

      <h2>1. Quién es el responsable</h2>
      <ul>
        <li><strong>Datos de tu cuenta</strong> (nombre, email, agencia): el responsable es {LEGAL.name}, NIF/CIF {LEGAL.taxId}, domicilio {LEGAL.address}. Contacto: {LEGAL.email}.</li>
        <li><strong>Datos de tus clientes y contactos</strong> que introduces o importas (leads, propietarios, propiedades, notas, historial): el responsable eres tú o tu agencia, y {LEGAL.name} actúa como <em>encargado del tratamiento</em> según el <a href="/dpa" className="underline">contrato de encargo</a>.</li>
      </ul>

      <h2>2. Qué datos tratamos</h2>
      <ul>
        <li>Cuenta: nombre, email, contraseña (almacenada cifrada por el proveedor de autenticación), nombre de la agencia, fecha de aceptación de los términos.</li>
        <li>Contenido que introduces: datos de contacto y preferencias de tus clientes, propiedades, notas, seguimientos, historial de actividad y mensajes generados.</li>
        <li>Datos técnicos mínimos de funcionamiento: cookies de sesión, registros de uso de las funciones de IA (fecha, función y modelo, sin el contenido).</li>
      </ul>

      <h2>3. Para qué y con qué base jurídica</h2>
      <ul>
        <li>Prestarte el servicio contratado (art. 6.1.b RGPD).</li>
        <li>Garantizar la seguridad, prevenir abusos y aplicar los límites de uso (interés legítimo, art. 6.1.f).</li>
        <li>Cumplir obligaciones legales (art. 6.1.c).</li>
        <li>No usamos tus datos ni los de tus clientes para publicidad ni los vendemos.</li>
      </ul>

      <h2>4. Inteligencia artificial</h2>
      <p>Las funciones de IA (mensajes, resúmenes, análisis de conversaciones) se ejecutan solo cuando tú las pides. Para ello se envía al proveedor de IA el contexto estrictamente necesario: nombre de pila, estado, presupuesto, zona, preferencias, notas e historial reciente, <strong>sin teléfono, email ni apellidos</strong>, y con los datos de contacto que detectemos en textos libres ocultados. En el analizador se envía el texto que pegues, que no se almacena en la aplicación.</p>
      <p>Configuramos el proveedor para excluir, siempre que sea posible, servicios que puedan usar los textos para entrenar modelos. La IA puede cometer errores: no toma decisiones automatizadas con efectos jurídicos y todo resultado debe ser revisado por ti antes de usarlo. Evita introducir datos especialmente sensibles en las notas.</p>

      <h2>5. Destinatarios y subencargados</h2>
      <ul>
        <li><strong>Supabase</strong>: base de datos y autenticación.</li>
        <li><strong>Vercel</strong>: alojamiento de la aplicación.</li>
        <li><strong>OpenRouter</strong> y los proveedores de modelos de lenguaje que enrute: únicamente al usar funciones de IA.</li>
        <li><strong>Stripe</strong>: cuando se active el cobro de suscripciones (no procesamos tu tarjeta directamente).</li>
      </ul>
      <p>No cedemos datos a otros terceros salvo obligación legal.</p>

      <h2>6. Transferencias internacionales</h2>
      <p>Algunos proveedores pueden tratar datos fuera del Espacio Económico Europeo. En ese caso se apoyan en decisiones de adecuación o cláusulas contractuales tipo. Región de alojamiento de la base de datos: {"[PENDIENTE: indicar región del proyecto]"}.</p>

      <h2>7. Cuánto tiempo conservamos los datos</h2>
      <p>Mientras mantengas la cuenta. Al eliminar tu agencia desde Ajustes, los datos se borran de los sistemas activos de inmediato; las copias de seguridad se eliminan en un máximo de {"[PENDIENTE: plazo]"}. Los registros de uso de IA (sin contenido) se conservan solo para controlar los límites.</p>

      <h2>8. Tus derechos</h2>
      <p>Puedes ejercer los derechos de acceso, rectificación, supresión, limitación, portabilidad y oposición. En la aplicación (Ajustes → Privacidad y datos) puedes <strong>exportar</strong> todos los datos de tu agencia y <strong>eliminarla</strong>. También puedes escribir a {LEGAL.email}. Si tratas datos de terceros, las solicitudes de tus clientes debes atenderlas tú como responsable; te ayudaremos a ello. Tienes derecho a reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).</p>

      <h2>9. Seguridad</h2>
      <p>Aislamos los datos de cada agencia a nivel de base de datos, ciframos las comunicaciones (HTTPS), limitamos los permisos por rol y mantenemos las claves de servicio fuera del navegador. Ningún sistema es infalible; te avisaremos de cualquier brecha que te afecte conforme a la ley.</p>

      <h2>10. Cambios</h2>
      <p>Si cambiamos esta política de forma relevante te lo comunicaremos y, cuando proceda, volveremos a pedir tu aceptación.</p>
    </>
  );
}
