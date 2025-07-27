import React, { memo, useMemo, useRef, useState, useCallback } from 'react';
import * as Ariakit from '@ariakit/react';
import { Ratio, Sparkles, Square, RectangleHorizontal, RectangleVertical } from 'lucide-react';
import { useRecoilState } from 'recoil';
import { useLocalize } from '~/hooks';
import DropdownPopup from '~/components/ui/DropdownPopup';
import type { MenuItemProps } from '~/common';
import store from '~/store';

function AspectRatio() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const localize = useLocalize();

  const [aspectRatio, setAspectRatio] = useRecoilState(store.aspectRatio);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Similar to MCPSelect's renderSelectedValues pattern
  const getDisplayValue = useCallback(
    (ratio: string) => {
      // Handle the Auto case and any potential localized versions
      if (ratio === 'Auto' || ratio === localize('com_assistants_aspect_ratio_auto')) {
        return localize('com_assistants_aspect_ratio_auto');
      }

      switch (ratio) {
        case '1:1':
          return `1:1 ${localize('com_assistants_aspect_ratio_square')}`;
        case '16:9':
          return `16:9 ${localize('com_assistants_aspect_ratio_standard')}`;
        case '9:16':
          return `9:16 ${localize('com_assistants_aspect_ratio_portrait')}`;
        default:
          return ratio;
      }
    },
    [localize],
  );

  const aspectRatioItems: MenuItemProps[] = useMemo(
    () => [
      {
        id: 'Auto',
        label: localize('com_assistants_aspect_ratio_auto'),
        icon: <Sparkles className="icon-sm" />,
        onClick: () => {
          setAspectRatio('Auto');
        },
        className: aspectRatio === 'Auto' ? 'bg-surface-tertiary' : '',
      },
      {
        id: '1:1',
        label: `1:1 ${localize('com_assistants_aspect_ratio_square')}`,
        icon: <Square className="icon-sm" />,
        onClick: () => {
          setAspectRatio('1:1');
        },
        className: aspectRatio === '1:1' ? 'bg-surface-tertiary' : '',
      },
      {
        id: '16:9',
        label: `16:9 ${localize('com_assistants_aspect_ratio_standard')}`,
        icon: <RectangleHorizontal className="icon-sm" />,
        onClick: () => {
          setAspectRatio('16:9');
        },
        className: aspectRatio === '16:9' ? 'bg-surface-tertiary' : '',
      },
      {
        id: '9:16',
        label: `9:16 ${localize('com_assistants_aspect_ratio_portrait')}`,
        icon: <RectangleVertical className="icon-sm" />,
        onClick: () => {
          setAspectRatio('9:16');
        },
        className: aspectRatio === '9:16' ? 'bg-surface-tertiary' : '',
      },
    ],
    [aspectRatio, localize, setAspectRatio],
  );

  const SelectedIcon = useMemo(() => {
    switch (aspectRatio) {
      case 'Auto':
        return Sparkles;
      case '1:1':
        return Square;
      case '16:9':
        return RectangleHorizontal;
      case '9:16':
        return RectangleVertical;
      default:
        return Ratio;
    }
  }, [aspectRatio]);

  return (
    <DropdownPopup
      trigger={
        <Ariakit.MenuButton
          ref={triggerRef}
          className="badge-icon group/ relative inline-flex min-w-fit items-center justify-center gap-1.5 rounded-full border border-border-medium bg-transparent px-2 py-2 text-sm font-medium shadow-sm transition-all hover:bg-surface-hover hover:shadow-md active:shadow-inner md:min-w-fit md:justify-start md:px-3"
          aria-label={localize('com_assistants_aspect_ratio')}
        >
          <SelectedIcon className="icon-md" />
          <span className="hidden md:block">
            <div className="flex items-center">{getDisplayValue(aspectRatio)}</div>
          </span>
        </Ariakit.MenuButton>
      }
      items={aspectRatioItems}
      isOpen={isDropdownOpen}
      setIsOpen={setIsDropdownOpen}
      menuId="aspect-ratio-menu"
      gutter={8}
      className="min-w-fit"
      portal={true}
      modal={true}
      unmountOnHide={true}
    />
  );
}

export default memo(AspectRatio);
