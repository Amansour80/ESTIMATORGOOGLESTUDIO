import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BOQLineItem } from '../types/boq';
import { OrgRetrofitLabor } from './laborLibraryDatabase';
import { calculateLineItemTotals, calculateBOQSummary, formatLaborDropdownText } from './boqCalculations';

export function exportBOQToPDF(
  projectName: string,
  projectInfo: {
    location: string;
    client: string;
    description: string;
  },
  lineItems: BOQLineItem[],
  laborLibrary: OrgRetrofitLabor[],
  currency: string
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL OF QUANTITIES', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${projectName}`, 14, 35);
  doc.text(`Location: ${projectInfo.location}`, 14, 40);
  doc.text(`Client: ${projectInfo.client}`, 14, 45);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 14, 35, { align: 'right' });

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
      `${calcs.totalMaterialCost.toLocaleString()} ${currency}`,
      labor ? labor.role : '-',
      item.laborHours.toLocaleString(),
      `${calcs.laborCost.toLocaleString()} ${currency}`,
      supervisor ? supervisor.role : '-',
      item.supervisionHours.toLocaleString(),
      `${calcs.supervisionCost.toLocaleString()} ${currency}`,
      `${item.directCost.toLocaleString()} ${currency}`,
      `${item.subcontractorCost.toLocaleString()} ${currency}`,
      `${calcs.lineTotal.toLocaleString()} ${currency}`
    ];
  });

  autoTable(doc, {
    startY: 55,
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
    margin: { top: 55, left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${currentPage} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  });

  const summary = calculateBOQSummary(lineItems, laborLibrary);

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMARY', 14, finalY);

  const summaryData = [
    ['Total Material Cost', `${summary.totalMaterialCost.toLocaleString()} ${currency}`],
    ['Total Labor Cost', `${summary.totalLaborCost.toLocaleString()} ${currency}`],
    ['Total Supervision Cost', `${summary.totalSupervisionCost.toLocaleString()} ${currency}`],
    ['Total Direct Costs', `${summary.totalDirectCost.toLocaleString()} ${currency}`],
    ['Total Subcontractor Costs', `${summary.totalSubcontractorCost.toLocaleString()} ${currency}`]
  ];

  autoTable(doc, {
    startY: finalY + 5,
    body: summaryData,
    theme: 'plain',
    bodyStyles: {
      fontSize: 10,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { cellWidth: 60, halign: 'right' }
    },
    margin: { left: 14 }
  });

  const grandTotalY = (doc as any).lastAutoTable.finalY + 5;

  doc.setFillColor(30, 64, 175);
  doc.rect(14, grandTotalY, 140, 10, 'F');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('GRAND TOTAL', 20, grandTotalY + 7);
  doc.text(
    `${summary.grandTotal.toLocaleString()} ${currency}`,
    148,
    grandTotalY + 7,
    { align: 'right' }
  );

  const categoryBreakdownY = grandTotalY + 20;

  if (categoryBreakdownY + 40 < pageHeight) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CATEGORY BREAKDOWN', 14, categoryBreakdownY);

    const categoryData = Object.entries(summary.categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([category, total]) => {
        const percentage = ((total / summary.grandTotal) * 100).toFixed(1);
        return [category, `${total.toLocaleString()} ${currency}`, `${percentage}%`];
      });

    autoTable(doc, {
      startY: categoryBreakdownY + 5,
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
        0: { cellWidth: 60 },
        1: { cellWidth: 50, halign: 'right' },
        2: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: 14 }
    });
  }

  doc.save(`BOQ_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}
