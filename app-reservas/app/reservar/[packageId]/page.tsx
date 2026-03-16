import { notFound } from "next/navigation";
import ReservarClient from "./ReservarClient";

export default async function ReservarPage({
  params,
}: {
  params: Promise<{ packageId: string }>;
}) {
  const { packageId: rawPackageId } = await params;
  const packageId = Number(rawPackageId);

  if (!Number.isFinite(packageId) || packageId <= 0) {
    notFound();
  }

  return <ReservarClient packageId={packageId} />;
}
