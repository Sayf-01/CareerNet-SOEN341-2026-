// Shared form rules, so Login and Register check emails the same way.

// The email rule ---> "some text, then @, then a name, then one or more .parts"
// [^\s@.] = anything EXCEPT spaces, @ and dots ---> each part between dots can't be empty
// (?:\.[^\s@.]+)+ = ".com", ".co.uk", ... (at least one)
// Why no dots inside the parts: the old pattern let a dot match in two places,
// so a long bad input made it try every split and could freeze the page (Sonar S5852).
export const EMAIL_REGEX = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
