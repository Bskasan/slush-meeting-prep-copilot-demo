import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import NotesListPage from "../NotesListPage";
import { fetchPrepPacks } from "../../lib/api";

const mockFetchPrepPacks = fetchPrepPacks as jest.MockedFunction<
  typeof fetchPrepPacks
>;

function renderNotesListPage() {
  return render(
    <MemoryRouter initialEntries={["/notes"]}>
      <Routes>
        <Route path="/notes" element={<NotesListPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("NotesListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows empty state when fetch returns no items", async () => {
    mockFetchPrepPacks.mockResolvedValue([]);

    renderNotesListPage();

    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    expect(
      screen.getByText(
        /No saved prep packs yet. Generate one from the Generate page./i,
      ),
    ).toBeInTheDocument();
  });

  it("shows ErrorBanner when fetch throws", async () => {
    mockFetchPrepPacks.mockRejectedValue(new Error("Network error"));

    renderNotesListPage();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Network error");
  });
});
