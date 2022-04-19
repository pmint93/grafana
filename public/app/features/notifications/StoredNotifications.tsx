import React, { useRef } from 'react';
import { useEffectOnce } from 'react-use';
import { formatDistanceToNow } from 'date-fns';
import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Icon, useStyles2 } from '@grafana/ui';
import { useDispatch, useSelector } from 'app/types';
import {
  clearAllNotifications,
  clearNotification,
  readAllNotifications,
  selectWarningsAndErrors,
  selectLastReadTimestamp,
} from 'app/core/reducers/appNotification';

export function StoredNotifications() {
  const dispatch = useDispatch();
  const notifications = useSelector((state) => selectWarningsAndErrors(state.appNotifications));
  const lastReadTimestamp = useRef(useSelector((state) => selectLastReadTimestamp(state.appNotifications)));
  const styles = useStyles2(getStyles);

  useEffectOnce(() => {
    dispatch(readAllNotifications(Date.now()));
  });

  const onClearNotification = (id: string) => {
    dispatch(clearNotification(id));
  };

  const clearAllNotifs = () => {
    dispatch(clearAllNotifications());
  };

  if (notifications.length === 0) {
    return (
      <div className={styles.noNotifsWrapper}>
        <Icon name="bell" size="xxl" />
        <span>Notifications you have received will appear here.</span>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <Button variant="destructive" onClick={clearAllNotifs} className={styles.clearAll}>
        Clear all notifications
      </Button>
      <ul className={styles.list}>
        {notifications.map((notif) => (
          <li
            key={notif.id}
            className={cx(styles.listItem, { [styles.newItem]: notif.timestamp > lastReadTimestamp.current })}
          >
            <Alert
              severity={notif.severity}
              title={notif.title}
              bottomSpacing={0}
              onRemove={() => onClearNotification(notif.id)}
              sideClass={styles.side}
              side={
                <span className={styles.smallText}>{formatDistanceToNow(notif.timestamp, { addSuffix: true })}</span>
              }
            >
              <div className={styles.list}>
                <span>{notif.text}</span>
                {notif.traceId && <span className={styles.smallText}>Trace ID: {notif.traceId}</span>}
              </div>
            </Alert>
          </li>
        ))}
      </ul>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    smallText: css({
      fontSize: theme.typography.pxToRem(10),
      color: theme.colors.text.secondary,
    }),
    side: css({
      display: 'flex',
      flexDirection: 'column',
      padding: '3px 6px',
      paddingTop: theme.spacing(1),
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      flexShrink: 0,
    }),
    list: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
    }),
    listItem: css({
      display: 'flex',
      listStyle: 'none',
      gap: theme.spacing(1),
      alignItems: 'center',
      position: 'relative',
    }),
    newItem: css({
      '&::before': {
        content: '""',
        height: '100%',
        position: 'absolute',
        left: '-7px',
        top: 0,
        background: theme.colors.gradients.brandVertical,
        width: theme.spacing(0.5),
        borderRadius: theme.shape.borderRadius(1),
      },
    }),
    noNotifsWrapper: css({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: theme.spacing(1),
    }),
    wrapper: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
    }),
    clearAll: css({
      alignSelf: 'flex-end',
    }),
  };
}
