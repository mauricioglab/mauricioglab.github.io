// selectors for udemy elements
const UDEMY_SELECTORS = {
  headerContainer: '.header--flex--mCOlT',
  transcriptToggleButton: '[data-purpose="transcript-toggle"]',
  transcriptPanel: '[data-purpose="transcript-panel"]',
  transcriptCue: '[data-purpose="transcript-cue"]',
  transcriptCueText: '[data-purpose="cue-text"]',
  transcriptCueButton: '[data-purpose="cue-text-button"]',
  nextButton: '[data-purpose="go-to-next"]',
  nextButtonId: '#go-to-next-item',
  lectureContainer: 'section.lecture-view--container--mrZSm',
  courseTitle: '[data-purpose="course-header-title"]',
  lectureTitleOverlay: '.video-viewer--title-overlay--YZQuH',
  lectureTitle: '[data-purpose="lecture-title"]',
  headingXL: '.ud-heading-xl',
  downloadButton: '.udemy-download-transcript-btn',
  downloadNextButton: '.udemy-download-next-btn',
  notification: '.udemy-transcript-notification'
};

const CONFIG = {
  waitForTranscript: 1000,
  waitBeforeNext: 500,
  checkInterval: 1000,
  maxAttempts: 30,
  fileExtension: '.txt',
  filenameSeparator: ' - ',
  transcriptSeparator: '\n',
  useTimestamps: false,
  useNumbering: false,
  notificationDuration: 3000,
  texts: {
    downloadButton: 'Descargar Transcripción',
    downloadNextButton: 'Descargar y Siguiente',
    downloading: 'Descargando...',
    downloaded: '¡Transcripción descargada exitosamente!',
    downloadedNext: '¡Descargado! Siguiente clase...',
    errorNotFound: 'No se encontró transcripción para este video',
    errorGeneral: 'Error al descargar la transcripción',
    errorNoNext: 'Descargado, pero no se encontró botón siguiente'
  }
};

