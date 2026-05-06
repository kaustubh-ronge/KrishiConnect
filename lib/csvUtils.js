/**
 * Converts an array of objects to a CSV string and triggers a download.
 * Handles nested objects by flattening them (e.g. user.email -> user_email)
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without .csv)
 */
export function downloadCSV(data, filename = 'export') {
  if (!data || data.length === 0) return;

  // Function to flatten nested objects
  const flattenObject = (obj, prefix = '') => {
    return Object.keys(obj).reduce((acc, k) => {
      const pre = prefix.length ? prefix + '_' : '';
      if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        Object.assign(acc, flattenObject(obj[k], pre + k));
      } else if (Array.isArray(obj[k])) {
        acc[pre + k] = obj[k].join('; ');
      } else {
        acc[pre + k] = obj[k];
      }
      return acc;
    }, {});
  };

  // Flatten all rows
  const flattenedData = data.map(row => flattenObject(row));

  // Get unique headers from all flattened rows (ensures no data is lost)
  const headers = Array.from(new Set(flattenedData.flatMap(row => Object.keys(row))));
  
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of flattenedData) {
    const values = headers.map(header => {
      const val = row[header] === undefined || row[header] === null ? '' : row[header];
      // Escape quotes and wrap in quotes for safety
      const escaped = ('' + val).replace(/"/g, '""').replace(/\n/g, ' ');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
