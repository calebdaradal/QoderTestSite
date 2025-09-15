// Form Component - form.js
// Handles contact form validation and submission

import { debounce, generateId } from './utils.js';

class ContactForm {
  constructor() {
    this.form = document.querySelector('#contact-form');
    this.submitButton = null;
    this.statusElement = null;
    this.fields = {};
    this.validators = {};
    this.isSubmitting = false;
    
    this.init();
  }
  
  init() {
    if (!this.form) return;
    
    this.setupForm();
    this.setupFields();
    this.setupValidators();
    this.setupEventListeners();
  }
  
  setupForm() {
    this.submitButton = this.form.querySelector('.form-submit');
    this.statusElement = this.form.querySelector('#form-status');
    
    // Ensure form has proper attributes
    this.form.setAttribute('novalidate', 'true');
  }
  
  setupFields() {
    // Get all form fields
    const inputs = this.form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      const name = input.name;
      if (name) {
        this.fields[name] = {
          element: input,
          errorElement: this.form.querySelector(`#${name}-error`),
          isValid: false,
          value: '',
          touched: false
        };
      }
    });
  }
  
  setupValidators() {
    this.validators = {
      name: {
        required: true,
        minLength: 2,
        pattern: /^[a-zA-Z\s\-'\.]+$/,
        message: 'Please enter a valid name (letters, spaces, hyphens, and apostrophes only)'
      },
      
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address'
      },
      
      'project-type': {
        required: true,
        message: 'Please select a project type'
      },
      
      message: {
        required: true,
        minLength: 10,
        maxLength: 2000,
        message: 'Please enter a message between 10 and 2000 characters'
      },
      
      budget: {
        required: false
      },
      
      timeline: {
        required: false
      }
    };
  }
  
  setupEventListeners() {
    // Form submission
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
    
    // Field validation events
    Object.keys(this.fields).forEach(fieldName => {
      const field = this.fields[fieldName];
      const input = field.element;
      
      // Real-time validation with debounce
      const debouncedValidation = debounce(() => {
        if (field.touched) {
          this.validateField(fieldName);
        }
      }, 300);
      
      // Input events
      input.addEventListener('input', (e) => {
        field.value = e.target.value;
        field.touched = true;
        debouncedValidation();
      });
      
      // Blur events
      input.addEventListener('blur', () => {
        field.touched = true;
        this.validateField(fieldName);
      });
      
      // Focus events (clear errors)
      input.addEventListener('focus', () => {
        this.clearFieldError(fieldName);
      });
    });
    
    // Character count for message field
    const messageField = this.fields.message;
    if (messageField) {
      this.setupCharacterCount(messageField);
    }
  }
  
  setupCharacterCount(field) {
    const input = field.element;
    const maxLength = this.validators.message.maxLength;
    
    // Create character count element
    const countElement = document.createElement('div');
    countElement.className = 'character-count';
    countElement.setAttribute('aria-live', 'polite');
    
    // Insert after the textarea
    input.parentNode.insertBefore(countElement, input.nextSibling);
    
    // Update character count
    const updateCount = () => {
      const currentLength = input.value.length;
      const remaining = maxLength - currentLength;
      
      countElement.textContent = `${currentLength}/${maxLength}`;
      
      if (remaining < 100) {
        countElement.style.color = 'var(--color-warning)';
      } else if (remaining < 0) {
        countElement.style.color = 'var(--color-error)';
      } else {
        countElement.style.color = 'var(--color-text-light)';
      }
    };
    
    input.addEventListener('input', updateCount);
    updateCount(); // Initial count
  }
  
  validateField(fieldName) {
    const field = this.fields[fieldName];
    const validator = this.validators[fieldName];
    
    if (!field || !validator) return true;
    
    const value = field.element.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Required validation
    if (validator.required && !value) {
      isValid = false;
      errorMessage = 'This field is required';
    }
    
    // Pattern validation
    else if (value && validator.pattern && !validator.pattern.test(value)) {
      isValid = false;
      errorMessage = validator.message || 'Invalid format';
    }
    
    // Length validation
    else if (value) {
      if (validator.minLength && value.length < validator.minLength) {
        isValid = false;
        errorMessage = `Minimum ${validator.minLength} characters required`;
      } else if (validator.maxLength && value.length > validator.maxLength) {
        isValid = false;
        errorMessage = `Maximum ${validator.maxLength} characters allowed`;
      }
    }
    
    // Custom validation
    if (isValid && validator.custom) {
      const customResult = validator.custom(value);
      if (typeof customResult === 'string') {
        isValid = false;
        errorMessage = customResult;
      } else if (!customResult) {
        isValid = false;
        errorMessage = validator.message || 'Invalid value';
      }
    }
    
    // Update field state
    field.isValid = isValid;
    field.value = value;
    
    // Update UI
    this.updateFieldUI(fieldName, isValid, errorMessage);
    
    return isValid;
  }
  
  updateFieldUI(fieldName, isValid, errorMessage) {
    const field = this.fields[fieldName];
    const input = field.element;
    const errorElement = field.errorElement;
    const formGroup = input.closest('.form-group');
    
    if (formGroup) {
      if (isValid) {
        formGroup.classList.remove('form-group--error');
        input.setAttribute('aria-invalid', 'false');
      } else {
        formGroup.classList.add('form-group--error');
        input.setAttribute('aria-invalid', 'true');
      }
    }
    
    if (errorElement) {
      if (isValid) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
      } else {
        errorElement.textContent = errorMessage;
        errorElement.style.display = 'block';
        input.setAttribute('aria-describedby', errorElement.id);
      }
    }
  }
  
  clearFieldError(fieldName) {
    const field = this.fields[fieldName];
    if (!field) return;
    
    const formGroup = field.element.closest('.form-group');
    if (formGroup && formGroup.classList.contains('form-group--error')) {
      // Only clear if field is actually valid
      if (field.isValid) {
        formGroup.classList.remove('form-group--error');
        if (field.errorElement) {
          field.errorElement.style.display = 'none';
        }
      }
    }
  }
  
  validateForm() {
    let isFormValid = true;
    const requiredFields = Object.keys(this.validators).filter(
      fieldName => this.validators[fieldName].required
    );
    
    // Validate all fields
    Object.keys(this.fields).forEach(fieldName => {
      const fieldValid = this.validateField(fieldName);
      if (!fieldValid) {
        isFormValid = false;
      }
    });
    
    return isFormValid;
  }
  
  async handleSubmit() {
    if (this.isSubmitting) return;
    
    // Validate form
    const isValid = this.validateForm();
    
    if (!isValid) {
      this.showStatus('error', 'Please correct the errors above and try again.');
      this.focusFirstError();
      return;
    }
    
    this.isSubmitting = true;
    this.setSubmitButtonState(true);
    this.showStatus('loading', 'Sending your message...');
    
    try {
      // Collect form data
      const formData = this.collectFormData();
      
      // Submit form (simulate API call)
      const response = await this.submitForm(formData);
      
      if (response.success) {
        this.showStatus('success', 'Thank you! Your message has been sent successfully. I\'ll get back to you within 24-48 hours.');
        this.resetForm();
      } else {
        throw new Error(response.message || 'Submission failed');
      }
      
    } catch (error) {
      console.error('Form submission error:', error);
      this.showStatus('error', 'Sorry, there was an error sending your message. Please try again or contact me directly via email.');
    } finally {
      this.isSubmitting = false;
      this.setSubmitButtonState(false);
    }
  }
  
  collectFormData() {
    const data = {};
    
    Object.keys(this.fields).forEach(fieldName => {
      data[fieldName] = this.fields[fieldName].value;
    });
    
    // Add timestamp
    data.timestamp = new Date().toISOString();
    data.userAgent = navigator.userAgent;
    
    return data;
  }
  
  async submitForm(formData) {
    // Simulate form submission
    // In a real application, this would send to your backend or form service
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate successful submission
        resolve({
          success: true,
          message: 'Form submitted successfully'
        });
      }, 2000);
    });
  }
  
  setSubmitButtonState(isLoading) {
    if (!this.submitButton) return;
    
    const buttonText = this.submitButton.querySelector('.btn-text');
    const buttonIcon = this.submitButton.querySelector('.btn-icon');
    
    if (isLoading) {
      this.submitButton.disabled = true;
      if (buttonText) buttonText.textContent = 'Sending...';
      if (buttonIcon) {
        buttonIcon.className = 'spinner';
      }
    } else {
      this.submitButton.disabled = false;
      if (buttonText) buttonText.textContent = 'Send Message';
      if (buttonIcon) {
        buttonIcon.className = 'fas fa-paper-plane btn-icon';
      }
    }
  }
  
  showStatus(type, message) {
    if (!this.statusElement) return;
    
    // Clear existing classes
    this.statusElement.className = 'form-status';
    
    // Add status type class
    this.statusElement.classList.add(`form-status--${type}`);
    this.statusElement.textContent = message;
    this.statusElement.style.display = 'block';
    
    // Auto-hide success messages
    if (type === 'success') {
      setTimeout(() => {
        this.statusElement.style.display = 'none';
      }, 10000);
    }
    
    // Scroll status into view
    this.statusElement.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'nearest' 
    });
  }
  
  resetForm() {
    this.form.reset();
    
    // Reset field states
    Object.keys(this.fields).forEach(fieldName => {
      const field = this.fields[fieldName];
      field.isValid = false;
      field.value = '';
      field.touched = false;
      
      // Clear UI state
      const formGroup = field.element.closest('.form-group');
      if (formGroup) {
        formGroup.classList.remove('form-group--error');
      }
      
      if (field.errorElement) {
        field.errorElement.style.display = 'none';
      }
      
      field.element.setAttribute('aria-invalid', 'false');
    });
    
    // Update character count
    const messageField = this.fields.message;
    if (messageField) {
      const countElement = messageField.element.parentNode.querySelector('.character-count');
      if (countElement) {
        countElement.textContent = '0/' + this.validators.message.maxLength;
        countElement.style.color = 'var(--color-text-light)';
      }
    }
  }
  
  focusFirstError() {
    const firstErrorField = Object.keys(this.fields).find(fieldName => {
      return !this.fields[fieldName].isValid && this.validators[fieldName]?.required;
    });
    
    if (firstErrorField) {
      const field = this.fields[firstErrorField];
      field.element.focus();
    }
  }
  
  // Public methods
  getFormData() {
    return this.collectFormData();
  }
  
  isFormValid() {
    return this.validateForm();
  }
  
  getFieldValue(fieldName) {
    return this.fields[fieldName]?.value || '';
  }
  
  setFieldValue(fieldName, value) {
    const field = this.fields[fieldName];
    if (field) {
      field.element.value = value;
      field.value = value;
      field.touched = true;
      this.validateField(fieldName);
    }
  }
  
  // Static initialization method
  static init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => new ContactForm());
    } else {
      new ContactForm();
    }
  }
}

// Auto-initialize when script loads
ContactForm.init();

// Export for potential external use
export default ContactForm;