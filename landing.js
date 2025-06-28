// Checking  if user is already registered and redirecting
document.addEventListener("DOMContentLoaded", () => {
  const userData = localStorage.getItem("taskflowUser")
  if (userData) {
    try {
      const user = JSON.parse(userData)
      if (user.name && user.dateOfBirth && isValidAge(user.dateOfBirth)) {
        window.location.href = "app.html"
        return
      }
    } catch (error) {
      console.error("Error parsing user data:", error)
      localStorage.removeItem("taskflowUser")
    }
  }
})

// for form submission handler
document.getElementById("registrationForm").addEventListener("submit", (e) => {
  e.preventDefault()

  const name = document.getElementById("userName").value.trim()
  const dateOfBirth = document.getElementById("dateOfBirth").value

  // Clearing  previous errors
  clearErrors()

  // Validate form
  let isValid = true

  if (!name) {
    showError("nameError", "Please enter your name")
    isValid = false
  } else if (name.length < 2) {
    showError("nameError", "Name must be at least 2 characters long")
    isValid = false
  } else if (name.length > 50) {
    showError("nameError", "Name must be less than 50 characters")
    isValid = false
  }

  if (!dateOfBirth) {
    showError("dobError", "Please select your date of birth")
    isValid = false
  } else {
    const birthDate = new Date(dateOfBirth)
    const today = new Date()

    if (birthDate > today) {
      showError("dobError", "Date of birth cannot be in the future")
      isValid = false
    } else if (!isValidAge(dateOfBirth)) {
      showError("dobError", "You must be over 10 years old to use TaskFlow")
      isValid = false
    }
  }

  if (isValid) {
    try {
      // Saving user data to localStorage
      const userData = {
        name: name,
        dateOfBirth: dateOfBirth,
        registrationDate: new Date().toISOString(),
      }

      localStorage.setItem("taskflowUser", JSON.stringify(userData))

      // Redirecting to app
      window.location.href = "app.html"
    } catch (error) {
      console.error("Error saving user data:", error)
      showError("nameError", "Unable to save your information. Please try again.")
    }
  }
})

function isValidAge(dateOfBirth) {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)

  // Checking if date is valid
  if (isNaN(birthDate.getTime())) {
    return false
  }

  // Checking if date is not in the future
  if (birthDate > today) {
    return false
  }

  const age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 > 10
  }

  return age > 10
}

function showError(elementId, message) {
  const errorElement = document.getElementById(elementId)
  errorElement.textContent = message
  errorElement.style.display = "block"
}

function clearErrors() {
  const errorElements = document.querySelectorAll(".error-message")
  errorElements.forEach((element) => {
    element.textContent = ""
    element.style.display = "none"
  })
}

// Adding some interactive effects
document.getElementById("userName").addEventListener("input", () => {
  clearErrors()
})

document.getElementById("dateOfBirth").addEventListener("change", () => {
  clearErrors()
})
