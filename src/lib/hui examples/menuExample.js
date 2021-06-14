// WAI-ARIA: https://www.w3.org/TR/wai-aria-practices-1.2/#menubutton
import React, {
  Fragment,
  createContext,
  createRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { match } from "../../utils/match";
import { forwardRefWithAs, render, Features } from "../../utils/render";
import { disposables } from "../../utils/disposables";
import { useDisposables } from "../../hooks/use-disposables";
import { useIsoMorphicEffect } from "../../hooks/use-iso-morphic-effect";
import { useSyncRefs } from "../../hooks/use-sync-refs";
import { useId } from "../../hooks/use-id";
import { Keys } from "../keyboard";
import {
  Focus,
  calculateActiveIndex,
} from "../../utils/calculate-active-index";
import { isDisabledReactIssue7711 } from "../../utils/bugs";
import {
  isFocusableElement,
  FocusableMode,
} from "../../utils/focus-management";
import { useWindowEvent } from "../../hooks/use-window-event";
import { useTreeWalker } from "../../hooks/use-tree-walker";
import {
  useOpenClosed,
  State,
  OpenClosedProvider,
} from "../../internal/open-closed";
var MenuStates;
(function (MenuStates) {
  MenuStates[(MenuStates["Open"] = 0)] = "Open";
  MenuStates[(MenuStates["Closed"] = 1)] = "Closed";
})(MenuStates || (MenuStates = {}));
var ActionTypes;
(function (ActionTypes) {
  ActionTypes[(ActionTypes["OpenMenu"] = 0)] = "OpenMenu";
  ActionTypes[(ActionTypes["CloseMenu"] = 1)] = "CloseMenu";
  ActionTypes[(ActionTypes["GoToItem"] = 2)] = "GoToItem";
  ActionTypes[(ActionTypes["Search"] = 3)] = "Search";
  ActionTypes[(ActionTypes["ClearSearch"] = 4)] = "ClearSearch";
  ActionTypes[(ActionTypes["RegisterItem"] = 5)] = "RegisterItem";
  ActionTypes[(ActionTypes["UnregisterItem"] = 6)] = "UnregisterItem";
})(ActionTypes || (ActionTypes = {}));
let reducers = {
  [ActionTypes.CloseMenu](state) {
    if (state.menuState === MenuStates.Closed) return state;
    return Object.assign(Object.assign({}, state), {
      activeItemIndex: null,
      menuState: MenuStates.Closed,
    });
  },
  [ActionTypes.OpenMenu](state) {
    if (state.menuState === MenuStates.Open) return state;
    return Object.assign(Object.assign({}, state), {
      menuState: MenuStates.Open,
    });
  },
  [ActionTypes.GoToItem]: (state, action) => {
    let activeItemIndex = calculateActiveIndex(action, {
      resolveItems: () => state.items,
      resolveActiveIndex: () => state.activeItemIndex,
      resolveId: (item) => item.id,
      resolveDisabled: (item) => item.dataRef.current.disabled,
    });
    if (state.searchQuery === "" && state.activeItemIndex === activeItemIndex)
      return state;
    return Object.assign(Object.assign({}, state), {
      searchQuery: "",
      activeItemIndex,
    });
  },
  [ActionTypes.Search]: (state, action) => {
    let searchQuery = state.searchQuery + action.value.toLowerCase();
    let match = state.items.findIndex((item) => {
      var _a;
      return (
        ((_a = item.dataRef.current.textValue) === null || _a === void 0
          ? void 0
          : _a.startsWith(searchQuery)) && !item.dataRef.current.disabled
      );
    });
    if (match === -1 || match === state.activeItemIndex)
      return Object.assign(Object.assign({}, state), { searchQuery });
    return Object.assign(Object.assign({}, state), {
      searchQuery,
      activeItemIndex: match,
    });
  },
  [ActionTypes.ClearSearch](state) {
    if (state.searchQuery === "") return state;
    return Object.assign(Object.assign({}, state), { searchQuery: "" });
  },
  [ActionTypes.RegisterItem]: (state, action) =>
    Object.assign(Object.assign({}, state), {
      items: [...state.items, { id: action.id, dataRef: action.dataRef }],
    }),
  [ActionTypes.UnregisterItem]: (state, action) => {
    let nextItems = state.items.slice();
    let currentActiveItem =
      state.activeItemIndex !== null ? nextItems[state.activeItemIndex] : null;
    let idx = nextItems.findIndex((a) => a.id === action.id);
    if (idx !== -1) nextItems.splice(idx, 1);
    return Object.assign(Object.assign({}, state), {
      items: nextItems,
      activeItemIndex: (() => {
        if (idx === state.activeItemIndex) return null;
        if (currentActiveItem === null) return null;
        // If we removed the item before the actual active index, then it would be out of sync. To
        // fix this, we will find the correct (new) index position.
        return nextItems.indexOf(currentActiveItem);
      })(),
    });
  },
};
let MenuContext = createContext(null);
MenuContext.displayName = "MenuContext";
function useMenuContext(component) {
  let context = useContext(MenuContext);
  if (context === null) {
    let err = new Error(
      `<${component} /> is missing a parent <${Menu.name} /> component.`
    );
    if (Error.captureStackTrace) Error.captureStackTrace(err, useMenuContext);
    throw err;
  }
  return context;
}
function stateReducer(state, action) {
  return match(action.type, reducers, state, action);
}
// ---
let DEFAULT_MENU_TAG = Fragment;
export function Menu(props) {
  let reducerBag = useReducer(stateReducer, {
    menuState: MenuStates.Closed,
    buttonRef: createRef(),
    itemsRef: createRef(),
    items: [],
    searchQuery: "",
    activeItemIndex: null,
  });
  let [{ menuState, itemsRef, buttonRef }, dispatch] = reducerBag;
  // Handle outside click
  useWindowEvent("mousedown", (event) => {
    var _a, _b, _c;
    let target = event.target;
    if (menuState !== MenuStates.Open) return;
    if (
      (_a = buttonRef.current) === null || _a === void 0
        ? void 0
        : _a.contains(target)
    )
      return;
    if (
      (_b = itemsRef.current) === null || _b === void 0
        ? void 0
        : _b.contains(target)
    )
      return;
    dispatch({ type: ActionTypes.CloseMenu });
    if (!isFocusableElement(target, FocusableMode.Loose)) {
      event.preventDefault();
      (_c = buttonRef.current) === null || _c === void 0 ? void 0 : _c.focus();
    }
  });
  let slot = useMemo(
    () => ({ open: menuState === MenuStates.Open }),
    [menuState]
  );
  return React.createElement(
    MenuContext.Provider,
    { value: reducerBag },
    React.createElement(
      OpenClosedProvider,
      {
        value: match(menuState, {
          [MenuStates.Open]: State.Open,
          [MenuStates.Closed]: State.Closed,
        }),
      },
      render({ props, slot, defaultTag: DEFAULT_MENU_TAG, name: "Menu" })
    )
  );
}
// ---
let DEFAULT_BUTTON_TAG = "button";
let Button = forwardRefWithAs(function Button(props, ref) {
  var _a;
  let [state, dispatch] = useMenuContext([Menu.name, Button.name].join("."));
  let buttonRef = useSyncRefs(state.buttonRef, ref);
  let id = `headlessui-menu-button-${useId()}`;
  let d = useDisposables();
  let handleKeyDown = useCallback(
    (event) => {
      switch (event.key) {
        // Ref: https://www.w3.org/TR/wai-aria-practices-1.2/#keyboard-interaction-13
        case Keys.Space:
        case Keys.Enter:
        case Keys.ArrowDown:
          event.preventDefault();
          event.stopPropagation();
          dispatch({ type: ActionTypes.OpenMenu });
          // .nextFrame is triggering two requestAnimationFrames, which is just await tick() in Svelte
          d.nextFrame(() =>
            dispatch({ type: ActionTypes.GoToItem, focus: Focus.First })
          );
          break;
        case Keys.ArrowUp:
          event.preventDefault();
          event.stopPropagation();
          dispatch({ type: ActionTypes.OpenMenu });
          d.nextFrame(() =>
            dispatch({ type: ActionTypes.GoToItem, focus: Focus.Last })
          );
          break;
      }
    },
    [dispatch, d]
  );
  let handleKeyUp = useCallback((event) => {
    switch (event.key) {
      case Keys.Space:
        // Required for firefox, event.preventDefault() in handleKeyDown for
        // the Space key doesn't cancel the handleKeyUp, which in turn
        // triggers a *click*.
        event.preventDefault();
        break;
    }
  }, []);
  let handleClick = useCallback(
    (event) => {
      if (isDisabledReactIssue7711(event.currentTarget))
        return event.preventDefault();
      if (props.disabled) return;
      if (state.menuState === MenuStates.Open) {
        dispatch({ type: ActionTypes.CloseMenu });
        d.nextFrame(() => {
          var _a;
          return (_a = state.buttonRef.current) === null || _a === void 0
            ? void 0
            : _a.focus({ preventScroll: true });
        });
      } else {
        event.preventDefault();
        event.stopPropagation();
        dispatch({ type: ActionTypes.OpenMenu });
      }
    },
    [dispatch, d, state, props.disabled]
  );
  let slot = useMemo(
    () => ({ open: state.menuState === MenuStates.Open }),
    [state]
  );
  let passthroughProps = props;
  let propsWeControl = {
    ref: buttonRef,
    id,
    type: "button",
    "aria-haspopup": true,
    "aria-controls":
      (_a = state.itemsRef.current) === null || _a === void 0 ? void 0 : _a.id,
    "aria-expanded": state.menuState === MenuStates.Open ? true : undefined,
    onKeyDown: handleKeyDown,
    onKeyUp: handleKeyUp,
    onClick: handleClick,
  };
  return render({
    props: Object.assign(Object.assign({}, passthroughProps), propsWeControl),
    slot,
    defaultTag: DEFAULT_BUTTON_TAG,
    name: "Menu.Button",
  });
});
// ---
let DEFAULT_ITEMS_TAG = "div";
let ItemsRenderFeatures = Features.RenderStrategy | Features.Static;
let Items = forwardRefWithAs(function Items(props, ref) {
  var _a, _b;
  let [state, dispatch] = useMenuContext([Menu.name, Items.name].join("."));
  let itemsRef = useSyncRefs(state.itemsRef, ref);
  let id = `headlessui-menu-items-${useId()}`;
  let searchDisposables = useDisposables();
  let usesOpenClosedState = useOpenClosed();
  let visible = (() => {
    if (usesOpenClosedState !== null) {
      return usesOpenClosedState === State.Open;
    }
    return state.menuState === MenuStates.Open;
  })();
  useEffect(() => {
    let container = state.itemsRef.current;
    if (!container) return;
    if (state.menuState !== MenuStates.Open) return;
    if (container === document.activeElement) return;
    container.focus({ preventScroll: true });
  }, [state.menuState, state.itemsRef]);
  useTreeWalker({
    container: state.itemsRef.current,
    enabled: state.menuState === MenuStates.Open,
    accept(node) {
      if (node.getAttribute("role") === "menuitem")
        return NodeFilter.FILTER_REJECT;
      if (node.hasAttribute("role")) return NodeFilter.FILTER_SKIP;
      return NodeFilter.FILTER_ACCEPT;
    },
    walk(node) {
      node.setAttribute("role", "none");
    },
  });
  let handleKeyDown = useCallback(
    (event) => {
      var _a;
      searchDisposables.dispose();
      switch (event.key) {
        // Ref: https://www.w3.org/TR/wai-aria-practices-1.2/#keyboard-interaction-12
        // @ts-expect-error Fallthrough is expected here
        case Keys.Space:
          if (state.searchQuery !== "") {
            event.preventDefault();
            event.stopPropagation();
            return dispatch({ type: ActionTypes.Search, value: event.key });
          }
        // When in type ahead mode, fallthrough
        case Keys.Enter:
          event.preventDefault();
          event.stopPropagation();
          dispatch({ type: ActionTypes.CloseMenu });
          if (state.activeItemIndex !== null) {
            let { id } = state.items[state.activeItemIndex];
            (_a = document.getElementById(id)) === null || _a === void 0
              ? void 0
              : _a.click();
          }
          disposables().nextFrame(() => {
            var _a;
            return (_a = state.buttonRef.current) === null || _a === void 0
              ? void 0
              : _a.focus({ preventScroll: true });
          });
          break;
        case Keys.ArrowDown:
          event.preventDefault();
          event.stopPropagation();
          // whenever you dispatch an action, it's pretty much just a custom store method
          return dispatch({ type: ActionTypes.GoToItem, focus: Focus.Next });
        case Keys.ArrowUp:
          event.preventDefault();
          event.stopPropagation();
          return dispatch({
            type: ActionTypes.GoToItem,
            focus: Focus.Previous,
          });
        case Keys.Home:
        case Keys.PageUp:
          event.preventDefault();
          event.stopPropagation();
          return dispatch({ type: ActionTypes.GoToItem, focus: Focus.First });
        case Keys.End:
        case Keys.PageDown:
          event.preventDefault();
          event.stopPropagation();
          return dispatch({ type: ActionTypes.GoToItem, focus: Focus.Last });
        case Keys.Escape:
          event.preventDefault();
          event.stopPropagation();
          dispatch({ type: ActionTypes.CloseMenu });
          disposables().nextFrame(() => {
            var _a;
            return (_a = state.buttonRef.current) === null || _a === void 0
              ? void 0
              : _a.focus({ preventScroll: true });
          });
          break;
        case Keys.Tab:
          event.preventDefault();
          event.stopPropagation();
          break;
        default:
          // whenever a keypress happens that isn't ARIA nav related, trigger search
          if (event.key.length === 1) {
            dispatch({ type: ActionTypes.Search, value: event.key });
            // reset the search if 350 milliseconds have elapsed
            searchDisposables.setTimeout(
              () => dispatch({ type: ActionTypes.ClearSearch }),
              350
            );
          }
          break;
      }
    },
    [dispatch, searchDisposables, state]
  );
  let handleKeyUp = useCallback((event) => {
    switch (event.key) {
      case Keys.Space:
        // Required for firefox, event.preventDefault() in handleKeyDown for
        // the Space key doesn't cancel the handleKeyUp, which in turn
        // triggers a *click*.
        event.preventDefault();
        break;
    }
  }, []);
  let slot = useMemo(
    () => ({ open: state.menuState === MenuStates.Open }),
    [state]
  );
  let propsWeControl = {
    "aria-activedescendant":
      state.activeItemIndex === null
        ? undefined
        : (_a = state.items[state.activeItemIndex]) === null || _a === void 0
        ? void 0
        : _a.id,
    "aria-labelledby":
      (_b = state.buttonRef.current) === null || _b === void 0 ? void 0 : _b.id,
    id,
    onKeyDown: handleKeyDown,
    onKeyUp: handleKeyUp,
    role: "menu",
    tabIndex: 0,
    ref: itemsRef,
  };
  let passthroughProps = props;
  return render({
    props: Object.assign(Object.assign({}, passthroughProps), propsWeControl),
    slot,
    defaultTag: DEFAULT_ITEMS_TAG,
    features: ItemsRenderFeatures,
    visible,
    name: "Menu.Items",
  });
});
// ---
let DEFAULT_ITEM_TAG = Fragment;
function Item(props) {
  let { disabled = false, onClick } = props,
    passthroughProps = __rest(props, ["disabled", "onClick"]);
  let [state, dispatch] = useMenuContext([Menu.name, Item.name].join("."));
  let id = `headlessui-menu-item-${useId()}`;
  let active =
    state.activeItemIndex !== null
      ? state.items[state.activeItemIndex].id === id
      : false;
  useIsoMorphicEffect(() => {
    if (state.menuState !== MenuStates.Open) return;
    if (!active) return;
    let d = disposables();
    d.nextFrame(() => {
      var _a, _b;
      return (_b =
        (_a = document.getElementById(id)) === null || _a === void 0
          ? void 0
          : _a.scrollIntoView) === null || _b === void 0
        ? void 0
        : _b.call(_a, { block: "nearest" });
    });
    return d.dispose;
  }, [id, active, state.menuState]);
  let bag = useRef({ disabled });
  useIsoMorphicEffect(() => {
    bag.current.disabled = disabled;
  }, [bag, disabled]);
  useIsoMorphicEffect(() => {
    var _a, _b;
    bag.current.textValue =
      (_b =
        (_a = document.getElementById(id)) === null || _a === void 0
          ? void 0
          : _a.textContent) === null || _b === void 0
        ? void 0
        : _b.toLowerCase();
  }, [bag, id]);
  useIsoMorphicEffect(() => {
    dispatch({ type: ActionTypes.RegisterItem, id, dataRef: bag });
    return () => dispatch({ type: ActionTypes.UnregisterItem, id });
  }, [bag, id]);
  let handleClick = useCallback(
    (event) => {
      if (disabled) return event.preventDefault();
      dispatch({ type: ActionTypes.CloseMenu });
      disposables().nextFrame(() => {
        var _a;
        return (_a = state.buttonRef.current) === null || _a === void 0
          ? void 0
          : _a.focus({ preventScroll: true });
      });
      if (onClick) return onClick(event);
    },
    [dispatch, state.buttonRef, disabled, onClick]
  );
  let handleFocus = useCallback(() => {
    if (disabled)
      return dispatch({ type: ActionTypes.GoToItem, focus: Focus.Nothing });
    dispatch({ type: ActionTypes.GoToItem, focus: Focus.Specific, id });
  }, [disabled, id, dispatch]);
  let handleMove = useCallback(() => {
    if (disabled) return;
    if (active) return;
    dispatch({ type: ActionTypes.GoToItem, focus: Focus.Specific, id });
  }, [disabled, active, id, dispatch]);
  let handleLeave = useCallback(() => {
    if (disabled) return;
    if (!active) return;
    dispatch({ type: ActionTypes.GoToItem, focus: Focus.Nothing });
  }, [disabled, active, dispatch]);
  let slot = useMemo(() => ({ active, disabled }), [active, disabled]);
  let propsWeControl = {
    id,
    role: "menuitem",
    tabIndex: -1,
    "aria-disabled": disabled === true ? true : undefined,
    onClick: handleClick,
    onFocus: handleFocus,
    onPointerMove: handleMove,
    onMouseMove: handleMove,
    onPointerLeave: handleLeave,
    onMouseLeave: handleLeave,
  };
  return render({
    props: Object.assign(Object.assign({}, passthroughProps), propsWeControl),
    slot,
    defaultTag: DEFAULT_ITEM_TAG,
    name: "Menu.Item",
  });
}
// ---
Menu.Button = Button;
Menu.Items = Items;
Menu.Item = Item;
