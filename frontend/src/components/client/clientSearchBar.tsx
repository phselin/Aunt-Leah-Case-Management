import React from "react";

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
        placeholder="Search by name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
};

export default ClientSearchBar;
