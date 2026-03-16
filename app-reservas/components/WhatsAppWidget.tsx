"use client";

import React, { useState, useRef, useEffect } from "react";
import { FaWhatsapp, FaTimes, FaPaperPlane } from "react-icons/fa";

type Message = {
  id: number;
  text: string;
  isUser: boolean;
  time: string;
};

// Número de WhatsApp Business de Meraki Travels
const WHATSAPP_NUMBER = "529541329075";
const BUSINESS_NAME = "Meraki Travels";

const quickReplies = [
  "🏖️ Información sobre paquetes",
  "💰 Consultar precios",
  "📅 Disponibilidad de fechas",
  "🎫 Estado de mi reservación",
  "💬 Hablar con un agente",
];

const WhatsAppWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: `¡Hola! 👋 Bienvenido a ${BUSINESS_NAME}. ¿En qué podemos ayudarte hoy?`,
      isUser: false,
      time: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  };

  const addMessage = (text: string, isUser: boolean) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text,
        isUser,
        time: getCurrentTime(),
      },
    ]);
  };

  const simulateResponse = (userMessage: string) => {
    setIsTyping(true);
    
    setTimeout(() => {
      let response = "";
      
      if (userMessage.toLowerCase().includes("paquete") || userMessage.toLowerCase().includes("información")) {
        response = "¡Excelente elección! 🌴 Tenemos paquetes increíbles a Cancún, Los Cabos, Europa y más. ¿Te gustaría que un agente te contacte para darte información personalizada?";
      } else if (userMessage.toLowerCase().includes("precio") || userMessage.toLowerCase().includes("costo")) {
        response = "💰 Nuestros precios varían según el destino y temporada. Tenemos opciones desde $5,000 MXN. ¿Qué destino te interesa?";
      } else if (userMessage.toLowerCase().includes("fecha") || userMessage.toLowerCase().includes("disponibilidad")) {
        response = "📅 Trabajamos todo el año con excelente disponibilidad. ¿Para qué fechas estás planeando tu viaje?";
      } else if (userMessage.toLowerCase().includes("reservación") || userMessage.toLowerCase().includes("reserva")) {
        response = "🎫 Para consultar el estado de tu reservación, por favor proporciona tu número de confirmación o escríbenos directamente por WhatsApp.";
      } else if (userMessage.toLowerCase().includes("agente") || userMessage.toLowerCase().includes("hablar")) {
        response = "👨‍💼 ¡Por supuesto! Te conectaré con uno de nuestros agentes. Haz clic en el botón de abajo para continuar en WhatsApp.";
      } else {
        response = "Gracias por tu mensaje. 😊 Un agente de Meraki Travels te responderá pronto. También puedes continuar la conversación directamente en WhatsApp.";
      }
      
      setIsTyping(false);
      addMessage(response, false);
    }, 1000 + Math.random() * 1000);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    addMessage(inputValue, true);
    simulateResponse(inputValue);
    setInputValue("");
  };

  const handleQuickReply = (reply: string) => {
    addMessage(reply, true);
    simulateResponse(reply);
  };

  const openWhatsApp = () => {
    const lastUserMessage = messages.filter((m) => m.isUser).pop();
    const text = lastUserMessage 
      ? `Hola, vengo del chat de la web. Mi consulta: ${lastUserMessage.text}`
      : "Hola, me gustaría obtener información sobre sus paquetes de viaje.";
    
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  return (
    <>
      {/* Widget Container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
        {/* Chat Window */}
        <div
          className={`transform transition-all duration-300 origin-bottom-right ${
            isOpen
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-95 opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          <div className="w-[360px] max-w-[calc(100vw-3rem)] rounded-2xl bg-white shadow-2xl shadow-black/20 ring-1 ring-black/5 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                      <FaWhatsapp className="text-white" size={28} />
                    </div>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-300 ring-2 ring-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{BUSINESS_NAME}</h3>
                    <p className="text-xs text-green-100">En línea • Respuesta rápida</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition-all"
                >
                  <FaTimes size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[320px] overflow-y-auto bg-[#e5ddd5] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2U1ZGRkNSI+PC9yZWN0Pgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxIiBmaWxsPSIjZDFjOWJkIiBvcGFjaXR5PSIwLjMiPjwvY2lyY2xlPgo8L3N2Zz4=')] p-4">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`relative max-w-[85%] rounded-lg px-3 py-2 shadow-sm ${
                        msg.isUser
                          ? "bg-[#dcf8c6] text-slate-800"
                          : "bg-white text-slate-700"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <span className="mt-1 block text-right text-[10px] text-slate-400">
                        {msg.time}
                      </span>
                      {/* Bubble tail */}
                      <div
                        className={`absolute top-0 h-3 w-3 ${
                          msg.isUser
                            ? "-right-1.5 bg-[#dcf8c6]"
                            : "-left-1.5 bg-white"
                        }`}
                        style={{
                          clipPath: msg.isUser
                            ? "polygon(0 0, 100% 0, 0 100%)"
                            : "polygon(100% 0, 0 0, 100% 100%)",
                        }}
                      />
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Quick Replies */}
            <div className="border-t border-slate-100 bg-slate-50 px-3 py-2">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {quickReplies.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickReply(reply)}
                    className="flex-shrink-0 rounded-full bg-white px-3 py-1.5 text-xs text-slate-600 ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:ring-emerald-200 transition-all"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-slate-100 bg-white p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white transition-all hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaPaperPlane size={14} />
                </button>
              </div>
              
              {/* WhatsApp Button */}
              <button
                onClick={openWhatsApp}
                className="mt-2 w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-emerald-500/30"
              >
                <FaWhatsapp size={18} />
                Continuar en WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Floating Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative h-14 w-14 rounded-full shadow-lg transition-all duration-300 ${
            isOpen
              ? "bg-slate-700 rotate-0"
              : "bg-gradient-to-br from-emerald-500 to-green-600 hover:scale-110 hover:shadow-xl hover:shadow-emerald-500/40"
          }`}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            {isOpen ? (
              <FaTimes className="text-white" size={20} />
            ) : (
              <FaWhatsapp className="text-white" size={28} />
            )}
          </div>
          
          {/* Pulse animation when closed */}
          {!isOpen && (
            <>
              <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-30" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white">
                1
              </span>
            </>
          )}
        </button>

        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute bottom-16 right-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
              ¿Necesitas ayuda? 💬
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default WhatsAppWidget;
