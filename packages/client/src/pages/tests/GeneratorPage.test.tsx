import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import GeneratorPage from "../GeneratorPage";
import { generatePrepPack, savePrepPack } from "../../lib/api";
import type { GenerateResponse, PrepPackDetail, PrepPackResult } from "../../types";

const mockGeneratePrepPack = generatePrepPack as jest.MockedFunction<typeof generatePrepPack>;
const mockSavePrepPack = savePrepPack as jest.MockedFunction<typeof savePrepPack>;

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const validPrepPack: PrepPackResult = {
  startupSummary: [],
  fitScore: 75,
  fitReasons: [],
  questions: ["Sample question?"],
  agenda: {
    min0_2: [],
    min2_7: [],
    min7_12: [],
    min12_15: [],
  },
};

const validGenerateResponse: GenerateResponse = {
  prepPack: validPrepPack,
  meta: {},
};

function renderGeneratorPage() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<GeneratorPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("GeneratorPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows validation error and does not call generate when Generate clicked with empty required fields", async () => {
    renderGeneratorPage();

    const generateBtn = screen.getByRole("button", { name: /generate/i });
    await userEvent.click(generateBtn);

    expect(mockGeneratePrepPack).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Startup and Investor profiles are required."
    );
  });

  it("shows loading state then displays result after Generate with filled fields", async () => {
    let resolveGenerate: (value: GenerateResponse) => void;
    mockGeneratePrepPack.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGenerate = resolve;
        })
    );

    renderGeneratorPage();

    const startupTextarea = screen.getByPlaceholderText(/paste startup profile/i);
    const investorTextarea = screen.getByPlaceholderText(/paste investor profile/i);
    await userEvent.type(startupTextarea, "Startup profile text");
    await userEvent.type(investorTextarea, "Investor profile text");

    const generateBtn = screen.getByRole("button", { name: /^generate$/i });
    await userEvent.click(generateBtn);

    expect(screen.getByText(/Loading…/)).toBeInTheDocument();

    resolveGenerate!(validGenerateResponse);

    await waitFor(() => {
      expect(screen.getByText(/Fit score/i)).toBeInTheDocument();
    });
    expect(screen.getByText("75/100")).toBeInTheDocument();
    expect(screen.getByText("Sample question?")).toBeInTheDocument();
  });

  it("navigates to note detail when Save as note is clicked after generation", async () => {
    mockGeneratePrepPack.mockResolvedValue(validGenerateResponse);
    mockSavePrepPack.mockResolvedValue({ id: "abc-123" } as PrepPackDetail);

    renderGeneratorPage();

    const startupTextarea = screen.getByPlaceholderText(/paste startup profile/i);
    const investorTextarea = screen.getByPlaceholderText(/paste investor profile/i);
    await userEvent.type(startupTextarea, "Startup profile text");
    await userEvent.type(investorTextarea, "Investor profile text");

    await userEvent.click(screen.getByRole("button", { name: /^generate$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Fit score/i)).toBeInTheDocument();
    });

    const saveBtn = screen.getByRole("button", { name: /save as note/i });
    await userEvent.click(saveBtn);

    expect(mockSavePrepPack).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/notes/abc-123");
  });
});
