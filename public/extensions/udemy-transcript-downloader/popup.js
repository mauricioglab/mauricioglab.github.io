(async function() {
  const statusDiv = document.getElementById('status');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url && tab.url.includes('udemy.com/course/') && tab.url.includes('/learn/lecture/')) {
      statusDiv.className = 'status active';
      statusDiv.textContent = 'Activa';
    } else {
      statusDiv.className = 'status inactive';
      statusDiv.textContent = 'Abre un video de Udemy';
    }
  } catch (e) {
    statusDiv.className = 'status inactive';
    statusDiv.textContent = 'Error';
  }
})();

