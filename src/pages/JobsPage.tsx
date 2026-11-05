
import { useEffect, useState, type FormEvent } from "react";

import JobCard from "../components/JobCard";
import Button from "../components/Button";
import Input from "../components/Input";

import { JOBS_PER_PAGE, searchJobs } from "../api/jobs";

import {
  JOB_CATEGORIES,
  JOB_LOCATIONS,
  ALL_FILTER_VALUE,
} from "../constants/jobFilters";

import type { Job, JobSearchParams } from "../types/job";

type JobFilters = Omit<JobSearchParams, "page">;

const emptyFilters: JobFilters = {
  keyword: "",
  location: ALL_FILTER_VALUE,
  category: ALL_FILTER_VALUE,
};

function JobsPage() {
 // Jobs returned by the real FastAPI backend.
  const [jobs, setJobs] = useState<Job[]>([]);

  // Pagination.
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Loading and error states.
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Values currently entered in the search form.
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState(ALL_FILTER_VALUE);
  const [category, setCategory] = useState(ALL_FILTER_VALUE);

  // Filters used for the current search results.
  const [appliedFilters, setAppliedFilters] =
    useState<JobFilters>(emptyFilters);

  const totalPages = Math.max(
    1,
    Math.ceil(total / JOBS_PER_PAGE)
  );

  const hasActiveFilters = Boolean(
    appliedFilters.keyword ||
    appliedFilters.location ||
    appliedFilters.category
  );

  // Reload jobs when the page or applied filters change.
  useEffect(() => {
    let cancelled = false;

    async function loadJobs() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await searchJobs({
          ...appliedFilters,
          page,
        });

        if (cancelled) return;

        setJobs(result.items);
        setTotal(result.total);
      } catch (err) {
        if (cancelled) return;

        setJobs([]);
        setTotal(0);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load jobs. Please try again."
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadJobs();

    return () => {
      cancelled = true;
    };
  }, [page, appliedFilters]);

  // Apply all selected filters.
  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Every new search starts from page 1.
    setPage(1);

    setAppliedFilters({
      keyword: keyword.trim(),
      location,
      category,
    });
  }

  // Remove all filters and display all jobs again.
  function handleClearFilters() {
    setKeyword("");
    setLocation(ALL_FILTER_VALUE);
    setCategory(ALL_FILTER_VALUE);

    setPage(1);
    setAppliedFilters({ ...emptyFilters });
  }

  function handlePreviousPage() {
    setPage((currentPage) =>
      Math.max(1, currentPage - 1)
    );
  }

  function handleNextPage() {
    setPage((currentPage) =>
      Math.min(totalPages, currentPage + 1)
    );
  }

  const selectStyle = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "6px",
    border: "1px solid #d0d7de",
    fontSize: "14px",
    backgroundColor: "#ffffff",
    boxSizing: "border-box" as const,
  };

  return (
    <main
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "32px 24px",
      }}
    >
      <header style={{ marginBottom: "24px" }}>
        <h1>Find Jobs</h1>

        <p style={{ color: "#57606a" }}>
          Explore job opportunities and find the right
          position for your career.
        </p>
      </header>

      {/* Search and filter controls */}
      <form
        onSubmit={handleSearch}
        style={{
          backgroundColor: "#f6f8fa",
          border: "1px solid #d0d7de",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "28px",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: "20px" }}>
          Search Jobs
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          {/* Keyword search */}
          <div>
            <label
              htmlFor="job-keyword"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
              }}
            >
              Keyword
            </label>

            <Input
              id="job-keyword"
              type="text"
              placeholder="e.g. developer"
              value={keyword}
              onChange={(event) =>
                setKeyword(event.target.value)
              }
            />
          </div>

          {/* Location dropdown */}
          <div>
            <label
              htmlFor="job-location"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
              }}
            >
              Location
            </label>

            <select
              id="job-location"
              value={location}
              onChange={(event) =>
                setLocation(event.target.value)
              }
              style={selectStyle}
            >
              <option value={ALL_FILTER_VALUE}>
                All Locations
              </option>

              {JOB_LOCATIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* Category dropdown */}
          <div>
            <label
              htmlFor="job-category"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
              }}
            >
              Category
            </label>

            <select
              id="job-category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              style={selectStyle}
            >
              <option value={ALL_FILTER_VALUE}>
                All Categories
              </option>

              {JOB_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search buttons */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ width: "150px" }}>
            <Button type="submit">
              Search
            </Button>
          </div>

          <div style={{ width: "150px" }}>
            <Button
              type="button"
              onClick={handleClearFilters}
              style={{
                backgroundColor: "#576a66",
                color : "white"
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </form>

      {/* Loading state */}
      {isLoading && (
        <p role="status">Loading jobs...</p>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div
          role="alert"
          style={{
            color: "#b42318",
            padding: "16px",
            backgroundColor: "#fef3f2",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {/* No matching jobs */}
      {!isLoading && !error && jobs.length === 0 && (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            border: "1px solid #d0d7de",
            borderRadius: "8px",
          }}
        >
          <h2>
            {hasActiveFilters
              ? "No jobs found"
              : "No jobs available"}
          </h2>

          <p>
            {hasActiveFilters
              ? "Try different words or clear the filters."
              : "There are currently no job postings. Please check again later."}
          </p>

          {hasActiveFilters && (
            <div
              style={{
                width: "160px",
                margin: "20px auto 0",
              }}
            >
              <Button
                type="button"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Job listing results */}
      {!isLoading && !error && jobs.length > 0 && (
        <>
          <p style={{ marginBottom: "20px" }}>
            <strong>{total}</strong>{" "}
            {total === 1 ? "job" : "jobs"} found
          </p>

          <section aria-label="Job listings">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
              />
            ))}
          </section>

          {/* Pagination */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              marginTop: "24px",
            }}
          >
            <div style={{ width: "140px" }}>
              <Button
                type="button"
                onClick={handlePreviousPage}
                disabled={page === 1}
              >
                Previous
              </Button>
            </div>

            <span>
              Page {page} of {totalPages}
            </span>

            <div style={{ width: "140px" }}>
              <Button
                type="button"
                onClick={handleNextPage}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

export default JobsPage;
