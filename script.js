document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.primary-navigation');
  const dropdownToggle = document.querySelector('.dropdown-toggle');
  const dropdown = document.querySelector('.dropdown');

  if (menuToggle && navigation) {
    menuToggle.addEventListener('click', () => {
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!isExpanded));
      navigation.classList.toggle('open', !isExpanded);
    });
  }

  if (dropdownToggle && dropdown) {
    dropdownToggle.addEventListener('click', () => {
      const isExpanded = dropdownToggle.getAttribute('aria-expanded') === 'true';
      dropdownToggle.setAttribute('aria-expanded', String(!isExpanded));
      dropdown.classList.toggle('open', !isExpanded);
    });

    document.addEventListener('click', (event) => {
      if (event.target instanceof Node && !dropdown.contains(event.target)) {
        dropdownToggle.setAttribute('aria-expanded', 'false');
        dropdown.classList.remove('open');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        dropdownToggle.setAttribute('aria-expanded', 'false');
        dropdown.classList.remove('open');
      }
    });
  }

  document.querySelectorAll('.package-gallery').forEach((gallery) => {
    const mainImage = gallery.querySelector('.package-gallery-main');
    const thumbnails = gallery.querySelectorAll('[data-gallery-image]');

    if (!(mainImage instanceof HTMLImageElement)) {
      return;
    }

    thumbnails.forEach((thumbnail) => {
      thumbnail.addEventListener('click', () => {
        const imagePath = thumbnail.getAttribute('data-gallery-image');
        const imageAlt = thumbnail.getAttribute('data-gallery-alt');

        if (!imagePath || !imageAlt) {
          return;
        }

        mainImage.src = imagePath;
        mainImage.alt = imageAlt;
        thumbnails.forEach((item) => {
          item.setAttribute('aria-pressed', String(item === thumbnail));
        });
      });
    });
  });

  const bookingForm = document.querySelector('#booking-form');
  const calculateBooking = document.querySelector('#calculate-booking');

  if (bookingForm instanceof HTMLFormElement && calculateBooking instanceof HTMLButtonElement) {
    const feedback = bookingForm.querySelector('#booking-feedback');
    const confirmation = bookingForm.querySelector('#booking-confirmation');
    const subtotalOutput = bookingForm.querySelector('#booking-subtotal');
    const discountOutput = bookingForm.querySelector('#booking-discount');
    const vatOutput = bookingForm.querySelector('#booking-vat');
    const totalOutput = bookingForm.querySelector('#booking-total');

    const clearTotals = () => {
      [subtotalOutput, discountOutput, vatOutput, totalOutput].forEach((output) => {
        if (output) output.textContent = 'R0.00';
      });
    };

    const calculateTotal = () => {
      const selectedPackages = [...bookingForm.querySelectorAll('input[name="packages"]:checked')];
      const peopleField = bookingForm.elements.namedItem('people');
      const people = peopleField instanceof HTMLInputElement ? Number(peopleField.value) : 0;

      if (!selectedPackages.length) {
        clearTotals();
        if (feedback) feedback.textContent = 'Select at least one package to calculate your total.';
        return null;
      }

      if (!Number.isInteger(people) || people < 1 || people > 50) {
        clearTotals();
        if (feedback) feedback.textContent = 'Enter a number of people between 1 and 50.';
        return null;
      }

      const subtotal = selectedPackages.reduce((sum, item) => {
        const price = Number(item.dataset.price);
        return sum + (Number.isFinite(price) && price > 0 ? price : 0);
      }, 0) * people;
      const discountRate = Math.min(Math.max(selectedPackages.length - 1, 0) * 0.05, 0.15);
      const discount = subtotal * discountRate;
      const vat = (subtotal - discount) * 0.15;
      const total = subtotal - discount + vat;
      const formatCurrency = (value) => `R${value.toFixed(2)}`;

      if (subtotalOutput) subtotalOutput.textContent = formatCurrency(subtotal);
      if (discountOutput) discountOutput.textContent = formatCurrency(discount);
      if (vatOutput) vatOutput.textContent = formatCurrency(vat);
      if (totalOutput) totalOutput.textContent = formatCurrency(total);
      if (feedback) {
        feedback.textContent = discountRate
          ? `A ${(discountRate * 100).toFixed(0)}% multi-package discount has been applied.`
          : 'Select more packages to qualify for a multi-package discount.';
      }

      return { selectedPackages, people, subtotal, discount, vat, total };
    };

    calculateBooking.addEventListener('click', calculateTotal);
    bookingForm.addEventListener('change', (event) => {
      if (event.target instanceof HTMLElement && event.target.matches('[name="packages"], [name="people"]')) {
        calculateTotal();
      }
    });

    bookingForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const totals = calculateTotal();
      if (!totals || !bookingForm.reportValidity()) return;

      const formData = new FormData(bookingForm);
      const packageNames = totals.selectedPackages.map((item) => item.value).join(', ');
      const body = [
        `Name: ${formData.get('firstName')} ${formData.get('surname')}`,
        `Email: ${formData.get('email')}`,
        `Phone: ${formData.get('phone')}`,
        `People: ${totals.people}`,
        `Preferred date: ${formData.get('date')}`,
        `Preferred time: ${formData.get('time')}`,
        `Packages: ${packageNames}`,
        `Subtotal: R${totals.subtotal.toFixed(2)}`,
        `Discount: R${totals.discount.toFixed(2)}`,
        `VAT: R${totals.vat.toFixed(2)}`,
        `Total: R${totals.total.toFixed(2)}`
      ].join('\n');

      if (confirmation) {
        confirmation.hidden = false;
        confirmation.textContent = 'Your booking enquiry was submitted successfully. A confirmation email is being prepared for you.';
      }

      const recipient = 'clementtshwarelo1@gmail.com';
      const subject = 'Adventure booking request';
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      window.setTimeout(() => {
        const gmailWindow = window.open(gmailUrl, '_blank');
        if (!gmailWindow) {
          window.location.href = mailtoLink;
        }
      }, 250);
    });
  }
});
