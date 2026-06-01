import jsPDF from 'jspdf';

const fmt2 = (min) => {
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
};

const brl = (v) => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function exportPDF(projects, events, dateLabel = 'Hoje') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, mar = 18;
  let y = mar;

  const text = (str, x, yy, opts = {}) => doc.text(str, x, yy, opts);
  const line = (x1, y1, x2, y2) => { doc.setDrawColor(220, 220, 215); doc.line(x1, y1, x2, y2); };

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 28);
  text('OBJ_TO Time Tracker', mar, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 115, 105);
  text(`Relatório de tempo — ${dateLabel}`, mar, y);
  text(`Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`, W - mar, y, { align: 'right' });
  y += 6;
  line(mar, y, W - mar, y);
  y += 8;

  // Summary stats
  const totalMin = events.reduce((s, e) => s + e.dur, 0);
  const billableMin = events.filter((e) => {
    const p = projects.find((p) => p.id === e.project);
    return p?.billable;
  }).reduce((s, e) => s + e.dur, 0);
  const totalValue = projects.reduce((s, p) => {
    const pMin = events.filter((e) => e.project === p.id).reduce((a, e) => a + e.dur, 0);
    return s + (p.billable ? (pMin / 60) * p.rate : 0);
  }, 0);

  const statCol = (label, val, x) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 115, 105);
    text(label.toUpperCase(), x, y);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 28);
    text(val, x, y + 7);
  };

  statCol('Total', fmt2(totalMin), mar);
  statCol('Faturável', fmt2(billableMin), mar + 55);
  statCol('Valor', brl(totalValue), mar + 110);
  y += 18;
  line(mar, y, W - mar, y);
  y += 10;

  // Per-project breakdown
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(120, 115, 105);
  text('PROJETO', mar, y);
  text('CLIENTE', mar + 60, y);
  text('TEMPO', mar + 110, y);
  text('VALOR', mar + 140, y);
  text('SESSÕES', W - mar, y, { align: 'right' });
  y += 4;
  line(mar, y, W - mar, y);
  y += 6;

  for (const p of projects) {
    const pEvents = events.filter((e) => e.project === p.id);
    if (pEvents.length === 0) continue;
    const pMin = pEvents.reduce((s, e) => s + e.dur, 0);
    const pValue = p.billable ? (pMin / 60) * p.rate : 0;

    if (y > 270) { doc.addPage(); y = mar; }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 28);
    text(p.name, mar, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 95, 88);
    doc.setFontSize(9);
    text(p.client, mar + 60, y);
    text(fmt2(pMin), mar + 110, y);
    text(p.billable ? brl(pValue) : 'Interno', mar + 140, y);
    text(String(pEvents.length), W - mar, y, { align: 'right' });
    y += 5;

    // Session list (indented)
    doc.setFontSize(8);
    doc.setTextColor(140, 135, 125);
    for (const ev of pEvents.slice(0, 8)) {
      if (y > 272) { doc.addPage(); y = mar; }
      const timeStr = `${String(Math.floor(ev.start / 60)).padStart(2, '0')}:${String(ev.start % 60).padStart(2, '0')}–${String(Math.floor(ev.end / 60)).padStart(2, '0')}:${String(ev.end % 60).padStart(2, '0')}`;
      text(timeStr, mar + 4, y);
      const titleTrunc = ev.title.length > 42 ? ev.title.slice(0, 40) + '…' : ev.title;
      text(titleTrunc, mar + 28, y);
      text(fmt2(ev.dur), W - mar, y, { align: 'right' });
      y += 4.5;
    }
    if (pEvents.length > 8) {
      text(`+ ${pEvents.length - 8} mais sessões`, mar + 4, y);
      y += 4.5;
    }
    y += 3;
    line(mar, y, W - mar, y);
    y += 6;
  }

  // Total row
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 28);
  text('Total geral', mar, y);
  text(fmt2(totalMin), mar + 110, y);
  text(brl(totalValue), mar + 140, y);
  y += 10;

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 155, 145);
  line(mar, y, W - mar, y);
  y += 5;
  text('OBJ_TO Time Tracker · os dados nunca saem da sua máquina', mar, y);
  text(`Página 1`, W - mar, y, { align: 'right' });

  doc.save(`objto-timesheet-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportCSV(projects, events) {
  const header = ['Data', 'Início', 'Fim', 'Duração (min)', 'Projeto', 'Cliente', 'App', 'Título', 'Status', 'Faturável', 'Taxa (R$/h)', 'Valor (R$)'];
  const rows = events.map((ev) => {
    const p = projects.find((proj) => proj.id === ev.project);
    const hrs = ev.dur / 60;
    const value = p?.billable ? hrs * (p.rate || 0) : 0;
    return [
      '',
      `${String(Math.floor(ev.start / 60)).padStart(2, '0')}:${String(ev.start % 60).padStart(2, '0')}`,
      `${String(Math.floor(ev.end / 60)).padStart(2, '0')}:${String(ev.end % 60).padStart(2, '0')}`,
      ev.dur,
      p?.name || '',
      p?.client || '',
      ev.app,
      ev.title,
      ev.status,
      p?.billable ? 'Sim' : 'Não',
      p?.rate || 0,
      value.toFixed(2),
    ];
  });

  const csv = [header, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `objto-timesheet-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
