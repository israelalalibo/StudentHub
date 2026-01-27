// Fetch user profile details
async function getUser() {
    try {
        const response = await fetch('/api/profile');
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '../index.html';
                return null;
            }
            throw new Error('Failed to fetch profile');
        }
        return await response.json();
    } catch (err) {
        console.error('Error fetching user:', err);
        return null;
    }
}

// Render existing profile image
function renderProfileImage(user) {
    const container = document.getElementById("profileImageContainer");
    const deleteBtn = document.getElementById("deleteImageBtn");
    const noImageText = document.getElementById("noImageText");

    // Create initials from name
    const initials = getInitials(user?.first_name, user?.last_name);

    if (user?.profile_picture) {
        container.innerHTML = `
            <img src="${user.profile_picture}"
                 class="img-fluid rounded-circle"
                 style="width:150px; height:150px; object-fit:cover; border:3px solid #667eea;"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="rounded-circle align-items-center justify-content-center"
                 style="width:150px; height:150px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: none;">
                <span class="display-3 text-white fw-bold">${initials}</span>
            </div>
        `;
        deleteBtn.classList.remove("d-none");
        noImageText.classList.add("d-none");
    } else {
        container.innerHTML = `
            <div class="rounded-circle d-inline-flex align-items-center justify-content-center"
                 style="width:150px; height:150px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <span class="display-3 text-white fw-bold">${initials}</span>
            </div>
        `;
        deleteBtn.classList.add("d-none");
        noImageText.classList.remove("d-none");
    }
}

// Get initials from first and last name
function getInitials(firstName, lastName) {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || '?';
}

// Load form with user info
async function loadForm() {
    const user = await getUser();
    if (!user) return;

    document.getElementById("firstNameField").value = user.first_name || '';
    document.getElementById("lastNameField").value = user.last_name || '';
    document.getElementById("emailField").value = user.email || '';

    renderProfileImage(user);
}

// Handle profile updates (first name, last name)
async function handleProfileUpdate(e) {
    e.preventDefault();

    const firstName = document.getElementById("firstNameField").value.trim();
    const lastName = document.getElementById("lastNameField").value.trim();
    const profileImageFile = document.getElementById("profileImageFile").files[0];

    const saveBtn = document.querySelector('button[type="submit"]');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="bi bi-hourglass"></i> Saving...';

    try {
        // First, upload profile picture if selected
        if (profileImageFile) {
            const formData = new FormData();
            formData.append('profileImage', profileImageFile);

            const uploadResponse = await fetch('/api/profile/picture', {
                method: 'POST',
                body: formData
            });

            const uploadResult = await uploadResponse.json();

            if (!uploadResponse.ok) {
                throw new Error(uploadResult.error || 'Failed to upload profile picture');
            }
        }

        // Then update profile info
        const response = await fetch('/api/profile/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to update profile');
        }

        showAlert("Profile updated successfully!", "success");
        setTimeout(() => {
            window.location.href = "./profile.html";
        }, 1500);

    } catch (err) {
        console.error('Update error:', err);
        showAlert(err.message || "Error updating profile", "danger");
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="bi bi-check-circle"></i> Save Changes';
    }
}

// Handle image deletion
async function handleImageDelete() {
    const confirmDelete = confirm("Are you sure you want to delete your profile picture?");
    if (!confirmDelete) return;

    const deleteBtn = document.getElementById("deleteImageBtn");
    deleteBtn.disabled = true;
    deleteBtn.innerHTML = '<i class="bi bi-hourglass"></i> Deleting...';

    try {
        const response = await fetch('/api/profile/picture', {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to delete profile picture');
        }

        showAlert("Profile picture deleted.", "success");
        loadForm();

    } catch (err) {
        console.error('Delete error:', err);
        showAlert(err.message || "Error deleting image", "danger");
    } finally {
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = '<i class="bi bi-trash"></i> Remove Picture';
    }
}

// Show alert message
function showAlert(message, type = 'info') {
    const existingAlerts = document.querySelectorAll('.edit-alert');
    existingAlerts.forEach(alert => alert.remove());

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show edit-alert`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    const cardBody = document.querySelector('.card-body');
    if (cardBody) {
        cardBody.insertBefore(alertDiv, cardBody.firstChild);
    }

    if (type === 'success') {
        setTimeout(() => alertDiv.remove(), 3000);
    }
}

// Image preview when file is selected
document.addEventListener("DOMContentLoaded", () => {
    const inputFile = document.getElementById("profileImageFile");

    if (inputFile) {
        inputFile.addEventListener("change", function(e) {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                
                // Validate file size (2MB max)
                if (file.size > 2 * 1024 * 1024) {
                    showAlert("File size must be less than 2MB", "danger");
                    inputFile.value = '';
                    return;
                }

                // Validate file type
                const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
                if (!allowedTypes.includes(file.type)) {
                    showAlert("Invalid file type. Only JPG, PNG, WebP, and GIF are allowed.", "danger");
                    inputFile.value = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = event => {
                    const container = document.getElementById("profileImageContainer");
                    container.innerHTML = `
                        <img src="${event.target.result}"
                             class="img-fluid rounded-circle"
                             style="width:150px; height:150px; object-fit:cover; border:3px solid #667eea;">
                    `;
                    
                    // Show delete button and hide no image text
                    document.getElementById("deleteImageBtn").classList.add("d-none");
                    document.getElementById("noImageText").classList.add("d-none");
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

// Event Listeners
document.getElementById("editProfileForm").addEventListener("submit", handleProfileUpdate);
document.getElementById("deleteImageBtn").addEventListener("click", handleImageDelete);

// Init
loadForm();
