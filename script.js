// script.js

// Utility function to show notifications
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Function to validate form
function validateForm(formData) {
    const errors = [];

    // Check required fields
    const requiredFields = ['firstName', 'lastName', 'dob', 'address', 'tshirtSize', 'phone', 'college', 'category', 'gradYear'];
    requiredFields.forEach(field => {
        if (!formData[field] || formData[field].trim() === '') {
            errors.push(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required.`);
        }
    });

    // Validate phone number (basic check for 10 digits)
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        errors.push('Please enter a valid 10-digit phone number.');
    }

    // Validate date of birth (must be at least 16 years old)
    if (formData.dob) {
        const dob = new Date(formData.dob);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        if (age < 16 || (age === 16 && today < new Date(dob.getFullYear() + 16, dob.getMonth(), dob.getDate()))) {
            errors.push('Participants must be at least 16 years old.');
        }
    }

    return errors;
}

// Function to handle form submission
document.getElementById('registrationForm')?.addEventListener('submit', function(e) {
    e.preventDefault();

    // Get form values
    const formData = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        dob: document.getElementById('dob').value,
        address: document.getElementById('address').value.trim(),
        tshirtSize: document.getElementById('tshirtSize').value,
        phone: document.getElementById('phone').value.trim(),
        college: document.getElementById('college').value,
        category: document.getElementById('category').value,
        type: document.querySelector('input[name="type"]:checked')?.value,
        gradYear: document.getElementById('gradYear').value
    };

    // Validate form
    const errors = validateForm(formData);
    if (errors.length > 0) {
        showNotification(errors.join(' '), 'error');
        return;
    }

    // Create participant object
    const participant = {
        ...formData,
        id: Date.now(), // Add unique ID
        registrationDate: new Date().toISOString()
    };

    // Save to localStorage
    let participants = JSON.parse(localStorage.getItem('participants')) || [];
    participants.push(participant);
    localStorage.setItem('participants', JSON.stringify(participants));

    // Reset form
    this.reset();

    // Clear fee info
    document.getElementById('feeInfo').innerHTML = '';

    // Show success message
    showNotification('Registration successful! Welcome to the VSSUT Marathon.');

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Global variables for filters and sorting
let allParticipants = [];
let sortOrder = 'asc';

// Function to load participants with search, filter, and sorting functionality
async function loadParticipants(searchTerm = '', collegeFilter = '', typeFilter = '', sortBy = 'firstName') {
    try {
        const response = await fetch('https://performalytic.github.io/vssut-marathon/participants.json');
        if (!response.ok) {
            throw new Error('Failed to load participants data');
        }
        allParticipants = await response.json();

        // Populate college filter options
        populateCollegeFilter(allParticipants);

        const tbody = document.querySelector('#participantsTable tbody');
        tbody.innerHTML = '';

        let filteredParticipants = allParticipants.filter(participant => {
            const matchesSearch = !searchTerm ||
                participant.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                participant.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                participant.college.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCollege = !collegeFilter || participant.college === collegeFilter;
            const matchesType = !typeFilter || participant.type === typeFilter;
            return matchesSearch && matchesCollege && matchesType;
        });

        // Sort participants
        filteredParticipants.sort((a, b) => {
            let aVal = a[sortBy].toString().toLowerCase();
            let bVal = b[sortBy].toString().toLowerCase();

            if (sortBy === 'gradYear') {
                aVal = parseInt(aVal);
                bVal = parseInt(bVal);
            }

            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            } else {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
        });

        if (filteredParticipants.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" style="text-align: center; padding: 2rem; color: var(--light-text);">No participants found${searchTerm ? ` matching "${searchTerm}"` : ''}.</td>`;
            tbody.appendChild(row);
            return;
        }

        filteredParticipants.forEach(participant => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${participant.firstName}</td>
                <td>${participant.lastName}</td>
                <td>${participant.college}</td>
                <td>${participant.gradYear}</td>
                <td>${participant.type}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading participants:', error);
        const tbody = document.querySelector('#participantsTable tbody');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: red;">Error loading participants data.</td></tr>';
    }
}

// Function to populate college filter options
function populateCollegeFilter(participants) {
    const collegeFilter = document.getElementById('collegeFilter');
    if (!collegeFilter) return;
    const colleges = [...new Set(participants.map(p => p.college))].sort();
    collegeFilter.innerHTML = '<option value="">All Colleges</option>';
    colleges.forEach(college => {
        const option = document.createElement('option');
        option.value = college;
        option.textContent = college;
        collegeFilter.appendChild(option);
    });
}

// Function to show fee info based on college
document.getElementById('college')?.addEventListener('change', function() {
    const feeInfo = document.getElementById('feeInfo');
    if (this.value === 'VSSUT') {
        feeInfo.innerHTML = '<p>✅ Participant fee to be paid by College.</p>';
    } else if (this.value !== '') {
        feeInfo.innerHTML = '<p>💰 Registration Fee: Rs 200</p>';
    } else {
        feeInfo.innerHTML = '';
    }
});

// Search functionality for participants page
document.getElementById('searchInput')?.addEventListener('input', function() {
    const collegeFilter = document.getElementById('collegeFilter')?.value || '';
    const typeFilter = document.getElementById('typeFilter')?.value || '';
    loadParticipants(this.value, collegeFilter, typeFilter);
});

// Filter functionality for participants page
document.getElementById('collegeFilter')?.addEventListener('change', function() {
    const searchTerm = document.getElementById('searchInput')?.value || '';
    const typeFilter = document.getElementById('typeFilter')?.value || '';
    loadParticipants(searchTerm, this.value, typeFilter);
});

document.getElementById('typeFilter')?.addEventListener('change', function() {
    const searchTerm = document.getElementById('searchInput')?.value || '';
    const collegeFilter = document.getElementById('collegeFilter')?.value || '';
    loadParticipants(searchTerm, collegeFilter, this.value);
});

// Load participants on page load for participants.html
if (window.location.pathname.includes('participants.html')) {
    loadParticipants();

    // Add click event listeners to sortable table headers
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', function() {
            const sortBy = this.dataset.sort;

            // Toggle sort order if same column clicked
            sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';

            const searchTerm = document.getElementById('searchInput')?.value || '';
            const collegeFilter = document.getElementById('collegeFilter')?.value || '';
            const typeFilter = document.getElementById('typeFilter')?.value || '';
            loadParticipants(searchTerm, collegeFilter, typeFilter, sortBy);
        });
    });
}

// Add loading state to form submission
document.getElementById('registrationForm')?.addEventListener('submit', function() {
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="loading"></span> Registering...';
    submitBtn.disabled = true;

    setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
});

// Smooth scrolling for navigation links
document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});
