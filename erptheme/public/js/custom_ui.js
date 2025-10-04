$(document).ready(function () {
    // Initialize form validation
    $('form').on('submit', function (e) {
      e.preventDefault();
  
      // Clear previous validation states
      $('.form-control').removeClass('is-invalid');
      $('.invalid-feedback').hide();
  
      // Validate inputs
      let isValid = true;
      $('.form-control').each(function () {
        const input = $(this);
        if (input.prop('required') && !input.val()) {
          input.addClass('is-invalid');
          input.siblings('.invalid-feedback').show();
          isValid = false;
        }
      });
  
      // Submit form if valid
      if (isValid) {
        this.submit();
      }
    });
  });
  