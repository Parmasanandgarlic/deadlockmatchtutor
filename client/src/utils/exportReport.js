import html2canvas from 'html2canvas';

/**
 * Export the dashboard report as a downloadable PNG image.
 *
 * Captures the `.osic-dossier-bg` container (the main dashboard card)
 * and triggers a browser download.
 *
 * @param {string} heroName - Hero name for the filename
 * @param {string|number} matchId - Match ID for the filename
 * @returns {Promise<void>}
 */
export async function exportReportAsPng(heroName = 'report', matchId = '') {
  const target = document.querySelector('.osic-dossier-bg');
  if (!target) {
    console.warn('[Export] Could not find .osic-dossier-bg container');
    return;
  }

  try {
    const canvas = await html2canvas(target, {
      backgroundColor: '#050506',
      scale: 2, // 2x resolution for crisp output
      useCORS: true,
      allowTaint: false,
      logging: false,
      // Ignore external images that may CORS-block
      onclone: (clonedDoc) => {
        // Remove interactive elements from the clone
        const buttons = clonedDoc.querySelectorAll('button, a');
        buttons.forEach((btn) => {
          btn.style.pointerEvents = 'none';
        });
      },
    });

    const link = document.createElement('a');
    const safeName = (heroName || 'report').replace(/[^a-zA-Z0-9]/g, '-');
    link.download = `deadlock-report-${safeName}-${matchId || 'unknown'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error('[Export] Failed to generate report image:', err);
  }
}
