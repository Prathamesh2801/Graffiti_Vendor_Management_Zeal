let deferred = null;

export const setPrompt = (e) => {
  deferred = e;
};

export const getPrompt = () => deferred;