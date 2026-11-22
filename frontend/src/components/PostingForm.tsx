
import { useState, type FormEvent } from "react";
import type { CreateJobData } from "../api/recruiter";
import { JOB_CATEGORIES } from "../constants/jobFilters";
import Button from "./Button";
import Input from "./Input";
import FormField from "./FormField";
import Alert from "./Alert";
import {
    validatePosting,
    type PostingFormErrors,
} from "./postingValidation";
interface PostingFormProps {
    initialValues?: CreateJobData;
    onSave: (data: CreateJobData) => Promise<void>;
    submitLabel?: string;
    onCancel?: () => void;
}

const emptyForm: CreateJobData = {
    title: "",
    company: "",
    location: "",
    category: "",
    description: "",
};



function PostingForm({
    initialValues,
    onSave,
    submitLabel = "Post Job",
    onCancel,
}: PostingFormProps) {
    const [form, setForm] = useState<CreateJobData>(
        () => ({ ...(initialValues ?? emptyForm) })
    );

    const [errors, setErrors] = useState<PostingFormErrors>({});
    const [isSaving, setIsSaving] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const handleChange = (
        field: keyof CreateJobData,
        value: string
    ) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [field]: undefined,
        }));

        setSubmitError("");
    };

    const validateForm = (): boolean => {
        const newErrors = validatePosting(form);

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (isSaving || !validateForm()) {
            return;
        }

        setIsSaving(true);
        setSubmitError("");

        try {
            await onSave({
                title: form.title.trim(),
                company: form.company.trim(),
                location: form.location.trim(),
                category: form.category,
                description: form.description.trim(),
            });

            // Clear only the new-posting form after success.
            if (!initialValues) {
                setForm({ ...emptyForm });
            }
        } catch (error) {
            setSubmitError(
                error instanceof Error
                    ? error.message
                    : "Unable to save job posting."
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate>
            {submitError && (
                <Alert type="error" message={submitError} />
            )}

            <FormField
                label="Job Title *"
                htmlFor="job-title"
                error={errors.title}
            >
                <Input
                    id="job-title"
                    value={form.title}
                    onChange={(event) =>
                        handleChange("title", event.target.value)
                    }
                    placeholder="e.g. Software Developer"
                    aria-invalid={!!errors.title}
                    disabled={isSaving}
                />
            </FormField>

            <FormField
                label="Company *"
                htmlFor="job-company"
                error={errors.company}
            >
                <Input
                    id="job-company"
                    value={form.company}
                    onChange={(event) =>
                        handleChange("company", event.target.value)
                    }
                    placeholder="Enter company name"
                    aria-invalid={!!errors.company}
                    disabled={isSaving}
                />
            </FormField>

            <FormField
                label="Location *"
                htmlFor="job-location"
                error={errors.location}
            >
                <Input
                    id="job-location"
                    value={form.location}
                    onChange={(event) =>
                        handleChange("location", event.target.value)
                    }
                    placeholder="e.g. Montreal, Quebec"
                    aria-invalid={!!errors.location}
                    disabled={isSaving}
                />
            </FormField>

            <FormField
                label="Job Category *"
                htmlFor="job-category"
                error={errors.category}
            >
                <select
                    id="job-category"
                    value={form.category}
                    onChange={(event) =>
                        handleChange("category", event.target.value)
                    }
                    aria-invalid={!!errors.category}
                    disabled={isSaving}
                    style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid #d0d7de",
                        backgroundColor: "#ffffff",
                        color: "#24292f",
                    }}
                >
                    <option value="">Select a category</option>
                    {JOB_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
            </FormField>

            <FormField
                label="Job Description *"
                htmlFor="job-description"
                error={errors.description}
            >
                <textarea
                    id="job-description"
                    rows={6}
                    value={form.description}
                    onChange={(event) =>
                        handleChange("description", event.target.value)
                    }
                    placeholder="Describe the responsibilities and requirements..."
                    aria-invalid={!!errors.description}
                    disabled={isSaving}
                    style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid #d0d7de",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                    }}
                />
            </FormField>

            <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : submitLabel}
            </Button>

            {onCancel && (
                <div style={{ marginTop: "12px" }}>
                    <Button
                        type="button"
                        onClick={onCancel}
                        disabled={isSaving}
                        style={{ backgroundColor: "#6b7280" }}
                    >
                        Cancel
                    </Button>
                </div>
            )}
        </form>
    );
}

export default PostingForm;
