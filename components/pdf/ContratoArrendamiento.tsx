import {
  Document, Page, Text, View, StyleSheet,
} from "@react-pdf/renderer";

const S = StyleSheet.create({
  page: { fontFamily: "Helvetica", padding: 45, fontSize: 9.5, color: "#111", lineHeight: 1.5 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24, paddingBottom: 14, borderBottom: "1 solid #ccc" },
  logo: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#6B9080" },
  logoSub: { fontSize: 7.5, color: "#888", marginTop: 2 },
  docTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 },
  section: { marginBottom: 14 },
  sTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase", color: "#666", letterSpacing: 0.8, marginBottom: 5, borderBottom: "0.5 solid #ddd", paddingBottom: 3 },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: "42%", color: "#555" },
  value: { width: "58%", fontFamily: "Helvetica-Bold" },
  body: { fontSize: 9, lineHeight: 1.6, marginBottom: 8, textAlign: "justify" },
  clauseNum: { fontFamily: "Helvetica-Bold", marginRight: 4 },
  footer: { marginTop: 28, paddingTop: 10, borderTop: "1 solid #ccc", fontSize: 7.5, color: "#999", textAlign: "center" },
  sigBox: { flexDirection: "row", justifyContent: "space-between", marginTop: 30 },
  sig: { width: "44%", borderTop: "1 solid #111", paddingTop: 8, fontSize: 8.5 },
});

const formatCOP = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);
const today = () => new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });

interface Props {
  contract: {
    property: string; tenant: string; cedula: string;
    startDate: string; endDate: string; vigencyMonths: number;
    rentAmount: number; incrementType: string;
  };
  owner: { fullName: string; nit: string; };
}

export function ContratoArrendamiento({ contract, owner }: Props) {
  return (
    <Document>
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <View><Text style={S.logo}>Vensato</Text><Text style={S.logoSub}>Sistema de Gestión Inmobiliaria</Text></View>
          <View><Text style={{ fontSize: 8, color: "#888", textAlign: "right" }}>Bogotá, {today()}</Text></View>
        </View>

        <Text style={S.docTitle}>Contrato de Arrendamiento de Vivienda Urbana</Text>

        {/* Partes */}
        <View style={S.section}>
          <Text style={S.sTitle}>Partes del Contrato</Text>
          <View style={S.row}><Text style={S.label}>Arrendador:</Text><Text style={S.value}>{owner.fullName || "________________"}</Text></View>
          <View style={S.row}><Text style={S.label}>CC/NIT Arrendador:</Text><Text style={S.value}>{owner.nit || "________________"}</Text></View>
          <View style={S.row}><Text style={S.label}>Arrendatario:</Text><Text style={S.value}>{contract.tenant}</Text></View>
          <View style={S.row}><Text style={S.label}>CC/NIT Arrendatario:</Text><Text style={S.value}>{contract.cedula}</Text></View>
          <View style={S.row}><Text style={S.label}>Inmueble:</Text><Text style={S.value}>{contract.property}</Text></View>
        </View>

        {/* Términos */}
        <View style={S.section}>
          <Text style={S.sTitle}>Términos Económicos y de Vigencia</Text>
          <View style={S.row}><Text style={S.label}>Canon mensual:</Text><Text style={S.value}>{formatCOP(contract.rentAmount)}</Text></View>
          <View style={S.row}><Text style={S.label}>Vigencia:</Text><Text style={S.value}>{contract.vigencyMonths} meses ({contract.startDate} al {contract.endDate})</Text></View>
          <View style={S.row}><Text style={S.label}>Incremento anual:</Text><Text style={S.value}>{contract.incrementType}</Text></View>
        </View>

        {/* Cláusulas */}
        <View style={S.section}>
          <Text style={S.sTitle}>Cláusulas Generales</Text>
          <Text style={S.body}><Text style={S.clauseNum}>PRIMERA – OBJETO.</Text> El ARRENDADOR entrega al ARRENDATARIO a título de arrendamiento el inmueble de su propiedad identificado como {contract.property}, para destinarlo única y exclusivamente a vivienda urbana.</Text>
          <Text style={S.body}><Text style={S.clauseNum}>SEGUNDA – CANON.</Text> El canon de arrendamiento pactado es de {formatCOP(contract.rentAmount)} mensuales, pagaderos del 1 al 5 de cada mes, mediante transferencia a la cuenta registrada por el arrendador.</Text>
          <Text style={S.body}><Text style={S.clauseNum}>TERCERA – VIGENCIA.</Text> El presente contrato tiene una duración de {contract.vigencyMonths} meses contados a partir del {contract.startDate}, prorrogable automáticamente por períodos iguales salvo desahucio con mínimo 3 meses de anticipación.</Text>
          <Text style={S.body}><Text style={S.clauseNum}>CUARTA – INCREMENTO.</Text> Al vencimiento de cada período anual, el canon se incrementará conforme al criterio acordado: {contract.incrementType}, de acuerdo con lo dispuesto en la Ley 820 de 2003.</Text>
          <Text style={S.body}><Text style={S.clauseNum}>QUINTA – SERVICIOS.</Text> El ARRENDATARIO se obliga a pagar oportunamente los servicios públicos domiciliarios y la cuota de administración si aplica, y a presentar los paz y salvos al ARRENDADOR cuando este los solicite.</Text>
          <Text style={S.body}><Text style={S.clauseNum}>SEXTA – CONSERVACIÓN.</Text> El ARRENDATARIO se compromete a cuidar el inmueble con la misma diligencia que usaría en cosa propia, y a restituirlo en idénticas condiciones al finalizar el contrato.</Text>
          <Text style={S.body}><Text style={S.clauseNum}>SÉPTIMA – SUBARRENDAMIENTO.</Text> Queda expresamente prohibido subarrendar total o parcialmente el inmueble sin previa autorización escrita del ARRENDADOR.</Text>
        </View>

        {/* Firmas */}
        <View style={S.sigBox}>
          <View style={S.sig}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{owner.fullName || "Arrendador"}</Text>
            <Text style={{ color: "#666", marginTop: 2 }}>CC/NIT: {owner.nit || "—"}</Text>
            <Text style={{ color: "#666" }}>Arrendador</Text>
          </View>
          <View style={S.sig}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{contract.tenant}</Text>
            <Text style={{ color: "#666", marginTop: 2 }}>CC/NIT: {contract.cedula}</Text>
            <Text style={{ color: "#666" }}>Arrendatario</Text>
          </View>
        </View>

        <View style={S.footer}>
          <Text>Generado por Vensato · app.vensato.com · Documento con validez legal entre las partes firmantes</Text>
        </View>
      </Page>
    </Document>
  );
}
