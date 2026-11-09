
// @vitest-environment jsdom

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";

import {
    MemoryRouter,
    Route,
    Routes,
} from "react-router-dom";

import RecruiterJobPage from "./RecruiterJobPage";
import { getJob } from "../api/jobs";
import {
    getApplicationsForJob,
    updateJob,
    archiveJob,
    unarchiveJob,
} from "../api/recruiter";
import type { JobDetail } from "../types/job";

vi.mock("../api/jobs", () => ({
    getJob: vi.fn(),
}));

vi.mock("../api/recruiter", () => ({
    getApplicationsForJob: vi.fn(),
    updateJob: vi.fn(),
    archiveJob: vi.fn(),
    unarchiveJob: vi.fn(),
}));

const mockGetJob = vi.mocked(getJob);
const mockGetApplications = vi.mocked(getApplicationsForJob);
const mockUpdateJob = vi.mocked(updateJob);
const mockArchiveJob = vi.mocked(archiveJob);
const mockUnarchiveJob = vi.mocked(unarchiveJob);

const existingJob: JobDetail = {
    id: 34,
    title: "Software Developer",
    company: "CareerNet Test",
    location: "Montreal",
    category: "Software Development",
    description: "Develop web applications.",
    status: "open",
    posted_at: "2026-11-07T18:58:43Z",
};

function renderPage() {
    return render(
        <MemoryRouter initialEntries={["/recruiter/jobs/34"]}>
            <Routes>
                <Route
                    path="/recruiter/jobs/:id"
                    element={<RecruiterJobPage />}
                />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(() => {
    vi.resetAllMocks();

    mockGetJob.mockResolvedValue(existingJob);
    mockGetApplications.mockResolvedValue([]);
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("Recruiter Manage Posting - KR-7", () => {
    it("loads an existing posting into the edit form", async () => {
        renderPage();

        expect(
            await screen.findByDisplayValue("Software Developer")
        ).toBeTruthy();

        expect(
            screen.getByDisplayValue("CareerNet Test")
        ).toBeTruthy();

        expect(
            screen.getByDisplayValue("Montreal")
        ).toBeTruthy();

        expect(
            screen.getByDisplayValue("Develop web applications.")
        ).toBeTruthy();

        expect(mockGetJob).toHaveBeenCalledWith(34);
    });

    it("sends only changed fields when saving", async () => {
        const updatedJob = {
            ...existingJob,
            title: "Senior Software Developer",
            status: "open" as const,
        };

        mockUpdateJob.mockResolvedValue(updatedJob);

        renderPage();

        await screen.findByDisplayValue("Software Developer");

        fireEvent.change(
            screen.getByLabelText("Job Title *"),
            {
                target: {
                    value: "Senior Software Developer",
                },
            }
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "Save Changes",
            })
        );

        await waitFor(() => {
            expect(mockUpdateJob).toHaveBeenCalledWith(
                34,
                {
                    title: "Senior Software Developer",
                }
            );
        });

        expect(
            await screen.findByText("Posting updated successfully.")
        ).toBeTruthy();
    });

    it("does not archive when confirmation is cancelled", async () => {
        const confirmSpy = vi
            .spyOn(window, "confirm")
            .mockReturnValue(false);

        renderPage();

        await screen.findByDisplayValue("Software Developer");

        fireEvent.click(
            screen.getByRole("button", {
                name: "Archive Posting",
            })
        );

        expect(confirmSpy).toHaveBeenCalledWith(
            "Archived postings disappear from search and cannot be applied to. Current applications stay visible."
        );

        expect(mockArchiveJob).not.toHaveBeenCalled();
    });

    it("archives a posting after confirmation", async () => {
        const confirmSpy = vi
            .spyOn(window, "confirm")
            .mockReturnValue(true);

        mockArchiveJob.mockResolvedValue({
            ...existingJob,
            status: "archived" as const,
        });

        renderPage();

        await screen.findByDisplayValue("Software Developer");

        fireEvent.click(
            screen.getByRole("button", {
                name: "Archive Posting",
            })
        );

        expect(confirmSpy).toHaveBeenCalled();

        await waitFor(() => {
            expect(mockArchiveJob).toHaveBeenCalledWith(34);
        });

        expect(
            await screen.findByText("Posting archived successfully.")
        ).toBeTruthy();

        expect(
            screen.getByRole("button", {
                name: "Unarchive Posting",
            })
        ).toBeTruthy();
    });

    it("unarchives an archived posting", async () => {
        mockGetJob.mockResolvedValue({
            ...existingJob,
            status: "archived",
        });

        mockUnarchiveJob.mockResolvedValue({
            ...existingJob,
            status: "open" as const,
        });

        renderPage();

        await screen.findByDisplayValue("Software Developer");

        fireEvent.click(
            screen.getByRole("button", {
                name: "Unarchive Posting",
            })
        );

        await waitFor(() => {
            expect(mockUnarchiveJob).toHaveBeenCalledWith(34);
        });

        expect(
            await screen.findByText(
                "Posting unarchived successfully."
            )
        ).toBeTruthy();

        expect(
            screen.getByRole("button", {
                name: "Archive Posting",
            })
        ).toBeTruthy();
    });

    it("shows an error when archiving fails", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);

        mockArchiveJob.mockRejectedValue(
            new Error("Archive request failed.")
        );

        renderPage();

        await screen.findByDisplayValue("Software Developer");

        fireEvent.click(
            screen.getByRole("button", {
                name: "Archive Posting",
            })
        );

        expect(
            await screen.findByText("Archive request failed.")
        ).toBeTruthy();

        // The posting must remain open after a failed request.
        expect(
            screen.getByRole("button", {
                name: "Archive Posting",
            })
        ).toBeTruthy();
    });

    it("shows an error when saving changes fails", async () => {
        mockUpdateJob.mockRejectedValue(
            new Error("Update request failed.")
        );

        renderPage();

        await screen.findByDisplayValue("Software Developer");

        fireEvent.change(
            screen.getByLabelText("Job Title *"),
            {
                target: {
                    value: "Senior Software Developer",
                },
            }
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "Save Changes",
            })
        );

        await waitFor(() => {
            expect(mockUpdateJob).toHaveBeenCalledWith(
                34,
                { title: "Senior Software Developer" }
            );
        });

        expect(
            await screen.findByText("Update request failed.")
        ).toBeTruthy();
    });


});
