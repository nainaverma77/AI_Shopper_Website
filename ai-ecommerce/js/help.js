/* =========================
   HELP PAGE LOGIC
========================= */

document.addEventListener('DOMContentLoaded', initHelp);

function initHelp() {
  /* FAQ Accordion */
  document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
      const item = question.parentElement;
      const wasOpen = item.classList.contains('open');

      /* Close all in same section */
      item.closest('.faq-section').querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));

      /* Toggle current */
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* FAQ Search */
  const searchInput = document.getElementById('helpSearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();
      document.querySelectorAll('.faq-item').forEach(item => {
        const question = item.querySelector('.faq-question').textContent.toLowerCase();
        const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
        const match = !query || question.includes(query) || answer.includes(query);
        item.style.display = match ? '' : 'none';
      });

      /* Show/hide sections if all items hidden */
      document.querySelectorAll('.faq-section').forEach(section => {
        const hasVisible = [...section.querySelectorAll('.faq-item')].some(i => i.style.display !== 'none');
        section.style.display = hasVisible ? '' : 'none';
      });
    });
  }

  /* Contact form */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      window.showToast?.('Message sent! We\'ll get back to you within 24 hours. 📧', 'success');
      form.reset();
    });
  }
}
