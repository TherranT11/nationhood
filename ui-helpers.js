// Small DOM-wiring helpers shared by the account forms (signup, login,
// found) so the same few lines don't drift out of sync across files.

// Sets an inline status/error line's text and class in one place — every
// form that shows a small state/error message under a field or button uses
// this same "textContent + baseClass (+ modifier)" pattern.
export function setStatusText(el, baseClass, text, cls){
  el.textContent = text;
  el.className = baseClass + (cls ? " " + cls : "");
}

// Wires a "Show/Hide" button to toggle a password field between masked and
// plain text. Used by /signup and /login.
export function wirePasswordPeek(button, input){
  button.addEventListener("click", function(){
    var shown = input.type === "text";
    input.type = shown ? "password" : "text";
    button.textContent = shown ? "Show" : "Hide";
    button.setAttribute("aria-pressed", String(!shown));
  });
}
