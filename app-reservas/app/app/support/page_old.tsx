"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSessionStore } from "@/lib/session-store";

type ContactMethod = "email" | "whatsapp" | "call";
type Category = "reservations" | "payments" | "travel" | "other";

interface FAQ {
  question: string;
  answer: string;
  category: Category;
}

const faqs: FAQ[] = [
  {
    question: "¿Cómo puedo cancelar mi reservación?",
    answer: "Puedes cancelar tu reservación desde la sección 'Mis Viajes'. Haz clic en la reservación y selecciona 'Cancelar'. Las políticas de cancelación varían según el paquete.",
    category: "reservations",
  },
  {
    question: "¿Cuáles son los métodos de pago disponibles?",
    answer: "Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express), y pagos a través de Stripe. Todos los pagos están protegidos con encriptación SSL.",
    category: "payments",
  },
  {
    question: "¿Puedo modificar las fechas de mi viaje?",
    answer: "Las modificaciones de fechas están sujetas a disponibilidad y pueden generar cargos adicionales. Contacta a nuestro equipo para evaluar tu caso específico.",
    category: "travel",
  },
  {
    question: "¿Qué incluye el paquete de viaje?",
    answer: "Cada paquete incluye diferentes servicios. Consulta los detalles específicos en la descripción del paquete. Generalmente incluyen vuelos, hospedaje y algunos incluyen tours.",
    category: "travel",
  },
  {
    question: "¿Cómo solicito un reembolso?",
    answer: "Si tu reservación está confirmada, puedes solicitar un reembolso desde 'Mis Viajes'. El proceso tarda de 5-10 días hábiles dependiendo de tu banco.",
    category: "payments",
  },
  {
    question: "¿Necesito visa para mi destino?",
    answer: "Los requisitos de visa varían según tu nacionalidad y destino. Te recomendamos verificar con la embajada correspondiente antes de viajar.",
    category: "travel",
  },
];

const categoryLabels: Record<Category, string> = {
  reservations: "Reservaciones",
  payments: "Pagos",
  travel: "Viajes",
  other: "Otros",
};

export default function SoportePage() {
  const { customer, hydrated } = useSessionStore();
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [contactMethod, setContactMethod] = useState<ContactMethod | null>(null);
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const filteredFaqs = selectedCategory === "all" 
    ? faqs 
    : faqs.filter(f => f.category === selectedCategory);

  async function handleSendMessage() {
    if (!message.trim() || !subject.trim()) return;
    
    setSending(true);
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSending(false);
    setSent(true);
    setMessage("");
    setSubject("");
    
    // Reset sent state after a few seconds
    setTimeout(() => setSent(false), 5000);
  }

  function openWhatsApp() {
    const phoneNumber = "525512345678"; // Replace with actual number
    const text = encodeURIComponent("Hola, necesito ayuda con mi reservación en Meraki Travels.");
    window.open(`https://wa.me/${phoneNumber}?text=${text}`, "_blank");
  }

  function openEmail() {
    const email = "soporte@merakitravels.com";
    const emailSubject = encodeURIComponent(subject || "Consulta desde el portal");
    const body = encodeURIComponent(message || "");
    window.open(`mailto:${email}?subject=${emailSubject}&body=${body}`, "_blank");
  }

  if (!hydrated) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="space-y-8 p-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Centro de Ayuda</h1>
        <p className="mt-2 text-zinc-400">
          Estamos aquí para ayudarte con cualquier consulta sobre tus viajes
        </p>
      </div>

      {/* Contact methods */}
      <div className="grid gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={openWhatsApp}
          className="group flex flex-col items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6 transition-all hover:border-emerald-400/40 hover:bg-emerald-500/20"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 transition-transform group-hover:scale-110">
            <svg className="h-6 w-6 text-emerald-300" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-emerald-200">WhatsApp</h3>
            <p className="text-sm text-emerald-300/70">Respuesta inmediata</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setContactMethod("email")}
          className="group flex flex-col items-center gap-3 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-6 transition-all hover:border-violet-400/40 hover:bg-violet-500/20"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20 transition-transform group-hover:scale-110">
            <svg className="h-6 w-6 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-violet-200">Email</h3>
            <p className="text-sm text-violet-300/70">soporte@merakitravels.com</p>
          </div>
        </button>

        <a
          href="tel:+525512345678"
          className="group flex flex-col items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-6 transition-all hover:border-amber-400/40 hover:bg-amber-500/20"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 transition-transform group-hover:scale-110">
            <svg className="h-6 w-6 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-amber-200">Teléfono</h3>
            <p className="text-sm text-amber-300/70">+52 55 1234 5678</p>
          </div>
        </a>
      </div>

      {/* Email form (if selected) */}
      {contactMethod === "email" && (
        <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Enviar mensaje</h2>
            <button
              type="button"
              onClick={() => setContactMethod(null)}
              className="text-zinc-400 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
                <svg className="h-7 w-7 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-emerald-200">¡Mensaje enviado!</p>
              <p className="text-sm text-zinc-400">Te responderemos a la brevedad.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customer && (
                <div className="rounded-xl bg-white/5 px-4 py-3 text-sm text-zinc-300">
                  Enviando como: <span className="font-medium text-white">{customer.email}</span>
                </div>
              )}
              
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">Asunto</span>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="¿Sobre qué necesitas ayuda?"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">Mensaje</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Cuéntanos los detalles de tu consulta..."
                  rows={5}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                />
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => void handleSendMessage()}
                  disabled={sending || !subject.trim() || !message.trim()}
                  className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 font-medium text-white shadow-lg shadow-violet-500/25 transition hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Enviando...
                    </span>
                  ) : (
                    "Enviar mensaje"
                  )}
                </button>
                <button
                  type="button"
                  onClick={openEmail}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
                >
                  Abrir en cliente de correo
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAQs */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-white">Preguntas frecuentes</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                selectedCategory === "all"
                  ? "bg-violet-500/20 text-violet-200"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              Todas
            </button>
            {(Object.keys(categoryLabels) as Category[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  selectedCategory === cat
                    ? "bg-violet-500/20 text-violet-200"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10"
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-white/10 bg-white/5"
            >
              <button
                type="button"
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="flex w-full items-center justify-between p-4 text-left transition hover:bg-white/5"
              >
                <span className="font-medium text-white">{faq.question}</span>
                <svg
                  className={`h-5 w-5 text-zinc-400 transition-transform ${
                    expandedFaq === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedFaq === index && (
                <div className="border-t border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-sm text-zinc-300">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Enlaces rápidos</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <Link
            href="/app/bookings"
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20">
              <svg className="h-5 w-5 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-sm font-medium text-white">Mis viajes</span>
          </Link>
          <Link
            href="/app/payments"
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <svg className="h-5 w-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-white">Mis pagos</span>
          </Link>
          <Link
            href="/app/profile"
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
              <svg className="h-5 w-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-white">Mi perfil</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
              <svg className="h-5 w-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-white">Buscar viajes</span>
          </Link>
        </div>
      </div>

      {/* Business hours */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 text-center">
        <h3 className="font-semibold text-white">Horario de atención</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Lunes a Viernes: 9:00 AM - 7:00 PM<br />
          Sábados: 10:00 AM - 3:00 PM
        </p>
        <p className="mt-3 text-xs text-zinc-500">
          WhatsApp disponible 24/7 para emergencias en viaje
        </p>
      </div>
    </main>
  );
}
