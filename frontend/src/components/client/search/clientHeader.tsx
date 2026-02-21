type Props = {
  onAdd?: () => void;
  onExport?: () => void;
  exporting?: boolean;
};

const ClientHeader = ({ onAdd, onExport, exporting }: Props) => {
  return (
    <div className="clientSearchHeaderRow">
      <div className="clientSearchTitle">Client Management</div>
      <div className="clientSearchHeaderActions">
        <button type="button" className="exportClientsBtn" onClick={onExport} disabled={exporting}>{exporting ? "Exporting...": "Export Clients"}</button>
      <button type="button" className="addClientBtn" onClick={onAdd}>
        + Add Client
      </button>
      </div>
    </div>
  );
};

export default ClientHeader;
