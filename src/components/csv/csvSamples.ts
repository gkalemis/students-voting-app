export const sampleHierarchy = '\ufeffΜάθημα,Περίοδος,Ομάδα,Φοιτητής,Θέμα\n' +
  'Συγκοινωνιακά Έργα,Χειμερινό 2024-2025,Ομάδα 1,Γεώργιος Παπαδόπουλος,Σχεδιασμός Κυκλικού Κόμβου\n' +
  'Συγκοινωνιακά Έργα,Χειμερινό 2024-2025,Ομάδα 1,Μαρία Ιωάννου,Αξιολόγηση Οδικής Ασφάλειας\n' +
  'Οδοποιία Ι,Χειμερινό 2024-2025,Ομάδα Α,Νικόλαος Γεωργίου,Μέθοδοι Χάραξης Οδού\n';

export const sampleStudents = '\ufeffΦοιτητής,Θέμα\n' +
  'Γεώργιος Παπαδόπουλος,Σχεδιασμός Κυκλικού Κόμβου\n' +
  'Μαρία Ιωάννου,Αξιολόγηση Οδικής Ασφάλειας\n' +
  'Νικόλαος Γεωργίου,Μέθοδοι Χάραξης Οδού\n';

export function downloadSampleCsv(type: 'hierarchy' | 'students') {
  const content = type === 'hierarchy' ? sampleHierarchy : sampleStudents;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = type === 'hierarchy' ? 'template-hierarchy.csv' : 'template-students.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
