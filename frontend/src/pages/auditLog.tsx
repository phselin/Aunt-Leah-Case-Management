import axios from "axios";
import styled from "styled-components";
import api from "../api";
import { useEffect, useState } from "react";

/* ── Types ─────────────────────────────────────────────────────────── */
interface AuditEvent {
    id: string;
    timestamp: Date;
    action: string;
    user: string;
    details?: string;
}

/* ── Styled Components ─────────────────────────────────────────────── */

const EntryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const EntryCard = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
`;

const EntryMain = styled.div<{ $clickable?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};
  user-select: none;

  &:hover {
    background: ${({ $clickable }) => ($clickable ? "#fafafa" : "transparent")};
  }
`;

const EntryText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ActionLabel = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  letter-spacing: -0.01em;
`;

const Timestamp = styled.span`
  font-size: 12.5px;
  color: #9ca3af;
`;

const ChevronBtn = styled.div<{ $expanded: boolean }>`
  font-size: 16px;
  color: #6b7280;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  flex-shrink: 0;
  transition: transform 0.2s, color 0.15s;
  transform: ${({ $expanded }) => ($expanded ? "rotate(90deg)" : "rotate(0deg)")};
`;

const DetailsArea = styled.div`
  border-top: 1px solid #f3f4f6;
  padding: 12px 18px 14px;
  background: #fafbfc;
  font-size: 13.5px;
  color: #374151;
  line-height: 1.6;
  white-space: pre-wrap;
`;

const ErrorBox = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 10px 14px;
  color: #dc2626;
  font-size: 13.5px;
  margin-bottom: 16px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 20px;
  color: #9ca3af;
  font-size: 14px;
  line-height: 1.6;
`;

/* ── Helpers ────────────────────────────────────────────────────────── */

const formatTimestamp = (timestamp: Date): string => {
    const d = new Date(timestamp);
    return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

/* ── Component ─────────────────────────────────────────────────────── */

const AuditLog = () => {
    const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
    const [errMsg, setErrMsg] = useState("");
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    /* ── Fetch Audit Events ────────────────────────────────────────── */

    const loadAuditEvents = async () => {
        try {
            const res = await api.get(`/audit`);
            setAuditEvents(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                setErrMsg(err.response.data?.detail || "Failed to load audit events");
            } else {
                setErrMsg("Unable to connect to server");
            }
        }
    };

    useEffect(() => {
        loadAuditEvents();
    }, []);

    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    /* ── Main render ───────────────────────────────────────────────── */

    return (
        <>
            {errMsg && <ErrorBox>{errMsg}</ErrorBox>}

            {auditEvents.length === 0 && !errMsg && (
                <EmptyState>No audit events to display.</EmptyState>
            )}

            <EntryList>
                {auditEvents.map((event) => {
                    const hasDetails = Boolean(event.details);
                    const isExpanded = expandedIds.has(event.id);

                    return (
                        <EntryCard key={event.id}>
                            <EntryMain
                                $clickable={hasDetails}
                                onClick={() => hasDetails && toggleExpand(event.id)}
                            >
                                <EntryText>
                                    <ActionLabel>
                                        {event.user} {event.action}
                                    </ActionLabel>
                                    <Timestamp>{formatTimestamp(event.timestamp)}</Timestamp>
                                </EntryText>

                                {hasDetails && (
                                    <ChevronBtn $expanded={isExpanded}>›</ChevronBtn>
                                )}
                            </EntryMain>

                            {hasDetails && isExpanded && (
                                <DetailsArea>{event.details}</DetailsArea>
                            )}
                        </EntryCard>
                    );
                })}
            </EntryList>
        </>
    );
};

export default AuditLog;