const {DEFAULT_MAX_VISIBLE, TOAST_MODES} = require('./constants');

let _seq = 0;

function nextToastId() {
  _seq += 1;
  return `toast_${Date.now()}_${_seq}`;
}

/**
 * Görünür kartlar + bekleyen kartlar.
 *
 * - stack: çağrının maxVisible kapasitesine kadar eş zamanlı görünür.
 * - queue: yeni kart mevcut görünür grubu geçici olarak bekletir ve tek başına
 *   görünür; art arda queue çağrıları daima tek tek geri açılır.
 */
function createToastQueue(initialDefaults = {}) {
  let defaults = {
    mode: TOAST_MODES.stack,
    maxVisible: DEFAULT_MAX_VISIBLE,
    ...initialDefaults,
  };

  /** @type {Array<object>} */
  let visible = [];
  /** @type {Array<object>} */
  let pending = [];

  function normalizeMode(mode) {
    return mode === TOAST_MODES.queue ? TOAST_MODES.queue : TOAST_MODES.stack;
  }

  function normalizeMax(maxVisible) {
    const n = Number(maxVisible);
    return Number.isFinite(n) && n > 0
      ? Math.floor(n)
      : DEFAULT_MAX_VISIBLE;
  }

  function withPolicy(item, opts = {}) {
    const mode = normalizeMode(opts.mode || item.mode || defaults.mode);
    const maxVisible =
      mode === TOAST_MODES.queue
        ? 1
        : normalizeMax(opts.maxVisible ?? item.maxVisible ?? defaults.maxVisible);
    return {...item, mode, maxVisible};
  }

  function visibleHasQueue() {
    return visible.some(item => item.mode === TOAST_MODES.queue);
  }

  function capacityFor(item) {
    if (item?.mode === TOAST_MODES.queue) {
      return 1;
    }
    return normalizeMax(item?.maxVisible ?? defaults.maxVisible);
  }

  function snapshot() {
    return {
      visible: visible.slice(),
      pending: pending.slice(),
      defaults: {...defaults},
    };
  }

  function removeFromList(list, id) {
    const idx = list.findIndex(item => item.id === id);
    if (idx === -1) {
      return {list, removed: null};
    }
    const removed = list[idx];
    return {list: [...list.slice(0, idx), ...list.slice(idx + 1)], removed};
  }

  function promotePending() {
    const promoted = [];

    while (pending.length > 0) {
      if (visibleHasQueue()) {
        break;
      }

      const next = pending[0];
      if (next.mode === TOAST_MODES.queue) {
        if (visible.length > 0) {
          break;
        }
        pending.shift();
        visible.push(next);
        promoted.push(next);
        break;
      }

      if (visible.length >= capacityFor(next)) {
        break;
      }

      pending.shift();
      visible.push(next);
      promoted.push(next);
    }

    return promoted;
  }

  return {
    setDefaults(partial = {}) {
      defaults = {
        ...defaults,
        ...partial,
        mode: normalizeMode(partial.mode ?? defaults.mode),
        maxVisible: normalizeMax(partial.maxVisible ?? defaults.maxVisible),
      };
      const promoted = promotePending();
      return {...snapshot(), promoted};
    },

    getDefaults() {
      return {...defaults};
    },

    /**
     * @param {object} item
     * @param {{mode?: string, maxVisible?: number}} [opts]
     */
    enqueue(item, opts = {}) {
      if (!item?.id) {
        throw new Error('ToastQueue.enqueue: item.id required');
      }

      const nextItem = withPolicy(item, opts);

      // Aynı id: replace
      const vIdx = visible.findIndex(x => x.id === item.id);
      if (vIdx !== -1) {
        const replacement = {...visible[vIdx], ...nextItem};
        const others = visible.filter((_, index) => index !== vIdx);
        if (replacement.mode === TOAST_MODES.queue) {
          pending = [...others, ...pending];
          visible = [replacement];
        } else {
          visible = [
            ...visible.slice(0, vIdx),
            replacement,
            ...visible.slice(vIdx + 1),
          ];
        }
        const promoted =
          replacement.mode === TOAST_MODES.stack ? promotePending() : [];
        return {...snapshot(), promoted, replaced: replacement};
      }
      const pIdx = pending.findIndex(x => x.id === item.id);
      if (pIdx !== -1) {
        const replacement = {...pending[pIdx], ...nextItem};
        pending = [
          ...pending.slice(0, pIdx),
          replacement,
          ...pending.slice(pIdx + 1),
        ];
        return {...snapshot(), promoted: [], replaced: replacement};
      }

      // Queue kartı önceliklidir; mevcut grup daha sonra kaldığı yerden devam eder.
      if (nextItem.mode === TOAST_MODES.queue) {
        if (visible.length > 0) {
          pending = [...visible, ...pending];
          visible = [];
        }
        visible.push(nextItem);
        return {...snapshot(), promoted: [nextItem]};
      }

      // Aktif queue varken stack kartı kuyruğun arkasında bekler.
      if (visibleHasQueue() || visible.length >= capacityFor(nextItem)) {
        pending.push(nextItem);
        return {...snapshot(), promoted: []};
      }

      visible.push(nextItem);
      return {...snapshot(), promoted: [nextItem]};
    },

    dismiss(id) {
      if (id == null) {
        if (visible.length === 0) {
          return {...snapshot(), removed: null, promoted: []};
        }
        id = visible[visible.length - 1].id;
      }

      let removed = null;
      const fromVisible = removeFromList(visible, id);
      visible = fromVisible.list;
      removed = fromVisible.removed;

      if (!removed) {
        const fromPending = removeFromList(pending, id);
        pending = fromPending.list;
        removed = fromPending.removed;
        return {...snapshot(), removed, promoted: []};
      }

      const promoted = promotePending();
      return {...snapshot(), removed, promoted};
    },

    clear() {
      const removed = [...visible, ...pending];
      visible = [];
      pending = [];
      return {...snapshot(), removed};
    },

    snapshot,
  };
}

module.exports = {
  createToastQueue,
  nextToastId,
};
