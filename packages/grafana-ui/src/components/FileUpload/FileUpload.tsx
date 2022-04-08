import React, { FC, FormEvent, useCallback, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { css, cx } from '@emotion/css';
import { Icon } from '../index';
import { useStyles2 } from '../../themes';
import { ComponentSize } from '../../types/size';
import { getButtonStyles } from '../Button';
import { getFocusStyles } from '../../themes/mixins';

import { trimFileName } from '../../utils/file';

export interface Props {
  /** Callback function to handle uploaded file  */
  onFileUpload: (event: FormEvent<HTMLInputElement>) => void;
  /** Accepted file extensions */
  accept?: string;
  /** Overwrite or add to style */
  className?: string;
  /** Button size */
  size?: ComponentSize;
}

export const FileUpload: FC<Props> = ({
  onFileUpload,
  className,
  children = 'Upload file',
  accept = '*',
  size = 'md',
}) => {
  const style = useStyles2(getStyles(size));
  const [fileName, setFileName] = useState('');

  const onChange = useCallback(
    (event: FormEvent<HTMLInputElement>) => {
      const file = event.currentTarget?.files?.[0];
      if (file) {
        setFileName(file.name ?? '');
      }
      onFileUpload(event);
    },
    [onFileUpload]
  );

  return (
    <>
      <input
        type="file"
        id="fileUpload"
        className={style.fileUpload}
        onChange={onChange}
        multiple={false}
        accept={accept}
        data-testid="fileUpload"
      />
      <label htmlFor="fileUpload" className={cx(style.labelWrapper, className)}>
        <Icon name="upload" className={style.icon} />
        {children}
      </label>

      {fileName && (
        <span aria-label="File name" className={style.fileName} data-testid="fileName">
          {trimFileName(fileName)}
        </span>
      )}
    </>
  );
};

const getStyles = (size: ComponentSize) => (theme: GrafanaTheme2) => {
  const buttonStyles = getButtonStyles({ theme, variant: 'primary', size, iconOnly: false });
  const focusStyle = getFocusStyles(theme);

  return {
    fileUpload: css({
      height: '0.1px',
      opacity: '0',
      overflow: 'hidden',
      position: 'absolute',
      width: '0.1px',
      zIndex: -1,
      '&:focus + label': focusStyle,
      '&:focus-visible + label': focusStyle,
    }),
    labelWrapper: buttonStyles.button,
    icon: buttonStyles.icon,
    fileName: css({
      marginLeft: theme.spacing(0.5),
    }),
  };
};
