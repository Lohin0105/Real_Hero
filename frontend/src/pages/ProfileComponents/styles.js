// frontend/src/pages/ProfileComponents/styles.js
export const getInputStyle = (isEditing) => ({
    InputProps: {
        sx: {
            color: "#fff !important",
            "& input::placeholder": { color: "rgba(255,255,255,0.3) !important" },
            '& input.Mui-disabled': { color: 'rgba(255,255,255,0.7) !important', WebkitTextFillColor: 'rgba(255,255,255,0.7) !important' },
            transition: "all 0.3s ease",
        },
    },
    InputLabelProps: {
        sx: {
            color: "rgba(255,255,255,0.7)",
            fontSize: "0.95rem",
            '&.Mui-focused': { color: "#ff2b2b", fontWeight: 600 },
            '&.Mui-disabled': { color: 'rgba(255,255,255,0.4)' }
        }
    },
    sx: {
        '& .MuiOutlinedInput-root': {
            background: isEditing ? "rgba(20,20,20,0.6)" : "rgba(10,10,10,0.4)",
            borderRadius: "16px",
            backdropFilter: "blur(12px)",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            '& fieldset': { borderColor: isEditing ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)", borderWidth: "1px" },
            '&:hover fieldset': { borderColor: isEditing ? "rgba(255,43,43,0.6)" : "rgba(255,255,255,0.1)" },
            '&.Mui-focused fieldset': { borderColor: "#ff2b2b", borderWidth: "2px", boxShadow: "0 0 20px rgba(255,43,43,0.25)" },
            '&.Mui-disabled': { background: "rgba(0,0,0,0.2)", '& fieldset': { borderColor: "transparent" } },
            '& .MuiSelect-icon': { color: "rgba(255,255,255,0.5)" },
        },
    },
});
