On notes: Doesn't discuss consumer API. Example: only the accessibility implementation details, rather than the consumer events.

e.g. toggleSwitch has an on:change event, but it has nothing to do with the accessibility aspect of it.

Example accessibility aspects: aria-, role, title, name, etc.
As well as other considerations like: Requires portal. Events such as focus trap, keyboard, etc.

All of these should be on a single source of accessibility: Relevant accessibility considerations to the element should be kept on it.

Spec has events w/ comments that discuss overall pseudocode/strategy, but not the implementation.

Events are not detailed in TS due to their heavy reliance on side effects and comments. Just have an events bolded section with list of events attached to the element.

Basically: what the element needs (attributes), and what happens when the user interacts with it (native events).
