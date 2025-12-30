import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RetrofitState, RetrofitResults } from '../types/retrofit';
import { exportBOQToPDFEnhanced } from './exportBOQPDFEnhanced';
import { OrgRetrofitLabor } from './laborLibraryDatabase';

export function exportRetrofitToPDF(state: RetrofitState, results: RetrofitResults, orgLaborLibrary: OrgRetrofitLabor[] = [], currency: string = 'AED') {
  if (state.projectInfo.estimationMode === 'boq' && state.boqLineItems && state.boqLineItems.length > 0) {
    return exportBOQToPDFEnhanced(
      state.projectInfo.projectName,
      {
        location: state.projectInfo.projectLocation,
        client: state.projectInfo.clientName,
        description: state.projectInfo.projectDescription
      },
      state.boqLineItems,
      orgLaborLibrary,
      state.costConfig,
      currency
    );
  }
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RETROFIT PROJECT COST ESTIMATE', pageWidth / 2, yPos, { align: 'center' });

  yPos += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${state.projectInfo.projectName || 'Untitled'}`, 14, yPos);
  yPos += 6;
  doc.text(`Location: ${state.projectInfo.projectLocation || '-'}`, 14, yPos);
  yPos += 6;
  doc.text(`Client: ${state.projectInfo.clientName || '-'}`, 14, yPos);
  yPos += 6;
  doc.text(`Duration: ${results.projectDurationDays} days`, 14, yPos);
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PROJECT PHASES', 14, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Phase', 'Start Date', 'End Date', 'Duration (Days)']],
    body: state.projectPhases.map((phase) => [
      phase.name,
      phase.startDate,
      phase.endDate,
      phase.durationDays.toString(),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    margin: { top: 20, left: 14, right: 14, bottom: 20 },
    didDrawPage: (data) => {
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      if (currentPage > 1) {
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, pageWidth, 15, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('RETROFIT ESTIMATE (Continued)', pageWidth / 2, 10, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('MANPOWER BREAKDOWN', 14, yPos);
  yPos += 5;

  const manpowerData = state.manpowerItems.map((item) => {
    const labor = state.laborLibrary.find((l) => l.id === item.laborTypeId);
    const laborCost = labor ? item.estimatedHours * labor.hourlyRate : 0;
    const totalCost = laborCost + item.mobilizationCost + item.demobilizationCost;
    return [
      item.description,
      labor?.role || '-',
      item.estimatedHours.toLocaleString(),
      labor ? labor.hourlyRate.toLocaleString() : '-',
      item.mobilizationCost.toLocaleString(),
      item.demobilizationCost.toLocaleString(),
      totalCost.toLocaleString(),
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Labor Type', 'Hours', 'Rate/Hr', 'Mob Cost', 'Demob Cost', 'Total']],
    body: manpowerData,
    foot: [['', '', '', '', '', 'TOTAL:', results.totalManpowerCost.toLocaleString()]],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
    margin: { top: 20, left: 14, right: 14, bottom: 20 },
    didDrawPage: (data) => {
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      if (currentPage > 1) {
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, pageWidth, 15, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('RETROFIT ESTIMATE (Continued)', pageWidth / 2, 10, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSETS', 14, yPos);
  yPos += 5;

  const assetData = state.assets.map((asset) => [
    asset.name,
    asset.description,
    asset.quantity.toString(),
    asset.unitCost.toLocaleString(),
    (asset.quantity * asset.unitCost).toLocaleString(),
    asset.removalCostPerUnit.toLocaleString(),
    (asset.quantity * asset.removalCostPerUnit).toLocaleString(),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Name', 'Description', 'Qty', 'Unit Cost', 'Total Cost', 'Removal/Unit', 'Total Removal']],
    body: assetData,
    foot: [
      ['', '', '', '', results.totalAssetCost.toLocaleString(), '', results.totalRemovalCost.toLocaleString()],
    ],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
    margin: { top: 20, left: 14, right: 14, bottom: 20 },
    didDrawPage: (data) => {
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      if (currentPage > 1) {
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, pageWidth, 15, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('RETROFIT ESTIMATE (Continued)', pageWidth / 2, 10, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('MATERIALS', 14, yPos);
  yPos += 5;

  const materialsData = state.materialsCatalog.map((material) => [
    material.category,
    material.item,
    material.unit,
    material.estimatedQty.toLocaleString(),
    material.unitRate.toLocaleString(),
    (material.estimatedQty * material.unitRate).toLocaleString(),
    material.notes,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Category', 'Item', 'Unit', 'Qty', 'Unit Rate', 'Total', 'Notes']],
    body: materialsData,
    foot: [['', '', '', '', 'TOTAL:', results.totalMaterialsCost.toLocaleString(), '']],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
    margin: { top: 20, left: 14, right: 14, bottom: 20 },
    didDrawPage: (data) => {
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      if (currentPage > 1) {
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, pageWidth, 15, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('RETROFIT ESTIMATE (Continued)', pageWidth / 2, 10, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SUBCONTRACTORS', 14, yPos);
  yPos += 5;

  const subcontractorData = state.subcontractors.map((sub) => {
    const cost = sub.pricingMode === 'lump_sum' ? sub.lumpSumCost : sub.quantity * sub.unitCost;
    return [
      sub.category.replace('_', ' ').toUpperCase(),
      sub.description,
      sub.pricingMode === 'lump_sum' ? 'Lump Sum' : 'Per Unit',
      sub.pricingMode === 'lump_sum' ? '-' : sub.quantity.toString(),
      sub.pricingMode === 'lump_sum' ? '-' : sub.unitCost.toLocaleString(),
      cost.toLocaleString(),
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Category', 'Description', 'Pricing', 'Qty', 'Unit Cost', 'Total']],
    body: subcontractorData,
    foot: [['', '', '', '', 'TOTAL:', results.totalSubcontractorCost.toLocaleString()]],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
    margin: { top: 20, left: 14, right: 14, bottom: 20 },
    didDrawPage: (data) => {
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      if (currentPage > 1) {
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, pageWidth, 15, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('RETROFIT ESTIMATE (Continued)', pageWidth / 2, 10, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SUPERVISION & MANAGEMENT', 14, yPos);
  yPos += 5;

  const supervisionData = state.supervisionRoles.map((role) => {
    const laborType = state.laborLibrary.find((l) => l.id === role.laborTypeId);
    const monthlyCost = laborType ? ((laborType.monthlySalary || 0) + (laborType.additionalCost || 0)) : 0;
    const hourlyRateFallback = laborType ? laborType.hourlyRate * 160 : 0;
    const costPerMonth = monthlyCost > 0 ? monthlyCost : hourlyRateFallback;
    const totalCost = role.count * role.durationMonths * costPerMonth;
    return [
      laborType?.role || 'Unknown Role',
      role.count.toString(),
      role.durationMonths.toLocaleString(),
      costPerMonth.toLocaleString(),
      totalCost.toLocaleString(),
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Role', 'Count', 'Duration (Months)', 'Monthly Cost', 'Total']],
    body: supervisionData,
    foot: [['', '', '', 'TOTAL:', results.totalSupervisionCost.toLocaleString()]],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
    margin: { top: 20, left: 14, right: 14, bottom: 20 },
    didDrawPage: (data) => {
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      if (currentPage > 1) {
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, pageWidth, 15, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('RETROFIT ESTIMATE (Continued)', pageWidth / 2, 10, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('LOGISTICS', 14, yPos);
  yPos += 5;

  const logisticsData = state.logisticsItems.map((item) => [
    item.description,
    item.quantity.toString(),
    item.unitRate.toLocaleString(),
    (item.quantity * item.unitRate).toLocaleString(),
    item.notes,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Qty', 'Unit Rate', 'Total', 'Notes']],
    body: logisticsData,
    foot: [['', '', 'TOTAL:', results.totalLogisticsCost.toLocaleString(), '']],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
    margin: { top: 20, left: 14, right: 14, bottom: 20 },
    didDrawPage: (data) => {
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      if (currentPage > 1) {
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, pageWidth, 15, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('RETROFIT ESTIMATE (Continued)', pageWidth / 2, 10, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('COST SUMMARY', 14, yPos);
  yPos += 8;

  const summaryData = [
    ['Manpower Cost', `AED ${results.totalManpowerCost.toLocaleString()}`],
    ['Assets Cost', `AED ${results.totalAssetCost.toLocaleString()}`],
    ['Removal Cost', `AED ${results.totalRemovalCost.toLocaleString()}`],
    ['Materials Cost', `AED ${results.totalMaterialsCost.toLocaleString()}`],
    ['Subcontractors Cost', `AED ${results.totalSubcontractorCost.toLocaleString()}`],
    ['Supervision Cost', `AED ${results.totalSupervisionCost.toLocaleString()}`],
    ['Logistics Cost', `AED ${results.totalLogisticsCost.toLocaleString()}`],
    ['BASE COST', `AED ${results.baseCost.toLocaleString()}`],
    ['', ''],
    [
      `Overheads (${state.costConfig.overheadsPercent}%)`,
      `AED ${results.overheadsCost.toLocaleString()}`,
    ],
    [
      `Performance Bond (${state.costConfig.performanceBondPercent}%)`,
      `AED ${results.performanceBondCost.toLocaleString()}`,
    ],
    [
      `Insurance (${state.costConfig.insurancePercent}%)`,
      `AED ${results.insuranceCost.toLocaleString()}`,
    ],
    [
      `Warranty (${state.costConfig.warrantyPercent}%)`,
      `AED ${results.warrantyCost.toLocaleString()}`,
    ],
    ['SUBTOTAL', `AED ${results.subtotalBeforeProfit.toLocaleString()}`],
    ['', ''],
    [
      `Profit (${state.costConfig.profitPercent}%)`,
      `AED ${results.profitAmount.toLocaleString()}`,
    ],
    ['GRAND TOTAL', `AED ${results.grandTotal.toLocaleString()}`],
    ['', ''],
    ['Cost per Asset Unit', `AED ${results.costPerAssetUnit.toLocaleString()}`],
    ['Total Manpower Hours', `${results.totalManpowerHours.toLocaleString()} hrs`],
  ];

  autoTable(doc, {
    startY: yPos,
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 100 },
      1: { halign: 'right', cellWidth: 70 },
    },
    margin: { top: 20, left: 14, right: 14, bottom: 20 },
    didDrawPage: (data) => {
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      if (currentPage > 1) {
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, pageWidth, 15, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('RETROFIT ESTIMATE (Continued)', pageWidth / 2, 10, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }
    },
    didParseCell: (data) => {
      if (
        data.row.index === 5 ||
        data.row.index === 11 ||
        data.row.index === 14
      ) {
        data.cell.styles.fillColor = [99, 102, 241];
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 11;
      }
    },
  });

  const fileName = `${state.projectInfo.projectName || 'retrofit_project'}_estimate.pdf`;
  doc.save(fileName);
}
