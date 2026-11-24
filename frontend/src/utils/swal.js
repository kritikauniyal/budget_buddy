import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

// Styled reusable confirmation dialog for all delete operations
export const confirmDelete = async ({
  title = "Are you sure?",
  text = "You won't be able to revert this!",
  confirmButtonText = "Yes, delete it!",
  cancelButtonText = "Cancel"
} = {}) => {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#64748b",
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    focusCancel: true,
    background: "#ffffff",
    customClass: {
      popup: "swal-mobile-popup",
      title: "swal-mobile-title",
      confirmButton: "swal-mobile-btn-danger",
      cancelButton: "swal-mobile-btn-cancel"
    }
  });

  return result.isConfirmed;
};

// Generic confirmation for actions like logout or decline
export const confirmAction = async ({
  title = "Are you sure?",
  text = "",
  confirmButtonText = "Yes, proceed",
  cancelButtonText = "Cancel",
  icon = "question",
  confirmButtonColor = "#6366f1"
} = {}) => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor,
    cancelButtonColor: "#64748b",
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    focusCancel: true,
    background: "#ffffff",
    customClass: {
      popup: "swal-mobile-popup",
      title: "swal-mobile-title"
    }
  });

  return result.isConfirmed;
};

// Success Toast / Alert
export const showSuccess = (title, text = "", timer = 2200) => {
  return Swal.fire({
    icon: "success",
    title,
    text,
    timer,
    timerProgressBar: true,
    showConfirmButton: false,
    toast: true,
    position: "top-end"
  });
};

// Error Alert
export const showError = (title, text = "") => {
  return Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonColor: "#6366f1"
  });
};

export default Swal;

