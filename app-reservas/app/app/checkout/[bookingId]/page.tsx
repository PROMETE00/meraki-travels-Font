import { notFound } from "next/navigation";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutBookingPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId: rawBookingId } = await params;
  const bookingId = Number(rawBookingId);

  if (!Number.isFinite(bookingId) || bookingId <= 0) {
    notFound();
  }

  return <CheckoutClient bookingId={bookingId} />;
}
