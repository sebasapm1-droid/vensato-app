import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const pdfStyles = StyleSheet.create({
  page: { fontFamily: "Helvetica", padding: 40, fontSize: 10, color: "#1a1a1a" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
    paddingBottom: 16,
    borderBottom: "1 solid #e5e7eb",
  },
  logo: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#6B9080" },
  logoSub: { fontSize: 8, color: "#6b7280", marginTop: 2 },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", textAlign: "right", color: "#1a1a1a" },
  titleSub: { fontSize: 9, color: "#6b7280", textAlign: "right", marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: "#6b7280",
    letterSpacing: 1,
    marginBottom: 8,
  },
  row: { flexDirection: "row", marginBottom: 5 },
  label: { width: "40%", color: "#6b7280" },
  value: { width: "60%", fontFamily: "Helvetica-Bold" },
  divider: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 16 },
  amountBox: { backgroundColor: "#f3f8f6", padding: 16, borderRadius: 6, marginVertical: 16 },
  amountLabel: { fontSize: 9, color: "#6b7280", marginBottom: 4 },
  amountValue: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#6B9080" },
  footer: {
    marginTop: 32,
    paddingTop: 12,
    borderTop: "1 solid #e5e7eb",
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
  },
  split: { flexDirection: "row", gap: 20 },
  splitItem: { flex: 1, marginBottom: 20 },
});

type Props = {
  charge: {
    concept: string;
    amount: number;
    dueDate: string;
  };
  tenant: {
    fullName: string;
    cedula?: string;
    email?: string;
  };
  propertyName: string;
  owner: {
    fullName: string;
    nit: string;
    bankName: string;
    accountType: string;
    accountNumber: string;
    accountHolder: string;
    bankAccountKey?: string;
  };
};

export function createChargeEmailPdfDocument({
  charge,
  tenant,
  propertyName,
  owner,
}: Props) {
  const amount = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(charge.amount);

  const today = new Date().toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <View>
            <Text style={pdfStyles.logo}>Vensato</Text>
            <Text style={pdfStyles.logoSub}>Sistema de Gestion Inmobiliaria</Text>
          </View>
          <View>
            <Text style={pdfStyles.title}>Cuenta de Cobro</Text>
            <Text style={pdfStyles.titleSub}>Emitida el {today}</Text>
          </View>
        </View>

        <View style={pdfStyles.amountBox}>
          <Text style={pdfStyles.amountLabel}>VALOR A PAGAR</Text>
          <Text style={pdfStyles.amountValue}>{amount}</Text>
          <Text style={{ fontSize: 9, color: "#6b7280", marginTop: 4 }}>
            Concepto: {charge.concept}
          </Text>
        </View>

        <View style={pdfStyles.split}>
          <View style={pdfStyles.splitItem}>
            <Text style={pdfStyles.sectionTitle}>Arrendatario</Text>
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Nombre:</Text>
              <Text style={pdfStyles.value}>{tenant.fullName}</Text>
            </View>
            {tenant.cedula ? (
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.label}>Cedula:</Text>
                <Text style={pdfStyles.value}>{tenant.cedula}</Text>
              </View>
            ) : null}
            {tenant.email ? (
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.label}>Email:</Text>
                <Text style={pdfStyles.value}>{tenant.email}</Text>
              </View>
            ) : null}
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Inmueble:</Text>
              <Text style={pdfStyles.value}>{propertyName}</Text>
            </View>
          </View>

          <View style={pdfStyles.splitItem}>
            <Text style={pdfStyles.sectionTitle}>Propietario / Acreedor</Text>
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Nombre:</Text>
              <Text style={pdfStyles.value}>{owner.fullName || "-"}</Text>
            </View>
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>NIT/CC:</Text>
              <Text style={pdfStyles.value}>{owner.nit || "-"}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.divider} />

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Datos para Transferencia</Text>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Banco:</Text>
            <Text style={pdfStyles.value}>{owner.bankName || "-"}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Tipo de cuenta:</Text>
            <Text style={pdfStyles.value}>{owner.accountType || "-"}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Numero de cuenta:</Text>
            <Text style={pdfStyles.value}>{owner.accountNumber || "-"}</Text>
          </View>
          {owner.bankAccountKey ? (
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Llave:</Text>
              <Text style={pdfStyles.value}>{owner.bankAccountKey}</Text>
            </View>
          ) : null}
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Titular:</Text>
            <Text style={pdfStyles.value}>
              {owner.accountHolder || owner.fullName || "-"}
            </Text>
          </View>
        </View>

        <View style={pdfStyles.divider} />

        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Fecha de vencimiento:</Text>
          <Text
            style={{
              ...pdfStyles.value,
              color: "#e07a5f",
              fontFamily: "Helvetica-Bold",
            }}
          >
            {charge.dueDate}
          </Text>
        </View>

        <View style={pdfStyles.footer}>
          <Text>
            Generado automaticamente por Vensato · app.vensato.com · Este
            documento no reemplaza una factura electronica
          </Text>
        </View>
      </Page>
    </Document>
  );
}
