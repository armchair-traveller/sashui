It seems from my brief observation that:

- It's just state changes (dispatch, reducers), though there's event handlers too.
- The state changes trigger updates. You'd likely do this with a custom store.
- Key events
- Aria props
- Event handlers
- Request animation frame

... wow these notes were useless. Attempting an initial adaption was far more fruitful. The final implementation looks completely different from initial.

Simply understanding truly what was happening was what was necessary. There were many misunderstandings that once converted became simple vanilla JS (DOM) manipulations.
