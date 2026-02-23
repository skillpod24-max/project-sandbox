import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatIndianNumber } from './formatters';

interface VehicleInfo {
  brand: string;
  model: string;
  variant?: string | null;
  registration_number?: string | null;
  engine_number?: string | null;
  chassis_number?: string | null;
  manufacturing_year: number;
  color?: string | null;
  fuel_type: string;
  transmission: string;
  vehicle_type: string;
  condition: string;
  odometer_reading?: number | null;
  selling_price: number;
  purchase_price: number;
  mileage?: number | null;
  seating_capacity?: number | null;
  tyre_condition?: string | null;
  battery_health?: string | null;
  number_of_owners?: number | null;
  insurance_expiry?: string | null;
  puc_expiry?: string | null;
  fitness_expiry?: string | null;
  public_description?: string | null;
  public_highlights?: string[] | null;
  public_features?: string[] | null;
  notes?: string | null;
}

interface DealerInfo {
  dealer_name?: string | null;
  dealer_phone?: string | null;
  dealer_email?: string | null;
  dealer_address?: string | null;
}

const formatRupees = (num: number): string => {
  return '₹ ' + formatIndianNumber(num);
};

// Parse specs from notes
const parseNoteSpecs = (notes: string | null | undefined): Record<string, string> => {
  if (!notes) return {};
  const specs: Record<string, string> = {};
  const regex = /\[([^:]+): ([^\]]+)\]/g;
  let match;
  while ((match = regex.exec(notes)) !== null) {
    specs[match[1]] = match[2];
  }
  return specs;
};

export const generateVehicleBrochurePDF = async (
  vehicle: VehicleInfo,
  dealer: DealerInfo,
  imageUrl?: string
): Promise<void> => {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const noteSpecs = parseNoteSpecs(vehicle.notes);

  // ──── COLOR PALETTE ────
  const DARK: [number, number, number] = [20, 30, 48];
  const ACCENT: [number, number, number] = [220, 53, 69];
  const WHITE: [number, number, number] = [255, 255, 255];
  const LIGHT_BG: [number, number, number] = [245, 247, 250];
  const TEXT_GRAY: [number, number, number] = [80, 90, 100];

  // ──── TOP BANNER (Dark) ────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 28, 'F');

  // Accent stripe
  doc.setFillColor(...ACCENT);
  doc.rect(0, 28, W, 2.5, 'F');

  // Dealer name
  doc.setTextColor(...WHITE);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(dealer.dealer_name || 'VahanHub', 15, 12);

  // Dealer contact
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 210, 220);
  const contactParts = [dealer.dealer_phone, dealer.dealer_email].filter(Boolean);
  if (contactParts.length) doc.text(contactParts.join('  •  '), 15, 19);
  if (dealer.dealer_address) doc.text(dealer.dealer_address, 15, 24);

  let y = 35;

  // ──── VEHICLE IMAGE ────
  if (imageUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        img.onload = () => {
          const maxW = W - 30;
          const maxH = 80;
          const ratio = img.width / img.height;
          let imgW = maxW;
          let imgH = imgW / ratio;
          if (imgH > maxH) { imgH = maxH; imgW = imgH * ratio; }
          const x = (W - imgW) / 2;

          // Subtle bg
          doc.setFillColor(...LIGHT_BG);
          doc.roundedRect(x - 3, y - 2, imgW + 6, imgH + 4, 3, 3, 'F');
          doc.addImage(img, 'JPEG', x, y, imgW, imgH);
          y += imgH + 8;
          resolve();
        };
        img.onerror = () => resolve();
        img.src = imageUrl;
      });
    } catch { /* skip */ }
  }

  // ──── VEHICLE TITLE BAR ────
  doc.setFillColor(...DARK);
  doc.roundedRect(15, y, W - 30, 20, 3, 3, 'F');

  doc.setTextColor(...WHITE);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const title = `${vehicle.brand} ${vehicle.model}${vehicle.variant ? ' ' + vehicle.variant : ''}`;
  doc.text(title, 22, y + 9);

  // Price badge
  doc.setFillColor(...ACCENT);
  const priceText = formatRupees(vehicle.selling_price);
  const priceW = doc.getStringUnitWidth(priceText) * 11 / doc.internal.scaleFactor + 14;
  doc.roundedRect(W - 15 - priceW, y + 4, priceW, 12, 6, 6, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(priceText, W - 15 - priceW / 2, y + 12, { align: 'center' });

  y += 26;

  // ──── QUICK SPECS ROW ────
  const quickSpecs = [
    { label: 'YEAR', value: String(vehicle.manufacturing_year) },
    { label: 'FUEL', value: vehicle.fuel_type.toUpperCase() },
    { label: 'TRANSMISSION', value: vehicle.transmission.toUpperCase() },
    { label: 'OWNERS', value: String(vehicle.number_of_owners || 1) },
    { label: 'KM DRIVEN', value: vehicle.odometer_reading ? formatIndianNumber(vehicle.odometer_reading) : 'N/A' },
  ];
  const boxW = (W - 30 - (quickSpecs.length - 1) * 3) / quickSpecs.length;
  quickSpecs.forEach((s, i) => {
    const x = 15 + i * (boxW + 3);
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(x, y, boxW, 16, 2, 2, 'F');
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 150, 160);
    doc.text(s.label, x + boxW / 2, y + 5.5, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 40, 50);
    doc.text(s.value, x + boxW / 2, y + 12.5, { align: 'center' });
  });
  y += 21;

  // ──── DESCRIPTION ────
  if (vehicle.public_description) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_GRAY);
    const lines = doc.splitTextToSize(vehicle.public_description, W - 36);
    const descH = lines.length * 3.8 + 6;
    doc.setFillColor(252, 253, 255);
    doc.roundedRect(15, y, W - 30, descH, 2, 2, 'F');
    doc.text(lines, 20, y + 5);
    y += descH + 3;
  }

  // ──── HIGHLIGHTS (Inline badges) ────
  if (vehicle.public_highlights && vehicle.public_highlights.length > 0) {
    doc.setFillColor(...ACCENT);
    doc.setTextColor(...WHITE);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    let hx = 15;
    vehicle.public_highlights.slice(0, 6).forEach((h) => {
      const tw = doc.getStringUnitWidth(h) * 7 / doc.internal.scaleFactor + 8;
      if (hx + tw > W - 15) { hx = 15; y += 8; }
      doc.roundedRect(hx, y, tw, 7, 3.5, 3.5, 'F');
      doc.text(h, hx + tw / 2, y + 5, { align: 'center' });
      hx += tw + 3;
    });
    y += 12;
  }

  // ──── SPECIFICATIONS TABLE ────
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('VEHICLE SPECIFICATIONS', 15, y + 1);

  // Accent underline
  doc.setFillColor(...ACCENT);
  doc.rect(15, y + 2.5, 40, 0.8, 'F');
  y += 6;

  const specRows: string[][] = [
    ['Registration', vehicle.registration_number || 'N/A', 'Condition', vehicle.condition.toUpperCase()],
    ['Color', vehicle.color || 'N/A', 'Mileage', vehicle.mileage ? `${vehicle.mileage} km/l` : 'N/A'],
    ['Tyre Condition', vehicle.tyre_condition || 'N/A', 'Battery', vehicle.battery_health || 'N/A'],
  ];

  if (vehicle.seating_capacity) specRows.push(['Seating', `${vehicle.seating_capacity} Seater`, '', '']);

  // Add parsed note specs
  const noteEntries = Object.entries(noteSpecs);
  for (let i = 0; i < noteEntries.length; i += 2) {
    const [k1, v1] = noteEntries[i];
    const [k2, v2] = noteEntries[i + 1] || ['', ''];
    specRows.push([k1, v1, k2, v2]);
  }

  autoTable(doc, {
    startY: y,
    body: specRows,
    theme: 'plain',
    styles: { fontSize: 7.5, cellPadding: { top: 2, bottom: 2, left: 3, right: 3 } },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35, textColor: TEXT_GRAY },
      1: { cellWidth: 50, textColor: [30, 30, 30] },
      2: { fontStyle: 'bold', cellWidth: 35, textColor: TEXT_GRAY },
      3: { cellWidth: 50, textColor: [30, 30, 30] },
    },
    alternateRowStyles: { fillColor: [250, 251, 253] },
    margin: { left: 15, right: 15 },
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  // ──── FEATURES GRID ────
  if (vehicle.public_features && vehicle.public_features.length > 0 && y < H - 50) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('FEATURES', 15, y + 1);
    doc.setFillColor(...ACCENT);
    doc.rect(15, y + 2.5, 20, 0.8, 'F');
    y += 7;

    const cols = 3;
    const colW = (W - 34) / cols;
    vehicle.public_features.slice(0, 12).forEach((f, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const fx = 17 + col * colW;
      const fy = y + row * 5.5;

      doc.setFillColor(...ACCENT);
      doc.circle(fx + 1.5, fy + 0.5, 1, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 60, 70);
      doc.text(f, fx + 5, fy + 1);
    });
    y += Math.ceil(Math.min(vehicle.public_features.length, 12) / cols) * 5.5 + 5;
  }

  // ──── VALIDITY TABLE ────
  const validities: string[][] = [];
  if (vehicle.insurance_expiry) validities.push(['Insurance', new Date(vehicle.insurance_expiry).toLocaleDateString('en-IN')]);
  if (vehicle.puc_expiry) validities.push(['PUC', new Date(vehicle.puc_expiry).toLocaleDateString('en-IN')]);
  if (vehicle.fitness_expiry) validities.push(['Fitness', new Date(vehicle.fitness_expiry).toLocaleDateString('en-IN')]);

  if (validities.length > 0 && y < H - 40) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('DOCUMENT VALIDITY', 15, y + 1);
    doc.setFillColor(...ACCENT);
    doc.rect(15, y + 2.5, 32, 0.8, 'F');
    y += 6;

    autoTable(doc, {
      startY: y,
      body: validities,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30 }, 1: { cellWidth: 35 } },
      headStyles: { fillColor: ACCENT as any, fontSize: 7.5 },
      margin: { left: 15, right: W - 85 },
    });
  }

  // ──── FOOTER ────
  const footerH = 18;
  const footerY = H - footerH;
  doc.setFillColor(...DARK);
  doc.rect(0, footerY, W, footerH, 'F');
  doc.setFillColor(...ACCENT);
  doc.rect(0, footerY, W, 1.5, 'F');

  doc.setTextColor(...WHITE);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(dealer.dealer_name || 'VahanHub', W / 2, footerY + 7, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 190, 200);
  doc.text('Contact us for test drive & best deals  •  Generated by VahanHub', W / 2, footerY + 13, { align: 'center' });

  // Save
  const fileName = `${vehicle.brand}_${vehicle.model}_${vehicle.manufacturing_year}_Brochure.pdf`;
  doc.save(fileName.replace(/\s+/g, '_'));
};
