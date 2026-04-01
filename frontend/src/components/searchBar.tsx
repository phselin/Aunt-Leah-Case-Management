import styled from "styled-components";
import { Input } from "./client/modal/clientElement";

const SearchBoxContainer = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px 24px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

type Props = {
  query: string;
  setQuery: (v: string) => void;
  placeholder?: string;
};

const SearchBar = ({ query, setQuery, placeholder = "Search" }: Props) => {
  return (
    <SearchBoxContainer>
      <InputWrapper>
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: "absolute", left: "16px", zIndex: 2 }}
        >
          <path
            d="M19 19L14.65 14.65M17 9C17 13.4183 13.4183 17 9 17C4.58172 17 1 13.4183 1 9C1 4.58172 4.58172 1 9 1C13.4183 1 17 4.58172 17 9Z"
            stroke="#9CA3AF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <Input
          style={{
            paddingLeft: "48px",
            background: "#F9FAFB",
            border: "1px solid #F3F4F6",
            fontFamily: "Poppins, sans-serif",
          }}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </InputWrapper>
    </SearchBoxContainer>
  );
};

export default SearchBar;
