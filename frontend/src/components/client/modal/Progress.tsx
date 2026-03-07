import { useEffect, useState } from "react";
import axios from "axios";
import { palette } from "../../../theme/palette";

type Program = {
    program: string;
    status: string;
};

type ProgressProps = {
    personId: string;
};

// TODO make this work (needs database redesign)

const Progress = ({ personId }: ProgressProps) => {
    const [programMilestones, setProgramMilestones] = useState<
        Map<string, Array<string>>
    >(() => new Map());
    const [failedToFetch, setFailedToFetch] = useState<Array<string>>(() => []);
    const [selectedMilestones, setSelectedMilestones] = useState<
        Map<string, string>
    >(() => new Map());
    const [enrolledPrograms, setEnrolledPrograms] = useState<Program[]>([]);

    const changeSelectedMilestone = (program: string, value: string) => {
        setSelectedMilestones(
            (prev) => new Map(prev).set(program, value)
        );
    };

    const saveProgramData = async () => {
        try {
            const payload: { milestones: Record<string, unknown> } = {
                milestones: {},
            };
            for (const [p, v] of selectedMilestones.entries()) {
                payload.milestones[p] = v;
            }
            await axios.put(
                `http://localhost:8000/people/${personId}/milestones`,
                payload,
                { withCredentials: true }
            );
            alert("Program status updated successfully");
        } catch (e) {
            console.log(e);
        }
    };

    useEffect(() => {
        const loadClientPrograms = async () => {
            try {
                const res = await axios.get(
                    `http://localhost:8000/programs?person=${personId}`,
                    { withCredentials: true }
                );
                const programs = res.data.map((respr: any) => ({
                    program: respr.program,
                    status: respr.status,
                }));
                setEnrolledPrograms(programs);
            } catch (err) {
                console.log(`Error loading programs: ${err}`);
            }
        };
        loadClientPrograms();
    }, [personId]);

    useEffect(() => {
        const getAllMilestones = async () => {
            for (const ep of enrolledPrograms) {
                try {
                    const res = await axios.get(
                        `http://localhost:8000/programs/${ep.program}/milestones`,
                        { withCredentials: true }
                    );
                    setProgramMilestones(
                        (prev) => new Map(prev).set(ep.program, res.data.general)
                    );
                } catch (e) {
                    setFailedToFetch((prev) => [...prev, ep.program]);
                    console.error(`Failed to fetch ${ep.program}`);
                }
            }
        };
        getAllMilestones();
    }, [enrolledPrograms]);

    useEffect(() => {
        for (const { program, status } of enrolledPrograms) {
            changeSelectedMilestone(program, status);
        }
    }, [enrolledPrograms]);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                padding: "20px 28px 28px",
                width: "100%",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    width: "100%",
                    gap: 16,
                }}
            >
                {enrolledPrograms.length === 0 && (
                    <p style={{ color: "#888", fontSize: 14 }}>
                        No programs enrolled. Assign programs from the Details tab first.
                    </p>
                )}

                {enrolledPrograms.map((ep) => (
                    <div
                        key={ep.program}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            justifyContent: "center",
                            width: "100%",
                            minWidth: 260,
                        }}
                    >
                        <h3
                            style={{
                                margin: "0 0 6px 0",
                                fontSize: 16,
                                fontWeight: 600,
                                color: palette.deepRed,
                            }}
                        >
                            {ep.program}
                        </h3>
                        <select
                            style={{ minWidth: 260 }}
                            className="reportSelect"
                            id={`program-filter-${ep.program}`}
                            value={selectedMilestones.get(ep.program)}
                            onChange={(e) =>
                                changeSelectedMilestone(ep.program, e.target.value)
                            }
                        >
                            {programMilestones.get(ep.program) instanceof Array &&
                                programMilestones
                                    .get(ep.program)
                                    ?.map((mo) => (
                                        <option key={mo} value={mo}>
                                            {mo}
                                        </option>
                                    ))}
                        </select>
                    </div>
                ))}
            </div>

            {enrolledPrograms.length > 0 && (
                <button
                    onClick={saveProgramData}
                    style={{
                        width: "100%",
                        marginTop: 20,
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: palette.seafoamGreen,
                        color: palette.white,
                        fontWeight: 600,
                        cursor: "pointer",
                        border: "none",
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = palette.forestGreen;
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = palette.seafoamGreen;
                    }}
                >
                    Save Program Progress
                </button>
            )}
        </div>
    );
};

export default Progress;