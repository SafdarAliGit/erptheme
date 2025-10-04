$(document).ready(function() {
    let labelsVisible = false;
    
    // Toggle function
    function toggleSidebarLabels() {
        labelsVisible = !labelsVisible;
        
        if (labelsVisible) {
            $('.sidebar-item-label').show();
            $('.item-anchor').css({
                'justify-content': 'flex-start',
                'padding': '8px 15px'
            });
        } else {
            $('.sidebar-item-label').hide();
            $('.item-anchor').css({
                // 'justify-content': 'center',
                // 'padding': '8px 12px'
            });
        }
    }
    
    // Add toggle button (you can position this wherever needed)
    $('.layout-side-section').prepend(
        '<button class="btn btn-sm btn-secondary" id="toggleLabels">☰</button>'
    );
    
    $('#toggleLabels').click(toggleSidebarLabels);
    
    // Start with labels hidden
    toggleSidebarLabels();
});