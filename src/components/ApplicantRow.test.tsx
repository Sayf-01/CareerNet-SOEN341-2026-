
import {
    afterEach,
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

import ApplicantRow from "./ApplicantRow";
import { ApiError } from "../api/client";

import {
    updateApplicationStatus,
    downloadApplicantResume,
    type RecruiterApplication,
    type ApplicationStatusUpdate,
} from "../api/recruiter";

vi.mock("../api/recruiter", () => ({
    updateApplicationStatus: vi.fn(),
    downloadApplicantResume: vi.fn(),
}));

const application: RecruiterApplication = {
    application_id: 101,
    applicant_name: "Alice Martin",
    resume_id: 12,
    status: "Applied",
    applied_at: "2026-11-10T14:00:00Z",
    interview_at: null,
};

function renderRow() {
    return render(
        <table>
            <tbody>
                <ApplicantRow application={application} />
            </tbody>
        </table>
    );
}
function mockResumeTab() {
    const tab = {
        opener: window as Window | null,
        location: { href: "" },
        close: vi.fn(),
    };

    vi.spyOn(window, "open").mockReturnValue(
        tab as unknown as Window
    );

    return tab;
}
afterEach(() => {
    cleanup();
    vi.resetAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe("KR-9 Applicant Status Controls", () => {
    it("shows the five status choices", () => {
        renderRow();

        const dropdown = screen.getByRole("combobox", {
            name: "Change status for Alice Martin",
        });

        expect(dropdown).toHaveValue("Applied");
        expect(screen.getAllByRole("option")).toHaveLength(5);
    });

    it("shows the interview date input when Interview is selected", () => {
        renderRow();

        fireEvent.change(
            screen.getByRole("combobox"),
            { target: { value: "Interview" } }
        );

        expect(
            screen.getByLabelText(
                "Interview date and time for Alice Martin"
            )
        ).toBeInTheDocument();
    });

    it("sends an ISO interview date when saving", async () => {
        const inputDate = "2026-11-20T10:30";
        const isoDate = new Date(inputDate).toISOString();

        vi.mocked(updateApplicationStatus).mockResolvedValue({
            id: 101,
            status: "Interview",
            interview_at: isoDate,
            updated_at: "2026-11-16T10:00:00Z",
        });

        renderRow();

        fireEvent.change(
            screen.getByRole("combobox"),
            { target: { value: "Interview" } }
        );

        fireEvent.change(
            screen.getByLabelText(
                "Interview date and time for Alice Martin"
            ),
            { target: { value: inputDate } }
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Save" })
        );

        await waitFor(() => {
            expect(updateApplicationStatus).toHaveBeenCalledWith(
                101,
                "Interview",
                isoDate
            );
        });

        expect(
            await screen.findByText(
                "Application updated successfully."
            )
        ).toBeInTheDocument();
    });

    it("does not send an interview date for other statuses", async () => {
        vi.mocked(updateApplicationStatus).mockResolvedValue({
            id: 101,
            status: "Under Review",
            interview_at: null,
            updated_at: "2026-11-16T10:00:00Z",
        });

        renderRow();

        fireEvent.change(
            screen.getByRole("combobox"),
            { target: { value: "Under Review" } }
        );

        expect(
            screen.queryByLabelText(
                "Interview date and time for Alice Martin"
            )
        ).not.toBeInTheDocument();

        fireEvent.click(
            screen.getByRole("button", { name: "Save" })
        );

        await waitFor(() => {
            expect(updateApplicationStatus).toHaveBeenCalledWith(
                101,
                "Under Review",
                undefined
            );
        });
    });

    it("shows an error when an interview date is missing", async () => {
        renderRow();

        fireEvent.change(
            screen.getByRole("combobox"),
            { target: { value: "Interview" } }
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Save" })
        );

        expect(
            await screen.findByRole("alert")
        ).toHaveTextContent(
            "Please select an interview date and time."
        );

        expect(updateApplicationStatus).not.toHaveBeenCalled();
    });

    it("displays an API error when saving fails", async () => {
        vi.mocked(updateApplicationStatus).mockRejectedValue(
            new Error("Unable to update application status.")
        );

        renderRow();

        fireEvent.change(
            screen.getByRole("combobox"),
            { target: { value: "Rejected" } }
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Save" })
        );

        expect(
            await screen.findByRole("alert")
        ).toHaveTextContent(
            "Unable to update application status."
        );
    });

    it("disables controls while saving", async () => {
        let resolveSave:
            | ((value: ApplicationStatusUpdate) => void)
            | undefined;

        vi.mocked(updateApplicationStatus).mockImplementation(
            () =>
                new Promise<ApplicationStatusUpdate>((resolve) => {
                    resolveSave = resolve;
                })
        );

        renderRow();

        fireEvent.click(
            screen.getByRole("button", { name: "Save" })
        );

        expect(
            screen.getByRole("button", { name: "Saving..." })
        ).toBeDisabled();

        expect(
            screen.getByRole("combobox")
        ).toBeDisabled();

        resolveSave?.({
            id: 101,
            status: "Applied",
            interview_at: null,
            updated_at: "2026-11-16T10:00:00Z",
        });

        await waitFor(() => {
            expect(
                screen.getByRole("button", { name: "Save" })
            ).toBeEnabled();
        });
    });

    it("downloads and opens an applicant resume", async () => {
        const resumeBlob = new Blob(["Sample resume"], {
            type: "application/pdf",
        });

        vi.mocked(downloadApplicantResume).mockResolvedValue(
            resumeBlob
        );

        const tab = mockResumeTab();

        // Mock browser file URLs, which jsdom does not implement.
        const NativeURL = URL;
        class TestURL extends NativeURL { }

        TestURL.createObjectURL = vi.fn(
            () => "blob:resume-preview"
        );
        TestURL.revokeObjectURL = vi.fn();

        vi.stubGlobal("URL", TestURL);
        renderRow();

        fireEvent.click(
            screen.getByRole("button", { name: "View Resume" })
        );

        await waitFor(() => {
            expect(downloadApplicantResume).toHaveBeenCalledWith(
                101
            );
            expect(tab.location.href).toBe(
                "blob:resume-preview"
            );
        });

        expect(TestURL.createObjectURL).toHaveBeenCalledWith(
            resumeBlob
        );
        expect(tab.opener).toBeNull();
    });

    it("shows Resume not available when the API returns 404", async () => {
        vi.mocked(downloadApplicantResume).mockRejectedValue(
            new ApiError("Resume not found.", 404)
        );

        const tab = mockResumeTab();

        renderRow();

        fireEvent.click(
            screen.getByRole("button", { name: "View Resume" })
        );

        expect(
            await screen.findByText("Resume not available")
        ).toBeInTheDocument();

        expect(tab.close).toHaveBeenCalled();
    });

    it("shows an error when the resume request fails", async () => {
        vi.mocked(downloadApplicantResume).mockRejectedValue(
            new Error("Unable to connect to the server.")
        );

        const tab = mockResumeTab();

        renderRow();

        fireEvent.click(
            screen.getByRole("button", { name: "View Resume" })
        );

        expect(
            await screen.findByText(
                "Unable to connect to the server."
            )
        ).toBeInTheDocument();

        expect(tab.close).toHaveBeenCalled();
    });

    it("does not request the resume when pop-ups are blocked", () => {
        vi.spyOn(window, "open").mockReturnValue(null);

        renderRow();

        fireEvent.click(
            screen.getByRole("button", { name: "View Resume" })
        );

        expect(
            screen.getByText(
                "Please allow pop-ups to view the resume."
            )
        ).toBeInTheDocument();

        expect(downloadApplicantResume).not.toHaveBeenCalled();
    });

});
