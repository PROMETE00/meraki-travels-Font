"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSessionStore } from "@/lib/session-store";
import { 
  FaEnvelope, 
  FaWhatsapp, 
  FaPhone, 
  FaHeadset,
  FaQuestionCircle,
  FaChevronDown,
  FaChevronUp,
  FaFileAlt,
  FaExclamationTriangle,
  FaClipboard,
  FaUser,
  FaClock,
  FaUsers
} from "react-icons/fa";

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
  {
    question: "¿Qué hago si mi vuelo se cancela?",
    answer: "Si tu vuelo se cancela, contacta inmediatamente a nuestro equipo de soporte. Te ayudaremos a conseguir vuelos alternativos sin costo adicional cuando sea posible.",
    category: "travel",
  },
  {
    question: "¿Puedo cambiar el nombre del pasajero?",
    answer: "Los cambios de nombre están sujetos a las políticas de la aerolínea y pueden generar cargos. Contacta a soporte lo antes posible para solicitar el cambio.",
    category: "reservations",
  }
];

const categoryLabels: Record<Category, string> = {
  reservations: "Reservaciones",
  payments: "Pagos",
  travel: "Viajes",
  other: "Otros",
};

const categoryIcons: Record<Category, React.ReactNode> = {
  reservations: <FaClipboard className="h-5 w-5" />,
  payments: <FaFileAlt className="h-5 w-5" />,
  travel: <FaUsers className="h-5 w-5" />,
  other: <FaQuestionCircle className="h-5 w-5" />,
};

export default function SoportePage() {
  const { customer, hydrated } = useSessionStore();
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [contactMethod, setContactMethod] = useState<ContactMethod | null>(null);

  const filteredFaqs = selectedCategory === "all" 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const contactMethods = [
    {
      id: "whatsapp" as ContactMethod,
      name: "WhatsApp",
      description: "Respuesta inmediata",
      detail: "Chat directo con nuestro equipo",
      icon: <FaWhatsapp className="h-6 w-6" />,
      color: "bg-green-600 hover:bg-green-700",
      action: () => window.open("https://wa.me/5215512345678", "_blank"),
    },
    {
      id: "email" as ContactMethod,
      name: "Email",
      description: "soporte@merakitravels.com",
      detail: "Respuesta en 2-4 horas",
      icon: <FaEnvelope className="h-6 w-6" />,
      color: "bg-blue-600 hover:bg-blue-700",
      action: () => window.open("mailto:soporte@merakitravels.com", "_blank"),
    },
    {
      id: "call" as ContactMethod,
      name: "Llamada",
      description: "+52 55 1234 5678",
      detail: "Lun-Vie 9AM-6PM",
      icon: <FaPhone className="h-6 w-6" />,
      color: "bg-teal-600 hover:bg-teal-700",
      action: () => window.open("tel:+525512345678", "_blank"),
    },
  ];

  return (
    <main className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
          <FaHeadset className="h-8 w-8 text-teal-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Centro de ayuda</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Encuentra respuestas a tus preguntas o contacta con nuestro equipo de soporte para ayudarte con cualquier duda sobre tus viajes.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/app/incidencias"
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
        >
          <FaExclamationTriangle className="h-4 w-4" />
          Reportar problema
        </Link>
        <Link
          href="/app/reservas"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <FaClipboard className="h-4 w-4" />
          Mis reservas
        </Link>
        <Link
          href="/app/pagos"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <FaFileAlt className="h-4 w-4" />
          Mis pagos
        </Link>
      </div>

      {/* Contact Methods */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800 mb-6 text-center">¿Necesitas ayuda inmediata?</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {contactMethods.map((method) => (
            <button
              key={method.id}
              onClick={method.action}
              className={`p-4 rounded-xl text-white transition-colors ${method.color} text-left`}
            >
              <div className="flex items-center gap-3 mb-2">
                {method.icon}
                <span className="font-semibold">{method.name}</span>
              </div>
              <p className="text-sm opacity-90 mb-1">{method.description}</p>
              <p className="text-xs opacity-75">{method.detail}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Horarios de atención */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <FaClock className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800">Horarios de atención</h3>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Lunes a Viernes:</strong> 9:00 AM - 6:00 PM (GMT-6)<br />
              <strong>Sábados:</strong> 10:00 AM - 2:00 PM<br />
              <strong>Emergencias 24/7:</strong> WhatsApp disponible siempre
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800">Preguntas frecuentes</h2>
          <p className="text-slate-600 mt-2">Encuentra respuestas rápidas a las consultas más comunes</p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              selectedCategory === "all"
                ? "bg-teal-600 text-white"
                : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <FaQuestionCircle className="h-4 w-4" />
            Todas ({faqs.length})
          </button>
          {(Object.entries(categoryLabels) as [Category, string][]).map(([category, label]) => {
            const count = faqs.filter(faq => faq.category === category).length;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-teal-600 text-white"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {categoryIcons[category]}
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <span className="font-medium text-slate-800 pr-4">{faq.question}</span>
                  {expandedFaq === index ? (
                    <FaChevronUp className="h-4 w-4 text-slate-600 flex-shrink-0" />
                  ) : (
                    <FaChevronDown className="h-4 w-4 text-slate-600 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-4 border-t border-slate-100">
                    <p className="text-slate-700 pt-4">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              No hay preguntas frecuentes para esta categoría.
            </div>
          )}
        </div>
      </div>

      {/* Still Need Help */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50 p-8 text-center">
        <FaUser className="mx-auto h-12 w-12 text-teal-600 mb-4" />
        <h3 className="text-xl font-semibold text-teal-800 mb-2">¿Aún necesitas ayuda?</h3>
        <p className="text-teal-700 mb-6 max-w-md mx-auto">
          Si no encontraste la respuesta que buscabas, nuestro equipo de soporte está aquí para ayudarte.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/app/incidencias"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 font-medium text-white transition-colors hover:bg-teal-700"
          >
            <FaExclamationTriangle className="h-5 w-5" />
            Crear ticket de soporte
          </Link>
          <button
            onClick={() => window.open("https://wa.me/5215512345678", "_blank")}
            className="inline-flex items-center gap-2 rounded-lg border border-teal-300 bg-white px-6 py-3 font-medium text-teal-700 transition-colors hover:bg-teal-50"
          >
            <FaWhatsapp className="h-5 w-5" />
            Chat directo por WhatsApp
          </button>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <FaExclamationTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">¿Es una emergencia durante tu viaje?</h3>
            <p className="text-sm text-red-700 mt-1">
              Para emergencias durante tu viaje (vuelos cancelados, problemas en destino, etc.), 
              contáctanos inmediatamente por WhatsApp o llama a nuestro número de emergencia.
            </p>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => window.open("https://wa.me/5215512345678", "_blank")}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                <FaWhatsapp className="h-4 w-4" />
                WhatsApp Emergencia
              </button>
              <button
                onClick={() => window.open("tel:+525512345678", "_blank")}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
              >
                <FaPhone className="h-4 w-4" />
                Llamar emergencia
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}