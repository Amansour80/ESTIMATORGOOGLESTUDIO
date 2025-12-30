import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FMEstimatorState } from '../types/fm';
import { calculateFMResults } from './fmCalculations';

export function exportFMToPDF(state: FMEstimatorState) {
  const results = calculateFMResults(state);
  const doc = new jsPDF();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(value);
  };

  const formatDecimal = (value: number) => {
    return value.toFixed(2);
  };

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('FM MEP ESTIMATOR - SUMMARY REPORT', 105, 20, { align: 'center' });

  let yPos = 35;

  const addSection = (title: string, data: string[][]) => {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: data,
      theme: 'grid',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 60, halign: 'right' },
      },
      margin: { left: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;
  };

  if (state.projectInfo.projectName || state.projectInfo.projectLocation || state.projectInfo.projectType) {
    const projectData: string[][] = [];
    if (state.projectInfo.projectName) projectData.push(['Project Name', state.projectInfo.projectName]);
    if (state.projectInfo.projectLocation) projectData.push(['Project Location', state.projectInfo.projectLocation]);
    if (state.projectInfo.projectType) projectData.push(['Project Type', state.projectInfo.projectType]);
    addSection('PROJECT INFORMATION', projectData);
  }

  addSection('PROJECT SPECIFIC ASSUMPTIONS', [
    ['Contract Mode', state.globalAssumptions.contractMode === 'output_base' ? 'Output Base (Asset-driven)' : 'Input Base (Direct input)'],
    ['Total Coverage Days per Year', state.globalAssumptions.totalCoverageDaysPerYear.toString()],
    ['Shift Length (hours)', state.globalAssumptions.shiftLength.toString()],
    ['Break Minutes', state.globalAssumptions.breakMinutes.toString()],
    ['Transportation Minutes', state.globalAssumptions.transportationMinutes.toString()],
    ['Effective Hours', state.globalAssumptions.effectiveHours.toFixed(2)],
    ['Coverage Factor', state.globalAssumptions.coverageFactor.toFixed(3)],
  ]);

  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  const manpowerData: string[][] = [];
  results.manpowerByType.forEach((m) => {
    manpowerData.push([`${m.techTypeName} - Deployment`, m.deploymentModel === 'resident' ? 'Resident' : 'Rotating']);
    manpowerData.push([`${m.techTypeName} - Annual Hours`, formatCurrency(m.totalAnnualHours)]);
    manpowerData.push([`${m.techTypeName} - Active FTE`, formatDecimal(m.activeFTE)]);
    manpowerData.push([`${m.techTypeName} - Total w/ Relievers`, formatDecimal(m.totalWithRelievers)]);
    manpowerData.push([`${m.techTypeName} - Headcount`, formatDecimal(m.headcount)]);
    manpowerData.push([`${m.techTypeName} - Annual Cost (AED)`, formatCurrency(m.annualCost)]);
  });
  manpowerData.push(['Total Active FTE', formatDecimal(results.totalActiveFTE)]);
  manpowerData.push(['Total w/ Relievers', formatDecimal(results.totalWithRelievers)]);
  manpowerData.push(['Resident Headcount', formatDecimal(results.totalResidentHeadcount)]);
  manpowerData.push(['Rotating FTE', formatDecimal(results.totalRotatingFTE)]);
  manpowerData.push(['Support Roles', formatDecimal(results.supervisorsCount)]);
  manpowerData.push(['Total Headcount', formatDecimal(results.totalInHouseHeadcount)]);

  addSection('MANPOWER SUMMARY', manpowerData);

  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  const inHouseStackData: [string, string][] = [
    ['Manpower Annual (AED)', formatCurrency(results.inHouseStack.manpowerAnnual)],
    ['Supervision Annual (AED)', formatCurrency(results.inHouseStack.supervisionAnnual)],
  ];

  if (results.inHouseStack.overtimeAnnual > 0) {
    inHouseStackData.push(['Overtime Annual (AED)', formatCurrency(results.inHouseStack.overtimeAnnual)]);
  }

  inHouseStackData.push(
    ['Materials Annual (AED)', formatCurrency(results.inHouseStack.materialsAnnual)],
    ['Consumables Annual (AED)', formatCurrency(results.inHouseStack.consumablesAnnual)],
    ['Overheads (AED)', formatCurrency(results.inHouseStack.overheads)],
    ['Subtotal (AED)', formatCurrency(results.inHouseStack.subtotal)],
    ['Profit (AED)', formatCurrency(results.inHouseStack.profit)],
    ['In-House Selling Annual (AED)', formatCurrency(results.inHouseStack.selling)],
    ['In-House Selling Monthly (AED)', formatCurrency(results.inHouseStack.selling / 12)]
  );

  addSection('IN-HOUSE COST STACK', inHouseStackData);

  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  addSection('SUBCONTRACT COST STACK', [
    ['Base Annual (AED)', formatCurrency(results.subcontractStack.baseAnnual)],
    ['Overheads (AED)', formatCurrency(results.subcontractStack.overheads)],
    ['Subtotal (AED)', formatCurrency(results.subcontractStack.subtotal)],
    ['Profit (AED)', formatCurrency(results.subcontractStack.profit)],
    ['Subcontract Selling Annual (AED)', formatCurrency(results.subcontractStack.selling)],
    ['Subcontract Selling Monthly (AED)', formatCurrency(results.subcontractStack.selling / 12)],
  ]);

  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  addSection('GRAND TOTAL', [
    ['Grand Total Annual (AED)', formatCurrency(results.grandTotal)],
    ['Grand Total Monthly (AED)', formatCurrency(results.grandTotal / 12)],
  ]);

  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSET INVENTORY', 14, yPos);
  yPos += 5;

  if (state.assetInventory.length > 0) {
    const assetData = state.assetInventory.map((inv) => {
      const assetType = state.assetTypes.find((a) => a.id === inv.assetTypeId);
      const assetName = assetType ? `${assetType.category} - ${assetType.assetName}` : 'Unknown';
      const responsibility = assetType?.responsibility === 'in_house' ? 'In-house' : 'Subcontract';
      return [
        assetName,
        inv.quantity.toString(),
        responsibility,
        inv.notes || '-',
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Asset Type', 'Qty', 'Responsibility', 'Notes']],
      body: assetData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      margin: { left: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No assets defined', 14, yPos);
    yPos += 10;
  }

  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSET TYPES LIBRARY', 14, yPos);
  yPos += 5;

  if (state.assetTypes.length > 0) {
    const assetLibraryData: string[][] = [];

    state.assetTypes.forEach((asset) => {
      assetLibraryData.push([`[${asset.category}] ${asset.assetName}`, '', '', '']);

      asset.ppmTasks.forEach((task) => {
        const techName = state.technicianLibrary.find((t) => t.id === task.technicianTypeId)?.name || 'Unknown';
        assetLibraryData.push([`  PPM: ${task.taskName}`, task.frequency, `${task.hoursPerVisit}h`, techName]);
      });

      const reactiveTechName = state.technicianLibrary.find((t) => t.id === asset.reactive.technicianTypeId)?.name || 'Unknown';
      assetLibraryData.push([
        `  Reactive`,
        `${asset.reactive.reactiveCallsPercent}% calls`,
        `${asset.reactive.avgHoursPerCall}h/call`,
        reactiveTechName,
      ]);
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Asset / Task', 'Frequency', 'Hours', 'Tech Type']],
      body: assetLibraryData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      margin: { left: 14 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 40 },
      },
    });
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No asset types defined', 14, yPos);
  }

  doc.save(`FM_MEP_Estimate_${new Date().toISOString().split('T')[0]}.pdf`);
}
