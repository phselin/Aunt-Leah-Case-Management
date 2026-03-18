type Props = {
  query: string;
  setQuery: (v: string) => void;
};

const ClientSearchBar = ({ query, setQuery }: Props) => {
  return (
    <div className="clientSearchBar">
      <span className="searchIcon">🔍</span>
      <input
        type="text"
        id="client-search"
        name="clientSearch"
        placeholder="Search by name..."
        aria-label="Search by name"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
};

export default ClientSearchBar;
