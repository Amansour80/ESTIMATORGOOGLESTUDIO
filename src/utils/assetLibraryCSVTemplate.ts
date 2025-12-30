export function generateCSVTemplate(): void {
  const headers = [
    'Category',
    'Standard Code',
    'Asset Name',
    'Description',
    'PPM Task Name',
    'Frequency',
    'Hours per Task',
    'Task Order'
  ];

  const exampleRows = [
    [
      'HVAC',
      'AC-001',
      'Split AC Unit (2 Ton)',
      'Wall mounted split air conditioning unit',
      'Filter Cleaning',
      'Monthly',
      '0.5',
      '1'
    ],
    [
      '',
      '',
      '',
      '',
      'Refrigerant Check',
      'Quarterly',
      '1',
      '2'
    ],
    [
      '',
      '',
      '',
      '',
      'Full Service',
      'Annual',
      '2',
      '3'
    ],
    [
      'Electrical',
      'DB-001',
      'Distribution Board',
      'Main electrical distribution panel',
      'Visual Inspection',
      'Monthly',
      '0.25',
      '1'
    ],
    [
      '',
      '',
      '',
      '',
      'Thermal Imaging',
      'Quarterly',
      '1.5',
      '2'
    ]
  ];

  const csvContent = [headers, ...exampleRows]
    .map(row =>
      row.map(cell => {
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    )
    .join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'asset_library_template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
