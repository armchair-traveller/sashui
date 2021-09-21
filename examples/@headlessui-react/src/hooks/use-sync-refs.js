export function useSyncRefs(...refs) {
  return (value) => {
    for (let ref of refs) {
      if (ref == null) continue
      if (typeof ref == 'function') ref(value)
      // ? not sure what this is doing... might have to reconsider it
      // else
      //     ref.current = value;
    }
  }
}
