import type { SelectChangeEvent } from "@mui/material";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import api from "../../../api";
import { ErrorBox } from "./clientElement";

type MilestoneInfo = {
  value: string;
  lastUpdateDate: string | null;
  startDate: string | null;
};

type ProgramMilestones = Record<string, Record<string, MilestoneInfo>>;
type ProgramsStructure = Record<string, Record<string, string[]>>;

type ProgressProps = {
  personId: string;
};

const Progress = ({ personId }: ProgressProps) => {
  const [programs, setPrograms] = useState<string[]>([]);
  const [programMilestones, setProgramMilestones] = useState<ProgramMilestones>(
    {},
  );
  const [structure, setStructure] = useState<ProgramsStructure>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [localErr, setLocalErr] = useState<string>("");

  useEffect(() => {
    if (localErr) {
      const timer = setTimeout(() => {
        setLocalErr("");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [localErr]);

  const fetchData = useCallback(async () => {
    try {
      const [personRes, structureRes] = await Promise.all([
        api.get(`/people/${personId}`),
        api.get("/programs/structure"),
      ]);
      setPrograms(personRes.data.programs ?? []);
      setProgramMilestones(personRes.data.programMilestones ?? {});
      setStructure(structureRes.data ?? {});
    } catch (err) {
      setLocalErr("Failed to load milestone data");
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
    event: SelectChangeEvent<string>,
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
      setProgramMilestones(res.data.programMilestones ?? {});
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setLocalErr(
          `You do not have permission to update milestone for ${program} program`,
        );
      } else {
        setLocalErr("Failed to update milestone");
      }
    } finally {
      setSavingKey(null);
    }
  };

  const getProgress = (
    program: string,
    type: string,
    currentValue: string | undefined,
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
      <Box
        sx={{ p: "20px 28px", display: "flex", alignItems: "center", gap: 1 }}
      >
        <CircularProgress size={18} sx={{ color: "#D16B7C" }} />
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
          No programs enrolled. Assign programs from the Client Information tab
          first.
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
      {localErr && <ErrorBox>{localErr}</ErrorBox>}
      {programs.map((program) => {
        const types = Object.keys(structure[program] ?? {});

        return (
          <Card
            key={program}
            variant="outlined"
            sx={{
              borderRadius: 3,
              backgroundColor: "white",
              borderColor: "#E5E7EB",
              overflow: "hidden",
              "&:hover": {
                borderColor: "#D16B7C40",
                boxShadow: "0 2px 8px rgba(209, 107, 124, 0.08)",
              },
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
          >
            <CardContent
              sx={{ p: "20px 24px", "&:last-child": { pb: "20px" } }}
            >
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
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  No milestone types configured for this program.
                </Typography>
              )}

              {types.map((type, idx) => {
                const milestones = structure[program][type] ?? [];
                const milestoneInfo = programMilestones?.[program]?.[type];
                const milestone = milestoneInfo?.value;
                const { current, total } = getProgress(
                  program,
                  type,
                  milestone,
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
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#D16B7C",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        mt: 1.5,
                        mb: 1.5,
                        backgroundColor: "#FDEAED",
                        display: "inline-block",
                        px: 1.5,
                        py: 0.4,
                        borderRadius: "99px",
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
                          onChange={(e) => handleChange(program, type, e)}
                          sx={{
                            backgroundColor: "white",
                            borderRadius: 2,
                            opacity: isSaving ? 0.5 : 1,
                            "& .MuiSelect-select": { py: "10px" },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#E5E7EB",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#D16B7C",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#D16B7C",
                            },
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
                          gap: 0.75,
                          backgroundColor: "#FDF2F4",
                          borderRadius: 2,
                          px: 2,
                          py: 1.25,
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
                          <Typography variant="body2" color="text.secondary">
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
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(milestoneInfo?.lastUpdateDate)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        mt: 2.5,
                        p: 2,
                        backgroundColor: "#FAFAFA",
                        borderRadius: 2.5,
                        border: "1px solid #F3F4F6",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "#374151" }}
                        >
                          Progress
                        </Typography>
                        <Box
                          sx={{
                            backgroundColor:
                              pct === 100 ? "#DCFCE7" : "#FDEAED",
                            color: pct === 100 ? "#15803D" : "#D16B7C",
                            px: 1.5,
                            py: 0.25,
                            borderRadius: "99px",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {current} of {total}
                        </Box>
                      </Box>

                      {/* Segmented bar */}
                      <Box sx={{ display: "flex", gap: "3px", mb: 1.5 }}>
                        {Array.from({ length: total }).map((_, i) => (
                          <Box
                            key={i}
                            sx={{
                              flex: 1,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor:
                                i < current ? "#D16B7C" : "#E5E7EB",
                              transition: "background-color 0.3s ease",
                            }}
                          />
                        ))}
                      </Box>

                      {/* Step labels */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0,
                          mt: 1,
                        }}
                      >
                        {milestones.map((m, i) => {
                          const isComplete = i < current;
                          const isCurrent = i === current - 1;
                          return (
                            <Box
                              key={m}
                              sx={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  backgroundColor: isCurrent
                                    ? "#D16B7C"
                                    : isComplete
                                      ? "#FDEAED"
                                      : "#F3F4F6",
                                  color: isCurrent
                                    ? "white"
                                    : isComplete
                                      ? "#D16B7C"
                                      : "#9CA3AF",
                                  border: isCurrent
                                    ? "2px solid #D16B7C"
                                    : isComplete
                                      ? "2px solid #D16B7C"
                                      : "2px solid #E5E7EB",
                                  transition: "all 0.3s ease",
                                }}
                              >
                                {isComplete && !isCurrent ? "✓" : i + 1}
                              </Box>
                              <Typography
                                sx={{
                                  fontSize: 10,
                                  fontWeight: isCurrent ? 700 : 500,
                                  color: isCurrent
                                    ? "#D16B7C"
                                    : isComplete
                                      ? "#374151"
                                      : "#9CA3AF",
                                  textAlign: "center",
                                  lineHeight: 1.2,
                                  maxWidth: 80,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={m}
                              >
                                {m}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
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
