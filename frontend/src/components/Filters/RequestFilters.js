import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import {
    Box,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Slider,
    Typography,
    ToggleButtonGroup,
    ToggleButton,
    Button,
    Paper,
    Stack,
    InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";

const BLOOD_GROUPS = ["all", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const RequestFilters = ({ onFilterChange }) => {
    const { t } = useTranslation();
    const [filters, setFilters] = useState({
        bloodGroup: "all",
        urgency: "all",
        hospital: "",
        maxDistance: 50,
        sortBy: "nearest",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleToggleChange = (e, nextValue) => {
        if (nextValue !== null) {
            const newFilters = { ...filters, urgency: nextValue };
            setFilters(newFilters);
            onFilterChange(newFilters);
        }
    };

    const handleSliderChange = (e, newValue) => {
        const newFilters = { ...filters, maxDistance: newValue };
        setFilters(newFilters);
    };

    const handleSliderCommitted = (e, newValue) => {
        onFilterChange({ ...filters, maxDistance: newValue });
    };

    const handleClear = () => {
        const resetFilters = {
            bloodGroup: "all",
            urgency: "all",
            hospital: "",
            maxDistance: 50,
            sortBy: "nearest",
        };
        setFilters(resetFilters);
        onFilterChange(resetFilters);
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                mb: 4,
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid #333",
                borderRadius: 3,
            }}
        >
            <Stack spacing={3}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FilterListIcon sx={{ color: "#ff2b2b" }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {t('advancedFilters')}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
                        gap: 3,
                    }}
                >
                    {/* Search Field */}
                    <TextField
                        name="hospital"
                        label={t('hospital')}
                        variant="outlined"
                        size="small"
                        value={filters.hospital}
                        onChange={handleChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: "#777" }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* Blood Group Select */}
                    <FormControl size="small">
                        <InputLabel>{t('bloodGroup')}</InputLabel>
                        <Select
                            name="bloodGroup"
                            value={filters.bloodGroup}
                            label={t('bloodGroup')}
                            onChange={handleChange}
                        >
                            {BLOOD_GROUPS.map((bg) => (
                                <MenuItem key={bg} value={bg}>
                                    {bg.toUpperCase()}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Sort By Select */}
                    <FormControl size="small">
                        <InputLabel>{t('sortBy')}</InputLabel>
                        <Select
                            name="sortBy"
                            value={filters.sortBy}
                            label={t('sortBy')}
                            onChange={handleChange}
                        >
                            <MenuItem value="nearest">{t('nearest')}</MenuItem>
                            <MenuItem value="recent">{t('recentlyPosted')}</MenuItem>
                            <MenuItem value="urgent">{t('mostUrgent')}</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1.5fr" },
                        gap: 4,
                        alignItems: "center",
                    }}
                >
                    {/* Urgency Toggle */}
                    <Box>
                        <Typography variant="caption" sx={{ color: "#777", mb: 1, display: "block" }}>
                            {t('urgencyLevel')}
                        </Typography>
                        <ToggleButtonGroup
                            value={filters.urgency}
                            exclusive
                            onChange={handleToggleChange}
                            size="small"
                            sx={{
                                "& .MuiToggleButton-root": {
                                    color: "#777",
                                    borderColor: "#333",
                                    px: 2,
                                    "&.Mui-selected": {
                                        backgroundColor: "#ff2b2b33",
                                        color: "#ff2b2b",
                                        borderColor: "#ff2b2b",
                                    },
                                },
                            }}
                        >
                            <ToggleButton value="all">{t('any')}</ToggleButton>
                            <ToggleButton value="low">{t('low')}</ToggleButton>
                            <ToggleButton value="medium">{t('medium')}</ToggleButton>
                            <ToggleButton value="high">{t('high')}</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {/* Distance Slider */}
                    <Box sx={{ px: 2 }}>
                        <Typography variant="caption" sx={{ color: "#777", mb: 1, display: "block" }}>
                            {t('distance')}: {filters.maxDistance} {t('km')}
                        </Typography>
                        <Slider
                            value={filters.maxDistance}
                            onChange={handleSliderChange}
                            onChangeCommitted={handleSliderCommitted}
                            min={1}
                            max={200}
                            valueLabelDisplay="auto"
                            sx={{
                                color: "#ff2b2b",
                                "& .MuiSlider-thumb": {
                                    "&:hover, &.Mui-focusVisible": {
                                        boxShadow: "0px 0px 0px 8px rgba(255, 43, 43, 0.16)",
                                    },
                                    "&.Mui-active": {
                                        boxShadow: "0px 0px 0px 14px rgba(255, 43, 43, 0.16)",
                                    },
                                },
                            }}
                        />
                    </Box>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                        size="small"
                        onClick={handleClear}
                        sx={{ color: "#777", "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" } }}
                    >
                        {t('clearAll')}
                    </Button>
                </Box>
            </Stack>
        </Paper>
    );
};

export default RequestFilters;
