/**
 * Legacy Toast API — UI removed in v2.2.
 * Toast.show / Toast.hide redirect to ActionToast (card stack).
 */
import ActionToast from './ActionToast';
import {getActionToastHost} from './toast/ActionToastHost';
import {mapLegacyToastConfig} from './toast/mapLegacyToastConfig';

const Toast = {
  show(config = {}) {
    const mapped = mapLegacyToastConfig(config);
    const host = getActionToastHost();
    if (host && typeof host.present === 'function') {
      return host.present(mapped);
    }
    return ActionToast.show(mapped);
  },
  hide() {
    const host = getActionToastHost();
    if (host && typeof host.dismiss === 'function') {
      host.dismiss();
      return;
    }
    ActionToast.hide();
  },
};

export default Toast;
