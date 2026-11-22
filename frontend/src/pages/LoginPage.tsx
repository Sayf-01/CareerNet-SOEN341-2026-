// ─── IMPORTS

// (Stage B): useState ==> gives the page a memory
// ChangeEvent = label for "someone typed in a box" (type = label only, doesn't run)
// (Stage C): FormEvent = label for "someone submitted the form"
import { type ChangeEvent, type FormEvent, useState } from "react";

// allow links using the react router package via page switching
// (Stage D): useNavigate ---> move to another page from inside the code
import { Link, useNavigate } from "react-router-dom";

import Button from "../components/Button";// the standard blue button
import Input from "../components/Input";// the standard text box
import FormField from "../components/FormField"; // wraps a box with a label + a spot for error message
// (Stage D): Alert = the colored message box, Loader = the "Loading..." text
import Alert from "../components/Alert";
import Loader from "../components/Loader";
// (Stage D): the API service + the translator for the backend's error replies
import { authService, getAuthErrorMessage } from "../services/authService";
// (Stage E): the guest book
import { useAuth } from "../context/useAuth";
// (Stage B): the shape of the memory
// interface = blank template ---> one slot for email, one for password, both text
interface LoginForm {
  email: string;
  password: string;
}

// (Stage C): the shape of the error list
// ? = optional ---> a slot can be empty (empty = no error for that box)
// (Stage D): general = an error that isn't about one box (ex: wrong password)
interface LoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

// (Stage C): the email rule (same one Krish uses on register)
// regex = a pattern ---> "some text, then @, then some text, then a dot, then some text"
// \\s = no spaces allowed, [^...] = anything EXCEPT these characters
const EMAIL_REGEX = new RegExp("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

// -- The Component: a function that return what to draw on a screen

// React calls this function whenever it needs to show the login page.
function LoginPage() {
  // (Stage D): navigate("/somewhere") = go to that page
  const navigate = useNavigate();

  
  // (Stage E): login() = write the user into the guest book
  const { login } = useAuth();

  // (Stage B): the memory (the state)
  // form = what's remembered right now (read)
  // setForm = the only way to change it (write) ---> also tells React to redraw
  // starts with both boxes empty
  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
  });

  // (Stage C): a second state, just for error messages
  // starts empty {} ==> no errors when the page first opens
  const [errors, setErrors] = useState<LoginErrors>({});

  // (Stage D): true while waiting for the backend ---> locks the form + shows "Logging in..."
  const [isLoading, setIsLoading] = useState(false);

  // (Stage B): runs on every keystroke
  // e = report of what just happened, e.target = the box that was typed in
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    // name = which box ("email" or "password"), value = what's in it now
    const { name, value } = e.target;

    // ...prev = copy the old memory, [name]: value = overwrite only the box that changed
    // so typing in email never wipes the password
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // (Stage C): user is fixing this box ---> erase its red message
    // `as keyof LoginErrors` = promise to TypeScript that name is "email" or "password"
    setErrors((prev) => ({
      ...prev,
      [name as keyof LoginErrors]: undefined,
    }));
  };

  // (Stage C): the checker ---> reads the memory, writes the error list
  // returns true = all good, false = something's wrong
  const validateForm = (): boolean => {
    // start a fresh, empty list
    const newErrors: LoginErrors = {};

    // .trim() = cut spaces off both ends ---> "   " counts as empty
    // ! = "not" ---> !"" is true, so this means "if email is empty"
    if (!form.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      // .test() = does it match the pattern? ---> no = bad format
      newErrors.email = "Please enter a valid email address.";
    }

    // login only checks "not empty" (no 8-character rule here, see chat for why)
    if (!form.password) {
      newErrors.password = "Password is required.";
    }

    // put the list on the error state ---> React redraws with red messages
    setErrors(newErrors);

    // Object.keys = list of slots that got filled ---> 0 filled = no errors = true
    return Object.keys(newErrors).length === 0;
  };

  // (Stage C): runs when "Log in" is clicked (or Enter is pressed)
  // (Stage D): async = this function can wait for the backend (await) without freezing the page
  const handleSubmit = async (e: FormEvent) => {
    // stop the browser's old default (reload page + put inputs in the URL)
    e.preventDefault();

    // run the checker ---> if it fails, stop here (return = leave the function)
    if (!validateForm()) {
      return;
    }

    // (Stage D): lock the form + show "Logging in..."
    setIsLoading(true);

    // (Stage D): try = attempt this, catch = what to do if the backend says no
    try {
      // await = wait here until the API service comes back with an answer
      const response = await authService.login({
        email: form.email.trim(),
        password: form.password,
      });

           // (Stage E): write them into the guest book (it saves the token + user)
      login(response.access_token, response.user);

      // into the dashboard
      navigate("/dashboard");
    } catch (error) {
      // translate the backend's reply into a sentence ---> show it in the red Alert
      setErrors({ general: getAuthErrorMessage(error) });
    } finally {
      // finally = runs no matter what (success OR error) ---> unlock the form
      setIsLoading(false);
    }
  };

  // Everything inside return () is the face of the page.
  return (
    // <main> = the main content area
    <main className="page">
      {/* <section> = one block of content. Same class names as Krish's register
          page, so both pages share the same look. */}
      <section className="container auth-page">
        {/* The big title at the top. */}
        <h1>Welcome back</h1>

        {/* A small grey sentence under the title.
         */}
        <p style={{ marginBottom: "1.5rem", color: "#4b5563" }}>
          Log in to continue to CareerNet.
        </p>

        {/* (Stage D): the red box for errors that aren't about one box (ex: wrong password)
            {errors.general && ( ... )} = only draw it IF there's a message */}
        {errors.general && <Alert type="error" message={errors.general} />}

        {/* <form> to group the inputs and the submit button together.
            noValidate = turn OFF the browser pop up checks,
            because we write our own error message
            (Stage C): onSubmit ---> clicking "Log in" runs handleSubmit */}
        <form onSubmit={handleSubmit} noValidate>
          {/* ── EMAIL FIELD ──
              Krish's formfield draws the label "Email" above the box.
              htmlFor="email" links the label to the box whose id is "email",
              so clicking the word email ---> the cursor in the box.
              (Stage C): error ---> FormField shows it in red under the box
              (empty = shows nothing) */}
          <FormField label="Email" htmlFor="email" error={errors.email}>
            {/* Input (Krish's) = the actual text box.
                id           = its unique name tag (matches htmlFor above)
                name         = which piece of data this is
                type="email" = phones show a keyboard with @
                placeholder  = the grey hint text shown while it's empty
                (Stage B):
                value        = the box shows what's in memory
                onChange     = every keystroke ---> handleChange
                (loop: type ---> memory updates ---> box redraws)
                (Stage C):
                aria-invalid = tells screen readers "this box has an error"
                !! = turn "some text" into true, undefined into false
                (Stage D):
                disabled     = greyed out while waiting for the backend */}
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              aria-invalid={!!errors.email}
              disabled={isLoading}
            />
          </FormField>

          {/* ── PASSWORD FIELD ──
              Same as email.
              type="password" =  typing is dots.
              autoComplete="current-password" ==> tells password managers
              (Stage B): same value + onChange, pointing at the password slot
              (Stage C): same error + aria-invalid, for the password slot
              (Stage D): same disabled
              */}
          <FormField label="Password" htmlFor="password" error={errors.password}>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Your password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              aria-invalid={!!errors.password}
              disabled={isLoading}
            />
          </FormField>

          {/* ── SUBMIT BUTTON ──
              The <div> adds space above the button.
              type="submit" = clicking it sends the form.
              (Stage D): disabled while loading ---> no double-clicking = no double orders
              condition ? A : B = "if condition, show A, otherwise show B" */}
          <div style={{ marginTop: "1.5rem" }}>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                  <Loader />
                  Logging in...
                </span>
              ) : (
                "Log in"
              )}
            </Button>
          </div>

          {/* ── LINK TO REGISTER ── for people who don't have an account yet. */}
          <p
            style={{
              marginTop: "1rem",
              textAlign: "center",
              fontSize: "0.9rem",
              color: "#4b5563",
            }}
          >
            Don't have an account?{" "}
            {/* to="/register" = which page to switch to when clicked. */}
            <Link to="/register" style={{ color: "#2563eb", fontWeight: 600 }}>
              Create one
            </Link>
          </p>
        </form>

        {/* TEMPORARY (Stage B): window into the memory ---> uncomment to debug
            {form.email} = insert the value here
            password ==> only shows the count, not the text

        <p style={{ marginTop: "2rem", fontFamily: "monospace", color: "#6b7280" }}>
          memory → email: "{form.email}" · password: {form.password.length} characters
        </p>
        */}
      </section>
    </main>
  );
}

// ─── EXPORT so other files can import it ───
// App.tsx imports LoginPage and shows it at the /login address.
export default LoginPage;