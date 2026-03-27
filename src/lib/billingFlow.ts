import { db } from './db';

type PackageId = 'starter' | 'growth' | 'pro';

type StartBillingInput = {
  leadId: string;
  orderId: string;
  packageId: PackageId;
  buyerName: string;
  buyerEmail: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function buildLoginInstruction(orderId: string) {
  const tempPassword = `Omnifyi#${orderId.slice(-6)}`;
  const setPasswordLink = `https://pos.omnifyi.com/create-password?order=${encodeURIComponent(orderId)}`;
  return { tempPassword, setPasswordLink };
}

export async function runLocalBillingFlow(input: StartBillingInput) {
  await sleep(1200);
  await db.crmLeads.update(input.leadId, {
    stage: 'PAID',
    updatedAt: new Date(),
    notes: 'Pembayaran Midtrans terdeteksi otomatis (simulasi lokal).',
  });

  await db.buyerInbox.add({
    id: crypto.randomUUID(),
    leadId: input.leadId,
    senderName: 'System Billing',
    senderEmail: 'noreply@omnifyi.com',
    message: `Email konfirmasi pembayaran terkirim ke ${input.buyerEmail} untuk order ${input.orderId}.`,
    createdAt: new Date(),
    status: 'NEW',
  });

  await sleep(900);
  const authProvision = buildLoginInstruction(input.orderId);
  await db.crmLeads.update(input.leadId, {
    stage: 'ONBOARDED',
    updatedAt: new Date(),
    notes: `Provisioning login otomatis selesai. Temp password: ${authProvision.tempPassword} | Set password: ${authProvision.setPasswordLink}`,
  });

  await db.buyerInbox.add({
    id: crypto.randomUUID(),
    leadId: input.leadId,
    senderName: 'System Auth',
    senderEmail: 'noreply@omnifyi.com',
    message: `Mekanisme login terkirim ke ${input.buyerEmail}. Link: ${authProvision.setPasswordLink}`,
    createdAt: new Date(),
    status: 'NEW',
  });

  return authProvision;
}

