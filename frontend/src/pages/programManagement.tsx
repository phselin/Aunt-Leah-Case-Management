import axios from "axios";
import { useEffect, useState } from "react";
import styled from "styled-components";
import api from "../api";
import {
  ErrorBox,
  PrimaryBtn,
  SuccessBox,
} from "../components/client/modal/clientElement";
import { palette } from "../theme/palette";

/* ── Types ─────────────────────────────────────────────────────────── */

interface Program {
  _id: string;
  name: string;
  description?: string;
  milestoneTree: Record<string, string[]>;
}

/* ── Styled Components ─────────────────────────────────────────────── */

const HeaderRow = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 16px;
`;

const MessageArea = styled.div`
  margin-bottom: 16px;
`;

const ProgramCard = styled.div<{ $active?: boolean }>`
  background: #fff;
  border: 1px solid ${({ $active }) => ($active ? palette.deepRed : "#e5e7eb")};
  border-radius: 10px;
  margin-bottom: 12px;
  overflow: hidden;
  transition: border-color 0.15s;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: #fafafa;
  }
`;

const ProgramName = styled.span`
  font-weight: 600;
  font-size: 15px;
  color: #111827;
  letter-spacing: -0.01em;
`;

const CardActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconBtn = styled.button<{ $danger?: boolean }>`
  background: none;
  border: 1px solid ${({ $danger }) => ($danger ? "#fecaca" : "#e5e7eb")};
  border-radius: 6px;
  padding: 5px 8px;
  cursor: pointer;
  font-size: 13px;
  color: ${({ $danger }) => ($danger ? "#dc2626" : "#374151")};
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s;

  &:hover {
    background: ${({ $danger }) => ($danger ? "#fef2f2" : "#f3f4f6")};
  }
`;

const EditorArea = styled.div`
  border-top: 1px solid #f3f4f6;
  padding: 20px;
  background: #fafbfc;
`;

/* ── Existing category (read-only display) ──── */

const CategoryBlock = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const CategoryName = styled.span`
  font-weight: 600;
  font-size: 14px;
  color: #111827;
`;

const MilestoneRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
`;

const OrderBadge = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  min-width: 20px;
  text-align: center;
`;

const MilestoneLabel = styled.span`
  flex: 1;
  min-width: 0;
  font-size: 13.5px;
  color: #374151;
  padding: 7px 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
`;

const ArrowBtn = styled.button`
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  font-size: 12px;
  padding: 0;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    background: #f3f4f6;
    color: #111827;
  }

  &:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }
`;

const AddMilestoneRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
`;

/* ── Add category form ──── */

const AddCategoryForm = styled.div`
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  padding: 16px;
  margin-top: 4px;
`;

const FormLabel = styled.label`
  font-size: 12.5px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: block;
  margin-bottom: 6px;
`;

const FormInput = styled.input`
  width: 100%;
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 10px;
  color: #111827;
  box-sizing: border-box;
  transition: all 0.15s;

  &:focus {
    outline: none;
    border-color: ${palette.deepRed};
    box-shadow: 0 0 0 2px rgba(185, 28, 28, 0.08);
  }
`;

const MilestoneInputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
`;

const FormBtnRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
`;

const AddBtn = styled.button`
  background: none;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  padding: 8px 14px;
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
  width: 100%;
  transition: all 0.15s;

  &:hover {
    border-color: ${palette.deepRed};
    color: ${palette.deepRed};
    background: #fef7f7;
  }
`;

const SecondaryBtn = styled.button`
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 13.5px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: #f3f4f6;
  }
`;

const SaveBtn = styled.button`
  border: none;
  background: ${palette.deepRed};
  border-radius: 8px;
  padding: 8px 20px;
  font-size: 13.5px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* ── Overlay / Dialog ──────────────────────────────────────────────── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Dialog = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 28px 32px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
`;

const DialogTitle = styled.h3`
  font-size: 17px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 6px;
`;

const DialogSubtitle = styled.p`
  font-size: 13.5px;
  color: #6b7280;
  margin: 0 0 20px;
  line-height: 1.5;
`;

const DialogInput = styled.input`
  width: 100%;
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 14px;
  color: #111827;
  box-sizing: border-box;
  transition: all 0.15s;

  &:focus {
    outline: none;
    border-color: ${palette.deepRed};
    box-shadow: 0 0 0 2px rgba(185, 28, 28, 0.08);
  }
`;

const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 20px;
  color: #9ca3af;
  font-size: 14px;
  line-height: 1.6;
`;

/* ── Component ─────────────────────────────────────────────────────── */

const ProgramManagement = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [errMsg, setErrMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Add program dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Delete program confirm
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Expanded program (view/edit categories)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Local editable copy of the milestone tree
  const [editTree, setEditTree] = useState<Record<string, string[]>>({});
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Add category form state (inline within expanded card)
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatMilestones, setNewCatMilestones] = useState<string[]>([""]);

  // Per-category "add milestone" input
  const [newMilestoneInputs, setNewMilestoneInputs] = useState<
    Record<string, string>
  >({});

  // Delete category confirm
  const [deleteCatTarget, setDeleteCatTarget] = useState<{
    programName: string;
    category: string;
  } | null>(null);

  /* ── Data loading ──────────────────────────────────────────────── */

  const loadPrograms = async () => {
    try {
      const res = await api.get("/programs");
      setPrograms(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setErrMsg(err.response.data?.detail || "Failed to load programs");
      } else {
        setErrMsg("Unable to connect to server");
      }
    }
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  useEffect(() => {
    if (errMsg) {
      const t = setTimeout(() => setErrMsg(""), 4000);
      return () => clearTimeout(t);
    }
  }, [errMsg]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  /* ── Program CRUD ──────────────────────────────────────────────── */

  const handleAddProgram = async () => {
    const name = newName.trim();
    if (!name) return;
    setAddLoading(true);
    try {
      await api.post("/programs", {
        name,
        description: newDescription.trim(),
        milestoneTree: {},
      });
      await loadPrograms();
      setSuccessMsg(`Program "${name}" created`);
      setAddOpen(false);
      setNewName("");
      setNewDescription("");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setErrMsg(
          err.response.data?.detail ||
            err.response.data?.details ||
            "Failed to create program",
        );
      } else {
        setErrMsg("Unable to connect to server");
      }
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteProgram = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/programs?name=${encodeURIComponent(deleteTarget)}`);
      setPrograms((prev) => prev.filter((p) => p.name !== deleteTarget));
      if (
        expandedId &&
        programs.find((p) => p._id === expandedId)?.name === deleteTarget
      ) {
        setExpandedId(null);
        resetCategoryForm();
      }
      setSuccessMsg(`Program "${deleteTarget}" deleted`);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setErrMsg(err.response.data?.detail || "Failed to delete program");
      } else {
        setErrMsg("Unable to connect to server");
      }
    } finally {
      setDeleteTarget(null);
    }
  };

  /* ── Category add/delete ───────────────────────────────────────── */

  const resetCategoryForm = () => {
    setAddingCategory(false);
    setNewCatName("");
    setNewCatMilestones([""]);
  };

  const handleAddCategory = () => {
    const catName = newCatName.trim().toLowerCase();
    if (!catName) {
      setErrMsg("Category name is required");
      return;
    }

    const milestones = newCatMilestones
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    if (milestones.length === 0) {
      setErrMsg("Add at least one milestone");
      return;
    }

    if (
      new Set(milestones.map((m) => m.toLowerCase())).size !== milestones.length
    ) {
      setErrMsg("Duplicate milestones");
      return;
    }

    if (editTree[catName]) {
      setErrMsg(`Category "${catName}" already exists`);
      return;
    }

    setEditTree((prev) => ({ ...prev, [catName]: milestones }));
    resetCategoryForm();
  };

  const handleDeleteCategory = () => {
    if (!deleteCatTarget) return;
    const { category } = deleteCatTarget;
    setEditTree((prev) => {
      const copy = { ...prev };
      delete copy[category];
      return copy;
    });
    setDeleteCatTarget(null);
  };

  /* ── Milestone mutations (local state) ─────────────────────────── */

  const deleteMilestone = (cat: string, idx: number) => {
    setEditTree((prev) => ({
      ...prev,
      [cat]: prev[cat].filter((_, i) => i !== idx),
    }));
  };

  const moveMilestone = (
    cat: string,
    idx: number,
    direction: "up" | "down",
  ) => {
    setEditTree((prev) => {
      const arr = [...prev[cat]];
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= arr.length) return prev;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return { ...prev, [cat]: arr };
    });
  };

  const handleAddMilestone = (cat: string) => {
    const value = (newMilestoneInputs[cat] || "").trim().toLowerCase();
    if (!value) return;

    const existing = editTree[cat] || [];
    if (existing.some((m) => m.toLowerCase() === value)) {
      setErrMsg(`Milestone "${value}" already exists in this category`);
      return;
    }

    setEditTree((prev) => ({
      ...prev,
      [cat]: [...(prev[cat] || []), value],
    }));
    setNewMilestoneInputs((prev) => ({ ...prev, [cat]: "" }));
  };

  /* ── New category milestone form helpers ────────────────────────── */

  const updateNewMilestone = (idx: number, value: string) => {
    setNewCatMilestones((prev) => prev.map((m, i) => (i === idx ? value : m)));
  };

  const removeNewMilestone = (idx: number) => {
    setNewCatMilestones((prev) => prev.filter((_, i) => i !== idx));
  };

  const addNewMilestoneRow = () => {
    setNewCatMilestones((prev) => [...prev, ""]);
  };

  /* ── Toggle expand / Save ──────────────────────────────────────── */

  const toggleExpand = (program: Program) => {
    if (expandedId === program._id) {
      setExpandedId(null);
      setEditTree({});
      setEditDescription("");
      setNewMilestoneInputs({});
      resetCategoryForm();
    } else {
      setExpandedId(program._id);
      setEditTree(JSON.parse(JSON.stringify(program.milestoneTree || {})));
      setEditDescription(program.description || "");
      setNewMilestoneInputs({});
      resetCategoryForm();
    }
  };

  const hasChanges = (program: Program) => {
    return (
      JSON.stringify(program.milestoneTree || {}) !==
        JSON.stringify(editTree) ||
      (program.description || "") !== editDescription
    );
  };

  const handleSave = async (program: Program) => {
    // Validate no empty categories
    for (const [cat, milestones] of Object.entries(editTree)) {
      if (milestones.length === 0) {
        setErrMsg(`Category "${cat}" has no milestones`);
        return;
      }
    }

    setSaving(true);
    try {
      const res = await api.put("/programs", {
        name: program.name,
        description: editDescription,
        milestoneTree: editTree,
      });
      setPrograms((prev) =>
        prev.map((p) =>
          p._id === program._id
            ? {
                ...p,
                description: editDescription,
                milestoneTree: res.data.milestoneTree,
              }
            : p,
        ),
      );
      setSuccessMsg(`"${program.name}" updated`);
      setExpandedId(null);
      setEditTree({});
      setNewMilestoneInputs({});
      resetCategoryForm();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setErrMsg(err.response.data?.detail || "Failed to save changes");
      } else {
        setErrMsg("Unable to connect to server");
      }
    } finally {
      setSaving(false);
    }
  };

  /* ── Render: expanded program editor ───────────────────────────── */

  const renderEditor = (program: Program) => {
    const categories = Object.entries(editTree);

    return (
      <EditorArea>
        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <FormLabel>Description</FormLabel>
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Add a description (optional)"
            maxLength={300}
            rows={2}
            style={{
              width: "100%",
              fontSize: 14,
              border: "1px solid #d1d5db",
              borderRadius: 6,
              padding: "8px 10px",
              color: "#111827",
              boxSizing: "border-box",
              resize: "vertical",
              fontFamily: "inherit",
              transition: "border-color 0.15s, box-shadow 0.15s",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = palette.deepRed;
              e.currentTarget.style.boxShadow =
                "0 0 0 2px rgba(185,28,28,0.08)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#d1d5db";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
        {categories.length === 0 && !addingCategory && (
          <div
            style={{
              textAlign: "center",
              padding: "12px 0 16px",
              color: "#9ca3af",
              fontSize: 13.5,
            }}
          >
            No milestone categories yet.
          </div>
        )}

        {categories.map(([catName, milestones]) => (
          <CategoryBlock key={catName}>
            <CategoryHeader>
              <CategoryName>{catName}</CategoryName>
              <IconBtn
                $danger
                onClick={() =>
                  setDeleteCatTarget({
                    programName: program.name,
                    category: catName,
                  })
                }
                title="Delete category"
              >
                ✕ Delete
              </IconBtn>
            </CategoryHeader>

            {milestones.map((ms, i) => (
              <MilestoneRow key={`${catName}-${i}`}>
                <OrderBadge>{i + 1}</OrderBadge>
                <MilestoneLabel>{ms}</MilestoneLabel>
                <ArrowBtn
                  onClick={() => moveMilestone(catName, i, "up")}
                  disabled={i === 0}
                  title="Move up"
                >
                  ▲
                </ArrowBtn>
                <ArrowBtn
                  onClick={() => moveMilestone(catName, i, "down")}
                  disabled={i === milestones.length - 1}
                  title="Move down"
                >
                  ▼
                </ArrowBtn>
                <IconBtn
                  $danger
                  onClick={() => deleteMilestone(catName, i)}
                  title="Remove milestone"
                >
                  ✕
                </IconBtn>
              </MilestoneRow>
            ))}

            <AddMilestoneRow>
              <FormInput
                value={newMilestoneInputs[catName] || ""}
                onChange={(e) =>
                  setNewMilestoneInputs((prev) => ({
                    ...prev,
                    [catName]: e.target.value,
                  }))
                }
                onKeyDown={(e) =>
                  e.key === "Enter" && handleAddMilestone(catName)
                }
                placeholder="New milestone name"
                style={{ flex: 1 }}
              />
              <SaveBtn
                onClick={() => handleAddMilestone(catName)}
                disabled={!(newMilestoneInputs[catName] || "").trim()}
                style={{ padding: "8px 14px", fontSize: 13 }}
              >
                + Add
              </SaveBtn>
            </AddMilestoneRow>
          </CategoryBlock>
        ))}

        {/* Add category form */}
        {addingCategory ? (
          <AddCategoryForm>
            <FormLabel>Category Name</FormLabel>
            <FormInput
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g. general, housing, employment"
              autoFocus
            />

            <div style={{ marginTop: 14 }}>
              <FormLabel>
                Milestones{" "}
                <span style={{ fontWeight: 400, textTransform: "none" }}>
                  (order matters)
                </span>
              </FormLabel>
              {newCatMilestones.map((ms, idx) => (
                <MilestoneInputRow key={idx}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#9ca3af",
                      minWidth: 20,
                      textAlign: "center",
                    }}
                  >
                    {idx + 1}
                  </span>
                  <FormInput
                    value={ms}
                    onChange={(e) => updateNewMilestone(idx, e.target.value)}
                    placeholder="Milestone name"
                    style={{ flex: 1 }}
                  />
                  {newCatMilestones.length > 1 && (
                    <IconBtn
                      $danger
                      onClick={() => removeNewMilestone(idx)}
                      title="Remove"
                    >
                      ✕
                    </IconBtn>
                  )}
                </MilestoneInputRow>
              ))}
              <AddBtn
                onClick={addNewMilestoneRow}
                style={{ marginTop: 4, fontSize: 12.5 }}
              >
                + Add Another Milestone
              </AddBtn>
            </div>

            <FormBtnRow>
              <SecondaryBtn onClick={resetCategoryForm}>Cancel</SecondaryBtn>
              <SaveBtn onClick={() => handleAddCategory()}>
                Add Category
              </SaveBtn>
            </FormBtnRow>
          </AddCategoryForm>
        ) : (
          <AddBtn onClick={() => setAddingCategory(true)}>
            + Add Category
          </AddBtn>
        )}

        {/* Save / Cancel footer */}
        {hasChanges(program) && (
          <FormBtnRow
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid #f3f4f6",
            }}
          >
            <SecondaryBtn onClick={() => toggleExpand(program)}>
              Cancel
            </SecondaryBtn>
            <SaveBtn onClick={() => handleSave(program)} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </SaveBtn>
          </FormBtnRow>
        )}
      </EditorArea>
    );
  };

  /* ── Main render ───────────────────────────────────────────────── */

  return (
    <>
      <HeaderRow>
        <PrimaryBtn onClick={() => setAddOpen(true)}>+ Add Program</PrimaryBtn>
      </HeaderRow>

      <MessageArea>
        {errMsg && <ErrorBox>{errMsg}</ErrorBox>}
        {successMsg && <SuccessBox>{successMsg}</SuccessBox>}
      </MessageArea>

      {programs.length === 0 && (
        <EmptyState>
          No programs yet.
          <br />
          Click <strong>+ Add Program</strong> to create your first one.
        </EmptyState>
      )}

      {programs.map((program) => {
        const isExpanded = expandedId === program._id;
        const categoryCount = Object.keys(program.milestoneTree || {}).length;
        const milestoneCount = Object.values(
          program.milestoneTree || {},
        ).reduce((sum, arr) => sum + arr.length, 0);

        return (
          <ProgramCard key={program._id} $active={isExpanded}>
            <CardHeader onClick={() => toggleExpand(program)}>
              <div>
                <ProgramName>{program.name}</ProgramName>
                {program.description && (
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                    {program.description}
                  </div>
                )}
                <div style={{ fontSize: 12.5, color: "#9ca3af", marginTop: 3 }}>
                  {categoryCount}{" "}
                  {categoryCount === 1 ? "category" : "categories"},{" "}
                  {milestoneCount}{" "}
                  {milestoneCount === 1 ? "milestone" : "milestones"}
                </div>
              </div>
              <CardActions>
                <IconBtn
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(program);
                  }}
                >
                  {isExpanded ? "▾ Collapse" : "▸ Manage"}
                </IconBtn>
                <IconBtn
                  $danger
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(program.name);
                  }}
                >
                  Delete
                </IconBtn>
              </CardActions>
            </CardHeader>

            {isExpanded && renderEditor(program)}
          </ProgramCard>
        );
      })}

      {/* ── Add Program Dialog ─────────────────────────────────────── */}
      {addOpen && (
        <Overlay onClick={() => setAddOpen(false)}>
          <Dialog onClick={(e) => e.stopPropagation()}>
            <DialogTitle>Add Program</DialogTitle>
            <DialogSubtitle>
              Create a new program. You can add milestone categories afterward.
            </DialogSubtitle>
            <DialogInput
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddProgram()}
              placeholder="Program name"
              autoFocus
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description (optional)"
              maxLength={300}
              rows={2}
              style={{
                width: "100%",
                fontSize: 14,
                border: "1px solid #d1d5db",
                borderRadius: 8,
                padding: "10px 14px",
                color: "#111827",
                boxSizing: "border-box",
                marginTop: 10,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
            <DialogActions>
              <SecondaryBtn
                onClick={() => {
                  setAddOpen(false);
                  setNewName("");
                  setNewDescription("");
                }}
              >
                Cancel
              </SecondaryBtn>
              <SaveBtn
                onClick={handleAddProgram}
                disabled={!newName.trim() || addLoading}
              >
                {addLoading ? "Creating…" : "Create Program"}
              </SaveBtn>
            </DialogActions>
          </Dialog>
        </Overlay>
      )}

      {/* ── Delete Program Confirm ─────────────────────────────────── */}
      {deleteTarget && (
        <Overlay onClick={() => setDeleteTarget(null)}>
          <Dialog onClick={(e) => e.stopPropagation()}>
            <DialogTitle>Delete Program</DialogTitle>
            <DialogSubtitle>
              Are you sure you want to delete <strong>{deleteTarget}</strong>?
              This will remove the program from all associated clients, staff,
              and case notes. This action cannot be undone.
            </DialogSubtitle>
            <DialogActions>
              <SecondaryBtn onClick={() => setDeleteTarget(null)}>
                Cancel
              </SecondaryBtn>
              <IconBtn
                $danger
                onClick={handleDeleteProgram}
                style={{
                  padding: "8px 18px",
                  fontWeight: 600,
                  fontSize: 13.5,
                  borderRadius: 8,
                }}
              >
                Delete Program
              </IconBtn>
            </DialogActions>
          </Dialog>
        </Overlay>
      )}

      {/* ── Delete Category Confirm ────────────────────────────────── */}
      {deleteCatTarget && (
        <Overlay onClick={() => setDeleteCatTarget(null)}>
          <Dialog onClick={(e) => e.stopPropagation()}>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogSubtitle>
              Remove <strong>{deleteCatTarget.category}</strong> from{" "}
              <strong>{deleteCatTarget.programName}</strong>? Client milestone
              progress for this category will be cleared when you save.
            </DialogSubtitle>
            <DialogActions>
              <SecondaryBtn onClick={() => setDeleteCatTarget(null)}>
                Cancel
              </SecondaryBtn>
              <IconBtn
                $danger
                onClick={handleDeleteCategory}
                style={{
                  padding: "8px 18px",
                  fontWeight: 600,
                  fontSize: 13.5,
                  borderRadius: 8,
                }}
              >
                Delete Category
              </IconBtn>
            </DialogActions>
          </Dialog>
        </Overlay>
      )}
    </>
  );
};

export default ProgramManagement;
