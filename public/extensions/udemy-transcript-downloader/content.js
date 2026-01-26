// Udemy transcript downloader
// TODO: add support for multiple languages?
(function() {
  'use strict';

  function init() {
    let attempts = 0;
    
    const checkInterval = setInterval(() => {
      attempts++;
      const headerFlex = document.querySelector(UDEMY_SELECTORS.headerContainer);
      
      if (headerFlex) {
        clearInterval(checkInterval);
        injectDownloadButton();
      } else if (attempts >= CONFIG.maxAttempts) {
        clearInterval(checkInterval);
      }
    }, CONFIG.checkInterval);
  }

  function injectDownloadButton() {
    if (document.querySelector(UDEMY_SELECTORS.downloadButton)) return;
    
    const headerFlex = document.querySelector(UDEMY_SELECTORS.headerContainer);
    if (!headerFlex) return;

    // Crear botón de descarga
    const downloadBtn = document.createElement('button');
    downloadBtn.type = 'button';
    downloadBtn.className = 'ud-btn ud-btn-small ud-btn-primary ud-btn-text-sm udemy-download-transcript-btn';
    downloadBtn.innerHTML = `
      <svg aria-hidden="true" focusable="false" class="ud-icon ud-icon-small" style="width: 16px; height: 16px; margin-right: 4px;">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
      </svg>
      <span>${CONFIG.texts.downloadButton}</span>
    `;
    downloadBtn.title = 'Descargar transcripción del video';
    downloadBtn.style.marginLeft = 'auto';
    
    // Crear botón de descarga + siguiente
    const downloadNextBtn = document.createElement('button');
    downloadNextBtn.type = 'button';
    downloadNextBtn.className = 'ud-btn ud-btn-small ud-btn-secondary ud-btn-text-sm udemy-download-next-btn';
    downloadNextBtn.innerHTML = `
      <svg aria-hidden="true" focusable="false" class="ud-icon ud-icon-small" style="width: 16px; height: 16px; margin-right: 4px;">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
      </svg>
      <span>${CONFIG.texts.downloadNextButton}</span>
      <svg aria-hidden="true" focusable="false" class="ud-icon ud-icon-small" style="width: 16px; height: 16px; margin-left: 4px;">
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
      </svg>
    `;
    downloadNextBtn.title = 'Descargar transcripción e ir a la siguiente clase';
    downloadNextBtn.style.marginLeft = '8px';
    
    headerFlex.appendChild(downloadBtn);
    headerFlex.appendChild(downloadNextBtn);
    
    downloadBtn.addEventListener('click', handleDownload);
    downloadNextBtn.addEventListener('click', handleDownloadAndNext);
  }

  async function handleDownload(e) {
    e.preventDefault();
    const btn = e.currentTarget;
    const originalHTML = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = CONFIG.texts.downloading;

    const transcriptToggle = document.querySelector(UDEMY_SELECTORS.transcriptToggleButton);
    if (transcriptToggle && transcriptToggle.getAttribute('aria-expanded') !== 'true') {
      transcriptToggle.click();
      await sleep(CONFIG.waitForTranscript);
    }

    const transcript = extractTranscript();
    
    if (!transcript) {
      showNotification(CONFIG.texts.errorNotFound, 'error');
      btn.disabled = false;
      btn.innerHTML = originalHTML;
      return;
    }

    const courseTitle = getCourseTitle();
    const lectureTitle = getLectureTitle();
    // quick fix for filename issues
    const filename = `${courseTitle}${CONFIG.filenameSeparator}${lectureTitle}${CONFIG.fileExtension}`.replace(/[<>:"/\\|?*]/g, '-').replace(/\s+/g, ' ').trim().substring(0, 200);

    downloadFile(transcript, filename);
    showNotification(CONFIG.texts.downloaded, 'success');
    
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }

  async function handleDownloadAndNext(e) {
    e.preventDefault();
    const btn = e.currentTarget;
    const originalHTML = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = CONFIG.texts.downloading;

    const transcriptToggle = document.querySelector(UDEMY_SELECTORS.transcriptToggleButton);
    if (transcriptToggle && transcriptToggle.getAttribute('aria-expanded') !== 'true') {
      transcriptToggle.click();
      await sleep(CONFIG.waitForTranscript);
    }

    const transcript = extractTranscript();
    if (!transcript) {
      showNotification(CONFIG.texts.errorNotFound, 'error');
      btn.disabled = false;
      btn.innerHTML = originalHTML;
      return;
    }

    const courseTitle = getCourseTitle();
    const lectureTitle = getLectureTitle();
    // quick fix for filename issues
    const filename = `${courseTitle}${CONFIG.filenameSeparator}${lectureTitle}${CONFIG.fileExtension}`.replace(/[<>:"/\\|?*]/g, '-').replace(/\s+/g, ' ').trim().substring(0, 200);

    downloadFile(transcript, filename);
    showNotification(CONFIG.texts.downloadedNext, 'success');

    await sleep(CONFIG.waitBeforeNext);
    
    const nextBtn = document.querySelector(UDEMY_SELECTORS.nextButton) || document.querySelector(UDEMY_SELECTORS.nextButtonId);
    if (nextBtn) nextBtn.click();
    
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }

  function extractTranscript() {
    const items = document.querySelectorAll(UDEMY_SELECTORS.transcriptCue);
    if (!items.length) return '';
    
    const lines = [];
    items.forEach((item, i) => {
      const textEl = item.querySelector(UDEMY_SELECTORS.transcriptCueText);
      if (textEl && textEl.textContent.trim()) {
        const text = textEl.textContent.trim();
        // maybe add timestamps later
        if (CONFIG.useNumbering) {
          lines.push(`${i + 1}. ${text}`);
        } else {
          lines.push(text);
        }
      }
    });
    
    return lines.join(CONFIG.transcriptSeparator);
  }

  function getCourseTitle() {
    const el = document.querySelector(UDEMY_SELECTORS.courseTitle) || document.querySelector('h1');
    return el ? el.textContent.trim() : 'curso-udemy';
  }

  function getLectureTitle() {
    const section = document.querySelector(UDEMY_SELECTORS.lectureContainer);
    if (section) {
      const label = section.getAttribute('aria-label');
      if (label) {
        const match = label.match(/clase\s+(\d+[^,]*)/i);
        if (match) return match[1].trim();
      }
    }
    
    const el = document.querySelector(UDEMY_SELECTORS.lectureTitleOverlay) ||
               document.querySelector(UDEMY_SELECTORS.lectureTitle);
    return el ? el.textContent.trim() : 'leccion';
  }

  function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function showNotification(msg, type = 'info') {
    const notif = document.createElement('div');
    notif.className = `udemy-transcript-notification udemy-transcript-${type}`;
    notif.textContent = msg;
    document.body.appendChild(notif);
    
    setTimeout(() => notif.classList.add('show'), 100);
    setTimeout(() => {
      notif.classList.remove('show');
      setTimeout(() => notif.remove(), 300);
    }, CONFIG.notificationDuration);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

