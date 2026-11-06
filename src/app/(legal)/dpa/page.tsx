import { LEGAL } from "@/lib/legal";

export const metadata = { title: "Contrato de encargo de tratamiento · INMO FOLLOW AI" };

export default function Page() {
  return (
    <>
      <h1>Contrato de encargo de tratamiento (art. 28 RGPD)</h1>
      <p>Entre el <strong>cliente</strong> (la persona o agencia que crea la cuenta, <em>responsable del tratamiento</em>) y <strong>{LEGAL.name}</strong>, NIF/CIF {LEGAL.taxId} (<em>encargado del tratamiento</em>). Se formaliza al aceptar los términos del servicio.</p>

      <h2>1. Objeto, duración y naturaleza</h2>
      <p>El encargado trata datos personales por cuenta del cliente únicamente para prestar el servicio {LEGAL.product} (almacenamiento, organización, consulta, importación, exportación y funciones de ayuda con IA). Duración: la del servicio contratado.</p>

      <h2>2. Datos e interesados</h2>
      <ul>
        <li>Interesados: compradores, vendedores, propietarios, arrendatarios y otros contactos comerciales del cliente.</li>
        <li>Datos: identificación y contacto, preferencias inmobiliarias, presupuesto, notas e historial comercial. El cliente se compromete a no introducir categorías especiales de datos.</li>
      </ul>

      <h2>3. Obligaciones del encargado</h2>
      <ul>
        <li>Tratar los datos solo siguiendo las instrucciones documentadas del cliente (incluido este contrato y el uso de la aplicación).</li>
        <li>Garantizar la confidencialidad de las personas autorizadas.</li>
        <li>Aplicar medidas de seguridad adecuadas: aislamiento entre cuentas, control de acceso por roles, cifrado en tránsito y gestión segura de claves.</li>
        <li>Asistir al cliente en la atención de derechos de los interesados; la aplicación permite exportar y eliminar los datos.</li>
        <li>Notificar al cliente sin dilación indebida cualquier violación de seguridad que le afecte.</li>
        <li>Al terminar el servicio, suprimir los datos (o devolverlos mediante exportación) salvo obligación legal de conservarlos.</li>
        <li>Poner a disposición del cliente la información necesaria para demostrar el cumplimiento y permitir auditorías razonables.</li>
      </ul>

      <h2>4. Subencargados</h2>
      <p>El cliente concede autorización general para recurrir a los siguientes subencargados, que ofrecen garantías suficientes: Supabase (base de datos y autenticación), Vercel (alojamiento), OpenRouter y los proveedores de modelos que enrute (solo funciones de IA) y Stripe (cobros, cuando se active). Se informará de cambios con antelación razonable para que el cliente pueda oponerse.</p>

      <h2>5. Obligaciones del cliente</h2>
      <ul>
        <li>Contar con base jurídica para los datos que introduce e informar a los interesados.</li>
        <li>Responder ante los interesados y las autoridades como responsable.</li>
        <li>No usar el servicio para enviar comunicaciones sin base legal.</li>
      </ul>

      <h2>6. Transferencias internacionales</h2>
      <p>Cuando un subencargado trate datos fuera del EEE, se apoyará en decisiones de adecuación o cláusulas contractuales tipo.</p>
    </>
  );
}
