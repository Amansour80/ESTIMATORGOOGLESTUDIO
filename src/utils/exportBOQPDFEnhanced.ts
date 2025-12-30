import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BOQLineItem } from '../types/boq';
import { OrgRetrofitLabor } from './laborLibraryDatabase';
import { calculateLineItemTotals, calculateBOQSummary } from './boqCalculations';
import { RetrofitCostConfig } from '../types/retrofit';

export function exportBOQToPDFEnhanced(
  projectName: string,
  projectInfo: {
    location: string;
    client: string;
    description: string;
  },
  lineItems: BOQLineItem[],
  laborLibrary: OrgRetrofitLabor[],
  costConfig: RetrofitCostConfig,
  currency: string
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('BILL OF QUANTITIES', pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Project Cost Estimation', pageWidth / 2, 25, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Project:`, 14, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(projectName, 40, 45);

  doc.setFont('helvetica', 'bold');
  doc.text(`Location:`, 14, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(projectInfo.location || '-', 40, 50);

  doc.setFont('helvetica', 'bold');
  doc.text(`Client:`, 14, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(projectInfo.client || '-', 40, 55);

  doc.setFont('helvetica', 'bold');
  doc.text(`Date:`, pageWidth - 50, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString(), pageWidth - 14, 45, { align: 'right' });

  const tableData = lineItems.map((item) => {
    const calcs = calculateLineItemTotals(item, laborLibrary);
    const labor = item.laborDetailId
      ? laborLibrary.find(l => l.id === item.laborDetailId)
      : null;
    const supervisor = item.supervisionDetailId
      ? laborLibrary.find(l => l.id === item.supervisionDetailId)
      : null;

    return [
      item.category,
      item.description,
      item.uom,
      item.quantity.toLocaleString(),
      `${calcs.totalMaterialCost.toLocaleString()}`,
      labor ? labor.role : '-',
      item.laborHours.toLocaleString(),
      `${calcs.laborCost.toLocaleString()}`,
      supervisor ? supervisor.role : '-',
      item.supervisionHours.toLocaleString(),
      `${calcs.supervisionCost.toLocaleString()}`,
      `${item.directCost.toLocaleString()}`,
      `${item.subcontractorCost.toLocaleString()}`,
      `${calcs.lineTotal.toLocaleString()}`
    ];
  });

  autoTable(doc, {
    startY: 65,
    head: [[
      'Category',
      'Description',
      'UOM',
      'Qty',
      'Mat. Cost',
      'Labor',
      'Lab Hrs',
      'Lab Cost',
      'Supervision',
      'Sup Hrs',
      'Sup Cost',
      'Direct',
      'Subcont.',
      'Total'
    ]],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 45 },
      2: { cellWidth: 10, halign: 'center' },
      3: { cellWidth: 12, halign: 'right' },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 20 },
      6: { cellWidth: 12, halign: 'right' },
      7: { cellWidth: 18, halign: 'right' },
      8: { cellWidth: 20 },
      9: { cellWidth: 12, halign: 'right' },
      10: { cellWidth: 18, halign: 'right' },
      11: { cellWidth: 15, halign: 'right' },
      12: { cellWidth: 15, halign: 'right' },
      13: { cellWidth: 18, halign: 'right', fontStyle: 'bold' }
    },
    margin: { top: 20, left: 14, right: 14, bottom: 20 },
    didDrawPage: (data) => {
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;

      if (currentPage > 1) {
        doc.setFillColor(30, 64, 175);
        doc.rect(0, 0, pageWidth, 15, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('BILL OF QUANTITIES (Continued)', pageWidth / 2, 10, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }

      doc.setFillColor(30, 64, 175);
      doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255);
      doc.text(
        `${projectName} - BOQ`,
        14,
        pageHeight - 8
      );
      doc.text(
        `Page ${currentPage}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
      doc.text(
        new Date().toLocaleDateString(),
        pageWidth - 14,
        pageHeight - 8,
        { align: 'right' }
      );
      doc.setTextColor(0, 0, 0);
    }
  });

  const boqTableEndPage = (doc as any).internal.getCurrentPageInfo().pageNumber;

  const summary = calculateBOQSummary(lineItems, laborLibrary);

  doc.addPage();

  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('COST SUMMARY', pageWidth / 2, 20, { align: 'center' });

  doc.setTextColor(0, 0, 0);

  let yPos = 45;

  doc.setFillColor(240, 240, 240);
  doc.rect(14, yPos, pageWidth - 28, 8, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DIRECT COSTS BREAKDOWN', 16, yPos + 6);

  yPos += 15;

  const directCostData = [
    ['Total Material Cost', `${summary.totalMaterialCost.toLocaleString()} ${currency}`],
    ['Total Labor Cost', `${summary.totalLaborCost.toLocaleString()} ${currency}`],
    ['Total Supervision Cost', `${summary.totalSupervisionCost.toLocaleString()} ${currency}`],
    ['Total Direct Costs', `${summary.totalDirectCost.toLocaleString()} ${currency}`],
    ['Total Subcontractor Costs', `${summary.totalSubcontractorCost.toLocaleString()} ${currency}`]
  ];

  autoTable(doc, {
    startY: yPos,
    body: directCostData,
    theme: 'plain',
    bodyStyles: {
      fontSize: 10,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 100, fontStyle: 'bold' },
      1: { cellWidth: 80, halign: 'right' }
    },
    margin: { left: 14 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 3;

  doc.setFillColor(30, 64, 175);
  doc.rect(14, yPos, pageWidth - 28, 10, 'F');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('BASE COST (Direct Costs Total)', 20, yPos + 7);
  doc.text(
    `${summary.grandTotal.toLocaleString()} ${currency}`,
    pageWidth - 20,
    yPos + 7,
    { align: 'right' }
  );

  doc.setTextColor(0, 0, 0);
  yPos += 18;

  doc.setFillColor(240, 240, 240);
  doc.rect(14, yPos, pageWidth - 28, 8, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INDIRECT COSTS & ADDITIONS', 16, yPos + 6);

  yPos += 15;

  const baseCost = summary.grandTotal;
  const overheadsCost = baseCost / (1 - (costConfig.overheadsPercent / 100)) - baseCost;
  const riskContingencyCost = baseCost * ((costConfig.riskContingencyPercent || 0) / 100);
  const pmGeneralsCost = baseCost * ((costConfig.pmGeneralsPercent || 0) / 100);
  const performanceBondCost = baseCost * (costConfig.performanceBondPercent / 100);
  const insuranceCost = baseCost * (costConfig.insurancePercent / 100);
  const warrantyCost = baseCost * (costConfig.warrantyPercent / 100);

  const indirectCostData = [
    [`Overheads (${costConfig.overheadsPercent}%)`, `${overheadsCost.toLocaleString()} ${currency}`],
    [`Risk & Contingency (${costConfig.riskContingencyPercent || 0}%)`, `${riskContingencyCost.toLocaleString()} ${currency}`],
    [`PM & Generals (${costConfig.pmGeneralsPercent || 0}%)`, `${pmGeneralsCost.toLocaleString()} ${currency}`],
    [`Performance Bond (${costConfig.performanceBondPercent}%)`, `${performanceBondCost.toLocaleString()} ${currency}`],
    [`Insurance (${costConfig.insurancePercent}%)`, `${insuranceCost.toLocaleString()} ${currency}`],
    [`Warranty (${costConfig.warrantyPercent}%)`, `${warrantyCost.toLocaleString()} ${currency}`]
  ];

  autoTable(doc, {
    startY: yPos,
    body: indirectCostData,
    theme: 'plain',
    bodyStyles: {
      fontSize: 10,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 100, fontStyle: 'bold' },
      1: { cellWidth: 80, halign: 'right' }
    },
    margin: { left: 14 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 3;

  const subtotalBeforeProfit = baseCost + overheadsCost + riskContingencyCost + pmGeneralsCost + performanceBondCost + insuranceCost + warrantyCost;

  doc.setFillColor(70, 130, 180);
  doc.rect(14, yPos, pageWidth - 28, 10, 'F');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('SUBTOTAL (Before Profit)', 20, yPos + 7);
  doc.text(
    `${subtotalBeforeProfit.toLocaleString()} ${currency}`,
    pageWidth - 20,
    yPos + 7,
    { align: 'right' }
  );

  doc.setTextColor(0, 0, 0);
  yPos += 18;

  doc.setFillColor(240, 240, 240);
  doc.rect(14, yPos, pageWidth - 28, 8, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PROFIT MARGIN', 16, yPos + 6);

  yPos += 15;

  const profitAmount = subtotalBeforeProfit / (1 - (costConfig.profitPercent / 100)) - subtotalBeforeProfit;

  autoTable(doc, {
    startY: yPos,
    body: [
      [`Profit Margin (${costConfig.profitPercent}%)`, `${profitAmount.toLocaleString()} ${currency}`]
    ],
    theme: 'plain',
    bodyStyles: {
      fontSize: 10,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 100, fontStyle: 'bold' },
      1: { cellWidth: 80, halign: 'right' }
    },
    margin: { left: 14 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 5;

  const grandTotal = subtotalBeforeProfit + profitAmount;

  doc.setFillColor(0, 128, 0);
  doc.rect(14, yPos, pageWidth - 28, 15, 'F');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('SELLING PRICE (Grand Total)', 20, yPos + 10);
  doc.text(
    `${grandTotal.toLocaleString()} ${currency}`,
    pageWidth - 20,
    yPos + 10,
    { align: 'right' }
  );

  doc.setTextColor(0, 0, 0);
  yPos += 25;

  if (Object.keys(summary.categoryBreakdown).length > 0) {
    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPos, pageWidth - 28, 8, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CATEGORY BREAKDOWN', 16, yPos + 6);

    yPos += 10;

    const categoryData = Object.entries(summary.categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([category, total]) => {
        const percentage = ((total / summary.grandTotal) * 100).toFixed(1);
        return [category, `${total.toLocaleString()} ${currency}`, `${percentage}%`];
      });

    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Total Cost', '%']],
      body: categoryData,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 60, halign: 'right' },
        2: { cellWidth: 40, halign: 'right' }
      },
      margin: { left: 14 }
    });
  }

  const totalPages = (doc as any).internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setFillColor(30, 64, 175);
    doc.rect(pageWidth / 2 - 20, pageHeight - 15, 40, 15, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
    doc.setTextColor(0, 0, 0);
  }

  doc.save(`BOQ_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}
