// src/__mocks__/matchMedia.js
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = function() {
    return {
      matches: false,
      media: '',
      onchange: null,
      addListener: function() {}, // deprecated
      removeListener: function() {}, // deprecated
      addEventListener: function() {},
      removeEventListener: function() {},
      dispatchEvent: function() {},
    };
  };
}
