/* =========================
   SKELETON LOADING SYSTEM
========================= */

/**
 * Generate skeleton card HTML
 */
export function skeletonCard() {
  return `
    <div class="card skeleton">
      <div class="skeleton-image skeleton"></div>
      <div class="skeleton-text lg skeleton" style="margin-top:12px"></div>
      <div class="skeleton-text sm skeleton"></div>
      <div style="display:flex;gap:8px;margin-top:auto;padding-top:12px">
        <div class="skeleton-text skeleton" style="height:32px;flex:1;margin:0"></div>
        <div class="skeleton-text skeleton" style="height:32px;flex:1;margin:0"></div>
      </div>
    </div>
  `;
}

/**
 * Fill a grid container with skeleton cards
 * @param {HTMLElement} container
 * @param {number} count
 */
export function showSkeletons(container, count = 8) {
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    container.insertAdjacentHTML('beforeend', skeletonCard());
  }
}

/**
 * Generate a skeleton line
 */
export function skeletonLine(width = '100%', height = '14px') {
  return `<div class="skeleton" style="width:${width};height:${height};border-radius:6px"></div>`;
}

/**
 * Generate skeleton product detail
 */
export function skeletonProductDetail() {
  return `
    <div style="display:flex;gap:32px;flex-wrap:wrap">
      <div class="skeleton" style="flex:1;min-width:280px;height:360px;border-radius:16px"></div>
      <div style="flex:1;min-width:280px;display:flex;flex-direction:column;gap:12px">
        ${skeletonLine('80%', '28px')}
        ${skeletonLine('40%', '20px')}
        ${skeletonLine('60%', '16px')}
        ${skeletonLine('100%', '14px')}
        ${skeletonLine('90%', '14px')}
        ${skeletonLine('70%', '14px')}
        <div style="margin-top:auto;display:flex;gap:12px">
          <div class="skeleton" style="flex:1;height:44px;border-radius:10px"></div>
          <div class="skeleton" style="flex:1;height:44px;border-radius:10px"></div>
        </div>
      </div>
    </div>
  `;
}
