import { jsPDF } from "jspdf";
import type { BookingResponse, CustomerSession, CustomerPreferencesResponse } from "@/features/search/types";

export function generateBookingPDF(
  booking: BookingResponse,
  customer: CustomerSession,
  preferences?: CustomerPreferencesResponse | null
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Confirmación de Reservación", pageWidth / 2, y, { align: "center" });

  y += 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Reservación #${booking.id}`, pageWidth / 2, y, { align: "center" });

  // Divider line
  y += 10;
  doc.setDrawColor(200);
  doc.line(20, y, pageWidth - 20, y);

  // Booking details section
  y += 15;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Detalles del Paquete", 20, y);

  y += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Paquete: ${booking.packageTitle}`, 20, y);

  y += 7;
  doc.text(`Origen: ${booking.originCode}`, 20, y);

  y += 7;
  doc.text(`Destino: ${booking.destinationCode}`, 20, y);

  y += 7;
  doc.text(`Fecha de inicio: ${new Date(booking.startDate).toLocaleDateString("es-MX")}`, 20, y);

  if (booking.endDate) {
    y += 7;
    doc.text(`Fecha de fin: ${new Date(booking.endDate).toLocaleDateString("es-MX")}`, 20, y);
  }

  y += 7;
  doc.text(`Estado: ${booking.status}`, 20, y);

  y += 7;
  doc.text(
    `Precio total: ${new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(booking.totalPrice)}`,
    20,
    y
  );

  // Divider line
  y += 10;
  doc.line(20, y, pageWidth - 20, y);

  // Customer info section
  y += 15;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Información del Viajero", 20, y);

  y += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Nombre: ${customer.fullName}`, 20, y);

  y += 7;
  doc.text(`Email: ${customer.email}`, 20, y);

  if (customer.phone) {
    y += 7;
    doc.text(`Teléfono: ${customer.phone}`, 20, y);
  }

  // Preferences/Documents section
  if (preferences && (preferences.passportNumber || preferences.emergencyContactName)) {
    y += 10;
    doc.line(20, y, pageWidth - 20, y);

    y += 15;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Documentos y Contacto de Emergencia", 20, y);

    y += 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    if (preferences.passportNumber) {
      doc.text(`Pasaporte: ${preferences.passportNumber}`, 20, y);
      y += 7;
    }

    if (preferences.passportExpiry) {
      doc.text(`Vigencia: ${preferences.passportExpiry}`, 20, y);
      y += 7;
    }

    if (preferences.emergencyContactName) {
      doc.text(`Contacto de emergencia: ${preferences.emergencyContactName}`, 20, y);
      y += 7;
    }

    if (preferences.emergencyContactPhone) {
      doc.text(`Teléfono de emergencia: ${preferences.emergencyContactPhone}`, 20, y);
      y += 7;
    }

    if (preferences.dietaryRestrictions) {
      doc.text(`Restricciones alimenticias: ${preferences.dietaryRestrictions}`, 20, y);
      y += 7;
    }

    if (preferences.specialNeeds) {
      doc.text(`Necesidades especiales: ${preferences.specialNeeds}`, 20, y);
    }
  }

  // Admin note if any
  if (booking.adminNote) {
    y += 15;
    doc.line(20, y, pageWidth - 20, y);

    y += 15;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Notas del Operador", 20, y);

    y += 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const splitNote = doc.splitTextToSize(booking.adminNote, pageWidth - 40);
    doc.text(splitNote, 20, y);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(
    `Documento generado el ${new Date().toLocaleString("es-MX")}`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  doc.text(
    "Este documento es una confirmación de tu reservación. Preséntalo al momento de tu viaje.",
    pageWidth / 2,
    footerY + 5,
    { align: "center" }
  );

  // Save the PDF
  doc.save(`reservacion-${booking.id}.pdf`);
}
