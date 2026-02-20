type Props = {
  onAdd?: () => void;
};

const ClientHeader = ({ onAdd }: Props) => {
  return (
    <div className="clientSearchHeaderRow">
      <div className="clientSearchTitle">Client Management</div>
      <button type="button" className="addClientBtn" onClick={onAdd}>
        + Add Client
      </button>
    </div>
  );
};

export default ClientHeader;
