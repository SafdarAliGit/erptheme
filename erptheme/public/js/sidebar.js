// frappe.provide('frappe.desk');

// $(document).ready(function () {
//     function addSidebarSubLink(parentRoute, linkLabel, linkUrl, iconName = null, linkAction = null) {
//         const $parentContainer = $("a.item-anchor[href='" + parentRoute + "']").closest('.sidebar-item-container');
//         if (!$parentContainer.length) {
//             console.warn("Sidebar parent route not found:", parentRoute);
//             return;
//         }

//         let $childContainer = $parentContainer.find('.sidebar-child-item.nested-container');
//         if (!$childContainer.length) {
//             // Initially hidden (collapsed)
//             $childContainer = $('<div class="sidebar-child-item nested-container" style="display: none;"></div>');
//             $parentContainer.append($childContainer);
//         } else {
//             // Even if exists, ensure it's hidden initially
//             $childContainer.hide();
//         }

//         let $collapseBtn = $parentContainer.find('.collapse-btn');
//         if (!$collapseBtn.length) {
//             const btnHTML = `
//                 <button class="btn-reset collapse-btn drop-icon" title="Toggle">
//                   <svg class="es-icon es-line icon-sm" aria-hidden="true">
//                     <use class="collapse-icon" href="#es-line-down"></use>
//                   </svg>
//                 </button>
//             `;
//             $parentContainer.find('.drag-handle').before(btnHTML);
//             $collapseBtn = $parentContainer.find('.collapse-btn');
//         }

//         // Ensure collapse icon is “down” (i.e. shows collapsed)
//         $collapseBtn.find('svg use').attr('href', '#es-line-down');

//         // Build icon part
//         let iconHtml = '';
//         if (iconName) {
//             iconHtml = `
//             <span class="sidebar-item-icon" item-icon="${iconName}">
//               <svg class="icon icon-md" aria-hidden="true"><use href="#icon-${iconName}"></use></svg>
//             </span>`;
//         }

//         let linkHtml;
//         if (linkAction) {
//             linkHtml = `
//             <div class="sidebar-item-container" item-name="${linkLabel}">
//               <div class="desk-sidebar-item standard-sidebar-item">
//                 <a href="#" class="item-anchor" title="${linkLabel}" data-action="${linkAction}">
//                   ${iconHtml}
//                   <span class="sidebar-item-label">${linkLabel}</span>
//                 </a>
//               </div>
//             </div>
//             `;
//         } else {
//             linkHtml = `
//             <div class="sidebar-item-container" item-name="${linkLabel}">
//               <div class="desk-sidebar-item standard-sidebar-item">
//                 <a href="${linkUrl}" class="item-anchor" title="${linkLabel}">
//                   ${iconHtml}
//                   <span class="sidebar-item-label">${linkLabel}</span>
//                 </a>
//               </div>
//             </div>
//             `;
//         }

//         if ($childContainer.find(`a[title="${linkLabel}"]`).length === 0) {
//             $childContainer.append(linkHtml);
//         }

//         $parentContainer.off('click', '.collapse-btn').on('click', '.collapse-btn', function () {
//             const $nested = $(this).closest('.sidebar-item-container').find('.sidebar-child-item');
//             $nested.toggle();
//             const iconHref = $nested.is(':hidden') ? '#es-line-down' : '#es-line-up';
//             $(this).find('svg use').attr('href', iconHref);
//         });

//         if (linkAction) {
//             $childContainer.off('click', `a[data-action="${linkAction}"]`).on('click', `a[data-action="${linkAction}"]`, function (e) {
//                 e.preventDefault();
//                 if (linkAction.startsWith('new-')) {
//                     const doctype = linkAction.replace('new-', '');
//                     frappe.new_doc(doctype);
//                 } else {
//                     frappe.set_route(linkAction);
//                 }
//             });
//         }
//     }

//     const observer = new MutationObserver((mutations, obs) => {
//         const $sellingParent = $("a.item-anchor[href='/app/selling']");
//         if ($sellingParent.length) {
//             addSidebarSubLink(
//                 '/app/selling',
//                 'Sellings Page',
//                 '/app/sellings',
//                 'list',
//                 null
//             );
//             obs.disconnect();
//         }
//     });
//     observer.observe(document.body, { childList: true, subtree: true });
// });

