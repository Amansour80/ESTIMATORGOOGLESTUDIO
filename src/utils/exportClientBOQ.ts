import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { BOQLineItem } from '../types/boq';
import { OrgRetrofitLabor } from './laborLibraryDatabase';
import { calculateLineItemTotals, calculateBOQSummary } from './boqCalculations';
import { RetrofitCostConfig } from '../types/retrofit';

export function exportClientBOQToPDF(
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
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const summary = calculateBOQSummary(lineItems, laborLibrary);
  const baseCost = summary.grandTotal;

  const overheadsCost = baseCost / (1 - (costConfig.overheadsPercent / 100)) - baseCost;
  const riskContingencyCost = baseCost * ((costConfig.riskContingencyPercent || 0) / 100);
  const pmGeneralsCost = baseCost * ((costConfig.pmGeneralsPercent || 0) / 100);
  const performanceBondCost = baseCost * (costConfig.performanceBondPercent / 100);
  const insuranceCost = baseCost * (costConfig.insurancePercent / 100);
  const warrantyCost = baseCost * (costConfig.warrantyPercent / 100);

  const subtotalBeforeProfit = baseCost + overheadsCost + riskContingencyCost + pmGeneralsCost +
                                performanceBondCost + insuranceCost + warrantyCost;
  const profitAmount = subtotalBeforeProfit / (1 - (costConfig.profitPercent / 100)) - subtotalBeforeProfit;
  const grandTotal = subtotalBeforeProfit + profitAmount;

  const markupMultiplier = grandTotal / baseCost;

  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('BILL OF QUANTITIES', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text('Commercial Proposal', pageWidth / 2, 28, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Project:`, 14, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(projectName, 35, 50);

  doc.setFont('helvetica', 'bold');
  doc.text(`Location:`, 14, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(projectInfo.location || '-', 35, 56);

  doc.setFont('helvetica', 'bold');
  doc.text(`Client:`, 14, 62);
  doc.setFont('helvetica', 'normal');
  doc.text(projectInfo.client || '-', 35, 62);

  doc.setFont('helvetica', 'bold');
  doc.text(`Date:`, 14, 68);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString(), 35, 68);

  if (projectInfo.description) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Description:`, 14, 74);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(projectInfo.description, pageWidth - 50);
    doc.text(descLines, 35, 74);
  }

  const tableData = lineItems.map((item, index) => {
    const calcs = calculateLineItemTotals(item, laborLibrary);
    const totalCostPrice = calcs.lineTotal;
    const totalSellingPrice = totalCostPrice * markupMultiplier;
    const unitSellingPrice = totalSellingPrice / item.quantity;

    return [
      (index + 1).toString(),
      item.category,
      item.description,
      item.uom,
      item.quantity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      unitSellingPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalSellingPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    ];
  });

  autoTable(doc, {
    startY: 85,
    head: [[
      'S/N',
      'Category',
      'Description',
      'UOM',
      'Qty',
      `Unit Price (${currency})`,
      `Total Price (${currency})`
    ]],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 3
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 2.5
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 32 },
      2: { cellWidth: 65 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
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

      const pageCount = (doc as any).internal.getNumberOfPages();

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255);
      doc.text(
        `${projectName} - Client BOQ`,
        14,
        pageHeight - 8
      );
      doc.text(
        `Page ${currentPage} of ${pageCount}`,
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

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  if (finalY + 30 > pageHeight - 20) {
    doc.addPage();
    let yPos = 20;

    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPos, pageWidth - 28, 8, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY', 16, yPos + 6);

    yPos += 15;

    const summaryData = [
      ['Total Quantity of Items', lineItems.reduce((sum, item) => sum + item.quantity, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
      ['Number of Line Items', lineItems.length.toString()]
    ];

    autoTable(doc, {
      startY: yPos,
      body: summaryData,
      theme: 'plain',
      bodyStyles: {
        fontSize: 10,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 100, fontStyle: 'bold' },
        1: { cellWidth: 60, halign: 'right' }
      },
      margin: { left: 14 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 5;

    doc.setFillColor(0, 128, 0);
    doc.rect(14, yPos, pageWidth - 28, 15, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL CONTRACT VALUE', 20, yPos + 10);
    doc.text(
      `${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`,
      pageWidth - 20,
      yPos + 10,
      { align: 'right' }
    );

    yPos += 25;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('* All prices are inclusive of overheads, project management, performance bond, insurance, warranty, and profit margin.', 14, yPos);
    doc.text('* Prices are valid for 30 days from the date of this quotation.', 14, yPos + 5);
    doc.text('* Terms and conditions apply as per the contract agreement.', 14, yPos + 10);

  } else {
    let yPos = finalY;

    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPos, pageWidth - 28, 8, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY', 16, yPos + 6);

    yPos += 15;

    const summaryData = [
      ['Total Quantity of Items', lineItems.reduce((sum, item) => sum + item.quantity, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
      ['Number of Line Items', lineItems.length.toString()]
    ];

    autoTable(doc, {
      startY: yPos,
      body: summaryData,
      theme: 'plain',
      bodyStyles: {
        fontSize: 10,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 100, fontStyle: 'bold' },
        1: { cellWidth: 60, halign: 'right' }
      },
      margin: { left: 14 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 5;

    doc.setFillColor(0, 128, 0);
    doc.rect(14, yPos, pageWidth - 28, 15, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL CONTRACT VALUE', 20, yPos + 10);
    doc.text(
      `${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`,
      pageWidth - 20,
      yPos + 10,
      { align: 'right' }
    );

    yPos += 25;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('* All prices are inclusive of overheads, project management, performance bond, insurance, warranty, and profit margin.', 14, yPos);
    doc.text('* Prices are valid for 30 days from the date of this quotation.', 14, yPos + 5);
    doc.text('* Terms and conditions apply as per the contract agreement.', 14, yPos + 10);
  }

  doc.save(`Client_BOQ_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export async function exportClientBOQToExcel(
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
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Client BOQ');

  const summary = calculateBOQSummary(lineItems, laborLibrary);
  const baseCost = summary.grandTotal;

  const overheadsCost = baseCost / (1 - (costConfig.overheadsPercent / 100)) - baseCost;
  const riskContingencyCost = baseCost * ((costConfig.riskContingencyPercent || 0) / 100);
  const pmGeneralsCost = baseCost * ((costConfig.pmGeneralsPercent || 0) / 100);
  const performanceBondCost = baseCost * (costConfig.performanceBondPercent / 100);
  const insuranceCost = baseCost * (costConfig.insurancePercent / 100);
  const warrantyCost = baseCost * (costConfig.warrantyPercent / 100);

  const subtotalBeforeProfit = baseCost + overheadsCost + riskContingencyCost + pmGeneralsCost +
                                performanceBondCost + insuranceCost + warrantyCost;
  const profitAmount = subtotalBeforeProfit / (1 - (costConfig.profitPercent / 100)) - subtotalBeforeProfit;
  const grandTotal = subtotalBeforeProfit + profitAmount;

  const markupMultiplier = grandTotal / baseCost;

  worksheet.mergeCells('A1:G1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'BILL OF QUANTITIES - COMMERCIAL PROPOSAL';
  titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' }
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 30;

  let currentRow = 3;
  worksheet.getCell(`A${currentRow}`).value = 'Project:';
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getCell(`B${currentRow}`).value = projectName;
  worksheet.mergeCells(`B${currentRow}:G${currentRow}`);

  currentRow++;
  worksheet.getCell(`A${currentRow}`).value = 'Location:';
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getCell(`B${currentRow}`).value = projectInfo.location || '-';
  worksheet.mergeCells(`B${currentRow}:G${currentRow}`);

  currentRow++;
  worksheet.getCell(`A${currentRow}`).value = 'Client:';
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getCell(`B${currentRow}`).value = projectInfo.client || '-';
  worksheet.mergeCells(`B${currentRow}:G${currentRow}`);

  currentRow++;
  worksheet.getCell(`A${currentRow}`).value = 'Date:';
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getCell(`B${currentRow}`).value = new Date().toLocaleDateString();
  worksheet.mergeCells(`B${currentRow}:G${currentRow}`);

  if (projectInfo.description) {
    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = 'Description:';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`B${currentRow}`).value = projectInfo.description;
    worksheet.mergeCells(`B${currentRow}:G${currentRow}`);
  }

  currentRow += 2;
  const headerRow = worksheet.getRow(currentRow);
  headerRow.values = ['S/N', 'Category', 'Description', 'UOM', 'Qty', `Unit Price (${currency})`, `Total Price (${currency})`];
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  worksheet.columns = [
    { width: 8 },
    { width: 20 },
    { width: 40 },
    { width: 10 },
    { width: 12 },
    { width: 18 },
    { width: 20 }
  ];

  currentRow++;

  lineItems.forEach((item, index) => {
    const calcs = calculateLineItemTotals(item, laborLibrary);
    const totalCostPrice = calcs.lineTotal;
    const totalSellingPrice = totalCostPrice * markupMultiplier;
    const unitSellingPrice = totalSellingPrice / item.quantity;

    const dataRow = worksheet.getRow(currentRow);
    dataRow.values = [
      index + 1,
      item.category,
      item.description,
      item.uom,
      item.quantity,
      unitSellingPrice,
      totalSellingPrice
    ];

    dataRow.getCell(1).alignment = { horizontal: 'center' };
    dataRow.getCell(1).border = {
      top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
    };

    dataRow.getCell(2).border = {
      top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
    };

    dataRow.getCell(3).border = {
      top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
    };

    dataRow.getCell(4).alignment = { horizontal: 'center' };
    dataRow.getCell(4).border = {
      top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
    };

    dataRow.getCell(5).alignment = { horizontal: 'right' };
    dataRow.getCell(5).numFmt = '#,##0.00';
    dataRow.getCell(5).border = {
      top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
    };

    dataRow.getCell(6).alignment = { horizontal: 'right' };
    dataRow.getCell(6).numFmt = '#,##0.00';
    dataRow.getCell(6).border = {
      top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
    };

    dataRow.getCell(7).alignment = { horizontal: 'right' };
    dataRow.getCell(7).numFmt = '#,##0.00';
    dataRow.getCell(7).font = { bold: true };
    dataRow.getCell(7).border = {
      top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
    };

    if (index % 2 === 0) {
      for (let col = 1; col <= 7; col++) {
        dataRow.getCell(col).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' }
        };
      }
    }

    currentRow++;
  });

  currentRow += 2;
  worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
  const summaryHeaderCell = worksheet.getCell(`A${currentRow}`);
  summaryHeaderCell.value = 'SUMMARY';
  summaryHeaderCell.font = { size: 14, bold: true };
  summaryHeaderCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF3F4F6' }
  };
  summaryHeaderCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  worksheet.getRow(currentRow).height = 25;

  currentRow++;
  worksheet.getCell(`A${currentRow}`).value = 'Total Quantity of Items:';
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getCell(`B${currentRow}`).value = lineItems.reduce((sum, item) => sum + item.quantity, 0);
  worksheet.getCell(`B${currentRow}`).numFmt = '#,##0.00';
  worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'right' };

  currentRow++;
  worksheet.getCell(`A${currentRow}`).value = 'Number of Line Items:';
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getCell(`B${currentRow}`).value = lineItems.length;
  worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'right' };

  currentRow += 2;
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  const totalLabelCell = worksheet.getCell(`A${currentRow}`);
  totalLabelCell.value = 'TOTAL CONTRACT VALUE';
  totalLabelCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  totalLabelCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF059669' }
  };
  totalLabelCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  worksheet.mergeCells(`F${currentRow}:G${currentRow}`);
  const totalValueCell = worksheet.getCell(`F${currentRow}`);
  totalValueCell.value = grandTotal;
  totalValueCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  totalValueCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF059669' }
  };
  totalValueCell.alignment = { vertical: 'middle', horizontal: 'right' };
  totalValueCell.numFmt = '#,##0.00';
  worksheet.getRow(currentRow).height = 30;

  currentRow += 2;
  worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
  const note1Cell = worksheet.getCell(`A${currentRow}`);
  note1Cell.value = '* All prices are inclusive of overheads, project management, performance bond, insurance, warranty, and profit margin.';
  note1Cell.font = { italic: true, size: 9 };

  currentRow++;
  worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
  const note2Cell = worksheet.getCell(`A${currentRow}`);
  note2Cell.value = '* Prices are valid for 30 days from the date of this quotation.';
  note2Cell.font = { italic: true, size: 9 };

  currentRow++;
  worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
  const note3Cell = worksheet.getCell(`A${currentRow}`);
  note3Cell.value = '* Terms and conditions apply as per the contract agreement.';
  note3Cell.font = { italic: true, size: 9 };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Client_BOQ_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}
