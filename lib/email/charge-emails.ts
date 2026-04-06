import { Resend } from "resend";
import { PassThrough } from "stream";
import { createServiceClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/permissions";

type EmailTrigger = "manual" | "automatic";

type ChargeRow = {
  id: string;
  user_id: string | null;
  tenant_id: string | null;
  property_id: string | null;
  concept: string;
  amount: number;
  due_date: string;
  status: string | null;
};

type TenantRow = {
  id: string;
  user_id: string | null;
  property_id: string | null;
  full_name: string;
  cedula: string | null;
  email: string | null;
  phone: string | null;
};

type PropertyRow = {
  id: string;
  alias: string;
  address: string | null;
  city: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  cedula: string | null;
  bank_name: string | null;
  bank_account_type: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
  bank_account_key: string | null;
  tier: "base" | "inicio" | "portafolio" | "patrimonio";
  subscription_status: "active" | "past_due" | "cancelled" | "trialing";
  subscription_valid_until: string | null;
};

type DeliveryRow = {
  charge_id: string;
};

type ChargeEmailPayload = {
  charge: ChargeRow;
  tenant: TenantRow;
  property: PropertyRow | null;
  profile: ProfileRow;
  recipientEmail: string;
};

type PDFDocumentLike = {
  pipe: (target: NodeJS.WritableStream) => NodeJS.WritableStream;
  font: (name: string) => PDFDocumentLike;
  fontSize: (size: number) => PDFDocumentLike;
  fillColor: (color: string) => PDFDocumentLike;
  text: (
    text: string,
    x?: number,
    y?: number,
    options?: Record<string, unknown>
  ) => PDFDocumentLike;
  moveTo: (x: number, y: number) => PDFDocumentLike;
  lineTo: (x: number, y: number) => PDFDocumentLike;
  lineWidth: (width: number) => PDFDocumentLike;
  strokeColor: (color: string) => PDFDocumentLike;
  stroke: () => PDFDocumentLike;
  end: () => void;
};

type PDFDocumentConstructor = new (options?: {
  size?: string;
  margin?: number;
}) => PDFDocumentLike;

type SendChargeEmailResult =
  | {
      ok: true;
      messageId: string | null;
      recipientEmail: string;
      subject: string;
    }
  | {
      ok: false;
      error: string;
    };

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildSubject(charge: ChargeRow): string {
  const date = new Date(`${charge.due_date}T12:00:00`);
  const month = new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
  }).format(date);

  return `Cuenta de cobro de arriendo - ${month}`;
}

function buildFilename(payload: ChargeEmailPayload): string {
  const safeTenant = payload.tenant.full_name.replace(/\s+/g, "_");
  return `CuentaCobro_${safeTenant}_${payload.charge.due_date}.pdf`;
}

function buildHtml(payload: ChargeEmailPayload): string {
  const ownerName = payload.profile.full_name ?? "Propietario";
  const propertyName = payload.property?.alias ?? "Inmueble asociado";

  return `
    <div style="font-family: Arial, sans-serif; color: #1f2924; line-height: 1.55;">
      <p>Hola ${payload.tenant.full_name},</p>
      <p>Adjunto encontrarás tu cuenta de cobro correspondiente al canon de arrendamiento.</p>
      <p><strong>Inmueble:</strong> ${propertyName}<br />
      <strong>Concepto:</strong> ${payload.charge.concept}<br />
      <strong>Valor:</strong> ${formatCurrency(payload.charge.amount)}<br />
      <strong>Vencimiento:</strong> ${payload.charge.due_date}</p>
      <p>Este correo fue generado automáticamente por Vensato en nombre de ${ownerName}.</p>
      <p>Quedamos atentos.</p>
    </div>
  `.trim();
}

function buildText(payload: ChargeEmailPayload): string {
  return [
    `Hola ${payload.tenant.full_name},`,
    "",
    "Adjunto encontrarás tu cuenta de cobro correspondiente al canon de arrendamiento.",
    `Inmueble: ${payload.property?.alias ?? "Inmueble asociado"}`,
    `Concepto: ${payload.charge.concept}`,
    `Valor: ${formatCurrency(payload.charge.amount)}`,
    `Vencimiento: ${payload.charge.due_date}`,
    "",
    `Correo generado automáticamente por Vensato en nombre de ${payload.profile.full_name ?? "Propietario"}.`,
  ].join("\n");
}

function drawLabelValue(
  document: PDFDocumentLike,
  label: string,
  value: string,
  y: number
): void {
  document
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#4a5750")
    .text(label, 56, y)
    .font("Helvetica-Bold")
    .fillColor("#1f2924")
    .text(value, 150, y, { width: 370 });
}

async function renderChargePdf(payload: ChargeEmailPayload): Promise<Buffer> {
  try {
    const PDFDocument = require("pdfkit/js/pdfkit.standalone.js") as PDFDocumentConstructor;
    const document = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    const stream = document.pipe(new PassThrough());

    stream.on("data", (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    const today = new Date().toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const amount = formatCurrency(payload.charge.amount);
    const propertyName = payload.property?.alias ?? "Inmueble asociado";
    const ownerName = payload.profile.full_name ?? "-";
    const ownerId = payload.profile.cedula ?? "-";
    const bankName = payload.profile.bank_name ?? "-";
    const accountType = payload.profile.bank_account_type ?? "-";
    const accountNumber = payload.profile.bank_account_number ?? "-";
    const accountHolder =
      payload.profile.bank_account_holder ?? payload.profile.full_name ?? "-";

    document
      .font("Times-Bold")
      .fontSize(24)
      .fillColor("#1f2924")
      .text("Vensato", 48, 44)
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#728178")
      .text("Sistema de Gestión Inmobiliaria", 48, 72)
      .font("Times-Bold")
      .fontSize(26)
      .fillColor("#111111")
      .text("Cuenta de Cobro", 300, 46, { width: 250, align: "right" })
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#728178")
      .text(`Emitida el ${today}`, 300, 78, { width: 250, align: "right" })
      .lineWidth(1)
      .strokeColor("#dfe6e2")
      .moveTo(48, 108)
      .lineTo(548, 108)
      .stroke();

    document
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#728178")
      .text("VALOR A PAGAR", 48, 136)
      .font("Times-Bold")
      .fontSize(30)
      .fillColor("#1f2924")
      .text(amount, 48, 152)
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#4a5750")
      .text(`Concepto: ${payload.charge.concept}`, 48, 194, { width: 500 });

    document
      .lineWidth(1)
      .strokeColor("#e4eae7")
      .moveTo(48, 230)
      .lineTo(548, 230)
      .stroke()
      .font("Times-Bold")
      .fontSize(15)
      .fillColor("#1f2924")
      .text("Arrendatario", 48, 248);

    drawLabelValue(document, "Nombre", payload.tenant.full_name, 278);
    if (payload.tenant.cedula) {
      drawLabelValue(document, "Cédula", payload.tenant.cedula, 296);
    }
    if (payload.tenant.email) {
      drawLabelValue(document, "Correo", payload.tenant.email, 314);
    }
    drawLabelValue(document, "Inmueble", propertyName, 332);

    document
      .lineWidth(1)
      .strokeColor("#e4eae7")
      .moveTo(48, 366)
      .lineTo(548, 366)
      .stroke()
      .font("Times-Bold")
      .fontSize(15)
      .fillColor("#1f2924")
      .text("Propietario / Acreedor", 48, 384);

    drawLabelValue(document, "Nombre", ownerName, 414);
    drawLabelValue(document, "NIT / CC", ownerId, 432);

    document
      .lineWidth(1)
      .strokeColor("#e4eae7")
      .moveTo(48, 466)
      .lineTo(548, 466)
      .stroke()
      .font("Times-Bold")
      .fontSize(15)
      .fillColor("#1f2924")
      .text("Datos para Transferencia", 48, 484);

    drawLabelValue(document, "Banco", bankName, 514);
    drawLabelValue(document, "Tipo de cuenta", accountType, 532);
    drawLabelValue(document, "Número de cuenta", accountNumber, 550);

    let currentY = 568;
    if (payload.profile.bank_account_key) {
      drawLabelValue(document, "Llave", payload.profile.bank_account_key, currentY);
      currentY += 18;
    }

    drawLabelValue(document, "Titular", accountHolder, currentY);
    currentY += 34;

    document
      .lineWidth(1)
      .strokeColor("#e4eae7")
      .moveTo(48, currentY)
      .lineTo(548, currentY)
      .stroke()
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#c85d47")
      .text(`Fecha de vencimiento: ${payload.charge.due_date}`, 48, currentY + 22);

    document
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#7b8780")
      .text("Generado automáticamente por Vensato.", 48, currentY + 78, {
        width: 500,
        align: "center",
      });

    document.end();

    await new Promise<void>((resolve, reject) => {
      stream.on("end", () => resolve());
      stream.on("error", reject);
    });

    return Buffer.concat(chunks);
  } catch (error) {
    console.error("[charge-email] PDF render failed:", error);
    throw error;
  }
}

async function fetchChargeEmailPayload(
  chargeId: string,
  userId: string
): Promise<ChargeEmailPayload | null> {
  const supabase = createServiceClient();

  const { data: charge, error: chargeError } = await supabase
    .from("charges")
    .select("id, user_id, tenant_id, property_id, concept, amount, due_date, status")
    .eq("id", chargeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (chargeError) {
    throw new Error(chargeError.message);
  }

  if (!charge) {
    return null;
  }

  const chargeRow = charge as ChargeRow;
  if (!chargeRow.tenant_id) {
    throw new Error("El cobro no tiene un inquilino asociado.");
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, user_id, property_id, full_name, cedula, email, phone")
    .eq("id", chargeRow.tenant_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (tenantError) {
    throw new Error(tenantError.message);
  }

  if (!tenant) {
    throw new Error("No encontré el inquilino del cobro.");
  }

  const tenantRow = tenant as TenantRow;
  const propertyId = chargeRow.property_id ?? tenantRow.property_id;

  let propertyRow: PropertyRow | null = null;
  if (propertyId) {
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id, alias, address, city")
      .eq("id", propertyId)
      .eq("user_id", userId)
      .maybeSingle();

    if (propertyError) {
      throw new Error(propertyError.message);
    }

    propertyRow = (property as PropertyRow | null) ?? null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, cedula, bank_name, bank_account_type, bank_account_number, bank_account_holder, bank_account_key, tier, subscription_status, subscription_valid_until"
    )
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile) {
    throw new Error("No encontré el perfil del propietario.");
  }

  if (!tenantRow.email) {
    throw new Error("El inquilino no tiene correo electrónico.");
  }

  return {
    charge: chargeRow,
    tenant: tenantRow,
    property: propertyRow,
    profile: profile as ProfileRow,
    recipientEmail: tenantRow.email,
  };
}

async function logDelivery(params: {
  chargeId: string;
  userId: string;
  tenantId: string | null;
  recipientEmail: string;
  subject: string;
  trigger: EmailTrigger;
  status: "sent" | "failed" | "skipped";
  providerMessageId?: string | null;
  errorMessage?: string | null;
}): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("charge_email_deliveries").insert({
    charge_id: params.chargeId,
    user_id: params.userId,
    tenant_id: params.tenantId,
    provider: "resend",
    provider_message_id: params.providerMessageId ?? null,
    trigger: params.trigger,
    status: params.status,
    recipient_email: params.recipientEmail,
    subject: params.subject,
    error_message: params.errorMessage ?? null,
  });

  if (error) {
    console.error("[charge-email] Log delivery failed:", error);
  }
}

export async function sendChargeEmail(
  chargeId: string,
  userId: string,
  trigger: EmailTrigger
): Promise<SendChargeEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: "Falta configurar RESEND_API_KEY." };
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    return { ok: false, error: "Falta configurar RESEND_FROM_EMAIL." };
  }

  try {
    const payload = await fetchChargeEmailPayload(chargeId, userId);
    if (!payload) {
      return { ok: false, error: "Cobro no encontrado." };
    }

    if (payload.charge.status === "paid") {
      return { ok: false, error: "No se envían cuentas de cobro para cobros pagados." };
    }

    const subject = buildSubject(payload.charge);
    const pdfBuffer = await renderChargePdf(payload);
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: [payload.recipientEmail],
      subject,
      html: buildHtml(payload),
      text: buildText(payload),
      attachments: [
        {
          filename: buildFilename(payload),
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      await logDelivery({
        chargeId,
        userId,
        tenantId: payload.tenant.id,
        recipientEmail: payload.recipientEmail,
        subject,
        trigger,
        status: "failed",
        errorMessage: error.message,
      });

      return { ok: false, error: error.message };
    }

    await logDelivery({
      chargeId,
      userId,
      tenantId: payload.tenant.id,
      recipientEmail: payload.recipientEmail,
      subject,
      trigger,
      status: "sent",
      providerMessageId: data?.id ?? null,
    });

    return {
      ok: true,
      messageId: data?.id ?? null,
      recipientEmail: payload.recipientEmail,
      subject,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo enviar la cuenta de cobro.";
    console.error("[charge-email] Send failed:", error);

    try {
      const payload = await fetchChargeEmailPayload(chargeId, userId);
      if (payload) {
        await logDelivery({
          chargeId,
          userId,
          tenantId: payload.tenant.id,
          recipientEmail: payload.recipientEmail,
          subject: buildSubject(payload.charge),
          trigger,
          status: "failed",
          errorMessage: message,
        });
      }
    } catch {
      // Ignore secondary logging errors.
    }

    return { ok: false, error: message };
  }
}

export async function listAutomaticChargeCandidates(targetDate: string): Promise<
  Array<{ chargeId: string; userId: string }>
> {
  const supabase = createServiceClient();

  const { data: charges, error: chargesError } = await supabase
    .from("charges")
    .select("id, user_id, tenant_id, property_id, concept, amount, due_date, status")
    .eq("status", "pending")
    .eq("due_date", targetDate);

  if (chargesError) {
    throw new Error(chargesError.message);
  }

  const rows = (charges ?? []) as ChargeRow[];
  if (rows.length === 0) {
    return [];
  }

  const userIds = Array.from(
    new Set(
      rows
        .map((row) => row.user_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  );

  const chargeIds = rows.map((row) => row.id);

  const [profilesResult, deliveriesResult, tenantsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, tier, subscription_status, subscription_valid_until")
      .in("id", userIds),
    supabase
      .from("charge_email_deliveries")
      .select("charge_id")
      .in("charge_id", chargeIds)
      .eq("trigger", "automatic")
      .eq("status", "sent"),
    supabase
      .from("tenants")
      .select("id, email")
      .in(
        "id",
        rows
          .map((row) => row.tenant_id)
          .filter((value): value is string => typeof value === "string" && value.length > 0)
      ),
  ]);

  if (profilesResult.error) {
    throw new Error(profilesResult.error.message);
  }

  if (deliveriesResult.error) {
    throw new Error(deliveriesResult.error.message);
  }

  if (tenantsResult.error) {
    throw new Error(tenantsResult.error.message);
  }

  const profileMap = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile])
  );
  const sentChargeIds = new Set(
    ((deliveriesResult.data ?? []) as DeliveryRow[]).map((row) => row.charge_id)
  );
  const tenantEmailMap = new Map(
    (tenantsResult.data ?? []).map((tenant) => [tenant.id, tenant.email])
  );

  return rows
    .filter((row) => {
      if (!row.user_id || !row.tenant_id) {
        return false;
      }

      if (sentChargeIds.has(row.id)) {
        return false;
      }

      const profile = profileMap.get(row.user_id);
      if (!profile || !getPlan(profile as ProfileRow).hasChargeEmailAutomatic) {
        return false;
      }

      return Boolean(tenantEmailMap.get(row.tenant_id));
    })
    .map((row) => ({
      chargeId: row.id,
      userId: row.user_id as string,
    }));
}
