import { useMemo, useRef, useState, useEffect } from "react";
import { Filter } from "lucide-react";

type ClientFilterProps = {
  selectedPrograms: string[];
  setSelectedPrograms: React.Dispatch<React.SetStateAction<string[]>>;
  availablePrograms: string[];
};

const ClientFilter = ({
  selectedPrograms,
  setSelectedPrograms,
  availablePrograms,
}: ClientFilterProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const uniquePrograms = useMemo(
    () => Array.from(new Set(availablePrograms)),
    [availablePrograms]
  );

  const toggleProgram = (program: string) => {
    setSelectedPrograms((prev) =>
      prev.includes(program)
        ? prev.filter((p) => p !== program)
        : [...prev, program]
    );
  };

  const clearAll = () => {
    setSelectedPrograms([]);
  };

  return (
    <div
      ref={containerRef}
      style={{
      position: "relative",
      minWidth: 310,
      height: 74.5,
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: "0 24px",
      display: "flex",
      alignItems: "center",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
      boxSizing: "border-box",
    }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: "100%",
          height: 48,
          padding: "0 16px",
          borderRadius: 12,
          border: "1px solid #F3F4F6",
          background: "#F9FAFB",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          cursor: "pointer",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          <Filter size={16} color="#111827" />
          {selectedPrograms.length === 0 ? (
            <span
              style={{
                color: "#111827",
                fontSize: 14,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              All Programs
            </span>
          ) : (
            <span
              style={{
                color: "#111827",
                fontSize: 14,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {selectedPrograms.join(", ")}
            </span>
          )}
        </div>

        <span
          style={{
            fontSize: 12,
            color: "#111827",
            flexShrink: 0,
          }}
        >
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "100%",
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            padding: 8,
            zIndex: 20,
            maxHeight: 260,
            overflowY: "auto",
            boxSizing: "border-box",
          }}
        >
          <button
            type="button"
            onClick={clearAll}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 12px",
              background:
                selectedPrograms.length === 0 ? "#F9FAFB" : "#FFFFFF",
              color: "#111827",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            All Programs
          </button>

          {uniquePrograms.map((program) => {
            const selected = selectedPrograms.includes(program);

            return (
              <button
                key={program}
                type="button"
                onClick={() => toggleProgram(program)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  background: selected ? "#FEE2E2" : "#FFFFFF",
                  color: "#111827",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>{program}</span>
                {selected && <span>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientFilter;