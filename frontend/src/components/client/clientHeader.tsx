import React from "react";

type Props = {
  onAdd?: () => void;
};

const ClientHeader = ({ onAdd }: Props) => {
  return (
    <div className="clientHeaderRow">
      <div className="clientTitle">Client Management</div>
      <button type="button" className="addClientBtn" onClick={onAdd}>
        + Add Client
      </button>
    </div>
  );
};

export default ClientHeader;
