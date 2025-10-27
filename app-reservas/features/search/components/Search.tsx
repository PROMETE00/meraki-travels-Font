"use client";
import SearchBar from "./SearchBar";
import { useSearchClient } from "../hooks/useSearchClient";

export default function Search() {
  const { runSearch } = useSearchClient();
  return <SearchBar onSearch={runSearch} />;
}
