import { useEffect, useState, useCallback } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    MenuItem,
    Select,
    LinearProgress,
    CircularProgress,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { palette } from "../../../theme/palette";
import api from "../../../api";

type MilestoneInfo = {
    value: string;
    lastUpdateDate: string | null;
    startDate: string | null;
};

type Status = Record<string, Record<string, MilestoneInfo>>;
type ProgramsStructure = Record<string, Record<string, string[]>>;

type ProgressProps = {
    personId: string;
};

const Progress = ({ personId }: ProgressProps) => {
    const [programs, setPrograms] = useState<string[]>([]);
    const [status, setStatus] = useState<Status>({});
    const [structure, setStructure] = useState<ProgramsStructure>({});
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [personRes, structureRes] = await Promise.all([
                api.get(`/people/${personId}`),
                api.get("/programs/structure"),
            ]);
            setPrograms(personRes.data.programs ?? []);
            setStatus(personRes.data.status ?? {});
            setStructure(structureRes.data ?? {});
        } catch (err) {
            console.error("Failed to load milestone data", err);
        } finally {
            setLoading(false);
        }
    }, [personId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleChange = async (
        program: string,
        type: string,
        event: SelectChangeEvent<string>
    ) => {
        const value = event.target.value;
        const key = `${program}.${type}`;
        setSavingKey(key);
        try {
            const res = await api.put(`/people/${personId}/milestones`, {
                program,
                type: type,
                milestone: value,
            });
            setStatus(res.data.status ?? {});
        } catch (err) {
            console.error("Failed to update milestone", err);
        } finally {
            setSavingKey(null);
        }
    };

    const getProgress = (
        program: string,
        type: string,
        currentValue: string | undefined
    ) => {
        const milestones = structure[program]?.[type] ?? [];
        const total = milestones.length;
        if (!currentValue || total === 0) return { current: 0, total };
        const idx = milestones.indexOf(currentValue);
        return { current: idx === -1 ? 0 : idx + 1, total };
    };

    const formatDate = (iso: string | null | undefined): string => {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString("en-CA", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <Box sx={{ p: "20px 28px", display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                    Loading milestones…
                </Typography>
            </Box>
        );
    }

    if (programs.length === 0) {
        return (
            <Box sx={{ p: "20px 28px" }}>
                <Typography variant="body2" color="text.secondary">
                    No programs enrolled. Assign programs from the Client Information tab first.
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                p: "20px 28px",
                width: "100%",
                boxSizing: "border-box",
            }}
        >
            {programs.map((program) => {
                const types = Object.keys(structure[program] ?? {});

                return (
                    <Card
                        key={program}
                        variant="outlined"
                        sx={{
                            borderRadius: 2.5,
                            backgroundColor: palette.white,
                            borderColor: "#e5e7eb",
                        }}
                    >
                        <CardContent sx={{ p: "20px 24px", "&:last-child": { pb: "20px" } }}>
                            <Typography
                                sx={{
                                    fontWeight: 700,
                                    fontSize: 17,
                                    color: "#111827",
                                }}
                            >
                                {program}
                            </Typography>

                            {types.length === 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    No milestone types configured for this program.
                                </Typography>
                            )}

                            {types.map((type, idx) => {
                                const milestones = structure[program][type] ?? [];
                                const milestoneInfo = status?.[program]?.[type];
                                const milestone = milestoneInfo?.value;
                                const { current, total } = getProgress(
                                    program,
                                    type,
                                    milestone
                                );
                                const pct = total > 0 ? (current / total) * 100 : 0;
                                const key = `${program}.${type}`;
                                const isSaving = savingKey === key;

                                return (
                                    <Box key={type}>
                                        {idx > 0 && (
                                            <Box
                                                sx={{
                                                    borderTop: "1px solid #e5e7eb",
                                                    my: 2,
                                                }}
                                            />
                                        )}

                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: "#6b7280",
                                                textTransform: "capitalize",
                                                mt: 1.5,
                                                mb: 1.5,
                                            }}
                                        >
                                            {type}
                                        </Typography>

                                        <Box
                                            sx={{
                                                display: "flex",
                                                gap: 5,
                                                alignItems: "flex-start",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <Box sx={{ flex: "1 1 280px" }}>
                                                <Select
                                                    size="small"
                                                    fullWidth
                                                    displayEmpty
                                                    value={milestone ?? ""}
                                                    disabled={isSaving}
                                                    onChange={(e) =>
                                                        handleChange(program, type, e)
                                                    }
                                                    sx={{
                                                        backgroundColor: palette.white,
                                                        borderRadius: 2,
                                                        opacity: isSaving ? 0.5 : 1,
                                                        "& .MuiSelect-select": { py: "10px" },
                                                    }}
                                                >
                                                    {!milestone && (
                                                        <MenuItem value="" disabled>
                                                            Not set
                                                        </MenuItem>
                                                    )}
                                                    {milestones.map((m) => (
                                                        <MenuItem key={m} value={m}>
                                                            {m}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </Box>

                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 0.5,
                                                    pt: 0.5,
                                                }}
                                            >
                                                <Box sx={{ display: "flex", gap: 0.75 }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: "#374151",
                                                        }}
                                                    >
                                                        Started:
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        {formatDate(milestoneInfo?.startDate)}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: "flex", gap: 0.75 }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: "#374151",
                                                        }}
                                                    >
                                                        Last Updated:
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        {formatDate(milestoneInfo?.lastUpdateDate)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>

                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                mt: 2.5,
                                                mb: 0.75,
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                sx={{ fontWeight: 600, color: "#374151" }}
                                            >
                                                Progress
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {current} of {total}
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={pct}
                                            sx={{
                                                height: 8,
                                                borderRadius: 4,
                                                backgroundColor: "#e5e7eb",
                                                "& .MuiLinearProgress-bar": {
                                                    borderRadius: 4,
                                                    backgroundColor: palette.magentaPink,
                                                },
                                            }}
                                        />
                                    </Box>
                                );
                            })}
                        </CardContent>
                    </Card>
                );
            })}
        </Box>
    );
};

export default Progress;