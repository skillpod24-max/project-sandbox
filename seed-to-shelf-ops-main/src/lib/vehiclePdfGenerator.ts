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
}

interface DealerInfo {
  dealer_name?: string | null;
  dealer_phone?: string | null;
  dealer_email?: string | null;
  dealer_address?: string | null;
}

const formatRupees = (num: number): string => {
  return 'Rs. ' + formatIndianNumber(num);
};

export const generateVehicleBrochurePDF = async (
  vehicle: VehicleInfo,
  dealer: DealerInfo,
  imageUrl?: string
): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  let yPos = 0;

  // Header with gradient effect - Top Banner
  doc.setFillColor(20, 40, 70);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setDrawColor(255, 255, 255);
doc.setLineWidth(0.5);
doc.line(20, 36, pageWidth - 20, 36);

  
  // Dealer name in header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(dealer.dealer_name || 'VahanHub', pageWidth / 2, 15, { align: 'center' });
  
  // Dealer contact in header
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const contactLine = [dealer.dealer_phone, dealer.dealer_email].filter(Boolean).join('  |  ');
  if (contactLine) {
    doc.text(contactLine, pageWidth / 2, 25, { align: 'center' });
  }
  if (dealer.dealer_address) {
    doc.setFontSize(8);
    doc.text(dealer.dealer_address, pageWidth / 2, 31, { align: 'center' });
  }
  
  yPos = 42;

  // Add vehicle image if available - Below Header
  if (imageUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve) => {
        img.onload = () => {
          const imgWidth = 140;
          const imgHeight = (img.height / img.width) * imgWidth;
          const maxHeight = 100;
          const finalHeight = Math.min(imgHeight, maxHeight);
          const finalWidth = (finalHeight / imgHeight) * imgWidth;
          
          const x = (pageWidth - finalWidth) / 2;
          
          // Image container with border
          doc.setFillColor(245, 247, 250);
          doc.roundedRect(x - 5, yPos - 3, finalWidth + 10, finalHeight + 6, 4, 4, 'F');
          doc.setDrawColor(200, 210, 220);
          doc.setLineWidth(0.5);
          doc.roundedRect(x - 5, yPos - 3, finalWidth + 10, finalHeight + 6, 4, 4, 'S');
          
          doc.addImage(img, 'JPEG', x, yPos, finalWidth, finalHeight);
          yPos += finalHeight + 15;
          resolve();
        };
        img.onerror = () => resolve();
        img.src = imageUrl;
      });
    } catch (e) {
      // Skip image on error
    }
  }

  // Vehicle Title Section
  doc.setFillColor(30, 58, 95);
  doc.roundedRect(15, yPos, pageWidth - 30, 32, 4, 4, 'F');
  
  // Vehicle name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  const vehicleName = `${vehicle.brand} ${vehicle.model}`;
  doc.text(vehicleName, pageWidth / 2, yPos + 12, { align: 'center' });
  
  if (vehicle.variant) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(vehicle.variant, pageWidth / 2, yPos + 20, { align: 'center' });
  }
  
  // Price badge
  doc.setFillColor(22, 163, 74); // modern green
doc.roundedRect(pageWidth / 2 - 50, yPos + 23, 100, 12, 6, 6, 'F');

doc.setFontSize(12);

  doc.setFont('helvetica', 'bold');
  doc.text(formatRupees(vehicle.selling_price), pageWidth / 2, yPos + 30, { align: 'center' });
  
  yPos += 42;
  
  // Reset text color
  doc.setTextColor(30, 30, 30);
  
  // Quick specs row - 4 boxes
  const specBoxWidth = (pageWidth - 40) / 4;
  
  const quickSpecs = [
    { label: 'Year', value: vehicle.manufacturing_year.toString() },
    { label: 'Owners', value: vehicle.number_of_owners?.toString() || '1' },
    { label: 'Fuel', value: vehicle.fuel_type.toUpperCase() },
    { label: 'Transmission', value: vehicle.transmission.toUpperCase() },
  ];
  
  quickSpecs.forEach((spec, i) => {
    const x = 20 + (i * specBoxWidth);
    doc.setFillColor(240, 245, 252);
    doc.setDrawColor(200, 215, 235);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, yPos, specBoxWidth - 6, 20, 3, 3, 'FD');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 110, 120);
    doc.text(spec.label, x + (specBoxWidth - 6) / 2, yPos + 7, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 40, 50);
    doc.text(spec.value, x + (specBoxWidth - 6) / 2, yPos + 15, { align: 'center' });
  });
  
  yPos += 28;
  
  // Description
  if (vehicle.public_description) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 70, 80);
    doc.setFillColor(248, 250, 252);
doc.roundedRect(18, yPos - 4, pageWidth - 36, 22, 3, 3, 'F');

    const descLines = doc.splitTextToSize(vehicle.public_description, pageWidth - 40);
    doc.text(descLines, 20, yPos);
    yPos += descLines.length * 4.5 + 8;
  }
  
  // Highlights Section
  if (vehicle.public_highlights && vehicle.public_highlights.length > 0) {
    doc.setFillColor(245, 250, 245);
    doc.setDrawColor(100, 180, 100);
    doc.setLineWidth(0.5);
    const highlightBoxHeight = Math.min(vehicle.public_highlights.length * 6 + 12, 40);
    doc.roundedRect(20, yPos, pageWidth - 40, highlightBoxHeight, 3, 3, 'FD');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 120, 34);
    doc.text('KEY HIGHLIGHTS', 28, yPos + 8);
    
    let hY = yPos + 16;
    vehicle.public_highlights.slice(0, 4).forEach((highlight) => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 80, 40);
      doc.text('• ' + highlight, 30, hY);
      hY += 5;
    });
    yPos += highlightBoxHeight + 8;
  }
  
  // Specifications table - Two columns
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('SPECIFICATIONS', 20, yPos);
  yPos += 3;
  
  const specData = [
    ['Registration No.', vehicle.registration_number || 'N/A', 'Condition', vehicle.condition.toUpperCase()],
    ['Color', vehicle.color || 'N/A', 'Odometer', vehicle.odometer_reading ? `${formatIndianNumber(vehicle.odometer_reading)} km` : 'N/A'],
    ['Mileage', vehicle.mileage ? `${vehicle.mileage} km/l` : 'N/A', 'Owners', vehicle.number_of_owners?.toString() || '1'],
    ['Tyre Condition', vehicle.tyre_condition || 'N/A', 'Battery Health', vehicle.battery_health || 'N/A'],
  ];

  if (vehicle.seating_capacity) {
    specData.push(['Seating Capacity', vehicle.seating_capacity.toString(), '', '']);
  }
  
  autoTable(doc, {
    startY: yPos,
    body: specData,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40, textColor: [80, 90, 100] },
      1: { cellWidth: 45 },
      2: { fontStyle: 'bold', cellWidth: 40, textColor: [80, 90, 100] },
      3: { cellWidth: 45 },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 20, right: 20 },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 6;
  
  // Features - Compact grid
  if (vehicle.public_features && vehicle.public_features.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text('FEATURES', 20, yPos);
    yPos += 5;
    
    const featuresPerRow = 3;
    const featureWidth = (pageWidth - 50) / featuresPerRow;
    
    vehicle.public_features.slice(0, 9).forEach((feature, i) => {
      const col = i % featuresPerRow;
      const row = Math.floor(i / featuresPerRow);
      const x = 22 + (col * featureWidth);
      const y = yPos + (row * 6);
      
      doc.setFillColor(30, 58, 95);
      doc.circle(x + 2, y, 1, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 60, 70);
      doc.text(feature, x + 6, y + 1);
    });
    yPos += Math.ceil(Math.min(vehicle.public_features.length, 9) / featuresPerRow) * 5 + 8;
  }
  
  // Validity info - compact table
  const validities = [];
  if (vehicle.insurance_expiry) validities.push(['Insurance', new Date(vehicle.insurance_expiry).toLocaleDateString('en-IN')]);
  if (vehicle.puc_expiry) validities.push(['PUC', new Date(vehicle.puc_expiry).toLocaleDateString('en-IN')]);
  if (vehicle.fitness_expiry) validities.push(['Fitness', new Date(vehicle.fitness_expiry).toLocaleDateString('en-IN')]);
  
  if (validities.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text('DOCUMENT VALIDITY', 20, yPos);
    yPos += 3;
    
    autoTable(doc, {
      startY: yPos,
      body: validities,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 35 },
        1: { cellWidth: 40 },
      },
      headStyles: { fillColor: [230, 126, 34], fontSize: 8 },
      margin: { left: 20, right: pageWidth - 100 },
    });
  }
  
  // Footer with branding
  const footerY = pageHeight - 20;
  doc.setFillColor(20, 40, 70);
  doc.rect(0, footerY - 5, pageWidth, 25, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(dealer.dealer_name || 'VahanHub', pageWidth / 2, footerY + 3, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 190, 200);
  doc.text('Thank you for your interest! Contact us for test drive and more details.', pageWidth / 2, footerY + 10, { align: 'center' });
  
  doc.setFontSize(6);
  doc.text('Generated by VahanHub', pageWidth / 2, footerY + 15, { align: 'center' });
  
  // Save the PDF
  const fileName = `${vehicle.brand}_${vehicle.model}_${vehicle.manufacturing_year}_Brochure.pdf`;
  doc.save(fileName.replace(/\s+/g, '_'));
};
